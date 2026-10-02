# DESIGN — Knight of Adalia

Status: Phases 0-1 approved. Phase 2 (prologue + Chapter 1 vertical slice) complete, awaiting Phase 3 review. Decisions log at the bottom.

## Context
The repo is empty (no commits). This is the Phase 0 deliverable: an architecture proposal, content schema, file layout, background table, and scope pushback. Nothing gets built until you approve it. Once approved, I commit this proposal as `/docs/DESIGN.md` and start Phase 1.

---

## 1. Stack decision

| Choice | Decision | Why |
|---|---|---|
| Language/build | TypeScript (strict) + Vite | Required. Static output, works offline and on any static host. |
| UI | **Preact** (+ `@preact/signals`) | About 4 KB. Components help with the status panel, journal and debug drawer. Plain TSX with no compiler step, so engine/UI separation stays obvious. Svelte works too but adds its own compiler and file format. Plain TS would mean writing a small DOM framework by hand. |
| Content format | **YAML authored, compiled to one JSON bundle at build time** | YAML handles multi-line prose well. Compiling means the browser never parses YAML, and the validator, bot and tests all use the same bundle. |
| Schema | **Zod** | One source gives both the TS types and the runtime validation. A JSON Schema is generated from it for documentation and editor autocomplete. |
| Tests | Vitest | Native to Vite, fast, runs engine tests in Node. |

## 2. Architecture

Three layers. Imports only go downward.

```
UI (Preact)  ->  Engine facade  ->  Engine modules (pure)  ->  Content bundle (data)
                       ^
         tools/ (validator, linter, bot) use the engine directly in Node
```

**Engine rule:** every function is pure, `(state, input, content) -> newState`. No DOM, no `Date.now()`, no `Math.random()`. That makes the bot, the tests and save reproducibility simple to get right.

Facade API:
```ts
newGame(content, { background, seed, name, servantRole? }): GameState
view(content, state): SceneView     // rendered text + choices with labels, lock reasons, odds bands
choose(content, state, choiceId, opts?: { force?: 'success'|'partial'|'failure' }): { state, result }
```

### Modules (`src/engine/`)

| Module | Responsibility | Phase |
|---|---|---|
| `rng.ts` | sfc32 seeded PRNG. State lives in the save, so reloading cannot reroll a check. | 1 |
| `conditions.ts` | Parses the condition grammar (below) at compile time and evaluates it at runtime. Also produces "Requires X" labels. | 1 |
| `effects.ts` | Applies effect ops. Records every change for the journal. | 1 |
| `checks.ts` | Resolves skill checks into success / partial / failure and maps odds to bands. | 1 |
| `text.ts` | Variable substitution and conditional passages. | 1 |
| `director.ts` | Spine progression, pool draws, delayed-event queue, cooldowns. | 1 |
| `calendar.ts` | Seasons, regnal years, ageing, time gates. | 1 |
| `character.ts` | Attributes, skills, traits, injuries, health. | 1 |
| `station.ts` | Station ladder and the "new man" prejudice modifier. | 1 |
| `reputation.ts` | Faction standing and personal axes. | 1 |
| `relationships.ts` | NPC state and agenda scheduling. | 1 |
| `resources.ts` | Coin (stored in pence), supplies, horses, equipment, renown, favors. | 1 |
| `retinue.ts` | Followers, pay, loyalty. | Interface in 1, implemented Ch2 |
| `war.ts` | Battles in rounds, sieges, raids. | Interface in 1, implemented Ch2 |
| `estate.ts` | Seasonal estate cycle. | Interface in 1, implemented Ch3 |
| `politics.ts` | Factions, claims, plots. | Interface in 1, implemented Ch4 |
| `magic.ts` | Items, curses, alchemy as items and events with costs. | 1 (thin) |
| `save.ts` | Versioned saves and migrations. | 1 |
| `narration.ts` | `NarrationProvider` interface plus `StaticNarrationProvider`. | 1 |

### Check resolution
- Score = attribute + skill + situational modifiers (prejudice, injuries, gear, relationship) minus difficulty.
- Chance of success = clamp(50% + 10% × score, 5%, 95%). There is a partial-success band 15 points wide just below the success threshold. Failing forward is the default.
- Displayed bands: **Risky** (<40%), **Even** (40–65%), **Favorable** (>65%). Raw numbers appear only in debug mode.
- **Lethal** checks are marked `lethal: true` and the choice shows a danger marker. Death can only come from lethal checks or accumulated health loss, and the scene text must have signalled the risk beforehand. The validator enforces that every lethal check has a warning.

### Save format
`{ saveVersion, contentHash, seed, rngState, state, journal }`
- Autosaves to localStorage after every choice. Export and import as a JSON file.
- Migrations are a `{ [fromVersion]: (save) => save }` chain.
- If content changes and the saved scene ID no longer exists, the game falls back to the chapter's last checkpoint and tells the player.

### NarrationProvider
```ts
interface NarrationProvider { render(passage: CompiledPassage, ctx: TextContext): string }
```
v1 ships only the static implementation. No LLM calls.

## 3. Content schema

### Condition grammar
Each condition is a short string, combined with YAML `all` / `any` / `not` blocks. Every condition is parsed at compile time, so an unknown path fails the build instead of silently evaluating false.

```
flag.met_aldric                      skill.diplomacy >= 4      attr.wits >= 3
station >= squire                    background == reeve       rel.aldric.affection >= 2
rep.knights <= -2                    res.coin >= 240           calendar.season == winter
age >= 16                            trait.scarred             injury.bad_knee
chapter == 1                         npc.aldric.alive
```

### Effect ops
```yaml
effects:
  - set: flag.owes_aldric
  - clear: flag.hidden_bow
  - add: { skill.arms: 1, rep.commons: -1, res.coin: -24, rel.aldric.affection: 2 }
  - trait: +hot_tempered            # or -hot_tempered to remove
  - injury: broken_hand             # registry entry defines mechanical penalties and duration
  - station: squire
  - queue: { event: wat_returns, delay: { seasons: 6 }, earliest_chapter: 3 }
  - advance: { seasons: 1 }
  - journal: "You paid Coker's fine yourself. He did not thank you."
```

