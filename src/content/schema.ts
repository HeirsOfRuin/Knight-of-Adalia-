// Content schema. Single source of truth for authored data: Zod validates the
// YAML at build time and the inferred types are what the engine consumes.
import { z } from 'zod';

const Id = z.string().regex(/^[a-z][a-z0-9_]*$/, 'ids are lower_snake_case');

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
const Delay = z.object({ seasons: z.number().int().min(0) }).strict();
const BaseEffectSchema = z.union([
  z.object({ set: z.string() }).strict(), // set: flag.x
  z.object({ clear: z.string() }).strict(), // clear: flag.x
  z.object({ add: z.record(z.string(), z.number()) }).strict(), // numeric deltas
  z.object({ assign: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])) }).strict(),
  z.object({ trait: z.string().regex(/^[+-][a-z][a-z0-9_]*$/) }).strict(),
  z.object({ item: z.string().regex(/^[+-][a-z][a-z0-9_]*$/) }).strict(),
  z.object({ injury: Id }).strict(),
  z.object({ heal: Id }).strict(),
  z.object({ station: Id, track: Id.optional() }).strict(),
  z.object({ meet: z.string().regex(/^@?[a-z][a-z0-9_]*$/) }).strict(),
  z.object({ kill: z.string().regex(/^@?[a-z][a-z0-9_]*$/) }).strict(),
  z.object({ alias: z.record(Id, Id) }).strict(), // alias: { master: hamon_darrell }
  z.object({ join: z.string().regex(/^@?[a-z][a-z0-9_]*$/) }).strict(), // npc joins his retinue
  // battle losses: unnamed men lost, and how many named followers (chosen at random) are killed
  z.object({ casualties: z.object({ men: z.number().int().min(0).default(0), named: z.number().int().min(0).default(0), spare: z.array(Id).default([]) }).strict() }).strict(),
  z.object({ leave: z.string().regex(/^@?[a-z][a-z0-9_]*$/) }).strict(), // npc leaves it
  z.object({
    queue: z.object({ event: Id, delay: Delay, earliest_chapter: z.string().optional() }).strict(), // chapter id
  }).strict(),
  z.object({ advance: Delay }).strict(),
  // moves the calendar forward to a date, if it is behind it (dated scenes stay true whatever path led there)
  z.object({ catch_up: z.object({ year: z.number().int(), season: z.enum(['spring', 'summer', 'autumn', 'winter']) }).strict() }).strict(),
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
  z.object({ release: Id }).strict(),
  z.object({ journal: z.string() }).strict(),
  z.object({ die: z.string() }).strict(), // only legal inside lethal choices (validator)
]);
export type BaseEffect = z.infer<typeof BaseEffectSchema>;
/** Conditional effect: { if: cond, then: [...], else: [...] } */
export type CondEffect = { if: CondInput; then: Effect[]; else?: Effect[] };
/** Seeded chance: { chance: 30, then: [...], else: [...] } (percent; for births, infant deaths and other luck the player cannot see) */
export type ChanceEffect = { chance: number; then: Effect[]; else?: Effect[] };
export type Effect = BaseEffect | CondEffect | ChanceEffect;
export const EffectSchema: z.ZodType<Effect> = z.lazy(() =>
  z.union([
    BaseEffectSchema,
    z.object({ if: CondInputSchema, then: z.array(EffectSchema), else: z.array(EffectSchema).optional() }).strict(),
    z.object({ chance: z.number().int().min(1).max(99), then: z.array(EffectSchema), else: z.array(EffectSchema).optional() }).strict(),
  ]),
);

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

export const OutcomeSchema = z.object({
  text: z.string().optional(),
  effects: z.array(EffectSchema).default([]),
  next: NextSchema.optional(),
}).strict();
export type Outcome = z.infer<typeof OutcomeSchema>;

export const CheckSchema = z.object({
  attr: Id,
  skill: Id.optional(),
  difficulty: z.number().int(),
  // whose eyes are on him: applies the "new man" prejudice modifier
  audience: z.enum(['nobles', 'knights', 'commons', 'merchants', 'clergy', 'none']).default('none'),
  mods: z.array(z.object({ if: CondInputSchema, add: z.number().int(), label: z.string() }).strict()).default([]),
}).strict();
export type Check = z.infer<typeof CheckSchema>;

export const ChoiceSchema = z.object({
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
export type Choice = z.infer<typeof ChoiceSchema>;

// a title page shown before a scene: every chapter's first scene (from config.chapter_cards) and the acts within one
export const CardSchema = z.object({ title: z.string(), subtitle: z.string().optional(), epigraph: z.string().optional() }).strict();
export type Card = z.infer<typeof CardSchema>;

export const SceneSchema = z.object({
  id: Id,
  chapter: z.string(), // prologue | ch1..ch5 | test
  kind: z.enum(['spine', 'pool', 'queued', 'ending']).default('spine'),
  title: z.string().optional(),
  tags: z.array(Id).default([]),
  pool: Id.optional(), // pool group for kind: pool
  requires: CondInputSchema.optional(),
  weight: z.number().min(0).default(10),
  once: z.boolean().default(true),
  cooldown: Delay.optional(),
  checkpoint: z.boolean().default(false),
  ending: Id.optional(), // for kind: ending
  card: CardSchema.optional(), // an act's title page (a chapter's comes from config.chapter_cards)
  text: z.string(),
  variants: z.record(Id, z.string()).optional(), // background id -> replacement text
  on_enter: z.array(EffectSchema).default([]),
  choices: z.array(ChoiceSchema).default([]),
}).strict();
export type Scene = z.infer<typeof SceneSchema>;

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

export const HoldingDefSchema = z.object({
  label: z.string(),
  region: z.enum(['adalia', 'west']),
  description: z.string(),
}).strict();

// A place on the world map (registry/places.yaml); x, y in tiles of content/map/world.txt.
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

export const RegistrySchema = z.object({
  flags: z.record(Id, FlagDefSchema),
  npcs: z.record(Id, NpcDefSchema),
  traits: z.record(Id, TraitDefSchema),
  injuries: z.record(Id, InjuryDefSchema),
  items: z.record(Id, ItemDefSchema),
  factions: z.record(Id, FactionDefSchema),
  endings: z.record(Id, EndingDefSchema),
  romances: z.record(Id, RomanceDefSchema).default({}),
  lore: z.record(Id, LoreDefSchema).default({}),
  holdings: z.record(Id, HoldingDefSchema).default({}),
  places: z.record(Id, PlaceDefSchema).default({}),
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

export interface ContentBundle {
  hash: string;
  config: Config;
  registry: Registry;
  backgrounds: Record<string, Background>;
  scenes: Record<string, Scene>;
  /** source file per scene id, for validator messages */
  sources: Record<string, string>;
  /** where each scene happens, for the world map (content/map/scene-places.yaml; terrain is src/engine/worldgen.ts) */
  map?: { scenes: Record<string, string> };
}
