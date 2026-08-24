# Changelog

English · [简体中文](./docs/zh-CN/CHANGELOG.md)

This project follows [Semantic Versioning](https://semver.org/).

## 1.0.0 - 2026-08-24

### Changed

- Named the project `WheelCanvasJS` and the npm package `wheel-canvas-js`.
- Standardized the browser API as `WheelCanvasJS.WheelCanvas` and module exports as `WheelCanvas` and `createWheelCanvas`.
- Standardized distributable entries as `wheel-canvas-js.umd.js`, `wheel-canvas-js.esm.mjs`, and `wheel-canvas-js.d.*`.
- Added a Simplified Chinese default README, an English alternate README, matching bilingual documentation, and a localized workbench.

### Added

- Zero-runtime-dependency native JavaScript `WheelCanvas` implementation.
- UMD, CommonJS, ESM, and strict TypeScript entry points.
- Independent `range`, `displayWeight`, `useGraphicWeight`, and `graphicWeightSource` behavior.
- Center, external, and hidden pointer configuration with arbitrary angle, 21 presets, configurable geometry, current-sector color, center fusion, mounts, and damped boundary wobble.
- Mouse, pen, touch, Enter, and Space interaction plus configurable Canvas accessibility labels.
- Drag physics using weighted velocity regression, rolling resistance, viscous damping, bounded substeps, C² low-speed transition, and constrained target braking.
- Natural, weighted, sync, and async release outcomes with strict index validation, timeout, cancellation, and natural error coast.
- Layered block, prize, and center images with concurrency limits, independent formatter caching, reactive invalidation, and `ready` lifecycle.
- Horizontal/vertical text, wrapping, line clamp, clipping/ellipsis, alignment, radial/tangential positioning, and percentage typography.
- Optional semantic `feedback` adapters for sector/result sound and successful-result celebrations, isolated from selection.
- Responsive static configuration workbench with core settings, live preview, optional adapters, complete JSON editing, mobile layout, and built-in tutorial.
- Versioned, failure-safe browser persistence for the serializable workbench configuration, with a live-preview reset control and visible save status.
- Four-space EditorConfig, Prettier, ESLint, CI, naming/localization contracts, module/type/compatibility/edge/performance tests, and package checks.
- Apache-2.0 license, NOTICE attribution, contribution guide, security policy, conduct policy, issue templates, and release checklist.

### Fixed

- Normalized multiline DOM text before localization and withheld the English page until its one-shot translation finishes, preventing wrapped markup and first-paint timing from exposing Chinese fragments.
- Replaced the dual text language links with one accessible globe button that shows only the active locale and switches directly to the other locale.
- Deferred English DOM translation until `DOMContentLoaded`, preventing parser-streamed text nodes from becoming partially translated Chinese/English fragments.
- Cached stable prize layouts, pointer geometry, and text wrapping instead of recomputing them on every frame.
- Added `maxDpr`, `maxCanvasPixels`, and `imageConcurrency` resource budgets.
- Decoupled external pointer sizing from wheel sizing through `fit`, `stable`, and `overlay` layouts.
- Prevented pointer changes from unexpectedly resizing the wheel in stable layout.
- Corrected narrow-screen grid overflow, mobile nested scrolling, safe-area spacing, and responsive Canvas blur.
- Preserved advanced configuration fields when simple workbench controls update one field.
- Corrected center fusion outlines, removed accidental internal white accents, added corner radius, and disabled shadows by default.
- Isolated independent center pointers from button opacity, shadow, radius, and visibility.
- Protected create/resize/draw/gesture callbacks against destroy and reentry races.
- Corrected extreme external-pointer fit convergence and tangent-offset bounds.
- Froze active prize/layout/pointer/physics snapshots and rejected inconsistent structural edits.
- Corrected dynamic accessible labels, busy state, actionable Canvas semantics, and live prize descriptions.
- Prevented narrow ellipsis markers and single-line text from escaping their layout bounds.
- Made image cache identity include source, CORS mode, and formatter while preventing stale async results from overwriting newer configuration.

### Compatibility

- Preserves the main configuration semantics, lifecycle hooks, and public helper methods of the referenced implementation.
- Existing scripted `play()` / `stop(index)` behavior remains separate from the physical drag state machine.

### Security

- Documents that high-value outcomes must be decided by trusted server-side logic.