### Scene/event example
```yaml
id: p_reeve_audit
chapter: prologue
kind: spine                 # spine | pool | queued | ending
tags: [stewardship, family]
requires: [ background == reeve ]
weight: 10                  # pool events only
once: true
cooldown: { seasons: 2 }    # pool events only
text: |
  The steward came at Martinmas with two clerks and a bad cough.
  [if flag.father_skims]Your father had not slept.[else]Your father laid out the tallies without hurry.[/if]
  {npc.steward.name} wanted the barley count by nightfall.
choices:
  - id: honest
    text: Read him the true count.
    effects: [ { add: { rep.lord: 1, rel.father.affection: -2 } } ]
    next: p_reeve_after
  - id: fudge
    text: Read him your father's count.
    requires: [ skill.learning >= 2 ]          # visible; shown as "Requires Learning 2" when unmet
    check: { attr: wits, skill: learning, difficulty: 4 }
    success: { effects: [ { set: flag.covered_father } ], next: p_reeve_after }
    partial: { effects: [ { set: flag.steward_suspects } ], next: p_reeve_after }
    failure: { effects: [ { set: flag.reeve_disgraced }, { queue: { event: reeve_dismissed, delay: { seasons: 1 } } } ], next: p_reeve_after }
  - id: plead_sick
    text: Say your father is abed, and stall.
    visible_if: [ flag.father_skims ]          # hidden condition: the choice does not appear at all
    effects: [ { advance: { seasons: 0 } } ]
    next: p_reeve_stall
```

### Registries (`content/registry/*.yaml`)
Every flag, NPC, trait, injury, item, faction and ending is declared here. The validator rejects any reference that is not declared. Each flag records `description`, `set_by` and `read_by`; the validator fills in the last two and reports orphans.

### Text features
- `{var}` substitution.
- `[if cond]…[elif cond]…[else]…[/if]` conditional passages.
- `variants: { reeve: …, archer: … }` for background-specific text on shared scenes.

## 4. Event selection (director)
1. Any queued event that is due and whose preconditions pass fires first, in priority order. When a queued event fires, its journal entry links back to the choice that caused it.
2. Otherwise, if the current spine beat's preconditions are met, it plays.
3. Otherwise the director draws 1–2 pool events, weighted, filtered by preconditions, `once` and cooldown.
4. Each chapter has a time budget in seasons. When the budget runs out, the next spine beat is forced, so the player cannot get stuck in the pool.

## 5. File layout
```
/content
  canon.md  style-guide.md  TODO.md
  registry/   flags.yaml npcs.yaml traits.yaml injuries.yaml items.yaml factions.yaml endings.yaml romances.yaml
  backgrounds/ reeve.yaml burgess.yaml archer.yaml servant.yaml
  scenes/     prologue/*.yaml  ch1/*.yaml  ...
  events/     ch1/*.yaml ...          (pool and queued events)
/src
  engine/     (modules above) index.ts
  content/    schema.ts compile.ts types.ts
  ui/         App.tsx components/{SceneView,ChoiceList,StatusPanel,Journal,SaveMenu,DebugDrawer}.tsx styles.css
  main.tsx
/tools        validate.ts lint-style.ts bot.ts vite-plugin-content.ts
/tests        engine/*.test.ts content/*.test.ts bot/*.test.ts
/docs         DESIGN.md
```

## 6. Character model

- **Attributes (1–5):** Strength, Agility, Endurance, Wits, Presence. Every background starts with a total of 11.
- **Skills (0–10):** Arms, Archery, Riding, Woodcraft, Command, Tactics, Diplomacy, Intrigue, Courtesy, Stewardship, Trade, Learning. Every background starts with 6 skill points.
  - Courtesy (manners, heraldry, table and hall conduct) is the main skill for climbing socially. Commoners start low in it.
- **Literacy** is a trait, separate from Learning: `literate_vernacular`, `literate_latin`.
- **Health:** a wound track plus named injuries, each with a mechanical penalty and either a duration or permanent. Scars are traits. They carry a small Presence penalty with nobles and a small bonus with soldiers.
- **Age:** the prologue covers roughly ages 8–15. Expected spans after that: Ch1 15–21, Ch2 21–26, Ch3 26–32, Ch4 32–42, Ch5 42+. Mortality risk rises with age.

### Reputation
- **Factions (−10..+10):** Crown, Church, Great Nobles, Knights, Commons, Merchants, Valdrenne, Caldmoor, Hroswald, Sarenza.
- **Personal axes (0..10, independent of each other):** Honor, Ruthlessness, Piety. A man can be both honorable and ruthless.
- **Renown** is a resource that only goes up. It is spent implicitly by reducing prejudice and by meeting station gates.

### Station
| Station | Typical entry requirement |
|---|---|
| Commoner | Start |
| Retainer | Patronage Gate. Sub-tracks: `squire_track`, `household` (lower), `levy` (lower), `man_at_arms` (Ch1 exit, requires a patron) |
| Squire | Taken as squire by a knight. Courtesy ≥2, Arms ≥2, a sponsor's favor |
| Knight | Dubbing: peacetime ceremony, battlefield deed, or purchase/patronage. Needs means to keep a horse and harness |
| Lord | Holds land in fee: grant, marriage, purchase, or conquest |
| Great Lord | Multiple holdings or a barony, a council summons, Renown ≥ threshold |
| Royal | Ch5 only. A claim by marriage, conquest with recognition, or a kingmaker bargain |

**New-man prejudice:**
- Prejudice = origin base − (renown/k + station step + noble marriage + patron standing).
- Floor of 1. It never reaches zero.
- It applies as a penalty with Great Nobles and Knights, and as a smaller penalty with Church and Crown.
- It becomes a bonus with Commons, Merchants and NPCs tagged `rising_man`.

