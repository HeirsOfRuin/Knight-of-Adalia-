// Core content schema: the parts every game on this engine shares. A game composes its own
// schema from these pieces (src/content/schema.ts for Knight of Adalia): it adds its own
// effect ops, registries and start records, and passes its effect schema to makeSceneSchemas.
// Zod validates the YAML at build time; the inferred types are what the engine consumes.
import { z } from 'zod';

export const Id = z.string().regex(/^[a-z][a-z0-9_]*$/, 'ids are lower_snake_case');

// ---- Conditions -----------------------------------------------------------
// Authored as a string ("skill.diplomacy >= 4"), a list (all of), or
// { all: [...] } / { any: [...] } / { not: ... }.
export type CondInput = string | CondInput[] | { all: CondInput[] } | { any: CondInput[] } | { not: CondInput };
export const CondInputSchema: z.ZodType<CondInput> = z.lazy(() =>
  z.union([
    z.string(),
    z.array(CondInputSchema),
    z.object({ all: z.array(CondInputSchema) }).strict(),
    z.object({ any: z.array(CondInputSchema) }).strict(),
    z.object({ not: CondInputSchema }).strict(),
  ]),
);

// ---- Effects --------------------------------------------------------------
export const DelaySchema = z.object({ seasons: z.number().int().min(0) }).strict();
const NpcRef = z.string().regex(/^@?[a-z][a-z0-9_]*$/);

/** The effect ops the engine applies itself. A game adds its own (see GameModule.effects). */
export const CORE_EFFECTS = [
  z.object({ set: z.string() }).strict(), // set: flag.x
  z.object({ clear: z.string() }).strict(), // clear: flag.x
  z.object({ add: z.record(z.string(), z.number()) }).strict(), // numeric deltas
  z.object({ assign: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])) }).strict(),
  z.object({ trait: z.string().regex(/^[+-][a-z][a-z0-9_]*$/) }).strict(),
  z.object({ item: z.string().regex(/^[+-][a-z][a-z0-9_]*$/) }).strict(),
  z.object({ injury: Id }).strict(),
  z.object({ heal: Id }).strict(),
  z.object({ station: Id, track: Id.optional() }).strict(),
  z.object({ meet: NpcRef }).strict(),
  z.object({ kill: NpcRef }).strict(),
  z.object({ alias: z.record(Id, Id) }).strict(), // alias: { master: hamon_darrell }
  z.object({ join: NpcRef }).strict(), // npc joins his retinue
  // battle losses: unnamed men lost, and how many named followers (chosen at random) are killed
  z.object({ casualties: z.object({ men: z.number().int().min(0).default(0), named: z.number().int().min(0).default(0), spare: z.array(Id).default([]) }).strict() }).strict(),
  z.object({ leave: NpcRef }).strict(), // npc leaves it
  z.object({
    queue: z.object({ event: Id, delay: DelaySchema, earliest_chapter: z.string().optional() }).strict(), // chapter id
  }).strict(),
  z.object({ advance: DelaySchema }).strict(),
  // moves the calendar forward to a date, if it is behind it (dated scenes stay true whatever path led there)
  z.object({ catch_up: z.object({ year: z.number().int(), season: z.enum(['spring', 'summer', 'autumn', 'winter']) }).strict() }).strict(),
  z.object({ journal: z.string() }).strict(),
  z.object({ die: z.string() }).strict(), // only legal inside lethal choices (validator)
] as const;
const CoreBaseEffectSchema = z.union(CORE_EFFECTS);
export type CoreBaseEffect = z.infer<typeof CoreBaseEffectSchema>;
export const CORE_EFFECT_OPS: ReadonlySet<string> = new Set(CORE_EFFECTS.map((s) => Object.keys(s.shape)[0]!));

/** The conditional and chance wrappers around a game's effect union:
 * { if: cond, then: [...], else: [...] } and { chance: 30, then: [...], else: [...] }
 * (percent; for births, infant deaths and other luck the player cannot see). */
export function wrapEffects<E>(base: z.ZodType, self: () => z.ZodType<E>): z.ZodType<E> {
  return z.union([
    base,
    z.object({ if: CondInputSchema, then: z.array(z.lazy(self)), else: z.array(z.lazy(self)).optional() }).strict(),
    z.object({ chance: z.number().int().min(1).max(99), then: z.array(z.lazy(self)), else: z.array(z.lazy(self)).optional() }).strict(),
  ]) as unknown as z.ZodType<E>;
}

/** A game's own effect: one op key the engine hands to the game module. */
export type GameEffect = { [op: string]: unknown };
/** Any effect, as the engine sees it: its own ops, the wrappers, or a game's op. */
export type EffectLike =
  | CoreBaseEffect
  | { if: CondInput; then: EffectLike[]; else?: EffectLike[] }
  | { chance: number; then: EffectLike[]; else?: EffectLike[] }
  | GameEffect;

