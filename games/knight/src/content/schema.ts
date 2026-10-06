// Knight of Adalia's content schema: the engine's core schema (packages/engine/src/schema.ts)
// plus this game's own effect ops, registries (romances, holdings) and backgrounds. Single
// source of truth for authored data: Zod validates the YAML at build time and the inferred
// types are what the engine and the game module (src/game/module.ts) consume.
import { z } from 'zod';
import {
  CORE_EFFECTS, CORE_REGISTRY, Id, makeSceneSchemas, wrapEffects,
  type CondInput, type CoreContent,
} from '@engine/schema';

export {
  CondInputSchema, PoolNextSchema, SwitchNextSchema, NextSchema, CheckSchema, CardSchema,
  FlagDefSchema, NpcDefSchema, LoreDefSchema, TraitDefSchema, InjuryDefSchema, ItemDefSchema,
  FactionDefSchema, EndingDefSchema, PlaceDefSchema, ConfigSchema,
} from '@engine/schema';
export type { CondInput, SimpleNext, Next, Check, Card, PlaceDef, Config } from '@engine/schema';

// ---- Effects --------------------------------------------------------------
/** This game's own effect ops, applied by its module (src/game/module.ts). */
export const KNIGHT_EFFECTS = [
  z.object({ found_estate: z.record(z.string(), z.number()) }).strict(), // creates state.estate (Ch3)
  z.object({ lose_share: z.record(z.string(), z.number()) }).strict(), // estate.<field>: percent lost (plague, famine)
  // ordinary drill: { train: { arms: 1 } } raises a skill only up to a ceiling (default 4; a mentor sets a higher one;
  // quiet: 1 suppresses the 'no further' note, for learning on the job).
  // Past the ceiling a physical skill's effort goes into the body instead (once per attribute).
  z.object({ train: z.record(z.string(), z.number().int()) }).strict(),
  // heirs (Ch3+): a birth draws son or daughter with the seeded RNG unless given; name_heir names the newest unnamed child
  z.object({ birth: z.enum(['random', 'son', 'daughter']) }).strict(),
  z.object({ name_heir: z.string().min(1) }).strict(),
  z.object({ heir_dies: z.enum(['last', 'eldest', 'second', 'third']) }).strict(),
  // heirs' growth (Ch4): which child, and what to set. temperament 'random' fills only an unset temperament.
  z.object({ heir_set: z.object({ which: z.enum(['eldest', 'second', 'third', 'last', 'all']), temperament: z.string().optional(), upbringing: z.string().optional() }).strict() }).strict(),
  // other holdings (Ch4): a manor beyond the first, kept as income (pence a year) and temper (-5..5)
  z.object({ hold: z.object({ id: Id, income: z.number().int(), temper: z.number().int().default(0) }).strict() }).strict(),
  // knights who come to hold land of him (registry/vassals.yaml): the next unused names of a region
  z.object({ vassals: z.object({ add: z.number().int().positive(), region: z.enum(['adalia', 'west']) }).strict() }).strict(),
  z.object({ release: Id }).strict(),
] as const;
const BaseEffectSchema = z.union([...CORE_EFFECTS, ...KNIGHT_EFFECTS]);
export type BaseEffect = z.infer<typeof BaseEffectSchema>;
/** Conditional effect: { if: cond, then: [...], else: [...] } */
export type CondEffect = { if: CondInput; then: Effect[]; else?: Effect[] };
/** Seeded chance: { chance: 30, then: [...], else: [...] } (percent; for births, infant deaths and other luck the player cannot see) */
export type ChanceEffect = { chance: number; then: Effect[]; else?: Effect[] };
export type Effect = BaseEffect | CondEffect | ChanceEffect;
export const EffectSchema: z.ZodType<Effect> = z.lazy(() => wrapEffects<Effect>(BaseEffectSchema, () => EffectSchema));

// ---- Scenes ---------------------------------------------------------------
export const { OutcomeSchema, ChoiceSchema, SceneSchema } = makeSceneSchemas(EffectSchema);
export type Outcome = z.infer<typeof OutcomeSchema>;
export type Choice = z.infer<typeof ChoiceSchema>;
export type Scene = z.infer<typeof SceneSchema>;

