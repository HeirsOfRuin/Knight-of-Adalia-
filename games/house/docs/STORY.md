# House of Adalia: The Story of the Prologue and Book I

**Status:** Layer 1 (the spine) approved by the author, 2026-10-07, every decision as recommended. Layer 2 (the acts) is next, then Layer 3 (the beat sheets), each only after the one before is signed off. The process is in the decisions log at the end.

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

## Decisions log
| Date | Layer | Decision |
|---|---|---|
| 2026-10-06 | Scope | Consulted layer by layer. Book I braided: realm, rival, family. Prologue in two halves (founder, then heir). All openings and frames at act level; beat sheets for the Founder opening in the free and Adalian frames. |
| 2026-10-07 | Layer 1 | All seven decisions as recommended: Penhoët the rival (L1-1); the founder's shadow (L1-2); the second child an ally who can be turned (L1-3); the handover in the year 53 illness, by the founder's choice of manner (L1-4); the cloister kept (L1-5); Mahaut's heir a daughter (L1-6); Knight of Adalia's tone (L1-7). Names kept: Hervé de Penhoët, Tanguy de Kerguen; the Old Companion from the import or generated. |
