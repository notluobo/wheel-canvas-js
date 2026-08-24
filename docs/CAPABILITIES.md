# WheelCanvasJS capability matrix

English · [简体中文](./zh-CN/CAPABILITIES.md)

This document separates core behavior from optional workbench adapters. The runtime contract is defined by [`wheel-canvas-js.d.ts`](../dist/wheel-canvas-js.d.ts); field-level details are in [`config.md`](./config.md).

## 1. Integration and runtime

- Zero runtime dependencies in the core.
- Readable UMD/CommonJS entry and a native ESM entry.
- Strict TypeScript declarations for CJS and ESM resolution.
- CSS selector, DOM host, supplied Canvas, and supplied context construction.
- Numeric, `px`, `%`, `rem`, `vw`, `vh`, and host-defined unit handling.
- Responsive parent sizing, DPR refresh, and configurable pixel budgets.
- Browser global, CommonJS, ESM, and local static-page usage.

## 2. Wheel structure

- Multiple outer `blocks` with independent padding, fill, and images.
- Arbitrary prize counts and per-sector colors.
- Independent `range` selection weight and `displayWeight` visual weight.
- Equal sectors, weighted sectors, gutter, and global angle offset.
- Numerically stable handling of very large finite weights.
- Multiple center buttons with visibility, fill, outline, opacity, text, and images.
- Atomic `setSize(width, height)` resizing.

## 3. Typography

- Per-wheel, per-prize, and per-layer typography.
- Horizontal and Unicode-aware vertical orientation.
- Explicit line breaks and automatic wrapping.
- `lengthLimit`, `lineClamp`, `ellipsis`, custom markers, and clipping.
- Horizontal and vertical alignment.
- Radial `top` placement and tangential `left` offset.
- Percentage font size and line height relative to the logical canvas.
- Text layout caching and single-line overflow protection.

## 4. Center control

- Independent button and text visibility.
- Configurable radius, fill, opacity, outline, labels, and logos.
- True vertical centering without negative-position workarounds.
- Click and keyboard activation.
- Compatibility center pointer when no top-level pointer is supplied.

## 5. Pointer system

- Center, external, hidden, four-side, and arbitrary-angle placement.
- 21 built-in pointer presets.
- Shared size, color, opacity, outline, corner-radius, and gradient controls.
- Fixed color or current-sector color.
- Center fusion modes: `adaptive`, `droplet`, and `layered`.
- External layout modes: `stable`, `fit`, and `overlay`.
- Optional mount, radial/tangential offsets, and explicit shadows.
- Damped sector-boundary wobble with reduced-motion handling.
- Custom renderer with isolated Canvas state and error reporting.
- Pointer geometry is shared by rendering and result calculation.

## 6. Images and resources

- Layered images on blocks, prizes, and buttons.
- URL, relative URL, and Data URL sources.
- Visibility, size, position, rotation, and CORS configuration.
- Aspect-ratio preservation when one dimension is omitted.
- Async formatters, per-image timeout, and global concurrency control.
- Configuration-aware cache invalidation for `src`, CORS, and formatter changes.
- `ready` Promise and safe cancellation on destroy.

## 7. Scripted animation and selection

- `play()` plus exact `stop(index)` landing.
- `stop()` weighted by `range`.
- Seven acceleration easing families.
- Configurable acceleration/deceleration timing and stop jitter.
- Exact pointer/result alignment with unequal sector geometry.
- Prize/layout snapshot during an active session.
- Structural mutations cancel safely instead of reporting a stale prize.
- Injectable random source and clock for deterministic tests.

## 8. Drag and physics

- Mouse, pen, and touch dragging with pointer capture fallbacks.
- Center dead zone, drag threshold, direction limits, and touch-action restoration.
- Windowed velocity regression and stale-release damping.
- Rolling resistance plus viscous damping.
- Fixed substep integration and bounded background catch-up.
- Natural and weighted release modes.
- Sync or async server-controlled landing.
- Position, velocity, and acceleration-continuous braking plans.
- Brake, jerk, duration, turn, and no-speed-up constraints.
- Natural error coast or explicit immediate-stop strategy.
- Cancellation and result timeout without false winning callbacks.

## 9. Sound and celebration feedback

- Dependency-free semantic adapter interface.
- Sector and successful-result cues.
- Master, sound, and celebration switches.
- Cue pack names, volume, minimum interval, style, and particle suggestions.
- Promise-aware adapter execution and isolated errors.
- Reduced-motion guidance.
- No bundled audio, Web Audio graph, confetti library, analytics, or storage.

## 10. Reactive updates and lifecycle

- Deep reactive updates through Proxy-backed configuration.
- Image reload only when resource identity changes.
- Batched microtask redraw/reload scheduling.
- `update()` for atomic configuration commits.
- Lifecycle hooks around create, resize, init, draw, and start.
- Safe hook rollback, reentry checks, and destroy restoration.
- Observers, event listeners, animation frames, timeouts, caches, and pointer capture are released by `destroy()`.

## 11. Accessibility and engineering guarantees

- Configurable accessible name.
- Keyboard activation and visible focus support in the workbench.
- Live result announcement and hidden prize summary in the demo.
- Reduced-motion support for pointer feedback and celebrations.
- Responsive 320px mobile layout and safe-area spacing.
- Formatting, ESLint, strict types, module, compatibility, edge, performance, naming, localization, and pack checks.
- Apache-2.0 license, NOTICE, security policy, code of conduct, and contribution guide.

## Example index

| Goal                    | Primary configuration                            |
| ----------------------- | ------------------------------------------------ |
| Equal wheel             | `prizes`, `buttons`                              |
| Unequal sector sizes    | `displayWeight`, `useGraphicWeight`              |
| Trusted result          | `play()` then `stop(serverIndex)`                |
| Natural fling           | `physics.enabled`, `resultMode: 'natural'`       |
| Server-controlled fling | `physics.onRelease` returns an index/Promise     |
| External pointer        | `pointer.type: 'external'`                       |
| Fused center pointer    | `pointer.type: 'center'`, `fused`, `fusionStyle` |
| Prize images            | `prizes[].imgs`                                  |
| Center logo             | `buttons[].imgs`                                 |
| Long labels             | `lengthLimit`, `lineClamp`, `textOverflow`       |
| Responsive text         | Percentage `fontSize` and `lineHeight`           |
| Sound/confetti          | Application-owned `feedback` adapters            |

## Explicit boundaries

The core does not provide a secure lottery server, inventory accounting, persistence, analytics, user management, audio assets, confetti code, video export, or cloud synchronization. It exposes deterministic drawing, selection/landing primitives, lifecycle signals, resource handling, and adapter hooks. Applications remain responsible for trusted outcomes, privacy, and business records.
