# Content Authoring Reference

All game content lives in `/content` as YAML. `src/content/schema.ts` (Zod) is the authoritative schema. This file documents it for writers. `npm run validate` and `npm run lint:style` must pass before committing content.

## Files
| Path | Holds |
|---|---|
| `config.yaml` | Attributes, skills, stations, tracks, seasons, chapters, start year |
| `registry/flags.yaml` | Every flag, with a description. `hidden: true` keeps it out of the UI. |
| `registry/npcs.yaml` | Every named NPC: name, title, faction, starting affection/respect, notes |
| `registry/traits.yaml`, `injuries.yaml`, `items.yaml` | Labels, descriptions and stat `mods` (e.g. `skill.arms: -2`). Injuries have `heals_after` (seasons; omit for permanent) and an optional `scar` trait. |
| `registry/factions.yaml` | Reputation tracks. `kind: faction` ranges -10..10; `kind: personal` (honor, ruthlessness, piety) ranges 0..10. |
| `registry/endings.yaml` | Endings. `chapter` says when the validator starts demanding they be reachable. |
| `registry/romances.yaml` | Romance candidates (Phase 2+) |
| `backgrounds/*.yaml` | Starting backgrounds |
| `scenes/<chapter>/*.yaml` | Spine scenes. A file holds one scene or a list of scenes. |
| `events/<chapter>/*.yaml` | Pool and queued events, same format |

## Scene
```yaml
- id: c1_tourney_lists          # lower_snake_case, unique across all content
  chapter: ch1                  # one of config.chapters
  kind: spine                   # spine | pool | queued | ending
  title: The Lists at Ravell
  tags: [martial, court]
  requires: [ station >= squire ]   # pool/queued: eligibility. spine: documentation only.
  pool: c1_summer              # pool scenes only: which group they belong to
  weight: 10                    # pool scenes only: draw weight
  once: true                    # pool: never repeats (default true)
  cooldown: { seasons: 2 }      # pool, when once: false
  checkpoint: true              # save fallback point if content changes
  on_enter: [ ...effects ]      # applied on arrival
  text: |
    Passage text. Blank line = new paragraph.
  variants:                     # optional: full replacement text per background
    archer: |
      ...
  choices: [ ...choices ]
```
- **Spine** scenes form the authored backbone and link by `next`.
- **Pool** scenes are interludes. They are drawn by a spine choice's `next: { pool, count, then }` and must end with `next: "@return"`.
- **Queued** scenes are delayed consequences, scheduled by a `queue` effect. They fire before the next scene once due, then `@return`. They do not change the chapter.
- **Ending** scenes have `ending: <registry id>` and no choices.

## Choice
```yaml
- id: bribe                       # unique within the scene
  text: Press a coin into the porter's hand.
  tags: [wealth]                  # approach: martial, cunning, diplomacy, wealth, allies, learning, piety, yield...
  requires: [ res.coin >= 12 ]    # visible; shown locked with "Requires Coin 1s" when unmet
  label: "Requires: the porter's trust"   # optional override for the lock text
  visible_if: [ flag.knows_porter ]       # hidden entirely when unmet
  lethal: true                    # can kill; needs `warn` and a `check`
  warn: The porter's dogs are loose.
  # without a check:
  text_after: Outcome text.
  effects: [ ...effects ]
  next: c1_gatehouse
  # with a check (text_after/next go in the outcomes):
  check: { attr: presence, skill: diplomacy, difficulty: 4, audience: knights, mods: [ { if: flag.x, add: 1, label: "he owes you" } ] }
  success: { text: ..., effects: [...], next: ... }
  partial: { text: ..., effects: [...], next: ... }   # optional; falls back to failure
  failure: { text: ..., effects: [...], next: ... }
```
**Rules the validator enforces**
- Every non-ending scene has at least one choice with no `requires` and no `visible_if`. The player is never left without an option.
- `die` effects only appear in outcomes of `lethal` choices.
- Every lethal choice has a `warn` and a `check`.

## Checks and odds
- Score = effective attribute + effective skill + audience modifier + situational mods − difficulty.
- Chance of full success = 50% + 10% per point of score, clamped to 5–95%. A further 15% band above that is partial success.
- The UI shows a band, never a number:
  - **Risky**: under 40%
  - **Even**: 40–65%
  - **Favorable**: over 65%
- `audience` applies the "new man" prejudice:
  - `nobles` and `knights`: a penalty of about half the prejudice score;
  - `clergy`: a small penalty;
  - `commons` and `merchants`: a small bonus.
- Difficulty guide: 2 easy, 3 ordinary, 4 hard, 5 very hard, 6+ desperate.

## Conditions
Conditions are strings. A list means all must hold. Combine them with `{ all: [...] }`, `{ any: [...] }` or `{ not: ... }`.

```
flag.met_aldric          !flag.disgraced         counter.debts >= 2
attr.wits >= 3           skill.diplomacy >= 4     (effective values: injuries, traits and items count)
rep.knights <= -2        rep.honor >= 5           res.coin >= 240 (pence)   res.renown >= 10
rel.hamon_darrell.affection >= 3   rel.X.respect   rel.X.loyalty   npc.X.met   npc.X.alive
favor.hamon_darrell >= 1
trait.literate_vernacular   injury.broken_hand   item.yew_bow
station >= squire        track == levy           background == reeve      role == huntsman
chapter >= ch1           calendar.season == winter   calendar.year >= 15   age >= 16   health <= 3
suit.X.status >= courted   suit.X.regard >= 3   suit.X.pledge == token
prejudice >= 3
```
Station, chapter, season, suit status and pledge compare by their order. For example, `station >= squire` is true for a knight.

## Effects
```yaml
- set: flag.x                     # and: clear: flag.x
- add: { skill.arms: 1, rep.knights: -1, res.coin: -24, rel.hamon_darrell.affection: 2, favor.hamon_darrell: 1, counter.debts: 1, health: -2, suit.x.regard: 1 }
- assign: { track: levy, suit.x.status: courted, chapter: ch1 }
- trait: +hot_tempered            # or -hot_tempered
- item: +yew_bow                  # or -yew_bow
- injury: broken_hand             # heal: broken_hand
- station: squire                 # optional track: squire_track
- meet: hamon_darrell             # kill: hamon_darrell
- queue: { event: c3_wat_returns, delay: { seasons: 6 }, earliest_chapter: ch3 }   # fires once due AND that chapter is reached
- advance: { seasons: 1 }         # ages the character, heals injuries
- journal: "A line for the journal."
- die: "Cause of death, shown on the ending screen. Takes {variables}."
```
Clamps:
- attributes 1–6;
- skills 0–10;
- faction reputation −10..10, personal 0..10;
- relationships −10..10;
- coin never below 0;
- health 1–10 (health alone never kills).

## Text
- `{name}`, `{date}`, `{coin}`, `{station}`, `{background}`, `{season}`, `{year}`, `{age}`
- `{npc.hamon_darrell}` gives the name; `{npc.hamon_darrell.title}` gives "Sir Hamon Darrell".
- Any condition path, for example `{skill.arms}`.
- `[if cond]...[elif cond]...[else]...[/if]`, which can be nested.

## Backgrounds
See `backgrounds/reeve.yaml`.
- `random_flags` picks one flag from each group with the game seed. This is how the reeve's hidden backstory is decided.
- `roles` defines sub-choices, such as the servant's huntsman, falconer or horse-master.
- `prejudice.base` and `prejudice.knights` set the starting "new man" prejudice.
