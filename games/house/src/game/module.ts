// House of Adalia's game module: where the West stands (realm.*), the opening, what the house
// inherited, the frame as the scene variant key, and dates counted in the sovereign's reign.
// Registered on import; every entry point that loads content imports it.
import { registerGame, type GameModule } from '@engine/game';
import type { CoreContent } from '@engine/schema';
import type { CoreState } from '@engine/state';
import { regnalYear } from '@engine/calendar';
import { renderText } from '@engine/text';
import { FRAMES, GAME_ID, type ContentBundle, type Effect, type Frame } from '../content/schema';
import type { HouseState } from './state';

const st = (s: CoreState) => s as HouseState;
const ct = (c: CoreContent) => c as ContentBundle;

/** realm.<field> paths; the text fields render as words, the others compare as ids. */
const REALM_IDS = ['west', 'sovereign', 'changes'];
const REALM_TEXT = ['sovereign', 'capital', 'border', 'assembly', 'law', 'frame'];
const SINGLE = ['opening', 'imported'];

type Op<K extends string> = Extract<Effect, Record<K, unknown>>;

/** The sovereign's style for prose and the date line ("Queen Mahaut", "King Edwin"). */
export function sovereignStyle(state: HouseState, content: ContentBundle): string {
  const def = content.registry.sovereigns[state.realm.sovereign];
  return def ? renderText(def.style, state, content) : state.realm.sovereign;
}

export const house: GameModule = {
  id: GAME_ID,
  namespaces: ['realm', 'opening', 'imported', 'inherited'],

  getValue(s, _c, path) {
    const state = st(s);
    const [ns, a] = path.split('.');
    switch (ns) {
      case 'realm':
        if (a === 'west') return state.realm.west;
        if (a === 'sovereign') return state.realm.sovereign;
        if (a === 'changes') return state.realm.changes;
        return undefined;
      case 'opening': return state.opening;
      case 'imported': return !!state.inheritance;
      // inherited.<flag>: a story flag set in the Knight of Adalia life this house continues
      case 'inherited': return !!state.inheritance?.flags.includes(a!);
    }
    return undefined;
  },

  checkPath(_c, path) {
    const [ns, a, b] = path.split('.');
    if (SINGLE.includes(ns!)) return a === undefined ? null : `"${ns}" takes no sub-path ("${path}")`;
    if (a === undefined) return `incomplete path "${path}"`;
    if (b !== undefined) return `too many segments in "${path}"`;
    if (ns === 'realm') return REALM_IDS.includes(a) ? null : `unknown realm field in "${path}"`;
    // Knight of Adalia's flags are not in this registry; any id is allowed
    if (ns === 'inherited') return /^[a-z][a-z0-9_]*$/.test(a) ? null : `bad flag id in "${path}"`;
    return `unknown namespace "${ns}" in "${path}"`;
  },

  namedValues(c, path) {
    const content = ct(c);
    if (path === 'realm.west') return [...FRAMES];
    if (path === 'realm.sovereign') return Object.keys(content.registry.sovereigns);
    if (path === 'opening') return Object.keys(content.openings);
    return undefined;
  },

  labelFor(c, path) {
    const content = ct(c);
    if (path === 'realm.west') return 'Where the West stands';
    if (path === 'realm.sovereign') return 'Who rules the West';
    if (path.startsWith('inherited.')) return `From the founder's life: ${content.registry.flags[path.slice(10)]?.description ?? path.slice(10)}`;
    return undefined;
  },

  comparisonLabel(c, path, op, value) {
    const content = ct(c);
    if (path === 'realm.west') return `${op === '!=' ? 'not ' : ''}${content.registry.frames[value as Frame]?.label ?? value}`;
    return undefined;
  },

  effects: {
    west(s, c, effect, ctx) {
      const state = st(s);
      const content = ct(c);
      const e = effect as Op<'west'>;
      const frame = e.west.frame ?? state.realm.west;
      const sovereign = e.west.sovereign ?? (frame === state.realm.west ? state.realm.sovereign : undefined);
      const def = sovereign ? content.registry.sovereigns[sovereign] : undefined;
      if (!sovereign || !def) throw new Error(`west: a change to ${frame} needs a sovereign`);
      if (def.frame !== frame) throw new Error(`west: ${sovereign} does not rule a ${frame} West`);
      if (frame === state.realm.west && sovereign === state.realm.sovereign) return;
      state.realm = { west: frame, sovereign, changes: state.realm.changes + 1 };
      ctx.changes.push(`The West: ${content.registry.frames[frame]!.label}, under ${sovereignStyle(state, content)}`);
    },
  },

  textVar(name, s, c) {
    if (!name.startsWith('realm.')) return undefined;
    const state = st(s);
    const content = ct(c);
    const f = name.slice(6);
    const frame = content.registry.frames[state.realm.west]!;
    switch (f) {
      case 'sovereign': return sovereignStyle(state, content);
      case 'capital': return content.registry.sovereigns[state.realm.sovereign]?.capital ?? '';
      case 'border': return frame.border;
      case 'assembly': return frame.assembly;
      case 'law': return frame.law;
      case 'frame': return frame.label;
    }
    return undefined;
  },

  checkTextVar(name) {
    if (!name.startsWith('realm.')) return undefined;
    const f = name.slice(6);
    return REALM_TEXT.includes(f) || REALM_IDS.includes(f) ? [] : [`unknown realm field in {${name}}`];
  },

  variantKey: (s) => st(s).realm.west,

  reign(s, c) {
    const state = st(s);
    const content = ct(c);
    const def = content.registry.sovereigns[state.realm.sovereign];
    if (!def) return undefined;
    return { ruler: sovereignStyle(state, content), year: regnalYear(state, content) - def.reign_from + 1 };
  },

  startScene: (s, c) => ct(c).openings[st(s).opening]?.start_scene,
};

registerGame(house);
