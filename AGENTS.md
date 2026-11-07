# MYTRIP repository guide

MYTRIP is a mobile-first static website built with plain HTML, CSS, and browser JavaScript. It is not an Expo or React Native project.

## Architecture

- `index.html` contains the page structure and dialogs.
- `styles.css` contains all responsive styles.
- Feature scripts are independent IIFEs loaded with `defer`.
- `trip-manager.js` owns the active trip and trip-scoped storage keys.
- `planner-editor.js` owns saved places and schedule editing.
- `shopping.js`, `travel-info.js`, and `alternatives.js` own their sections.
- Generated Google Sheets data lives in `imported-hokkaido.js` and `shopping-sheet-data.js`.
- Supabase is used only for optional snapshot sync. The browser remains usable without login.

## Development

```bash
npm install
npm start
npm test
npm run test:e2e
npm run test:mobile
npm run test:quality
```

Run `npm test` after every source change. Run the browser suites for behavior or layout changes. Browser suites expect the site at `http://127.0.0.1:4173`.

## Rules

- Keep the site dependency-light and usable as static files on GitHub Pages.
- Store trip-specific browser data through `window.MYTRIP_STORAGE_KEY(base)`.
- Dispatch `mytrip:data-changed` after changing user data so summaries stay current.
- Use `textContent` for user or imported content. Do not inject it with `innerHTML`.
- Preserve existing user edits when migrating seeded data.
- Open external map and source links in the current top-level page.
- Change generated data through its importer rather than hand-editing payloads.
- Do not commit `node_modules`, `dist`, screenshots, downloaded spreadsheets, or credentials.

## Deployment

Pushes to `main` deploy through `.github/workflows/pages.yml`. A Supabase publishable key may be used in browser code; secret and `service_role` keys must never be committed.
