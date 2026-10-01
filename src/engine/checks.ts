// Skill checks. computeOdds is the only place odds are derived: the UI band
// and the resolution both come from it.
import type { Check, ContentBundle } from '../content/schema';
import type { GameState } from './state';
import { effectiveAttr, effectiveSkill } from './paths';
import { audienceModifier } from './station';
import { test } from './conditions';
import type { RngCursor } from './rng';

export type Band = 'Risky' | 'Even' | 'Favorable';
export type CheckResult = 'success' | 'partial' | 'failure';

export const PARTIAL_WIDTH = 0.15;

export interface Odds {
  score: number; // attr + skill + mods - difficulty
  success: number; // probability of full success
  partial: number; // probability of partial success
  band: Band;
  breakdown: { label: string; value: number }[];
}

export function bandFor(p: number): Band {
  if (p < 0.4) return 'Risky';
  if (p <= 0.65) return 'Even';
  return 'Favorable';
}

/** hasPartial: the choice defines a partial outcome. Without one, there is no partial band. */
export function computeOdds(check: Check, state: GameState, content: ContentBundle, hasPartial = true): Odds {
  const breakdown: { label: string; value: number }[] = [];
  const attr = effectiveAttr(state, content, check.attr);
  breakdown.push({ label: check.attr, value: attr });
  if (check.skill) breakdown.push({ label: check.skill, value: effectiveSkill(state, content, check.skill) });
  const aud = audienceModifier(state, content, check.audience);
  if (aud) breakdown.push({ label: aud < 0 ? 'his origins' : 'one of their own', value: aud });
  if (state.health <= 3) breakdown.push({ label: 'poor health', value: -1 });
  for (const m of check.mods) if (test(m.if, state, content)) breakdown.push({ label: m.label, value: m.add });
  breakdown.push({ label: 'difficulty', value: -check.difficulty });
  const score = breakdown.reduce((s, b) => s + b.value, 0);
  const success = Math.min(0.95, Math.max(0.05, 0.5 + 0.1 * score));
  const partial = hasPartial ? Math.min(PARTIAL_WIDTH, 1 - success) : 0;
  return { score, success, partial, band: bandFor(success), breakdown };
}

export function resolveCheck(odds: Odds, rng: RngCursor, force?: CheckResult): CheckResult {
  const roll = rng.float(); // always draw, so forcing does not shift later rolls
  if (force) return force;
  if (roll < odds.success) return 'success';
  if (roll < odds.success + odds.partial) return 'partial';
  return 'failure';
}
