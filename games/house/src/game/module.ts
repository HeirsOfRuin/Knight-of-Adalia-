// House of Adalia's game module: where the West stands (realm.*), the opening, what the house
// inherited, the frame as the scene variant key, and dates counted in the sovereign's reign.
// Registered on import; every entry point that loads content imports it.
import { registerGame, type GameModule } from '@engine/game';
import type { CoreContent } from '@engine/schema';
import type { CoreState } from '@engine/state';
import { regnalYear } from '@engine/calendar';
import { renderText } from '@engine/text';
import { FRAMES, GAME_ID, HOUSE_LAWS, type ContentBundle, type Effect, type Frame } from '../content/schema';
import { FOUNDER_ID, HOUSE_ID, type HouseState } from './state';
import { SELECTORS, select, heirOf, livingChildren, die, queueSuccession, succeed, bear, marry, nameChild, yearTick, SUCCESSION_SCENE } from './family';
import { ageOfCharacter } from '@engine/character';

const st = (s: CoreState) => s as HouseState;
const ct = (c: CoreContent) => c as ContentBundle;

/** realm.<field> paths; the text fields render as words, the others compare as ids. */
const REALM_IDS = ['west', 'sovereign', 'changes'];
const REALM_TEXT = ['sovereign', 'capital', 'border', 'assembly', 'law', 'frame'];
const SINGLE = ['opening', 'imported'];
/** family.<field>: the house as a whole. */
const FAMILY = ['law', 'generation', 'members', 'children', 'sons', 'daughters', 'extinct', 'no_heir', 'minor', 'regency', 'contested', 'news', 'childbed', 'cloister', 'junior'];
// {house.*}: the founder's house as Knight of Adalia left it, or as a fresh start has it
const HOUSE_TEXT = ['manor', 'claimed', 'companion', 'companion_first', 'origin', 'parent', 'parent_start', 'knights', 'withholder', 'parent_word', 'querec', 'querec_start', 'querec_short'];
// house.<field> in conditions: the founder's knights as Knight of Adalia left them
const HOUSE_IDS = ['yvon', 'vassals'];

type Op<K extends string> = Extract<Effect, Record<K, unknown>>;

/** The sovereign's style for prose and the date line ("Queen Mahaut", "King Edwin"). */
export function sovereignStyle(state: HouseState, content: ContentBundle): string {
  const def = content.registry.sovereigns[state.realm.sovereign];
  return def ? renderText(def.style, state, content) : state.realm.sovereign;
}

