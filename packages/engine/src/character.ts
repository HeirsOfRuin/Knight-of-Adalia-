// Characters: the hero, and anyone who may become the hero. Pronouns and ages for prose.
import type { Character, CoreState, Sex } from './state';

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
