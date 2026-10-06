// State paths: the shared vocabulary of conditions, effects and text.
// One resolver for everything, so displayed values and resolved values cannot
// drift apart. Namespaces a game owns (GameModule.namespaces) go to its module.
import { heroOf } from './character';
import type { CoreContent as ContentBundle } from './schema';
import type { CoreState as GameState } from './state';
import { regnalYear, seasonName, ageOf } from './calendar';
import { gameOf, type Value } from './game';

export type { Value } from './game';

/** Sum of modifiers from traits, active injuries and carried items for a key like "skill.arms". */
export function modifierFor(state: GameState, content: ContentBundle, key: string): number {
  const reg = content.registry;
  let m = 0;
  for (const t of heroOf(state).traits) m += reg.traits[t]?.mods[key] ?? 0;
  for (const i of heroOf(state).injuries) m += reg.injuries[i.id]?.mods[key] ?? 0;
  for (const it of heroOf(state).items) m += reg.items[it]?.mods[key] ?? 0;
  return m;
}

export function effectiveAttr(state: GameState, content: ContentBundle, id: string): number {
  return Math.max(1, (heroOf(state).attributes[id] ?? 0) + modifierFor(state, content, `attr.${id}`));
}

export function effectiveSkill(state: GameState, content: ContentBundle, id: string): number {
  return Math.max(0, (heroOf(state).skills[id] ?? 0) + modifierFor(state, content, `skill.${id}`));
}

/** Replaces @alias segments with the NPC id they currently point to. */
export function deref(state: GameState, path: string): string {
  return path.includes('@') ? path.replace(/@([a-z_][a-z0-9_]*)/g, (m, a: string) => state.aliases?.[a] ?? m) : path;
}

/** Paths about the hero's own person. Written bare (attr.wits) or as hero.attr.wits. */
export const HERO_PATHS = ['attr', 'skill', 'trait', 'injury', 'item', 'health', 'age', 'injured', 'wounded', 'armour', 'station', 'track'];
/** The hero's own fields that only the hero. prefix reaches: hero.sex, hero.name, hero.alive. */
const HERO_FIELDS = ['sex', 'name', 'alive'];

/** hero.attr.wits -> attr.wits: the bare path it means. Other paths are returned as they are. */
export function unhero(path: string): string {
  if (!path.startsWith('hero.')) return path;
  const rest = path.slice(5);
  return HERO_PATHS.includes(rest.split('.')[0]!) ? rest : path;
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
  const path = unhero(deref(state, rawPath));
  const [ns, a, b] = path.split('.');
  switch (ns) {
    case 'hero': {
      const h = heroOf(state);
      return a === 'sex' ? h.sex : a === 'name' ? h.name : a === 'alive' ? h.alive : undefined;
    }
    case 'flag': return !!state.flags[a!];
    case 'counter': return state.counters[a!] ?? 0;
    case 'attr': return effectiveAttr(state, content, a!);
    case 'skill': return effectiveSkill(state, content, a!);
    case 'rep': return state.rep[a!] ?? 0;
    case 'res': return state.res[a!] ?? 0;
    case 'favor': return state.favors[a!] ?? 0;
    case 'trait': return heroOf(state).traits.includes(a!);
    case 'injury': return heroOf(state).injuries.some((i) => i.id === a);
    case 'item': return heroOf(state).items.includes(a!);
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
    case 'calendar':
      if (a === 'season') return seasonName(state, content);
      if (a === 'year') return regnalYear(state, content);
      return undefined;
    case 'seen': return state.seen[a!] !== undefined; // seen.<scene>: he has been through that scene
    case 'alias': return state.aliases?.[a!] ?? 'none';
    case 'station': return heroOf(state).station;
    case 'track': return heroOf(state).track ?? 'none';
    case 'chapter': return state.chapter;
    case 'age': return ageOf(state);
    case 'health': return heroOf(state).health;
    case 'injured': return heroOf(state).injuries.some((i) => content.registry.injuries[i.id]?.serious);
    case 'wounded': return heroOf(state).injuries.length > 0;
    case 'armour': return heroOf(state).items.reduce((m, it) => Math.max(m, content.registry.items[it]?.armour ?? 0), 0);
    case 'retinue': return Object.values(state.npcs).filter((n) => n.follower && n.alive).length + (state.res.men ?? 0);
    case 'time': return state.time;
    // back in the same scene after one of its choices (a shop after a purchase)
    case 'revisit': return state.journal.at(-1)?.scene === state.scene;
    default: {
      const game = gameOf(content);
      return game.namespaces.includes(ns!) ? game.getValue(state, content, path) : undefined;
    }
  }
}