export const house: GameModule = {
  id: GAME_ID,
  namespaces: ['realm', 'opening', 'imported', 'inherited', 'family', 'house'],
  characterSelectors: SELECTORS,
  selectCharacter: (s, c, sel) => select(st(s), ct(c), sel),

  onHeroDeath(s, _c, cause) {
    queueSuccession(st(s), cause);
    return true; // the house goes on; Extinct is an ending the succession reaches
  },

  onSeason(s, c, _changes, rng) {
    if (rng && s.time % 4 === 2) yearTick(st(s), ct(c), rng); // Michaelmas
  },

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
      case 'house': {
        const v = state.inheritance?.lands.vassals ?? [];
        if (a === 'yvon') return v.some((x) => x.id === 'penhoet_cadet');
        if (a === 'vassals') return v.length;
        return undefined;
      }
      case 'family': {
        const f = state.family;
        const kids = livingChildren(state).map((id) => state.characters[id]!);
        const heir = heirOf(state, f.law, state.hero);
        switch (a) {
          case 'law': return f.law;
          case 'generation': return f.generation;
          case 'members': return Object.values(state.characters).filter((c) => c.alive && c.house === HOUSE_ID).length;
          case 'children': return kids.length;
          case 'sons': return kids.filter((k) => k.sex === 'male').length;
          case 'daughters': return kids.filter((k) => k.sex === 'female').length;
          case 'extinct': return !!f.extinct;
          case 'no_heir': return !heir;
          // the heir (at a succession) or the head (in a regency) is under age
          case 'minor': { const h = state.characters[heir ?? '']; return !!h && ageOfCharacter(state, h) < ct(_c).registry.life.majority; }
          case 'regency': return !!f.regent;
          case 'contested': return !!f.will && f.will !== heir && !!state.characters[f.will]?.alive;
          case 'news': return f.current?.kind ?? 'none';
          case 'childbed': return !!f.current?.childbed;
          // the last head who stepped down went into a religious house
          case 'cloister': return f.manner === 'cloister';
          // the last head crowned the heir beside them and lives on (the Crowned opening's junior crown)
          case 'junior': return f.manner === 'junior_crown';
        }
        return undefined;
      }
    }
    return undefined;
  },

  checkPath(_c, path) {
    const [ns, a, b] = path.split('.');
    if (SINGLE.includes(ns!)) return a === undefined ? null : `"${ns}" takes no sub-path ("${path}")`;
    if (a === undefined) return `incomplete path "${path}"`;
    if (b !== undefined) return `too many segments in "${path}"`;
    if (ns === 'realm') return REALM_IDS.includes(a) ? null : `unknown realm field in "${path}"`;
    if (ns === 'family') return FAMILY.includes(a) ? null : `unknown family field in "${path}"`;
    if (ns === 'house') return HOUSE_IDS.includes(a) ? null : `unknown house field in "${path}"`;
    // Knight of Adalia's flags are not in this registry; any id is allowed
    if (ns === 'inherited') return /^[a-z][a-z0-9_]*$/.test(a) ? null : `bad flag id in "${path}"`;
    return `unknown namespace "${ns}" in "${path}"`;
  },

  namedValues(c, path) {
    const content = ct(c);
    if (path === 'realm.west') return [...FRAMES];
    if (path === 'realm.sovereign') return Object.keys(content.registry.sovereigns);
    if (path === 'opening') return Object.keys(content.openings);
    if (path === 'family.law') return [...HOUSE_LAWS];
    if (path === 'family.news') return ['none', 'death', 'birth', 'match', 'majority'];
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
      state.realm = { west: frame, sovereign, changes: state.realm.changes + 1, from: regnalYear(state, content) };
      ctx.changes.push(`The West: ${content.registry.frames[frame]!.label}, under ${sovereignStyle(state, content)}`);
    },

    // ---- the family (family.ts) ----
    birth(s, c, effect, ctx) {
      const state = st(s);
      const e = effect as Op<'birth'>;
      const parentId = e.birth.of ? select(state, ct(c), e.birth.of) : state.hero;
      const parent = state.characters[parentId ?? ''];
      if (!parent?.spouse) return; // nobody to have the child with
      const [mother, father] = parent.sex === 'female' ? [parentId!, parent.spouse] : [parent.spouse, parentId!];
      const id = bear(state, ct(c), mother, father, e.birth.sex, ctx.rng);
      ctx.changes.push(state.characters[id]!.sex === 'male' ? 'A son' : 'A daughter');
    },
    name_child(s, c, effect, ctx) {
      const state = st(s);
      const e = effect as Op<'name_child'>;
      const id = e.name_child.who ? select(state, ct(c), e.name_child.who) : Object.entries(state.characters).filter(([, x]) => !x.name).sort(([, a], [, b]) => b.born - a.born)[0]?.[0];
      if (id) nameChild(state, ct(c), id, e.name_child.style, ctx.rng);
    },
    marry(s, c, effect, ctx) {
      const state = st(s);
      const e = effect as Op<'marry'>;
      const id = select(state, ct(c), e.marry.who);
      const who = state.characters[id ?? ''];
      if (!id || !who?.alive || who.spouse && state.characters[who.spouse]?.alive) return;
      const sp = marry(state, ct(c), id, e.marry.culture, e.marry.to, ctx.rng);
      if (e.marry.name) state.characters[sp]!.name = e.marry.name;
      ctx.changes.push(`${who.name} marries ${state.characters[sp]!.name}`);
    },
    death(s, c, effect, ctx) {
      const state = st(s);
      const e = effect as Op<'death'>;
      const id = select(state, ct(c), e.death.who);
      const who = state.characters[id ?? ''];
      if (!id || !who?.alive) return;
      die(state, id, e.death.cause);
      ctx.changes.push(`${who.name} is dead`);
    },
    designate(s, c, effect) {
      const state = st(s);
      const e = effect as Op<'designate'>;
      state.family.will = e.designate === 'none' ? undefined : select(state, ct(c), e.designate);
    },
    house_law(s, _c, effect, ctx) {
      const e = effect as Op<'house_law'>;
      st(s).family.law = e.house_law;
      ctx.changes.push(`The house's law: ${e.house_law.replace('_', ' ')}`);
    },
    legitimate(s, c, effect, ctx) {
      const state = st(s);
      const id = select(state, ct(c), (effect as Op<'legitimate'>).legitimate);
      const who = state.characters[id ?? ''];
      if (who) { who.legitimate = true; ctx.changes.push(`${who.name} is legitimate`); }
    },
    step_down(s, _c, effect) {
      const state = st(s);
      state.characters[state.hero]!.retired = true;
      state.family.manner = (effect as Op<'step_down'>).step_down;
      queueSuccession(state, (effect as Op<'step_down'>).step_down);
    },
    succeed(s, c, effect, ctx) {
      const state = st(s);
      const e = effect as Op<'succeed'>;
      const heir = e.succeed.heir ? select(state, ct(c), e.succeed.heir) : heirOf(state, state.family.law, state.hero);
      succeed(state, ct(c), heir, ctx.changes);
    },
    take_news(s) {
      const f = st(s).family;
      f.current = f.news.shift();
    },
    upbringing(s, c, effect) {
      const state = st(s);
      const e = effect as Op<'upbringing'>;
      const who = state.characters[select(state, ct(c), e.upbringing.who) ?? ''];
      if (who) who.upbringing = e.upbringing.set;
    },
  },

  textVar(name, s, c) {
    // the cause of the death being told: the succession's (its queued origin), or the news item's
    if (name === 'family.cause') {
      const h = st(s);
      return (h.scene === SUCCESSION_SCENE ? h.activeCause?.text : h.family.current?.cause) || 'an illness';
    }
    // the last head's chronicle paragraph, as the handover shows it
    if (name === 'chronicle.last') {
      const e = st(s).chronicle.at(-1);
      return e ? `${e.name}, head of the house from year ${e.from} to year ${e.to}. ${e.lines.join(' ')}`.trim() : '';
    }
    if (name.startsWith('house.')) return houseText(st(s), name.slice(6));
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
    if (name === 'family.cause' || name === 'chronicle.last') return [];
    if (name.startsWith('house.')) return HOUSE_TEXT.includes(name.slice(6)) ? [] : [`unknown house field in {${name}}`];
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
    return { ruler: sovereignStyle(state, content), year: regnalYear(state, content) - (state.realm.from ?? def.reign_from) + 1 };
  },

  startScene: (s, c) => ct(c).openings[st(s).opening]?.start_scene,
};

