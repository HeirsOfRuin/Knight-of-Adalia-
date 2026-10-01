// Effect application. Operates on a state that the caller has already cloned.
import type { ContentBundle, Effect } from '../content/schema';
import type { GameState, NpcState, SuitState } from './state';
import { advanceSeasons } from './calendar';
import { labelFor, deref } from './paths';
import { test } from './conditions';
import { formatCoin, signed, capitalise } from './format';

export interface EffectCtx {
  scene: string;
  choice: string;
  choiceText: string;
  changes: string[];
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

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
      if (d !== 0) changes.push(a === 'coin' ? `Coin ${d > 0 ? '+' : '−'}${formatCoin(Math.abs(d))}` : `${capitalise(a)} ${signed(d)}`);
      return;
    }
    case 'rel': {
      const n = npc(state, content, a);
      const f = b as 'affection' | 'respect' | 'loyalty';
      const before = n[f];
      n[f] = clamp(before + delta, -10, 10);
      note(labelFor(content, path), n[f] - before);
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
      if (n.alive) ctx.changes.push(`${reg.npcs[id]?.name ?? id} is dead`);
      n.alive = false;
    } else if ('queue' in e) {
      state.queue.push({
        event: e.queue.event,
        dueAt: state.time + e.queue.delay.seasons,
        earliestChapter: e.queue.earliest_chapter,
        origin: { scene: ctx.scene, choice: ctx.choice, at: state.time, text: ctx.choiceText },
      });
    } else if ('advance' in e) {
      advanceSeasons(state, content, e.advance.seasons, ctx.changes);
    } else if ('journal' in e) {
      ctx.changes.push(e.journal);
    } else if ('die' in e) {
      state.ended = { ending: 'death', cause: e.die };
      return true;
    }
  }
  return false;
}