/** Static check of a path against the registry. Returns an error message or null. */
export function checkPath(content: ContentBundle, rawPath: string): string | null {
  const path = unhero(rawPath);
  const [ns, a, b, extra] = path.split('.');
  const reg = content.registry;
  const need = (ok: boolean, what: string) => (ok ? null : `unknown ${what} in "${path}"`);
  if (extra !== undefined) return `too many segments in "${path}"`;
  if (ns === 'hero') return HERO_FIELDS.includes(a ?? '') && b === undefined ? null : `unknown hero field in "${path}"`;
  const game = gameOf(content);
  if (game.namespaces.includes(ns!)) return game.checkPath(content, path);
  const single = ['station', 'track', 'chapter', 'age', 'health', 'injured', 'wounded', 'armour', 'retinue', 'time', 'revisit'];
  if (single.includes(ns!)) return a === undefined ? null : `"${ns}" takes no sub-path ("${path}")`;
  if (a === undefined) return `incomplete path "${path}"`;
  if (a.startsWith('@')) {
    if (!['rel', 'npc', 'favor'].includes(ns!)) return `alias not allowed in "${path}"`;
    if (!content.config.aliases.includes(a.slice(1))) return `unknown alias in "${path}"`;
    if (ns === 'favor') return null;
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
    case 'seen': return need(a in content.scenes, 'scene');
    case 'favor': return need(a in reg.npcs, 'npc');
    case 'trait': return need(a in reg.traits, 'trait');
    case 'injury': return need(a in reg.injuries, 'injury');
    case 'item': return need(a in reg.items, 'item');
    case 'rel': return need(a in reg.npcs, 'npc') ?? need(['affection', 'respect', 'loyalty'].includes(b ?? ''), 'relationship field');
    case 'npc': return need(a in reg.npcs, 'npc') ?? need(['met', 'alive', 'follower', 'friend'].includes(b ?? ''), 'npc field');
    case 'calendar': return need(['season', 'year'].includes(a), 'calendar field');
    default: return `unknown namespace "${ns}" in "${path}"`;
  }
}

/** Ordinal scales for identifier comparisons (station >= squire). */
export function ordinalFor(content: ContentBundle, rawPath: string): string[] | undefined {
  const path = unhero(rawPath);
  if (path === 'station') return content.config.stations;
  if (path === 'chapter') return content.config.chapters;
  if (path === 'calendar.season') return content.config.seasons;
  return gameOf(content).ordinalFor?.(content, path);
}

export function npcLabel(content: ContentBundle, id: string): string {
  const d = content.registry.npcs[id];
  if (!d) return id;
  return d.title && !d.title.startsWith('the ') ? `${d.title} ${d.name}` : d.name;
}

/** Human label for a path, used in requirement labels and journal changes. */
export function labelFor(content: ContentBundle, rawPath: string): string {
  const path = unhero(rawPath);
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
    case 'station': return 'Station';
    default: {
      const game = gameOf(content);
      return (game.namespaces.includes(ns!) ? game.labelFor?.(content, path) : undefined) ?? cap(path);
    }
  }
}

/** The men he commands: named followers and the company march with him; the garrison holds his manor. The village levy is counted apart. */
export function forceOf(state: GameState): { named: number; men: number; garrison: number; levy: number; total: number } {
  const named = Object.values(state.npcs).filter((n) => n.follower && n.alive).length;
  const men = state.res.men ?? 0;
  const garrison = state.res.garrison ?? 0;
  return { named, men, garrison, levy: state.res.levy ?? 0, total: named + men + garrison };
}
