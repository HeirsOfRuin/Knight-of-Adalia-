# House of Adalia: Frame

**The sequel to Knight of Adalia.** A house across three generations, from the founder's last years to his great-grandchild.

**Status:** approved by the author, 2026-10-06. The scope decisions in section 0 and the six open decisions (now section 9) were accepted as recommended. The author added one rule: **the West does not always start free, and the prose of every start must reflect where it stands** (section 2).

**Method:** the same as `FRAME-CH4-CH5.md`. The endings are framed first, then the generations that produce what those endings read. Any system that no scene or ending reads is cut.

---

## 0. Decisions taken
| # | Decision |
|---|---|
| 1 | **Model: a hybrid.** An authored spine per generation, a light realm simulation that creates pressure, and event pools keyed to that simulation. Not a sandbox. |
| 2 | **Scope: three generations**, then an ending. Not open-ended. |
| 3 | **One repository, shared engine.** Knight of Adalia and House of Adalia are two content bundles on one engine package. |
| 4 | **Succession law is a live lever.** Daughters can head the house where the law allows it, and the law can be changed at a price. |
| 5 | **The export is optional.** Every start can be played fresh, with a generated founder. |
| 6 | **Title: House of Adalia.** |
| 7 | **The West has three starting frames** (free, Adalian, partitioned), and the prose is written for each. The West can change frame during play. |

---

## 1. The premise

Knight of Adalia ends in years 45-46. House of Adalia picks the house up around **year 50** and follows it to around **year 125**: three heads of house, perhaps four if one dies young.

Where the West stands at year 50 depends on the founder's life (section 2). Some pressures hold in every frame:
- **Adalia and Valdrenne do not forget.** Each wants the West, all of it, or a client ruling it.
- **The female line.** Jehanne's duchy passed through a woman. Valdrenne says a crown cannot. Whatever the West is, Mahaut's line and that ruling meet again.
- **The Sarenzan banks are owed.** Debts outlive the men who signed them.
- **The Mottle returns** every fifteen to twenty years, as plague did historically (1348, 1361, 1369, 1375).
- **The Church.** The Pontiff at Saint-Lys, and a schism to come.

Historical analogues to draw on, not copy: the English and French minorities (Richard II, Charles VI); Burgundy as a realm between two crowns; Gascony as an English possession whose lords changed sides by the generation; the Wars of the Roses as a war of cousins; the Neville affinity as an over-mighty house; the Avignon papacy breaking into schism.

---

## 2. The West at year 50: three frames

KoA's Ch5 leaves the West in one of four settlements. The sequel writes for three **frames**: a free West, crowned or ducal, is one frame with titles that vary.

