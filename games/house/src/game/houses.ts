// The great houses (PLAN.md §4.3-4.4): the player's house's standing, derived from what it holds, and the rival
// houses as state (registry/houses.yaml). Content reads rival.<id>.temper|standing|claim and house.standing, and
// moves a rival with add: { rival.<id>.temper: n }. There is no AI: rivals act through scenes gated on their state.
import type { ContentBundle } from '../content/schema';
import type { HouseState } from './state';
import { holdingsIncome, manorRent, DUES_PER_FEE } from './economy';

export interface RivalState { standing: number; temper: number; claim: number }
export const RIVAL_FIELDS = ['standing', 'temper', 'claim'] as const;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Every rival house at its opening's start (begin, and saves made before the houses were state). */
export function startHouses(content: ContentBundle, opening: string): Record<string, RivalState> {
  return Object.fromEntries(Object.entries(content.registry.houses).map(([id, h]) => [id, { ...h.start, ...h.openings[opening] }]));
}

/** A rival's state, filled in for a save that predates it. */
export function rival(s: HouseState, content: ContentBundle, id: string): RivalState | undefined {
  if (!content.registry.houses[id]) return undefined;
  s.houses ??= startHouses(content, s.opening);
  return (s.houses[id] ??= { ...content.registry.houses[id]!.start });
}

export function addRival(s: HouseState, content: ContentBundle, id: string, field: string, delta: number): number {
  const r = rival(s, content, id);
  if (!r || !(RIVAL_FIELDS as readonly string[]).includes(field)) throw new Error(`add: unknown rival path rival.${id}.${field}`);
  const f = field as keyof RivalState;
  const before = r[f];
  r[f] = field === 'temper' ? clamp(before + delta, -10, 10) : field === 'claim' ? clamp(before + delta, 0, 3) : clamp(before + delta, 0, 100);
  return r[f] - before;
}

/** Who heads a rival house now (its heads in order, each until the year it ends). */
export function headOf(s: HouseState, content: ContentBundle, id: string): string | undefined {
  const year = content.config.start_year + Math.floor(s.time / 4);
  return content.registry.houses[id]?.heads.find((h) => h.until === undefined || year < h.until)?.npc;
}

/** Michaelmas for the rival houses: a rising house rises. */
export function housesYear(s: HouseState, content: ContentBundle): void {
  for (const [id, h] of Object.entries(content.registry.houses)) {
    const r = rival(s, content, id)!;
    if (h.rising && r.standing < h.rising.to) r.standing = Math.min(h.rising.to, r.standing + h.rising.per_year);
  }
}

const STATION_WEIGHT: Record<string, number> = { royal: 15, great_lord: 8, lord: 4, knight: 1 };

/**
 * The house's standing, 0-100 (PLAN.md §4.3): what it holds, worked out fresh whenever it is read.
 *   income      up to 40: a point for each £10 a year (rents, holdings, knights' dues)
 *   men         up to 15: a point for each ten under the banner
 *   knights     up to 15: a point and a quarter for each knight who holds of the house
 *   renown      up to 15: a point for each three
 *   rank        up to 15: a crown 15, a great lord 8, a lord 4, a knight 1
 */
export function standingOf(s: HouseState): number {
  const income = manorRent(s) + holdingsIncome(s) + (s.vassals?.length ?? 0) * DUES_PER_FEE;
  const men = (s.res.men ?? 0) + (s.res.garrison ?? 0);
  const parts = [
    Math.min(40, Math.floor(income / 2400)),
    Math.min(15, Math.floor(men / 10)),
    Math.min(15, Math.floor((s.vassals?.length ?? 0) * 1.25)),
    Math.min(15, Math.floor((s.res.renown ?? 0) / 3)),
    STATION_WEIGHT[s.characters[s.hero]?.station ?? ''] ?? 0,
  ];
  return clamp(parts.reduce((a, b) => a + b, 0), 0, 100);
}

/** PLAN.md §4.3's words for standing. */
export const standingWord = (n: number) => (n >= 80 ? 'the greatest in the West' : n >= 60 ? 'one of the great houses' : n >= 40 ? 'a great house' : n >= 20 ? 'a house of the West' : 'a small house');

/** A rival's temper toward the house, in words. */
export const temperWord = (n: number) => (n >= 6 ? 'a friend' : n >= 3 ? 'friendly' : n >= 1 ? 'civil' : n >= -2 ? 'watchful' : n >= -5 ? 'aggrieved' : 'an enemy');

/** A claim, in words. */
export const claimWord = (n: number) => ['none', 'a thin claim', 'a claim', 'a strong claim'][n] ?? 'a claim';