## 7. Backgrounds

All four start with an attribute total of 11 and 6 skill points. The differences are in the asset, the liability and the hooks.

| | **Reeve's son** | **Burgess's son** | **Veteran archer's son** | **Household servant's son** (choose huntsman / falconer / horse-master) |
|---|---|---|---|---|
| Attributes S/A/E/W/P | 2/2/2/3/2 | 2/2/2/2/3 | 3/3/3/1/1 | 2/3/2/2/2 |
| Skills | Stewardship 2, Learning 2, Trade 1, Diplomacy 1 | Trade 2, Diplomacy 1, Learning 1, Intrigue 1, Courtesy 1 | Archery 3, Woodcraft 2, Arms 1 | Role skill 3 (Riding / Woodcraft / Woodcraft+falconry), Riding or Archery 1, Courtesy 1, Intrigue 1 |
| Literacy | Vernacular | Vernacular | None | None |
| Coin | 3s 4d | £1 | 6d | 1s |
| Asset | Knows how a manor really runs. Can read accounts. | Cash, guild ties, a Sarenzan factor who knows the family | Father's yew bow; fitness; the father's old company | Proximity to the lord's family; insider knowledge of the household |
| Liability | Villagers see him as the lord's enforcer; family tenure is at the lord's pleasure | Knights see a tradesman (higher prejudice with Knights); the town wants money and loyalty | Illiterate, poor, no patron | Dependent; can be dismissed on a whim; mother still in service (a hostage to his good behaviour) |
| Starting relationships | Father (reeve), the lord's steward (patron), Wat Coker (rival; his family's holding was seized under the father's enforcement) | Father (burgess), a guild master (patron), a rival guild master's son | Father (veteran), the father's old captain, a knight who owes the father his life (patron), the bailiff's nephew (rival for a militia place) | Mother, the master of the household (patron), the lord's younger son (companion and rival) |
| Hidden flags | `father_skims` or `steward_skims` (rolled at start) | `family_debt_sarenza` | `father_war_secret` (something done in the last war) | `knows_household_secret` (the heir's paternity) |
| Long-term hooks | Ch3 Wat leads unrest on his own estate. The accounts scandal resurfaces as blackmail. | The town calls in loans in Ch2–3. The Sarenzan factor brokers ransoms in Ch2. A charter dispute with his own neighbors in Ch3. | The old company reappears in the Ch2 levy. The father's secret surfaces with a Valdrennish noble. A Caldmoor feud. | The household secret becomes leverage or a death warrant in Ch4. The lord's son becomes a court rival or ally. |

### Patronage Gate routes (at least 3 per background)
Prologue choices adjust the odds for each route.

| Background | Route 1 | Route 2 | Route 3 | Route 4 |
|---|---|---|---|---|
| Reeve | **Competence:** catches the steward's error in the accounts | **Debt:** the father calls in a favor from the steward | **Deed:** turns back a poacher band or a fire | — |
| Burgess | **Purchase:** pays for a place in a knight's household | **Debt:** a knight in debt to the town accepts him as part settlement | **Connection:** a guild master's patron | — |
| Archer | **Deed:** shooting at the muster, noticed by a captain | **Favor:** the knight who owes the father his life | **Competence:** a hunting service | — |
| Servant | **Competence:** horses or hounds noticed by a guest knight | **Connection:** the lord's son asks for him | **Deed:** saves someone during a hunt accident | **Leverage:** uses the household secret (risky) |

**Failing the gate** puts him on the household or levy track. Ch1 offers at least 2 routes from there to squire.

**Entering the Ch2 war (decided).** Nobody goes to war as a squire. At the end of Ch1 he is one of:
- **Knight** — dubbed in peacetime before the war.
- **Man-at-arms with patronage** — raised from squire (or from the lower track) into a patron's company, with the patron's standing promise of a chance at knighthood in the field. The battlefield-knighting route is open to him in Ch2.

A man-at-arms without a patron is not a valid Ch2 entry; Ch1 must guarantee patronage on the fallback route (a captain who takes him on, at a cost).

## 8. Endings (computed in Ch5 from accumulated state)
1. **Crowned** — kingship by marriage claim, by conquest with recognition, or by a kingmaker bargain. It needs at least two hard gates together, for example a royal-blood marriage, Great Lord station, and Crown or Great Nobles support.
2. **Kingmaker** — the power behind a throne.
3. **Founder of a House** — a secure great lord with heirs.
4. **Diminished Lord** — keeps some land, loses influence.
5. **Exile** — in Sarenza, Hroswald or Valdrenne.
6. **Ruin** — attainted and landless.
7. **Death** — in battle, by execution, or by illness. Each variant has its own epilogue.

The epilogue is assembled from state: spouse, heirs, retinue fates, the estate, and the fates of key NPCs.

## 9. Validation, linting, bot

### `tools/validate.ts`
Checks for:
- Broken `next` links.
- Undeclared flags, NPCs, items, traits.
- Flags that are set but never read, or read but never set.
- Scenes unreachable from any background start.
- Choices that can all be locked at once.
- Unmet requirements with no label.
- Lethal checks with no warning.

It also runs the per-background structural checks: at least 2 squire routes, at least 2 knight routes, a working lower-track route, and every ending reachable.

### `tools/lint-style.ts`
Checks the banned-phrase list in `style-guide.md` (regex entries allowed) and flags modern idioms. It runs over all scene and event text.

### `tools/bot.ts`
Policies:
- Random play.
- Goal-seeking play, which prefers choices tagged martial, cunning, diplomacy, wealth and so on.
- Scripted paths stored as YAML.

It reports:
- Dead ends (a scene with no available choice).
- Softlocks (N steps with no calendar or spine progress).
- Ending distribution by background.
- Scene coverage.

## 10. UI
- A single column of text-first prose with serif body text and a measure of about 65 characters.
- Choice buttons at least 48 px tall. Each shows its requirement label and odds band. Locked choices are greyed out, with the reason shown.
- A collapsible status panel: station, age and season, attributes and skills, health and injuries, coin, reputation, key relationships.
- A journal of decisions and their consequences, with links from delayed consequences back to their causes.
- Save menu: autosave, export, import.
- A debug drawer, opened with `?debug=1` or a keyboard toggle: a state tree, a flag editor, a scene jump, a force for the next check outcome, and the seed.

## 11. Pushback and scope risks
1. **"Every ending reachable" cannot be proven statically.** With conditions that depend on stats, general reachability is undecidable. I'll combine two things:
   - a static graph check that some path links to each ending scene;
   - an empirical check in which goal-seeking bot runs must reach every ending for every background.

   This check only becomes meaningful in Phase 4+. Until Ch5 exists it reports "pending".
2. **The prose is the bottleneck, not the code.** At full scope that is roughly 250+ scenes. For Phase 2, the prologue will use background-specific openings plus shared middle scenes that have variant text and options, as you anticipated. Ch1 will target the low end of the range: about 30 scenes plus about 10 pool events.
3. **Retinue, Estate, War and Politics** are interfaces only in Phase 1. Each gets implemented in the chapter that first needs it. Building all of them up front would mean tuning systems before any content exists to test them against.
4. **"Knight-in-waiting"** — resolved: see §7, "Entering the Ch2 war".
5. **Romance and marriage** — moved to its own section (§11a) after your feedback.

## 11a. Romance and marriage

### Rules
- **Romance runs in every chapter and aims upward.** The prologue has a village or town attachment. In Ch1 he flirts with ladies-in-waiting and sends tokens. In Ch2 he dances with a young noblewoman at a victory feast and gets to know a captive's sister. Each step is a reach above his station, so it carries risk: a scandal, an angry father, the patron's displeasure.
- **No marriage before Ch3.** Earlier chapters build a *suit* but never a wedding.
  - Commitments are possible: an exchanged token, a secret understanding, a family's tolerance.
  - If he tries to marry early, a scene shows why it fails (no land, the father refuses, his lord forbids it). The suit survives that refusal.
- **The marriage decision comes in Ch3**, when he holds land and a small title. The options available then are computed from:
  1. suits he pursued earlier, each with a score above its threshold;
  2. hidden candidates unlocked by unrelated earlier choices (how he treated a prisoner, who he ransomed, which household he served);
  3. arranged offers from his liege or a neighbor, based on reputation and station. These are not romanced, but they can be the strongest political match.
- **Remarriage** is possible in Ch4–5 if he is widowed. Childbirth, plague and war make this realistic. This is the main route to a royal-blood match, since a minor Ch3 lord marrying royal blood would not be credible.

### Suit state (per candidate, in `relationships.ts`)
| Field | Meaning |
|---|---|
| `regard` | Her own feeling, −10 to +10 |
| `family` | Her guardian's acceptance, −10 to +10. New-man prejudice applies here. |
| `discretion` | How exposed the suit is. Low discretion raises scandal risk. |
| `pledge` | none / token / understanding (bound by honor, not by law) |
| `status` | hidden → known → courted → available → married / lost |

**Exclusivity:** an open suit lowers `regard` with other candidates in the same household or court. Holding two `understanding` pledges at once sets a scandal flag that is queued to fire later.

### Candidates do not wait
Each candidate has her own agenda through scheduled events:
- her family may marry her off;
- she may take a different suitor;
- she may enter a convent;
- she may die.

If he neglects a suit for two chapters, it usually ends without him.

### Candidate roster: 12, all provisional, full detail goes in canon.md
| # | Candidate (archetype) | First appears | Visibility | What the marriage brings | Main cost or obstacle |
|---|---|---|---|---|---|
| 1 | Childhood attachment (background-specific: village girl, guild daughter, yeoman's daughter, laundress) | Prologue | Open | Loyalty, Commons reputation, a known household | Status cost. Raises prejudice with Knights and Great Nobles. |
| 2 | Lady-in-waiting in his lord's household (poor gentry) | Ch1 | Open | A first gentry connection | Her mistress's disapproval. His lord's patience. |
| 3 | His lord's niece or ward | Ch1 | Open | A large reduction in prejudice; the patron becomes kin | High scandal risk. The guardian is hostile until Ch3. |
| 4 | A wealthy merchant's daughter | Ch1 | Open (easier for the burgess's son) | Coin and Merchant reputation | Knights sneer. Her family wants a title first. |
| 5 | A knight's widow with a small holding | Ch1 | Hidden: unlocked by a service done for her late husband's household | Land and a household that already runs | Older. Her stepchildren's inheritance claims. |
| 6 | A young noblewoman met at a victory feast | Ch2 | Open | A connection to a great house | Her father wants a ransom-rich husband. Rivals compete for her. |
| 7 | Sister of a Valdrennish captive | Ch2 | Hidden: depends on how he holds or ransoms her brother | Valdrenne reputation; a foothold across the channel | Enemy blood. Crown suspicion. |
| 8 | A Sarenzan banker's daughter | Ch2 | Hidden: through the ransom broker or the burgess's factor | Credit, ships, Sarenza reputation | Foreign. The Church distrusts the family's lending. |
| 9 | Widow of a Valdrennish castellan, met during a siege | Ch2 | Hidden: unlocked by a negotiated surrender rather than a storm | A castle and its local loyalty | Hostile locals. Her own kin's claims. |
| 10 | A neighboring lord's daughter | Ch3 | Arranged offer | A border alliance; an ally against estate unrest | Her father wants terms in land. No affection to start with. |
| 11 | His liege's ward, offered as a reward | Ch3 | Arranged offer (requires high liege favor) | A strong political match, offered as a gift | Refusing gives offence. She may resent the match. |
| 12 | A woman of royal blood who is out of favor (a disgraced royal cousin, or a Valdrennish ducal heiress) | Ch2 seed, Ch4 option | Hidden: needs a long thread | A **claim** that enables the Crowned ending | Enemies at court. Requires Great Lord station. Remarriage only. |

### Why no single playthrough sees all 12
- **Background** changes the odds: #1 differs by background, and #4 and #8 are easier for the burgess's son.
- **Route:** which household he serves decides #2 and #3. How the war goes decides #6, #7 and #9.
- **Hidden unlocks:** #5, #7, #8, #9 and #12 only appear if specific unrelated choices were made.
- **Exclusivity and candidate agendas** close threads he neglected or compromised.

A typical run should meet 5–7 candidates and have 2–4 real marriage options in Ch3. The bot will report this per background so the spread can be tuned.

### Marriage consequences carry forward
- **Spouse:** becomes an NPC with her own traits, agenda and loyalty.
- **Heirs:** children arrive from Ch3 onward and feed into succession in Ch5.
- **Kin:** in-laws become allies or liabilities.
- **Prejudice:** a gentry or noble marriage lowers it; a commoner marriage keeps it.
- **Claims:** a marriage can create a claim, which the Crowned ending depends on.

### Validator additions
- Every background must reach Ch3 with at least 2 marriage options.
- Each candidate must be reachable by at least one background.
- The Crowned ending's marriage route must be reachable through remarriage.

## 12. Assumptions (all confirmed)
- The player can name the protagonist. A default name is supplied, along with a random option.
- Currency is pounds, shillings and pence (12d = 1s, 20s = £1), stored internally in pence. A laborer earns about 2d a day.
- Years are counted as regnal years, for example "the 14th year of King [X]".
- "Lord" in the reputation list means the protagonist's own liege. It is tracked as a relationship, not a faction.
- Romance candidates are women only (confirmed).
- No external fonts or CDN dependencies, so the game works fully offline.

## 13. After approval — Phase 1 plan
1. Scaffold Vite, TS, Preact, Vitest, ESLint and Prettier. Commit.
2. Add the Zod schema, the YAML compiler, the Vite content plugin and the registries. Commit.
3. Engine modules: rng, conditions, effects, checks, text, calendar, character, station, reputation, relationships, resources, director, save, narration, each with unit tests. Commit in groups.
4. `validate.ts`, `lint-style.ts`, a bot skeleton, `style-guide.md` with the banned list, and a stub `canon.md` with all 5 powers and 3+ NPCs each. Commit.
5. A minimal UI with one test scene that exercises a check, a gated choice, a hidden choice, a queued event and a save round-trip. Commit and push to `ccr-99573b29-7dxwxb`.

## Verification (Phase 1)
- `npm test`: engine unit tests, including RNG determinism (the same seed and the same choices give the same state).
- `npm run validate`, `npm run lint:style`, and `npm run bot -- --runs 200`. All must pass on the test scene.
- `npm run build` produces a static `dist/`. Smoke test with `vite preview` plus Playwright on the preinstalled Chromium:
  - load the page;
  - make choices;
  - export a save, reload, import it, and confirm the state matches.

## Phase 1 implementation notes (as built)
Where the build differs from the plan above, this section wins.

- **Module layout.** Character, reputation, resources and relationships are not separate modules. They are namespaces in one path resolver (`src/engine/paths.ts`, read side) and one effect applier (`src/engine/effects.ts`, write side). Displayed values and resolved values come from the same function, so they cannot drift.
- **Deferred systems.** Retinue, war, estate and politics are type interfaces in `src/engine/systems.ts`. Magic is items with `magic: true` plus traits; no engine code is needed yet.
- **Interludes.** Pool and queued events run on a return stack. A spine choice's `next: { pool, count, then }` plays up to `count` pool scenes, then continues to `then`. Due queued events fire before any scene transition and resume afterwards. Queued events carry their origin, and the journal shows the link.
- **Chapter gating of queued events.** `earliest_chapter` takes a chapter id (`ch3`), not an index.
- **Check math.**
  - Success = 50% + 10% × (attr + skill + mods − difficulty), clamped to 5–95%.
  - Partial success is the next 15%.
  - A forced debug outcome still consumes the RNG draw, so later rolls do not shift.
- **Prejudice.**
  - Base 4 for all backgrounds; the burgess's son gets +1 with knights.
  - Reduced by station steps above squire, renown/10, a noble marriage and a strong patron. Floor of 1.
  - Check modifier:

    | Audience | Modifier |
    |---|---|
    | Nobles, knights | −⌈p/2⌉ |
    | Clergy | −⌊p/4⌋ |
    | Commons, merchants | +⌈p/4⌉ |
- **Health.** Health never drops below 1 by itself. Death happens only through a `die` effect, which the validator allows only inside a lethal choice that has a `warn`.
- **Fail-forward rule.** The validator requires at least one unconditional choice in every scene, as the static guarantee against dead ends. The bot catches dynamic ones.
- **Structural checks.** These are the per-background requirements: squire, knight, gate and lower-track routes, man-at-arms entry, and endings. They report PENDING until the chapter they concern has content.
- **Tooling.** No ESLint or Prettier; `tsc --strict` is the static check. The browser smoke test (`npm run smoke`) uses Playwright with the preinstalled Chromium.
- **Test chapter.** A `test` chapter holds the Phase 1 engine test arc (`content/scenes/test/fair.yaml`). It is removed when the prologue replaces it in Phase 2.

## Phase 2 notes (as built)

### Scope delivered
| Part | Count |
|---|---|
| Prologue | 14 scenes: 4 background openings, 3 shared scenes with background passages and options, 1 router, 4 Patronage Gates, the lower road, leaving home |
| Chapter 1 spine | 27 scenes + 1 ending |
| Chapter 1 events | 12 pool (a run sees about 6) + 6 queued consequences |
| Prose | About 21,000 words; one playthrough reads about 6,500 |

The chapter is slightly over the 25-40 target if events are counted. I kept them, because the pool is what makes two runs of the same background differ.

### Chapter 1 shape (age 15 to 20)
1. **Arrival, duties, the squires' loft** (Giles Marrick). Major branch 1, five approaches: fight, scheme, win allies, buy friends, endure.
2. **Winter training.** A skill focus.
3. **The master's trouble.** Variant per master:
   - Sir Hamon: debts and a short subsidy. Approaches: accounts, Lanzi bank, tell Ravell, keep out.
   - Sir Ancel: stolen cattle. Approaches: track them, write a plaint, ride on Thorne's mill, keep out.
4. **Twelfth Night.** The romance intro; five approaches.
5. **The Leven ford.** Major branch 2, first real danger. Five approaches: charge (lethal), flank, rally the archers, parley, hold the horses. Then the prisoner decision (ransom, give him to your master, hang, free) and the widow at Wyck.
6. **The King's progress.** Approaches: the King's notice, catch a Valdrennish spy, Sir Walter Pryce, Maud's petition, duty.
7. **The tourney.** Major branch 3. Approaches: joust, melee, serve, bet, wear a favour.
8. **The master's crisis.** Major branch 4, five or six approaches per master. Every crisis has a trial-by-combat or gate assault (lethal) and an abandon-your-master option. A fallen master leads to choosing a new patron.
9. **The claim, horse and harness, the accolade.** Means come by seven routes. The accolade comes by four:
   - master;
   - Lord Ravell;
   - the King at Saltcombe;
   - Sir Walter Pryce in the Earl of Carrow's livery.

   Otherwise he takes the man-at-arms indenture with a guaranteed patron.
10. **Farewell and Saltcombe.** Tokens (giving two gets you found out later), family.

### Station flow
- **Patronage Gate success:** Retainer (squire track) → squire at Michaelmas of Ch1, whatever the outcome of the first duties.
- **Gate failure:** Retainer (household or levy). Three routes up to squire:
  - the Leven ford deed;
  - replacing a squire who died of the sweat;
  - serving in the lists at the tourney.
- **Ch1 exit:** knight, or man-at-arms with a patron. If the master is dead or disgraced, Sir Walter Pryce takes him, so no one sails without a patron.

### Engine additions in Phase 2
- **NPC aliases** (`@master`, `@rival`). Text, conditions and effects can follow whoever fills the slot.
- **Conditional effects** (`if/then/else`) and **switch routing** on `next`.
- **`later: chN`** on flags that are set now and read in a later chapter.
- **Scripted plans** (`tools/plans/`): run by the bot and the tests. `npm run transcript` writes them as Markdown to `docs/playthroughs/` for reading.
- **Journal tidying:** change chips are merged ("Respect +1, +1" becomes "+2"), and causes queued on scene entry now name the scene.

### Balance snapshot (bot, 300 runs per cell, Ch1 exit)
| Policy | Archer: knight / dead | Burgess | Reeve | Servant |
|---|---|---|---|---|
| Random | 17% / 6% | 14% / 12% | 11% / 14% | 15% / 13% |
| Martial | 96% / 0% | 70% / 15% | 69% / 17% | 76% / 11% |
| Cunning | 50% / 2% | 53% / 0% | 58% / 0% | 60% / 8% |
| Diplomacy and allies | 48% / 3% | 44% / 8% | 32% / 9% | 35% / 11% |
| Wealth and learning | 40% / 5% | 35% / 3% | 45% / 2% | 35% / 13% |

- Patronage Gate success under random play: 50-62% per background.
- Players who don't reach knighthood leave as men-at-arms with a patron. That is the intended Ch2 entry for them; Ch2 offers the battlefield accolade.
- **Known imbalance:** the archer is strongest on the martial route. The reeve is weakest on diplomacy. Both are flagged for review in `content/TODO.md`.

## Phase 3 review changes (2026-10-01)

### Rule changes
- **Death rule.** A failed lethal check kills only if he went in unarmoured or already injured. Otherwise he is badly hurt.
  - "Armoured" means a padded jack or the prize harness.
  - The new `injured` condition is true while any injury is active.
  - The warnings say so in the text.
- **Champions.** A squire is no longer the default champion in a trial by combat. He can:
  - hire one with coin or a favour; or
  - fight himself, but only because Sir Hamon is physically unable.
- **The archer's class cost.**
  - +1 prejudice with knights.
  - -1 in the tourney lists.
  - His master's accolade needs Knights standing 2 (witnesses willing to stand for a bowman's son).
