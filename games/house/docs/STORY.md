# House of Adalia: The Story of the Prologue and Book I

**Status:** Layer 1 (the spine) and Layer 2 (the acts) approved by the author, 2026-10-07. Layer 3 (the beat sheets) is next, and step 4b's writing starts only after it is signed off. The process is in the decisions log at the end.

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
| Free | **The law put to the test.** Mahaut dies (about year 68, at 49), and Jehanne succeeds to whatever Mahaut held: the crown under Queen Mahaut, or the duchy of Armance under King Thibaut or the free duchy. Whether the West accepts her depends on the law written in Act II. If the male line won, Penhoët claims what she inherits. Under a crown the house itself wears, the test is the house's own succession. |
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
| L2-5 | Mahaut's daughter | Jehanne, born in year 44, named after her great-grandmother. Her father is the founder if Knight of Adalia married him to Mahaut; otherwise a West lord killed in the War of the West, named in Layer 3. |
| L2-6 | Penhoët's grandson | Ronan de Penhoët, Hervé's son, about 16 in year 50 |
| L2-7 | Diminished's lost manor | Penhoët holds it |

---

## Decisions log
| Date | Layer | Decision |
|---|---|---|
| 2026-10-06 | Scope | Consulted layer by layer. Book I braided: realm, rival, family. Prologue in two halves (founder, then heir). All openings and frames at act level; beat sheets for the Founder opening in the free and Adalian frames. |
| 2026-10-07 | Layer 1 | All seven decisions as recommended: Penhoët the rival (L1-1); the founder's shadow (L1-2); the second child an ally who can be turned (L1-3); the handover in the year 53 illness, by the founder's choice of manner (L1-4); the cloister kept (L1-5); Mahaut's heir a daughter (L1-6); Knight of Adalia's tone (L1-7). Names kept: Hervé de Penhoët, Tanguy de Kerguen; the Old Companion from the import or generated. |
| 2026-10-07 | Layer 2 | Act IV named by frame (L2-1). The law fight mostly fixed, with a likely outcome per frame that a strong house can overturn (L2-2). Penhoët can be broken, reconciled or contained, with Sir Yvon of Kerlan as the heir to a broken claim (L2-3). The Keeper's end open, with a shaped end in years 72-78 (L2-4). Jehanne, born year 44 (L2-5). Ronan de Penhoët, about 16 (L2-6). Penhoët holds Diminished's lost manor (L2-7). |
