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
- Chapter cards: a title page before the first scene of each chapter and act (page 0 of that scene), summarising where he stands and what changed since the last card.
- A debug drawer, opened with `?debug=1` or a keyboard toggle: a state tree, a flag editor, a scene jump, a force for the next check outcome, and the seed.

## 11. Pushback and scope risks
1. **"Every ending reachable" cannot be proven statically.** With conditions that depend on stats, general reachability is undecidable. I'll combine two things:
   - a static graph check that some path links to each ending scene;
   - an empirical check in which goal-seeking bot runs must reach every ending for every background.

   This check only becomes meaningful in Phase 4+. Until Ch5 exists it reports "pending". (Ch5 is built: it now reports 0 pending.)
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
The first skeleton was a string of Adalian victories modelled too closely on 1346-47. The revised war is original to this world. It swings back and forth, and ends in a real Adalian victory that is hard won and expensive (user direction: "hard won, realistic, a bit back and forth before we start taking some risks and having them pay off with cost").

**The King's plan has three legs, and only one of them holds:**
- **The Armance:** land in the Armance as the Duchess's ally. This one holds.
- **Vervais:** the weaving towns, starved of wool by the King's embargo at the Saltcombe staple, have sworn to rise. This leg fails.
- **The Ostmark:** the Margrave, bought with Sarenzan money, is to invade from the east. This leg fails.

