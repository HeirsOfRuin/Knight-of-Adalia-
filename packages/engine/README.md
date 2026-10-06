# The engine

The engine shared by Knight of Adalia and House of Adalia (`docs/SEQUEL-FRAME.md`). It plays any content written in the scene, choice, check and effect format: conditions, effects, text, checks, the calendar, the director, chapter cards, the world map, saves and save codes.

It holds none of a game's own rules. A game supplies those through a **game module**.

## Rules
- **Pure.** Every function is `(content, state, input) -> new state`. No DOM, no clock, no `Math.random`.
- **Self-contained.** Files here import only each other and `zod`. `tests/engine/boundary.test.ts` fails on anything else.
- **Imported as `@engine/<module>`.** `tsconfig.json` and `vite.config.ts` both map the alias.

## The game module (`src/game.ts`)
A content bundle names its game by id (`content.game`). The game's module registers itself with `registerGame` when its code is loaded, and the engine finds it with `gameOf(content)`. The id is a string, so it survives `structuredClone` and the JSON bundle.

| Hook | What the game supplies | Knight of Adalia |
|---|---|---|
| `namespaces`, `getValue`, `checkPath`, `labelFor`, `ordinalFor`, `namedValues`, `comparisonLabel` | Its own state paths, for conditions, effects and text | `estate`, `suit`, `heir`, `heirs`, `holding`, `holdings`, `background`, `role`, `prejudice` |
| `addNumber`, `assignValue` | `add:` and `assign:` on those paths | Suits, the manor, a child's bond, holdings |
| `effects` | Its own effect ops; their schemas go in the game's schema | `found_estate`, `lose_share`, `train`, `birth`, `name_heir`, `heir_dies`, `heir_set`, `hold`, `release` |
| `stakesOf`, `stakesOfAdd`, `counterRank` | What its effects put at stake in the line under a choice | Your manor, your holdings, your children |
| `textVar`, `checkTextVar` | `{var}` names it renders | `{wife.<moment>}`, `{background}`, `{origin}`, `{pay_due}` |
| `variantKey` | Which `scene.variants` entry replaces a scene's text | The background |
| `onSeason` | Upkeep as the calendar turns | Harvest, rents, pay, the manor's people |
| `audience` | The modifier a check's audience applies | The "new man" prejudice |
| `resolvePlace` | `@`-references in scene places | `@home`, `@service`, `@manor`, `@town` |
| `cardRows`, `cardBorn`, `cardDead` | Its lines on chapter cards | Wife, children, lands |
| `startScene` | Where a save resumes if its scene and checkpoint are gone | The background's first scene |

The game also builds its own:
- **schema**, from `CORE_EFFECTS`, `CORE_REGISTRY`, `wrapEffects` and `makeSceneSchemas` (`src/schema.ts`);
- **state**, extending `CoreState`;
- **new game**, which fills a state and calls `enterScene`;
- **save codec**, with `makeSaveCodec` (format name, version, migrations) and its own save-code prefix.

Knight of Adalia's are in `src/content/schema.ts` and `src/game/`.

## Characters (`src/character.ts`)
The hero is a `Character` in `state.characters`, and `state.hero` is its id. A character has a name, a sex, a birth (a season index; negative before the game starts), whether it is alive, and its own attributes, skills, health, traits, injuries, items, station and track. `heroOf(state)` returns the hero.

- **Paths.** The hero's own paths are written bare (`attr.wits`, `health`, `station`) or with `hero.` in front. `hero.sex`, `hero.name` and `hero.alive` exist only with the prefix.
- **Pronouns.** `{he}` `{him}` `{his}` `{himself}` `{lord}` `{man}` `{son}`, rendered for the hero's sex; `{He}` capitalises.
- **Death.** `die` marks the hero dead (`alive`, `died`) as well as ending the game.
- **Not yet:** paths and effects for characters other than the hero, creating characters in play, and passing play to another character. House of Adalia's slice adds them with succession (step 4 of its build order).

## Known assumptions still in the engine
These are general enough for both games for now. They move to config or the module when House of Adalia needs them to differ.
- Relationships (`state.npcs`), reputation, resources and favours belong to the state, not to a character. In a game of generations they are the house's; whether some pass to an heir is a decision for the slice.
- The engine's own player-facing strings are second person ("Your men", "You owe ..."), which suits a hero of either sex. Gendered labels belong to the game: Knight of Adalia's check label "his origins" is in its module.
- Resources are a fixed list: coin, supplies, horses, renown, men, garrison, levy. The force (company, garrison, levy) is the engine's.
- The world (`worldgen.ts`) is the one both games share.

## Checking a refactor
`npm run fingerprint` hashes every view and state across the scripted plans and seeded bot runs, plus the dynasty exports, save round-trips and validator output. Run it before and after a change that must not alter play. A channel that differs names what changed.
