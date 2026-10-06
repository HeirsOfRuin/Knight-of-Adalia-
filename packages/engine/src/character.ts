// Characters: the hero, and anyone who may become the hero. Pronouns and ages for prose.
import type { Character, CoreState, Sex } from './state';
import type { CoreContent } from './schema';
import { gameOf, type Value } from './game';

/** The character the player plays now. */
export function heroOf(state: CoreState): Character {
  const h = state.characters[state.hero];
  if (!h) throw new Error(`no hero: character "${state.hero}" is missing`);
  return h;
}

/** Whole years since birth. */
export function ageOfCharacter(state: CoreState, c: Character): number {
  return Math.floor((state.time - c.born) / 4);
}

/** Season index of a birth that makes someone `age` at game start. */
export function bornAtAge(age: number): number {
  return -age * 4;
}

const PRONOUNS: Record<Sex, Record<string, string>> = {
  male: { he: 'he', him: 'him', his: 'his', himself: 'himself', lord: 'lord', man: 'man', son: 'son' },
  female: { he: 'she', him: 'her', his: 'her', himself: 'herself', lord: 'lady', man: 'woman', son: 'daughter' },
};

/** The words prose uses for a character: {he} {him} {his} {himself} {lord} {man} {son}, written in the masculine and rendered for the character's sex. */
export const PRONOUN_VARS = Object.keys(PRONOUNS.male);

export function pronoun(sex: Sex, word: string): string | undefined {
  return PRONOUNS[sex][word];
}

// ---- characters named by a game's selectors (heir, spouse, eldest) ---------------------------

/** Fields every character path can read: heir.age, spouse.alive, eldest.attr.wits. */
export const CHARACTER_FIELDS = ['exists', 'name', 'first', 'sex', 'age', 'ageword', 'alive', 'temperament', 'upbringing', 'bond', 'legitimate', 'station', 'health', 'retired'];
export const CHARACTER_SUBPATHS = ['attr', 'skill', 'trait'];

export function isSelector(content: CoreContent, word: string): boolean {
  return !!gameOf(content).characterSelectors?.includes(word);
}

/** The character a selector names now, or undefined for nobody. */
export function selected(state: CoreState, content: CoreContent, selector: string): Character | undefined {
  const id = gameOf(content).selectCharacter?.(state, content, selector);
  return id ? state.characters[id] : undefined;
}

const WORDS = ['nought', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];

/** The value of <selector>.<field>[.<sub>] for the character named, with plain defaults for nobody. */
export function characterValue(state: CoreState, c: Character | undefined, field: string, sub?: string): Value {
  if (field === 'exists') return !!c;
  if (!c) return field === 'age' || field === 'bond' || field === 'health' || CHARACTER_SUBPATHS.includes(field) ? (field === 'trait' ? false : 0) : field === 'alive' || field === 'legitimate' || field === 'retired' ? false : 'none';
  switch (field) {
    case 'name': return c.name || 'the baby';
    case 'first': return (c.name || 'the baby').split(' ')[0];
    case 'sex': return c.sex;
    case 'age': return ageOfCharacter(state, c);
    case 'ageword': { const a = ageOfCharacter(state, c); return WORDS[a] ?? String(a); }
    case 'alive': return c.alive;
    case 'temperament': return c.temperament ?? 'none';
    case 'upbringing': return c.upbringing ?? 'none';
    case 'bond': return c.bond ?? 0;
    case 'legitimate': return c.legitimate !== false;
    case 'station': return c.station;
    case 'health': return c.health;
    case 'retired': return !!c.retired;
    case 'attr': return c.attributes[sub!] ?? 0;
    case 'skill': return c.skills[sub!] ?? 0;
    case 'trait': return c.traits.includes(sub!);
  }
  return undefined;
}

/** Static check of <selector>.<field>[.<sub>]: an error message or null. */
export function checkCharacterPath(content: CoreContent, path: string): string | null {
  const [, field, sub, extra] = path.split('.');
  if (extra !== undefined) return `too many segments in "${path}"`;
  if (field === undefined) return `incomplete path "${path}"`;
  if (CHARACTER_SUBPATHS.includes(field)) {
    if (sub === undefined) return `incomplete path "${path}"`;
    const known = field === 'attr' ? content.config.attributes : field === 'skill' ? content.config.skills : Object.keys(content.registry.traits);
    return known.includes(sub) ? null : `unknown ${field === 'attr' ? 'attribute' : field} in "${path}"`;
  }
  if (sub !== undefined) return `"${field}" takes no sub-path ("${path}")`;
  return CHARACTER_FIELDS.includes(field) ? null : `unknown character field in "${path}"`;
}