// ---- Registries -----------------------------------------------------------
// A wife's own voice at the recurring moments of a marriage. Scenes write {wife.<moment>}, which
// renders the current wife's line (a passage: conditions and variables allowed). The stage says
// from when a moment can happen, so a wife married later needs only the later moments.
export const WIFE_MOMENTS = {
  first_year: 'ch3', lying_in: 'ch3', fever: 'ch3', farewell: 'ch3',
  home: 'ch4a', letter: 'ch4a', third: 'ch4a',
  writ: 'ch4b',
  muster: 'ch5', old: 'ch5', epilogue: 'ch5',
} as const;
export type WifeMoment = keyof typeof WIFE_MOMENTS;
export const MARRIAGE_STAGES = ['ch3', 'ch4a', 'ch4b', 'ch5'] as const;

export const RomanceDefSchema = z.object({
  npc: Id,
  introduced: z.string(),
  hidden: z.boolean().default(false),
  brings: z.string(),
  obstacle: z.string(),
  // the stage at which this match can become a marriage (ch4a: Ch4 Acts I-II, ch4b: Acts III-IV)
  married_in: z.enum(MARRIAGE_STAGES).default('ch3'),
  voice: z.record(z.string(), z.string()).default({}),
}).strict();

export const VassalDefSchema = z.object({ name: z.string(), seat: z.string(), region: z.enum(['adalia', 'west']) }).strict();
export type VassalDef = z.infer<typeof VassalDefSchema>;

export const HoldingDefSchema = z.object({
  label: z.string(),
  region: z.enum(['adalia', 'west']),
  description: z.string(),
}).strict();

export const RegistrySchema = z.object({
  flags: CORE_REGISTRY.flags,
  npcs: CORE_REGISTRY.npcs,
  traits: CORE_REGISTRY.traits,
  injuries: CORE_REGISTRY.injuries,
  items: CORE_REGISTRY.items,
  factions: CORE_REGISTRY.factions,
  endings: CORE_REGISTRY.endings,
  romances: z.record(Id, RomanceDefSchema).default({}),
  lore: CORE_REGISTRY.lore,
  holdings: z.record(Id, HoldingDefSchema).default({}),
  places: CORE_REGISTRY.places,
  vassals: z.record(Id, VassalDefSchema).default({}),
});
export type Registry = z.infer<typeof RegistrySchema>;

// ---- Backgrounds ----------------------------------------------------------
const StatBlock = z.record(Id, z.number().int());
export const BackgroundSchema = z.object({
  id: Id,
  label: z.string(),
  summary: z.string(),
  asset: z.string(),
  liability: z.string(),
  start_scene: Id,
  start_age: z.number().int(),
  attributes: StatBlock,
  skills: StatBlock,
  traits: z.array(Id).default([]),
  items: z.array(Id).default([]),
  coin: z.number().int(), // pence
  flags: z.array(Id).default([]),
  // one flag from each list is chosen by the seeded RNG at game start
  random_flags: z.array(z.array(Id).min(2)).default([]),
  aliases: z.record(Id, Id).default({}), // starting aliases, e.g. rival: wat_coker
  relationships: z.record(Id, z.object({ affection: z.number().int().default(0), respect: z.number().int().default(0) }).strict()).default({}),
  roles: z.record(Id, z.object({ label: z.string(), skills: StatBlock, flags: z.array(Id).default([]) }).strict()).optional(),
  prejudice: z.object({ base: z.number().int(), knights: z.number().int().default(0) }).strict(),
  rep: z.record(Id, z.number().int()).default({}),
}).strict();
export type Background = z.infer<typeof BackgroundSchema>;

/** The game module id this content belongs to (src/game/module.ts). */
export const GAME_ID = 'knight';

export interface ContentBundle extends CoreContent {
  registry: Registry;
  backgrounds: Record<string, Background>;
  scenes: Record<string, Scene>;
}
