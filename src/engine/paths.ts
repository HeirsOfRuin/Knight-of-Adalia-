import { pickHeirs, isHeir } from './heirs';
import { nameList, vassalName } from './lordship';
import { ESTATE_FIELDS, ESTATE_LABELS, type EstateField } from './estate';
// State paths: the shared vocabulary of conditions, effects and text.
// One resolver for everything, so displayed values and resolved values cannot
// drift apart.
import type { ContentBundle } from '../content/schema';
import type { GameState } from './state';
import { computePrejudice } from './station';
import { regnalYear, seasonName, ageOf } from './calendar';

export type Value = number | string | boolean | undefined;

/** Sum of modifiers from traits, active injuries and carried items for a key like "skill.arms". */
export function modifierFor(state: GameState, content: ContentBundle, key: string): number {
  const reg = content.registry;
  let m = 0;
  for (const t of state.traits) m += reg.traits[t]?.mods[key] ?? 0;
  for (const i of state.injuries) m += reg.injuries[i.id]?.mods[key] ?? 0;
  for (const it of state.items) m += reg.items[it]?.mods[key] ?? 0;
  return m;
}

export function effectiveAttr(state: GameState, content: ContentBundle, id: string): number {
  return Math.max(1, (state.attributes[id] ?? 0) + modifierFor(state, content, `attr.${id}`));
}

export function effectiveSkill(state: GameState, content: ContentBundle, id: string): number {
  return Math.max(0, (state.skills[id] ?? 0) + modifierFor(state, content, `skill.${id}`));
}

/** Replaces @alias segments with the NPC id they currently point to. */
export function deref(state: GameState, path: string): string {
  return path.includes('@') ? path.replace(/@([a-z_][a-z0-9_]*)/g, (m, a: string) => state.aliases?.[a] ?? m) : path;
}

/** A friend: someone whose affection and respect have both grown high enough. Friends back him up in scenes. */
export const FRIEND_AFFECTION = 5;
export const FRIEND_RESPECT = 2;
export function isFriend(state: GameState, content: ContentBundle, id: string): boolean {
  const n = state.npcs[id];
  if (content.registry.npcs[id]?.tags.includes('family')) return false; // family are family, not friends
  return !!n && n.alive && n.affection >= FRIEND_AFFECTION && n.respect >= FRIEND_RESPECT;
}

const NUMBER_WORDS = ['nought', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
/** Small numbers as words, for prose ("Ralf is two"). */
export function numberWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n);
}

