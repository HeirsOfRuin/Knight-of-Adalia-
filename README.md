# Knight of Adalia and House of Adalia

Two text-based, choice-driven games set in a low-fantasy, 14th-century analog world, on one engine.

| | |
|---|---|
| **Knight of Adalia** (`games/knight/`) | One commoner's life, from boyhood to whatever station he can reach. Complete: the prologue to Chapter 5, seven endings, four backgrounds. |
| **House of Adalia** (`games/house/`) | The sequel: the house that life leaves behind, across three generations. In development: the framework is built, the gameplay and story are being planned (`games/house/docs/PLAN.md`). |

## Layout
```
packages/engine/    the engine both games play on (packages/engine/README.md)
packages/dynasty/   the dynasty export: what a Knight of Adalia life hands House of Adalia
packages/tools/     shared Node tooling: content loading, validation, headless play, continuity
games/knight/       Knight of Adalia: content, source, tools, tests, docs (games/knight/docs/DESIGN.md)
games/house/        House of Adalia: the same (games/house/docs/FRAME.md)
```
Each game's docs give paths relative to its own folder.

## Play as an app
Both games are published to GitHub Pages by `.github/workflows/pages.yml`:
- Knight of Adalia: https://heirsofruin.github.io/Knight-of-Adalia-/
- House of Adalia (early build): https://heirsofruin.github.io/Knight-of-Adalia-/house/

Knight of Adalia installs as an app:
- **Phone:** open the link, then Share > Add to Home Screen (iPhone) or the menu > Install app (Android).
- **Computer:** open the link in Chrome or Edge and click the install icon in the address bar.

It updates itself. The next time the app is opened with a connection it loads the new version, and it plays offline from the last version it saw. Saves live in the app itself; move a life between copies with Menu > Save as text / Load from text. At the end of a life, **Export your house** gives a code that House of Adalia continues from.

One-time setup: Settings > Pages > Build and deployment > Source: GitHub Actions.

## Run
```
npm install
npm run dev          # Knight of Adalia dev server
npm run house:dev    # House of Adalia dev server
npm run build:pages  # both games: dist/ and dist/house/ (host anywhere; relative paths)
```
In Knight of Adalia, add `?debug=1` to the URL, or press Ctrl+Shift+D, for debug tools.

## Check
```
npm run check        # everything below, for both games

npm test             # engine, tool and game unit tests
npm run validate     # Knight of Adalia: content validator and per-background structural checks
npm run lint:style   # Knight of Adalia: banned-phrase lint (games/knight/content/style-guide.md)
npm run continuity   # Knight of Adalia: text that contradicts the run's state
npm run bot -- --runs 200   # Knight of Adalia: playthrough bot
npm run smoke        # Knight of Adalia: browser smoke test against dist/ (build first)
npm run transcript   # Knight of Adalia: scripted plans as Markdown in games/knight/docs/playthroughs/
npm run fingerprint  # Knight of Adalia: behaviour fingerprint for refactors that must not change play

npm run house:validate     # House of Adalia: content validator, with the frame rule
npm run house:continuity   # House of Adalia: frame-bound phrases shown in the wrong frame
npm run house:bot          # House of Adalia: every opening, frame and sovereign
npm run house:check        # all three
```
