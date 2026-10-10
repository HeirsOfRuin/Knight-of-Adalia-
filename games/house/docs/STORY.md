# House of Adalia: The Story of the Prologue and Book I

**Status:** Layer 1 (the spine) and Layer 2 (the acts) approved by the author, 2026-10-07. Layer 3 (the beat sheets) approved: the prologue 2026-10-07, Book I's four acts 2026-10-07/08. Step 4b (writing the prologue) is under way. The process is in the decisions log at the end.

**Holds to:** `../../knight/content/canon.md` and `../content/canon.md` (dates, ages, names); `FRAME.md` §2 (frames and the nine starts); `PLAN.md` §4-8 (systems, timeline, cast, the Knight of Adalia promises); the Knight of Adalia style guide (voice).

**Names.** Names approved for the sequel are recorded in `../content/canon.md`. A name still marked *(new)* is provisional until the author approves it.

---

## Layer 1: The spine

### 1. The dramatic questions
- **Prologue, *The Old Lord* (years 50-55).** *Can the founder hand on what he built while he is still alive to see who takes it?* The founder made the house out of nothing. The prologue is about whether he can let go of it, and what letting go costs the child who catches it.
- **Book I, *The Keeper* (years 55-78).** *Can the heir hold what the founder won, when the law of the land, a rival house and their own family all pull at it, and when the one person who could have told them how is gone?*

### 2. The braid
Book I is three strands. Each act leans on one, while the other two stay in view.

**The realm: who may inherit.** The West's question for a generation is whether land and crowns can pass through a woman. Jehanne's duchy did; Valdrenne says a crown cannot. Mahaut's own heir is a daughter (decision L1-6), so the law is personal to the most powerful woman in the West. By frame:

| Frame | The realm strand |
|---|---|
| Free | The Estates of the West must write a law of succession, and the house has a vote. |
| Adalian | King Edwin's lawyers test the West's liberties against Adalian law. Edwin dies in about year 64 and leaves a minor heir. |
| Divided | Valdrenne claims Mahaut's duchy as escheat, because it cannot pass through a woman. The Armance lords must choose. |

**The rival: the house of Penhoët** (decision L1-1). An old Armance house of the other claimant's party.
- **Its claim.** It claims the Armance through the male line, so a law against inheritance through women makes Penhoët's claim better and Mahaut's worse. It also claims the founder's best manor: Kerval was Yann de Penhoët's grandfather's.
- **The people.** Old Yann is dying. His son Hervé de Penhoët is a careful, patient man who never forgets a field. Knight of Adalia may already have betrothed the founder's second child to a Penhoët grandson (`c5_betrothed_penhoet`). A cadet, Sir Yvon de Penhoët of Kerlan, may even hold land of the founder (`registry/vassals.yaml`).
- **What it gives the story.** Penhoët is the enemy who might also be family: rival or in-law, sometimes both.

**The family: the will and the heir.** The founder's children are the centre.
- **The heir** grows up in a shadow they did not cast and must decide how much of the founder to be.
- **A younger sibling** wants land of their own, and Penhoët wants that sibling.
- **The founder's widow** has her dower and her own kin.
- **The will** decides who gets what. The law decides whether the will stands.

**Where they touch.** One marriage carries all three strands. If the second child marries into Penhoët and the law of succession changes, the founder's grandchildren could carry Penhoët's claim. The heir's decision about that one match is Book I's hinge.

### 3. The cast (ages in year 50)
| Person | Age | Role | What they want | Strand |
|---|---|---|---|---|
| **The founder** | 49 | Played in the prologue's first half; from the import, or generated | To leave the house whole, and to be remembered rightly | Family |
| **The founder's spouse** | about 40 | The widow-to-be; from the import or generated | Her dower, her children safe, her own house's interest | Family |
| **The heir** (the eldest) | about 20 | Played from the prologue's second half to the end of Book I: the Keeper | To be equal to the founder, or free of him | Family |
| **The second child** | about 17 | The sibling | Land and a life of their own; may already be promised to Penhoët | Family, Rival |
| **The youngest** | about 10 | A child to raise; a regency risk if the heir dies early | Unknown yet; shaped by Book I | Family |
| **The Old Companion** | 50s | The founder's oldest surviving follower, from the import's people (`people[]`) or generated | To be needed by the new lord as by the old | Family |
| **Mahaut of Armance** | 31 | Queen, Duchess or claimant, by frame | That her daughter inherits | Realm |
| **Edwin of Adalia** | 38 | King (Adalian frame), dies about year 64 | A loyal West that pays | Realm |
| **Amaury VII of Valdrenne** | 26 | King; the divided frame's sovereign in the Armance | The Armance whole, and the duchy escheated to him | Realm |
| **Thibaut de Brésy** | about 45 | King (one free start), or an outlawed sword | His house restored | Realm |
| **Old Yann, and Hervé de Penhoët** | about 70; about 45 | The rival house's old head and its heir | Kerval back; the Armance by the male line | Rival |
| **Tanguy de Kerguen**, the Kerguen heir | 21 | A young house rising; the founder's stepson if KoA's founder married Blanche de Kerguen | A place among the great houses | Rival (a counterweight to Penhoët) |
| **The new Bishop of Saint-Lys** *(new, from about year 54)* | 40s | Grants legitimations and dispensations, and blesses or refuses the law | Both kings' favour | Realm |

**Imports that change the cast** (Layer 2 works these out):
- If the founder **married Mahaut** (`c5_married_mahaut`), she is the founder's widow-to-be, and the law fight is about the house's own daughters.
- If he **married Blanche de Kerguen**, Tanguy is the heir's stepbrother.
- If the second child was **betrothed to Penhoët** in Knight of Adalia, the rival is already half-family on the first day.

### 4. The prologue in two halves
**First half: as the founder (years 50-53, about 7 scenes).**
- The hall, and where the house stands.
- The Old Companion and the founder's surviving people.
- The heir, met as an adult.
- The sovereign's summons.
- The first match: Penhoët asks for the second child.
- The first Michaelmas.
- The rival's first move.

The player decides as the founder: what to give, what to keep, whom to trust.

**The handover (year 53).** The founder falls ill and can no longer ride.
- **Decided (L1-4):** the founder chooses how to put the house into the heir's hands, and the handover always happens. The player picks the manner:
  - before the whole household, formally;
  - quietly, by letter to the sovereign;
  - with conditions written into a will.

  Under the hood this is the existing `step_down` and succession, so the founder stays alive. Play passes to the heir.
- **The cloister** is the other road (L1-5, kept). A founder still strong enough may instead give up the house and go into a religious house. He lives on there into Book I, sending letters.

**Second half: as the heir (years 53-55, about 7 scenes).**
- The house in your hands, with your father watching from his bed.
- The will, his wishes against yours.
- The deathbed, which reads the founder's whole life from the import.
- The funeral and the chronicle.
- The oath to the sovereign.

The player decides as the heir what to honour and what to change while the founder can still see it.

### 5. The six openings
Each one-line form says how the prologue differs. The openings converge by the end of Book I, Act I (FRAME.md).

| Opening | Its prologue | How it converges |
|---|---|---|
| Crowned | A king dying: can he make the heir accepted as king in his lifetime? The rival's claim is to the crown itself. | The heir is a young king; the house is the crown |
| Kingmaker | The sovereign the founder made now fears him; the heir inherits the fear, not the favour | A great house watched by its own creation |
| Founder | As above: a great lord's last years and Penhoët's claim to Kerval | The base case |
| Diminished | One manor; the founder's last chance to buy back a lost one; the heir inherits a grievance | A lesser house with a grudge |
| Exile | Abroad; a pardon the founder cannot take but the heir can, so the handover is also the return | The heir comes home in Book I, Act I |
| Ruin | Landless, in service; the founder's name struck out, the heir's still clean | The heir wins a holding back in Book I, Act I |

### 6. The tone
Knight of Adalia's house voice (L1-7): grounded, physical, people who talk, warmth and humour, real losses. For the prologue: an old man's humour, and the heir's fear of being measured and found short. For Book I: a generation's work, with the Second Mottle (years 63-65) as its darkest stretch.

---

## Layer 1 decisions (decided 2026-10-07)
| # | Decision | Decided |
|---|---|---|
| L1-1 | The rival house | Penhoët: Knight of Adalia set it up, it has a claim against the founder's land and a stake in the law, and it can be family |
| L1-2 | The heir's defining conflict | The founder's shadow: to be equal to him, or free of him |
| L1-3 | The second child | An ally who can be turned. Penhoët courts them, and the heir's choices decide which way they go |
| L1-4 | Where the handover falls | During the founder's illness (year 53), by his choice of manner; he dies in the second half, played as the heir |
| L1-5 | The cloister | Kept: a strong founder may take the cowl instead, and live on into Book I as letters |
| L1-6 | Mahaut's heir is a daughter *(new to canon)* | Yes: it makes the law personal to the most powerful woman in the West |
| L1-7 | Tone balance | Knight of Adalia's: warm and funny in the hall, hard in the world, with the Second Mottle as Book I's darkest stretch |

---

## Layer 2: The acts (approved 2026-10-07)

How to read an act:
- **Strand** is the strand the act leans on.
- **Turns** are the act's turning points.
- **Choices that matter** are those whose results later acts read. Each lists what it sets, as state names to be built (see the system hooks at the end of this layer).
- **Openings** says how each start differs. The base case is the Founder opening.

### Prologue, first half: *The Old Lord* (years 50-53, played as the founder)
**Strand:** family, with the rival introduced and the realm set by frame. **Skip in:** none; the game opens in spring, year 50.

| Frame | Premise |
|---|---|
| Free | The crown of the West is eight years old. The Estates talk of writing a law of succession, and the founder's voice carries. |
| Adalian | Wendmere's governor reads the patents of the West's lords line by line. The founder's grants and liberties are on his table. |
| Divided | The new border runs through the West. A Valdrennish governor counts the Armance for the new tax, and Penhoët is his friend. |