- **Harder peacetime knighthood.**
  - Renown bars raised: Ravell 4, King 3, Pryce 3, master 2 (with respect 4).
  - Lord Ravell and the King also require Courtesy 2 ("a lord or a king will not forgive" bad manners). Your own master does not.
  - Means are harder: the purchase price is now £6; the master's gift needs affection 4; the Ravell fee needs his regard 4.
  - Renown from the ford charge, the joust and the trial by combat is reduced from 3 to 2.
- **Engine.** Text conditions accept `&&` and `||`, with `&&` binding tighter and no parentheses.
- **Prose.** The sweating sickness is renamed to the bloody flux.

### Balance snapshot after the changes (bot, 300 runs per cell, Ch1 exit knighted / dead)
| Policy | Archer | Burgess | Reeve | Servant |
|---|---|---|---|---|
| Random | 4% / 6% | 5% / 11% | 5% / 10% | 6% / 12% |
| Martial | 77% / 0% | 30% / 5% | 43% / 1% | 62% / 1% |
| Cunning | 11% / 2% | 18% / 0% | 22% / 0% | 18% / 8% |
| Diplomacy and allies | 17% / 3% | 30% / 5% | 17% / 5% | 20% / 8% |
| Wealth and learning | 4% / 6% | 12% / 3% | 21% / 2% | 22% / 13% |
| **Average of goal-directed styles** | **27%** | **22%** | **26%** | **30%** |