| Frame | KoA settlement (`realm.settlement`) | Who rules the West | The house's place | Law of succession |
|---|---|---|---|---|
| **Free** | `kingdom` (the player, Mahaut or Thibaut crowned) or `duchy` (the Estates' free duchy) | A king or queen of the West, or the duchy's Estates | Inside a new realm nobody has ruled before; at court, on the council, or on the throne | **Unwritten.** The first fight of Book I. |
| **Adalian** | `adalian` | King Edwin of Adalia, through his Earl of the March | An Adalian lord in a province that voted to stay; the Earl of the March if KoA gave him the earldom (`c5_earl`), with the West's liberties in the patent if he asked (`c5_liberties`) | Adalia's: lands pass to daughters when there are no sons, shared among them as co-heiresses; the earldom passes as its patent says |
| **Partitioned** | `partitioned` (the war lost, whichever side he fought on) | Two kings: Valdrenne's governors in the Armance, Adalia's in the Salt | On the wrong side of a new border, or on the right side of it by having submitted; or abroad (Exile) or struck from the rolls (Ruin) | Two laws: Valdrenne's in the Armance, where the crown claims Mahaut's duchy because it cannot pass through a woman; Adalia's in the Salt |

**`unsettled`** is not a frame. No KoA ending reaches it. The reader treats it as missing and asks the player to choose a frame.

### What the frame changes
- **The prose.** The same scene reads differently in each frame. "The King" is Edwin in Wendmere, the player's own father, or Amaury VII, depending on the frame. "The border" is the Pont-aux-Moines, the March, or a line through the player's own valleys. Every spine scene is written for all three frames. Section 7 gives the mechanics and the checker.
- **The enemies.** In a Free West both crowns are the threat. In an Adalian West Valdrenne is the enemy, and Wendmere's taxes and governors are the grievance. In a Partitioned West the occupier is the enemy, and the other king is a doubtful friend.
- **The road to a crown.** Free: keep it, or take it. Adalian: break away, or marry into Adalia's royal line. Partitioned: reunite the West by a rising, or rise in the service of the king who holds your half.

### The frame can change during play
The West's state is live, not just a starting value (`realm.west`):
- An Adalian West can break away in Book II or III, during an Adalian minority or civil war.
- A Free West can be conquered or partitioned.
- A Partitioned West can be reunited by a rising, or traded whole at a peace.

Each change is a spine event with its own scenes. Book II and Book III each allow at most one change, so the number of variants stays bounded.

### Which openings meet which frames

| Opening (KoA ending) | Free | Adalian | Partitioned |
|---|---|---|---|
| **Crowned** | yes (kingdom, the founder king) | | |
| **Kingmaker** | yes (kingdom, Mahaut or Thibaut on the throne) | | |
| **Founder** | yes | yes | |
| **Diminished** | yes | yes | yes (submitted after the war) |
| **Exile** | | | yes |
| **Ruin** | | | yes |

That is nine real combinations. A fresh start offers the same nine.

---

## 3. Shape: three generations

Each generation is a **book**, the equivalent of a KoA chapter. A book has 3-4 acts with time skips, as Ch3 and Ch4 do. You play the head of house. When the head dies, succession is a scene, and you continue as the successor.

| Book | Head | Years (approx.) | Theme |
|---|---|---|---|
| **Prologue: The Old Lord** | The founder (imported, or generated) | 50-55 | Teaches the handover: you play the old man, choose and shape the heir, and then become them |
| **I. The Keeper** | The founder's heir | 55-78 | Holding what was won, or what was left |
| **II. The Builder** | The grandchild | 78-102 | Expansion, or overreach |
| **III. The Inheritor** | The great-grandchild | 102-125 | Rise or fall |

### The spine crises, by frame

| Book | Free | Adalian | Partitioned |
|---|---|---|---|
| **I** | The new realm's first succession and the fight over its law; Valdrenne probes the border; recognition renewed with a new Pontiff | Edwin's heir and the patent's liberties tested; Adalian lords given western lands; men who voted to stay and now regret it | Confiscations and new governors; the Valdrennish crown claims Mahaut's duchy; rebels in the hills; serve the occupier or shelter its enemies |
| **II** | The West's first foreign war as a realm; a great marriage; debt to Sarenza | Adalia's next war against Valdrenne is fought through the West; a chance to break away | Adalia and Valdrenne at war again over the partition line; the rising |
| **III** | A war of cousins over the West's crown, with the house's own claim in it | Adalia's own war of cousins; the West's liberties are the price of the house's support | Valdrenne's succession crisis; the West's last chance to be one country |

In every frame, the second Mottle falls in Book I and the schism in Book II.

**Heir attachment.** Each heir's childhood plays inside the parent's book (upbringing, betrothal, a first battle), using the bond, temperament and upbringing that KoA's Ch4 already has. By the time you take the heir over, you raised them.

**Handover.** At each succession the outgoing journal is condensed into a **chronicle entry** (a paragraph per head, built from state like KoA's epilogue). The working journal starts fresh. This keeps saves small over seventy-five years.

---

## 4. The six openings

The KoA ending decides the opening, the same way the four backgrounds decided the prologue. The openings converge by the end of Book I, Act I; the frames do not converge, because the West's state is the world the story happens in.

| Opening | The house at year 50 | Opening pressure |
|---|---|---|
| **Crowned** | Royal. The founder is king of the West. | A new dynasty on a throne few have recognised for long. The law of succession is the first fight. |
| **Kingmaker** | The power behind Mahaut's or Thibaut's throne | The crowned one's heir resents the house that made his parent |
| **Founder** | A great lord with several holdings, in a Free or Adalian West | Rivals for the same rank; marriages to make; in an Adalian West, the Earl's patent |
| **Diminished** | One holding, old grievances | Climbing back. In a Partitioned West, under the governors of a king he fought. |
| **Exile** | A court abroad (Sarenza, Hroswald, Caldmoor, Adalia or Valdrenne) and a claim at home | The return, or growing into the country that took you in |
| **Ruin** | Attainted; a name struck from the rolls | Writing it back in: service, marriage, a pardon bought |

### Import
`DynastyExport` v1 (src/engine/dynasty.ts) maps onto the start:
- `realm.settlement` and `realm.sovereign` choose the frame and who rules. `realm.war` says how the last war ended.
- `founder` becomes the prologue's character.
- `heirs[]` become characters, with their temperament, upbringing, bond and match.
- `spouse`, `people[]`, `lands`, `wealth` and the relevant `flags` (`c5_earl`, `c5_liberties`, `c5_price_*`, the betrothals) seed the houses, provinces and relations.

**Promises the KoA epilogue already made.** KoA's reckoning tells the future: the peace the king paid for "holds for thirty years", the bookish heir "writes a chronicle of the West", the churchly heir "becomes Bishop of Saint-Lys", "Mahaut's council outlasts you both", the exile's heir "one day goes home to the West under another king's peace". An imported start honours what its own epilogue said. The import reads the same flags the epilogue read, and the continuity checker gets a rule for each promise (for example, no war with Valdrenne before year 75 after `c5r_peace_bought`).

**Added to the export for this frame:** `realm.settlement`, `realm.sovereign` and `realm.war`. They are v1 additions, which the export rules allow without a version bump. The old `realm.west` field reads an Adalian West that lost the war as `adalian`, so the sequel reads `settlement` instead. `west` stays for v1 readers.

---

## 5. Endings matrix

Computed at the end of Book III, or earlier if the house fails. Gates are read against the frame the West is in at the end, not at the start.

| Ending | Gates | Main state read |
|---|---|---|
| **A Royal Line** | The house holds a crown at the end, with a recognised heir: the West's, or another by marriage | Claim, law of succession, recognition, house power |
| **The Power in the Realm** | The greatest house that is not royal, in whatever realm holds its lands; the crown answers to it | House power against the crown's; marriages into the royal line |
| **An Old House** | Landed, titled and secure; three generations kept it | Holdings kept, debts, standing |
| **A Fallen House** | Survives, but smaller than the founder left it | Holdings lost, grievances |
| **A Foreign House** | The line continues abroad and has stopped coming home | Exile, assimilation |
| **The Name Struck** | Attainted, landless, the line alive | Treason, debt, enemies |
| **Extinct** | No heir to succeed. An ending at any point. | Deaths, the law, cousins |

The epilogue also reports the West: free, Adalian, partitioned or reunited, and the house's part in it.

**Targets for the bot** (starting points, tuned on the slice):
- A Royal Line: 5-8% of runs overall, higher from Crowned. At least 2% from each frame, so an Adalian or Partitioned start is not a closed door.
- House extinct before Book III: 15-25%.
- Each of the nine combinations reaches every ending except where the matrix rules it out.

---

## 6. Systems

The rule from Ch4 holds: any system that no scene or ending reads is cut.

### 6.1 Characters (engine)
- `characters: Record<id, Character>`: attributes, skills, traits, health, injuries, birth, death, sex, parents, spouse, house, temperament, upbringing, and the relation fields `NpcState` has now (affection, respect, loyalty, grudges).
- `state.ruler` points at the head of house; `state.house` at the player's house.
- **Paths.** `ruler.attr.arms`, `heir.age`, `spouse.affection`, and `@alias` as now. A bare `attr.x` or `skill.x` means the ruler, so the condition grammar reads as it does in KoA.
- **Pronouns.** KoA's text assumes a man. A head of house can be a woman. Text gains `{ruler.he}`, `{ruler.his}`, `{ruler.lord}` (lord or lady) and the same for any character. The validator flags hard-coded "he" and "his" in sequel scenes that refer to the ruler.

### 6.2 Generated people
- Names by culture, from canon's naming table: Adalian commons and gentry, Valdrennish (the Armance included), Caldmoor, Hroswald, Sarenza.
- Temperament (bold, bookish, merry, grave, as in KoA), traits, and stats drawn from parents and upbringing.
- **Voices by archetype.** KoA gives each of its 16 wives her own line at eleven moments. That does not scale to generated spouses. The sequel writes voice lines per temperament and culture, with the same validator rule that no two archetypes share a line.
- **Great figures stay authored.** Each book has 6-10 hand-written people (a king, a bishop, a banker, a rival head), registered as in KoA. Who they are depends on the frame: a Partitioned West needs a Valdrennish governor that a Free West does not.

### 6.3 Houses
- Each house: head (a character), power, wealth, claim, temper toward the player (-10..10), holdings, and marriage ties.
- About 8-12 houses in play at a time, including the authored ones (the Brésy, the Penhoët, the Lanzi, the royal lines).
- **No AI.** Houses act through the director: pool events gated on their state and the frame. A strong, hostile house brings a border quarrel; an indebted one offers a daughter. This is how the engine already works.

### 6.4 Realm
- `realm.west`: `free`, `adalian` or `partitioned`, plus `realm.ruler_title` (king, queen, duke, duchess) and `realm.sovereign`.
- Provinces tied to world-map places: owner house, the realm they answer to, income, temper, levy. This is KoA's `holdings` and `estate` generalised. In a Partitioned West, the map's border runs through the West.
- The sovereign's treasury, the mood of the Estates (Free) or the Moot (Adalian), Church standing.
- **Yearly ticks** at Michaelmas, where pay already falls. KoA's seasonal tick stays for scenes that need the season.

### 6.5 Succession
- A law per realm and per house: male primogeniture, male preference (daughters when there is no son), or partible among sons. Each frame starts with the laws in section 2.
- Changing the law is a scene with a price: the Estates, the Church, a rival claimant, or the king who holds your half.
- The head's death queues the succession scene. Outcomes: the heir succeeds; a regency, with a minor heir; a contested claim, which can become a war.
- **When the direct line fails:** cousins succeed by law. A bastard succeeds only through legitimation, a Church scene with a price.
- Child mortality, adult illness and old age use the seeded `chance` effects KoA already has.

### 6.6 Matches
KoA's suits system is aimed upward, for one man. The sequel replaces it with **matches**: marriages negotiated between houses for each child, with terms (dowry, land, alliance, a claim). A smaller authored set of **love matches** costs political value.

### 6.7 War
- An abstract campaign: forces, pay, supply, commander skill and terrain.
- Each war is 2-4 decision scenes with checks, then one numeric battle result that drives casualties (KoA's `casualties` effect, scaled up).
- **No tactical layer.** That is a different game.

---

## 7. Writing for three frames

The author's rule: a start in an Adalian or Partitioned West must not read like a free one. KoA learned this in Ch5 (the fix "Chapter 5 war lines that ignored an Adalian West"). The sequel builds it in from the start.

### Mechanics (most of them exist)
- **Whole-scene variants by frame.** KoA's `variants` already swaps a scene's text by background. The sequel keys it by frame: `variants: { adalian: ..., partitioned: ... }`, with `text` as the free version. Use it when a scene's premise differs, not just its nouns.
- **Inline branches** for a line or two: `[if realm.west == adalian]...[elif realm.west == partitioned]...[/if]`, as KoA does now.
- **Realm variables** for the nouns that change: `{realm.sovereign}` (King Edwin, Queen Mahaut, "your father"), `{realm.capital}` (Lannec, Wendmere, Cordelle), `{realm.border}`, `{realm.ruler_title}`, `{realm.assembly}` (the Estates, the Moot).
- **Choices by frame** with `visible_if`, where the options really differ (petition Wendmere; bribe the governor).

### Checks
- **Validator:** every spine scene either has text that is frame-neutral (no frame-bound phrases), or covers all three frames by variants or branches. A scene marked `frames: [free]` is exempt, and the validator then checks it is only reachable in that frame.
- **Continuity:** `content/continuity.yaml` gains the frame-bound phrases ("the crown of the West", "the Estates", "the governor", "the Earl of the March", "the new border") with their conditions. The checker plays every one of the nine combinations and fails on any phrase shown in the wrong frame.
- **Transcripts:** the scripted plans include at least one route per frame, and a transcript per frame is read before each book is called done.

### Prose budget
Three frames do not triple the writing. The estimate:
- about **40% of spine scenes** need a whole-scene variant (the premise differs: the Book I crisis, the war, the rising);
- about **40%** need only inline branches and realm variables;
- about **20%** are frame-neutral (the family, the household, the plague).

Pools are written once and gated by frame where they only make sense in one.

---

## 8. Architecture

### Repository layout
```
packages/engine/     conditions, effects, director, text, rng, calendar, save, savecode, checks, cards, map, worldgen
games/knight/        Knight of Adalia: content, station, estate, romance, its UI shell
games/house/         House of Adalia: content, characters, houses, realm, succession, matches, war, its UI shell
tools/               validator, bot, continuity, lint: parameterised by game
```
- The move is done first, as its own step, with no behaviour change.
- **Gate:** KoA's `npm run check` passes unchanged after the move, and the published Pages build plays the same. The Pages workflow publishes both games (KoA at its current URL, House of Adalia beside it).

### Tooling
- **Bot:** house survival per book, extinction rate, generations reached, ending spread per opening and per frame, frame changes per run, and the spread of house power per book (to catch snowballs and death spirals).
- **Continuity checker:** the frame rules in section 7; the dead-character rule extended to generated people; a kinship rule (no "your uncle" for a cousin); the pronoun rule.
- **Save size:** a hard budget per save (tested), met by the chronicle condensation.

---

## 9. Decisions on the open questions (accepted as recommended)
1. **Start date:** year 50, with a playable prologue as the old founder.
2. **The law:** a Free West starts with no written law of succession. Adalian and Partitioned starts use the laws in section 2. The female line is the political spine in every frame.
3. **When the direct line fails:** cousins by law; bastards only through legitimation, at a price.
4. **A minor heir:** you play the child, and the regent is a powerful character you can lose to.
5. **Romance:** replaced by matches, with a few love matches that cost political value.
6. **Title:** House of Adalia.

---

## 10. Size and scope guard
- **Prologue:** 10-15 scenes. **Each book:** 40-55 scenes plus pools, about 70-80k words with the frame variants. A single run sees about half.
- Six openings converge by Book I, Act I. Three frames do not converge; section 7 is how that stays affordable.
- Pools carry the variety. The spine carries the weight.
- Total: about 190-230 scenes. If the prose budget runs short, Book II's frame variants shrink to inline branches first, then Book II itself.

## 11. Build order
0. **Export additions** (done 2026-10-06): `realm.settlement`, `realm.sovereign` and `realm.war`, with tests.
1. **Engine extraction** into `packages/engine`, with KoA green and its Pages build unchanged.
2. **Character refactor:** `characters`, `ruler`, paths and pronouns, with KoA ported onto it and still green.
3. **Frame support:** `realm.*` paths and variables, variants keyed by frame, the validator and continuity rules in section 7.
4. **Vertical slice:** the Founder opening in two frames (Free and Adalian), the prologue, Book I and one succession into Book II. Bot and continuity checks on it, and a transcript per frame.
5. **Houses, realm and war**, tuned against the slice.
6. **The other openings and the Partitioned frame**, then Books II and III, each with a bot pass and a transcript per frame.
7. **Endings and the chronicle builder**, with every ending reachable in bot runs for each of the nine combinations it is allowed in.
