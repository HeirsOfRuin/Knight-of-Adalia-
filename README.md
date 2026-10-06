# Knight of Adalia

A text-based, choice-driven life simulation set in a low-fantasy, 14th-century analog world. It follows one commoner's life from boyhood to whatever station he can reach.

**Status:** complete from the prologue to Chapter 5, with seven endings, for all four backgrounds. Readable playthroughs of four routes are in `docs/playthroughs/`. Design in `docs/DESIGN.md`. The branch map, kill table and continuity rules for writers are in `docs/BRANCHES.md`. Authoring reference in `docs/CONTENT.md`. The engine, shared with the sequel, is in `packages/engine/` (`packages/engine/README.md`); this game's own rules are in `src/game/`. World in `content/canon.md`.

## Play as an app
The game is published to GitHub Pages as an installable app: https://heirsofruin.github.io/Knight-of-Adalia-/

- **Phone:** open the link, then Share > Add to Home Screen (iPhone) or the menu > Install app (Android).
- **Computer:** open the link in Chrome or Edge and click the install icon in the address bar.

It updates itself. Every push is built and published by `.github/workflows/pages.yml`, and the next time the app is opened with a connection it loads the new version. It also plays offline from the last version it saw. Saves live in the app itself, separately from any other copy of the game; move a life between copies with Menu > Save as text / Load from text.

One-time setup: Settings > Pages > Build and deployment > Source: GitHub Actions.

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
