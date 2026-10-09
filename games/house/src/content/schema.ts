// House of Adalia's content schema: the engine's core schema plus this game's frames (where the
// West stands), sovereigns (who rules it), openings (the six starts) and the west effect.
// See games/house/docs/FRAME.md, sections 2 and 7.
import { z } from 'zod';
import { CORE_EFFECTS, CORE_REGISTRY, CondInputSchema, Id, makeSceneSchemas, wrapEffects, type CondInput, type CoreContent } from '@engine/schema';

export { CondInputSchema, ConfigSchema } from '@engine/schema';
export { Id };
export type { CondInput, Config } from '@engine/schema';

/** Where the West stands: a free realm (crowned or ducal), Adalia's, or divided between the two kings. */
export const FRAMES = ['free', 'adalian', 'partitioned'] as const;
export const FrameId = z.enum(FRAMES);
export type Frame = (typeof FRAMES)[number];

// ---- Effects --------------------------------------------------------------
/** The law the house's headship passes by (PLAN.md §4.2). */
// eldest: the eldest child of either sex (the custom Knight of Adalia's Crowned ending promises the West's new crown)
export const HOUSE_LAWS = ['male_line', 'male_preference', 'partible', 'eldest'] as const;
export const HouseLawId = z.enum(HOUSE_LAWS);
export type HouseLaw = (typeof HOUSE_LAWS)[number];
/** A character, named by one of the game's selectors (src/game/family.ts SELECTORS). */
const Who = Id;

