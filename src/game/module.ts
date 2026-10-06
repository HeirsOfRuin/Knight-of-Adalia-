// Knight of Adalia's game module: the rules that belong to this game, not the engine.
// The background and its prejudice, the women he courts, the manor and its upkeep, his
// children, his other holdings, drill, the wives' voices, and where his home is.
// Registered on import; every entry point that loads content imports it (tools/content-loader.ts, src/main.tsx).
import { registerGame, STAKES_RANK as RANK, type GameModule } from '@engine/game';
import type { CoreContent } from '@engine/schema';
import type { CoreState } from '@engine/state';
import { addNumber, clamp } from '@engine/effects';
import { labelFor, npcLabel, numberWord } from '@engine/paths';
import { renderText } from '@engine/text';
import { formatCoin, signed } from '@engine/format';
import { WIFE_MOMENTS, GAME_ID, type ContentBundle, type Effect } from '../content/schema';
import type { GameState, SuitState } from './state';
import { ESTATE_FIELDS, ESTATE_LABELS, clampEstate, estateRecovery, estateTick, payDue, type EstateField } from './estate';
import { pickHeirs, TEMPERAMENTS } from './heirs';
import { audienceModifier, computePrejudice } from './station';

const st = (s: CoreState) => s as GameState;
const ct = (c: CoreContent) => c as ContentBundle;

const SUIT_FIELDS = ['status', 'regard', 'family', 'discretion', 'pledge'];
const SINGLE = ['background', 'role', 'prejudice'];

export function newSuitState(): SuitState {
  return { status: 'known', regard: 0, family: 0, discretion: 10, pledge: 'none' };
}

function suit(state: GameState, id: string): SuitState {
  return (state.suits[id] ??= newSuitState());
}

// ---- drill ----------------------------------------------------------------------------
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

// ---- places and cards -----------------------------------------------------------------
const HOME: Record<string, string> = { reeve: 'ashby', burgess: 'wendham', archer: 'hollin', servant: 'ravell_hall' };

function grantName(state: GameState, none: string): string {
  return state.flags.c2_granted_marsalin ? 'Marsalin' : state.flags.c2_granted_kerval ? 'Kerval' : state.flags.c2_granted_ormel ? 'Ormel' : none;
}

const SEX_WORD = { son: 'a son', daughter: 'a daughter' } as const;

type Op<K extends string> = Extract<Effect, Record<K, unknown>>;