**Turns:**
1. **The hall.** The house as it stands: lands, men, money, the family (the first ledger).
2. **The old company.** The Old Companion and the founder's surviving people. Who is left, and what each wants before the end.
3. **Penhoët's suit.** Hervé de Penhoët brings a suit before the sovereign's court for Kerval (or the founder's best manor). Kerval was his grandfather's.
4. **Penhoët's offer.** Old Yann proposes to end the quarrel with a match: the second child to his grandson Ronan de Penhoët (16). If Knight of Adalia already made that betrothal (`c5_betrothed_penhoet`), the offer becomes the demand that it be kept.
5. **The summons.** The founder's last service:
   - free: speaking at the Estates' first debate on the law;
   - Adalian: answering the governor's reading of the patent;
   - divided: the governor's tally.

**Choices that matter:**
- **The suit:** fight it at law, buy Penhoët off, or settle it by the match. This sets the suit's state and Penhoët's temper; the match ties the rival to the family.
- **The heir:** bring the heir into the house's business, or keep the reins. This sets the heir's bond and skills, and the founder's shadow (a counter: how much the heir is measured against the founder).
- **The law** (free and divided): speak with Mahaut for inheritance through women, with Penhoët for the male line, or say nothing. This sets the house's stance, which Mahaut and Penhoët each remember.

**The handover (year 53).** The founder falls ill.
- He gives the house to the heir in one of three manners:
  - before the household (the household's loyalty rises);
  - by letter to the sovereign (the sovereign's favour rises, and the household doubts);
  - by a will with conditions, such as land for the second child (sets the will).
- **Or the cloister,** if his health is still good: he takes the cowl and lives on into Book I.
- Play passes to the heir.

**Openings:**
| Opening | First half |
|---|---|
| Crowned | A king dying. The question is whether he can have the heir crowned beside him (`c5r_heir_crowned` may already have done it). The suit is Quérec's defiance, and Penhoët's claim is to the Armance crown through the male line. |
| Kingmaker | The sovereign the founder made begins to strip his offices. The suit is the crown's own. |
| Founder | The base case. |
| Diminished | The founder's last chance to buy back a manor lost in Knight of Adalia's war. Penhoët holds it (L2-7). |
| Exile | Abroad, at the court the export names. A pardon is offered on terms the founder cannot meet, because he is attainted, but the heir could. |
| Ruin | In service with a free company or a great house. A pardon is unthinkable, but service could earn the heir a holding. |

### Prologue, second half: *The Heir* (years 53-55, played as the heir)
**Strand:** family. **Skip in:** a season or two after the handover.

**Turns:**
1. **First days.** The Old Companion and the founder's knights test the heir: obey the old order, or overrule it.
2. **The will.** The founder's wishes for the second child's land and match, against the heir's.
3. **Penhoët's second move.** With the founder failing, Hervé presses: a boundary seized, or the suit heard early.
4. **The deathbed, or the cloister's gate.** The founder's last words read his whole life from the import. The heir's answer, "I will be you" or "I will be myself", sets the shadow for Book I.
5. **The funeral, the chronicle, the oath.** The founder's chronicle paragraph is read, and the heir swears homage to the sovereign.

**Choices that matter:**
- **The will:** honour it, or amend it. This sets the second child's loyalty.
- **Penhoët:** answer by force, by law, or by concession. This sets Penhoët's temper and the house's standing.
- **The deathbed answer:** sets the shadow.
- **The oath's terms:** free and plain, or bought with a concession. This sets favour with the sovereign.

**Openings:**
- **Exile:** the heir accepts the pardon and comes home, or stays abroad. Staying abroad leads toward the Foreign House ending.
- **Crowned:** the oath is the crowning, or the Estates' acclamation of the heir.

### Book I, Act I: *The New Lord* (years 55-58)
**Strand:** family and rival. **Skip in:** a season after the oath.

| Frame | Premise |
|---|---|
| Free | The crown asks every house where it stands on the law before the Estates meet. |
| Adalian | A new governor arrives, and the patent is read again by a new reign's lawyers. |
| Divided | The governor's tax count reaches the house's valleys, and Penhoët's men ride with his clerks. |

**Turns:**
1. **The founder's knights.** Those who held of him renew their homage to the Keeper, or withhold it. Knight of Adalia's knights come through the import (`lands.vassals`).
2. **The Keeper's own match.** Kerguen (Tanguy's sister), Mahaut's court, an Adalian house, or a love match.
3. **The suit judged.** Kerval is kept, lost, or shared.
4. **The second child's match.** Penhoët, Kerguen or elsewhere. This is where the second child is won or turned.

**Choices that matter:**
- **Whom the Keeper marries.** This sets an alliance (a house's temper floor and a muster promise).
- **The founder's men or your own.** Keeping the old knights deepens the shadow; raising new men costs the old knights' loyalty.
- **The second child's land and match.** This sets their allegiance (house, Penhoët or Kerguen).

**Openings:** Exile and Ruin converge here. Exile: the return, and a manor given back under the pardon. Ruin: a holding won by service. From here every opening is a house of the West with something to hold or to win back.

### Book I, Act II: *The Law* (years 58-63)
**Strand:** the realm. **Skip in:** two to three years.

| Frame | The law fight |
|---|---|
| Frame | The law fight | Likely outcome | What overturns it |
|---|---|---|---|
| Free | The Estates of the West meet at Lannec to write the law of succession. On the table: male preference (Mahaut's daughter Jehanne inherits), or the male line (Penhoët's claim to the Armance rises over hers). | **Male preference passes.** Jehanne is Mahaut's heir. | Penhoët carries the Estates for the male line, if it gathers enough votes and standing. The house's vote can be one of them. |
| Adalian | King Edwin wants the wardship of Mahaut's daughter, and her marriage with it. The West's liberties (`c5_liberties`) are argued in the King's court. | **Edwin wins the wardship.** Jehanne is raised at Wendmere, and her marriage is the King's to sell. | A strong house wins Mahaut her right: enough standing in the West, and the King's need of it, with the liberties to argue from. |
| Divided | Amaury VII claims Mahaut's duchy as escheat, because it cannot pass through a woman. The Armance lords must submit (Penhoët is rewarded), resist, or go to law at Cordelle. | **The escheat stands.** The duchy goes to the crown of Valdrenne, and Penhoët is raised. | A strong resistance among the Armance lords, or a suit won at Cordelle. |

The law is **mostly fixed** (L2-2). Each frame has a likely outcome that stands unless a strong house overturns it. The player's house is one of the strong houses that can, or can help Penhoët to. The threshold (votes, standing, the sovereign's need) is a mechanism for step 5; here it is only named.

**Turns:**
1. The debate opens, and both sides court the house.
2. A bribe, a threat, or a marriage offered for the house's vote.
3. The vote, judgement or submission. The likely outcome stands unless the threshold is met.
4. The consequences: Penhoët raised or checked, Mahaut secure or diminished.
5. The house's own law: whether to change it (`house_law`) to match the realm's, or against it.

**Choices that matter:**
- **The stance and vote.** This sets the house's stance, which Mahaut and Penhoët each remember, and adds to or takes from the threshold. The result is the realm's law, which is new state (see the system hooks).
- **Whether to spend for it.** Overturning the likely outcome costs coin, favours and standing, and makes an enemy of the side that loses.
- **The house's own law:** keep male preference, adopt the male line, or name the heir by will.
- **Breaking with Penhoët or with Mahaut.** Either sets a temper. Which daughters can ever inherit, the Keeper's own included, depends on this act.

### Book I, Act III: *The Children's Mortality* (years 63-66)
**Strand:** family. **Skip in:** two to three years. This is the Second Mottle (canon addition: years 63-65), which falls hardest on children (the `plague` and `plague_children` flags).

| Frame | The realm in the plague |
|---|---|
| Free | The crown is shut in Lannec; the Estates do not meet. |
| Adalian | Edwin of Adalia dies (about year 64) and leaves a minor heir. A regency council governs in Wendmere. |
| Divided | The border closes against the plague, and families are cut in two. |

**Turns:**
1. **The plague comes.** Shut the gates, stay with the people, or flee. This echoes Knight of Adalia Ch3's stay-or-flee.
2. **A child of the house is likely to die.** The death is told; it is the odds, not a script.
3. **The plague takes from Penhoët too.** Hervé, or his heir, may die. The rival house has a minor at its head, and a chance opens.
4. **The free companies.** Men paid off after the last war, on the roads.

**Choices that matter:**
- **The plague response.** This sets the village's temper and the family's risk.
- **Penhoët in its weakness:** succour it (temper reset, perhaps a debt), or strike while it is weak (land, and a feud for a generation).
- **The Keeper's will after the deaths.** Name an heir, and provide for the survivors.

### Book I, Act IV: by frame, *The Test of the Law*, *The Minority* or *The Drift* (years 66-78)
**Strand:** the realm and the rival together, then the family at the Keeper's end. **Skip in:** two years.

| Frame | The crisis |
|---|---|
| Free | **The law put to the test.** Mahaut dies (about year 73, at 54; L3-2), and Jehanne succeeds to whatever Mahaut held: the crown, if she is Queen, or the duchy of Armance. The free duchy's case is the same. Whether the West accepts her depends on the law written in Act II. If the male line won, Penhoët claims what she inherits. Under a crown the house itself wears, the test is the house's own succession. |
| Adalian | **The minority.** Adalia's regency council splits, Carrow's heirs against Wendmere's officers (the Hales). The house joins a party, and Penhoët is in the other. |
| Divided | **The drift.** Amaury VII is strong, and the Salt's king is a child. Raids along the border; Penhoët acts as Valdrenne's man in the West. |

**Turns:**
1. The crisis opens.
2. The house takes a side, or holds back.
3. **Penhoët's last move of the generation:** it tries to take Kerval, or the crown, under cover of the crisis.
4. The crisis resolves.
5. **The Keeper's end** (years 72-78), shaped by the act: a death in the crisis, an illness, or stepping down for the heir. The end is open (L2-4): the odds can end the Keeper sooner, and this turn is offered only to a Keeper who lives into the act.

**Choices that matter:**
- **The side.** This sets favour with the winners and the losers.
- **How Penhoët is settled:** broken (attainted, its lands taken), reconciled (a marriage), or contained (L2-3). If broken, its claim passes to the cadet Sir Yvon of Kerlan, who returns in Book II.
- **The Keeper's preparation for the succession:** the will, the law, and the heir's upbringing. The upbringing is chosen in Acts II and III, when the grandchild is seven to fourteen.

### Pools by act (from PLAN.md §6.5)
| Act | Pool events gated to it |
|---|---|
| Prologue | the old company's last man; a border raid (`c5r_no_peace`); a creditor's letter |
| I | a rival's border quarrel; an indebted house's daughter; the free company on the road; a widow's dower suit (the founder's widow) |
| II | a bribe for the vote; a pilgrim's relic; a bad harvest; the bookish child and the tutor |
| III | plague events: the sealed village, the friar, the mass grave, the orphaned cousin |
| IV | the ransom owed; a heresy preached in the market; the regent's letter; the old company's last man, if still living |

### Knight of Adalia promises placed (PLAN.md §8)
| Promise | Where Book I keeps it |
|---|---|
| `c5r_peace_bought`: thirty years of peace | No war with Valdrenne in Book I. Act IV's crisis stays inside the realm. |
| `c5r_peace_castle`: the castle's people never forgive it | A hostile holding, and an Act I pool event |
| `c5r_peace_marriage`: the Valdrennish marriage keeps the peace | The Keeper is already married into Sauvel at Act I, so the match turn is about the second child only |
| `c5r_no_peace`: the march burns ten years | Border raids in the prologue pool, to about year 55 |
| `c5r_council_mahaut`: her council outlasts you | Mahaut's party holds the council in Acts I-II (Crowned) |
| `c5r_heir_crowned` | The prologue's oath is the heir's own crowning |
| `c5_liberties` | Adalian Act II: the patent's liberties argued in the King's court |
| A churchly heir becomes Bishop of Saint-Lys | Act IV, about year 70, if that child is not the Keeper |
| A bookish child writes a chronicle of the West | The chronicle is "by" that child, from the prologue on |
| The exile's heir goes home under another king's peace | The Exile prologue's second half: the pardon is offered to the heir |

### System hooks this layer needs (flagged for step 4b and step 5, not designed here)
- **The ledger and the House panel:** the prologue's first turn.
- **Matches:** offers, terms, a love match. Needed from the prologue (Penhoët's offer) and in Act I.
- **Rival houses as state:** Penhoët's head, standing, temper, claim, and the suit. From the prologue.
- **The founder's shadow:** a counter for how much the heir is measured against the founder. Read at the deathbed and in Book I's choices.
- **The realm's law:** new state, written in Act II and read in Act IV and by the endings.
- **Knight of Adalia's knights in the house:** the import's `lands.vassals` as the house's vassals. Book I, Act I.
- **The household's loyalty and the sovereign's favour:** from the handover's manner.
- **Already built:** the plague flags, regency, succession, wills, `house_law`, stepping down.

---

## Layer 2 decisions (decided 2026-10-07)
| # | Decision | Decided |
|---|---|---|
| L2-1 | Act IV's name | By frame: *The Test of the Law* (free), *The Minority* (Adalian), *The Drift* (divided) |
| L2-2 | How the law fight resolves | Mostly fixed. Each frame has a likely outcome (free: male preference; Adalian: Edwin's wardship; divided: the escheat) that a strong house can overturn. The threshold is designed in step 5. |
| L2-3 | Penhoët's fate | Broken, reconciled or contained. If broken, the claim passes to the cadet Sir Yvon of Kerlan into Book II. |
| L2-4 | The Keeper's end | Open, with a shaped end offered in years 72-78 to a Keeper who lives into Act IV |
| L2-5 | Mahaut's daughter | Jehanne, born in year 44, named after her great-grandmother. Her father is the founder if Knight of Adalia married him to Mahaut; otherwise Sire Riwal de Kerguen, killed at the Pont-aux-Moines (L3-3). |
| L2-6 | Penhoët's grandson | Ronan de Penhoët, Hervé's son, about 16 in year 50 |
| L2-7 | Diminished's lost manor | Penhoët holds it |

---

## Layer 3: Beat sheets, round 1: the Prologue (approved 2026-10-07)

**Scope.** The Founder opening, in the free frame (under Queen Mahaut, King Thibaut or the free duchy) and the Adalian frame (under King Edwin). The other openings and the divided frame keep their Layer 2 outlines until their own writing pass.

**How to read a scene.**
- **Beats:** what happens, in order.
- **Choices:** what the player can do, and what each carries forward.
- **Check:** attribute + skill, and difficulty, where a choice is rolled.
- **Reads / sets:** state. Paths that exist now are written plainly (`counter.x`, `flag.x`, `heir.bond`, `designate`, `step_down`, `marry`). Paths marked **[5]** need a system from step 5. Until then, a counter stands in.
- **Variants:** frame (free, Adalian) and import differences.
- **Risks:** continuity: bound phrases, the dead, kinship words, and Knight of Adalia's epilogue.

**Three counters run through the prologue and Book I.**
- `counter.shadow`: how far the heir is measured against the founder. It goes up when the heir keeps the founder's way, and down when the heir makes their own.
- `counter.household`: the household's loyalty, meaning the founder's knights, officers and old company.
- `counter.favour`: the sovereign's favour.

Penhoët's temper and the suit for Kerval are rival-house state **[5]**. Until that is built, `counter.penhoet` and the flags `h_suit_*` stand in for them.

**The odds in the prologue (decided, L3-6).**
- The life odds do not kill the founder, the heir or the founder's spouse in the prologue. Births, matches and the deaths of others still happen.
- The founder's death is scripted (P14). The spouse's is also scripted: Knight of Adalia's epilogue says she outlives the founder by eleven years.
- This is a small hook in `family.ts` **[5]**.

### First half: as the founder (spring 50 to Lady Day 53)

**P1. The Hall** (spring, year 50). It replaces the framework's `h_open`.
- **Beats:**
  1. A cold morning; the founder at 49.
  2. The house as it stands: lands, men, money, and the family at table.
  3. The first ledger (the House panel). Who sits where at the high table says who matters.
- **Choices:**
  - Walk the bounds with the heir: `heir.bond +1`, `counter.shadow +1`.
  - Go over the books with the steward: a ledger lesson, `flag.h_p_books`.
  - Hear the petitions in the hall: `counter.household +1`.
- **Check:** none. **Reads:** the import (lands, spouse, children, `c5_west_free`, `c5_earl`, `c5_liberties`), and `realm.sovereign`.
- **Variants:**
  - Free: the crown of the West or the free duchy, eight years old; the Estates meet every Whitsun.
  - Adalian: the King's governor at Lannec. With `c5_earl`, the founder is Earl of the March.
- **Risks:**
  - "Crown of the West" must not appear in the free-duchy case, which has no crown.
  - With `c5_married_mahaut`, the spouse at table is Mahaut, and Jehanne (6) is the founder's daughter.

**P2. The Old Company** (spring, year 50).
- **Beats:**
  1. The Old Companion: from the import's `people[]` (alive, a follower, highest loyalty) or generated.
  2. The roll of who is left: the living, and the dead remembered by name.
  3. What the Companion wants before the end.
- **Choices:**
  - Give him a holding of his own: costs land; he leaves the hall but stays loyal.
  - Make him the heir's counsellor: `flag.h_companion_counsel`. In P11 he is the test, the old order in person.
  - Keep him at the founder's side to the end: `counter.household +1`; he is at the deathbed.
- **Check:** none. **Reads:** `people[]` and their fates.
- **Risks:** Knight of Adalia's epilogue fixes several of the old company's deaths:
  - Davy Ludd dies at seventy, in the hall or on his mill-holding;
  - Will Cobb dies at about a hundred;
  - Wat Coker dies free on his own holding, under "Nobody's man".
  
  Those three must die as the epilogue says, whenever that falls. The Companion's own life can run long.

**P3. The Heir** (summer, year 50).
- **Beats:**
  1. The heir, about 20, met as an adult, with the temperament, upbringing and bond from Knight of Adalia.
  2. One small scene that shows who they are: at arms, at the books, at court, or in church.
  3. The founder sees himself in them, or does not.
- **Choices:**
  - Give the heir a manor to run: `heir.bond +1`, `counter.shadow -1`, `flag.h_heir_manor`.
  - Send the heir to the sovereign's court: `counter.favour +1`, `heir.bond -1`, `flag.h_heir_court`.
  - Keep the reins and keep the heir at your side: `counter.shadow +2`.
- **Check:** none. **Reads:** `heir.temperament`, `heir.upbringing`, `heir.bond`, `c4_kept_home`, `c4_page_armance`, `c4_page_prince`, `c4_child_church`.
- **Risks:**
  - If the eldest went to the Church in Knight of Adalia (`c4_child_church`), the heir is the next child. The churchly eldest is the future bishop (PLAN.md §8).
  - Knight of Adalia's founder ending says "{heir.eldest.name} holds what you held after you". When the eldest is in the Church, that line and the bishopric contradict each other. The House chronicle should name the actual heir.

**P4. Penhoët's Suit** (summer, year 50).
- **Beats:**
  1. A writ is served at the gate. Hervé de Penhoët sues for Kerval before the sovereign's court: Kerval was his grandfather's.
  2. The founder's steward finds the old charter, or cannot.
  3. Hervé, met in person: careful, courteous, a man who never forgets a field.
- **Choices:**
  - Fight it at law, with a check: `flag.h_suit_law`. Success sets `flag.h_suit_strong` (the charter holds); failure sets `flag.h_suit_weak`.
  - Buy Penhoët off: coin, and `counter.penhoet +1` (pacified for now). Hervé takes the money and does not forget.
  - Answer that the matter can be settled between families: this leads to P6, `flag.h_suit_match`.
- **Check:** wits + stewardship, hard (the charter). Diplomacy can stand in at a further step if the founder is better at people than parchment.
- **Reads:** whether Kerval is the founder's manor or a holding (the import's lands). **[5]:** the suit as rival state.
- **Variants:**
  - Free: the crown's court at Lannec, or the Duchess's council.
  - Adalian: the King's governor at Lannec hears it, and Adalian law is kinder to a charter than to a memory.
- **Risks:** Kerval's name has to match the import's manor name, or the scene says "your best manor".

**P5. The First Michaelmas** (autumn, year 50).
- **Beats:** the reckoning, taught in prose. Rents, the men's pay, the steward's tallies, and what the house can afford next year.
- **Choices:**
  - Pay the household well: `counter.household +1`, at a cost in coin.
  - Put coin by for the suit or the will: `flag.h_p_saved`.
  - Lend to a neighbour who asks: a favour owed, which the pool can call in later.
- **Check:** none. **Reads / sets:** the season tick (already built), `res.coin`.
- **Risks:** none.

**P6. Penhoët's Offer** (winter, years 50-51).
- **Beats:**
  1. Old Yann sends for the founder; he is dying, and he knows it.
  2. Two old men who fought on different sides, talking about the Armance.
  3. His offer: end the quarrel with a match. The founder's second child marries Ronan de Penhoët, or Hervé's daughter if the second child is a son, and Kerval is never spoken of again.
  4. Yann dies in the spring (news). Hervé is head of Penhoët.
- **Choices:**
  - Accept: `marry` the second child into Penhoët (a betrothal until of age), `flag.h_penhoet_match`, `counter.penhoet +2`. The suit is dropped.
  - Refuse: `counter.penhoet -1`. The suit goes on.
  - Ask the child first: the second child's answer depends on their bond. `flag.h_asked_second`, and the child's loyalty rises either way.
- **Check:** none. **Reads:** `c5_betrothed_penhoet`, `second.sex`, `second.age`. **[5]:** matches with a named house.
- **Variants:**
  - **`c5_betrothed_penhoet`:** Knight of Adalia's epilogue says the second child "marries into Penhoët at sixteen", so in year 50 they are already married into Penhoët and living there. The scene becomes Yann's deathbed with the second child at it, and Yann's offer becomes a request: drop Kerval for your child's sake.
  - **Other Knight of Adalia matches:** `c5_betrothed_lanzi` (in Sarenza), `c5_betrothed_brese` (kept), `c5_surety_*` (a hostage, home after the peace) and `c5_betrothal_refused` (chooses their own match at 19, about year 52). Each changes what Penhoët can offer. Penhoët then offers a lesser cousin, or presses the suit instead.
  - **No second child:** the offer is for the heir.
- **Risks:**
  - Ronan is 16 or 17, so the marriage waits a year if the child is younger.
  - The kinship words: "your daughter's father-in-law", not "your in-law's father".

**P7. Pool draw** (year 51). One event from the prologue pool (Layer 2): the old company's last man, a creditor's letter, or, under `c5r_no_peace`, a border raid.

**P8. The Summons** (Whitsun, year 52; under King Thibaut, Candlemas, year 53).
- **Beats:** the founder's last service to the sovereign. The road to Lannec, the old faces, and who sits where.
- **Free (Queen Mahaut, or the free duchy):**
  - The Estates of the West at Lannec hold the first debate on writing a law of succession.
  - Mahaut speaks for male preference, through which her daughter inherits; Hervé speaks for the male line.
  - Choices:
    - Speak with Mahaut: `flag.h_law_women`, Mahaut's regard +2, `counter.penhoet -1`.
    - Speak with Penhoët: `flag.h_law_male`, `counter.penhoet +2`, Mahaut's regard -2.
    - Say nothing: `flag.h_law_silent`. Both sides remember the silence, and both court the heir in Act I.
  - Check: presence + diplomacy, medium. It decides how far the speech carries, which is the house's weight in Act II's threshold.
- **Free, under King Thibaut (L3-1):**
  - Thibaut dies in the saddle, hunting, at Martinmas of year 52: the eleventh year of his reign, as the chroniclers count it.
  - The Estates of the West are called to Lannec in the snow to choose. The candidates are Thibaut's young son, with a regency of the Brésy party, or Mahaut, who has the blood.
  - The choice is the law question in its first form: a boy through the male line, or a woman with the older claim. The founder rides to Lannec for his last service, and falls ill on the road home (P9).
  - Choices:
    - Speak for the boy: `flag.h_law_male`, `counter.penhoet +1`, Thibaut's party in debt to the house.
    - Speak for Mahaut: `flag.h_law_women`, Mahaut's regard +2.
    - Say nothing: `flag.h_law_silent`.
  - Check: presence + diplomacy, medium; how far the speech carries.
  - Outcome, mostly fixed (L3-5): the Estates crown Mahaut, unless the house speaks for the boy and the speech carries. Then Thibaut's son is king, under a Brésy regency. The `west` effect (built) changes the sovereign.
- **Adalian:**
  - The King's governor at Lannec reads the founder's patent line by line. With `c5_liberties`, he finds the West's liberties written into it, and does not like them.
  - Choices:
    - Defend the liberties word for word: `flag.h_patent_defended`, `counter.favour -1`, and the West's regard rises.
    - Concede a clause for the King's goodwill: `flag.h_patent_conceded`, `counter.favour +2`.
    - Pay the governor's clerks to lose the question: coin, and `flag.h_patent_bought`. It comes back in Act I, read by a new governor.
  - Check: wits + diplomacy, hard.
- **Risks:**
  - The Moot is the Adalian assembly; the Estates of the West are free-frame only.
  - "King's governor at Lannec" is bound to the Adalian frame.

**P9. The Illness** (winter, years 52-53).
- **Beats:**
  1. The founder falls ill on the road home, or in the hall at Christmas.
  2. A fever, then a weakness that does not lift; he cannot ride.
  3. Physicians, a relic, rest. Low magic: nothing is ever confirmed.
- **Choices:**
  - A Sarenzan physician: costs coin.
  - The saint's relic, borrowed from the abbey.
  - Rest, and the household's care: `counter.household +1`.
- **Check:** endurance + nothing (the founder's own constitution), medium, modified by the choice. Success sets `flag.h_founder_rallies`: strong enough for the cloister in P10.
- **Reads / sets:** `health`. The founder's attributes fall (`attr.strength -1`, `attr.endurance -1`).
- **Risks:** the founder must not die here, so the odds stay held off.

**P10. The Handover** (Lady Day, year 53).
- **Beats:**
  1. The founder knows he cannot hold the house another year.
  2. The household waits to see how he will do it.
  3. He does it. Play passes to the heir at the end of this scene.
- **Choices:**
  - Before the whole household, formally: `counter.household +2`, `step_down: handover_hall`.
  - Quietly, by letter to the sovereign: `counter.favour +2`, `counter.household -1`, `step_down: handover_letter`.
  - By a will with conditions, such as land and a match for the second child: `designate` (if the law allows), `flag.h_will_conditions`, `step_down: handover_will`.
  - Take the cowl (only with `flag.h_founder_rallies`): `step_down: cloister`. The founder lives on in a religious house and writes letters into Book I.
- **Check:** none. **Reads / sets:** `step_down` (built), `succeed`, `h_q_succession`.
- **Risks:**
  - The succession scene's text says "gone into the Church" for every `step_down`. It has to read the manner, so that a founder who hands over at home is not sent to a monastery. **[5]**, a small change.
  - After the handover, "you" is the heir. The founder becomes {father.name}, "your father" and "the old lord". Pronouns change sides here.

### Second half: as the heir (summer 53 to Lady Day 55)

**P11. First Days** (summer, year 53).
- **Beats:**
  1. The heir in the founder's chair, with the founder upstairs.
  2. The Old Companion (if he is counsellor) or the founder's steward brings the first order to be signed. It is the founder's way of doing something: the garrison, the mill, the tithe.
  3. The hall watches.
- **Choices:**
  - Sign it as it stands: `counter.shadow +1`, `counter.household +1`.
  - Change it, and say why: `counter.shadow -1`, `counter.household -1`. The Companion's respect rises if the reason is good.
  - Take it upstairs to the old lord: `counter.shadow +2`, `heir.bond +1`. The household notices.
- **Check:** the change, if made, is presence + command, medium. On a failure, the hall obeys but grumbles.
- **Reads:** P2 and P3 choices.

**P12. The Will** (autumn, year 53).
- **Beats:**
  1. The founder's will is read to the heir in the founder's chamber.
  2. What the founder wants for the second child: land, a match, the Church, or nothing.
  3. What the heir wants, and the founder watching the heir's face.
- **Choices:**
  - Honour it: the second child's loyalty rises; land leaves the heir's share; `counter.shadow +1`.
  - Amend it, with the founder's grudging consent (check): the land stays; the second child's loyalty falls unless the amendment gives something back.
  - Amend it after his death, saying nothing now: `flag.h_will_secret`. The second child finds out in Act I.
- **Check:** presence + diplomacy against the founder, hard.
- **Reads / sets:** `designate`, `house_law` (if the will asks for a different law), and `h_will_conditions` from P10. **[5]:** land given to a younger child.

**P13. Penhoët's Second Move** (winter, years 53-54).
- **Beats:**
  1. With the founder failing, Hervé presses. His men move a boundary stone at Kerval and cut the wood, or the court is asked to hear the suit early.
  2. The founder's knights wait to see what the heir does.
- **Choices:**
  - Ride out and put the stone back, armed: command, `counter.penhoet -2`, `counter.household +1`. Risk: blood, and a feud.
  - Take it to the court: the suit is reopened on the record from P4.
  - Concede the wood, and keep the land: `counter.penhoet +1`, `counter.shadow -1`. The old knights call it weakness.
  - Under `h_penhoet_match`: go to Penhoët and speak to Hervé through the second child: diplomacy, `flag.h_second_envoy`.
- **Check:** presence + command (ride out), or wits + stewardship (court), medium.
- **Reads:** `h_suit_*`, `h_penhoet_match`, `c5_betrothed_penhoet`.

**P14. The Deathbed, or the Cloister's Gate** (spring or summer, year 54).
- **Beats:**
  1. The founder is dying (scripted: `death: { who: father, cause: ... }`).
  2. His last words read his whole life from the import: where he began (the background), the wife, the dead children, the war, the crown or the patent.
  3. One last order. The founder settles one thing: a feud, a confession, a debt, or a promise kept from Knight of Adalia.
  4. His question to the heir.
- **Choices**, the heir's answer:
  - "I will be you": `counter.shadow +3`, `flag.h_answer_you`.
  - "I will be myself": `counter.shadow -2`, `flag.h_answer_self`. The founder's reply depends on the bond.
  - Say nothing and hold his hand: `flag.h_answer_silent`. The shadow is left where the act put it.
- **Check:** none.
- **Variants:**
  - **Cloister:** the founder does not die yet. The heir visits him at the abbey gate, and the same question is asked through a grille. His letters run through Book I, Act I, and he dies about year 57 (L3-7): a letter comes from the abbot instead. P15 moves to Act I with him, and the prologue goes from the abbey gate to the oath.
  - **`c5_married_mahaut`:** Mahaut is at the bedside as wife and as Duchess or Queen.
- **Risks:**
  - The dead must stay dead: no living named person who died in Knight of Adalia.
  - The founder's own background words: "a reeve's son", and so on.

**P15. The Funeral and the Chronicle** (summer, year 54).
- **Beats:**
  1. The burial, and who comes:
     - the sovereign's man;
     - Mahaut, by frame;
     - Hervé de Penhoët, who stands at the back;
     - the new Bishop of Saint-Lys, if Évrard has died (about year 54).
  2. The founder's chronicle paragraph is read out.
- **Choices:**
  - Where he lies: beside his wife (if she died in Knight of Adalia), in the church he built, or at Lannec among the great.
  - The words on the stone: his own, or the heralds' (Knight of Adalia's `c5f_truth` or the crusader pedigree).
- **Check:** none. **Reads:** the chronicle (built), `c5f_truth`, `inv_church`.

**P16. The Oath** (Lady Day, year 55).
- **Beats:**
  1. The heir rides to the sovereign to do homage for the founder's lands.
  2. Free: Lannec, before Queen Mahaut, King Thibaut or the Duchess. Adalian: the King's governor at Lannec, or Wendmere if the house is great enough.
  3. The words.
- **Choices:**
  - Swear free and plain: `counter.favour +0`, `flag.h_oath_plain`.
  - Buy the sovereign's goodwill with a concession (a manor's wardship, a tax, a match): `counter.favour +2`, and the concession is read in Act I.
  - Swear with a reservation spoken aloud: the West's liberties, or Kerval's title (`flag.h_oath_reserved`). `counter.favour -1`, and the West's regard rises.
- **Check:** presence + courtesy, medium, for the reservation to be received and not resented.
- **Sets:** the prologue's chapter card, and the end of the prologue.
- **Risks:** with `c5_married_mahaut` under Queen Mahaut, the heir swears to their stepmother.

### Under a player king (the Crowned opening, free frame)
The author asked that every plot path also make sense where the house wears the crown (`realm.sovereign == self`). The beat sheets above are for the Founder opening; the Crowned opening's prologue is its own (Layer 2). These are the rules the Crowned writing pass must keep:

| Plot path | Under a player king |
|---|---|
| Thibaut's death and the election (P8, L3-5) | Does not happen as an election. Thibaut was never king. If Knight of Adalia sheltered him (`c4_sheltered_brese`), he is the house's own great vassal, and he still dies in the saddle at Martinmas 52 (the epilogue says only that he reigns eleven years when he is king). His death opens a Brésy wardship for the crown to give. |
| Mahaut | Duchess of Armance, or the founder's queen (`c5_married_mahaut`: "crowned beside you"). As queen, she is the widow-to-be, and Jehanne is the founder's daughter: a princess. |
| The law fight (Act II) | The Estates write the law of the crown's own succession, so the house's vote is the crown's will, and the Estates can defy it. Male preference puts the founder's eldest son before Jehanne. The male line does the same, and also shuts out the founder's daughters for ever. |
| Mahaut's death (about year 73) | As queen dowager or Duchess: the duchy of Armance passes to Jehanne, and the crown does not, so the test is whether the Armance stays with the crown. |
| Penhoët | Claims the Armance, and with it the crown's own right in the Armance, by the male line. It is a rebel's claim, not a suitor's. |
| The handover (P10) | The crowning of the heir in the founder's lifetime (`c5r_heir_crowned` may have done it already). The oath (P16) is the Estates' acclamation, not homage. |
| The Kingmaker, `c5_crowned_self` | Knight of Adalia says the founder "sets the crown on the head of Mahaut, or a younger man". That opening starts with someone else wearing it, and the founder as the hand behind the throne. |

### Continuity findings from Knight of Adalia's epilogue
These are not yet in `PLAN.md` §8. The beat sheets above honour all of them:

| Knight of Adalia says | What the House must do |
|---|---|
| The founder's wife "outlives you by eleven years" | The widow dies eleven years after the founder (about year 65, in the Second Mottle, if he dies in 54) |
| `c5_betrothed_penhoet`: the second child "marries into Penhoët at sixteen, and runs that old house better than any Penhoët has" | Already married into Penhoët in year 50 (P6), and in time the real power at Penhoët |
| `c5_betrothal_refused`: the second child "chooses, at nineteen, someone you would never have chosen" | A love match in the prologue, at about year 52 (P6 variant) |
| Davy Ludd, Will Cobb and Wat Coker's deaths | As the epilogue says (P2) |
| `c5_thibaut_king`: "Thibaut reigns eleven years and dies in the saddle" | Thibaut dies at Martinmas of year 52, and the Estates choose his successor (P8; L3-1) |
| Kingmaker, `c5_mahaut_queen`: "Queen Mahaut reigns thirty-one years" | Mahaut dies about year 73, at 54, in every run (L3-2). Act IV's free crisis opens then. |
| Mahaut, not married to the founder: "marries, in the end, a lord of the Armance, whom she chooses herself" | Sire Riwal de Kerguen, Sire Alain's younger brother. Married in year 42 or 43, killed at the Pont-aux-Moines in 44, the year Jehanne is born (L3-3). Jehanne is Tanguy de Kerguen's cousin. |
| Founder ending: the house holds for "four kings and two plagues and a civil war" | The Second Mottle is one of the plagues; the civil war is Book III's war of cousins |

---


## Layer 3: Beat sheets, round 2: Book I, Act I, *The New Lord* (approved 2026-10-07)

**Years:** 55-58. **Strands:** family and rival.

**Scope:** the Founder opening, in the free and Adalian frames, read the same way as the prologue. "You" is the Keeper. The founder is "your father", or {father.name}.

**The free sovereign from here** depends on the prologue:
- Queen Mahaut;
- the free duchy;
- or, in Thibaut runs, whoever the Estates chose: Queen Mahaut, or Thibaut's son under a Brésy regency. The boy is King Gaucelin, 9 in year 53, named for his grandfather the Constable (L3-8). He comes of age at 16, about year 60, in the middle of Act II, and can turn on his regents. He needs a sovereign entry, `thibaut_heir` (content).

**What it reads from the prologue:**
- `counter.shadow`, `counter.household`, `counter.favour`, `counter.penhoet`;
- the flags `h_suit_*`, `h_penhoet_match`, `h_law_*`, `h_patent_*`, `h_will_secret`, `h_will_conditions`, `h_oath_*`, `h_companion_counsel`;
- the handover's manner, and whether the founder is in the cloister.

**Scene count:** 11 scenes and 2 pool draws.

**B1. The Homage of the Knights** (summer, year 55).
- **Beats:**
  1. The knights who held of the founder come to renew their homage to the Keeper, one by one, in the hall.
  2. They come from Knight of Adalia's `lands.vassals`, or are generated for a fresh start.
  3. One of them withholds. If Sir Yvon de Penhoët of Kerlan holds of the house, it is him: he is Hervé's cousin, and he asks which lord he serves when the two fall out.
- **Choices:**
  - Take the homage on the founder's terms: `counter.shadow +1`, and the knights stay content.
  - Take it on new terms (heavier service, lighter dues, or the reverse): `counter.shadow -1`. The terms are read at Michaelmas.
  - With the one who withholds:
    - release him from his homage: he holds of nobody, and `counter.penhoet +1`;
    - or hold him to it, with a check. On a failure, he is Penhoët's man in your own lands.
- **Check:** presence + command, medium. The founder's knights count the household's loyalty, so the check is easier with high `counter.household`.
- **Reads / sets:** `lands.vassals` as the house's own vassals **[5]**; until then, flags per knight.
- **Variants:**
  - Adalian: the homage is taken "saving the faith owed to the King".
  - Free: "saving the faith owed to {realm.sovereign}".
- **Risks:**
  - A vassal who died in Knight of Adalia's run is not here. His heir comes instead, under age or of age.

**B2. The Sovereign's Question** (autumn, year 55).
- **Free:**
  1. A herald from Lannec asks every great house where it stands, before the Estates meet to write the law.
  2. Under Queen Mahaut, it is her own heir's cause. Under Thibaut's son, the Brésy regents want the male line.
  3. The house answers in writing, and the answer is filed.
- **Adalian:**
  1. A new King's governor arrives at Lannec.
  2. The founder's patent is read again by a new set of lawyers.
  3. What the founder did in P8 comes back:
     - defended: the governor is cold;
     - conceded: the clause is already gone, and he wants another;
     - bought: the question is found again, and the bribe with it, `counter.favour -2`.
- **Choices:**
  - Free:
    - stand where the founder stood (`h_law_*`): `counter.shadow +1`;
    - take your own stance: `counter.shadow -1`, and the side the founder chose remembers;
    - delay: neither side trusts the house, and both court it in Act II.
  - Adalian:
    - concede to the governor: `counter.favour +1`, and the West's regard falls;
    - stand on the patent: `counter.favour -1`, `flag.h_patent_stood`;
    - write to Wendmere over the governor's head: a check.
- **Check (Adalian, the letter):** wits + diplomacy, hard. It is easier with `c4_met_edwin` or `c5_earl`.
- **Sets:** the house's stance, carried into Act II's threshold.

**B3. The Keeper's Match** (winter, years 55-56). Skipped if the Keeper is already married, for example under `c5r_peace_marriage` (married into Sauvel). Then B4 is that marriage's first year.
- **Beats:** the offers come. The Keeper is about 25.
- **The candidates:**
  - **Kerguen:** Azenor de Kerguen, Tanguy's sister, 20 in year 55 (L3-9). If the founder married Blanche de Kerguen, she is the Keeper's stepsister: no blood, but the Bishop's dispensation is asked for anyway, to be safe.
  - **Mahaut's court:** a lady, or for a Keeper who is a woman a lord, of Mahaut's household. It binds the house to the Armance and to the law of women.
  - **An Adalian house** (Hale, Carrow's kin, Ashdown): coin and the King's ear.
  - **A love match:** someone of no great house. `counter.household +1`, and every great house is offended.
- **Choices:** one of the four, or put it off (the offers come again, worse). Each sets an alliance: a house's temper floor, and a promise to send men **[5: matches]**.
- **Reads / sets:** `marry: { who: head, to, culture }` (built). **[5]:** matches with a named house.
- **Variants:**
  - A Keeper who is a woman marries a husband who expects to rule her house. That tension is written into B4.
- **Risks:** affinity words (stepsister, "sister-in-law"), and the dispensation from Saint-Lys.

**B4. The Wedding** (spring, year 56).
- **Beats:**
  1. The feast, and the whole house in one hall.
  2. Who comes and who does not: Hervé de Penhoët, Mahaut's envoy, the governor (Adalian) or the herald (free).
  3. A quarrel at the high table, carried by the second child or the widow.
- **Choices:**
  - Seat Hervé high: `counter.penhoet +1`. The old knights mutter.
  - Seat him by his rank and no higher: nothing changes.
  - Do not invite him: `counter.penhoet -1`, and the snub is spoken of.
- **Check:** none. **Reads:** B3, `h_penhoet_match` (the second child may come as a Penhoët).
- **Risks:** the widow's place at table. She is the dowager, not "your mother" if she is the founder's second wife.

**B5. Pool draw** (year 56). From Act I's pool:
- a rival's border quarrel;
- an indebted house's daughter;
- the free company on the road;
- the widow's dower suit, which is the founder's widow claiming her third.

**B6. The Suit Judged** (Whitsun or summer, year 56). Only if the suit is still open: not bought off, and not settled by the match.
- **Beats:**
  1. Kerval before the court:
     - free: the crown's court at Lannec, or the Duchess's council;
     - Adalian: the King's governor at Lannec, or the King's justices on eyre.
  2. The charter, the witnesses, and the old men's memories of who held the mill.
  3. The verdict.
- **The outcome is mostly fixed** (L3-10, decided), read from the prologue:
  - `h_suit_strong`: Kerval is kept whole.
  - `h_suit_weak`: Kerval is lost to Penhoët.
  - Otherwise, it is **shared**: the house keeps the manor, and Penhoët takes the wood and the mill. That is the likely outcome.
  - A check in court can move the verdict one step.
- **Choices:**
  - Argue it yourself: a check.
  - Hire a Lannec pleader: coin, and an easier check.
  - Settle on the steps before the verdict: a share on your terms, and `counter.penhoet +1`.
- **Check:** wits + stewardship, hard. P13's ride-out makes it harder (`counter.penhoet` low), and P13's court choice makes it easier.
- **Sets:** `flag.h_kerval_kept`, `h_kerval_shared` or `h_kerval_lost`, and the holding's income **[5: holdings]**.
- **Risks:** Kerval's name must match the import, as in P4.

**B7. The Second Child's Grievance** (autumn, year 56).
- **Beats:**
  1. The second child, about 23, wants land and a life.
  2. Under `h_will_secret`, they have found out that the Keeper changed the will.
  3. Under `h_penhoet_match`, they come from Penhoët, and speak with Hervé's patience.
- **Choices:**
  - Give a manor: the Keeper's share shrinks, and their loyalty rises.
  - Give coin, and a promise: their loyalty holds for now.
  - Give nothing: their loyalty falls, and Penhoët notices.
  - Under `h_will_secret`, confess and make it good: `counter.shadow -1`, and their loyalty is restored. Deny it: their loyalty falls sharply.
- **Check:** presence + diplomacy, medium, to make a lesser gift land well.
- **Sets:** the second child's allegiance, as a counter (`counter.second`) until rival state is built **[5]**.

**B8. The Second Child's Match** (winter, years 56-57). This is Book I's hinge (Layer 1).
- **Beats:**
  1. If the second child is unmarried, the offers are:
     - Penhoët: Ronan, or Hervé's daughter;
     - Kerguen: Tanguy himself, about 26;
     - elsewhere: an Adalian house, Sarenza, or the Church.
  2. If they are already married into Penhoët, the scene is a visit home. Penhoët asks them to carry its claim, and the Keeper asks them to carry the house's.
- **Choices:**
  - **Into Penhoët:** the second child's grandchildren could carry Penhoët's claim if the law changes in Act II. `counter.penhoet +2`, and Penhoët is half-family.
  - **Into Kerguen:** the counterweight is bound to the house. `counter.penhoet -1`, and Kerguen is an ally.
  - **Elsewhere or the Church:** coin or a bishopric's friend. The second child's loyalty depends on whether they chose it.
  - **Let them choose:** their loyalty rises, and the match is drawn from their temperament.
  - **If already married into Penhoët:** ask them to work for the house inside Penhoët (`flag.h_second_inside`), or let them be Penhoët's.
- **Check:** none. The choice is the point.
- **Sets:** `marry` (built), the second child's allegiance, and `flag.h_second_penhoet`, `h_second_kerguen` or `h_second_elsewhere`.

**B9. The Letter from the Abbot** (spring, year 57). Cloister runs only.
- **Beats:**
  1. The founder's letters have come all through the act. Each B scene has a line from one: advice, a rebuke, a joke.
  2. Then a letter comes in another hand.
  3. The funeral and the chronicle, moved here from P15.
- **Choices:** P15's choices (where he lies, and what the stone says), plus whether to read his last letter aloud in the hall: `counter.household +1`, or `counter.shadow +1`.
- **Sets:** `death: { who: father }`, which is scripted.

**B10. The Old Knights or New Men** (summer, year 57).
- **Beats:**
  1. The founder's knights are old. The Keeper needs men who are the Keeper's.
  2. The Old Companion, if living, is the voice of the old order.
- **Choices:**
  - Keep the old knights in their places: `counter.shadow +1`, `counter.household +1`. The house is slower to change.
  - Raise new men (younger sons, or a free company's captain): `counter.shadow -2`, `counter.household -1`. The old knights' loyalty is tested in Act II.
  - Pension the old knights off with honour: costs coin, and `counter.shadow -1`, with no loss of loyalty.
- **Check:** none.
- **Sets:** the household's makeup **[5: retainers]**; until then, `flag.h_new_men` or `h_old_knights`.

**B11. Pool draw** (year 57).

**B12. Before the Estates** (Lady Day, year 58). The act ends here, on two offers and no answer (L3-11, decided).
- **Free:**
  1. The Estates of the West are summoned for Whitsun to write the law.
  2. Mahaut's people and Penhoët's both come to the house before the summons is a week old.
  3. Each asks for the house's vote, and each offers something.
- **Adalian:**
  1. The King's justices will hear the West's liberties at Lannec.
  2. The governor wants the house to speak for the King's wardship of Mahaut's daughter.
  3. Mahaut wants it to speak for her right.
- **Choices:** none yet. The act ends on the two offers. The chapter card shows what the house has, and who it has made:
  - the Keeper's spouse;
  - the second child's house;
  - Kerval kept, shared or lost;
  - the shadow.
- **Sets:** Act II begins.

**Openings at Act I** (Layer 2): Exile and Ruin converge here. Exile has its return and a manor given back under the pardon. Ruin has a holding won by service, a B1 analogue in which the Keeper gives homage rather than taking it.

**Under a player king:**
- B1's homage is to the crown.
- B2 is the Estates' own question to the crown: will the crown let the Estates write its succession?
- B12 is the crown's summons, not a request for the house's vote.

---

## Layer 3: Beat sheets, round 3: Book I, Act II, *The Law* (approved 2026-10-07)

**Years:** 58-63. **Strand:** the realm.

**Scope:** the Founder opening, in the free frame (under Queen Mahaut, the free duchy, or King Gaucelin) and the Adalian frame.

**What it reads from Act I:**
- the house's stance (B2);
- the Keeper's spouse's house (B3);
- the second child's house (B8);
- Kerval kept, shared or lost (B6);
- the four counters (shadow, household, favour, Penhoët).

**The law is mostly fixed** (L2-2). The likely outcomes by frame:
- free: male preference passes, and Jehanne is Mahaut's heir;
- Adalian: King Edwin wins Jehanne's wardship;
- under King Gaucelin: the male line passes, unless the house helps Gaucelin turn on his regents at his majority (C6), and then male preference passes (L3-12).

The likely outcome stands unless a **threshold** is met: votes, standing, men and the sovereign's need, added up. The house can never meet it alone: it always needs an ally, meaning the spouse's house, the second child's house or Kerguen (L3-13). The threshold's arithmetic is step 5's to design. These scenes say only what feeds it, marked **(T)**.

**Scene count:** 11 scenes and 2 pool draws. A queued **upbringing** scene also fires whenever a child of the Keeper turns seven (`upbringing`, built). In most runs that falls in Act III, and in some it falls here.

**C1. The Two Offers** (Lady Day, year 58). This answers B12.
- **Beats:**
  1. Mahaut's envoy and Hervé de Penhoët, a week apart, in the Keeper's hall.
  2. Each offer is shaped by Act I.
  3. **Mahaut** offers an office, or a wardship of her own to give, or her favour for the second child.
  4. **Penhoët** offers to end the Kerval quarrel for good (the wood and the mill given back, if shared or lost), or a match.
- **Choices:**
  - Take Mahaut's: `flag.h_law_women`, and (T) +.
  - Take Penhoët's: `flag.h_law_male`, and (T) for the male line.
  - Take neither, and keep the house's vote its own: `flag.h_law_own`. Both sides go on courting.
  - Take both, and play them off: a check each year to keep it hidden. If found out, `counter.penhoet -3` and Mahaut's regard -3, and the house's word is worth less in every later check.
- **Check:** wits + diplomacy, hard, at C5 and C9 if both were taken.
- **Reads:** B2's stance, B3, B8, and the Kerval flags.

**C2. The Estates Open / The Hearing Opens** (Whitsun, year 58).
- **Free:**
  1. The Estates of the West at Lannec, in the hall where the founder spoke (P8): the lords, the Church and the towns.
  2. The new Bishop of Saint-Lys gives the opening Mass, and lets it be known which law the Church can bless.
  3. Who sits where says who has the votes.
- **Adalian:**
  1. The King's justices sit at Lannec.
  2. Edwin's serjeant argues that a girl of fourteen with a duchy is the King's ward by Adalian law.
  3. Mahaut's pleader argues the West's liberties, which are in the founder's patent if `c5_liberties`.
- **Choices:**
  - Speak on the first day: (T) +, and the house's stance is public.
  - Watch and count: `flag.h_counted`. Later checks are easier, the way Knight of Adalia's `c4_counted_council` was.
  - Work the corridors, at a cost in coin: (T) +, quietly.
- **Check:** presence + diplomacy (speak), or wits + courtesy (corridors), medium.
- **Risks:**
  - The Moot is the Adalian assembly, but this is the King's justices, not the Moot.
  - "Estates of the West" appears in the free frame only.

**C3. The Price** (autumn, year 58).
- **Beats:** the side the house did not take makes its own offer, and it is not polite. One of three, by state:
  - **a bribe:** coin, or Kerval's title confirmed;
  - **a threat:** a debt called in, a suit revived, or the second child's position at Penhoët made difficult;
  - **a marriage** for a child of the Keeper, or for the widow.
- **Choices:**
  - Take it, and change sides: the first side's temper falls, and (T) moves.
  - Refuse it: the threat is carried out, and the house holds.
  - Pretend to take it: the same as taking both offers in C1.
- **Check:** none, unless the threat is fought: then by the threat's own skill.
- **Reads / sets:** `counter.penhoet` and Mahaut's regard. If the threat is carried out against the second child, `counter.second`.

**C4. Pool draw** (year 59): a pilgrim's relic, a bad harvest, or the bookish child and the tutor.

**C5. The Count** (winter, years 59-60).
- **Beats:**
  1. Before the vote (free) or the ruling (Adalian), the house's clerk lays out who stands where.
  2. The threshold is made visible in prose: "Penhoët needs eleven more voices, and you are three of them."
- **Choices:**
  - Spend for the side you are on: coin, favours (built: favours), and the house's men. (T) +.
  - Bring an ally over (L3-13: required to overturn): the spouse's house, the second child's house, or Kerguen. It is a check, and it costs that ally's goodwill later.
  - Hold back what you have: (T) unchanged, and the house keeps its coin.
- **Check:** presence + diplomacy, hard, to bring an ally over.
- **Sets:** (T). If both offers were taken in C1, the first concealment check is made here.

**C6. The King Comes of Age** (summer, year 60). Free, under King Gaucelin only.
- **Beats:**
  1. Gaucelin, 16, is of age.
  2. He has to decide whether he is his regents' king or his own.
  3. The Brésy regents want the male line, because it is his own claim's law.
- **Choices:**
  - Back the regents: (T) for the male line, and the crown's favour.
  - Back the boy against them: a check. On success, Gaucelin turns on his regents, and the crown no longer pushes the male line (L3-12).
  - Keep out of it: neither side forgives it.
- **Check:** presence + courtesy, hard.

  In other free runs this slot is a pool draw.

**C7. The March Burns** (year 61).
- **Beats:**
  1. Caldmoor's regency war spills over the March.
  2. The free companies, paid off after the last war, are on the West's roads.
  3. **Adalian:** the King needs the West's men, and that need is the house's leverage over the wardship.
  4. **Free:** the Estates need a war levy, and votes on the law are traded for it.
- **Choices:**
  - Send men: costs men and coin. (T) + with the sovereign, and `counter.favour +2`.
  - Hire the free company to guard your own lands: coin, and safety, but the company has opinions.
  - Do nothing: your own valleys are raided (the pool's free company comes in), and (T) is unchanged.
- **Check:** command + tactics, medium, if the house's own men fight.
- **Risks:**
  - `c5r_peace_bought` and `c5r_peace_marriage` forbid war with Valdrenne. This fight is Caldmoor's, and the free companies', only.

**C8. Pool draw** (year 61).

**C9. The Vote / The Ruling** (Whitsun, year 62).
- **Beats:**
  1. The day.
  2. The house's last word, spoken or not.
  3. The count, or the justices' ruling.
  4. **The outcome:** the likely one, unless (T) is met.
- **Free outcomes:**
  - male preference: Jehanne is heir;
  - or the male line: Penhoët's claim to the Armance rises over hers, and the house's own daughters cannot inherit if the house follows the realm.
- **Adalian outcomes:**
  - the King's wardship: Jehanne goes to Wendmere, and her marriage is the King's to sell;
  - or Mahaut's right: Jehanne stays, and the West's liberties are confirmed in law.
- **Choices:**
  - The last word: for, against, or silence.
  - Under C1's double game: the last concealment check.
- **Check:** presence + diplomacy, hard. It is the house's final (T) push.
- **Sets:** the realm's law, which is new state **[5]**. Until then, `flag.h_realm_male_pref`, `h_realm_male_line`, `h_wardship_king` or `h_wardship_mahaut`.

**C10. The Reckoning of the Law** (autumn, year 62).
- **Beats:**
  1. The winners reward, and the losers remember.
  2. Penhoët is raised (male line, or the King's wardship with Penhoët as the King's man) or checked.
  3. Mahaut is secure, or diminished.
- **Choices:**
  - Make peace with the losing side: costs coin or a concession, and their temper is partly restored.
  - Press the advantage, if the house is on the winning side: land, an office, or a wardship. The losers' temper falls further.
  - Under the King's wardship (Adalian), bid for Jehanne's marriage (L3-14): for the Keeper's son, the second child, or a cousin. It is costly. Penhoët and Adalian houses bid against the house, and Mahaut's view of whoever buys her daughter depends on her regard for them. If it is won, the duchy of Armance can come into the house by marriage, which is a hook for Acts III-IV and Book II.
- **Sets:** `counter.penhoet`, Mahaut's regard, and possibly `marry` for a house member to Jehanne, as a betrothal until she is of age. **[5]:** bidding for a wardship.

**C11. The House's Own Law** (spring, year 63). The act ends here, on the house's law and then the rumour of plague (L3-15, decided).
- **Beats:**
  1. The Keeper, the spouse and the Keeper's children at table.
  2. Whether the house's own succession follows the realm's new law.
  3. A ship's master at the Keeper's table mentions, in passing, a sickness in Sarenza that takes the children first.
- **Choices:**
  - Keep male preference: no change, or `house_law: male_preference`.
  - Adopt the male line: `house_law: male_line`. The Keeper's daughters cannot inherit, and Penhoët approves.
  - Name the heir by will: `designate`. It is contested if it is against the law (built).
  - Divide the lands among the sons: `house_law: partible`.
- **Check:** none.
- **Sets:** `house_law` (built), and the Act II chapter card.
- **Under `c5_married_mahaut`:** the house's daughters include Jehanne, so the house's own law decides whether Mahaut's daughter is also the house's heir.

**Under a player king:**
- The Estates are writing the crown's own succession.
- The crown proposes, and the Estates can defy it. The threshold runs the other way: the crown's law stands unless enough of the Estates refuse it.
- C11 is the same choice as C9.
- Penhoët's male-line claim to the Armance is rebellion, and C10's "press the advantage" can be an attainder.

---

## Layer 3: Beat sheets, round 4: Book I, Act III, *The Children's Mortality* (approved 2026-10-08)

**Years:** 63-66. **Strand:** family.

**The Second Mottle** runs from 63 to 65 (canon). While the `plague` and `plague_children` flags are set (built), the life odds kill more, and children most of all. How hard it hits (L3-18, decided):
- The plague odds are raised enough that most runs lose a child of the house.
- Every run loses at least one named member of the extended family by script: a cousin, a nephew, or the Old Companion's son.
- This is the extinction target's main lever: 15-25% by year 102, against 0% from the odds alone.

**What it reads from Act II:**
- the realm's law, or who holds the wardship;
- the house's own law;
- Penhoët's standing;
- Mahaut's regard;
- any betrothal to Jehanne.

**Scene count:** 11 scenes and 1 pool draw. Most of the act's deaths come through the queued news scene (`h_q_news`, built), framed by the scenes below.

**D1. The Sickness Comes** (summer, year 63).
- **Beats:**
  1. The ship's master's rumour (C11) is true.
  2. The first deaths are in the port, then in Lannec.
  3. A rider brings word that the sickness is a day's ride off. Knight of Adalia's Chapter 3 asked the same question: stay or go.
- **Choices:**
  - Shut the gates of the hall and the village: the family's risk falls, the village's temper falls, and the free companies find the roads empty.
  - Stay with the people, opening the hall to the sick: the village's temper rises sharply, and the family's risk rises.
  - Flee to the hills with the children: the family's risk falls most. The village's temper falls hard, and the household calls it the founder's son running.
- **Check:** none. **Sets:** `flag.plague`, `plague_children` (built), and `flag.h_mottle_shut`, `h_mottle_stayed` or `h_mottle_fled`.
- **[5]:** the response changes the family's odds while the flags are set.
- **Risks:** "the Mottle" is the West's name for it, and canon calls it the children's mortality. The first Mottle was in Knight of Adalia's year 1.

**D2. The Sealed Village** (autumn, year 63).
- **Beats:** one of the house's own villages has the sickness. The reeve asks whether to seal it: nobody in, nobody out.
- **Choices:**
  - Seal it, and send food to the boundary stone: costs coin, and the village is half-saved.
  - Seal it, and send nothing: no cost, and the village's temper is lost for a generation.
  - Leave it open: the sickness spreads to the next village, and the hall's risk rises.
- **Check:** none. **Sets:** holding temper **[5: holdings]**.

**D3. The Stone in the Chancel** (framed news, any season, years 63-65).
- **Beats:**
  1. When the odds take a child of the house, the news scene (`h_q_news`) is followed by this one.
  2. The burial, the mother and the father, and the priest who has said the words too many times this year.
  3. Knight of Adalia's epilogue promised that a dead child is "remembered on a stone in the chancel, every year, on the day".
- **Choices:**
  - A stone in the chancel, with the child's name: coin.
  - A vow: a pilgrimage, a chapel, or a child given to the Church if the next one lives. `flag.h_vow`, read in Act IV.
  - Nothing but the grave: the spouse's regard falls, if the spouse is the parent.
- **Check:** none.
- **Risks:**
  - The dead stay dead.
  - Kinship words must change after the death: "your eldest" now means the next child.

**D4. The Crown in the Plague** (spring, year 64).
- **Adalian (L3-16):**
  1. Edwin of Adalia dies at 52. His son, Prince Aymer, died in year 61 of a fever after the Caldmoor war on the March (C7). His grandson **Aldred III**, aged 9, is king.
  2. A regency council governs at Wendmere.
  3. The new reign asks every lord for homage by proxy, because nobody will ride through the plague.
  4. Choices:
     - Swear by proxy at once: `counter.favour +1`.
     - Ask that the founder's patent be confirmed first: a check. The liberties are confirmed, or the council marks the house as difficult.
     - Send a son or a knight to Wendmere to stand for the house: the council knows him, and the plague is in Wendmere.
- **Free:**
  1. The crown (or the Duchess) is shut in Lannec, and the Estates do not meet.
  2. Mahaut sends for nobody, and the West is governed by whoever holds its valleys.
  3. Choices:
     - Govern your own country: justice, a market and the roads. `counter.household +1`, and the crown notes it either way.
     - Send help to Lannec: coin and men. Mahaut's regard +2.
     - Keep everything at home.
- **Check:** wits + diplomacy, hard (the patent, Adalian).
- **Risks:**
  - "King's governor at Lannec" belongs to the Adalian frame only.
  - The child king is "the King". Edwin is now "the late King".

**D5. Penhoët in Mourning** (autumn, year 64).
- **Beats:** the Mottle takes Ronan de Penhoët, about 30 (L3-17). Hervé, about 59, survives him, broken, and Penhoët's heir is Ronan's child, a minor. If the second child married Ronan, that child is the Keeper's blood, and the second child is the natural power at Penhoët (Knight of Adalia: "runs that old house better than any Penhoët has"). Hervé, alone and dangerous, goes into Act IV.
  1. Black on Penhoët's gate.
  2. Who died, and who now holds Penhoët.
  3. If the second child married into Penhoët, it is their house in mourning, and their letter brings the news.
- **Choices:** what the house sends:
  - condolence and a Mass: `counter.penhoet +1`;
  - nothing: no change;
  - a man to count Penhoët's strength: `flag.h_counted_penhoet`, which makes D6 easier.
- **Check:** none.

**D6. Succour or Strike** (winter, years 64-65).
- **Beats:**
  1. Penhoët is weak, and its men are dead or sick.
  2. Its boundary at Kerval is unwatched.
  3. The old knights, if they are kept (B10), say what the founder would have done.
- **Choices:**
  - Succour Penhoët with grain and men to bring in its harvest: `counter.penhoet` reset to friendly, and a debt owed to the house. `flag.h_succoured`.
  - Strike: take back the wood and the mill, or more. Land, and `counter.penhoet` to its floor: a feud for a generation. `flag.h_struck`.
  - Leave it: no change, and Penhoët recovers.
  - Under `h_second_penhoet`: help your sibling hold Penhoët. They hold it, and their loyalty and allegiance are fixed toward the house.
- **Check:** command + tactics, medium (strike), or presence + diplomacy (succour, so that pride lets Penhoët accept it).
- **Risks:**
  - Under `c5r_peace_*`, a strike is a private war between houses, not a war with Valdrenne.
  - Penhoët cannot be broken here. That waits for Act IV (L2-3).

**D7. The Free Company** (spring, year 65).
- **Beats:**
  1. Men paid off after the March war (C7), on the roads in the plague.
  2. A captain at the gate offers protection, at a price.
  3. If the house hired a free company in C7, it is this company, and it remembers the pay.
- **Choices:**
  - Pay it: coin, and the valley is safe for the year.
  - Fight it: a battle, with the house's men.
  - Hire it against someone else (Penhoët, if the house struck): the feud is worse, and the house is feared.
- **Check:** command + tactics, hard (fight).

**D8. The Widow** (summer, year 65). Only if the founder died in year 54. In cloister runs this scene moves to year 68, in Act IV.
- **Beats:**
  1. The founder's widow dies, eleven years after him, as Knight of Adalia's epilogue says. It is scripted.
  2. Her last days, with the Keeper. She is the one person who knew the founder from the inside.
  3. She tells one thing about the founder that the Keeper never knew. It is drawn from the import: the wife's own moments, the dead child, the debt, the confession.
- **Choices:**
  - Ask her about him: `counter.shadow -1`. The Keeper sees the man, not the legend.
  - Ask her nothing, and hold her hand: `heir.bond`'s analogue, the spouse's regard.
  - If she is not the Keeper's mother: settle her dower with her own kin generously (coin, and her kin's goodwill), or by the letter of it.
- **Sets:** `death: { who: <widow> }` (scripted), and the dower's return **[5: dower lands]**.
- **Risks:**
  - She is "your mother" only if she is.
  - Knight of Adalia's `{wife.epilogue}` line ("and never once in all those years lets a lady at any table forget...") must be honoured. This scene is where it shows.

**D9. Pool draw** (year 65): the friar, the mass grave, or the orphaned cousin.

**D10. The Count of the Dead** (spring, year 66).
- **Beats:**
  1. The sickness lifts.
  2. The steward's roll of who is left: the household, the villages and the family.
  3. The orphaned cousin at the gate (if not drawn in D9).
- **Choices:**
  - Take the cousin in: a new member of the house (a ward), and a mouth to feed.
  - Send them to the Church: the Church's favour.
  - Find them a place with a client house: coin, and a dependant's loyalty.
- **Check:** none. **Sets:** characters (built). Clear `plague` and `plague_children`.

**D11. The Keeper's Will** (summer, year 66). The act ends here, on the will (L3-19, decided).
- **Beats:**
  1. The Keeper, about 36, has buried children, perhaps a parent and perhaps a spouse.
  2. With the priest and the steward, the Keeper writes the will the founder once wrote.
- **Choices:**
  - Name the heir: `designate`, against the law if need be. It is contested (built).
  - Name a guardian in case of a minority: the spouse, the second child, the Old Companion's son, or the sovereign. **[5]:** a regent chosen by will.
  - Provide for the younger survivors: land, the Church, or a match. These are the same choices as P12, and the shadow is read here: does the Keeper write the founder's will again?
- **Check:** none.
- **Sets:** the Act III chapter card: the dead, the living, and the will.

**Under a player king:**
- D4 is the house's own crown shut in Lannec.
- D3's dead child may be a prince or princess, so the stone is in the cathedral.
- D11 is the crown's succession, and the Estates will read it.

---

## Layer 3: Beat sheets, round 5: Book I, Act IV, *The Test of the Law* (free) / *The Minority* (Adalian) (approved 2026-10-08)

**Years:** 66-78. **Strands:** the realm and the rival together, then the family at the Keeper's end.

**What it reads from Act III:**
- who survived the Mottle;
- Penhoët's new shape: Hervé, with Ronan's child as heir, and perhaps the second child holding it;
- whether the house succoured or struck;
- the Keeper's will and guardian;
- any vow.

**Fixed events in the act:**
- **free:** Mahaut dies about year 73;
- **Adalian:** Aldred III comes of age about year 71;
- the churchly child becomes Bishop of Saint-Lys about year 70, if there is one.

**Scene count:** 13 scenes and 2 pool draws.

**The Keeper's end is open** (L2-4). The odds can end the Keeper at any point in the act. The succession (built) then makes the heir the player for the rest of Book I, and the remaining scenes read `head`, not "the Keeper". If the Keeper is still alive in year 78, E13 always closes the headship (L3-23), by stepping down, the cloister, illness or a wound. A Keeper who steps down lives on into Book II as advisor or nuisance, as the cloistered founder did. Each book is one head's story.

**E1. The Crisis Opens** (spring, year 67).
- **Adalian:**
  1. Aldred III's regency council splits.
  2. On one side, Carrow's heirs and the Old Baronage; on the other, Wendmere's officers under the Hales.
  3. Each wants the West's great houses.
  4. Penhoët chooses first if the house waits.
- **Free:**
  1. Mahaut, 48, asks the house's counsel on Jehanne's marriage. Jehanne is 23, the greatest match in the West, and the law's test in waiting.
  2. The candidates:
     - a Sauvel (peace with Valdrenne);
     - an Adalian lord (Edwin's grandson's council would like it);
     - King Gaucelin himself, under Gaucelin, which would unite the crown and the duchy;
     - a lord of the Armance.
  3. Tanguy de Kerguen is Jehanne's first cousin, so not without a dispensation.
- **Choices:**
  - Adalian: speak to both parties, choose one, or say the house waits for the King's majority.
  - Free: counsel one candidate; regard follows the choice.
- **Check:** wits + diplomacy, medium.
- **Sets:**
  - Adalian: the house's party, `flag.h_party_carrow` or `h_party_hales`, or neither.
  - Free: Jehanne's husband (the house's counsel moves Mahaut's choice **[5]**).

**E2. The Side** (year 68).
- **Adalian:**
  1. The parties fight in council and then in the shires: an arrest, a seized castle, a murdered clerk.
  2. The house is asked to prove its side with men or coin.
- **Free:**
  1. Jehanne's wedding.
  2. At the feast, Hervé speaks to the Keeper alone. He does not threaten; he says what he will do when Mahaut is dead.
- **Choices:**
  - Adalian: send men, send coin, or keep your side in words only.
  - Free: warn Mahaut, keep Hervé's words to yourself (`flag.h_hervé_secret`), or answer him in kind.
- **Sets:** Adalian, the party's debt to the house **[5: favours]**.

**E3. The Widow, or a pool draw** (year 68).
- In cloister runs, the founder's widow dies (D8's scene, moved here).
- Otherwise a pool draw: the ransom owed, a heresy in the market, or the regent's letter.

**E4. Hervé's Last Move** (year 69).
- **Beats:** under cover of the crisis, Penhoët moves.
  - **Adalian:** Penhoët's party gives it a commission to keep the King's peace in the Armance. It uses the commission to take Kerval's wood and mill, or Kerval itself.
  - **Free:** Penhoët arms quietly for the day Mahaut dies, and buys the free companies. Under the male line (C9), it means to claim the Armance. Under male preference, it means to make the claim anyway.
  - **Under a player king:** it is rebellion.
- **Choices:** what the house does first:
  - arm too;
  - go to the sovereign;
  - go to Penhoët, through the second child if they are there;
  - wait.
- **Check:** wits + tactics, medium, to read Penhoët's intent truly.
- **Sets:** `flag.h_penhoet_moving`, and the house's first answer.

**E5. The Bishop** (year 70).
- **Beats:**
  1. If a child of the house was raised for the Church, the chapter of Saint-Lys elects them bishop: the first born in the West, as Knight of Adalia promised. Both kings want a say.
  2. If there is no churchly child, a pool draw.
- **Choices:**
  - Use the house's weight to secure it: (T) spent, and the house has a bishop in Book II.
  - Let the chapter decide.
- **Check:** presence + diplomacy, hard, against the sovereign's candidate.
- **Sets:** a bishop in the house **[5: the Church]**.

**E6. Kerval** (year 70 or 71).
- **Beats:** Penhoët's move comes to the field or the court. This is Book I's only fight of houses: a short campaign with the war system at small scale, a siege or a field at Kerval's bridge (L3-22). It tests the war system before Book II's great war (years 80-86), and the Keeper can be wounded, which feeds E13.
  1. Men at Kerval's bridge, or Penhoët's commission read at the gate.
  2. The Keeper's men, the old knights or the new (B10), and the free company (D7).
- **Choices:**
  - Fight: a short campaign of houses **[5: war]**, with the Keeper in the field or not.
  - Go to law and the sovereign: slow, and Kerval may be held while the court sits.
  - Treat through the second child or Penhoët's young heir's guardians: a reconciliation opens.
- **Check:** command + tactics, hard (fight), or wits + diplomacy (treat).
- **Sets:** Kerval's fate, and whether Penhoët can be broken in E8.
- **Risks:**
  - No war with Valdrenne (`c5r_peace_*`). Valdrennish men in Penhoët's pay are free companies, not the King's.

**E7. The King's Majority** (year 71). Adalian.
- **Beats:**
  1. Aldred III, 16, takes the government into his own hands.
  2. He keeps the Hales, Wendmere's officers who raised him, and punishes Carrow's heirs and the Old Baronage. That stands unless the house and an ally swing him (L3-21). Joining Carrow is the risky, high-reward path.
  3. The house learns which it is.
- **Choices:**
  - Kneel first: `counter.favour +2`, whatever the party.
  - Ask for the reward, if the house is on the winning side: an office, a wardship, or Penhoët's lands if it was attainted.
  - Ask for mercy, if on the losing side: costs coin, and saves the patent.
- **Check:** presence + courtesy, medium.
- **Sets:** `counter.favour` and the party's fate.

In free runs this slot is Mahaut's last illness: the court at Lannec knows, and the houses count.

**E8. Penhoët Settled** (year 72).
- **Beats:**
  1. Hervé dies at about 67 (L3-20, scripted, after E6), and with him the generation's quarrel.
  2. What Penhoët becomes depends on E6 and the house.
- **Choices:**
  - **Broken:** with the sovereign's leave, Penhoët is attainted and its lands taken. Its claim passes to the cadet, Sir Yvon of Kerlan, who returns in Book II (L2-3). It needs E6 won and `counter.favour` high.
  - **Reconciled:** a marriage between the Keeper's grandchild (or child) and Ronan's child. Under `h_second_penhoet`, it is the second child's grandchild, so the two houses are one blood.
  - **Contained:** a treaty, the boundary walked and sworn, and Kerval's mill shared.
- **Check:** none. The choice is gated by E6.
- **Sets:** Penhoët's state into Book II **[5: rival state]**; `flag.h_penhoet_broken`, `h_penhoet_reconciled` or `h_penhoet_contained`.

**E9. The Queen Is Dead / The Duchess Is Dead** (spring, year 73).
- **Beats:**
  1. Mahaut dies at 54. She has written to the founder's house every Christmas, and the last letter comes after her.
  2. Jehanne, 29, succeeds:
     - to the crown, if her mother was Queen;
     - to the duchy of Armance otherwise;
     - Adalian: to the duchy, under the King.
- **Choices:**
  - Ride to Lannec at once and kneel: Jehanne's regard +3.
  - Wait to see who else rides.
  - (Free, male line) Stand with Penhoët's claim, if Penhoët is not broken.
- **Check:** none.
- **Variants:**
  - **`c5_married_mahaut`:** she is the Keeper's stepmother, or mother. Jehanne is the Keeper's sister or half-sister, and the house's own law (C11) decides whether she is also the house's heir.
  - **Adalian, if the house bought Jehanne's marriage (C10):** a son or daughter of the house is Duke or Duchess of Armance by marriage.

**E10. The Test** (years 73-74). Free.
- **Beats:**
  1. The West decides whether it will have Jehanne.
  2. **Male preference:** the law says yes. Penhoët, if not broken, says no in arms, as a rebel.
  3. **Male line:** the law says no. The Armance goes to Penhoët's line, or to the nearest male of Mahaut's blood, unless Jehanne's party overturns it (the threshold again, with an ally).
  4. **Under Gaucelin's male line:** the duchy escheats to the crown, unless overturned.
- **Choices:**
  - Back Jehanne;
  - back the law against her;
  - hold back;
  - make the house the price of the settlement (land, an office, a match).
- **Check:** presence + command, hard, for the house's voice to carry at Lannec.
- **Sets:** who holds the Armance into Book II.

**Adalian E10: The New Reign's Bill** (year 74).
- **Beats:** Aldred III's first parliament (the Moot) taxes the West. The patent's liberties are read for the third time in thirty years.
- **Choices:** pay, protest by the patent, or bargain.
- **Sets:** the West's liberties into Book II.

**E11. Pool draw** (year 75): the old company's last man, if still living.

**E12. The Heir Comes of Age** (year 75 or 76).
- **Beats:**
  1. The Keeper's heir, the Builder of Book II, at about 18.
  2. One scene that shows who they are, shaped by their upbringing (the queued scene).
  3. The Keeper sees themself in them, or the founder, or neither.
- **Choices:**
  - Give the heir a manor: the same choice the founder made in P3, read against the shadow.
  - Send them to court.
  - Keep the reins.
- **Sets:** the Builder's bond, and the Keeper's own shadow on the Builder (`counter.shadow` passes on, halved **[5]**).

**E13. The Keeper's End** (years 76-78). The act ends here.
- **Beats:** shaped by the act (L2-4):
  - **a death in the crisis**, if the Keeper fought at Kerval or the Test and was wounded;
  - **an illness**, the founder's illness again;
  - **stepping down** for the heir: `step_down` (built), at home or into the cloister, as the founder could.
- **Choices:** the manner, as in P10, and the last words to the heir. These are the founder's question from P14, now asked by the Keeper.
- **Sets:**
  - the succession (built);
  - the Keeper's chronicle paragraph;
  - Book I's chapter card;
  - Book II, *The Builder*, begins in year 78.

**Under a player king:**
- E4 and E6 are a rebellion against the crown.
- E8's "broken" is an attainder for treason.
- E9-E10 decide whether the Armance stays with the crown, with Jehanne as the founder's daughter or the Duchess.
- E13's stepping down is an abdication, and the heir's crowning follows.

---

## Layer 3: The crowned path (the Crowned opening, married to Mahaut; decided 2026-10-08)

The author's own Knight of Adalia run ends as King of the West, married to Mahaut before the Estates in year 42, with no children before her. This path is written for that run. A crowned life without Mahaut keeps the framework scene for now.

**The shape:**
- **Prologue, first half (50-53), as the King:**
  - the court at Lannec, and the Old Company;
  - Jehanne at six;
  - **Quérec refuses to swear to a girl as heir**, shaped by his fate in Knight of Adalia;
  - the exchequer;
  - **Valdrenne's embassy** for Jehanne's hand (Prince Lothaire);
  - a pool draw;
  - the Estates asked to swear to Jehanne, or to write the eldest-child law;
  - the illness;
  - **the crowning**: Jehanne made junior queen at nine, by Bishop Évrard at a hundred and one.
- **Prologue, second half (53-55), as Jehanne, nine to eleven, under Mahaut's regency:**
  - the first council;
  - the regency council (Armance men, the old king's men, or half and half);
  - **Quérec's rising in the marsh**;
  - the old king's question (the deathbed question, asked in the garden);
  - Bishop Évrard's death and the new bishop;
  - the Estates' acclamation.
- **Book I, Act I (55-58), as Queen Jehanne, eleven to fourteen:**
  - the lords' homage, with **Hervé's homage "saving the right of my house in the Armance"**;
  - Penhoët's claim to the Armance by the male line, and the offer of Ronan;
  - the Queen's betrothal: Ronan, Lothaire, Tanguy, or no one;
  - the Easter court, and the old king's toast;
  - Quérec's end;
  - a younger brother or sister, if there is one;
  - the Queen and her mother;
  - the Queen's guard;
  - a pool draw;
  - **the Estates summoned to settle the crown's own succession**: Hervé offers his vote for the crown in exchange for the male line in the Armance.

| # | Decision | Decided |
|---|---|---|
| L3-24 | Knight of Adalia's "you reign nineteen years and die in your bed" | Kept. The handover in year 53 is the heir's crowning as junior king or queen. The old king lives at court, held from the odds, and dies in his bed about year 64. The deathbed moves to Act III. |
| L3-25 | Who is crowned | The eldest child, either sex, as Knight of Adalia's crowned ending promised. The Crowned opening starts under a new house law, `eldest`. |
| L3-26 | The author's family | No children before Mahaut. Jehanne, born 44, is the eldest. |
| L3-27 | Who is played from 53 | Jehanne, the child queen, under Mahaut's regency until sixteen (year 60) |
| L3-28 | Mahaut's other children | By the odds for years 45 to 49, always younger than Jehanne. More can be born in the prologue. |
| L3-29 | The prologue's rival | Quérec, defying a girl's crown: the old lord of Quérec, or his son Bertrand if Knight of Adalia exiled or beheaded him |
| L3-30 | Penhoët's quarrel in Act I | The Armance by the male line, against the Queen's inheritance from her mother. Hervé offers Ronan to unite the claim and the duchy. |
| L3-31 | The author's save left a son | The save decides: **Jehan**, five in year 50, is the heir and is played from 53 as the boy king. Canon's Jehanne is added only when the life left Mahaut no children. Every crowned scene reads the Keeper's sex: King or Queen, and the matches by sex (Ronan or Sibylle de Penhoët, Lothaire or Isabeau of Valdrenne, Tanguy or Maëlle de Kerguen). Penhoët's claim against a son is that his right comes through his mother, which the custom of the Armance never counted. |
| L3-32 | Knight of Adalia left the crown to the Estates (`c5r_estates_choose`) | Honoured: an elective crown. In 52 the King can ask the Estates to elect his child in his lifetime (harder, since he promised they would choose), to make the crown hereditary, or nothing. The Estates of 58 sit to decide whether the crown is theirs to give each time, or goes by blood. |
| L3-33 | The prologue's rival under an elective crown | Bertrand de Quérec (his father exiled in Knight of Adalia) defies the heir's crown in the name of the Estates' right to choose: THE WEST CHOOSES ITS KINGS. |

**Import rules for this path** (`games/house/src/game/import.ts`):
- Mahaut is thirty-one in year 50.
- A child born before year 43 is not given Mahaut as mother.
- Jehanne, born 44, is added only when the life left Mahaut no children (L3-31); otherwise the eldest of hers is the heir.
- The odds hold Mahaut to about year 73 (canon).
- The King's reign is dated from Knight of Adalia's (the author's save reads "year 2 of King David" in summer 50).
- An export from Knight of Adalia's first release, without `settlement` and `sovereign`, is read from `west` and `reigns`.
- A husband who has retired (the cloister, or the junior crown) fathers no more children.
- The manor-scale late pool events (Sir Josselin, the castle, the audit) do not draw on the crowned path; two crown-scale events do: the salt towns' charter, and a private letter from King Amaury.

---

## Layer 3: The crowned path, Act II, *The Law* (decided 2026-10-09)

Years 58-63 (920-925), written in `scenes/book1/40-crowned-law.yaml`. The Founder's Act II (C1-C11 above) is written in `scenes/book1/30-the-law.yaml`.

**The threshold**, for both paths (step 5's mechanism, built small for now). The house's work for its side is `counter.overturn`, and the allies it brings over are `counter.allies`. The likely outcome stands unless the house is on the other side, its cause reaches **six**, and **at least one ally** stands with it (L3-13). Scenes say how many voices are still needed (`{house.law_need}`).

| # | Decision | Decided |
|---|---|---|
| L3-34 | The Estates of 920, in an elective run | Likely: the young sovereign is confirmed **for life**, and the Estates keep the choice of the next one. The crown can overturn this to a **hereditary** crown (the eldest child) by making the case, spending, and bringing an ally (Kerguen, the Church, or Penhoët through the bargain). |
| L3-35 | Penhoët refused the Armance by the male line | **Waits for Mahaut's death** (about 935): it votes against the crown and gathers the Armance lords. An attainder is possible if Bertrand's letters are kept and read before the Estates. |
| L3-36 | The regency's end | At Michaelmas 923, by David's will. Mahaut **hands over** the seals if her respect for her child is high (a vote in council, the evening lessons); otherwise her council resists, and the seals are **taken** by a check, or by the old king's word, or the council is kept for a year. |
| L3-37 | Act II's war | **Bertrand de Quérec rises again** with the free companies paid off from Caldmoor's war, in the name of the Estates' right. The young sovereign's first command, or the constable's, or a charter. The realm is at war while it lasts (trade falls, the march is raided). |

**The beats** (K1-K11):
- **K1. The Estates sit** (Whitsun 920). Hervé's bargain: the Armance by the male line for Penhoët's voices. Take it (the case grows, and Penhoët is an ally; Mahaut is wounded), refuse it (Penhoët waits), or leave it to the Estates.
- **K2. The crown's case** (Michaelmas 920). Elective run: ask for a hereditary crown, ask only to be confirmed for life, or ask nothing. Otherwise: answer the male-line petition yourself or through Mahaut.
- **K3. The count** (winter 920). Revisitable: spend £150; bring Kerguen over; ask the Bishop of Saint-Lys; or let it stand.
- **K4.** A pool draw.
- **K5. The Estates decide** (Whitsun 922): for life, hereditary, or the eldest child's law confirmed; and the Armance's custom, if the bargain was taken.
- **K7. Bertrand rises** (summer 923): lead, send the constable, or treat (the Estates' right in a charter).
- **K6. Sixteen** (Michaelmas 923): the seals, handed over or taken.
- **K8. After the marsh** (winter 923): attaint Bertrand, pardon him and keep his letters, or leave him to the Estates.
- **K9.** A pool draw.
- **K10. Penhoët's patience** (Michaelmas 924): read the letters before the Estates (attainder; the claim passes to Sir Yvon of Kerlan), reconcile (a council seat), or watch.
- **K11. The crown's own house** (Easter 925): the house's law, and the ship's master's word of a sickness in Sarenza that takes the children first.

**For Act III (decided below, L3-39).** If the Keeper dies in Act II or later under an elective crown, the Estates should choose the successor rather than the house's law alone. The engine passes the headship by the house's law today.

## Layer 3: The crowned path, Act III, *The Children's Mortality* (decided 2026-10-09)

Years 63-66 (925-928), written in `scenes/book1/60-crowned-mottle.yaml`. The Founder's Act III (D1-D11 above) is written in `scenes/book1/50-the-mottle.yaml`, and both paths share the pool in `events/book1/pool-mottle.yaml`.

| # | Decision | Decided |
|---|---|---|
| L3-38 | The old king | **The Mottle takes him**, in the spring of 926. This overrides L3-24's "dies in his bed about year 64": he dies in the plague year instead, and the deathbed is played in M3. |
| L3-39 | Succession under an elective crown | **Open.** When the sovereign dies while the crown is for life only (`flag.h_crown_for_life`), the Estates choose, and they may choose outside the house. The heir can ask, buy the benches (£300), or stand aside. If the crown goes, the West passes to Tanguy de Kerguen, Hervé de Penhoët or Lothaire of Valdrenne by the house's standing with each, and the house is a great house again: the crown's holdings go, its own lands stay. |
| L3-40 | The sovereign's wedding | **Easter 925**, just before the Mottle. The match made in Act I (Kerguen or Valdrenne), or made now if none was. |
| L3-41 | Hervé after Ronan | **Grief hardens him.** If Ronan dies of the Mottle (he does if Jehanne married him), Hervé blames the crown that took his son's claim; `flag.h_herve_hardened` raises Penhoët's temper into Act IV. |

**The beats** (M1-M11):
- **M1. The wedding** (Easter 925): the Act I match, or Kerguen, Valdrenne, or not yet.
- **M2. The sickness comes** (summer 925): shut the palace and the gates, stay with the sick, or flee to the Armance hills. The answer sets the plague odds for the family (fled 0.6, shut 0.8, stayed 1.3).
- **M3. The old king** (spring 926): the Mottle takes David. Sit with him to the end (the risk of the sickness; his last word), or send the physicians and stay away.
- **M4. The crown in the plague** (summer 926): govern anyway, send the crown's grain and money to the towns, or keep behind the walls.
- **M5. Black on Penhoët's gate** (autumn 926): Ronan or Hervé's heirs die; condolence and a Mass, a man to count, or nothing.
- **M6. Succour or strike** (winter 926): bring in Penhoët's harvest, take the Armance forts it holds of the crown, or leave it.
- **M7. The company at the gate** (spring 927): pay a free company on, fight it, or hire it to sit outside Penhoët.
- **M8-M9.** Pool draws (the friar, the pit, the empty farms).
- **M10. The count of the dead** (spring 928): the plague ends; an orphan of the household is taken in, sent to the Church, or placed with a knight.
- **M11. The crown's will** (summer 928): the eldest, a guardian (the mother if living, else the constable), or provision for the younger ones.
- **The Estates choose** (whenever the sovereign dies under a crown for life): ask, buy, or stand aside; then **the crown goes** if the vote is lost (kneel at the crowning, or go home).

**Tuning (the bot, 420 runs).** A child dies in 54% of runs with young children; the house ends in about 2% of runs in Act III. Village deaths in the plague years are 8% a year, halved by a granary.

## Layer 3: The crowned path, Act IV, *The Test of the Law* (decided 2026-10-09)

Years 66-78 (928-940), written in `scenes/book1/80-crowned-test.yaml`. The Founder's Act IV (E1-E13 above) is written in `scenes/book1/70-the-test.yaml`, and both paths share the pool in `events/book1/pool-test.yaml` (the ransom, the preacher, the Lanzi's letter, the wolf winter, the regent's letter in an Adalian West).

| # | Decision | Decided |
|---|---|---|
| L3-42 | Hervé's death in 72 against Penhoët waiting for Mahaut's death in 73 | **He moves at her illness.** Mahaut falls ill at Candlemas 934; Hervé, hardened, rises at Midsummer before she is dead, and dies at Michaelmas 934 at the end of it (in bed, in the field's aftermath, or attainted). L3-20's date holds. |
| L3-43 | The Armance at Mahaut's death (Lady Day 935) | **The player decides:** unite it with the crown (£200 a year; the Armance lords resent it), give it to the head's brother or sister as a duchy apart, or keep it for a younger child. Under the bargain of 920 (`h_k_bargain`), Penhoët can be given it, or the bargain broken. |
| L3-44 | How the reign closes by 940 | **The junior crown**, as David did in 53. Under a crown for life the sovereign must ask the Estates for the crown by blood (or buy it); refused, the sovereign crowns the child anyway in defiance (`h_crown_defied`) or lays the crown down and the Estates choose. A death by the odds ends the reign sooner. |
| L3-45 | Runs that lost the crown in Act III | **The great house's Act IV, and a claim.** The crowned path's scenes play from a great house's side (the letters, Mahaut's illness, Hervé's rising, the Armance), then the claim (`h_n12_claim`): at King Hervé's death the Estates choose again and the house may win the crown back; under Tanguy or Lothaire the Estates name the next sovereign in the king's lifetime, and the house may be named, keep quiet, or renounce for an office. The Founder's E12-E13 then end the headship. The Founder's Kerval and Jehanne scenes do not fit a house whose quarrel with Penhoët is the Armance, so they are not used. |

**The beats** (N1-N12):
- **N1. After the Mottle** (spring 929): rebuild, thank the Estates (or kneel at the new king's court), or ride the march.
- **N2. Hervé's letters** (spring 930): take them on the road, ask him to his face, or let them run and copy them. Under King Hervé: his inquest into titles, answered, refused by the Estates' right, or bought off.
- **N3.** A pool draw, or **N4. The bishop** (931) if a sibling was given to the Church.
- **N5. The heir** (933): to court, to Mahaut in the Armance, or kept at home; a childless head names an heir or marries.
- **N6. Mahaut's illness** (Candlemas 934): go up to her, send physicians, or bring her down to Lannec.
- **N7. Hervé rises** (Midsummer 934; under King Hervé, his commission takes the Armance castles): lead, send the constable, read his letters to the Estates, or treat. The realm is at war until Michaelmas.
- **N8. The end of Hervé** (Michaelmas 934): Penhoët broken, reconciled by a match, or contained. Under King Hervé, **N8k**: the King is dead, and the Estates choose again (N12).
- **N9. Mahaut dies** (Lady Day 935): the Armance (L3-43).
- **N10.** A pool draw.
- **N11. The junior crown** (Lady Day 938, L3-44), and **N11b** if the Estates refuse.
- **N12. The claim** (crown-lost runs, L3-45).

**A grown heir on the crowned path** (2026-10-10, the author's second save: King Hob, Mahaut, and Ysolde, nineteen in year 50, from the first marriage and already crowned in her father's lifetime). An heir of thirteen or more in year 50 is of age at the handover, and is Mahaut's stepchild (her children are born from year 43). `flag.h_c_grown` (set in P0) switches the crowned path to its grown variants:
- the prologue: a grown heir at court and on the march; for an heir already crowned (`c5r_heir_crowned`), P10 is **the Handover** of the rule and the seals, not a crowning; no regency, and Mahaut is the Queen beside the throne, with her own son;
- Book I, Act I: the regent's scene becomes **the Queen's Son**, in which Mahaut asks her stepchild to seal her son's right to the Armance (`h_bc_armance_confirmed`);
- Act II: the regency's end (K6) is skipped;
- Act IV: at Mahaut's death the Armance is her own son's; the crown confirms him (`h_armance_half`) or takes it over his head (`h_armance_taken`, dishonour, worse if the crown sealed his right).
The text reads Mahaut through `{house.mahaut}` (your mother, stepmother or grandmother) and the Armance's heir through `{house.armance_heir}`; conditions `house.mahaut_blood` and `house.mahaut_child`. The save is a test fixture (`tests/fixtures/hob-crowned.koad`) and `transcripts/crowned-hob-save.md` is its run.

**Built for Act IV (both paths):**
- `adopt`: a Keeper with nobody of the blood left takes the Mottle's orphan ward (D10) or a cousin's orphan into the line at E13, rather than end the house.
- An event queued "at once" (the succession) now interrupts the scene whose entry passed over the death, and the scene opens again for the new head. Before this, a scene could be read by a head who had died in the years it skipped. Entry effects that must not run twice are guarded.
- `family.head_from` (the year the head took the house up) lets E12-E13 and N11 tell the Keeper from an heir who has only just succeeded.
- A child is never given a living brother's or sister's name.

**Tuning (the bot, 360 runs).** Founder houses end in about 5-10% of runs over Acts III-IV, all of it in the Mottle; before the adoption choice, E13 ended another 15% of houses whose Keeper had no heir. The crowned path ends in about 10%.

## Layer 3 decisions, round 1 (2026-10-07)
| # | Decision | Decided |
|---|---|---|
| L3-1 | Who follows King Thibaut (dies at Martinmas of year 52) | The Estates of the West choose between his young son and Mahaut. The founder's summons (P8) is that election. |
| L3-2 | Mahaut's death | About year 73, at 54, in every run. It keeps Knight of Adalia's "Queen Mahaut reigns thirty-one years", and Act IV's free crisis lands with the Keeper's shaped end. |
| L3-3 | Mahaut's husband, when it is not the founder | Sire Riwal de Kerguen, killed at the Pont-aux-Moines in year 44. Jehanne is Tanguy's cousin. |
| L3-5 | The likely outcome of Thibaut's election | Mahaut, unless the house swings the Estates to Thibaut's son. Every plot path must also hold under a player king (see the section above). |
| L3-6 | The odds in the prologue | Held off the founder, the heir and the founder's spouse. Births, matches and others' deaths still run. |
| L3-7 | A cloistered founder's death | About year 57, in Book I, Act I. His letters run until then. |
| L3-8 | Thibaut's son | King Gaucelin, 9 in year 53, named for the Constable; of age about year 60 |
| L3-9 | The Kerguen match | Azenor de Kerguen, Tanguy's sister, born after her father's death at Mortefontaine (autumn of year 34); 20 in year 55. The author chose 19; 20 is the nearest age that canon allows. |
| L3-10 | The Kerval verdict | Mostly fixed: kept with a strong charter, lost with a weak one, otherwise shared (the manor to the house, the wood and the mill to Penhoët). A court check moves it one step. |
| L3-11 | Act I's ending | Two offers for the house's vote, and no answer: a cliffhanger into Act II |
| L3-12 | The law under King Gaucelin | The male line, unless the house helps Gaucelin turn on his regents at his majority (C6) |
| L3-13 | Overturning a likely outcome | Always needs an ally: the spouse's house, the second child's house or Kerguen |
| L3-14 | Jehanne's marriage under the King's wardship (Adalian) | The house can bid for it, at a high cost and against rival bidders |
| L3-15 | Act II's ending | The house's own law, then the first rumour of the Second Mottle |
| L3-16 | Adalia's boy king | Aldred III, 9 in year 64, Edwin's grandson; Prince Aymer died in 61. The regency runs to about 71. |
| L3-17 | Penhoët's loss in the Mottle | Ronan dies; Hervé survives with a minor heir, Ronan's child |
| L3-18 | The Mottle's severity | Harsh plague odds, plus one scripted death in the extended family in every run |
| L3-19 | Act III's ending | The Keeper's will |
| L3-20 | Hervé's death | Year 72, at about 67, scripted after his last move at Kerval |
| L3-21 | Aldred III's majority (Adalian) | He keeps the Hales and punishes Carrow's heirs, unless the house and an ally swing him |
| L3-22 | The fight at Kerval | A short campaign with the war system, at small scale |
| L3-23 | Book I's close | An end is always taken in E13. A Keeper who steps down lives on into Book II. |
| L3-4 | Who writes the scenes | Claude writes every scene. The author reviews and suggests changes in playtest, and keeps advisory control of major plot points. |

---

## Decisions log
| Date | Layer | Decision |
|---|---|---|
| 2026-10-06 | Scope | Consulted layer by layer. Book I braided: realm, rival, family. Prologue in two halves (founder, then heir). All openings and frames at act level; beat sheets for the Founder opening in the free and Adalian frames. |
| 2026-10-07 | Layer 1 | All seven decisions as recommended: Penhoët the rival (L1-1); the founder's shadow (L1-2); the second child an ally who can be turned (L1-3); the handover in the year 53 illness, by the founder's choice of manner (L1-4); the cloister kept (L1-5); Mahaut's heir a daughter (L1-6); Knight of Adalia's tone (L1-7). Names kept: Hervé de Penhoët, Tanguy de Kerguen; the Old Companion from the import or generated. |
| 2026-10-07 | Layer 2 | Act IV named by frame (L2-1). The law fight mostly fixed, with a likely outcome per frame that a strong house can overturn (L2-2). Penhoët can be broken, reconciled or contained, with Sir Yvon of Kerlan as the heir to a broken claim (L2-3). The Keeper's end open, with a shaped end in years 72-78 (L2-4). Jehanne, born year 44 (L2-5). Ronan de Penhoët, about 16 (L2-6). Penhoët holds Diminished's lost manor (L2-7). |
| 2026-10-07 | Layer 3, round 1 | Thibaut's successor chosen by the Estates (L3-1); Mahaut dies about year 73 (L3-2); Sire Riwal de Kerguen, Jehanne's father in non-founder runs (L3-3); Claude writes all scenes, the author advises on major plot points (L3-4). |
| 2026-10-07 | Layer 3, round 2 | Thibaut's election goes to Mahaut unless swung, and plot paths are checked under a player king (L3-5); the prologue's odds are held off the founder, heir and spouse (L3-6); a cloistered founder dies about year 57 (L3-7). The prologue's sign-off waits on the author reading a summary. |
| 2026-10-07 | Layer 3 | The prologue's beat sheets (P1-P16) approved after the author read the summary. |
| 2026-10-07 | Layer 3, round 3 (Act I) | King Gaucelin, 9 (L3-8); Azenor de Kerguen, 20 (L3-9); Kerval's verdict mostly fixed, shared by default (L3-10); Act I ends on two offers (L3-11). |
| 2026-10-07 | Layer 3 | Book I, Act I's beat sheets (B1-B12) approved. |
| 2026-10-07 | Layer 3, round 4 (Act II) | Male line likely under Gaucelin unless he is turned at his majority (L3-12); overturning always needs an ally (L3-13); the house can bid for Jehanne's marriage (L3-14); Act II ends on the house law and the plague rumour (L3-15). |
| 2026-10-07 | Layer 3 | Book I, Act II's beat sheets (C1-C11) approved. |
| 2026-10-08 | Layer 3, round 5 (Act III) | Aldred III, 9, with Prince Aymer dead in 61 (L3-16); Ronan dies in the Mottle (L3-17); harsh odds with one sure loss (L3-18); Act III ends on the Keeper's will (L3-19). |
| 2026-10-08 | Layer 3 | Book I, Act III's beat sheets (D1-D11) approved. |
| 2026-10-08 | Layer 3, round 6 (Act IV) | Hervé dies in 72 (L3-20); Aldred III keeps the Hales unless swung (L3-21); Kerval is a short campaign (L3-22); an end is always taken in E13 (L3-23). |
| 2026-10-08 | Layer 3 | Book I, Act IV's beat sheets (E1-E13) approved. Layer 3 complete. PLAN.md §6.1-6.2 now point here, and §8 carries the epilogue promises found in Layer 3. |
| 2026-10-08 | Step 4b | The prologue (P1-P16) written for the Founder opening, free and Adalian frames. Transcripts in `transcripts/`. Waiting on the author's playtest. |
| 2026-10-08 | Step 4c | Book I, Act I (B1-B12) written for the Founder opening, free and Adalian frames. The playtest link carries the prologue and Act I. |
| 2026-10-08 | The crowned path | The author's run: King of the West married to Mahaut, no children before her. Junior crown in 53, old king to about 64 (L3-24); eldest of either sex (L3-25); Jehanne played from 53 under Mahaut's regency (L3-26, L3-27); Mahaut's other children by the odds (L3-28); Quérec defies a girl's crown (L3-29); Penhoët claims the Armance by the male line in Act I (L3-30). Written for the prologue and Book I, Act I. |
| 2026-10-08 | The crowned path, from the author's save | The save left Jehan, five, the crown left to the Estates, and old Quérec exiled. Jehan is the heir; Jehanne only when Mahaut has no child (L3-31). The elective crown honoured (L3-32). Bertrand defies the Estates' right (L3-33). Prologue and Book I, Act I made sex-generic and elective-aware; the save is a test fixture, and `transcripts/crowned-author-save.md` is its run. |
| 2026-10-08 | Depth and carry-over | The calendar is the Church's years of grace, a fictional count (old year N = 862 + N, so the house starts in 912), shown with the sovereign's year (canon.md, "The calendar"). Knight of Adalia's economy ported whole: manor, holdings, knights' dues, household, men's pay at Michaelmas. The save carries everything it holds. A new start answers seven to ten questions that build the same export an import gives. Hints and results in words, Knight of Adalia style. |
| 2026-10-08 | The purse | Knight of Adalia is the point of truth for money, the crown's income included (£600-£1,000, not PLAN's £4,000). Income moves with the harvest, the trade, war and plague. Investment scenes on Knight of Adalia's model: two in the prologue (one per path) and two in Book I, Act I. |
| 2026-10-09 | The crowned path, Act II | The Estates confirm for life unless the crown carries a hereditary crown with an ally (L3-34); Penhoët, refused, waits for Mahaut's death (L3-35); the regency ends in a handover or a struggle (L3-36); Bertrand rises again with the free companies (L3-37). Both paths' Act II written; the threshold is six with an ally. |
| 2026-10-09 | Book I, Act III, both paths | The Mottle takes David in 926 (L3-38, over L3-24); under a crown for life the Estates choose and may choose outside the house (L3-39); the wedding at Easter 925 (L3-40); grief hardens Hervé (L3-41). Both paths' Act III written, with a shared pool. |
| 2026-10-09 | Book I, Act IV, both paths | Hervé moves at Mahaut's illness and dies at the end of it (L3-42); the player decides the Armance (L3-43); the reign closes with the junior crown, the last chance at a hereditary crown under a crown for life (L3-44); crown-lost runs play the great house's Act IV and a claim (L3-45). Both paths' Act IV written; Book I is complete. |
