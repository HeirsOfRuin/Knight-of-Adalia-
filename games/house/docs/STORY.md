# House of Adalia: The Story of the Prologue and Book I

**Status:** Layer 1 (the spine) and Layer 2 (the acts) approved by the author, 2026-10-07. Layer 3 (the beat sheets): the prologue approved 2026-10-07; Book I is drafted act by act. Step 4b's writing of the prologue can start. The process is in the decisions log at the end.

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

## Layer 3: Beat sheets, round 3: Book I, Act II, *The Law* (decisions taken 2026-10-07; awaiting sign-off)

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