export const knight: GameModule = {
  id: GAME_ID,
  namespaces: ['estate', 'suit', 'heirs', 'heir', 'holding', 'holdings', 'background', 'role', 'prejudice'],

  getValue(s, c, path) {
    const state = st(s);
    const content = ct(c);
    const [ns, a, b] = path.split('.');
    switch (ns) {
      case 'estate': return a === 'recovery' ? estateRecovery(state) : state.estate?.[a!] ?? 0;
      case 'suit': {
        const x = state.suits[a!];
        if (!x) return b === 'status' ? 'hidden' : b === 'pledge' ? 'none' : 0;
        return x[b as keyof typeof x];
      }
      case 'heirs': {
        const all = state.heirs ?? [];
        const living = all.filter((h) => h.alive);
        const last = all.at(-1);
        switch (a) {
          case 'count': return living.length;
          case 'born': return all.length;
          case 'sons': return living.filter((h) => h.sex === 'son').length;
          case 'daughters': return living.filter((h) => h.sex === 'daughter').length;
          case 'last': return last?.sex ?? 'none';
          case 'lastname': return last?.name || 'the baby';
          case 'eldest': return living[0]?.name || 'none';
          case 'dead': return all.length - living.length;
          case 'lastdead': return all.filter((h) => !h.alive).at(-1)?.name || 'the child';
          case 'eldest_id': return (living[0]?.name || 'none').toLowerCase(); // for conditions: heirs.eldest_id == piers
          case 'names': {
            const n = living.map((h) => h.name).filter(Boolean);
            return n.length <= 1 ? (n[0] ?? '') : `${n.slice(0, -1).join(', ')} and ${n.at(-1)}`;
          }
        }
        return undefined;
      }
      case 'heir': {
        const h = pickHeirs(state, a!)[0];
        if (b === 'alive') return !!h;
        if (!h) return b === 'age' || b === 'bond' ? 0 : 'none';
        switch (b) {
          case 'name': return h.name || 'the baby';
          case 'sex': return h.sex;
          case 'age': return Math.floor((state.time - h.born) / 4);
          case 'ageword': return numberWord(Math.floor((state.time - h.born) / 4));
          case 'temperament': return h.temperament ?? 'none';
          case 'upbringing': return h.upbringing ?? 'none';
          case 'bond': return h.bond ?? 0;
        }
        return undefined;
      }
      case 'holding': {
        const h = state.holdings?.[a!];
        if (b === 'held') return !!h;
        return h ? h[b as 'income' | 'temper'] : 0;
      }
      case 'holdings': {
        const all = Object.values(state.holdings ?? {});
        if (a === 'count') return all.length;
        if (a === 'income') return all.reduce((sum, h) => sum + h.income, 0);
        return undefined;
      }
      case 'background': return state.background;
      case 'role': return state.role ?? 'none';
      case 'prejudice': return computePrejudice(state, content, 'nobles');
    }
    return undefined;
  },

  checkPath(c, path) {
    const content = ct(c);
    const reg = content.registry;
    const [ns, a, b] = path.split('.');
    const need = (ok: boolean, what: string) => (ok ? null : `unknown ${what} in "${path}"`);
    if (SINGLE.includes(ns!)) return a === undefined ? null : `"${ns}" takes no sub-path ("${path}")`;
    if (a === undefined) return `incomplete path "${path}"`;
    if (a.startsWith('@')) {
      if (ns !== 'suit') return `alias not allowed in "${path}"`;
      if (!content.config.aliases.includes(a.slice(1))) return `unknown alias in "${path}"`;
      return need(SUIT_FIELDS.includes(b ?? ''), 'suit field');
    }
    switch (ns) {
      case 'estate': return need((ESTATE_FIELDS as readonly string[]).includes(a) || a === 'founded' || a === 'recovery', 'estate field');
      case 'suit': return need(a in reg.romances, 'romance') ?? need(SUIT_FIELDS.includes(b ?? ''), 'suit field');
      case 'heir': return need(['eldest', 'second', 'third', 'last'].includes(a), 'heir selector') ?? need(['alive', 'name', 'sex', 'age', 'ageword', 'temperament', 'upbringing', 'bond'].includes(b ?? ''), 'heir field');
      case 'holding': return need(a in reg.holdings, 'holding') ?? need(['held', 'income', 'temper'].includes(b ?? ''), 'holding field');
      case 'holdings': return need(['count', 'income'].includes(a), 'holdings field');
      case 'heirs': return need(['count', 'born', 'sons', 'daughters', 'last', 'lastname', 'eldest', 'eldest_id', 'lastdead', 'dead', 'names'].includes(a), 'heirs field');
    }
    return `unknown namespace "${ns}" in "${path}"`;
  },

  labelFor(c, path) {
    const reg = ct(c).registry;
    const [ns, a, b] = path.split('.');
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
    switch (ns) {
      case 'suit': return `${reg.npcs[reg.romances[a!]?.npc ?? a!]?.name ?? a}: ${b}`;
      case 'holding': return `${reg.holdings[a!]?.label ?? cap(a!)}: ${b === 'temper' ? 'temper' : 'income'}`;
      case 'estate': return ESTATE_LABELS[a as EstateField] ?? cap(a!);
    }
    return undefined;
  },

  ordinalFor(_c, path) {
    if (path.startsWith('suit.') && path.endsWith('.status')) return ['lost', 'hidden', 'known', 'courted', 'available', 'married'];
    if (path.startsWith('suit.') && path.endsWith('.pledge')) return ['none', 'token', 'understanding'];
    return undefined;
  },

  namedValues(c, path, value) {
    const content = ct(c);
    if (path === 'background') return Object.keys(content.backgrounds);
    if (path === 'role') return ['none', ...Object.values(content.backgrounds).flatMap((b) => Object.keys(b.roles ?? {}))];
    if (path === 'heirs.last') return ['none', 'son', 'daughter'];
    if (path === 'heirs.eldest_id') return [value]; // a child's given name, lower-cased: any word
    if (/^heir\.[a-z]+\.sex$/.test(path)) return ['none', 'son', 'daughter'];
    if (/^heir\.[a-z]+\.temperament$/.test(path)) return ['none', 'bold', 'bookish', 'merry', 'grave'];
    if (/^heir\.[a-z]+\.upbringing$/.test(path)) return ['none', 'home', 'page', 'church', 'arms', 'letters', 'court'];
    return undefined;
  },

  comparisonLabel(c, path, op, value) {
    if (path !== 'background') return undefined;
    return `${op === '!=' ? 'not ' : ''}${ct(c).backgrounds[value as string]?.label ?? value}`;
  },

  addNumber(s, c, path, delta, changes) {
    const state = st(s);
    const note = (label: string, d: number) => { if (d !== 0) changes.push(`${label} ${signed(d)}`); };
    const [ns, a, b] = path.split('.') as [string, string, string | undefined];
    switch (ns) {
      case 'suit': {
        const x = suit(state, a);
        const f = b as 'regard' | 'family' | 'discretion';
        const before = x[f];
        x[f] = clamp(before + delta, f === 'discretion' ? 0 : -10, 10);
        return;
      }
      case 'estate': {
        if (!state.estate) state.estate = {};
        const f = a as EstateField;
        const before = state.estate[f] ?? 0;
        state.estate[f] = clampEstate(f, before + delta);
        note(labelFor(c, path), state.estate[f]! - before);
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
        note(labelFor(c, path), delta);
        return;
      }
    }
    throw new Error(`add: unsupported path ${path}`);
  },

  assignValue(s, _c, path, value) {
    const [ns, a, b] = path.split('.') as [string, string, string | undefined];
    if (ns !== 'suit') throw new Error(`assign: unsupported path ${path}`);
    (suit(st(s), a) as unknown as Record<string, unknown>)[b!] = value;
  },

  effects: {
    lose_share(s, c, effect, ctx) {
      const state = st(s);
      const e = effect as Op<'lose_share'>;
      for (const [raw, pct] of Object.entries(e.lose_share)) {
        const [, f] = raw.split('.') as [string, EstateField];
        if (!state.estate) continue;
        const before = state.estate[f] ?? 0;
        state.estate[f] = clampEstate(f, before - Math.round((before * pct) / 100));
        const d = state.estate[f]! - before;
        if (d) ctx.changes.push(`${labelFor(c, raw)} ${d}`);
      }
    },
    birth(s, _c, effect, ctx) {
      const state = st(s);
      const e = effect as Op<'birth'>;
      const sex = e.birth === 'random' ? (ctx.rng && ctx.rng.float() < 0.5 ? 'daughter' : 'son') : e.birth;
      const temperament = ctx.rng ? TEMPERAMENTS[ctx.rng.int(TEMPERAMENTS.length)] : 'merry';
      (state.heirs ??= []).push({ name: '', sex, born: state.time, alive: true, temperament, bond: 0 });
      ctx.changes.push(sex === 'son' ? 'A son' : 'A daughter');
    },
    name_heir(s, _c, effect) {
      const state = st(s);
      const e = effect as Op<'name_heir'>;
      const h = state.heirs?.find((x) => !x.name);
      if (h) h.name = e.name_heir === '@self' ? state.name : e.name_heir;
    },
    heir_dies(s, _c, effect, ctx) {
      const e = effect as Op<'heir_dies'>;
      const h = pickHeirs(st(s), e.heir_dies)[0];
      if (h) { h.alive = false; h.died = s.time; ctx.changes.push(`${h.name || 'The child'} dies`); }
    },
    heir_set(s, _c, effect, ctx) {
      const e = effect as Op<'heir_set'>;
      for (const h of pickHeirs(st(s), e.heir_set.which)) {
        const t = e.heir_set.temperament;
        if (t === 'random') { if (!h.temperament) h.temperament = ctx.rng ? TEMPERAMENTS[ctx.rng.int(TEMPERAMENTS.length)] : 'merry'; }
        else if (t) h.temperament = t;
        if (e.heir_set.upbringing) h.upbringing = e.heir_set.upbringing;
        h.bond ??= 0;
      }
    },
    hold(s, c, effect, ctx) {
      const state = st(s);
      const e = effect as Op<'hold'>;
      (state.holdings ??= {})[e.hold.id] = { income: e.hold.income, temper: clamp(e.hold.temper, -5, 5) };
      ctx.changes.push(`You hold ${ct(c).registry.holdings[e.hold.id]?.label ?? e.hold.id}`);
    },
    release(s, c, effect, ctx) {
      const state = st(s);
      const e = effect as Op<'release'>;
      if (state.holdings?.[e.release]) {
        delete state.holdings[e.release];
        ctx.changes.push(`Lost: ${ct(c).registry.holdings[e.release]?.label ?? e.release}`);
      }
    },
    train(s, c, effect, ctx) {
      train(st(s), ct(c), (effect as Op<'train'>).train, ctx.changes);
    },
    found_estate(s, _c, effect) {
      const state = st(s);
      const e = effect as Op<'found_estate'>;
      state.estate = {};
      for (const f of ESTATE_FIELDS) state.estate[f] = clampEstate(f, e.found_estate[f] ?? 0);
      state.estate.founded = state.estate.people ?? 0; // what the manor held when he came, for estate.recovery
    },
  },

  stakesOf(_c, _s, effect, put) {
    if ('hold' in effect) put('holding', 'Your holdings', RANK.manor, 1);
    else if ('birth' in effect || 'heir_set' in effect) put('heir', 'Your children', RANK.family, 0);
  },

  stakesOfAdd(c, path, sign, put) {
    const reg = ct(c).registry;
    const [ns, a, b] = path.split('.');
    switch (ns) {
      case 'suit': put(`suit.${a}`, npcLabel(c, reg.romances[a!]?.npc ?? a!), RANK.rel, sign); break;
      case 'estate': put('estate', 'Your manor', RANK.manor, b === undefined && a === 'people' ? sign : 0); break;
      case 'holding': put('holding', 'Your holdings', RANK.manor, sign); break;
      case 'heir': put('heir', 'Your children', RANK.family, sign); break;
    }
  },

  counterRank(counter) {
    return counter.startsWith('court_') || counter === 'west_estates' ? RANK.rep : undefined;
  },

  textVar(name, s, c) {
    const state = st(s);
    const content = ct(c);
    switch (name) {
      case 'pay_due': return formatCoin(payDue(state));
      case 'background': return content.backgrounds[state.background]?.label ?? state.background;
      case 'origin': return (content.backgrounds[state.background]?.label ?? state.background).toLowerCase();
    }
    // the current wife's own line for a moment of the marriage (registry romances[].voice)
    if (name.startsWith('wife.')) {
      const line = content.registry.romances[state.aliases.spouse ?? '']?.voice[name.slice(5)];
      return line ? renderText(line, state, content) : '';
    }
    return undefined;
  },

  checkTextVar(name) {
    if (name === 'pay_due' || name === 'background' || name === 'origin') return [];
    if (name.startsWith('wife.')) return name.slice(5) in WIFE_MOMENTS ? [] : [`unknown wife moment in {${name}}`];
    return undefined;
  },

  variantKey: (s) => st(s).background,

  onSeason(s, _c, changes) {
    estateTick(st(s), changes);
  },

  audience(s, c, audience) {
    const value = audienceModifier(st(s), ct(c), audience);
    return value ? { label: value < 0 ? 'his origins' : 'one of their own', value } : undefined;
  },

  resolvePlace(ref, s) {
    const state = st(s);
    switch (ref) {
      case '@home': return HOME[state.background] ?? 'wendham';
      case '@service': return state.track === 'levy' ? 'brome' : 'ravell_hall';
      case '@manor': return state.flags.c2_granted_kerval ? 'kerval' : state.flags.c2_granted_marsalin ? 'marsalin' : state.flags.c2_granted_ormel ? 'ormel' : undefined;
      case '@town': return state.flags.c2_granted_kerval ? 'lannec' : 'sauvemer';
    }
    return ref;
  },

  cardRows(c, s) {
    const state = st(s);
    const rows: [string, string][] = [];
    const sp = state.aliases.spouse;
    if (state.flags.c3_married && sp && sp !== 'none') {
      const name = c.registry.npcs[sp]?.name ?? sp;
      rows.push([state.npcs[sp]?.alive === false ? 'Late wife' : 'Wife', name]);
    }
    const living = (state.heirs ?? []).filter((h) => h.alive);
    if (living.length) rows.push(['Children', living.map((h) => `${h.name || 'a baby'} (${Math.floor((state.time - h.born) / 4)})`).join(', ')]);
    if (state.estate) {
      const others = Object.keys(state.holdings ?? {}).length;
      rows.push(['Lands', `${grantName(state, 'Your manor')}, ${state.estate.people ?? 0} people${others ? `; ${others} other holding${others === 1 ? '' : 's'}` : ''}`]);
    }
    return rows;
  },

  cardBorn(_c, s, from) {
    return (st(s).heirs ?? [])
      .filter((h) => h.born >= from)
      .map((h) => `Born: ${h.name || SEX_WORD[h.sex]}${h.name ? `, ${SEX_WORD[h.sex].slice(2)}` : ''}.`);
  },

  cardDead(_c, s, from) {
    return (st(s).heirs ?? []).filter((h) => !h.alive && h.died !== undefined && h.died >= from).map((h) => h.name || 'your child');
  },

  startScene: (s, c) => ct(c).backgrounds[st(s).background]?.start_scene,
};

registerGame(knight);