// ---- Navigation -----------------------------------------------------------
// next: a scene id, "@return" (resume after an interlude), or a pool draw.
export const PoolNextSchema = z.object({
  pool: Id, // pool group name
  count: z.number().int().min(1).max(3).default(1),
  then: Id,
}).strict();
const SimpleNextSchema = z.union([z.string(), PoolNextSchema]);
// switch: first branch whose condition holds, else default.
export const SwitchNextSchema = z.object({
  switch: z.array(z.object({ if: CondInputSchema, go: SimpleNextSchema }).strict()).min(1),
  default: SimpleNextSchema,
}).strict();
export const NextSchema = z.union([SimpleNextSchema, SwitchNextSchema]);
export type SimpleNext = z.infer<typeof SimpleNextSchema>;
export type Next = z.infer<typeof NextSchema>;

export const CheckSchema = z.object({
  attr: Id,
  skill: Id.optional(),
  difficulty: z.number().int(),
  // whose eyes are on him: the game module's audience modifier applies (GameModule.audience)
  audience: z.enum(['nobles', 'knights', 'commons', 'merchants', 'clergy', 'none']).default('none'),
  mods: z.array(z.object({ if: CondInputSchema, add: z.number().int(), label: z.string() }).strict()).default([]),
}).strict();
export type Check = z.infer<typeof CheckSchema>;
export type Audience = Check['audience'];

// a title page shown before a scene: every chapter's first scene (from config.chapter_cards) and the acts within one
export const CardSchema = z.object({ title: z.string(), subtitle: z.string().optional(), epigraph: z.string().optional() }).strict();
export type Card = z.infer<typeof CardSchema>;

/** Outcome, choice and scene schemas over a game's effect schema. */
export function makeSceneSchemas<E>(EffectSchema: z.ZodType<E>) {
  const OutcomeSchema = z.object({
    text: z.string().optional(),
    effects: z.array(EffectSchema).default([]),
    next: NextSchema.optional(),
  }).strict();

  const ChoiceSchema = z.object({
    id: Id,
    text: z.string(),
    tags: z.array(Id).default([]), // approach tags: martial, cunning, diplomacy, wealth, ...
    requires: CondInputSchema.optional(), // visible; shown locked with a label when unmet
    visible_if: CondInputSchema.optional(), // hidden when unmet
    label: z.string().optional(), // override for the auto-generated requirement label
    lethal: z.boolean().default(false),
    warn: z.string().optional(), // risk signal shown with the choice; required for lethal
    // Without a check: text/effects/next apply directly.
    text_after: z.string().optional(),
    effects: z.array(EffectSchema).default([]),
    next: NextSchema.optional(),
    // With a check: success/partial/failure outcomes. Partial falls back to failure.
    check: CheckSchema.optional(),
    success: OutcomeSchema.optional(),
    partial: OutcomeSchema.optional(),
    failure: OutcomeSchema.optional(),
  }).strict();

  const SceneSchema = z.object({
    id: Id,
    chapter: z.string(), // a config.chapters id, or test
    kind: z.enum(['spine', 'pool', 'queued', 'ending']).default('spine'),
    title: z.string().optional(),
    tags: z.array(Id).default([]),
    pool: Id.optional(), // pool group for kind: pool
    requires: CondInputSchema.optional(),
    weight: z.number().min(0).default(10),
    once: z.boolean().default(true),
    cooldown: DelaySchema.optional(),
    checkpoint: z.boolean().default(false),
    ending: Id.optional(), // for kind: ending
    card: CardSchema.optional(), // an act's title page (a chapter's comes from config.chapter_cards)
    text: z.string(),
    variants: z.record(Id, z.string()).optional(), // variant key (GameModule.variantKey) -> replacement text
    on_enter: z.array(EffectSchema).default([]),
    choices: z.array(ChoiceSchema).default([]),
  }).strict();

  return { OutcomeSchema, ChoiceSchema, SceneSchema };
}

// The engine's own view of scenes: the same schemas over any effect.
const CoreScenes = makeSceneSchemas(z.custom<EffectLike>());
export type Outcome = z.infer<typeof CoreScenes.OutcomeSchema>;
export type Choice = z.infer<typeof CoreScenes.ChoiceSchema>;
export type Scene = z.infer<typeof CoreScenes.SceneSchema>;