export function getValue(state: GameState, content: ContentBundle, rawPath: string): Value {
  const path = deref(state, rawPath);
  const [ns, a, b] = path.split('.');
  switch (ns) {
    case 'flag': return !!state.flags[a!];
    case 'counter': return state.counters[a!] ?? 0;
    case 'attr': return effectiveAttr(state, content, a!);
    case 'skill': return effectiveSkill(state, content, a!);
    case 'rep': return state.rep[a!] ?? 0;
    case 'res': return state.res[a!] ?? 0;
    case 'estate': return a === 'recovery' ? estateRecovery(state) : state.estate?.[a!] ?? 0;
    case 'favor': return state.favors[a!] ?? 0;
    case 'trait': return state.traits.includes(a!);
    case 'injury': return state.injuries.some((i) => i.id === a);
    case 'item': return state.items.includes(a!);
    case 'rel': {
      const n = state.npcs[a!];
      return n ? (n[b as 'affection' | 'respect' | 'loyalty'] ?? 0) : 0;
    }
    case 'npc': {
      const n = state.npcs[a!];
      if (b === 'met') return n?.met ?? false;
      if (b === 'alive') return n?.alive ?? true;
      if (b === 'follower') return !!n?.follower && n.alive;
      if (b === 'friend') return isFriend(state, content, a!);
      return undefined;
    }
    case 'suit': {
      const s = state.suits[a!];
      if (!s) return b === 'status' ? 'hidden' : b === 'pledge' ? 'none' : 0;
      return s[b as keyof typeof s];
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
        // who inherits, by birth order: the eldest is the heir unless a younger brother comes first
        case 'eldest_is_heir': return isHeir(state, living[0]);
        case 'second_is_heir': return isHeir(state, living[1]);
        // the heir is one of Mahaut's children (so the crown and the Armance go together)
        case 'heir_is_armance': { const h = pickHeirs(state, 'heir')[0]; return !!h && pickHeirs(state, 'armance')[0] === h; }
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
    case 'vassals': {
      const vs = state.vassals ?? [];
      if (a === 'count') return vs.length;
      if (a === 'names') return nameList(vs.map((v) => vassalName(content, v)));
      return undefined;
    }
    case 'holdings': {
      const all = Object.values(state.holdings ?? {});
      if (a === 'count') return all.length;
      if (a === 'income') return all.reduce((s, h) => s + h.income, 0);
      return undefined;
    }
    case 'calendar':
      if (a === 'season') return seasonName(state, content);
      if (a === 'year') return regnalYear(state, content);
      return undefined;
    case 'seen': return state.seen[a!] !== undefined; // seen.<scene>: he has been through that scene
    case 'alias': return state.aliases?.[a!] ?? 'none';
    case 'station': return state.station;
    case 'track': return state.track ?? 'none';
    case 'background': return state.background;
    case 'role': return state.role ?? 'none';
    case 'chapter': return state.chapter;
    case 'age': return ageOf(state);
    case 'health': return state.health;
    case 'injured': return state.injuries.some((i) => content.registry.injuries[i.id]?.serious);
    case 'wounded': return state.injuries.length > 0;
    case 'armour': return state.items.reduce((m, it) => Math.max(m, content.registry.items[it]?.armour ?? 0), 0);
    case 'retinue': return Object.values(state.npcs).filter((n) => n.follower && n.alive).length + (state.res.men ?? 0);
    case 'time': return state.time;
    case 'prejudice': return computePrejudice(state, content, 'nobles');
    // back in the same scene after one of its choices (a shop after a purchase)
    case 'revisit': return state.journal.at(-1)?.scene === state.scene;
    default: return undefined;
  }
}

/** Static check of a path against the registry. Returns an error message or null. */
export function checkPath(content: ContentBundle, path: string): string | null {
  const [ns, a, b, extra] = path.split('.');
  const reg = content.registry;
  const need = (ok: boolean, what: string) => (ok ? null : `unknown ${what} in "${path}"`);
  if (extra !== undefined) return `too many segments in "${path}"`;
  const single = ['station', 'track', 'background', 'role', 'chapter', 'age', 'health', 'injured', 'wounded', 'armour', 'retinue', 'time', 'prejudice', 'revisit'];
  if (single.includes(ns!)) return a === undefined ? null : `"${ns}" takes no sub-path ("${path}")`;
  if (a === undefined) return `incomplete path "${path}"`;
  if (a.startsWith('@')) {
    if (!['rel', 'npc', 'favor', 'suit'].includes(ns!)) return `alias not allowed in "${path}"`;
    if (!content.config.aliases.includes(a.slice(1))) return `unknown alias in "${path}"`;
    if (ns === 'favor') return null;
    if (ns === 'suit') return need(['status', 'regard', 'family', 'discretion', 'pledge'].includes(b ?? ''), 'suit field');
    return ns === 'rel'
      ? need(['affection', 'respect', 'loyalty'].includes(b ?? ''), 'relationship field')
      : need(['met', 'alive', 'follower', 'friend'].includes(b ?? ''), 'npc field');
  }
  switch (ns) {
    case 'alias': return need(content.config.aliases.includes(a), 'alias');
    case 'flag': return need(a in reg.flags, 'flag');
    case 'counter': return null; // counters are free-form numeric tallies
    case 'attr': return need(content.config.attributes.includes(a), 'attribute');
    case 'skill': return need(content.config.skills.includes(a), 'skill');
    case 'rep': return need(a in reg.factions, 'faction');
    case 'res': return need(['coin', 'supplies', 'horses', 'renown', 'men', 'garrison', 'levy'].includes(a), 'resource');
    case 'estate': return need((ESTATE_FIELDS as readonly string[]).includes(a) || a === 'founded' || a === 'recovery', 'estate field');
    case 'seen': return need(a in content.scenes, 'scene');
    case 'favor': return need(a in reg.npcs, 'npc');
    case 'trait': return need(a in reg.traits, 'trait');
    case 'injury': return need(a in reg.injuries, 'injury');
    case 'item': return need(a in reg.items, 'item');
    case 'rel': return need(a in reg.npcs, 'npc') ?? need(['affection', 'respect', 'loyalty'].includes(b ?? ''), 'relationship field');
    case 'npc': return need(a in reg.npcs, 'npc') ?? need(['met', 'alive', 'follower', 'friend'].includes(b ?? ''), 'npc field');
    case 'suit': return need(a in reg.romances, 'romance') ?? need(['status', 'regard', 'family', 'discretion', 'pledge'].includes(b ?? ''), 'suit field');
    case 'calendar': return need(['season', 'year'].includes(a), 'calendar field');
    case 'heir': return need(['eldest', 'second', 'third', 'last', 'heir', 'armance'].includes(a), 'heir selector') ?? need(['alive', 'name', 'sex', 'age', 'ageword', 'temperament', 'upbringing', 'bond'].includes(b ?? ''), 'heir field');
    case 'holding': return need(a in reg.holdings, 'holding') ?? need(['held', 'income', 'temper'].includes(b ?? ''), 'holding field');
    case 'holdings': return need(['count', 'income'].includes(a), 'holdings field');
    case 'vassals': return need(['count', 'names'].includes(a), 'vassals field');
    case 'heirs': return need(['count', 'born', 'sons', 'daughters', 'last', 'lastname', 'eldest', 'eldest_id', 'lastdead', 'dead', 'names', 'eldest_is_heir', 'second_is_heir', 'heir_is_armance'].includes(a), 'heirs field');
    default: return `unknown namespace "${ns}" in "${path}"`;
  }
}

/** Ordinal scales for identifier comparisons (station >= squire). */
export function ordinalFor(content: ContentBundle, path: string): string[] | undefined {
  if (path === 'station') return content.config.stations;
  if (path === 'chapter') return content.config.chapters;
  if (path === 'calendar.season') return content.config.seasons;
  if (path.startsWith('suit.') && path.endsWith('.status')) return ['lost', 'hidden', 'known', 'courted', 'available', 'married'];
  if (path.startsWith('suit.') && path.endsWith('.pledge')) return ['none', 'token', 'understanding'];
  return undefined;
}

export function npcLabel(content: ContentBundle, id: string): string {
  const d = content.registry.npcs[id];
  if (!d) return id;
  return d.title && !d.title.startsWith('the ') ? `${d.title} ${d.name}` : d.name;
}

/** Human label for a path, used in requirement labels and journal changes. */
export function labelFor(content: ContentBundle, path: string): string {
  const [ns, a, b] = path.split('.');
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
  const reg = content.registry;
  switch (ns) {
    case 'attr': case 'skill': return cap(a!);
    case 'rep': return reg.factions[a!]?.label ?? cap(a!);
    case 'res': return a === 'coin' ? 'Coin' : cap(a!);
    case 'rel': return `${npcLabel(content, a!)}'s ${b}`;
    case 'favor': return `Favor with ${npcLabel(content, a!)}`;
    case 'trait': return reg.traits[a!]?.label ?? cap(a!);
    case 'item': return reg.items[a!]?.label ?? cap(a!);
    case 'injury': return reg.injuries[a!]?.label ?? cap(a!);
    case 'suit': return `${reg.npcs[reg.romances[a!]?.npc ?? a!]?.name ?? a}: ${b}`;
    case 'station': return 'Station';
    case 'holding': return `${reg.holdings[a!]?.label ?? cap(a!)}: ${b === 'temper' ? 'temper' : 'income'}`;
    case 'estate': return ESTATE_LABELS[a as EstateField] ?? cap(a!);
    default: return cap(path);
  }
}

/** The men he commands: named followers and the company march with him; the garrison holds his manor. The village levy is counted apart. */
export function forceOf(state: GameState): { named: number; men: number; garrison: number; levy: number; total: number } {
  const named = Object.values(state.npcs).filter((n) => n.follower && n.alive).length;
  const men = state.res.men ?? 0;
  const garrison = state.res.garrison ?? 0;
  return { named, men, garrison, levy: state.res.levy ?? 0, total: named + men + garrison };
}

/** People on the manor as a percentage of what it held when he came. Prose that compares the present with the past reads this, never a raw count. */
export function estateRecovery(state: GameState): number {
  const founded = state.estate?.founded ?? 0;
  return founded > 0 ? Math.round(((state.estate?.people ?? 0) * 100) / founded) : 100;
}
