# Branches, Paths and Continuity

The map of the story: where it forks, what each fork remembers, and who can be dead by when. Read this before writing any line that mentions a person, a place or an earlier choice. File references are relative to `content/`; `S/` is `scenes/`, `E/` is `events/`.

`npm run continuity` checks the rendered text of a few hundred runs against `content/continuity.yaml` and against the kill table below. It runs in `npm run check` and in CI. A new rule goes in that file whenever a fix here could regress.

---

## 1. The spine, chapter by chapter

### Prologue (ages 8 to 15)
- Start scene by background (`backgrounds/<bg>.yaml`): `p_<bg>_open` → `p_<bg>_home` → shared `p_hungry_year` → `p_knight` → `p_learning` → `p_midsummer` → `p_rival` → `p_gate_router`.
- **Fork, the Patronage Gate** (S/prologue/03-gates.yaml): one gate per background. Pass goes to `p_leaving` on the squire track. Fail goes to `p_gate_failed`, where the player picks the household track (master Hamon) or the levy (master Ancel).

### Chapter 1 (ages 15 to 21)
- `c1_arrival` → `c1_first_night` → `c1_duties` → `c1_squires` → pool → `c1_winter`.
- **Fork, by master:** `c1_trouble_hamon` or `c1_trouble_ancel`; later `c1_crisis_hamon` or `c1_crisis_ancel`.
- **Fork, Leven raid:** a strong showing leads to `c1_prisoner` (Coll: hang, free, ransom or give up). Carrying the Wyck sword opens `c1_wyck_widow`.
- **Fork, the crisis** (S/ch1/05-crisis.yaml). The player may:
  - defend the master;
  - abandon him for Walter Pryce;
  - fail him (Hamon falls, or Ancel rides to his death).

  The reeve's son whose father skims gets `c1_crisis_father`. A lost master leads to `c1_new_patron`: Ravell, Ancel, Hamon or Pryce.
- **Fork, the war comes** (S/ch1/06-war-comes.yaml). A squire with the means is knighted (`c1_knighting` → `c1_dubbing`). Everyone else goes to `c1_man_at_arms`, a man-at-arms under a sponsor's promise.

### Chapter 2 (ages 21 to 26): the first war
- A linear march: following, crossing, landing, Grisolles (rearguard), the retreat, the siege of Sauvemer, Les Salines, the truce.
- **Fork, at the truce:** the player goes home to Adalia (`c2_home`, which needs 240d) or stays for the grants.
- **The grant** (S/ch2/05-truce.yaml), computed from renown and fame:
  - **Marsalin:** salt marsh, dyke, stone house. 300 people.
  - **Kerval:** Armance hills, orchards, mill, fortified farm. 250 people.
  - **Ormel:** marsh, church and tithe barn, "the grant nobody wanted". 200 people.

### Chapter 3 (ages 26 to 32): the manor
- **Act I, the Mottle:** stay or flee at `c3_arrival`, then the measures, the household death, letters home, harvest, the reckoning. The plague takes 25 to 42% of the manor.
- **Act II, lordship:** ordinance, settlers, claimant, truce ends, border raid, Rotbart's masterless men.
  - **Fork:** temper ≤ −3 leads to `c3_unrest`.
- **Act III, the match:** `c3_match` with a suitor, or `c3_unwed`. The wedding, first year, lying-in, then childbed, which can kill the wife.
- **Act IV, the reckoning.** Two forks run in order:
  1. Lanzi paper against the land leads to `c3_paper`. Otherwise the commons rise: ride to the Hythe Fields (`c3_rising`) or hear of it (`c3_rising_far`).
  2. **Fork, the March:** Ewan's vendetta, Coll's repayment, or quiet.

  Then the house of Ravell sells up, the winter fever (if there are children), the Vervais secret, and a second child (if the wife is alive).

### Chapter 4 (ages 32 to 42): four acts with time skips
- **Act I, the second war:** council, home, the company (credit, good, manor or Rotbart), the landing, the towns, the winter, Carrow, Mortefontaine, the grant.
- **Act II, many places:** stewards, the rival returns, the eldest child, Christmas, a third child (can kill the wife), salt, Mahaut's council.
  - One background secret scene is queued at the stewards and fires a season or two later: `c4q_steward` (reeve with `steward_skims`), `c4q_old_note` (burgess), `c4q_carn_dubh` (archer), `c4q_ravell_heir` (servant).
  - **Fork:** a widower who did not ask for Mahaut is offered Dame Blanche de Kerguen (`c4_widow`).
- **Act III, fracture:** the old master's deathbed (or Father Benet's), the King's death, Carrow rises.
  - **Fork:** side with the West (`c4_west_war`), or fight at Wythen Heath for Edwin.

  Then Valdrenne, then Lannec.
- **Act IV, the summons:** the barony, Mahaut's answer (if courted), the writ.

