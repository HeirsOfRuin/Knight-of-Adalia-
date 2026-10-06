# House of Adalia

The sequel to Knight of Adalia: a house across three generations, from the founder's last years to his great-grandchild. The design is in `docs/FRAME.md` (approved); the detailed gameplay and story plan is `docs/PLAN.md` (for approval).

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

## Not built yet
Characters other than the founder, heirs and succession, houses, the realm simulation, war, matches, the chronicle, the prologue and the books. They are planned in `docs/PLAN.md`.