| # | Beat | Swing |
|---|---|---|
| 1 | The crossing: a storm scatters the fleet, and the siege timber is lost | against |
| 2 | Port-Haudry: a contested landing, won at a cost | for |
| 3 | The march east: Bréval, the foragers, Vaudrey taken by night through a dyer's gate. Corbie is taken; Héloïse comes (romance #7) | for |
| 4 | The Lisonne: Vervais does not rise. Duke Lothaire was bought with the salt tithe, and the Margrave never marched | against |
| 5 | **Grisolles (battle 1): a defeat.** The rearguard is caught at a single bridge in a mist and its bridge is broken. Adalia loses 1,800 men, the baggage and the pay chest. Ravell is taken; the master is taken unless saved | against |
| 6 | The retreat, and the unpaid winter at Lannec. Caldmoor invades under the Old Bond. The Lanzi house (Fiammetta, romance #8) | against |
| 7 | **Harlow Moss.** The King breaks the Caldmoor host at home. This is reported, not played | for |
| 8 | Sauvemer invested. **The fireships** burn the harbour: a risk that pays, at a cost | for |
| 9 | **The storm of the breach fails** against a retrenchment. The burial truce (Dame Clémence, romance #9) | against |
| 10 | The second winter: flux, and Varesco galleys running the blockade. The boom (player risk). The mine and the countermine | mixed |
| 11 | The night sortie | mixed |
| 12 | **Les Salines (battle 2, major): the King's gamble.** He fights at better than two to one, on the salt pans, with the town at his back. The garrison sallies and the King's banner falls. The Duchess's lances and the tide turn it. Amaury's host breaks and drowns in the pans; the Constable gets out. Adalia loses a fifth of its army. Vervais stands aside, unexplained until Ch3 | for, at great cost |
| 13 | Sauvemer surrenders on terms. He can carry them | for |
| 14 | Christmas at Sauvemer (Alys Fane, romance #6) | - |
| 15 | **The truce of Saint-Lys.** The banks force it on both kings, and Les Salines decides the terms: Sauvemer and its march to Adalia, held of no one; the Duke of Armance exchanged home; the wool back to Vervais. Not the crown of Valdrenne | for, limited |
| 16 | The truce years. Garrison, the Iron Company, the one trip home, and Ravell ruined by its lord's ransom | - |
| 17 | The grants (Ormel, with ceremonial knighting). The Mottle. The end | - |

**Pacing:** 20 seasons in all. The date changes at almost every main beat.

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

**Partials are mixed wins.** No partial outcome in the new Ch2 battles gives a serious wound.

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
| Martial | 75-96% | 4-18% |
| Cunning | 73-84% | 0-7% |
| Diplomacy | 44-56% | 3-8% |
| Wealth | 37-49% | 8-13% |
| Random | 31-46% | 9-20% |

- Knighthood in the war needs a deed plus a large name. The thresholds are renown 10 at Grisolles, 11 for the eve route without a sponsor, and 12 in the field at Les Salines.
- Cautious and diplomatic players mostly reach the ceremonial knighting at the grants.
- Deaths cluster at the Ch1 crises, the rout at Grisolles, and the King's banner at Les Salines.

## Deepening pass (2026-10-02)
**Prologue:** 14 to 20 scenes, about 17k words.
- Burgess, archer and servant openings rewritten to the reeve opening's depth.
- One home scene per background builds the family and introduces the childhood sweetheart.
- Shared scenes added: Sir Walter Pryce on the road at ten, and Midsummer Eve at twelve.
- Every time jump is bridged.

**Ch1:** 46 to 50 scenes.
- New quiet scenes: the first night, harvest home, the master's ride, and the winter after the Leven.
- Fourteen main scenes deepened with Continue pages and callbacks.
- Friends built deliberately: Aymer for Hamon's household, Will Cobb for Brome.
- The master's knighting now needs respect 6, which keeps the goal-directed peacetime average near 30%. Martial play is the outlier, at about 70%.

**Ch2:** the first night ashore added, to build the men before the war starts killing them.

**Training (added 2026-10-02 at the author's request).** Ch1 covers about five years, so it now marks the stages of the trade:
- **Winter at the Pell** (first winter).
- **The Quintain** (second spring): riding, sword with Sir Bertram, the long butts, or the rolls of arms.
- **Sir Bertram's Lady Day test in harness** (the spring after the Leven).
- **The Long Winter** (after the tourney): drilling men, the old campaigns, running a manor, or learning Valdrennish.
- **Two practice side events:** wrestling on the green and running at the ring.

Most training choices give +1 to a skill and +1 to `counter.training`. The training flags pay off as modifiers in Ch2.

**Voice pass complete, prologue to the end of Ch2.**
- Every main scene, side event and delayed consequence has been through the House voice pass: spoken lines, bodily reaction, the village or camp chorus, and narrator tics removed.
- The style lint reports none of the tracked tics.

**Content now:** prologue 20 scenes, Ch1 55, Ch2 64. About 95k words of scene YAML.

**Balance after training (bot, 200 runs per cell):**

| Play style | Knighted | Dead |
|---|---|---|
| Martial | 96-100% | 0-2% |
| Cunning | 83-94% | 0-3% |
| Diplomacy | 48-59% | 0-5% |
| Wealth | 58-66% | 6-10% |
| Random | 46-56% | 4-12% |

- Ch1 peacetime knighthood averages about 35% across goal-directed play (the master now needs respect 7).
- Deaths are concentrated in the Ch1 crises and the Grisolles rout.
- A trained, martial player now rarely dies in Ch2. War costs land on his men, his master and his friends rather than on him. Raise the Ch2 lethal checks if the author wants more personal danger.

## Chapter 3 frame (approved in principle, 2026-10-02)
**Working title:** The Manor.
**Span:** spring of year 26 to spring of year 32. Ages 25 to 31. About 24 seasons.
**Size:** 75+ scenes, about 90k words written; a single run sees perhaps 35-40.

### Which manor (decided by the author: three grants)
At the end of Ch2 the King pays men with land near where they earned it. Ch2 deeds feed two fame counters at the grants: `counter.fame_sauvemer` and `counter.fame_armance`. Renown sets the bar.

| Grant | Earned by | Character |
|---|---|---|
| **Ormel** | Renown under 10, or no strong fame anywhere: "not known for much" | Poor marsh manor behind Sauvemer. About 200 people, floods every winter, watched him besiege their town. |
| **Marsalin** | Sauvemer fame 5+ and at least equal to Armance fame. Built from the fireships, boom, gallery, sortie, sluices, turning the garrison, the banner, Thibaut, the terms, the Iron Company and the breach | The salt manor at Les Salines: rich pans, a stone house, the causeway. The salt-boilers remember him, and half of them buried kin out of those pans. |
| **Kerval** | Armance fame 4+. Built from Corbie, Vaudrey, the Duchess's notice, the Grisolles rearguard, baggage, ford, master, wounded, the ambush, the Duchess's message and holding the Armance castles | Good farmland in the hills behind Lannec, granted with the Duchess's assent. Friendly people, the best land, and the most exposed: a day from any Adalian garrison, inside the Duchess's politics. |

- **Ask for more:** succeeding adds a rider to the grant (Ormel's salt rights and fishery; the Marsalin causeway toll; the Saint-Méen hamlet at Kerval). Sets `c2_granted_more`.
- **Bot spread (400 runs per policy):**
  - martial play gets Marsalin or Kerval about half and half;
  - cunning play mostly Marsalin;
  - diplomacy and wealth play mostly Ormel;
  - random play is spread across all three.
- **Ch3 is written once, with the manor as a variable.** Each manor has its own people, its own threats and its own variant scenes.

### Answers recorded
1. **Setting:** the granted manor is primary. Marriage may add an Adalian holding.
2. **Plague:** about a third of the manor dies whatever he does. Preparations move that by about 10 points. In most runs, someone he cares about dies. (Agreed.)
3. **War:** a chapter of rough peace. The truce expires in year 27 into border raiding, not campaigns. The next great campaign is in Ch4. (Agreed.)
4. **Unrest:** a rising in Adalia reaches him through his family and Wat, plus unrest on his own manor that he can head off. (Agreed.)
5. **Children:** born in Ch3, three at most. They stay in the background until Ch4, which has their growth periods. (Agreed, with the cap.)

### Acts
1. **The Mortality** (spring year 26 to spring year 27).
   - **Arrival:** the bell is already tolling.
   - **His plague choices:** shut the village in, flee to the nearest town, stay and nurse, burn the sick houses, or bring in physicians.
   - **What Ch2 decides:** preparations (`c2_prepared_plague`, `c2_clean_water`, `c2_prayed_plague`), standing with the locals (`c2_learned_town`, `c2_fought_iron`, `c2_refused_villages`, `c2_terms_carried`), and the grant itself.
   - **Deaths:** named followers can die, and letters bring deaths at home.
2. **The Lord** (years 27-29).
   - **The estate cycle:** a decision and an event each season.
   - **Labour:** the shortage, wages against the King's ordinance, settlers.
   - **Claims:** the dead lord's kin (at Ormel or Marsalin) or the Duchess's rival claimant (at Kerval).
   - **Raiders:** Iron Company remnants.
   - **The truce expires:** border raiding by Valdrennish march lords. Thibaut de Brésy is a neighbour.
3. **The Match** (years 28-30).
   - **Candidates:** the suits he has kept alive, plus #10 (a neighbouring lord's daughter, arranged) and #11 (his liege's ward, as a reward). Kerval makes Héloïse and the Armance gentry closer. Marsalin makes Clémence and Fiammetta closer.
   - **The process:** proposal, her family, the dowry, the wedding.
   - **Children:** the first child is born; at most three in the chapter.
4. **The Reckoning** (years 30-32).
   - Black Ewan; the Lanzi lien; Ravell's ruin; the Adalian rising and Wat; Pryce and the Carrow faction; Prince Edwin; the Vervais reveal.
   - **Ends with** the opening to rise: a second grant, a barony, a summons. Ending `ch3_complete`.

### Systems to build
- **Estate (`estate.ts`).** The manor tracks people, labour, granary, income, temper (-5 to +5), church, defences and its specialty: salt at Marsalin and Ormel, orchards and grain at Kerval. Each season ticks the numbers and draws events whose conditions read them. There is an Estate panel in the UI.
- **Plague.** A seasonal mortality draw; named deaths through `casualties`, extended to family and candidates.
- **Marriage.** Suits are evaluated into available candidates; then the proposal, family and dowry checks, the wedding, and the spouse as an NPC.
- **Heirs.** Births drawn with the seeded RNG, at most three. Each is a small NPC record, with growth deferred to Ch4.

### Butterfly payoffs (examples)
| Earlier choice | Ch3 consequence |
|---|---|
| `c2_breval_sacked`, `c2_raided_country`, the `burner` trait | The manor's temper starts low. A burned village's daughter is among his tenants. |
| `c2_terms_carried`, `c2_learned_town` | Temper starts higher. Clémence is a near neighbour (Ormel, Marsalin). |
| `c2_jehanne_message`, `c2_armance_castles` | The Duchess's favour at Kerval. |
| `c2_took_thibaut` / `c2_pryce_took_thibaut` | Who the Constable's son blames when the truce ends. |
| `c2_lanzi_loan`, `c1_lanzi_debt` | The Lanzi hold a lien on the manor's income. |
| `c1_coll_hanged` / `c1_coll_freed` / `c2_coll_repaid` | Black Ewan's vendetta, or Coll as an unlikely ally. |
| `c2_saved_master` / `c2_master_taken` | His old master as a guest, a creditor, or a grave. |
| `c1_learned_manor`, `c1_learned_valdrennish` | Better estate and village checks from the start. |

### Still open
- **Ch2 personal danger for well-trained fighters:** left as is. The author expects most players to spread their training over two or three areas.

### Built so far (2026-10-02)
**Engine.**
- **`estate.ts`:** fields `people`, `food` (seasons of grain), `temper` (-5 to +5), `defence`, `church`, `salt`, `orchard`.
- **Effects:** `found_estate` creates the manor; `add: { estate.x }` changes it; `lose_share: { estate.people: 33 }` takes a percentage.
- **Seasonal tick:**
  - every season eats one season of grain;
  - at Michaelmas the harvest comes in (people / 50 + orchard / 2) and rents are paid (people × 3d + salt × 40d + orchard × 30d, halved if temper is -3 or below);
  - an empty granary costs 4% of the people and 1 temper.
- **UI:** a "Your manor" section on the Status page.
- **Validator:** checks estate paths, and supports `in_progress` chapters, so flags held for later acts stay quiet.

**Act I, the Mortality.** Nine scenes; each manor has its own priest, headman and variants.
- **The scenes:** arrival on the day of the first death; fleeing to the town (optional); the lord's measures; the plague in his own household; letters from home; the empty harvest; the reckoning; the first spring.
- **Starting temper:** set by the grant and by Ch2 conduct (burning and raiding, carrying the terms, fighting the Iron Company, Valdrennish lessons).
- **The death toll:** `counter.plague` starts at 37. Ch2 preparations and Act I choices move it, and `c3_reckoning` takes 25%, 33% or 42% of the people.
- **Personal losses:**
  - one of his household always dies, chosen at random from his named followers;
  - one parent dies at home (Piers, Ralf or Agnes; the archer's mother Alison, since Hugh died in Ch2).
- **Bot results:** most runs lose a third. Fleeing or the processions push it towards 42%. Preparations plus a physician or a shut manor bring it to 25%.

**Act II, the Lord** (spring year 27 to spring year 29). Eight spine scenes and nine manor events (pool `c3_manor`, one draw between spine scenes).
- **The Ordinance of Labourers.** Enforce it, pay the market quietly, let the empty holdings as tenancies (stewardship check), or put his own men in the fields.
- **The Settlers.** Adalians from Saltcombe led by Hodge Brewster; at Kerval, the Duchess's burned-out border families instead. Give them the empty houses, settle them apart, mix them holding by holding (diplomacy check), or refuse them.
- **The Old Lord's Kin**, one per manor:
  - Hugues d'Ormel, the nephew, with a Cordelle writ;
  - Dame Péronnelle de Salines, the widow claiming her dower third;
  - Yann de Penhoët, of the rival claimant's party.

  Fight it at law, buy them out, share part of the manor for their oath, or threaten.
- **Lady Day.** The truce expires into raiding. Thibaut de Brésy rides with the march lords. Prepare with defences, a village militia, or a pact with the neighbours.
- **Fire in the Night.** The border raid. Fight (lethal; uses defences and the pact), shelter everyone, or parley with Thibaut.
- **The Masterless Men.** Rotbart and sixty Iron Company remnants. Hire them as a garrison, hunt them, or feed them and send them home.
- **The Burning Rick** (only if temper is -3 or below). The manor rises at his gate. Hear them, clear the gate, or hang the rick-burner.
- **Winter in the Hall.** Davy asks leave to marry Aude and, if `c2_promised_davy`, reminds him of the promise. Give him a holding, knight him by the fire, or tell Grisolles properly.
- **The Second Spring.** The current end of build (`ch3_complete`), with marriage now the question.

**Manor events:** the manor court (pigs in the widow's barley), the mill shaft, the marriage fine, the poacher boy, the sea over the dyke (Ormel, Marsalin), the late frost (Kerval), the Varesco salt-buyer (Ormel, Marsalin), the Lanzi clerk (if in debt to them; Fiammetta now heads the house), and the church roof.

**Bot results (200 runs per policy):**
- people at the end of Act II average 165-216;
- the unrest fires in 41% of cunning runs, 27% of random runs, and 0-5% of the rest;
- no Ch3 deaths so far;
- coin at the end averages £9-16.

**Act III, the Match** (spring year 29 to harvest year 30). Eight scenes in `ch3/03-match.yaml`.
- **The Second Spring** now evaluates every suit:
  - a suit kept alive becomes `available`;
  - every other suit that was still open is `lost`, with a line about whom she married instead. Candidates do not wait.
- **Who is available:**

  | Candidate | Condition |
  |---|---|
  | Childhood girl | Courted, regard 5+, and a token or the leaving promise |
  | Isabel, Cecily, Joan | Courted, regard 5+ |
  | Alys | Courted, regard 3+ |
  | Maud, Héloïse, Fiammetta, Clémence | Known, regard 5+ |
  | **#10 Aliénor de Brésy** (Sire Gautier's daughter, across the march) | Always offered: peace on the border is the dowry |
  | **#11 Lady Philippa Ashdown** (the King's ward) | Crown 2+, renown 12+, or no personal suit survived (the King rewards an unmarried lord) |

- **A Wife for the Manor.** The village and the priest press him; each available woman gets a paragraph; marrying nobody is allowed.
- **Her People / The Offer.**
  - **Make your case:** a Presence + Diplomacy check against difficulty 2. Each candidate carries her own obstacle modifier: the Crown's price for Maud, the Earl's pride for Alys, the merchet for Mariot, Lady Ravell, Ralph Wyck, and so on.
  - **Pay:** £2 to £30.
  - **The King's word:** Crown 3+, costs Crown standing.
  - **Let her settle it:** regard 7+; her kin hold it against you.
  - **The meadows:** Aliénor only.
  - **Failure** loses her and returns to the list. A widow or heiress who gives herself marries you against her kin instead. An arranged bride comes on hard terms.
- **The Contract.** Hard bargain (a Trade check), fair terms, or nothing but her.
  - Dowries run from a cow to £60.
  - Land comes as flags for the Ch4 holdings system: `c3_holds_lisle`, `c3_holds_wyck`, `c3_holds_ashdown`, plus Héloïse's vineyard and Clémence's Sauvemer house.
- **The Wedding.** Four set pieces: village, merchant, gentry or court, Valdrennish. Feast, plain wedding, or hers.
  - **Standing:** a commoner wife gives Commons standing and costs some with the gentry. Every other wife sets `noble_marriage`, which lowers prejudice.
  - **Kin flags:** Lanzi, Westry, Corbie, Brésy.
- **Husband and Wife.** Her agenda by kind:
  - a commoner is snubbed by the county;
  - a merchant's daughter wants the books;
  - a gentlewoman has her own idea of the house, and Philippa resents being given;
  - the Adalians distrust a Valdrennish wife.

  He can give her the keys, stand with her, or keep his own counsel.
- **Lying-In and Childbed.**
  - **Who attends:** the Sarenzan physician (5% maternal death), the country midwife (2%) or Saint Margaret's girdle (3%).
  - **The child:** a son or daughter drawn with the seeded RNG, then named by the player for his father, mother, master, the King, the Queen Mother, a saint, himself, or her mother.
  - If she dies, the scene says so and the child lives.
- **End of build:** `c3_match_end`.

**Engine additions:**
- **Heirs:** `state.heirs` (name, sex, born, alive). Effects `birth`, `name_heir` (`@self` = his name), `heir_dies`. Paths `heirs.count / born / sons / daughters / last / lastname / eldest / names`.
- **`chance`:** a seeded percentage branch. Scene-entry effects now get the RNG cursor. This also fixed a silent bug: the plague's "one of your household dies" in `c3_household` never killed anyone.
- **Spouse alias:** `@spouse` works in `suit.*` paths.
- **UI:** a "Your family" section in the status panel.
- **Calendar fix:** Lady Day had drifted to winter, so Act II now runs one season later. The raid is in June, the bandits in autumn, and the hall in winter, as the text says.

**Bot results** (100 runs per background per policy):
- **Options at the match:** usually 2-4; about 10% of random runs see only Aliénor.
- **Who they marry:**
  - martial play marries Aliénor almost every time, because the tags pull it there;
  - wealth play marries Philippa 50% of the time and Cecily 22%;
  - diplomacy play spreads across nine candidates.
- **Childbed:** the wife dies 1-4% of the time. About 1 run in 30 overall.

**Act IV, the Reckoning** (winter year 30 to autumn year 32). Eleven scenes in `ch3/04-reckoning.yaml`. Chapter 3 is now complete and is no longer listed as in progress.

**The Paper** (only if the Lanzi lien still stands and he did not marry Fiammetta). The Lanzi have sold his debt to the Earl of Carrow. He can:
- pay £4;
- keep the Earl's friendship, and the Earl keeps the paper;
- fight the sale at law (a Learning check; the lien was not assignable).

**The Commons Rise.** The rising over the Ordinance reaches his home through letters, in a version per background. If Wat Coker is in his following, Wat's cousin Will leads the rising under Wat's name and Wat goes home. He can:
- ride for the King;
- cross to talk to the rebels;
- send money and stay;
- refuse outright: Crown −3, Commons +2.

**The Hythe Fields** (if he went). The King grants the charters. Then the Earl of Carrow's marshal, Sir Hugh Malet, cuts down the Coker captain while the King looks away. He can:
- stand by;
- shout a warning;
- ride between them (a Riding check). The King turns it into his own mercy.

The charters are revoked by Michaelmas either way. If he stayed away, **News from the Hythe Fields** covers it, and the hangings at home are written per background.

**The March.**
- **If Ewan's vendetta stands:** Ewan raids his family's home. He can:
  - cross the Leven to finish it (lethal);
  - pay for a wall and a tower at home;
  - write to Coll, if Coll lived.
- **If Coll repaid his freedom:** he is invited to Coll's wedding in Caldmoor.
- **Otherwise:** a quiet line about Sir Ancel.

**The House of Ravell.** Ravell is ruined by the ransom, the plague and the rising, and is selling. Aymer brings the news. He can:
- buy his own birthplace for £30 (Ashby, Hollin, the Wendham rents, or Underhill), setting `c3_holds_home`, an Adalian holding for Ch4;
- buy it with £15 down and the rest owed;
- lend Aymer money;
- let it go.

**The Winter Fever.** If he has a child, the eldest falls ill. The child dies 15% of the time with the physician, 7% if he nurses it himself, and 10% with Masses.

**What the Weavers Knew.** The proof that the Earl of Carrow sold the Vervais rising to Duke Lothaire, to keep the war long and the Crown poor. The source depends on his past: Fiammetta's ledgers, Thibaut, the weaver's widow, or a drunk Aymer. He can:
- take it to the King;
- take it to Prince Edwin, now 21 with his own household at Saltmarsh;
- sell it back to Carrow;
- keep it.

**The Second Child** (if married and his wife is alive). Same risk to the mother: 4% with the physician, otherwise 2%. Names for his family, a saint, or a friend.

**The Summons.** King Amaury is dead and the truce runs out at Lady Day. Pryce comes recruiting for Carrow. He goes to the great council as:
- the King's man;
- Carrow's man;
- Prince Edwin's man;
- his own man.

**End:** `c3_end`, The End of the Peace. Ending `ch3_complete`.

**Old hooks.**
- **Paid off in Act IV:** the reeve's burned tallies or his confession, the burgess family's Sarenzan debt, Ancel's lameness, Thorne, Cobb's debt from Grisolles, Pryce's old service, the Christmas feast, the Corbie ransom, Isabel's year of waiting, Maud's kept letter, the Ormel grant, the salt-pan dead.
- **Moved to Ch4:** 43 flags marked `later: ch3` are now `later: ch4`. They are mostly about the masters, the rivals, how he got through the Patronage Gate, and Ch2 conduct. Ch4 owes them a reading.

**Bot results** (100 runs per background per policy):
- deaths in Ch3 are 0-4%, from the lethal Ewan fight;
- a child dies in the fever 5-15% of the time, highest for wealth play because it buys the physician;
- the wife dies in childbirth 3-8% of the time over two births;
- he buys his home place in 17% of random runs and 90% of wealth runs;
- party choices and the Vervais choice are spread fairly evenly in random play.

## Training ceilings and learning by doing (2026-10-02)

From a playtest save: a focused archer entered Ch2 with Arms 7 and won every fighting check at the 95% cap, while almost nobody could lead men (Command 0-1 for every bot policy) or talk (Diplomacy had one source before the war).

- **`train` effect.** Ordinary drill (`{ train: { arms: 1 } }`) raises a skill only to a ceiling, 4 by default. A real teacher sets a higher one (Sir Bertram's lessons and the marshal 5, Bertram's test 6). Battle deeds still use plain `add` and are uncapped.
- **Overflow.** Drill past the ceiling in a physical skill goes into the body instead, once per attribute (to a max of 5): Arms to Endurance, Archery to Strength, Riding and Woodcraft to Endurance. The note says so ("practice alone can take you no further..."). Other skills just get the note.
- **Learning by doing.** `quiet: 1` is the same cap without the note. Success at a leadership check early in Ch2 trains Command (ceiling 5). Success at a Diplomacy check in the prologue and Ch1 trains Diplomacy (ceiling 4).
- **New scene.** `c1_watch` (The Ford at Aikbank), between the winter after the Leven and Sir Bertram's test: twelve men and six weeks on the March. Learn their names, keep a hard watch (a Command check), or leave them to Thwaite and ride the fords (Tactics and Woodcraft). The long-winter drill option now gives Command +2.

Result (bot, 100 runs per background, entering Ch2; median / top 10%):

| Policy | Arms | Command | Diplomacy |
|---|---|---|---|
| martial | 5 / 6 (was 5 / 7) | 2 / 4 (was 1 / 1) | 1 / 2 |
| diplomacy | 1 / 2 | 2 / 4 | 4 / 5 (was 1 / 2) |
| random | 3 / 5 | 1 / 3 | 1 / 3 |

## Chapters 4 and 5: direction (2026-10-02, framing to follow Ch3)

- **Order of work.** Finish Ch3, then a stabilisation pass (save size and export, a full read-through), then frame Ch5 first and Ch4 back from it, in one document. Build Ch4 only after the frame is approved.
- **The crown.** The throne in play is a new one: forged either from the corpse of an invaded kingdom, or out of a civil war or rebellion. It means independence from both powers on either side. It is not Adalia's throne, taken.
- **Crowned is rare.** Aim for 5-7% of runs, needing a deliberate long play.
- **Ch4 shape.** 3-4 acts with time skips across ages 32-42, the same as Ch3.
- **Heirs.** A mix: moments of mentorship, management, drama and pride, woven into the diplomatic gains and life decisions. Not a separate story arc for each child.
- **Scope guard.** Cut any Ch4 thread that no ending reads.

## Chapters 4 and 5 frame
Approved 2026-10-02 (`docs/FRAME-CH4-CH5.md`): the Western Crown, the Ch5 endings matrix, the Ch4 acts and systems, the hooks owed, and open decisions.

## Chapter 4 as built
**Engine (Ch4 systems):**
- **Other holdings.** `state.holdings`, with the ids registered in `registry/holdings.yaml`.
  - Effects: `hold` and `release`. Paths `holding.<id>.held / income / temper`, plus `holdings.count` and `holdings.income`.
  - Each holding pays its yearly income at Michaelmas, halved if its temper is -3 or below.
  - Ch3's land flags (home place, Lisle, Wyck, Ashdown, vineyard, Sauvemer house) become holdings at the great council.
- **Heirs' growth.**
  - Every child gets a temperament (bold, bookish, merry, grave), drawn at birth. Existing children are given one at the council.
  - Upbringing (home, page, church, arms, letters, court) and a bond with him (-5 to 5).
  - Effect `heir_set` with selectors eldest, second, third, last or all. Paths `heir.<sel>.name / sex / age / ageword / temperament / upbringing / bond / alive`. `add: { heir.<sel>.bond }`.
- **Court standing.** Counters `court_king`, `court_prince`, `court_carrow` and `west_estates`, shown on the status page as a word.
- **Death-rule validator.** A `die` must sit under a condition on armour or injured, so that a harnessed, unhurt man is badly hurt instead. Three new lethal failures broke the rule and were fixed: Ewan in Ch3, the gap and the charge at Mortefontaine.
- **Harvest.** Changed from people/50 to people/40. After the plague, manors were slowly starving in the background through the chapters that have no estate scenes.
- **Ending renamed.** The placeholder ending `ch3_complete` is now `story_so_far`. Ch4 is in progress.

**Act I, the Second War** (Martinmas year 32 to spring year 35; 12 scenes in `ch4/01-second-war.yaml`):
1. **The Great Council.** Who vouches for him (how he was knighted, his rival), Carrow's "not yet", and the Vervais secret as a live knife. He can:
   - speak for the war (a Diplomacy check);
   - pin Carrow with the secret (if he kept it);
   - go to Edwin's rooms;
   - watch and count.
2. **Before the War.** The children, with their temperaments shown. Who holds the manor: his wife, the priest and reeve, or one of his men.
3. **The Company.** The indenture for 30 lances and 60 archers. He can raise it:
   - in full on credit (`c4_war_debt`);
   - small and veteran;
   - from the manor (people and temper cost);
   - around Rotbart's Iron Company men.
4. **The Armance Again.** The landing at Lannec. Duchess Jehanne, 70, and **Mahaut**, her granddaughter, 14: the seed of candidate #12. He can pay his respects (`west_estates`), stay at the King's side, or scout the road to Mortefontaine.
5. **The Towns Remember.** Vaudrey and Bréval answer to his Ch2 conduct. At Saint-Ferréol he can talk the garrison out, storm it, or starve it.
6. **Winter Quarters.** Drill, keep the men happy, or go home (a bond with the eldest).
7. **The Black Boar, and Mortefontaine** (three scenes).
   - The Constable sends his men-at-arms up the ridge on foot. Carrow's battle does not move.
   - He can ride to Carrow (an Intrigue check, helped by the King's words or his own bargain), hold the gap (lethal), or hold his place.
   - Then the Constable's horse comes up the stream: charge them (lethal), shoot them in the stream-bed, or tend the wounded.
   - **Outcome:** counter `mf` gives victory (6+), a bloody draw (3-5) or a defeat.
8. **The Second Grant.** He is made a banneret. He chooses La Garde (a border tower), the rents of Vaudrey (its temper set by his Ch2 conduct there), or a place as knight of the King's chamber.
9. **End of build:** `c4_act1_end`.

**Bot results** (100 runs per background per policy):
- deaths at Mortefontaine are close to 0 now, since bots arrive harnessed and the death rule holds;
- the battle splits roughly 35-55% bloody draw, 20-40% victory and 7-57% defeat, by policy;
- most runs now hold 1-3 other holdings by the end of Act I.

**Act II, the Lord of Many Places** (summer year 35 to spring year 38). Eight spine scenes in `ch4/02-many-places.yaml`, plus four events in pool `c4_lord`.
1. **Stewards.** A holding's receipts are down a fifth. He can:
   - audit it himself (a Stewardship check; reeve and burgess backgrounds get a bonus, and the reeve gets an echo of his father's tallies);
   - hire a Sarenzan clerk (income up, temper down);
   - trust his stewards.
2. **An Old Face.** The boyhood rival, read through `@rival` and the prologue and Ch1 rival flags:
   - a follower asks for land;
   - Wat Coker is an outlaw in the chase, wanting his family's holding back, or he is a grave;
   - Jocelin Tanner has bought the Mercer debts;
   - Gib Shawe is bailiff of Hollin;
   - Aymer recruits for the Prince.
3. **The Eldest** (the first growth period, about age 5-6). Text varies by temperament. He can send the child:
   - to the Prince as a page (a son, with court standing);
   - to the Duchess's household at Lannec, near Mahaut;
   - to the abbey;
   - or keep the child at home (bond +3).
4. **The King's Christmas.** Aldred, 51, is visibly dying. He can stand by the King, swear to the Prince, dine with Carrow, or spend the Vervais secret by leaving it with the Chancellor.
5. **The Third Child** (only if his wife is alive and fewer than three children were born). A 3% risk to the mother. Names for the Prince, the old Duchess, the King, a saint, or an old friend.
6. **The Salt Guilds.** Adalia's salt penny in the West. He can enforce it (King +2, West −3), stand with the guilds (West +3, King −2), or broker a bargain (a Diplomacy check against difficulty 5).
7. **The Duchess Is Dead.** Jehanne dies, and Mahaut (18) is the King's ward. He can:
   - ask for her himself (only if a widower or unmarried; candidate #12, `mahaut_armance`);
   - speak for her right to choose;
   - back the Prince's man, Sir Robert Lacy;
   - back Carrow's grandson.
8. **End of build:** `c4_act2_end`.

**Pool events:** the eldest's first horse, a boundary stone between two of his villages, an old friend's visit, and a widow's petition.

**Engine:** `{npc.<id>.first}` gives a first name in prose ("Mariot, propped up on the bolster").

**Bot results** (100 runs per background per policy):
- married runs nearly all reach three children by year 37;
- Mahaut is courted in 2-7% of runs (widowers and the unmarried), consistent with Crowned at 5-7% having several routes;
- top standing by policy: martial play with the King, cunning with the Prince, diplomacy in the West, wealth with Carrow.

**Act III, the Fracture** (summer year 38 to spring year 41). Ten scenes in `ch4/03-fracture.yaml`.
1. **The Old Master.** His last living master dies; if none is left, it is Father Benet. He can:
   - go, reaching the deathbed and receiving the master's sword;
   - send the eldest (bond +2);
   - write, and the letter arrives too late.

   Reads `c1_left_master`, `c1_master_cleared`, `c1_lost_master`, `c2_saved_master` and `c1_ancel_lamed`.
2. **The King Is Dead.** Aldred dies at Candlemas year 39, and Edwin is crowned at Lady Day.
   - Reads: the Hythe Fields warning or rescue (Edwin liked it), the refused ward, the marriage debt, and the Vervais secret (deposited or told, Carrow is called to account).
   - Choices: kneel first, ask a price (the wardenship of the Sauvemer march, helped by `c3_lent_aymer`), or kneel late.
3. **The Black Boar Rises.** Carrow rises "for the King." He can ride for Edwin, ride for Carrow (with standing or a past with him), or stay in the West.
   - Plague-year conduct decides whether the manor sends its men willingly: fair wages or tenancies give `fr` +1 and more men.
   - Settlers housed or mixed give `fr` +1 and Hodge Brewster's men.
   - Coll or Ewan keep Caldmoor out of the war.
4. **The eldest at ten** (the second growth period).
   - **A son** asks to come to war as his page. Taking him is the only way an heir can die in this act: a 30% chance, and only if the flank attack fails. Refusing leads to a quarrel coloured by temperament.
   - **A daughter** has a betrothal offer, from Mahaut's circle, the King's men, or a neighbour. Let her choose (bond +3), or make the match (bond −2, coin).
5. **Wythen Heath.**
   - Before: find the bog (Tactics), walk the line (Ch2 hooks: paid men, rules, Tallis), or parley between the armies (difficulty 6; a third of the field goes home).
   - Crisis: turn into Malet's knights (lethal; the heir risk), close round the banner, or get the boy out (`fr` −1).
   - Counter `fr`: 5+ means his side wins, 3-4 a bloody draw, under 3 his side loses.
   - **Results:** `c4_edwin_won` (Carrow beheaded), `c4_carrow_won` (Edwin holds Wendmere and refuses a regency), or a draw that splits Adalia north and south.
   - **On the losing side:** `c4_on_losing_side`. If he fought for Carrow and Edwin won, he loses his Adalian holdings.
6. **News from Wythen Heath** (if he stayed in the West). The battle is a draw, and the West thanks him.
7. **The Boy King.** Valdrenne's king, now 18, arrests the Constable, who dies in prison. Thibaut flees west to him. He can shelter the Brésy (West +2, Valdrenne +2), send them on to Sarenza, or hand them over (Honor −3, coin; his wife hates it if she is a Brésy).
8. **Lannec.** The salt guilds refuse both taxes. At Mahaut's feast-day, the western lords talk of a duke who answers to nobody, "or more than a duke."
   - His seat depends on `west_estates`.
   - Plague conduct (fled, or went into the plague houses) and the old lord's kin are remembered.
   - He can speak for the West, speak for Adalia, or count the nods. A courted Mahaut's regard rises.
9. **End of build:** `c4_act3_end`.

**Engine:** `heir_dies` takes a selector (eldest, second, third, last). `heirs.lastdead` names the most recent dead child.

**Bot results** (100 runs per background per policy):
- **Wythen:** a bloody draw in 44-91% of runs; his side wins in up to about 35%.
- **Sides:** martial and diplomacy play ride for Edwin; cunning play stays in the West or rides for Carrow; wealth play splits.
- **Heirs:** an heir is killed in well under 1% of runs, and only where he took the boy and the flank attack failed.

**Act IV, the Summons to Lannec** (summer year 41 to Whitsun year 42). Five scenes in `ch4/04-summons.yaml`. Chapter 4 is complete.
1. **The Barony.** He becomes a great lord through one of four routes:
   - Edwin's barony (Edwin won, King's standing 6+);
   - the regency council's barony (Carrow won, Carrow standing 6+);
   - the West's acclaim (`west_estates` 6+, `c4_baron_by_acclaim`);
   - three or more holdings.

   Sets `c4_great_lord` and station `great_lord`.
2. **Mahaut** (only if he courted her). She asks him to ask again (a Courtesy check helped by her regard, speaking for the West, a child who was her page, and great-lord station).
   - **Yes:** a secret betrothal (`c4_mahaut_betrothed`), to be declared before the Estates. This is the marriage claim for Crowned.
   - **No:** he can still be asked again in Ch5.
3. **The Writ.** The Estates of the West are summoned under the swan, the salt measure and Saint-Lys.
   - Counter `estates` (votes at Lannec) is seeded from: standing in the West, the salt stance, sheltering the Brésy, great-lord station, holdings in the West, and Mahaut.
   - What he brings: his company armed, silver (£10), his name (counts at renown 25+), or the kept Vervais letter.
4. **End:** `c4_end` (story_so_far): Whitsun at Lannec. Chapter 5 begins in that hall.

**Bot results** (60 runs per background per policy):
- **Great lord:** about half of runs (90% for diplomacy play, which builds standing in the West).
- **Votes at Lannec:** spread over under 5, 5-7 and 8+.
- **Betrothed to Mahaut:** 1-3% of runs.

## Chapter 5 as built (2026-10-03): the Crown
The game is complete from the prologue to the endings. Twenty scenes in `ch5/01-estates.yaml`, `02-war.yaml` and `03-crown.yaml`. The validator reports 0 errors, 0 warnings and 0 pending, and every ending is reachable for every background.

**Act I, the Estates of the West** (Whitsun year 42).
- **The hall.** He can work the votes (`estates`) by:
  - speaking (Diplomacy, difficulty 5; helped by the plague year, speaking in the garden, his tongue and his renown);
  - the salt guilds (Trade; helped or hurt by his salt stance);
  - the Armance lords (Courtesy);
  - the Vervais knife (+4 votes, at a cost in Honor).
- **Day three:** declare the marriage to Mahaut before the vote (`c5_married_mahaut`, the claim), take Thibaut's forty Brésy knights, promise Hales the King's peace, or wait.
- **The question**, gated by votes:

  | Answer | Votes needed | Result |
  |---|---|---|
  | Adalia | any | `c5_west_adalian` |
  | A free duchy | 3+ | |
  | Crown Mahaut | 5+ | `c5_crowned_other` |
  | Crown Thibaut | 5+, with the Brésy pact | `c5_crowned_other` |
  | Crown Mahaut and him together | 5+, if married to her | acclaimed + claim, station royal |
  | Let them say his name | 8+ | acclaimed, station royal |

**Act II, the War of the West** (years 43-44). Counter `ww`.
- **The plan:** fortify the march, raise the salt towns, or divide the kings (Intrigue, difficulty 5).
- **The muster:** Sarenzan crossbows (free for a Lanzi wife), the Armance and Brésy horse as one, or choose the ground.
- **A free West not dividing the kings** fights both: `ww` −2.
- **The Pont-aux-Moines:**
  - lead the charge (lethal, difficulty 6);
  - send the reserve with his eldest son (a Tactics check; on failure, a 25% chance the son dies, and only by this choice);
  - hold the bank.
- **Outcome:** won (6+), held (3-5) or lost. The host is decisive if he commanded and his charge or reserve won.
- **The Losing Side:**
  - flee into exile (Sarenza or Caldmoor if he has friends there);
  - submit (a Diplomacy check: diminished, or attainted if it fails);
  - hold Lannec to the last (lethal: submit with honours, attainted, or death).

**Act III, Recognition** (a free West). Two rounds of three doors:
- the Bishop of Saint-Lys (piety, church, plague-year mercy, a child in the Church);
- the Signory of Sarenza (a Lanzi wife +3);
- a king's price: Adalia takes the Sauvemer march; Valdrenne takes the Brésy, or the hill valleys and the Bishop.

A West that stayed Adalian gets **the King's Reward** instead: the earldom of the March, optionally with the West's liberties written into the patent for his heir.

**Act IV, the Reckoning of a Life** (year 46).
- **The eldest asks what to be.** Then **What Became of Them:** the wife, the children by upbringing and temperament, the dead child's stone, Davy, Cobb, Wat, Thibaut, Mahaut, and the manor's memory.
- **The Chronicle** reads 97 deeds that no other scene reads, from childhood to the crown, grouped by life stage, each shown only if it happened.
- **The ending**, chosen by switch in priority order:

  | Ending | Gate |
  |---|---|
  | Exile | fled |
  | Ruin | attainted |
  | Crowned | crowned himself, with 2+ pillars (claim, acclamation, decisive host in a war won), 1+ recognition, war not lost, and an heir or a living wife |
  | Kingmaker | crowned someone else (or himself, unrecognised), war not lost, and decisive (8+ votes or a decisive host) |
  | Founder of a House | great lord, eldest alive and 14+, war not lost |
  | Diminished Lord | everything else |

**Bot results** (40 runs per background per policy; bots do not plan, so a player aiming for the crown will do better):
- **All endings:** diminished 36%, founder 28%, kingmaker 22%, ruin 6%, crowned 3% (cunning play 14%), exile 1%, deaths about 3.4%.
- **The war:** held 30-69%, won 3-53%, lost 18-29%, by policy.

**Other:** the placeholder ending `story_so_far` is retired. The scripted plans now play to the end and expect Founder of a House.

## Choices that matter (2026-10-03, after playtest feedback)
The author reported that some choices did not feel as if they made a difference, especially in the Ch2 battles. Spying on the new wall during the burial truce, for example, cost Honour and seemed to do nothing.

**What was true:**
- Every Ch2 battle had a fixed outcome at army level (Grisolles lost, the breach failed, Les Salines won). A player's choices changed only his own fate: renown, wounds, followers, knighting.
- Les Salines had an edge counter, but it only adjusted later checks.
- The spying did pay off later (+1 in the mine fight) without saying so. Its Honour cost was never explained.

**Changes:**
- **"At stake" line under every choice.** Computed from the choice's real effects across all its outcomes (`src/engine/stakes.ts`), so it cannot drift from the game. It names:
  - life, wounds, the battle, station, men, renown, reputation, people, coin, skills, items, manor, holdings, children;
  - and "Remembered later" when the choice sets a flag that a later condition actually reads.

  It shows + or − when all outcomes agree, and ± when they differ. It can be turned off in the Menu.
- **Counters the player can see** are named in config `counter_labels`: the battle, the rearguard, the siege, court favour, the West, plague deaths.
- **Grisolles: counter `gr_line`.** The eve, the line, the archers, the baggage, bringing the men out and the ford feed it.
  - At 4+ the rearguard held longest: about 1,200 lost instead of 1,800; the column keeps its wounded and horses; renown +2; it counts as Armance fame at the grants and opens the Grisolles knighting.
  - At 0 the line broke early: 2,200 lost, supplies and men lost, a harsher retreat.
- **Sauvemer: counter `siege`.** The fireships, the assault, spying in the truce, the mine war and the sortie feed it.
  - At 3+ and 6+ the garrison is weaker at Les Salines (+1 or +2 battle edge), and the relief scene says why.
  - At 5+ it counts as Sauvemer fame at the grants.
- **Les Salines.** Edge and held line now set the result:
  - decisive (about 15-45%): 1,500 dead instead of 2,000, renown and Crown standing, and a truce scene that says why the terms lean Adalian;
  - hard-won;
  - pyrrhic (2-15%): 3,000 dead, and the line bent on his part of the dyke.
- **The burial truce.** The choice now says up front that spying under a burial truce is dishonourable. The outcome says the knights saw it, and that the miners will use his drawing.
- **Hollow choices.** Several were given real effects: sending for kin, leaving the priest in charge, staying with the Sauvemer garrison for the grants, the widow's custom, and resting before battle (health).
- **Tools.** `npm run audit` classifies every choice as now, later, flavour or none. Branches count as "later". The transcripts now print the At stake line.

**Numbers after the changes:**
- **Hollow choices:** 18 of 663, nearly all deliberate "do nothing" options. Some of those, such as going to the muster without armour or ignoring the plague warning, matter by what they leave undone.
- **Flags (remembered choices):** 402 are set. 187 change later mechanics, 95 change only later prose, and 120 are not read yet. Those 120 are owed to Ch4-5: 57 from Ch3 and 28 from Ch4.

## Investments (2026-10-03, after playtest feedback)
A player finished with about £118 unspent. Eight shop scenes now sit on the spine; each loops on itself until the player closes the purse.

| Shop | Where | Offers |
|---|---|---|
| `c2_buy_lannec` | After the Lannec winter | A dead knight's harness (£3), a horse, feeding the men, three bowmen, Masses for Grisolles, alms |
| `c2_buy_sauvemer` | The truce garrison | Harness (£5), mail for the men (company +1), Old Matthew the serjeant, a Sarenzan factor (10s a year), the harbour quarter |
| `c3_buy_spring` | The first spring after the Mottle | Salt pans, orchards or drains (+2), seed and plough-teams (+11 people), granary, village watch (garrison +6), the priest's school |
| `c3_buy_building` | Before the match | Tower (£12, defence +3), market charter (£1 a year), almshouse, mill, six men-at-arms |
| `c4_buy_fitting` | After the company is raised | Sarenzan harness (armour 3, £15), destrier (£10), drill-master, siege tackle, wagons, a loan to the war chest |
| `c4_buy_estates` | Ch4 Act II, after the stewards | Stone church, toll bridge (£1 10s a year), hospital, tower, gifts to the Prince and to Carrow, the Lannec salt guild |
| `c4_buy_war` | After the King dies | A free company of forty (£20), arming the levy, walls and a siege store, Christmas for the West |
| `c5_buy_war` | Before the muster | Sarenzan crossbows (the war +1), works on the Pont-aux-Moines, a chantry, a loan for the war tax, the levy's arrears |

**Payoffs.** Most buys move numbers the checks already read: armour, horses, men, `counter.company`, `counter.west_estates`, the court counters, reputations, estate fields, and income through holdings. New modifiers:
- the destrier and armour 3 at Mortefontaine's charge and the bridge;
- armour 3 at Wythen;
- siege tackle at the towns;
- the bridge works at the Pont-aux-Moines.

"What Became of Them" names what he built.

**Pay.** At Michaelmas a lord pays his company and garrison a shilling a man a year (`payMen` in src/engine/estate.ts).
- The King's indenture pays the company in Ch4 Act I (`flag.c4_on_indenture`).
- The Estates' war tax pays the host in the War of the West (`flag.c5_war_tax`).
- Men wait one Michaelmas unpaid. Unpaid two years running, half the unpaid desert.
- Shops and the status page show the pay due.
- At the end of Ch4 Act I a lord can pay off half the company or keep a score.

**Balance (bot, 800–2,000 runs):**
- Desertion in 10% of runs, mostly when the host disbands after the war.
- Median coin at the end of Ch5 falls from £89 to £22; the 90th percentile is £83.
- Crowned 5.5%; deaths 4%.
- Bots at a shop keep back the men's pay. A spender (the wealth policy) buys what he can; others buy one thing half the time.

## Dynasty export: the sequel's input contract (2026-10-04)
Every ending except death shows a "To be continued" block: a line per ending (`sequel` in registry/endings.yaml) and an **Export your house** button. The button gives a text code: `KOAD1.` plus base64url of the deflated JSON, the same encoding as save codes (`encodeCode` in src/engine/savecode.ts). The code is not a save and cannot reopen the life. It is what a sequel reads to continue the family.

**Schema.** `DynastyExport` in src/engine/dynasty.ts, version 1, carries `kind: knight-of-adalia/dynasty` and these fields:
- `date`: year, season, king, reign year;
- `ending`: id and label;
- `founder`: name, background, role, age, station, renown, attributes, skills, traits, items, reputation;
- `spouse`: id, name, alive;
- `heirs[]`: name, sex, age, alive, temperament, upbringing, bond, a `match` (penhoet, brese, lanzi, valdrenne, chosen, arranged) and `crowned`;
- `realm`: the West free, adalian, lost or unsettled; `reigns`; `stability` from `counter.reign`;
- `lands`: the manor's fields and every holding with its income;
- `wealth`: coin, men, garrison, levy;
- `people[]`: everyone he met, with relations;
- `counters` and every flag set.

Each entry carries both its registry id and its display name, so a reader needs no Knight of Adalia content.

**Changing the schema.** Add a field freely. Rename or remove one only with a version bump, and keep a reader for version 1.

## Continuity (2026-10-03, after playtest feedback)
Josh found text that assumed choices he had not made. A survey found 47 such places, and the force panel and a Ch3 population line had the same fault: the story said one thing and the state another.

- **Checker.** `tools/continuity.ts` (`npm run continuity`) plays 120 seeded runs plus the scripted plans, renders every view, and fails on:
  - a phrase from `content/continuity.yaml` shown when its condition does not hold;
  - a named NPC appearing after his death, outside a sentence about his death or memory.

  It runs in `npm run check` and in CI. A deeper pass (`--runs 400`) takes about 4 minutes and is worth running after large content changes.
- **Fixed:** all 47 survey items, plus four found by the deeper pass. The list is in the commit history.
- **Force.** `res.men` is the company that marches; `res.garrison` holds the manor (Rotbart's sixty); `res.levy` is the trained village levy. Save version 2 counts older saves' hires.
- **Population.** `found_estate` records `estate.founded`, and `estate.recovery` gives today's people as a percentage of it. Comparisons with the past read the percentage. Save version 3 fills `founded` for older saves.
- **Writers' reference:** `docs/BRANCHES.md`, with the spine, the identity state, the kill table and the "must not assume" checklist.

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
| 2026-10-02 | Three land grants by where his name was made (Ormel, Marsalin, Kerval). Ch3 answers: plague a third, rough peace, rising plus manor unrest, max three children deferred to Ch4. |
| 2026-10-02 | House voice adopted from the author's sample chapters (style-guide). Ch3 frame drafted for approval. |
| 2026-10-02 | Ch2 war revised twice: original campaign that swings back and forth (Vervais fails, Grisolles lost, Harlow Moss and the fireships won, the breach fails, Les Salines a costly gamble won, truce on Adalian terms); harder knighting; partials never deal serious wounds; debug Rewind added. |
| 2026-10-01 | Phase 3 review decisions: 9a, 11c, 12c, 14b, 13a. Historical items kept, except champion (15, replaced) and the Sweat (17, renamed). See Phase 3 review changes. |
| 2026-10-02 | Training ceilings with overflow into attributes; Command and Diplomacy learned by doing; Aikbank watch scene. Ch4-5 direction: new independent crown (from an invaded kingdom or a civil war), Crowned 5-7%, Ch4 in 3-4 acts with skips, heirs mixed into the main story. Frame Ch5 first, after Ch3 and stabilisation. |
| 2026-10-02 | Ch3 Act III built: suits resolve at the second spring, two arranged offers (Aliénor de Brésy, Philippa Ashdown), family obstacle, contract, wedding, first year, childbed with a small seeded risk to the mother, heirs system. |
| 2026-10-02 | Childbirth risk kept. Philippa offered more easily (Crown 2+, renown 12+, or no personal suit). Ch3 Act IV built; Chapter 3 complete. Vervais betrayal: the Earl of Carrow. The rising is original (the Hythe Fields), not a copy of 1381. |
| 2026-10-02 | Stabilisation: compressed save codes, downloads through the viewer, render scan. Ch4-5 frame drafted for approval (docs/FRAME-CH4-CH5.md). |
| 2026-10-02 | Ch4-5 frame approved as recommended: the West (Armance and the Salt Coast) is the new crown; Aldred dies about year 40, Edwin succeeds, Carrow rises; candidate #12 is Jehanne's granddaughter; heirs may die in Ch4 only through his choices; his death ends the game; Vervais stays a third party. |
| 2026-10-02 | Ch4 engine (holdings, heirs growth, court standing) and Act I, the Second War, built. Validator enforces the death rule. Harvest base raised to people/40. Ending ch3_complete renamed story_so_far. |
| 2026-10-02 | Ch4 Act II, the Lord of Many Places, built. |
| 2026-10-03 | Choices that matter: At stake hints, Ch2 battle outcomes driven by player performance (rearguard, siege, Les Salines), burial-truce honour made explicit, hollow choices fixed, choice audit tool. |
| 2026-10-03 | Ch4 Act III, the Fracture, built: the master's death, Aldred's death and Edwin's crowning, Carrow's rising and Wythen Heath (player-driven), the eldest at ten, the Constable's fall, Lannec. |
| 2026-10-03 | Ch4 Act IV, the Summons to Lannec, built; Chapter 4 complete. Dates now follow the reign (config reigns: Edwin from year 40). Next: Ch5 engine (endings evaluation, epilogue builder) and acts. |
| 2026-10-03 | Ch5 built; the game is complete from the prologue to the endings. Every ending is reachable for every background; 0 warnings, 0 pending. |
| 2026-10-03 | Installable app: PWA (manifest, icons, network-first service worker that updates on launch) published to GitHub Pages by a workflow on every push. Force size shown in the top bar and on the Status page. |
| 2026-10-03 | Continuity: the checker, 51 fixes, force split into company, garrison and levy, population compared by ratio, docs/BRANCHES.md. |
| 2026-10-03 | Crowned balance: a decisively commanded host is a pillar of the claim even when the war ends in stalemate (it needed outright victory). Crowned rises from 3% to 6% of 2,000 bot runs: burgess 10%, reeve 8%, servant 5%, archer 2%. |
| 2026-10-03 | The backgrounds' secrets pay off in Ch4 Act II (events/ch4/queued.yaml, queued at c4_stewards): the reeve's old steward confesses; Carrow presents the burgess's father's Sarenzan note; a Kilbride monk brings the Carn Dubh names to the archer; the heir of Ravell asks the servant's son what he heard. Widowers are offered Dame Blanche de Kerguen at the end of Act II (not after asking for Mahaut). Marriage checks: every candidate can marry (validator); at least two brides on offer at the Ch3 match in 90% of runs per background (bot). |
| 2026-10-03 | The road to the crown made visible and fairer. The status page shows the hall's mood at the Estates (most watch someone else / the hall listens / the hall will follow you, at 5 and 8 votes). A soldier's route at the Estates (the captains in the taverns: Presence and Command, with mods for Les Salines, Mortefontaine, Wythen, your company and the veteran trait, +3) gives fighters a way into the hall; the salt guilds give +2 instead of +3. Crowned over 2,000 runs: 6% (burgess 10%, reeve 7%, archer 4%, servant 4%). |
| 2026-10-03 | Calendar fixes after a player's Ch4 date ran two years ahead of the prose. (1) A save resumed at a checkpoint after a content change now goes back to that checkpoint's date; before, the replayed scenes happened years late. (2) Dated scenes catch the calendar up (`catch_up` effect) so shorter paths do not run early; extra seasons on refused suits and the fled town were removed so no path runs late. Every bot run now reaches each landmark in the same year. (3) Edwin's reign begins the year after Aldred dies in the story (`reigns.from_scene`), not in a fixed year. (4) Prose that names the year or his age reads it from the calendar ({reign_year}, {king}, {age_words}). |
| 2026-10-03 | Later-chapters plan after a full playtest (transitions thin, Ch4–5 shallow, younger children idle, money unspent, nothing after the crown). Order: chapter cards, investments, children, a reign act, a "to be continued" page with a dynasty export for a sequel, Ch4–5 depth. Step 1, chapter cards: a title page before each chapter (`config.chapter_cards`) and each Ch4 act (`scene.card`) with the date, age, station, wife, children and their ages, lands, men, purse, and the years, births and deaths since the last card (`src/engine/cards.ts`; deaths are dated by `diedAt` from now on). |
| 2026-10-03 | Step 2, investments: eight shops, Michaelmas pay for the company and garrison, pay-off at the end of Ch4 Act I, payoffs in existing checks; plans record a list of choices for a scene visited more than once. See Investments. |
| 2026-10-03 | Step 3, the younger children. Ch4 Act III: a surety demand for the second child from the side he rides with (send, excuse, refuse). Ch4 Act IV: the second child's upbringing (a West house, the abbey, a Sarenzan counting-house, home). Ch5: a betrothal offered at the Estates for votes, money or the Church, or refused; a surety held on the wrong side of the new border (ransom £25, a night rescue, or leave them); after the reckoning, what he leaves the younger ones (land, the Church, a year of his time). Bond moves for every child. The epilogue gives the second and third child their own lines. Bot: the surety demand reaches 67% of runs, the second child's upbringing and the betrothal 51%, the younger ones 90%. Crowned 5.7%, deaths 3.8% (2,000 runs). |
| 2026-10-03 | Step 4, after the crown. The reckoning now decides what follows it: `flag.c5_reigns` (the crowned ending's conditions, evaluated once; the chronicle reads the flag), `c5_kingmaker_path`, `c5_founder_path`. Crowned runs play the first year of the reign (ch5/06-reign.yaml): the oaths and the lord of Quérec who will not kneel, the council, the peace with Adalia and Valdrenne, the war tax, Quérec's revolt and judgement, and the succession. `counter.reign` ("The kingdom") measures how settled the West is; the revolt reads it and the crowned ending reports it, with the year's choices. Kingmakers get two scenes (an office, a reward); founders get two (the first court day, the heralds' pedigree), and their endings read them. Dates run in the player's own name from the oaths (`reigns` king `@self`). Bot: every run that sees a coda ends in its ending. New plan: The King. |
| 2026-10-04 | Step 5: "To be continued" on the ending page, with a line per ending and the dynasty export (see Dynasty export). |
| 2026-10-05 | Step 6, Ch4–5 depth. The Ch4 pool `c4_lord` grows from 4 to 10 events: raiders at the manor while he is away (reads the walls, tower and garrison), a one-armed man from Grisolles, a wet summer (the granary pays off), the Lanzi calling in a war debt, the rival's son, a tourney at Lannec. A new Ch5 pool `c5_west`: before the war, the old company, a spy in the household and a bread riot in Sauvemer; after it, the widows of the levy, a prisoner of rank and the eldest's quarrel. One draw before the muster and one after the war. When the West breaks away, `c5_price`: the backers' price for the war (the salt staple, the old lords' exemptions, the Bishop's tithes, or nothing), read by the chronicle. A second Ch4 draw raised Crowned by a point, so each slot draws one event from the larger pool. Crowned 6.1%, deaths 3.6% (2,000 runs). |
| 2026-10-05 | Polish pass. Branch sweeps over 1,600+ bot runs (wife, children, son/daughter, dead master and parents, the wrong grant, Sir before knighthood, ages, negative values, seasons against the date). Fixes: the Duchess's age (fifty-eight in the first war, matching canon's seventy in year 33; her son, Mahaut's father, taken with her husband and dead in Cordelle's prison); Ch3 dates a season early from \"The First Spring\" to the claimant (Lady Day in winter, Michaelmas in summer); the King's Christmas in summer on paths without the eldest's scene; \"The Harvest of Year Thirty\" a year early on short paths; the end of Ch2 riding out \"in the spring\" in winter; the reign act anchored to Lady Day of year 45 so its feasts fall in their seasons; the reckoning's hall follows the season; plural \"children\" with one child; \"your wife's cousin\" for a widower; a raid letter from a dead wife; a hardcoded child's age; purchases that cost nothing when the purse was empty (the Ch4 company, the wedding feasts, the goldsmith) now require the coin, and \"on credit\" only borrows when he cannot pay. |
| 2026-10-05 | Population after the Mottle (`growPeople`, src/engine/estate.ts): births and newcomers each Michaelmas, more under a trusted lord, with empty holdings or a market; departures under a sullen one. Median manor back to its founding size by the end of Ch3, about 118% by the end; the worst tenth stays under 85%. The steward reports it at the ends of Ch4 Acts I and II. |
| 2026-10-05 | Wives' voices: each of the 16 wives has her own line at eleven moments of the marriage (first year, lying-in, the child's fever, the farewell, the homecoming, her letters, the third child, the writ, the muster, old age, the epilogue), in `romances.<id>.voice`, written into scenes as `{wife.<moment>}`. The validator requires every moment from the stage she can marry in (`married_in`); a test renders them all and checks no two wives share a line. |
