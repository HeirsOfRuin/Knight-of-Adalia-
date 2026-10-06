import { ESTATE_FIELDS, clampEstate, type EstateField } from './estate';
import { addVassals } from './lordship';
// Effect application. Operates on a state that the caller has already cloned.
import type { ContentBundle, Effect } from '../content/schema';
import type { GameState, NpcState, SuitState } from './state';
import { pickHeirs, TEMPERAMENTS } from './heirs';
import { advanceSeasons, timeOf } from './calendar';
import { labelFor, deref } from './paths';
import { test } from './conditions';
import type { RngCursor } from './rng';
import { formatCoin, signed, capitalise } from './format';

/** How resource changes read in the journal. */
const RES_LABELS: Record<string, string> = { men: 'Men in your company', garrison: 'Men holding your manor', levy: 'Trained village levy' };

export interface EffectCtx {
  scene: string;
  choice: string;
  choiceText: string;
  changes: string[];
  /** needed for random casualties; absent in contexts that cannot draw */
  rng?: RngCursor;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const DRILL_CEILING = 4;
/** Where drill goes once the skill is past what drill can teach: the work hardens the body instead. */
export const TRAIN_OVERFLOW: Record<string, string> = { arms: 'endurance', archery: 'strength', riding: 'endurance', woodcraft: 'endurance' };
const OVERFLOW_MAX = 5;

function train(state: GameState, content: ContentBundle, spec: Record<string, number>, changes: string[]): void {
  const ceiling = spec.ceiling ?? DRILL_CEILING;
  for (const [skill, by] of Object.entries(spec)) {
    if (skill === 'ceiling' || skill === 'quiet') continue;
    const before = state.skills[skill] ?? 0;
    const room = Math.max(0, ceiling - before);
    if (room > 0) addNumber(state, content, `skill.${skill}`, Math.min(by, room), changes);
    if (by <= room || spec.quiet) continue;
    const label = labelFor(content, `skill.${skill}`);
    const attr = TRAIN_OVERFLOW[skill];
    const key = `overflow_${attr}`;
    if (attr && !state.counters[key] && (state.attributes[attr] ?? 1) < OVERFLOW_MAX) {
      state.counters[key] = 1;
      changes.push(`${label}: practice alone can take you no further. The work goes into your body instead.`);
      addNumber(state, content, `attr.${attr}`, 1, changes);
    } else {
      changes.push(`${label}: practice alone can take you no further. It will take a master, or a hard day, to teach you more.`);
    }
  }
}

export function newNpcState(content: ContentBundle, id: string): NpcState {
  const def = content.registry.npcs[id];
  return { met: false, alive: true, affection: def?.affection ?? 0, respect: def?.respect ?? 0, loyalty: 0, grudges: [] };
}

export function newSuitState(): SuitState {
  return { status: 'known', regard: 0, family: 0, discretion: 10, pledge: 'none' };
}

function npc(state: GameState, content: ContentBundle, id: string): NpcState {
  return (state.npcs[id] ??= newNpcState(content, id));
}

function suit(state: GameState, id: string): SuitState {
  return (state.suits[id] ??= newSuitState());
}

function addNumber(state: GameState, content: ContentBundle, rawPath: string, delta: number, changes: string[]): void {
  const path = deref(state, rawPath);
  const [ns, a, b] = path.split('.') as [string, string, string | undefined];
  const note = (label: string, d: number) => { if (d !== 0) changes.push(`${label} ${signed(d)}`); };
  switch (ns) {
    case 'attr': {
      const before = state.attributes[a] ?? 1;
      state.attributes[a] = clamp(before + delta, 1, 6);
      note(labelFor(content, path), state.attributes[a]! - before);
      return;
    }
    case 'skill': {
      const before = state.skills[a] ?? 0;
      state.skills[a] = clamp(before + delta, 0, 10);
      note(labelFor(content, path), state.skills[a]! - before);
      return;
    }
    case 'rep': {
      const personal = content.registry.factions[a]?.kind === 'personal';
      const before = state.rep[a] ?? 0;
      state.rep[a] = clamp(before + delta, personal ? 0 : -10, 10);
      note(`${labelFor(content, path)}${personal ? '' : ' standing'}`, state.rep[a]! - before);
      return;
    }
    case 'res': {
      const before = state.res[a] ?? 0;
      state.res[a] = Math.max(0, before + delta);
      const d = state.res[a]! - before;
      if (d !== 0) changes.push(a === 'coin' ? `Coin ${d > 0 ? '+' : '−'}${formatCoin(Math.abs(d))}` : `${RES_LABELS[a] ?? capitalise(a)} ${signed(d)}`);
      return;
    }
    case 'rel': {
      const f = b as 'affection' | 'respect' | 'loyalty';
      // loyalty is a follower's bond; content rewards "your men" in bulk, so men not in the following are skipped
      if (f === 'loyalty' && !state.npcs[a]?.follower) return;
      const n = npc(state, content, a);
      const before = n[f];
      n[f] = clamp(before + delta, -10, 10);
      // feelings change in people he has not met yet (word travels), but the journal only names people he knows
      if (n.met) note(labelFor(content, path), n[f] - before);
      return;
    }
    case 'favor': {
      state.favors[a] = (state.favors[a] ?? 0) + delta;
      const name = content.registry.npcs[a]?.name ?? a;
      changes.push(delta > 0 ? `${name} owes you` : `You owe ${name}`);
      return;
    }
    case 'suit': {
      const s = suit(state, a);
      const f = b as 'regard' | 'family' | 'discretion';
      const before = s[f];
      s[f] = clamp(before + delta, f === 'discretion' ? 0 : -10, 10);
      return;
    }
    case 'counter':
      state.counters[a] = (state.counters[a] ?? 0) + delta;
      return;
    case 'estate': {
      if (!state.estate) state.estate = {};
      const f = a as EstateField;
      const before = state.estate[f] ?? 0;
      state.estate[f] = clampEstate(f, before + delta);
      note(labelFor(content, path), state.estate[f]! - before);
      return;
    }
    case 'heir': {
      for (const h of pickHeirs(state, a)) {
        if (b !== 'bond') throw new Error(`add: only heir.<which>.bond can change, not ${path}`);
        h.bond = clamp((h.bond ?? 0) + delta, -5, 5);
      }
      return;
    }
    case 'holding': {
      const h = state.holdings?.[a];
      if (!h) return; // nothing to change on a holding he does not hold
      if (b === 'income') h.income = Math.max(0, h.income + delta);
      else h.temper = clamp(h.temper + delta, -5, 5);
      note(labelFor(content, path), delta);
      return;
    }
    case 'health': {
      const before = state.health;
      state.health = clamp(before + delta, 1, 10); // death only through `die`
      note('Health', state.health - before);
      return;
    }
    default:
      throw new Error(`add: unsupported path ${path}`);
  }
}

function assignValue(state: GameState, content: ContentBundle, rawPath: string, value: string | number | boolean): void {
  const path = deref(state, rawPath);
  const [ns, a, b] = path.split('.') as [string, string, string | undefined];
  switch (ns) {
    case 'chapter': state.chapter = String(value); return;
    case 'track': state.track = String(value); return;
    case 'counter': state.counters[a] = Number(value); return;
    case 'res': state.res[a] = Number(value); return; // e.g. keep a score of men: assign res.men 20
    case 'flag': if (value) state.flags[a] = true; else delete state.flags[a]; return;
    case 'suit': {
      const s = suit(state, a);
      (s as unknown as Record<string, unknown>)[b!] = value;
      return;
    }
    case 'rel': {
      const n = npc(state, content, a);
      (n as unknown as Record<string, unknown>)[b!] = Number(value);
      return;
    }
    default:
      throw new Error(`assign: unsupported path ${path}`);
  }
}

/** Applies effects in order. Returns true if the character died. */
export function applyEffects(state: GameState, content: ContentBundle, effects: Effect[], ctx: EffectCtx): boolean {
  const reg = content.registry;
  for (const e of effects) {
    if ('if' in e) {
      const branch = test(e.if, state, content) ? e.then : (e.else ?? []);
      if (applyEffects(state, content, branch, ctx)) return true;
      continue;
    }
    if ('chance' in e) {
      // without a cursor (never expected in play) the unlucky branch is not taken
      const hit = ctx.rng ? ctx.rng.float() * 100 < e.chance : false;
      if (applyEffects(state, content, hit ? e.then : (e.else ?? []), ctx)) return true;
      continue;
    }
    if ('set' in e) state.flags[e.set.replace(/^flag\./, '')] = true;
    else if ('clear' in e) delete state.flags[e.clear.replace(/^flag\./, '')];
    else if ('add' in e) for (const [p, d] of Object.entries(e.add)) addNumber(state, content, p, d, ctx.changes);
    else if ('assign' in e) for (const [p, v] of Object.entries(e.assign)) assignValue(state, content, p, v);
    else if ('trait' in e) {
      const id = e.trait.slice(1);
      const has = state.traits.includes(id);
      if (e.trait[0] === '+' && !has) {
        state.traits.push(id);
        ctx.changes.push(`Gained: ${reg.traits[id]?.label ?? id}`);
      } else if (e.trait[0] === '-' && has) {
        state.traits = state.traits.filter((t) => t !== id);
        ctx.changes.push(`Lost: ${reg.traits[id]?.label ?? id}`);
      }
    } else if ('item' in e) {
      const id = e.item.slice(1);
      const has = state.items.includes(id);
      if (e.item[0] === '+' && !has) {
        state.items.push(id);
        ctx.changes.push(`Gained: ${reg.items[id]?.label ?? id}`);
      } else if (e.item[0] === '-' && has) {
        state.items = state.items.filter((t) => t !== id);
        ctx.changes.push(`Lost: ${reg.items[id]?.label ?? id}`);
      }
    } else if ('injury' in e) {
      const def = reg.injuries[e.injury];
      if (!state.injuries.some((i) => i.id === e.injury)) {
        state.injuries.push({ id: e.injury, since: state.time });
        ctx.changes.push(`Injury: ${def?.label ?? e.injury}`);
        if (def && def.heals_after === undefined && def.scar && !state.traits.includes(def.scar)) {
          state.traits.push(def.scar);
          ctx.changes.push(`Gained: ${reg.traits[def.scar]?.label ?? def.scar}`);
        }
      }
    } else if ('heal' in e) {
      if (state.injuries.some((i) => i.id === e.heal)) {
        state.injuries = state.injuries.filter((i) => i.id !== e.heal);
        ctx.changes.push(`${reg.injuries[e.heal]?.label ?? e.heal} has healed`);
      }
    } else if ('station' in e) {
      if (state.station !== e.station) ctx.changes.push(`Station: ${capitalise(e.station)}`);
      state.station = e.station;
      if (e.track) state.track = e.track;
    } else if ('meet' in e) {
      npc(state, content, deref(state, e.meet)).met = true;
    } else if ('casualties' in e) {
      const lost = Math.min(e.casualties.men, state.res.men ?? 0);
      if (lost > 0) {
        state.res.men = (state.res.men ?? 0) - lost;
        ctx.changes.push(`${lost} of your men ${lost === 1 ? 'is' : 'are'} dead`);
      }
      for (let k = 0; k < e.casualties.named; k++) {
        const pool = Object.entries(state.npcs)
          .filter(([id, n]) => n.follower && n.alive && !e.casualties.spare.includes(id))
          .map(([id]) => id)
          .sort();
        if (!pool.length || !ctx.rng) break;
        const id = pool[ctx.rng.int(pool.length)]!;
        state.npcs[id]!.alive = false;
        state.npcs[id]!.diedAt = state.time;
        state.npcs[id]!.follower = false;
        ctx.changes.push(`${reg.npcs[id]?.name ?? id} is dead`);
      }
    } else if ('join' in e || 'leave' in e) {
      const id = deref(state, 'join' in e ? e.join : e.leave);
      const n = npc(state, content, id);
      const joining = 'join' in e;
      if (!!n.follower !== joining) ctx.changes.push(`${reg.npcs[id]?.name ?? id} ${joining ? 'joins your following' : 'leaves your following'}`);
      n.follower = joining;
      if (joining) n.met = true;
    } else if ('alias' in e) {
      for (const [k, v] of Object.entries(e.alias)) {
        state.aliases[k] = v;
        npc(state, content, v).met = true;
      }
    } else if ('kill' in e) {
      const id = deref(state, e.kill);
      const n = npc(state, content, id);
      if (n.alive) { ctx.changes.push(`${reg.npcs[id]?.name ?? id} is dead`); n.diedAt = state.time; }
      n.alive = false;
    } else if ('queue' in e) {
      state.queue.push({
        event: e.queue.event,
        dueAt: state.time + e.queue.delay.seasons,
        earliestChapter: e.queue.earliest_chapter,
        origin: { scene: ctx.scene, choice: ctx.choice, at: state.time, text: ctx.choiceText },
      });
    } else if ('lose_share' in e) {
      for (const [raw, pct] of Object.entries(e.lose_share)) {
        const [, f] = raw.split('.') as [string, EstateField];
        if (!state.estate) continue;
        const before = state.estate[f] ?? 0;
        state.estate[f] = clampEstate(f, before - Math.round((before * pct) / 100));
        const d = state.estate[f]! - before;
        if (d) ctx.changes.push(`${labelFor(content, raw)} ${d}`);
      }
    } else if ('birth' in e) {
      const sex = e.birth === 'random' ? (ctx.rng && ctx.rng.float() < 0.5 ? 'daughter' : 'son') : e.birth;
      const temperament = ctx.rng ? TEMPERAMENTS[ctx.rng.int(TEMPERAMENTS.length)] : 'merry';
      (state.heirs ??= []).push({ name: '', sex, born: state.time, alive: true, temperament, bond: 0 });
      ctx.changes.push(sex === 'son' ? 'A son' : 'A daughter');
    } else if ('name_heir' in e) {
      const h = state.heirs?.find((x) => !x.name);
      if (h) h.name = e.name_heir === '@self' ? state.name : e.name_heir;
    } else if ('heir_dies' in e) {
      const h = pickHeirs(state, e.heir_dies)[0];
      if (h) { h.alive = false; h.died = state.time; ctx.changes.push(`${h.name || 'The child'} dies`); }
    } else if ('heir_set' in e) {
      for (const h of pickHeirs(state, e.heir_set.which)) {
        const t = e.heir_set.temperament;
        if (t === 'random') { if (!h.temperament) h.temperament = ctx.rng ? TEMPERAMENTS[ctx.rng.int(TEMPERAMENTS.length)] : 'merry'; }
        else if (t) h.temperament = t;
        if (e.heir_set.upbringing) h.upbringing = e.heir_set.upbringing;
        h.bond ??= 0;
      }
    } else if ('hold' in e) {
      (state.holdings ??= {})[e.hold.id] = { income: e.hold.income, temper: clamp(e.hold.temper, -5, 5) };
      ctx.changes.push(`You hold ${reg.holdings[e.hold.id]?.label ?? e.hold.id}`);
    } else if ('vassals' in e) {
      addVassals(state, content, e.vassals.add, e.vassals.region, ctx.changes);
    } else if ('release' in e) {
      if (state.holdings?.[e.release]) {
        delete state.holdings[e.release];
        ctx.changes.push(`Lost: ${reg.holdings[e.release]?.label ?? e.release}`);
      }
    } else if ('train' in e) {
      train(state, content, e.train, ctx.changes);
    } else if ('found_estate' in e) {
      state.estate = {};
      for (const f of ESTATE_FIELDS) state.estate[f] = clampEstate(f, e.found_estate[f] ?? 0);
      state.estate.founded = state.estate.people ?? 0; // what the manor held when he came, for estate.recovery
    } else if ('advance' in e) {
      advanceSeasons(state, content, e.advance.seasons, ctx.changes);
    } else if ('catch_up' in e) {
      advanceSeasons(state, content, timeOf(content, e.catch_up.year, e.catch_up.season) - state.time, ctx.changes);
    } else if ('journal' in e) {
      ctx.changes.push(e.journal);
    } else if ('die' in e) {
      state.ended = { ending: 'death', cause: e.die };
      return true;
    }
  }
  return false;
}