The bots each pursue a single approach. A real player mixes them; for example, a fighter who also picks up Courtesy. That moves a player toward the martial column.

## Chapter 2 decisions (2026-10-01)
1. **The war.** It must feel large, real and important.
   - It contains skirmishes, raids and fights, two battles (the second a major one), and a siege.
   - His actions matter locally but do not change the war.
   - Big ransoms and important victories are available to him, but often go to others. They still happen, just not always through him.
2. **Span.** About five years, ages 20 to 25.
3. **Command.** He commands his own small company, from himself and a squire up to 10-20 men. Battles resolve in 3-6 rounds from his place in the line. Army command waits for Ch4.
4. **Knighthood.** Battlefield knighthood comes before the battle, for a deed in it, or at the siege. If he ends Ch2 unknighted, he still receives the land grant, plus a ceremonial knighting for his service. Ch3 always opens with him as a knight.
5. **Land.** A conquered Valdrennish manor granted by the King, with a hostile population. Adalian land through marriage or purchase is rarer.
6. **War crimes.** The boundary is signed off by the user:
   - He can order or allow burning and killing, with lasting consequences: reputation, Valdrennish hatred, Ruthlessness.
   - Sexual violence is acknowledged and can be stopped or ignored, but is never described and is never the player's act.
7. **Retinue.** Starts in Ch2: a squire of his own, a groom, and 2-6 archers or men-at-arms, several of them named, with pay and loyalty. They can die. This is the main way to build investment in his men, and practice for Ch3.
8. **Romance.**
   - Ch2 introduces candidates 6-9.
   - Home courtships continue by letter.
   - Some women pursue the courtship themselves, by writing, arriving or arranging things.
