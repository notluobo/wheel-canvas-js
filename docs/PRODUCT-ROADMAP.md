# WheelCanvasJS product audit and roadmap

English · [简体中文](./zh-CN/PRODUCT-ROADMAP.md)

## Product position

WheelCanvasJS is a high-quality, zero-runtime-dependency Canvas wheel engine plus a first-party static configuration workbench. The core owns geometry, rendering, selection, motion, resources, lifecycle, and extension boundaries. The workbench demonstrates configuration and optional feedback without turning those extras into core dependencies.

## Current strengths

- Independent visual and selection weights.
- Center/external pointer system with 21 presets and configurable geometry.
- Natural drag inertia and constrained server-controlled landing.
- Text, images, center controls, rings, responsive sizing, and DPR budgets.
- UMD/CJS/ESM plus strict types.
- Cleanup, error isolation, reentry protection, and deterministic test hooks.
- Static, mobile-responsive, bilingual workbench.

## Market signals

Mainstream wheel tools consistently emphasize instant editing, readable labels, strong result feedback, touch input, theme presets, history, sharing, and accessibility. WheelCanvasJS should preserve a small reliable engine while proving richer experiences through optional adapters and first-party examples.

## Multi-role audit

### End users

The wheel must start immediately, remain readable at common prize counts, feel natural under touch, and never report a result that disagrees with the pointer.

### Visual and interaction design

Pointers, center controls, typography, spacing, responsive panels, focus states, and empty/error states need consistent tokens and no accidental shadows or clipping.

### Physics and Canvas engineering

Motion must be refresh-rate independent, continuous at mode boundaries, bounded after background stalls, and safe around zero velocity, the center dead zone, and extreme weights.

### Accessibility and mobile

Keyboard input, names, live results, reduced motion, 320px layouts, safe areas, and touch cancellation are release requirements rather than optional polish.

### Operations, draws, and privacy

Valuable results belong to a trusted server. Analytics, history, audio, and celebration adapters must avoid leaking complete prize objects or user-entered configuration.

### Open-source maintainers

Every public field needs runtime behavior, types, docs in both languages, regression coverage, compatibility intent, and a cleanup story.

## Roadmap

### P0: reliable 1.x core

- Stabilize session/tick events and exactly-once terminal outcomes.
- Add structured validation and diagnostics without bloating the default API.
- Add real-browser Canvas visual regression and memory-leak gates.
- Measure and introduce layered render caches with precise invalidation.
- Preserve deterministic selection and landing traces.

### P0: useful workbench

- Keep every common core setting editable without rewriting unrelated advanced fields.
- Maintain English and Simplified Chinese parity.
- Add readable-size warnings for dense prize lists.
- Separate design/export size from responsive preview size.
- Keep optional feedback clearly outside the result engine.

### P1: first-party extensions

- Tick sound and haptic adapter.
- Spring pointer overlay driven by exact boundary events.
- Theme resolver and curated presets.
- Snapshot/export primitives with explicit CORS errors.
- Stable plugin ABI with error isolation and disposal.

### P2: ecosystem

- History and export owned by applications.
- Analytics adapters with allowlisted fields.
- Theme gallery, share links, PWA support, broadcast mode, and multi-round workflows.
- Animation/export plugins rather than core dependencies.

## Release gates

- Formatting, lint, syntax, strict TypeScript, CJS, ESM, and browser-global tests.
- Naming and localization contract tests.
- Compatibility, edge, numerical physics, resource-race, reentry, and destroy tests.
- Performance budgets and package-content checks.
- `publint` and Are The Types Wrong.
- Chromium, Firefox, and WebKit visual review at desktop and 320/360/390px widths.
- English and Simplified Chinese links, examples, and public API sections updated together.
- No owner placeholders, secrets, transient archives, logs, tests, or `node_modules` in the published tarball.
