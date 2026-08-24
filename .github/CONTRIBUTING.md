# Contributing

English · [简体中文](../docs/zh-CN/CONTRIBUTING.md)

Thank you for contributing to WheelCanvasJS. Search existing issues first and keep each pull request focused on one topic.

## Development environment

Node.js 20.19 or newer and npm are required:

```powershell
npm ci
npm test
npm run pack:check
```

## Project rules

- Use UTF-8, LF, and four spaces. See [`docs/CODING_STYLE.md`](../docs/CODING_STYLE.md).
- Run `npm run format:check` and `npm run lint`; do not bypass failures with broad rule disables.
- Keep the core free of runtime dependencies unless a reviewed design explains necessity and bundle impact.
- `dist/wheel-canvas-js.umd.js` is readable source. Do not edit minified artifacts.
- Public API changes must update runtime behavior, `dist/wheel-canvas-js.d.ts`, both README/config/capability languages, and both changelogs.
- Animation, weight, pointer, image-cache, resource, accessibility, physics, and lifecycle changes require regression tests.
- Keep UMD, CommonJS, ESM, browser-global, and TypeScript exports aligned.
- Do not commit `.tgz` files, logs, personal editor state, generated `node_modules`, or real credentials.
- Follow [`docs/LOCALIZATION.md`](../docs/LOCALIZATION.md) for user-facing text.

## Pull-request checklist

1. `npm test` passes.
2. `npm run pack:check` lists only intended public files.
3. The workbench is checked in a real browser with mouse, keyboard, touch, equal sectors, and visual weighting.
4. English and Simplified Chinese docs are updated together.
5. User-visible changes appear in both changelogs.
6. Front-end randomness is never presented as a trusted high-value result.

Contributions are submitted under the project's Apache-2.0 license.
