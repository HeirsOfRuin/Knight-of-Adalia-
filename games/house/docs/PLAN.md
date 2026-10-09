# House of Adalia: Detailed Plan

**Status:** approved by the author, 2026-10-06, with all ten decisions in section 11 as recommended. It builds on the approved frame (`FRAME.md`) and the framework in code (`../README.md`). The canon additions (decision 10) are in `../content/canon.md`. Build progress is in section 10.

**How to read it.** Sections 1-3 are the game as a player meets it. Section 4 covers the systems, with numbers. Sections 5-8 cover the story. Sections 9-12 cover the budget, build order, decisions and risks. Every system lists what reads it, under the rule from Knight of Adalia: a system that no scene or ending reads is cut.

**Sources.** Canon, names and dates come from `games/knight/content/canon.md`; money from `games/knight/docs/ECONOMY.md`; voice from `games/knight/content/style-guide.md`. Where this plan adds to canon, it says so, and the addition goes into a House of Adalia canon file once approved.

---

## 1. The game in one page

You play the head of a house in the West for seventy-five years, from the founder's last years to his great-grandchild. Each head is a person you raised: you chose their upbringing, their match, and how much of yourself to give them. When a head dies, you become the heir, and the house carries on with what the last head left it: lands, debts, enemies, and a paragraph in the chronicle.

**What a run is.** About 8-12 hours, three generations (sometimes four), around 220 scenes of which a run sees about half. A run ends at the end of Book III (year 125), or earlier if the house dies out.

**What the player does, at four scales:**

| Scale | How often | What happens | Engine |
|---|---|---|---|
| **Scene** | Every few minutes | A choice, often with a check; prose in the second person, as in Knight of Adalia | Exists |
| **Year** | Every act has several | The **Michaelmas reckoning**: rents in, pay out, births and deaths, the house's standing. A short ledger, not a spreadsheet. | §4.3, to build |
| **Act** | 4 per book | A time skip of 4-7 years, bridged in prose, then a crisis | Exists (KoA Ch3-4 pattern) |
| **Generation** | 3 per run | The head dies or steps down; succession; you are the heir | §4.2, to build |

**The core tension.** Every choice spends something the next generation inherits: money, a child's future, a rival's grudge, the West's peace. The game is about what you keep, what you spend, and who you raise to hold it.

---

## 2. Time model

### Where the time goes
| Part | Years | Head (usual) | Head's age | Acts | Spine scenes | Pool draws |
|---|---|---|---|---|---|---|
| **Prologue: The Old Lord** | 50-55 | The founder | 49-55 | 2 | 12-15 | 1 |
| **Book I: The Keeper** | 55-78 | The founder's heir (born ~29-31) | ~25-48 | 4 | 40-50 | 4 |
| **Book II: The Builder** | 78-102 | The grandchild (born ~56-62) | ~18-42 | 4 | 40-50 | 4 |
| **Book III: The Inheritor** | 102-125 | The great-grandchild (born ~82-88) | ~16-40 | 4 | 40-50 | 4 |

- **Heads die when the story or the odds say so,** not on schedule. The table is the usual shape. An early death brings a regency or a young head; a long life means the heir waits, and resents it (section 4.2).
- **The handover is always a spine event.** If a head is still alive at a book's last act, the act offers a natural or political end: an illness, a battle, stepping down into a religious house, deposition. The book changes only through a death or a stepping down.

### The year tick
Engine work: a yearly upkeep at Michaelmas, extending KoA's `onSeason` (rents already land at Michaelmas).
1. **Rents and incomes** from every holding (section 4.6).
2. **Pay and upkeep**: retinue, garrison, household, debts' interest.
3. **Ageing and the odds**: each family member rolls the mortality table (section 4.1). A death is never silent: it **queues a narrated event**, read by relation and age, for the next scene break.
4. **Births**: each married couple rolls fertility (section 4.1). Births are queued and narrated the same way.
5. **Standing** recomputed (section 4.3), and the rival houses' standing drifts (section 4.4).
6. **The reckoning view**: one screen, shown at each act's end (not every year), summing the years since the last one.

---

## 3. What the player sees

| Panel | Contents | Replaces in KoA |
|---|---|---|
| **The scene** | As in KoA: date line, title, Continue pages, choices with odds bands and stakes | Same |
| **The House** | The family tree with ages, spouses, the heir marked under the law in force, upbringing, temperament, bond. The dead in grey. | Status panel |
| **The Ledger** | Holdings, incomes, men, debts, last Michaelmas | Status panel's purse and lands |
| **The Realm** | The frame and sovereign; the assembly's mood; the great houses ranked, with their temper toward yours | People page |
| **The Chronicle** | A paragraph per head, built from state, plus the founder's from Knight of Adalia | Journal (kept, but cut at each handover) |
| **The Map** | KoA's world map, with the West's borders by frame and the houses' seats | Same, extended |

