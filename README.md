# Knight of Adalia

A text-based, choice-driven life simulation set in a low-fantasy, 14th-century analog world. It follows one commoner's life from boyhood to whatever station he can reach.

**Status:** Phase 2: the prologue for all four backgrounds and Chapter 1 are playable end to end. Readable playthroughs of four routes are in `docs/playthroughs/`. Design in `docs/DESIGN.md`. Authoring reference in `docs/CONTENT.md`. World in `content/canon.md`.

## Run
```
npm install
npm run dev          # local dev server
npm run build        # static site in dist/ (host anywhere; uses relative paths)
```
Add `?debug=1` to the URL, or press Ctrl+Shift+D, for debug tools.

## Check
```
npm test             # engine and tool unit tests
npm run validate     # content validator + per-background structural checks
npm run lint:style   # banned-phrase lint (content/style-guide.md)
npm run bot -- --runs 200   # playthrough bot: endings, dead ends, softlocks per background
npm run smoke        # browser smoke test against dist/ (run build first)
npm run transcript   # render tools/plans/*.yaml as Markdown in docs/playthroughs/
npm run check        # typecheck + test + validate + lint + bot
```