/** The founder's manor; the manor Penhoët claims (Kerval, which was Yann's grandfather's, if the founder holds it); the founder's oldest follower; where the founder began. */
function houseText(s: HouseState, f: string): string | undefined {
  const d = s.inheritance;
  const manor = d?.lands.manor?.name ?? 'Kerval';
  switch (f) {
    case 'manor': return manor;
    case 'claimed': return manor === 'Kerval' || d?.flags.includes('c2_granted_kerval') || !d ? 'Kerval' : manor;
    case 'companion': case 'companion_first': {
      const name = [...(d?.people ?? [])].filter((p) => p.alive && p.follower).sort((a, b) => b.loyalty - a.loyalty || (a.id < b.id ? -1 : 1))[0]?.name ?? 'Piers atte Brook';
      return f === 'companion' ? name : name.split(' ')[0];
    }
    // the founder, as the founder's children speak of them
    case 'parent': return s.characters[FOUNDER_ID]?.sex === 'female' ? 'your mother' : 'your father';
    // the knights who held of the founder (Knight of Adalia's lands.vassals), or the West's first names for a fresh house
    case 'knights': {
      const names = (d?.lands.vassals ?? []).map((v) => v.name);
      const list = names.length ? names.slice(0, 4) : ["Sir Gautier d'Aubrac", 'Sir Alain de Coatmen', 'Sir Renaud de Saint-Aubin'];
      return list.length === 1 ? list[0]! : `${list.slice(0, -1).join(', ')} and ${list.at(-1)}`;
    }
    // the knight who withholds homage from the Keeper: Penhoët's cadet if he holds of the house
    case 'withholder': {
      const v = d?.lands.vassals ?? [];
      return v.find((x) => x.id === 'penhoet_cadet')?.name ?? v.at(-1)?.name ?? 'Sir Renaud de Saint-Aubin';
    }
    // who defies a girl's crown: old Quérec, or his son if Knight of Adalia exiled or beheaded him
    case 'querec': return d?.flags.includes('c5r_querec_executed') || d?.flags.includes('c5r_querec_exiled') ? 'Bertrand de Quérec' : 'the lord of Quérec';
    case 'querec_start': return d?.flags.includes('c5r_querec_executed') || d?.flags.includes('c5r_querec_exiled') ? 'Bertrand de Quérec' : 'The lord of Quérec';
    case 'querec_short': return d?.flags.includes('c5r_querec_executed') || d?.flags.includes('c5r_querec_exiled') ? 'Bertrand' : 'Quérec';
    // the founder as the founder's children call them: Father, Mother
    case 'parent_word': return s.characters[FOUNDER_ID]?.sex === 'female' ? 'Mother' : 'Father';
    case 'parent_start': return s.characters[FOUNDER_ID]?.sex === 'female' ? 'Your mother' : 'Your father';
    case 'origin': {
      // Knight of Adalia's founder ending: a reeve's, a wool merchant's or an archer's son, or else a tirewoman's
      const words: Record<string, string> = { reeve: "a reeve's son", burgess: "a wool merchant's son", archer: "an archer's son" };
      if (d) return words[d.founder.background] ?? "a tirewoman's son";
      return s.characters[FOUNDER_ID]?.sex === 'female' ? 'a younger daughter of nobody in particular' : 'a younger son of nobody in particular';
    }
  }
  return undefined;
}

registerGame(house);
