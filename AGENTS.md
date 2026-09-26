# Agent Notes

## Git Workflow

- `origin` is `https://github.com/mprime3310/updated-answerque.git`.
- This repository is a **standalone snapshot** of AnswerCue 2.7.18 (single commit `b79f3ce`).
  It is **not** a fork of `https://github.com/FarzamHejaziK/AnswerCue.git` and shares no commit
  ancestry with it — the working copy it was created from was a ZIP download with no `.git`
  directory, so `git init` produced an orphan root.
- There is no `upstream` remote configured. To pull in later upstream work, add it first:

```bash
git remote add upstream https://github.com/FarzamHejaziK/AnswerCue.git
git fetch upstream
```

- Because the two histories are unrelated, merging upstream into this branch needs an explicit
  unrelated-histories merge. Do this deliberately — it will conflict on nearly every file:

```bash
git merge upstream/main --allow-unrelated-histories
```

- Prefer `git merge` over `git rebase` for shared/public branches so public history is not
  rewritten.
- If there are merge conflicts, resolve them in favor of preserving this repository's
  intentional changes unless the user asks otherwise.

## Repository Notes

- The repository is AGPL-3.0. Public modified releases should keep the license notices and make corresponding source available.
- Some submodule paths are not fully available from the public checkout: `premium` points to a private or unavailable repository, and `answercue-api` is a gitlink without a matching `.gitmodules` entry.

## Release Hygiene

- Before creating a new public release, inspect existing GitHub releases for stale Natively branding, duplicate/broken assets, draft junk, and missing release notes.
- Clean up obvious junk releases or junk assets before publishing a new release, but be careful not to delete a release the user still needs for testing unless they explicitly approve that cleanup.
- Every new release must include detailed release notes that explain the user-visible changes, fixed bugs, packaging/signing status, supported platforms, and any known limitations.
- If previous releases are missing useful notes, add or improve their release notes when feasible before marking a new release as the primary/latest one.

## Local Development

- Use the root package as the main app. The root scripts run the Vite + Electron app; `renderer/` appears to be a nested/legacy package.
- Recommended local stack: Node 22 LTS or Node 20+, npm, Xcode Command Line Tools/Xcode on macOS, and Rust/Cargo for the native audio module.
- First-time setup:

```bash
npm install
npm run build:native
```

- Start the app in development mode:

```bash
npm start
```

This runs Vite on `http://localhost:5180` and launches Electron.

- Fast checks before or after changes:

```bash
npm run build:electron
npm test
```

- Browser-only smoke tests are configured around port `5173`, while Electron dev uses `5180`. If running Playwright, start Vite on `5173` separately and pass the same port to the tests:

```bash
npm run dev -- --port 5173 --strictPort
ELECTRON_APP_PORT=5173 npx playwright test
```

Treat Electron/preload failures in browser-only Playwright as harness issues unless the test is run against a real Electron window.

## Moonshine Base Local STT Model

The Moonshine Base ONNX model (`onnx-community/moonshine-base-ONNX`, ~280MB) is **excluded from git** via `.gitignore` (`/resources/models/onnx-community/`). After a fresh clone, restore it by running:

```bash
node scripts/download-moonshine.js
```

This downloads these files into `resources/models/onnx-community/moonshine-base-ONNX/`:

- `config.json`, `generation_config.json`, `preprocessor_config.json`, `tokenizer.json`, `tokenizer_config.json`
- `onnx/encoder_model.onnx` (~77 MB)
- `onnx/decoder_model_merged.onnx` (~158 MB)
- `onnx/decoder_model_merged_quantized.onnx` (~41 MB)

The model files are fetched directly from HuggingFace Hub so no API key is needed.

- Manual macOS smoke checklist: launch Electron with `npm start`, grant Microphone/Screen Recording/Accessibility if prompted, open Settings, configure one AI provider, confirm input/output audio devices, create a New Interview, add prep context, attach a sample document, start the interview, verify transcript updates, stop the interview, and confirm prep chat/transcript/post-interview chat persist.