### Chapter 5 (age 42 on): the crown
- The Estates of the West, the vote, the war, the bridge.
- **Fork:** war lost leads to `c5_defeat`; the West free leads to `c5_recognition`; otherwise `c5_kings_reward`.
- **The ending switch, `c5_chronicle`:**
  - exile;
  - ruin;
  - **crowned:** he crowned himself, with pillars ≥ 2, recognition, the war not lost, and an heir or spouse;
  - **kingmaker:** estates ≥ 8 or a decisive host;
  - **founder:** great lord, with the eldest alive and 14 or older;
  - otherwise **diminished**.

---

## 2. Identity state: what makes one run different from another

| State | Set where | Values |
|---|---|---|
| `background` | Character creation, never changed | reeve, burgess, archer, servant (with role) |
| `alias.rival` | Background file | Wat Coker, Jocelin Tanner, Gib Shawe, Aymer Ravell |
| `alias.master` | Prologue gate; reassigned in Ch1 at the crisis, by `c1_new_patron`, at the Carrow dubbing, and at `c1_man_at_arms` if the master fell | Hamon Darrell, Ancel Brome, Walter Pryce, Thurstan Ravell |
| `track` / `station` | Gate; Ch1 raid, tourney or fever; knighting in Ch1 or Ch2; lord at the grant; great lord in Ch4 Act IV or Ch5; royal at the vote | commoner → retainer → squire → knight → lord → great lord → royal |
| Grant | `c2_grants` | `c2_granted_marsalin`, `_kerval`, `_ormel` |
| Followers | Join at `c2_following` (Davy always; master's archers, or a man from home; Tallis if hired). Wat leaves at the rising. Random casualties after Ch2 | npc.*.follower and npc.*.alive |
| Force | `res.men` (company), `res.garrison` (Rotbart's sixty), `res.levy` (trained villagers) | Status panel shows all three |
| Spouse | `alias.spouse` at `c3_match`; Dame Blanche for a widower at `c4_widow`; Mahaut in Ch5 | Can die at childbed, the second child, or the third |
| Heirs | Born in Ch3 and Ch4; named, often after the dead (Hamon, Piers, Agnes...) | Can die of the fever, at Wythen, or in Ch5 |
| Kin at the manor | `c3_sent_for_kin` | Reeve: sisters. Burgess: mother. Archer: Kit. Servant: Nell or the mother's people |
| Manor size | `estate.people`; `estate.founded` at the grant; `estate.recovery` is the percentage of the founding size | Use `estate.recovery` for any comparison with the past |

---

## 3. Who can die, and where

| Person | Killed at (condition) |
|---|---|
| Ancel Brome | Ch1 crisis: "pryce" choice, failed ride, or "back" |
| Coll of Glenhallow | `c1_prisoner`, the hang choice |
| Aymer Ravell or Will Cobb | Grisolles rout or Les Salines: Aymer if he is a friend, otherwise Cobb |
| Hamon Darrell | Lannec winter, if he was the master and was taken |
| Simkin Barre | `c2c_barre` (camp pool) |
| Hugh Fletcher | Archer's queued family event, can fire in Ch3 |
| Piers, Ralf, Agnes (the parent) | `c3_letters`, by background, always |
| Wat Coker | The Hythe Fields (unless Will Coker leads), or as a follower |
| The master or Father Benet | `c4_master`: the master if still alive, otherwise Benet |
| Duchess Jehanne | Ch4 Act II |
| Enguerrand de Vaux | Les Salines |
| Any follower | Random battle casualties. Davy is spared in Ch2 only |
| The wife | Childbed (chance), second child, third child |
| Heirs | Winter fever, Wythen Heath, the Ch5 war |

Never killed: Thibaut, Mahaut, Ulric Rotbart, Ewan, Isabel, Maud, Joan, Anselm.

---

## 4. Things the prose must not assume

Before mentioning a person, place or earlier choice, check:

1. **The master may be dead,** and there may have been two or three of them. Use `{npc.@master}` and guard with `npc.@master.alive`.
2. **The grant is one of three.** Dykes and salt pans are Marsalin; orchards and the mill are Kerval; the marsh church is Ormel. Name the grant only after `c2_grants`.
3. **Anyone in the kill table may be dead.** Guard with `npc.<id>.alive`, or write the line so it is true either way.
4. **Children are named after the dead.** "Hamon is five" is the son. Use `{heir.eldest.name}` and the heir paths.
5. **Kin may have moved to the manor** (`c3_sent_for_kin`). They do not write letters from home after that.
6. **The servant's mother may have been dismissed** (`p_mother_dismissed`), or bought off with the household secret (`p_used_secret`).
7. **Davy is dead, married to Aude, knighted, or still in the household.** These are exclusive. A man still in the household does not "ride in".
8. **Wat may have died abroad.** Will Coker then leads the rising in his name (`c3_will_leads`).
9. **Compare with the past by ratio, never by raw count** (`estate.recovery`, not `estate.people >= N`).
10. **Outcome text renders after its effects.** A death the outcome narrates has already happened in the state.
11. **Pool events can fire late.** A camp pool event can come after Grisolles, so guard anyone who might have died there.

When a line is fixed, add a rule to `content/continuity.yaml` so the fix stays fixed.