export const HOUSE_EFFECTS = [
  // the West changes hands: a new frame, a new sovereign, or both (FRAME.md §2, "The frame can change")
  z.object({ west: z.object({ frame: FrameId.optional(), sovereign: Id.optional() }).strict() }).strict(),
  // ---- the purse (economy.ts) ----
  // a holding gained or improved: income in pence a year; kind says what moves it (rents, trade, or a fixed fee)
  z.object({ hold: z.object({ id: Id, name: z.string(), income: z.number().int(), kind: z.enum(['land', 'trade', 'fixed']).optional() }).strict() }).strict(),
  // borrow from the Lanzi (pence, at 10% a year); a negative sum repays, as far as the purse and the debt allow
  z.object({ borrow: z.number().int() }).strict(),
  // the realm goes to war with someone, or makes peace (none): trade suffers and the march is raided while it lasts
  z.object({ war: z.string() }).strict(),
  // ---- the family (PLAN.md §4.1-4.2) ----
  // a child of the head and the head's spouse, or of who and their spouse; sex drawn unless given
  z.object({ birth: z.object({ of: Who.optional(), sex: z.enum(['male', 'female']).optional() }).strict() }).strict(),
  // names the newest unnamed child (or who): after a grandparent, after a parent, or a name from the house's culture
  z.object({ name_child: z.object({ who: Who.optional(), style: z.enum(['grandparent', 'parent', 'culture']), }).strict() }).strict(),
  // a match for who, with a spouse generated from a culture's names; to: the spouse's house
  z.object({ marry: z.object({ who: Who, culture: Id.default('adalian'), to: z.string().optional(), name: z.string().optional() }).strict() }).strict(), // name: a spouse the story names (Ronan de Penhoët)
  // who dies, narrated by the scene this is in; the head's death queues the succession
  z.object({ death: z.object({ who: Who, cause: z.string() }).strict() }).strict(),
  // the head names an heir by will (contested at the succession if the law says otherwise); none clears it
  z.object({ designate: Who }).strict(),
  z.object({ house_law: HouseLawId }).strict(),
  // the Church makes a bastard legitimate
  z.object({ legitimate: Who }).strict(),
  // the head gives up the headship alive (a religious house, abdication)
  z.object({ step_down: z.string() }).strict(),
  // the succession itself: the law's heir, or the heir named (will) when the player backs the will
  z.object({ succeed: z.object({ heir: Who.optional() }).strict() }).strict(),
  z.object({ upbringing: z.object({ who: Who, set: Id }).strict() }).strict(),
  // the news scene (h_q_news) takes the next piece of news as it opens: news.* and family.news read it
  z.object({ take_news: z.literal(true) }).strict(),
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

// The odds of a life, in percent a year (PLAN.md §4.1). Tuned with npm run house:life.
export const LifeSchema = z.object({
  // yearly chance of death by age: the first band whose `to` (age, inclusive) covers the age
  mortality: z.array(z.object({ to: z.number().int(), p: z.number() }).strict()).min(1),
  childbed: z.number(), // chance the mother dies, per birth
  fertility: z.object({ from: z.number().int(), to: z.number().int(), p: z.number(), late_from: z.number().int(), late_p: z.number() }).strict(),
  // multipliers in a plague year (flag.plague), and for children under 15 when flag.plague_children is also set
  plague: z.object({ all: z.number(), children: z.number() }).strict(),
  majority: z.number().int(), // a younger heir needs a regent
  match_age: z.number().int(), // an unmarried member of the house is offered a match from this age
  // a fresh start's family (an import brings its own)
  founder_family: z.object({ spouse_alive: z.number(), children: z.tuple([z.number().int(), z.number().int()]), born: z.tuple([z.number().int(), z.number().int()]) }).strict(),
}).strict();
export type Life = z.infer<typeof LifeSchema>;

export const NamesSchema = z.object({ male: z.array(z.string()).min(1), female: z.array(z.string()).min(1), families: z.array(z.string()).default([]) }).strict();

// A line of a head's chronicle paragraph, shown when the condition holds at the handover (head is the old head).
export const ChronicleLineSchema = z.object({ if: CondInputSchema.optional(), text: z.string() }).strict();

/** A rival house (PLAN.md §4.4): who heads it by date, where it sits, and where it starts. */
const HouseStart = z.object({ standing: z.number().int().min(0).max(100), temper: z.number().int().min(-10).max(10), claim: z.number().int().min(0).max(3) }).strict();
export const HouseDefSchema = z.object({
  name: z.string(),
  seat: z.string(),
  culture: Id,
  // heads in order; each until the old-count year it ends (the last has none)
  heads: z.array(z.object({ npc: Id, until: z.number().int().optional() }).strict()).min(1),
  start: HouseStart,
  // the opening's own start, where it differs (Diminished: Penhoët holds the lost manor)
  openings: z.record(Id, HouseStart.partial()).default({}),
  // standing gained each Michaelmas (a house rising), to a ceiling
  rising: z.object({ per_year: z.number().int(), to: z.number().int() }).strict().optional(),
}).strict();
export type HouseDef = z.infer<typeof HouseDefSchema>;

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
  life: LifeSchema,
  names: z.record(Id, NamesSchema),
  chronicle: z.array(ChronicleLineSchema).default([]),
  houses: z.record(Id, HouseDefSchema).default({}),
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
  law: HouseLawId.default('male_preference'), // the house's law at the start
  // the founder in a fresh start
  founder: z.object({
    age: z.number().int(),
    station: Id,
    attributes: StatBlock,
    skills: StatBlock,
    coin: z.number().int(), // pence
    renown: z.number().int().default(0),
    men: z.number().int().default(0),
    // the lands of a fresh start (economy.ts); an import brings the life's own
    lands: z.object({
      manor: z.object({ name: z.string(), people: z.number().int(), temper: z.number().int(), defence: z.number().int(), church: z.number().int(), salt: z.number().int(), orchard: z.number().int() }).strict().optional(),
      holdings: z.array(z.object({ id: Id, name: z.string(), income: z.number().int() }).strict()).default([]),
      knights: z.number().int().default(0), // knights who hold of the house, from the West's (economy.ts WEST_KNIGHTS)
    }).strict().default({ holdings: [], knights: 0 }),
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