// ---- Registries -----------------------------------------------------------
export const FlagDefSchema = z.object({
  description: z.string(),
  hidden: z.boolean().default(false),
  // chapter that will read this flag; suppresses "never read" until that chapter exists
  later: z.string().optional(),
}).strict();
export const NpcDefSchema = z.object({
  name: z.string(),
  title: z.string().optional(),
  faction: Id.optional(),
  station: Id.optional(),
  traits: z.array(Id).default([]),
  tags: z.array(Id).default([]), // e.g. rising_man, romance
  affection: z.number().int().default(0),
  respect: z.number().int().default(0),
  notes: z.string().optional(),
  // People page: entries appear once their condition holds (or once met, if no condition)
  codex: z.array(z.object({ if: CondInputSchema.optional(), text: z.string() }).strict()).default([]),
}).strict();
export const LoreDefSchema = z.object({
  title: z.string(),
  category: z.enum(['places', 'powers', 'people', 'customs', 'money', 'war', 'faith']),
  if: CondInputSchema.optional(), // shown once this holds; omitted = known from the start
  text: z.string(),
}).strict();
export const TraitDefSchema = z.object({
  label: z.string(),
  description: z.string(),
  mods: z.record(z.string(), z.number()).default({}), // e.g. attr.presence: -1
}).strict();
export const InjuryDefSchema = z.object({
  label: z.string(),
  description: z.string(),
  mods: z.record(z.string(), z.number()).default({}),
  heals_after: z.number().int().optional(), // seasons; omitted = permanent
  serious: z.boolean().default(false), // counts for the death rule (`injured`)
  scar: Id.optional(), // trait granted when it heals (or immediately if permanent)
}).strict();
export const ItemDefSchema = z.object({
  label: z.string(),
  description: z.string(),
  mods: z.record(z.string(), z.number()).default({}),
  magic: z.boolean().default(false),
  armour: z.number().int().min(0).max(3).default(0), // 1 light (jack), 2 full harness
}).strict();
export const FactionDefSchema = z.object({
  label: z.string(),
  kind: z.enum(['faction', 'personal']),
}).strict();
export const EndingDefSchema = z.object({
  label: z.string(),
  description: z.string(),
  // chapter whose content must exist before the validator demands reachability
  chapter: z.string(),
  // the "to be continued" line on the ending page: what the house carries into the next story
  sequel: z.string().optional(),
}).strict();

// A place on the world map (registry/places.yaml); x, y in tiles of the generated world (worldgen.ts).
export const PlaceDefSchema = z.object({
  name: z.string(),
  x: z.number().int().min(0),
  y: z.number().int().min(0),
  kind: z.enum(['city', 'town', 'castle', 'manor', 'abbey', 'port', 'battle', 'region', 'sea']),
  region: z.string(),
  text: z.string(),
  if: CondInputSchema.optional(), // when he knows of it; omitted = from the start
}).strict();
export type PlaceDef = z.infer<typeof PlaceDefSchema>;

/** The registries the engine reads. A game's registry schema spreads these and adds its own. */
export const CORE_REGISTRY = {
  flags: z.record(Id, FlagDefSchema),
  npcs: z.record(Id, NpcDefSchema),
  traits: z.record(Id, TraitDefSchema),
  injuries: z.record(Id, InjuryDefSchema),
  items: z.record(Id, ItemDefSchema),
  factions: z.record(Id, FactionDefSchema),
  endings: z.record(Id, EndingDefSchema),
  lore: z.record(Id, LoreDefSchema).default({}),
  places: z.record(Id, PlaceDefSchema).default({}),
};
const CoreRegistrySchema = z.object(CORE_REGISTRY);
export type CoreRegistry = z.infer<typeof CoreRegistrySchema>;

export const ConfigSchema = z.object({
  title: z.string(),
  start_year: z.number().int(),
  regnal_king: z.string(),
  // later reigns: dates count from 1 again from the first year of each (internal years stay continuous)
  reigns: z.array(z.object({ king: z.string(), from_year: z.number().int(), from_scene: z.string().optional() }).strict()).default([]),
  attributes: z.array(Id),
  skills: z.array(Id),
  stations: z.array(Id),
  tracks: z.array(Id),
  seasons: z.array(Id).length(4),
  chapters: z.array(z.string()),
  in_progress: z.array(z.string()).default([]), // chapters still being written: 'later' flags for them stay quiet
  // counters the player may see named in a choice's stakes line (e.g. sl_edge: the battle); others stay hidden
  counter_labels: z.record(z.string(), z.string()).default({}),
  // named NPC slots ("@master") whose occupant is decided during play
  aliases: z.array(Id).default([]),
  // title pages shown before the first scene of each chapter
  chapter_cards: z.record(z.string(), CardSchema).default({}),
}).strict();
export type Config = z.infer<typeof ConfigSchema>;

/** What the engine needs of a content bundle. A game's bundle extends it. */
export interface CoreContent {
  hash: string;
  /** the game module id (GameModule.id) that supplies this content's own rules; registered with registerGame */
  game: string;
  config: Config;
  registry: CoreRegistry;
  scenes: Record<string, Scene>;
  /** source file per scene id, for validator messages */
  sources: Record<string, string>;
  /** where each scene happens, for the world map */
  map?: { scenes: Record<string, string> };
}
