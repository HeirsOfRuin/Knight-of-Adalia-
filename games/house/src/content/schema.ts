// House of Adalia's content schema: the engine's core schema plus this game's frames (where the
// West stands), sovereigns (who rules it), openings (the six starts) and the west effect.
// See games/house/docs/FRAME.md, sections 2 and 7.
import { z } from 'zod';
import { CORE_EFFECTS, CORE_REGISTRY, Id, makeSceneSchemas, wrapEffects, type CondInput, type CoreContent } from '@engine/schema';

export { CondInputSchema, ConfigSchema } from '@engine/schema';
export type { CondInput, Config } from '@engine/schema';

/** Where the West stands: a free realm (crowned or ducal), Adalia's, or divided between the two kings. */
export const FRAMES = ['free', 'adalian', 'partitioned'] as const;
export const FrameId = z.enum(FRAMES);
export type Frame = (typeof FRAMES)[number];

// ---- Effects --------------------------------------------------------------
export const HOUSE_EFFECTS = [
  // the West changes hands: a new frame, a new sovereign, or both (FRAME.md §2, "The frame can change")
  z.object({ west: z.object({ frame: FrameId.optional(), sovereign: Id.optional() }).strict() }).strict(),
] as const;
const BaseEffectSchema = z.union([...CORE_EFFECTS, ...HOUSE_EFFECTS]);
export type BaseEffect = z.infer<typeof BaseEffectSchema>;
export type CondEffect = { if: CondInput; then: Effect[]; else?: Effect[] };
export type ChanceEffect = { chance: number; then: Effect[]; else?: Effect[] };
export type Effect = BaseEffect | CondEffect | ChanceEffect;
export const EffectSchema: z.ZodType<Effect> = z.lazy(() => wrapEffects<Effect>(BaseEffectSchema, () => EffectSchema));

// ---- Scenes ---------------------------------------------------------------
// frames: the frames a scene is written for; omitted means all three (the validator then
// requires its text to hold in each, FRAME.md §7)
export const { OutcomeSchema, ChoiceSchema, SceneSchema } = makeSceneSchemas(EffectSchema, { frames: z.array(FrameId).min(1).optional() });
export type Outcome = z.infer<typeof OutcomeSchema>;
export type Choice = z.infer<typeof ChoiceSchema>;
export type Scene = z.infer<typeof SceneSchema>;

// ---- Registries -----------------------------------------------------------
export const FrameDefSchema = z.object({
  label: z.string(), // "A free West"
  summary: z.string(),
  assembly: z.string(), // {realm.assembly}: who the lords answer to in council
  border: z.string(), // {realm.border}: the border that matters
  law: z.string(), // {realm.law}: the law of succession the frame starts with
  // phrases true only in this frame; the validator and continuity checker hold every scene to them
  bound: z.array(z.string()).default([]),
}).strict();
export type FrameDef = z.infer<typeof FrameDefSchema>;

export const SovereignDefSchema = z.object({
  frame: FrameId,
  style: z.string(), // {realm.sovereign} and the date line: a passage ("Queen Mahaut")
  capital: z.string(), // {realm.capital}
  reign_from: z.number().int(), // regnal year (continuous, counted from Aldred II) the reign is dated from
}).strict();
export type SovereignDef = z.infer<typeof SovereignDefSchema>;

export const RegistrySchema = z.object({
  flags: CORE_REGISTRY.flags,
  npcs: CORE_REGISTRY.npcs,
  traits: CORE_REGISTRY.traits,
  injuries: CORE_REGISTRY.injuries,
  items: CORE_REGISTRY.items,
  factions: CORE_REGISTRY.factions,
  endings: CORE_REGISTRY.endings,
  lore: CORE_REGISTRY.lore,
  places: CORE_REGISTRY.places,
  frames: z.record(FrameId, FrameDefSchema),
  sovereigns: z.record(Id, SovereignDefSchema),
});
export type Registry = z.infer<typeof RegistrySchema>;

// ---- Openings -------------------------------------------------------------
const StatBlock = z.record(Id, z.number().int());
/** A start: one of Knight of Adalia's endings, played fresh or imported (FRAME.md §4). */
export const OpeningSchema = z.object({
  id: Id,
  label: z.string(),
  summary: z.string(),
  // the Knight of Adalia ending this opening continues (dynasty export ending.id)
  from_ending: Id,
  frames: z.array(FrameId).min(1),
  // the sovereigns a fresh start may pick, per frame (the first is the default)
  sovereigns: z.partialRecord(FrameId, z.array(Id).min(1)),
  start_scene: Id,
  // the founder in a fresh start
  founder: z.object({
    age: z.number().int(),
    station: Id,
    attributes: StatBlock,
    skills: StatBlock,
    coin: z.number().int(), // pence
    renown: z.number().int().default(0),
    men: z.number().int().default(0),
  }).strict(),
}).strict();
export type Opening = z.infer<typeof OpeningSchema>;

/** The game module id this content belongs to (src/game/module.ts). */
export const GAME_ID = 'house';

export interface ContentBundle extends CoreContent {
  registry: Registry;
  openings: Record<string, Opening>;
  scenes: Record<string, Scene>;
}
