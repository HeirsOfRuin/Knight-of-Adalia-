# DESIGN — Phase 0 proposal (pending approval)

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
| Retainer | Patronage Gate. Sub-tracks: `squire_track`, `household` (lower), `levy` (lower) |
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

**Failing the gate** puts him on the household or levy track. Ch1 has at least 2 routes from there to squire. If all of them fail, he enters the Ch2 war as a man-at-arms with a captain's sworn promise of sponsorship. This counts as "knight-in-waiting" and keeps the battlefield-knighting route open.

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
4. **"Knight-in-waiting" needs a definition.** I'm proposing: a Squire, or a man-at-arms holding a sworn sponsorship promise. Without the second case, a lower-track player could arrive at the war ineligible, which conflicts with the rule that he must reach the Ch2 war as a knight or knight-in-waiting.
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

## 12. Assumptions (correct any that are wrong)
- The player can name the protagonist. A default name is supplied, along with a random option.
- Currency is pounds, shillings and pence (12d = 1s, 20s = £1), stored internally in pence. A laborer earns about 2d a day.
- Years are counted as regnal years, for example "the 14th year of King [X]".
- "Lord" in the reputation list means the protagonist's own liege. It is tracked as a relationship, not a faction.
- Romance candidates are women. The protagonist is defined as one man in a 14th-century analog, and marriage is the mechanism for alliances and heirs. Tell me if you want other options.
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
