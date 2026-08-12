# AGENTS.md (exchange-tool-github-pages)

Minimal repository instructions for the static GitHub Pages/PWA exchange tool.
Inherit shared planning, safety, delegation, and BFV defaults.

## Scope

- Keep the app dependency-free unless the user explicitly requests a build
  system or package manager.
- Treat `index.html`, `tokens.css`, and `icons/` as the UI surface;
  `app-core.mjs` as reusable behavior; and `sw.js` plus
  `manifest.webmanifest` as the install/offline surface.
- Preserve unrelated dirty files. Do not promote `.playwright-mcp/`,
  `.superpowers/**/state/*.out`, screenshots, or local server logs.

## Verification

- Run `node --test app-core.test.mjs ui-contract.test.mjs` after behavior or UI
  contract changes.
- For visual, manifest, or service-worker changes, run `node serve-local.js`
  and smoke the relevant browser flow when practical.
- Recheck `git status --short` before closeout and separate pre-existing changes
  from this task.
