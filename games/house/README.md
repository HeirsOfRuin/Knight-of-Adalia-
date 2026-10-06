# House of Adalia

The sequel to Knight of Adalia: a house across three generations, from the founder's last years to his great-grandchild. The design is in `docs/FRAME.md` and the detailed gameplay and story plan in `docs/PLAN.md` (both approved). Canon additions are in `content/canon.md`.

## What is built (the framework)
- **Content** (`content/`): config, registries, the six **openings** (`openings/`), the three **frames** of the West and the **sovereigns** who rule it (`registry/frames.yaml`, `registry/sovereigns.yaml`), the seven endings, and one scene that shows each frame its own text.
- **Game module** (`src/game/module.ts`):
  - paths `realm.west`, `realm.sovereign`, `realm.changes`, `opening`, `imported`, `inherited.<knight flag>`;
  - text `{realm.sovereign}` `{realm.capital}` `{realm.border}` `{realm.assembly}` `{realm.law}` `{realm.frame}`;
  - the frame as the scene variant key (`variants: { adalian: ..., partitioned: ... }`);
  - the `west` effect, for when the West changes hands;
  - dates counted in the sovereign's reign ("Spring, year 9 of Queen Mahaut").
- **Starts** (`src/game/index.ts`): `newGame` from an opening, a frame and a sovereign, checked against the nine combinations. `fromDynasty` (`src/game/import.ts`) continues a Knight of Adalia life from its dynasty code. Saves are `house-of-adalia-save` version 1, with codes beginning `HOA1.`.
- **The frame rule** (`tools/frames.ts`, FRAME.md §7): a phrase bound to one frame (`bound:` in `registry/frames.yaml`) may only appear in text that can show in that frame. The validator checks it statically, through variants and `[if realm.west == ...]` branches. The continuity checker checks it in play. A scene's `frames:` limits it to some frames, and the bot fails a run that enters it in another.
- **Tools** (`tools/`): validate, bot (every start), continuity, build-content; all on `packages/tools`.
- **App** (`src/ui/App.tsx`): a minimal one, enough to try every start and an import.
- **The family and the succession** (`src/game/family.ts`, PLAN.md §4.1-4.2, step 4a):
  - **The family.** Every member of the family is a character, named in content by selectors (`head`, `heir`, `spouse`, `father`, `mother`, `eldest`, `second`, `third`, `youngest`, `bastard`, `regent`, `will`, `news`), with paths like `heir.age` and pronouns like `{heir.He}`. A fresh start generates the founder's spouse and children; an import brings the life's wife and children.
  - **The year.** Each Michaelmas, the odds in `content/registry/life.yaml` bring deaths, births, matches and majorities. Each is told in its own news scene (`h_q_news`).
  - **The succession.** A head's death, or stepping down, queues it (`h_q_succession`) ahead of everything else. The heir is found under the house's law (`male_line`, `male_preference`, `partible`): through the eldest son's line first, then daughters where the law allows, then up to brothers and cousins. It handles wills against the law, a regent for a minor, legitimation, and extinction (the Extinct ending). Play passes to the heir, and the old head's chronicle paragraph is written from `content/registry/chronicle.yaml`.
  - **Effects:** `birth`, `name_child`, `marry`, `death`, `designate`, `house_law`, `legitimate`, `step_down`, `succeed`, `upbringing`, `take_news`.
  - **`npm run house:life`** plays 75 empty years from every start and reports extinction, heads, heiresses, regencies, family size and save size (results in PLAN.md §10).

## Not built yet
Matches as a system (the framework offers every member a plain match at seventeen), houses, the realm simulation, war, the Church, the prologue and the books. They are planned in `docs/PLAN.md`.
