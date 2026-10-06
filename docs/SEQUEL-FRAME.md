# The Sequel: Frame for Approval

**Working title:** *The House* (provisional; the house is named for the player's founder).

**Status:** framed 2026-10-06. The five scope decisions in section 0 were accepted by the author as recommended. Sections 1-7 are proposals awaiting approval; the open decisions are in section 8. Nothing here is built until it is approved.

**Method:** the same as `FRAME-CH4-CH5.md`. The endings are framed first, then the generations that produce what those endings read. Any system that no scene or ending reads is cut.

---

## 0. Decisions already taken
| # | Decision | Taken |
|---|---|---|
| 1 | **Model: a hybrid.** An authored spine per generation, a light realm simulation that creates pressure, and event pools keyed to that simulation. Not a sandbox. | Recommended, accepted |
| 2 | **Scope: three generations**, then an ending. Not open-ended. | Recommended, accepted |
| 3 | **One repository, shared engine.** Knight of Adalia and the sequel are two content bundles on one engine package. | Recommended, accepted |
| 4 | **Succession law is a live lever.** Daughters can head the house where the law allows it, and the law can be changed at a price. | Recommended, accepted |
| 5 | **The export is optional.** Every opening can be started fresh with a generated founder. | Recommended, accepted |

---

## 1. The premise

Knight of Adalia ends in years 45-46 with the West free, Adalian, lost or unsettled, and the player at one of six stations. The sequel picks the house up around **year 50** and follows it to around **year 125**: three heads of house, perhaps four if one dies young.

The pressure across those seventy-five years:
- **The West is new.** Whoever holds it (the player, Mahaut, Thibaut, Adalia) holds a crown nobody has worn before. Its law of succession is unwritten. Jehanne's line passed through a woman; Valdrenne says a crown cannot. That quarrel runs through all three generations.
- **Adalia and Valdrenne do not forget.** Each wants the West back, or wants a client on its throne.
- **The Sarenzan banks are owed.** Debts outlive the men who signed them.
- **The Mottle returns.** Plague comes back every fifteen to twenty years, as it did historically (1348, 1361, 1369, 1375).

Historical analogues to draw on, not copy: the English and French minorities (Richard II, Charles VI), Burgundy's rise as a realm between two crowns, the Wars of the Roses as a war of cousins, the Neville affinity as an over-mighty house, the Castilian civil war, and the Avignon papacy (Saint-Lys) breaking into schism.

---

## 2. Shape: three generations

Each generation is a **book**, the equivalent of a KoA chapter. A book has 3-4 acts with time skips, as Ch3 and Ch4 do. You play the head of house. When the head dies, succession is a scene, and you continue as the successor.

| Book | Head | Years (approx.) | Spine crises | Theme |
|---|---|---|---|---|
| **Prologue: The Old Lord** | The founder (imported, or generated) | 50-55 | The founder's last years; raising and choosing the heir; the founder's death | Teaches the loop: you play the old man, then become his child |
| **I. The Keeper** | The founder's heir | 55-78 | The founder's men test the new head; a minority or regency somewhere that matters; the first succession fight in the realm; the second Mottle | Holding what was won |
| **II. The Builder** | The grandchild | 78-102 | A foreign war; a great marriage; debt to Sarenza; the schism in the Church | Expansion, or overreach |
| **III. The Inheritor** | The great-grandchild | 102-125 | A war of cousins over the crown of the West; the house's verdict | Rise or fall |

**Heir attachment.** Each heir's childhood plays inside the parent's book (upbringing, betrothal, a first battle), using the bond, temperament and upbringing that KoA's Ch4 already has. By the time you take the heir over, you raised them.

**Handover.** At each succession the outgoing journal is condensed into a **chronicle entry** (a paragraph per head, built from state like KoA's epilogue). The working journal starts fresh. This keeps saves small over seventy-five years.

---

## 3. The six openings

The KoA ending decides the opening, the same way the four backgrounds decided the prologue. The openings converge by the end of Book I, Act I. A fresh start picks one and generates a founder.

| Opening (KoA ending) | The house at year 50 | Opening pressure |
|---|---|---|
| **Crowned** | Royal. The founder is king of the West. | A new dynasty on a throne nobody has recognised for long. The succession law is the first fight. |
| **Kingmaker** | The power behind someone else's throne | The crowned one's heir resents a house that made his father |
| **Founder** | A great lord with several holdings | Rivals for the same rank; marriages to make |
| **Diminished** | One holding, old grievances | Climbing back; the winners' sons |
| **Exile** | A court abroad (Sarenza, Hroswald, Caldmoor, Adalia or Valdrenne) and a claim at home | The return, or assimilation abroad |
| **Ruin** | Attainted; a name struck from the rolls | Writing it back in: service, marriage, a pardon bought |

**Import.** `DynastyExport` v1 (src/engine/dynasty.ts) maps onto the opening:
- `founder` becomes the prologue's character;
- `heirs[]` become characters with their temperament, upbringing, bond and match;
- `spouse`, `people[]`, `lands`, `wealth`, `realm` and the relevant `flags` seed the houses, provinces and relations.

The sequel keeps a reader for v1 for good. Fields it needs that v1 lacks (for example the heirs' names and stats in more detail) are added to KoA's export as v1 additions, which the export rules allow without a version bump.

---

## 4. Endings matrix

Computed at the end of Book III, or earlier if the house fails.

| Ending | Gates | Main state read |
|---|---|---|
| **A Royal Line** | The house holds the crown of the West, or a crown, at the end with a recognised heir | Claim, law of succession, recognition, house power |
| **The Power in the Realm** | The greatest house that is not royal; the crown answers to it | House power against the crown's, marriages into the royal line |
| **An Old House** | Landed, titled and secure; three generations kept it | Holdings kept, debts, standing |
| **A Fallen House** | Survives, but smaller than the founder left it | Holdings lost, grievances |
| **A Foreign House** | The line continues abroad and has stopped coming home | Exile, assimilation |
| **The Name Struck** | Attainted, landless, the line alive | Treason, debt, enemies |
| **Extinct** | No heir to succeed. An ending at any point. | Deaths, the law, bastards and cousins |

**Targets for the bot** (starting points, tuned on the slice):
- Royal Line: 5-8% of runs overall, higher from the Crowned opening.
- House extinct before Book III: 15-25%. Death of the house should be real, not routine.
- Each opening reaches every ending except where the matrix rules it out.

---

## 5. Systems

The rule from Ch4 holds: any system that no scene or ending reads is cut.

### 5.1 Characters (engine)
- `characters: Record<id, Character>`: attributes, skills, traits, health, injuries, birth, death, sex, parents, spouse, house, temperament, upbringing, and the relation fields `NpcState` has now (affection, respect, loyalty, grudges).
- `state.ruler` points at the head of house; `state.house` at the player's house.
- **Paths.** `ruler.attr.arms`, `heir.age`, `spouse.affection`, and `@alias` as now. A bare `attr.x` or `skill.x` means the ruler, so the condition grammar reads as it does in KoA.
- **Pronouns.** KoA's text assumes a man. A head of house can be a woman. Text gains `{ruler.he}`, `{ruler.his}`, `{ruler.lord}` (lord or lady) and the same for any character. The validator flags hard-coded "he" and "his" in sequel scenes that refer to the ruler.

### 5.2 Generated people
- Names by culture, from canon's naming table: Adalian commons and gentry, Valdrennish (the Armance included), Caldmoor, Hroswald, Sarenza.
- Temperament (bold, bookish, merry, grave, as in KoA), traits, and stats drawn from parents and upbringing.
- **Voices by archetype.** KoA gives each of its 16 wives her own line at eleven moments. That does not scale to generated spouses. The sequel writes voice lines per temperament and culture, with the same validator rule that no two archetypes share a line.
- **Great figures stay authored.** Each book has 6-10 hand-written people (a king, a bishop, a banker, a rival head), registered as in KoA.

### 5.3 Houses
- Each house: head (a character), power, wealth, claim, temper toward the player (-10..10), holdings, and marriage ties.
- About 8-12 houses in play at a time, including the authored ones (the Brésy, the Penhoët, the Lanzi, the royal lines).
- **No AI.** Houses act through the director: pool events gated on their state. A strong, hostile house brings a border quarrel; an indebted one offers a daughter. This is how the engine already works.

### 5.4 Realm
- Provinces tied to world-map places: owner house, income, temper, levy. This is KoA's `holdings` and `estate` generalised.
- The crown's treasury, the Estates' (or the Moot's) mood, the Church's standing.
- **Yearly ticks** at Michaelmas, where pay already falls. KoA's seasonal tick stays for scenes that need the season.

### 5.5 Succession
- A law per realm and per house: male primogeniture, male preference (daughters when there is no son), or partible among sons. The West starts **unwritten**.
- Changing the law is a scene with a price: the Estates, the Church, a rival claimant.
- The head's death queues the succession scene. Outcomes: the heir succeeds; a regency (a minor heir, with a regent chosen from the family or a rival); a contested claim, which can become a war.
- Child mortality, adult illness and old age use the seeded `chance` effects KoA already has.

### 5.6 War
- An abstract campaign: forces, pay, supply, commander skill and terrain.
- Each war is 2-4 decision scenes with checks, then one numeric battle result that drives casualties (KoA's `casualties` effect, scaled up).
- **No tactical layer.** That is a different game.

---

## 6. Architecture

### Repository layout
```
packages/engine/     conditions, effects, director, text, rng, calendar, save, savecode, checks, cards, map, worldgen
games/knight/        Knight of Adalia: content, station, estate, romance, its UI shell
games/house/         the sequel: content, characters, houses, realm, succession, war, its UI shell
tools/               validator, bot, continuity, lint: parameterised by game
```
- The move is done first, as its own step, with no behaviour change.
- **Gate: KoA's `npm run check` passes unchanged after the move, and the published Pages build is identical in play.** The Pages workflow publishes both games (KoA at its current URL, the sequel beside it).

### Tooling for the sequel
- **Bot:** house survival per book, extinction rate, generations reached, ending spread per opening, spread of house power per book (to catch snowballs and death spirals).
- **Continuity checker:** the dead-character rule extended to generated people; a kinship rule (no "your uncle" for a cousin); the pronoun rule above.
- **Save size:** a hard budget per save (tested), met by the chronicle condensation in section 2.

---

## 7. Size and scope guard
- **Prologue:** 10-15 scenes. **Each book:** 40-55 scenes plus pools, about 60-70k words. A single run sees about half.
- Six openings converge by Book I, Act I. Openings carry variant text, not separate spines, after that point.
- Pools carry the variety. The spine carries the weight.
- Total: about 180-220 scenes, close to KoA's size. If the prose budget runs short, Book II shrinks first.

---

## 8. Open decisions for the author
1. **The start date.** Year 50, with a playable prologue as the old founder? Recommendation: yes. It teaches the handover and pays off the import. The alternative is to open at the founder's funeral.
2. **The West's law.** Does the West start with no written law of succession, so every opening fights over it? Recommendation: yes. It makes the female-line question (Jehanne, Mahaut) the sequel's political spine.
3. **Bastards and cousins.** Can a bastard or a cousin succeed when the direct line fails, or does the house end? Recommendation: cousins by law, bastards only through legitimation (a Church scene with a price). It lowers extinction to the target band without making it toothless.
4. **Playing a regency.** When the heir is a minor, do you play the regent or the child? Recommendation: the child, with the regent as a powerful character you can lose to.
5. **Romance.** KoA's suits system is aimed upward, for one man. Recommendation: the sequel replaces it with **matches**: marriages negotiated between houses for each child, with a smaller authored set of love matches that cost political value.
6. **Working title.** *The House* is a placeholder.

## 9. Build order after approval
1. **Engine extraction** into `packages/engine`, with KoA green and its Pages build unchanged.
2. **Character refactor**: `characters`, `ruler`, paths and pronouns, with KoA ported onto it and still green.
3. **Vertical slice**: the Founder opening, the prologue, Book I and one succession into Book II. Bot and continuity checks on it, and a transcript review.
4. **Houses, realm and war**, tuned against the slice.
5. **The other five openings**, then Books II and III, each with a bot pass and a transcript review.
6. **Endings and the chronicle builder**, with every ending reachable in bot runs per opening.