The **chapter card** (KoA's title page) opens each book and act, and for House it shows the family: "Year 63. Your heir, Piers, is eleven. Your second, Alys, is betrothed to a Penhoët."

---

## 4. Systems

### 4.1 Family and characters
**State.** Every family member is a `Character` (engine, step 2), extended with:
- kinship: parents, spouse, children;
- `temperament` (bold, bookish, merry, grave, as in KoA);
- `upbringing`;
- `bond` with the current head (−5..5);
- `legitimate` (true, or false for a bastard).

**The life of a child.** These are the decision points; each is a scene or part of one.

| Age | What happens | Player's choice | What it sets |
|---|---|---|---|
| 0 | Birth, naming | The name, or "after his grandfather" | The name; the godparent's house (+temper) |
| 7 | Leaves the nursery | Home, page in a great house, the Church, letters | `upbringing`; a house ally if sent as page |
| 12-14 | Training | Arms, court, stewardship, the Church | Skills; traits |
| 14-16 | First test | A tourney, a skirmish, a mission, a debate | A trait; renown; risk (no battle under 14; KoA rule) |
| 14-20 | The match | Section 4.7 | Alliance, dowry, claim |

**Mortality** (a hidden yearly roll; the numbers are for the bot to tune):

| Age | Yearly chance of death | Notes |
|---|---|---|
| 0 (first year) | 12% | Historical figures are higher (20-30%). Lowered so a family is not hollowed out before the player knows the children. |
| 1-4 | 3% | |
| 5-14 | 1% | A named child of five or more dies only in a narrated scene, never off-screen between acts |
| 15-39 | 1% | Plus war and lethal choices |
| 40-49 | 2% | |
| 50-59 | 4% | |
| 60-69 | 8% | |
| 70+ | 15% | |
| Childbed (each birth) | 2% | KoA's lying-in risk carries over |
| A plague year | ×3 for all; ×5 for children in the **Second Mottle** (Book I, Act III) | Historical: the 1361 "mortality of children" |

**Fertility.** A married couple with the wife aged 16-40 has a 30% chance of a birth each year, 15% after 35. Births can be prevented only by a vow or a separation, not by mechanics.

**Bastards.** They come from choices, never from rolls. They are named, can be legitimated (section 4.2), and are often the heir of last resort.

**Reads it:** succession (4.2), matches (4.7), the chronicle (4.10), the House panel, and many pool events ("the bookish heir and the tutor", "the bold one and the horse").

### 4.2 Succession
**The law in force.** Each realm and each house has one: `primogeniture`, `male_preference` (daughters when there is no son) or `partible` (divided among sons). It starts by frame:

| Frame | The crown's law | The house's lands | The live question |
|---|---|---|---|
| Free | Unwritten. Book I, Act II writes it, and the player's vote at the Estates counts. | Male preference, by custom | Does a crown of the West pass through a woman, as Jehanne's duchy did? |
| Adalian | Adalia's: male preference. The Earl of the March's patent may say otherwise (`c5_liberties`). | Male preference; co-heiresses divide when there is no son | The patent's terms, and whether Wendmere honours them |
| Divided | Two laws. Valdrenne: the crown cannot pass through a woman, so Mahaut's duchy is claimed as escheat. Adalia: male preference. | Whichever side of the border each holding lies on | Holdings on the two sides can pass to different heirs |

**When the head dies** (engine work: a `die` with an heir no longer ends the game; it queues the succession):
1. **The heir under the law** is found: the eldest legitimate son, then daughters by the law, then the head's brothers and their lines, then cousins.
2. **Is the succession contested?** If another claimant has a better claim under a different law, or a powerful backer, or the heir is a minor, the succession scene is a **crisis**: a council, a claimant, a sibling.
3. **A minor heir** (under 16) means a **regency**. You play the child; the regent is a character (a parent, an uncle, an ally's lord). The regent's loyalty is a hidden number the player learns through events, and the regency ends at 16, by force, or with the regent's death.
4. **No heir**: a legitimated bastard, if the Church granted it; otherwise the house ends (**Extinct**).
5. **The handover**: the old head's chronicle entry is written; the journal is condensed; the new head swears homage; play continues as the heir.

**Changing the law.** A scene, never a menu, with a price:
- **free:** the Estates' votes;
- **adalian:** the King's charter, bought or earned;
- **divided:** the house's own law can change, but the crown's cannot;
- **any frame:** a Pope's dispensation, needed for a bastard's legitimation or a cousin marriage.

**Reads it:** every succession scene, the endings (A Royal Line needs a recognised heir), and the House panel ("Heir under the law: Alys. Heir by your will: Piers.").

### 4.3 The house
| Field | Range | What moves it | What reads it |
|---|---|---|---|
| **Standing** | 0-100, shown as a word | Derived each year: lands' income, men, offices held, marriages into great houses, renown | Endings; who offers matches; whether the sovereign listens |
| **Treasury** | pence | Rents, ransoms, loot, offices; pay, building, dowries, fines | Every purchase; the war chest |
| **Debt** | pence, interest 10% a year | Loans (Lanzi, Varesco); unpaid ransoms | Book II's Lanzi crash; Ruin |
| **Affinity** | named knights and lesser houses sworn to you | Fees, marriages, protection | War musters; the assembly's votes; defections in a crisis |
| **Retinue** | men (KoA's company, garrison, levy) | Hire, pay, losses | War |
| **Reputation** | per power: crown, assembly, Church, towns, Sarenza, Valdrenne, Adalia | Choices | Checks (KoA's audience modifier, reborn as "the house's name"); recognition; matches |

**Standing words.** Under 20: a small house. 20-39: a house of the West. 40-59: a great house. 60-79: one of the great houses. 80 and over: the greatest in the West.

**Reads it:** endings (section 7), match offers (4.7), the assembly (4.5).

### 4.4 Rival houses
Eight to ten houses in play at a time, each with a head (a character), **standing**, **temper toward yours** (−10..10), **claim** (0-3, to the West's crown), **seat** and **culture**. Their acts come through the director: pool events gated by their state. A house with standing 60+ and temper −5 or worse produces "a border quarrel", "a suit at law" or "a rival match". An indebted one offers a daughter. There is no AI; the variety comes from gating.

**The roster** (from Knight of Adalia's cast; frame shapes their start):

| House | Seat, culture | Who they are in KoA | Start by frame |
|---|---|---|---|
| **Armance** (royal or ducal) | Lannec; the old ducal line | Jehanne, Mahaut | Free: on or beside the throne. Adalian: Mahaut the King's duchess. Divided: Valdrenne claims the duchy as escheat |
| **Brésy** | Montbrun over the march; Valdrennish | The Constable; Thibaut; Gautier; Aliénor | Free: King Thibaut's house, or the West's sword. Adalian: exiles. Divided: hunted by Amaury VII |
| **Penhoët** | The Armance hills; the rival claimant's party | Yann de Penhoët, who claims Kerval | Every frame: a rival with an old grievance and a claim through the other Armance line |
| **Kerguen** | A mill and two villages; Armance | Dame Blanche; her son (8 in year 37, so 21 in year 50) | A young house rising, or the founder's stepson's (if the founder married her) |
| **Corbie** | Valdrennish, of good family | Raoul de Corbie (ransomed), Héloïse | Divided: Valdrenne's favoured new men in the Armance. Elsewhere: kin across the border |
| **Vaux** | Sauvemer | Enguerrand, castellan; Clémence | The Salt's old garrison house; townsmen's lords |
| **Quérec** | The marsh coast | The lord who would not kneel | Free: the crown's standing rebel. Elsewhere: whoever's rebel |
| **Carrow** | Adalia; the Old Baronage | Earl Osmund, his son Gerard, his marshal Hugh Malet | By KoA's Wythen Heath (`inherited.*` flags): broken, or Adalia's power behind the throne |
| **Hales** | Wendmere's officers in the Salt | Thomas Hales, the salt-penny man | Adalian: the King's governor's family. Divided: the Salt's Adalian administrators |
| **Lanzi** | Sarenza; a bank, not land | Matteo, Bertuccio, Fiammetta | Every frame: creditors. Book II: the crash |

The sovereign's house (Armance, Sauvel or Adalia's) is a house too, and the player can marry into it.

### 4.5 The realm
| Field | Range | What it is |
|---|---|---|
| `realm.west`, `realm.sovereign` | ids | Built (the framework) |
| **Crown strength** | 0-10 | How far the sovereign can make the great houses obey. KoA's `counter.reign` ("The kingdom") seeds it in a Crowned import. |
| **Assembly mood** | −5..5 | The Estates of the West, the Moot, or the two courts (by frame) |
| **Tax** | none, light, heavy | Sets the risk of a rising and the treasury of the crown |
| **Peace** | at war or at peace, with whom | Sets musters, trade income, ransoms |

The **frame can change** once in Book II and once in Book III (FRAME.md §2), each through a spine event with its own scenes: a rising, a conquest, or a peace that trades the West.

### 4.6 Lands and money
KoA's economy carries over unchanged (`ECONOMY.md`): 20d a head in rent, a manor of 250 yields about £21, a baron £200 and up, an earl £1,000 and up.

| Thing | Value |
|---|---|
| A holding | Income (pence a year), temper (−5..5), levy (men), and which side of the border it lies on |
| The founder's lands | From the export (manor and holdings), or the opening's defaults |
| A great house's income | £200-£800 a year (a Founder opening starts near £300) |
| The crown's income (free West) | £600-£1,000 a year (Knight of Adalia's crown revenues, the point of truth: the author, 2026-10-08), half the domain's rents and half the salt penny and customs; far less than either king |
| Upkeep | Household 15% of income; men 6s a year each; a castle's repair £20-£60 a year |
| A dowry | A tenth to a third of a year's income for a daughter of the house; an heiress brings land instead |
| Interest | 10% a year (Sarenzan); a default triggers the creditor's events |

### 4.7 Matches
Knight of Adalia's courtship, aimed upward for one man, gives way to **matches** made between houses, one for each child.

- **Offers** come from houses whose standing is near yours (±20) and whose temper is 0 or better, and from any house that needs money. Each offer has terms:
  - a dowry, paid or received;
  - land;
  - an alliance (a temper floor and a muster promise);
  - a claim (marrying into a line with one);
  - a cost (an enemy of that house becomes yours).
- **Your choice** for each child: accept, bargain (a check against the house's head), refuse, or **a love match** (an authored set, about 12 across the run). A love match costs the alliance value but gives a strong `bond` and a spouse with a voice.
- **Dispensations.** Cousins within four degrees need the Church (Book II's Schism makes this political).
- **Spouses** are characters. Generated spouses speak with **archetype voices**: one line per moment per temperament and culture, as FRAME.md §6.2 says.

### 4.8 War
A campaign is 2-4 decision scenes plus one numeric resolution.
1. **The muster**: retinue + affinity + levy + hired companies (Hroswald free companies, Sarenzan crossbows). Pay at ECONOMY.md's war wages: 6d an archer, 12d a man-at-arms, 2s a knight, per day.
2. **The campaign**: seasons in the field. Supply and pay are checked each season; unpaid men desert as in KoA.
3. **The battle**: a score from the forces' ratio, the commander's tactics, the ground, and the decision scenes' choices, resolved through KoA's check bands. Results: won, held or lost (as at the Pont-aux-Moines), each with casualties as a share of the men.
4. **After**: ransoms (ECONOMY.md §4), captured heirs, attainders on the losing side.

**Heirs in war.** No child under 14 in battle (the KoA rule). An heir in the field can die only through a choice the player made, as in KoA Ch5's "send the reserve with your eldest".

### 4.9 The Church
- **Reputation** with the Church and the **Bishop of Saint-Lys** (Évrard is ninety in year 42; his successor is a Book I figure).
- **What the Church grants:** legitimation, dispensations, recognition of a crown, a child's career.
- **The Schism** (Book II, Act III): two Popes, one at Saint-Lys and one elected in Sarenza. This is an addition to canon; the history behind it is Avignon against Rome in 1378. Each realm chooses its obedience. A dispensation from the "wrong" Pope may not be honoured.

### 4.10 The chronicle and the handover
- At each handover, the head's **chronicle paragraph** is built from state, like KoA's reckoning (97 deeds there). It is shown at the funeral and kept in the Chronicle panel.
- The working journal is then condensed (save-size budget, FRAME.md §8).
- **The founder's paragraph** in an import is built from the export's flags. It is the first payoff of the whole sequel: Knight of Adalia's life, read back in a page.

---

## 5. The master timeline

What happens in the world, year by year, unless the player changes it. Frame-specific forms are in section 6. The historical analogues are flavour, not script.

| Years | Event | Analogue |
|---|---|---|
| 50 | The prologue opens. Edwin of Adalia is 38; Mahaut 31; Amaury VII 26; Thibaut de Brésy about 45 | |
| 50-55 | The founder's last years | |
| ~54 | Bishop Évrard of Saint-Lys dies; a new bishop is chosen, and both kings want him | |
| 58-62 | The law of succession is fought over in the West (by frame) | Burgundy's estates; the Salic law debates |
| 61-63 | Caldmoor's regency war spills over the March; free companies unemployed after the peace raid the West | The free companies after Brétigny, 1360s |
| 63-65 | **The Second Mottle**: the "children's mortality" | 1361-62 |
| 64-66 | Edwin of Adalia dies at about 52; his son's heir is a minor; regency council | Richard II's minority |
| 68-73 | A minority or a disputed crown in the West or in Valdrenne (by frame); Mahaut dies about 73 | |
| 75-78 | The Keeper's generation ends | |
| 80-86 | Adalia and Valdrenne at war again, fought through the West | The war after 1369 |
| 86-88 | **The Lanzi crash**: Sarenzan banks fail on a royal default | Bardi and Peruzzi, 1340s |
| 89 | **The Schism**: two Popes | 1378 |
| 92-95 | **The second rising of the commons**, over a poll tax or the salt tithe (by frame) | 1381; KoA's Hythe Fields (year 31) remembered |
| 96-100 | Amaury VII's "absences": a king who is sometimes mad | Charles VI |
| 100-102 | The Builder's generation ends | |
| 104-110 | The great houses choose sides as the crowns weaken | |
| 110-120 | **The war of cousins**, over the crown of the West, Adalia's or Valdrenne's (by frame) | The Wars of the Roses |
| 120-125 | The verdict; the chronicle of the house | |

---

## 6. The story

### 6.1 The prologue: The Old Lord (years 50-55; 12-15 scenes)
> **Superseded by `STORY.md`** (approved by the author 2026-10-07/08). The story's Layer 3 holds the prologue's 16 beat sheets (P1-P16), in two halves played as the founder and then the heir. Where this section and STORY.md differ, STORY.md wins. This section stays as the plan's original outline.

**Purpose.** It teaches the loop (a year, a match, the ledger, a succession) with a character the player already knows: their founder, from Knight of Adalia, or a generated one.

| # | Scene | What it does | Varies by |
|---|---|---|---|
| 1 | **The Hall** | Where the house stands; built (the framework scene) | Opening × frame |
| 2 | **The Old Company** | The founder's surviving companions (export `people[]`): who is alive, who owes, who wants | Import |
| 3 | **The Heir** | The eldest, met as an adult: temperament, upbringing, bond from KoA. If the law allows, name an heir by will | Children; law |
| 4 | **The Sovereign's Summons** | The founder's last service: an Estates, a muster, a governor's demand | Frame |
| 5 | **The Match** | The eldest's (or second child's) marriage: the first use of matches | Houses |
| 6 | **The First Michaelmas** | The reckoning view, taught in prose | |
| 7 | *Pool draw* | One event from the prologue pool | State |
| 8 | **The Rival** | One house moves against you: Penhoët's claim, Quérec's raid, Carrow's suit | Frame; import |
| 9 | **The Illness** | The founder's health fails. Physicians, relics (low magic: never confirmed), rest | |
| 10 | **The Will** | Provision for the younger children: land (weakens the heir), the Church, a marriage, nothing | Law |
| 11 | **The Last Order** | One thing the founder settles: a feud, a confession, a debt, a promise kept from KoA | Export flags |
| 12 | **The Death, or the Cloister** | The founder dies, or steps down into a religious house. A choice, but the prologue always ends | |
| 13 | **The Chronicle** | The founder's paragraph | Export |
| 14 | **The Oath** | The heir's homage. You are the heir now | Frame |

**Opening-specific first acts** (scenes 1-4 take the opening's form):

| Opening | The first act's question |
|---|---|
| Crowned | Can the founder make his heir accepted while he lives? An Estates, a crowning of the heir (KoA's `c5r_heir_crowned`), the Quérec problem |
| Kingmaker | The sovereign the founder made is ageing or dead; the new one owes the house nothing and fears it |
| Founder | A great lord with rivals for the same rank; Penhoët's claim to the house's best manor |
| Diminished | One holding; the winners' sons; a chance to buy back a lost manor at a price the house cannot afford |
| Exile | A court abroad (Sarenza, Hroswald, Caldmoor, Adalia or Valdrenne, from the export); a pardon offered on terms. Return, or settle where you are |
| Ruin | No land; a name struck out. Service with a free company or a great house; the long road back |

### 6.2 Book I: The Keeper (years 55-78; 40-50 scenes)
> **Superseded by `STORY.md`.** Its Layers 2-3 hold the four acts and their beat sheets: Act I (B1-B12), Act II (C1-C11), Act III (D1-D11) and Act IV (E1-E13). Act IV is named by frame: *The Test of the Law* (free), *The Minority* (Adalian), *The Drift* (divided). Mahaut's death moved to about year 73. Where this section and STORY.md differ, STORY.md wins.

| Act | Years | Free | Adalian | Divided |
|---|---|---|---|---|
| **I. The New Lord** | 55-58 | The founder's men test the heir; the crown asks the house to choose where it stands on the law | Wendmere sends a new governor; the founder's patent is read differently by a new reign's lawyers | The governor's men count your holdings for the new tax |
| **II. The Law** | 58-63 | The Estates write the West's law of succession. The house votes, and its daughters' futures hang on it | The liberties in the patent are tested in the King's court; Mahaut's duchy and Adalian law | Valdrenne claims Mahaut's duchy as escheat; the Armance lords choose |
| **III. The Children's Mortality** | 63-66 | The Second Mottle; the free companies on the roads | The same, and Edwin's death (about year 64): a minority at Wendmere | The same; the border closes against the plague, and families are cut in two |
| **IV. The Minority** | 66-78 | A crown with a child on it, or a regency fight in the house of Armance or Brésy; the house is kingmaker or victim | Adalia's regency council, and the Old Baronage back (Carrow's heirs) | Amaury VII strong, Edwin's minor weak; the Salt looks across the border |

Running through all four acts:
- the heir's own marriage (Act I);
- the children's upbringing (Acts II-III);
- one generational quarrel (a younger sibling's land, or a mother's dower);
- the Keeper's end (Act IV).

### 6.3 Book II: The Builder (years 78-102; 40-50 scenes)
| Act | Years | Free | Adalian | Divided |
|---|---|---|---|---|
| **I. The Great Match** | 78-82 | A marriage into the royal line, or a rival's, that could carry a claim | A marriage into an Adalian earldom, with Wendmere's leave | A marriage across the border, which both kings forbid |
| **II. The Foreign War** | 82-88 | The West's first war as a realm: Valdrenne over the hills, Adalia watching | Adalia's war against Valdrenne, fought through the West | Both kings at war over the border line; the house is on it |
| **III. Debt and the Schism** | 86-94 | The Lanzi crash takes the crown's credit; the West chooses a Pope | The crash takes Adalia's; Wendmere and the West disagree over the Pope | Two kings, two Popes, one border |
| **IV. The Rising** | 92-100 | The commons rise against the war tax; the crown wants the house's men | The poll tax; Wendmere's governors hanged; **the West's chance to break away** | The salt tithe; **the West's chance to be one again** |

**The frame can change** in Act IV (one change at most): a successful rising and breakaway (Adalian → free), a reunion (divided → free, or divided → Adalian by a peace), or a conquest (free → divided).

### 6.4 Book III: The Inheritor (years 102-125; 40-50 scenes)
| Act | Years | Free | Adalian | Divided |
|---|---|---|---|---|
| **I. Cousins** | 102-108 | The royal line has more claimants than crowns, the house among them if Book II's match carried a claim | Adalia's royal cousins form parties; the West is the prize each promises | Amaury VII's madness; the Valdrennish princes form parties |
| **II. The Claim** | 108-114 | The house presses, sells or refuses its claim | The house picks a cousin; the price is the West's liberties | The house picks a prince, or the West's own cause |
| **III. The War of Cousins** | 114-120 | The war for the crown of the West | Adalia's war of cousins, with the West as one of its fields | Valdrenne's civil war; the border falls open |
| **IV. The Verdict** | 120-125 | Who wears the crown, and what the house is | What the West is at the end, and the house in it | One West, two, or none; the house's place |

Then the **epilogue**: the chronicle of the whole house, from the founder to the last head, and the ending.

### 6.5 Event pools
About 12-15 events per book, drawn by state. Some examples, with what each reads:

| Pool event | Reads |
|---|---|
| A rival house's border quarrel | A house with standing 50+ and temper −5 or worse |
| An indebted house offers a daughter | A house with debt; your standing ±20 |
| The free company on the road | Peace after a war; your men |
| The bookish child and the tutor | A child aged 8-14, bookish |
| A heresy preached in the market (the Lollards as analogue) | Book II-III; Church reputation |
| A bad harvest | Weather roll; granary |
| A widow's suit for her dower | A dead brother or son |
| The old company's last man | Import `people[]`, a follower alive |
| A ransom owed from the last war | War result; prisoners |
| A pilgrim's relic (low magic) | Never confirmed |

### 6.6 The cast by book
| Book | Authored figures (6-10 each) |
|---|---|
| Prologue and Book I | Mahaut (31 in year 50); Thibaut de Brésy (about 45); Edwin of Adalia (38); Amaury VII (26); the new Bishop of Saint-Lys; Yann de Penhoët's son; the Kerguen heir; the founder's oldest companion (from the import, or generated) |
| Book II | Mahaut's heir; Edwin's grandson, the minor king grown; Amaury VII, ageing; the head of the Lanzi after the crash; the Sarenzan Pope; a commons captain (a Coker, if the family's line is alive in the export) |
| Book III | The claimants of the war of cousins; Amaury VII's sons; a Hroswald captain; the last Penhoët |

New names follow canon's naming conventions. Each figure gets a canon entry when written.

---

## 7. Endings
Computed at the end of Book III, or at extinction. The matrix is FRAME.md §5; this is the computation.

| Ending | Gate (in priority order) |
|---|---|
| **Extinct** | No heir at a succession, at any point |
| **The Name Struck** | The head is attainted and the house holds no land at the end |
| **A Foreign House** | The house's seat is outside the West and it has made no return in Book III |
| **A Royal Line** | The house holds a crown at the end, its heir is recognised (Church, or one of the kings), and the head is not attainted |
| **The Power in the Realm** | Standing 80+, not royal, the sovereign's crown strength 5 or less or the house married into the royal line |
| **An Old House** | Standing 40+, holds the lands it began Book III with, three generations kept it |
| **A Fallen House** | Everything else: alive, landed, smaller than the founder left it |

**Bot targets** (starting points):
- A Royal Line 5-8% of runs, and at least 2% from each frame.
- Extinct before Book III 15-25%.
- Every ending reachable from each of the nine starts it is allowed in.

---

## 8. Promises from Knight of Adalia
An imported start honours its own epilogue (FRAME.md §4). The ones the plan uses:

| KoA flag | Its epilogue said | House of Adalia keeps it by |
|---|---|---|
| `c5r_peace_bought` | The peace holds thirty years | No war with Valdrenne before year 75 |
| `c5r_peace_castle` | The castle's people never forgive it | A hostile holding, and a Book I event |
| `c5r_peace_marriage` | The Valdrennish marriage keeps the peace a generation | An heir married into Sauvel; peace to about year 70 |
| `c5r_no_peace` | The march burns ten years | Border raids every year to about 55 |
| `c5r_council_mahaut` | Mahaut's council outlasts you both | Mahaut's party governs Book I |
| `c5r_heir_crowned` | The heir crowned in the founder's lifetime | The Crowned prologue's question answered: the heir is king at the oath |
| `c5_liberties` | The West's liberties in the patent | Adalian Book I, Act II reads the patent |
| Heir upbringing `church` | "Becomes Bishop of Saint-Lys, the first born in the West" | The bishopric in about year 70, if the heir lives and is not the head |
| Heir temperament `bookish` | "Writes a chronicle of the West" | The Chronicle panel is "by" that child, in their voice |
| Exile with an heir | "One day goes home to the West under another king's peace" | The Exile opening's pardon offer comes to the heir |
| The wife alive at the end | "Outlives you by eleven years" | The founder's widow dies eleven years after the founder (STORY.md D8, or E3 in cloister runs) |
| `c5_betrothed_penhoet` | The second child "marries into Penhoët at sixteen, and runs that old house better than any Penhoët has" | Already married into Penhoët in year 50 (P6), and the natural power at Penhoët after Ronan's death (D5) |
| `c5_betrothal_refused` | The second child "chooses, at nineteen, someone you would never have chosen" | A love match in the prologue, about year 52 |
| `c5_betrothed_lanzi`, `c5_betrothed_brese`, `c5_surety_*` | The second child's other fates | P6's variants: Penhoët offers a lesser cousin or presses the suit |
| `c5_thibaut_king` | "Reigns eleven years and dies in the saddle" | Thibaut dies at Martinmas 52, and the Estates choose his successor (P8) |
| `c5_mahaut_queen` (Kingmaker) | "Queen Mahaut of the West reigns thirty-one years" | Mahaut dies about year 73 in every run |
| Mahaut not married to the founder | "Marries, in the end, a lord of the Armance, whom she chooses herself, and writes to you every Christmas" | Sire Riwal de Kerguen, killed in 44; her letters, and the last one after her death (E9) |
| Davy Ludd, Will Cobb, Wat Coker | Their deaths at seventy, at a hundred, and free on his own holding | The old company's deaths as the epilogue says (P2) |
| The Founder ending | "Four kings and two plagues and a civil war" | The Second Mottle is one plague; the civil war is Book III's war of cousins |

The continuity checker gets one rule per promise.

---

## 9. Content budget and writing rules

### Budget
| Part | Scenes (spine + pool) | Words, with frame variants | A run sees |
|---|---|---|---|
| Prologue | 14 + 4 | 25-30k | 14 |
| Book I | 45 + 14 | 75-85k | ~32 |
| Book II | 45 + 14 | 75-85k | ~32 |
| Book III | 45 + 14 | 75-85k | ~32 |
| Epilogue and chronicle | builder + 40 deeds | 10k | 1 |
| **Total** | **about 235** | **about 270-300k** | **about 110** |

Knight of Adalia is about 295 scenes, so this is the same order of size. Frame variants (FRAME.md §7): about 40% of spine scenes need a whole variant, 40% need inline branches, and 20% are frame-neutral. If the budget runs short, Book II's variants become inline branches first.

### New writing rules (added to the style guide when approved)
- **Pronouns.** For a head of house, write `{he}` `{his}` `{He}` and let the engine render them (engine, built). A lint flags a bare "he" or "his" in a scene that refers to the head.
- **Kinship.** Name relations from the head's point of view: "your father" in Book I is the founder. A continuity rule checks kin words against the family tree.
- **Time skips** are bridged in prose, as in KoA. A book opens with the new head, not with a summary.
- **The dead stay dead.** KoA's dead-name rule is extended to generated family.
- **Voice.** KoA's house voice, unchanged: talk, the body, the chorus, warmth and humour, kit and colour.

---

## 10. Build order
The framework is done (steps 1-3). Step 4, the slice, is split so the hardest engine work is proven on the least prose.

| Step | What | Gate |
|---|---|---|
| **4a. Family and succession** (done 2026-10-06) | Characters for the whole family (kinship; selectors `head`, `heir`, `spouse`, `father`, `mother`, `eldest`, `second`, `third`, `youngest`, `bastard`, `regent`, `will`, `news`; pronouns for each); births, deaths and the mortality table (`content/registry/life.yaml`); news scenes for every death, birth, match and majority; the Michaelmas tick; succession under the three laws, with wills, regency, legitimation, stepping down and extinction; play passing to the heir; the chronicle paragraph (`content/registry/chronicle.yaml`) | Unit tests; `npm run house:life`, which plays 75 empty years from every start (results below) |
| **4b. The prologue** | The 16 scenes of `STORY.md` (P1-P16) for the **Founder** opening in **free and Adalian** frames, fresh and imported; matches (first use); the ledger; the House panel | Validator, frame rule, continuity, a transcript per frame, the author's playtest |
| **4c. Book I, Act I** | The New Lord, both frames; two rival houses (Penhoët, Kerguen) as state | The same, plus bot balance of standing and money |
| **5. Systems** | Houses (all ten), the realm, war, the Church | Bot: standing spread, war outcomes, debt |
| **6. Breadth** | The other openings and the divided frame for the prologue and Book I | Every start reaches the end of Book I |
| **7. Books II and III** | Act by act, each with a bot pass and transcripts | Every ending reachable from each start it is allowed in |
| **8. The full interface** | House, Ledger, Realm, Chronicle panels; map borders; autosave and save codes; the installable app | Smoke test on phone and desktop |

**Testing.** Every step keeps Knight of Adalia's fingerprint unchanged (no change in play), and House's `npm run house:check` green.

### Step 4b progress (2026-10-08): the prologue is written
- **The scenes.** All of `STORY.md`'s P1-P16 are written for the Founder opening, free and Adalian frames, fresh and imported:
  - `content/scenes/prologue/10-old-lord.yaml` (the founder) and `20-heir.yaml` (the heir);
  - `content/events/prologue/pool.yaml` (three pool events);
  - the summons splits by frame into the Estates (free), the election after Thibaut's death (free, under Thibaut) and the patent (Adalian).

  The other openings still start at the framework scene `h_open`.
- **Built for it:**
  - the `founder`, `dowager` and `sibling` selectors;
  - the `{house.*}` text: the manor, the manor Penhoët claims, the Old Companion, the founder's origin, and "your father/mother";
  - the prologue's hold on the odds (STORY.md L3-6);
  - the handover's manner (`family.cloister`), so stepping down at home is not told as the cloister;
  - `marry` with a named spouse (Ronan de Penhoët);
  - King Gaucelin as a sovereign;
  - the validator accepts `add:` on selector paths (heir.bond, heir.skill.*), which the engine already supported.
- **Matches.** The prologue suspends the automatic yearly match offers. Its matches are the story's own: Penhoët's offer is the first.
- **Stand-ins until step 5:** counters `shadow`, `household`, `favour`, `penhoet` and `second`, and `h_*` flags (declared `later: book1`). They stand for rival-house state, the realm's law and the sibling's allegiance.
- **Gates passed:**
  - validator and frame rule: 0 errors;
  - continuity --strict: 0 problems;
  - bot: 340 runs, 0 failures;
  - `tests/prologue.test.ts`: every frame and sovereign, a female founder, the cloister, and imports from every Knight of Adalia plan that ends as Founder;
  - Knight of Adalia's fingerprint is unchanged.
- **Transcripts:** `docs/transcripts/prologue-act1-free.md` and `prologue-act1-adalian.md` (the prologue and Book I, Act I), made by `npm run house:transcript` (`--frame`, `--sovereign`, `--seed`, `--sex`).
- **Still open in 4b:**
  - the match system proper (offers, terms, named houses);
  - the ledger and the House panel;
  - the author's playtest.
- **Known gaps:**
  - a founder who married Mahaut in Knight of Adalia (`c5_married_mahaut`) gets no variant prose yet;
  - an imported Old Companion is assumed to be a man.
- **Playtest link:** a private claude.ai Artifact built by `npm run house:build:artifact`. Its notes box saves to the page's store (collection `notes`) for Claude to read back.

### Step 4c progress (2026-10-08): Book I, Act I is written
- **The scenes.** STORY.md's B1-B12 are written for the Founder opening, free and Adalian frames: `content/scenes/book1/10-new-lord.yaml`, with two pools in `content/events/book1/pool.yaml`.
- **Routing.** The beats a run does not have are skipped:
  - the suit, if the prologue settled it;
  - the sibling's grievance and match, if there is no sibling;
  - the abbot's letter, if the founder did not take the cowl.

  Every scene sets its own date with `catch_up`.
- **Outcomes:**
  - the Kerval verdict is mostly fixed (L3-10): the charter sets it, and the court check moves it one step;
  - the Keeper's match marries by name (Azenor or Tanguy de Kerguen, Cecily or Hamon Hales);
  - `c5r_peace_marriage` brings the Sauvel spouse over the hills instead.
- **Built for it:**
  - the `house.yvon` and `house.vassals` conditions;
  - `{house.knights}`, `{house.withholder}` and `{house.parent_word}`;
  - the founder's children marry only by the story while Book I is played (the empty-years harness is unchanged);
  - character ages are written in words past twenty.
- **Tests** in `tests/prologue.test.ts`: the four Kerval verdicts, the settled suit skipped, the Keeper's match and no odds' matches for the founder's children, the Sauvel import, and every frame and sovereign to the end of Act I.
- **The crowned path** (STORY.md, L3-24 to L3-33) is written for the prologue and Act I:
  - `scenes/prologue/30-crowned.yaml` and `scenes/book1/20-crowned.yaml`, with the Crowned opening's `eldest` house law;
  - the Mahaut import rules;
  - the bot plays it as `crowned/free/self+mahaut`;
  - `npm run house:transcript -- --mahaut` writes `docs/transcripts/crowned-mahaut.md`.
  - it reads the Keeper's sex and Knight of Adalia's elective crown; the author's own save (`tests/fixtures/author-crowned.koad`, King David, Mahaut and Jehan) is tested to the end of Act I, and `npm run house:transcript -- --save <file>` plays any save (`docs/transcripts/crowned-author-save.md`).
- **Depth and carry-over** (2026-10-08, the author's decisions):
  - **The calendar:** the Church's years of grace with the sovereign's year ("Summer 912, the second year of King David"), through the engine's `date` hook. The old count stays in docs and canon.
  - **Hints and results:** the tested skill, "At stake", mortal danger, and the cause line before a choice. After it, the story tracks and relationships in words ("Penhoët: colder"), through the engine's `changeNote` and `checkLabel` hooks.
  - **Panels:** Status, House, People, World (22 lore entries) and Journal (`src/ui/Panels.tsx`).
  - **The economy:** Knight of Adalia's rules and prices (`src/game/economy.ts`). The import carries lands, knights, standing, honour, ruthlessness, piety, and the great folk's feelings. Children's qualities come from temperament and upbringing.
  - **New starts:** questions build a dynasty export and go through the import (`src/game/setup.ts`, `tests/setup.test.ts`).
- **The gate: rival houses as state, and the bot's balance** (2026-10-08):
  - **Rival houses** (`registry/houses.yaml`, `src/game/houses.ts`). Penhoët and Kerguen have heads by date, standing, temper toward the house and a claim. Content reads `rival.<house>.*` and `house.standing`; the old `counter.penhoet` is gone. Kerguen rises a point a year, and a Penhoët at temper -4 or worse moves against the house (`h_b1p_penhoet_feud`). The house's own standing is derived (§4.3).
  - **The economy, finished to §4.3 and §4.6:**
    - castle repairs at £5 a point of defence;
    - the Lanzi's interest at 10%;
    - dowries at the sibling's match;
    - the Founder's honour of Kerval (£160, Knight of Adalia's great lord's honour);
    - crown-sized prices on the crowned path (five times higher).
  - **`npm run house:balance`** (in `house:check`): every start × treasury, 12 runs each. Results (medians):

    | Start | Income a year | Clear a year | Coin at the end of Act I | Standing |
    |---|---|---|---|---|
    | Founder, free West | £256 | £202 (£177 in debt) | £1,704 | 53, a great house |
    | Founder, Adalian West (Earl of the March) | £858 | £743 | £6,044 | 73, one of the great houses |
    | Crowned, with Mahaut | £708 | £564 | £4,617 | 86, the greatest in the West |
    | The author's save | £794 | £580 | £7,836 | 100 |

    Penhoët's temper ends anywhere from -4 to +7 across runs, and Kerguen's standing from 30 to 40. No comfortable start loses money or leaves its men unpaid. Money locks about 1% of choices, and only for starts in debt.
  - **The finding:** Act I spends little against a great house's surplus, so the purse grows about eightfold by its end. Act II's spends (§4.6: building, dowries for the Keeper's children, war wages, the Lanzi) are where money must bite; or Act I's household share rises to §4.6's 15%. That is for the author (`docs/STORY.md` decisions).
- **Income that moves, and investments** (2026-10-08, the author asked for both):
  - **The year's luck** (`economy.ts`), fixed by the seed and the year, so no dice are drawn:
    - the harvest (failed 6%, poor 20%, fair 48%, good 20%, rich 6%) moves rents and the barn;
    - the trade (slack, steady, brisk) moves salt, markets, tolls and customs;
    - the crown's revenues move with both, fees with neither;
    - war (`war` effect, `realm.war`) cuts the trade and lets raiders reach a manor, the likelier the weaker its walls;
    - a plague year kills 8% of the village (15% was too heavy against Act III's scenes);
    - a granary halves hunger.
    - The average is a fair year. A Founder takes £158-£344 at Michaelmas, a crown £535-£924.
  - **Investments** on Knight of Adalia's purse-scene model and prices: each work once, revisitable, through `estate.*`, `hold` and `holding.*`.
    - The Founder: *The Steward's List* in the prologue (salt pans or orchards, seed and plough-teams, a granary, a market charter, walls, men-at-arms, an almshouse) and *The Keeper's Accounts* in Act I (a toll bridge, the church in stone, a cider press, a loan to Kerguen, a granary, a village watch).
    - The crown: *The Crown's Works* (the salt road, the Sauvemer quay, a mint, the march castles, granaries, a school for clerks) and *The Council of Works* (the Lannec fair, Lannec's walls, the salt cogs, a loan to Kerguen, a hospital, granaries).
- **Book I, Act II is written** (2026-10-09): the Founder's C1-C11 in both frames and under King Gaucelin (`scenes/book1/30-the-law.yaml`), the crowned path's K1-K11 (`scenes/book1/40-crowned-law.yaml`, STORY.md L3-34 to L3-37), and two pools (`events/book1/pool-law.yaml`). The threshold is `counter.overturn` at six with `counter.allies`; the realm's law is a flag (`h_realm_*`, `h_wardship_*`, `h_crown_*`). The companies' summer and Bertrand's rising put the realm at war for a season. A `borrow` effect lets content lend and repay.
- **Book I, Act III is written** (2026-10-09): the Founder's D1-D11 (`scenes/book1/50-the-mottle.yaml`), the crowned path's M1-M11 (`scenes/book1/60-crowned-mottle.yaml`, STORY.md L3-38 to L3-41), and a shared pool (`events/book1/pool-mottle.yaml`). The Mottle is `flag.plague` and `flag.plague_children` (`registry/life.yaml`); the answer to the sickness sets the family's odds. Under a crown for life the Estates choose the successor (`h_crown_estates`), and a lost vote makes the house a great house again (`h_crown_lost`). A child dies in 54% of the bot's runs with young children; the house ends in about 2%.
- **Book I, Act IV is written** (2026-10-09), so Book I is complete: the Founder's E1-E13 (`scenes/book1/70-the-test.yaml`), the crowned path's N1-N12 (`scenes/book1/80-crowned-test.yaml`, STORY.md L3-42 to L3-45), and a shared pool (`events/book1/pool-test.yaml`). New: Queen Jehanne as a sovereign; young Yann as Penhoët's head after year 72; the `adopt` effect; `family.head_from`; the engine's at-once interrupt for a succession queued by a scene's entry; act cards that read the state; no repeated names among living siblings. The bot ends Book I with £4,000-5,000 in a Founder's strongroom and £12,000-13,000 in the crown's: Book I's later acts have too few places to spend, a balance question for Book II's builder.
- **Still open:**
  - Knight of Adalia's followers other than the great folk (Davy Ludd and the old company) are text only (`{house.companion}`);
  - the rival-house state (`counter.penhoet` stands in);
  - the vassals as state (homage terms are flags);
  - a later match for a Keeper who put marriage off (`h_b_wed_later`), which Act II must offer.

### Step 4a results: the odds alone (`npm run house:life`, 75 empty years from every start)
| Measure | Result | Reading |
|---|---|---|
| Runs, failures | 102-170, 0 | Every start reaches year 125 |
| Heads per run | 3.7-3.9 | Three generations and often a fourth, as planned |
| Successions to a woman | 19-24% | Close to history (about a quarter of English baronial lines passed to heiresses) |
| Runs with a minor succeeding | 17-20% | A regency in about one run in five |
| Family | about 63 characters, peak 24 living | Large, because every member of the house who comes of age is offered a match |
| Save size | 48 KB average, 74-99 KB largest | Within budget; save codes will be long (a step 8 item) |
| **Extinct before Book III** | **0%** | **Below the 15-25% target** (see below) |

**Extinction comes from the story, not the odds.** With these fertility and mortality numbers, a house that follows every son's and daughter's line almost always has an heir. Three ways to reach the target, in the order recommended:
1. **The story's own deaths:** wars and battles, the Second Mottle, attainders and executions, sons in the Church, and younger sons who never marry. The empty-years harness has none of these; the books do. Measure again once Book I exists.
2. **Matches, not universal marriage:** step 4b's match system replaces the harness's offer to every member at seventeen. Historically, many younger sons and some daughters never married.
3. **Only if 1 and 2 fall short:** a lower fertility or a narrower line of heirs (no claims beyond second cousins).

---

## 11. Decisions for the author
| # | Decision | Recommendation |
|---|---|---|
| 1 | **The founder's end.** Does the prologue always end with the founder dying, or may he step down into a religious house? | Both; the player chooses. The prologue always ends with the handover. |
| 2 | **Mortality.** Use the table in §4.1 (moderate, with named children of five and more never dying off-screen)? | Yes. Historical rates would empty families before the player knows them. |
| 3 | **A contested succession.** When the law and the head's will disagree, who does the player become? | The law's heir. The player can contest it in the succession scene, and that is a crisis with a sibling as the rival. |
| 4 | **Heiresses.** A daughter who inherits: does the player play her, with her husband holding by courtesy, as English law had it? | Yes, the player plays her. Her husband is a character whose ambitions are a Book's problem. |
| 5 | **Book spans.** About 23-25 years each, four acts per book, as in §2? | Yes. |
| 6 | **The Schism and the Lanzi crash** as Book II's third act? | Yes. They make matches (dispensations) and debt matter in the same act. |
| 7 | **The rival roster** in §4.4, drawn from KoA's cast? | Yes. It pays off KoA and saves inventing ten houses. |
| 8 | **The slice split** (4a family and succession first, on no prose)? | Yes. Succession is the hardest engine work and the heart of the game. |
| 9 | **Exile's host.** For a fresh Exile start, does the player pick where the house lives abroad? | Yes, from the five KoA allows (Sarenza, Hroswald, Caldmoor, Adalia, Valdrenne). An import takes it from the export. |
| 10 | **Additions to canon.** The Sarenzan Pope, the Second Mottle in year 63, Edwin's death in about year 64, Amaury VII's madness. Approve them into a House of Adalia canon file? | Yes. |

---

## 12. Risks
| Risk | Why it matters | Mitigation |
|---|---|---|
| **The prose budget** | 270k words is a KoA-sized book again | Variants by frame only where the premise differs; pools carry the variety; Book II's variants shrink first |
| **Attachment across generations** | Players love the founder and shrug at the grandchild | Each heir's childhood is played in the parent's book; the bond and upbringing choices; the chronicle shows what they became |
| **Death spirals and snowballs** | A rich house gets richer; a broken one never recovers | Partible law and dowries drain the rich; matches and offices lift the poor; the bot measures the standing spread per book |
| **Off-screen deaths feel cheap** | A child gone between acts | Every death is a narrated event; named children of five and more die only in scenes |
| **Complexity creep** | Ten houses, a realm, war, the Church | No AI; houses act through gated events; any system nothing reads is cut |
| **Continuity across three frames** | The KoA lesson, times three | The frame rule (built), the kinship rule and the promise rules, all in CI |
