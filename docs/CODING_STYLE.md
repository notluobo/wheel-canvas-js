# Coding style

English · [简体中文](./zh-CN/CODING_STYLE.md)

## Base formatting

- UTF-8 without BOM.
- LF line endings.
- Four spaces for indentation. Tabs are not accepted.
- No trailing whitespace.
- JavaScript uses single quotes and no semicolons unless syntax requires one.
- Add trailing commas in multiline objects, arrays, parameters, and calls.
- Keep Markdown, JSON, YAML, CSS, HTML, and JavaScript formatted by the repository Prettier configuration.
- Run `npm run format` for mechanical formatting and never hand-edit generated lockfile structure.

## JavaScript quality rules

- Prefer readable functions and explicit state transitions over clever compression.
- Do not add production dependencies to the zero-dependency core without an accepted design change.
- Validate public input at boundaries and preserve the last valid state on failure.
- Treat callbacks as reentry points: a callback may cancel, destroy, update, or start another session.
- Every listener, observer, timer, animation frame, pointer capture, resource request, and cache needs a defined cleanup path.
- Keep selection geometry, rendered geometry, and returned prize index consistent.
- Use stable clocks for animation math and injectable randomness for deterministic tests.
- Avoid silent coercion when it could report a wrong prize.
- Do not swallow errors unless the documented behavior explicitly degrades safely.

## API and types

- Public runtime changes must update `dist/wheel-canvas-js.d.ts`, CJS/ESM declaration entries, README, configuration docs, capability matrix, and changelog.
- Preserve CJS, ESM, and UMD runtime/type agreement.
- New fields require a default, validation, runtime behavior, TypeScript declaration, documentation, and at least one behavior test.
- Breaking changes require a migration note.
- Do not reintroduce retired product or API names.

## Localization

- Simplified Chinese is the default repository README; `README.en.md` is its English counterpart. English reference documents live in `docs/`, with matching Simplified Chinese files in `docs/zh-CN/`.
- Public behavior changes must update both languages in the same pull request.
- Do not translate identifiers, file names, API values, error codes, or code syntax.
- Follow [`LOCALIZATION.md`](./LOCALIZATION.md).

## Tests

- Add regression coverage for every confirmed bug.
- Test positive, invalid, cancellation, destroy, reentry, and async-race paths as applicable.
- Numerical physics changes require direction, frame-rate, continuity, and boundary matrices.
- Canvas visual changes require mock assertions plus manual Chromium/Firefox/WebKit review before major releases.
- `npm test` and `npm run pack:check` must pass before merge.
