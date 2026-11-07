# MYTRIP architecture

MYTRIP is a static, browser-first travel planner. GitHub Pages serves the files directly, so there is no build step or application server.

## Startup order

1. Reference and imported data scripts define read-only data on `window`.
2. `trip-manager.js` selects the active trip and exposes trip-scoped helpers.
3. Feature scripts read and write only their own storage domains.
4. `planner-editor.js` renders the user schedule after the seeded reference schedule.
5. Summary and navigation scripts react to the rendered feature state.

The script order in `index.html` is intentional. Features that need `MYTRIP_ACTIVE_TRIP`, `MYTRIP_TRIP_DAYS`, or `MYTRIP_STORAGE_KEY` load after `trip-manager.js`.

## Storage domains

| Base key | Owner | Contents |
| --- | --- | --- |
| `mytrip-trip-registry-v1` | `trip-manager.js` | Trip list and active trip |
| `mytrip-user-planner-v1` | `planner-editor.js` | Saved places and schedule |
| `weekend-trip-shopping-v2` | `shopping.js` | Shopping items |
| `mytrip-exchange-rates-v1` | `shopping.js` | Cached exchange rates |
| `mytrip-travel-info-v1` | `travel-info.js` | Reservations and checklist |
| `mytrip-alternatives-v1` | `alternatives.js` | Alternative places |

Except for the registry, keys are suffixed with the active trip ID through `MYTRIP_STORAGE_KEY`. Export, import, duplication, deletion, and cloud snapshots must cover every trip-scoped domain together.

## Data flow

Feature scripts persist state, render their section, and dispatch `mytrip:data-changed`. Home summaries listen for that event. Cross-feature actions use named events such as `mytrip:add-shopping` and `mytrip:add-alternative` rather than reaching into another feature's private state.

Imported spreadsheet payloads are generated files. `scripts/import-shopping-xlsx.py` generates `shopping-sheet-data.js` and `assets/shopping/sheet-*.webp`. `scripts/validate-seeded-trip.js` verifies schedule, alternative, shopping, and image counts.

## Verification

- `npm test`: syntax and deterministic content checks.
- `npm run test:e2e`: complete mobile user flow with network APIs mocked.
- `npm run test:mobile`: responsive layout checks from 320px through landscape.
- `npm run test:quality`: labels, action names, overflow, and runtime errors.