9. **Home front.** Letters, plus 2-3 home events: Black Ewan, family debts, the girl left behind. One trip home, during the truce, at a cost.
10. **Plague.** A "great mortality" arrives just after the war and shapes Ch3. Rumours of it start late in Ch2.
11. **Length.** Ch2 is slightly longer than Ch1, because it handles more.

## Writing direction (revised 2026-10-01, after the depth calibration)
The user's verdict on the calibration scenes: too long-winded. The revised direction:
- **Tighter prose.** Scenes are shorter and broken up with Continue pages (a `[break]` line inside a scene's text). The player reads in beats rather than walls.
- **Branching instead of length.** Words saved per scene go into more branching, especially in Ch3-5.
  - Every chapter has more scenes than the one before. It does not have more scenes *seen* per playthrough.
  - Choices in earlier chapters open and close paths later, a butterfly effect.
- **Word count is an approximate goal, not a target.** The 400-500k total and the per-chapter budget below are guides. Never pad to reach them.
- **Narrative continuity.** Avoid "flashing from life point to life point". Scenes connect: they open from where the last one left off, time skips are bridged in prose, and "You are 14." openers are dropped.
- **Date header** shows only when the season or year changes.
- **Quiet scenes:** agreed.
- **Friends, not retainers.** A friend is anyone whose affection is 5 or more and respect 2 or more; family are never counted.
  - Friends appear in some scenes, help with some difficulties as a check modifier or an extra option, and soften or share the cost of some failures.
  - They are not followers: the retinue (`join`/`leave`) is separate.
- **Partial results are mixed wins, never failures.** A check with no partial outcome written has no partial band at all.
- **Reading aids:** People and World pages, with entries that unlock by condition (`registry/codex.yaml`, `registry/lore.yaml`).
- **Order of work:** build the Ch2 skeleton at first-pass depth next, then deepen the prologue, Ch1 and Ch2 together.

### Budget (approximate, not strict)
| Part | Written (approx.) | Scenes (target) |
|---|---|---|
| Prologue | 30,000 | 20 |
| Chapter 1 | 60,000 | 50 |
| Chapter 2 | 80,000 | 60+ |
| Chapter 3 | 90,000 | 75+ |
| Chapter 4 | 100,000 | 90+ |
| Chapter 5 and endings | 90,000 | 100+ |

## Chapter 2 skeleton (as built, first pass)
**Scenes:** 56 in all: 30 main scenes and an ending, 14 side events (3 on the march, 11 in the camp), and 8 delayed consequences. Ch1 has 46. Prose is about 17,000 words, at first-pass depth, to be deepened alongside the prologue and Ch1.

**Span:** spring of year 21 to spring of year 26, ages 20 to 25.

### Shape (revised 2026-10-02: the war of the staple)
The first skeleton was a string of Adalian victories modelled too closely on 1346-47. The revised war is original to this world and costly for Adalia. **The King's plan has three legs, and two of them fail:**
- **The Armance:** land in the Armance as the Duchess's ally. This one holds.
- **Vervais:** the weaving towns, starved of wool by the King's embargo at the Saltcombe staple, have sworn to rise. This leg fails.
- **The Ostmark:** the Margrave, bought with Sarenzan money, is to invade from the east. This leg fails.

**The war, in order:**
1. **Saltcombe.** Form the following: master's archers, a man from home, hired veterans, or go alone. Davy Ludd is always there.
2. **The crossing.** A storm scatters the fleet; the siege timber is lost.
3. **Port-Haudry.** The town is the Duchess's, but the castle above it is not. The landing is contested and costs men.
4. **The Duchess of Armance's camp.** The three-legged plan is explained.
5. **The march east** through King Amaury's own lands, sparing the Duchess's and Vervais:
   - set your stance;
   - Bréval;
   - the foragers' fight;
   - Vaudrey, taken by night through a gate a dyer opens and stripped in one night. Corbie is taken; Héloïse treats for him (romance #7).
6. **The Lisonne.** Vervais has not risen. Duke Lothaire hanged the guild masters after King Amaury bought him with ten years of salt-tithe remission. The Margrave has not marched. The army turns back.
7. **Battle 1: Grisolles, a defeat.** The Constable catches the army crossing the Aube by one bridge in a mist, with men-at-arms on foot and crossbows behind pavises.
   - The rearguard is overrun and the bridge is broken behind it.
   - Losses: 1,800 men, the baggage, the pay chest, the King's plate.
   - Lord Ravell is taken. The master is taken unless saved (Hamon dies in captivity).
   - His choices decide what he saves: his men, the baggage, his master, a friend, three hundred men by the ford.
   - A rare knighting by the Earl of Carrow in the rain.
8. **The retreat** to the Armance, harried by the Iron Company in Valdrennish pay.
9. **Winter at Lannec.**
   - No pay, because the chest was lost.
   - Caldmoor crosses the March under the Old Bond. The King goes home with a third of the army.
   - The Lanzi house (Fiammetta, romance #8).
10. **Sauvemer**, from summer year 22 to autumn year 23:
    - the King returns with Moot money bought with a promise on the wool;
    - **the storm of the breach fails** against a retrenchment;
    - the burial truce (Dame Clémence, romance #9);
    - a second winter of flux, with Varesco galleys running the blockade;
    - the mine and the countermine;
    - the night sortie.
11. **Battle 2 (major): Les Salines.** The relief host is better than twice the Adalian strength. The King fights on the salt pans in front of the town.
    - The Valdrennish come along the causeways on foot. The garrison sallies into the Adalian rear. The King's banner falls.
    - The Duchess's lances save the day.
    - Vervais stands aside and never says why. The reason is seeded for Ch3.
    - The Valdrennish withdraw in good order. Adalia holds the field, losing a fifth of its army.
12. **The surrender of Sauvemer on terms.** He can carry the terms between the council and Dame Clémence. Nobody is hanged.
13. **Christmas at Sauvemer.** Lady Alys Fane, romance #6.
14. **The Lenders' Truce.**
    - The Lanzi and Varesco stop lending to both kings in the same week, and Cardinal Brancale brokers the truce.
    - Adalia keeps Sauvemer. The wool goes back to Vervais.
    - **The Armance is abandoned.**
15. **The truce years.** Garrison, the Iron Company, the one trip home, and Ravell ruined by its lord's ransom.
16. **The grants.** Ormel, with ceremonial knighting.
17. **The Mottle**, the great mortality, arriving from the east. The end.

**Pacing:** 20 seasons in all. The date changes at almost every main beat, so the five years read as five years.

**Removed as too close to the Hundred Years' War:**
- the tidal ford;
- the windmill hill;
- the wet crossbow strings;
- the fifteen charges;
- "the unfortunate King";
- the useless mouths;
- the six burghers and the Queen's mercy;
- Newtown;
- the bubo description of the plague.

**Partials are mixed wins.** No partial outcome in the new Ch2 battles gives a serious wound, so a partial never sets up a death in the next scene.

### Systems added
- **Retinue:** `join`/`leave`, loyalty, and the `retinue` count. The `casualties` effect kills unnamed men and random named followers, and can spare named people such as Davy.
- **Armour:** an item value. A jack is 1; a harness is 2. Every means-of-knighthood option now grants a harness, and the man-at-arms indenture grants a mail shirt.
- **Serious wounds:** an injury flag. `injured` now means seriously wounded; minor wounds such as bruises, a cut brow or an arrow wound do not trigger the death rule.
- **Friends:** they appear as modifiers and options (Aymer, Cobb, the squires, Tallis).

### Butterfly hooks
Ch2 reads 28 more Ch1 and prologue flags. Examples:
- the Leven ford experience at the landing;
- bargaining background at Bréval;
- the tourney or a trial by combat at Hautbois;
- the relics oath on the eve of Hautbois;
- the Ravell fee in the winter camp;
- Pryce's leverage;
- Maud's scandal and her note;
- Coll's fate in Ewan's letter;
- the cunning woman's crown at the feast.

The 33 not yet read are marked `later: ch3`.

### Balance through the end of Ch2 (bot, 200 runs per cell, after the revision)
| Policy | Knighted in Ch1/Ch2, not ceremonially | Dead |
|---|---|---|
| Martial | 79-96% | 4-18% |
| Cunning | 69-84% | 0-7% |
| Diplomacy | 42-53% | 3-8% |
| Wealth | 32-49% | 8-13% |
| Random | 29-39% | 8-18% |

- Knighthood in the war needs a deed plus a large name. The thresholds are renown 10 at Grisolles, 11 for the eve route without a sponsor, and 12 in the field at Les Salines.
- Cautious and diplomatic players mostly reach the ceremonial knighting at the grants.
- Deaths cluster at the Ch1 crises, the rout at Grisolles, and the King's banner at Les Salines.

## Decisions log
| Date | Decision |
|---|---|
| 2026-10-01 | Phase 0 approved as written, plus the items below. |
| 2026-10-01 | Romance: every chapter, aimed upward; marriage only from Ch3; ~12 candidates, no run sees all (§11a). |
| 2026-10-01 | Ch2 entry: Knight (peacetime dubbing) or man-at-arms with patronage and a chance at knighthood in the war. No squires at war. |
| 2026-10-01 | Romance candidates are women only. |
| 2026-10-01 | Player names protagonist; £sd currency stored in pence; regnal years. |
| 2026-10-01 | Phase 1 built: see implementation notes. |
| 2026-10-01 | Phase 2 built: prologue and Chapter 1. See Phase 2 notes. |
| 2026-10-01 | Writing direction revised: tighter prose with Continue pages, branching over length, butterfly effect, approximate word goals, date header on change only, friends as semi-companions, partial = mixed win, People/World pages. Ch2 skeleton next, then deepen all. |
| 2026-10-01 | Ch2 design decisions 1-11 recorded (see Chapter 2 decisions). Writing depth: target 400-500k words; prologue and Ch1 to be deepened before Ch2 (see Writing depth). |
| 2026-10-02 | Ch2 war revised: original campaign (staple, Vervais, Grisolles defeat, failed breach, Les Salines held not won, Lenders' Truce, Armance abandoned); harder knighting; partials never deal serious wounds; debug Rewind added. |
| 2026-10-01 | Phase 3 review decisions: 9a, 11c, 12c, 14b, 13a. Historical items kept, except champion (15, replaced) and the Sweat (17, renamed). See Phase 3 review changes. |
