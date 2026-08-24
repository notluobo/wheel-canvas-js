# WheelCanvasJS configuration reference

English · [简体中文](./zh-CN/config.md)

## Create an instance

```js
const wheel = new WheelCanvasJS.WheelCanvas('#wheel', config)
```

The first argument may be a CSS selector or DOM element. The second argument is the wheel configuration.

Advanced host configuration is also supported:

```js
const wheel = new WheelCanvasJS.WheelCanvas(
    {
        el: '#wheel',
        dpr: 2,
        handleCssUnit(number, unit) {
            if (unit === 'rpx') return number / 2
            return number
        },
        beforeResize() {},
        afterResize() {},
    },
    config,
)
```

Advanced host fields include `flag`, `el`, `divElement`, `canvasElement`, `ctx`, `dpr`, `handleCssUnit`, `unitFunc`, `rAF`, `now`, `random`, `imageTimeout`, timer overrides, and lifecycle callbacks. Custom `rAF` timestamps are not trusted. Deterministic tests should provide `now()` and a `random()` function that returns values in `[0, 1)`. `imageTimeout` defaults to 30,000ms; use `0` to disable it.

## Top-level configuration

| Property          | Type                  | Required | Description                                                                       |
| ----------------- | --------------------- | -------- | --------------------------------------------------------------------------------- |
| `width`           | `string \| number`    | Yes      | Logical width such as `320`, `320px`, `80vw`, or `100%`                           |
| `height`          | `string \| number`    | Yes      | Logical height                                                                    |
| `ariaLabel`       | `string`              | No       | Accessible Canvas name                                                            |
| `blocks`          | `Block[]`             | No       | Outer rings                                                                       |
| `prizes`          | `Prize[]`             | Yes      | Prize sectors                                                                     |
| `buttons`         | `Button[]`            | No       | Center buttons and compatibility pointer                                          |
| `pointer`         | `PointerConfig`       | No       | Centered, external, or hidden pointer                                             |
| `physics`         | `PhysicsConfig`       | No       | Drag, release velocity, inertia, and controlled landing                           |
| `feedback`        | `FeedbackConfig`      | No       | Optional sound and celebration adapters                                           |
| `defaultConfig`   | `object`              | No       | Animation, geometry, and resource limits                                          |
| `defaultStyle`    | `FontConfig & object` | No       | Default prize and typography style                                                |
| `start`           | `function`            | No       | Called when the center control starts a scripted draw                             |
| `end`             | `function`            | No       | Called after a successful winning result settles                                  |
| `error`           | `function`            | No       | Receives errors captured from resources, renderers, feedback, and physics results |
| `onCurrentChange` | `function`            | No       | Called when the pointer enters a different prize                                  |

Lifecycle callbacks also include `beforeCreate`, `beforeResize`, `afterResize`, `beforeInit`, `afterInit`, `beforeDraw`, `afterDraw`, and `afterStart`. Exceptions intentionally thrown by lifecycle callbacks, `end`, or `onCurrentChange` propagate to the current call stack instead of recursively entering `error`.

## Outer rings: `blocks`

```js
blocks: [
    { padding: '12px', background: '#d9480f' },
    { padding: '4px', background: '#fff3bf' },
]
```

| Property     | Type               | Description         |
| ------------ | ------------------ | ------------------- |
| `padding`    | `string \| number` | Ring thickness      |
| `background` | `string`           | Ring fill           |
| `imgs`       | `ImageConfig[]`    | Layered ring images |

## Prizes: `prizes`

```js
prizes: [
    {
        range: 10,
        displayWeight: 2,
        background: '#fff4df',
        fonts: [{ text: 'First prize', top: '18%', fontColor: '#c92a2a' }],
        imgs: [{ src: './gift.png', width: '40px', top: '42%' }],
    },
]
```

| Property        | Type            | Description                                                          |
| --------------- | --------------- | -------------------------------------------------------------------- |
| `name`          | `string`        | Semantic prize name used by applications and accessibility fallbacks |
| `range`         | `number`        | Relative client-side selection weight used by `stop()`               |
| `displayWeight` | `number`        | Sector angle weight when visual weighting is enabled                 |
| `background`    | `string`        | Sector fill                                                          |
| `fonts`         | `FontConfig[]`  | Layered text                                                         |
| `imgs`          | `ImageConfig[]` | Layered images                                                       |

`range` is relative and does not need to total 100. `[1, 2, 7]` represents approximately 10%, 20%, and 70%. `range` and `displayWeight` are independent. A trusted server should select any prize with monetary or inventory value and pass the result to `stop(index)`.

## Center buttons: `buttons`

```js
buttons: [
    {
        visible: true,
        textVisible: true,
        radius: '34%',
        background: '#e8590c',
        borderColor: '#fff',
        borderWidth: 4,
        pointer: true,
        fonts: [
            {
                text: 'SPIN',
                fontColor: '#fff',
                fontSize: '20px',
                verticalAlign: 'middle',
            },
        ],
    },
]
```

| Property                                 | Type                | Description                                                                   |
| ---------------------------------------- | ------------------- | ----------------------------------------------------------------------------- |
| `visible`                                | `boolean`           | Show the entire button                                                        |
| `textVisible`                            | `boolean`           | Show button text without hiding the button                                    |
| `radius`                                 | `string \| number`  | Radius relative to the prize area                                             |
| `background` / `opacity`                 | `string` / `number` | Fill and overall opacity                                                      |
| `borderColor` / `borderWidth`            | -                   | Circular outline                                                              |
| `shadowColor` / `shadowBlur` / `shadow*` | -                   | Optional shadow; official defaults keep shadows disabled                      |
| `pointer`                                | `boolean`           | Draw the compatibility center pointer when no top-level pointer is configured |
| `fonts`                                  | `FontConfig[]`      | Button text; defaults to true vertical centering when `top` is omitted        |
| `imgs`                                   | `ImageConfig[]`     | Center logo or other layered images                                           |

## Pointer: `pointer`

```js
pointer: {
    type: 'external',
    position: 'top',
    angle: 0,
    preset: 'minimal',
    color: '#7c3aed',
    colorSource: 'currentPrize',
    borderColor: '#ffffff',
    borderWidth: 2,
    width: '6%',
    height: '5%',
    layout: 'stable',
    space: 18,
    tipInset: 14,
    tangentOffset: 0,
    mount: false,
    wobble: {
        enabled: true,
        amplitude: 2.5,
        duration: 180,
        frequency: 14,
        damping: 12,
        respectReducedMotion: true,
    },
    shadow: false,
}
```

| Property                      | Default            | Description                                                                                        |
| ----------------------------- | ------------------ | -------------------------------------------------------------------------------------------------- |
| `type`                        | `center`           | `center`, `external`, or `none`                                                                    |
| `position`                    | `top`              | `top`, `right`, `bottom`, or `left`                                                                |
| `angle`                       | -                  | Clockwise degrees from twelve o'clock; overrides `position`                                        |
| `preset` / `shape`            | `minimal`          | One of 21 built-in shapes; `shape` is a compatibility alias                                        |
| `color` / `body`              | Purple / solid     | Body color, outline, opacity, and optional `gradient.from/to`; `shadeColor` enables a shade accent |
| `colorSource`                 | `fixed`            | `fixed` uses configured color; `currentPrize` follows the sector under the pointer                 |
| `width` / `height`            | Preset-specific    | `px` remains absolute; `%` scales with the canvas                                                  |
| `cornerRadius`                | `3`                | Rounded path corners; `0` restores sharp corners                                                   |
| `layout`                      | `fit`              | `fit`, `stable`, or `overlay` external layout                                                      |
| `space` / `reserveSpace`      | Automatic / `true` | External safe area; `stable` defaults to 5% of canvas diameter                                     |
| `tipInset` / `tangentOffset`  | `14` / `0`         | Radial overlap and tangent displacement; `inset` / `offset` are aliases                            |
| `radialOffset`                | `0`                | Center pointer radial displacement                                                                 |
| `fused`                       | `true`             | Join a center pointer and button into one outline                                                  |
| `fusionStyle`                 | `layered`          | `adaptive`, `droplet`, or `layered`                                                                |
| `referenceSize`               | `30%`              | Independent size basis when `fused: false`                                                         |
| `mount`                       | Preset-specific    | `false` disables it; an object customizes colors, radius, outline, opacity, and metal gradient     |
| `shadow`                      | `false`            | Optional color, blur, tangential offset, and radial offset                                         |
| `accentColor` / `accentWidth` | `false` / `1`      | Optional internal accent; disabled by default for a clean pointer                                  |
| `wobble`                      | `false`            | Damped boundary feedback with amplitude, duration, frequency, damping, and reduced-motion handling |
| `renderer(ctx, metrics)`      | -                  | Custom rendering isolated by Canvas state; exceptions enter `error`                                |

Pointer angle is shared by rendering, `stop(index)`, and `getCurrentPrizeIndex()`. Color following and wobble are visual only.

`adaptive` draws the center button and selected preset as one continuous outline. `droplet` uses a fixed drop silhouette. `layered` keeps button and pointer colors and outlines separate.

Built-in presets: `minimal`, `classic`, `flapper`, `wedge`, `needle`, `pin`, `glass`, `jewel`, `triangle`, `kite`, `arrow`, `chevron`, `diamond`, `notch`, `teardrop`, `spear`, `soft`, `tab`, `dart`, `shield`, and `ribbon`.

## Physical rotation: `physics`

```js
physics: {
    enabled: true,
    sensitivity: 1,
    dragThreshold: 6,
    innerRadius: '8%',
    minVelocity: 36,
    maxVelocity: 1800,
    friction: 24,
    drag: 0.68,
    stopVelocity: 3,
    waitingVelocity: 72,
    waitingStrategy: 'hold',
    velocitySmoothing: 1,
    sampleWindow: 110,
    sampleHalfLife: 55,
    releaseWindow: 180,
    releaseDamping: 7,
    maxSubstep: 10,
    maxCatchUp: 220,
    minLandingTurns: 0,
    maxLandingTurns: 10,
    minLandingDuration: 280,
    maxLandingDuration: 12000,
    accelerationBlendDuration: 120,
    maxBrake: 2400,
    maxJerk: 50000,
    landingSamples: 96,
    forbidSpeedUp: true,
    errorStrategy: 'coast',
    resultTimeout: 10000,
    dragFrom: 'prizes',
    direction: 'both',
    resultMode: 'natural',
    snapToPrize: false,
    onStart(detail, event) {},
    onRelease(detail, event) {},
    onEnd(detail) {},
    onCancel(detail, event) {},
}
```

| Property                                       | Default             | Description                                                                          |
| ---------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------ |
| `enabled`                                      | `false`             | Enable dragging; disabled by default for compatibility                               |
| `sensitivity` / `dragThreshold`                | `1` / `6`           | Angular tracking multiplier and pixel threshold                                      |
| `innerRadius`                                  | `8%`                | Center dead zone that avoids `atan2` singular behavior                               |
| `minVelocity` / `maxVelocity`                  | `36` / `1800`       | Minimum and maximum release velocity in degrees/second                               |
| `friction` / `drag`                            | `24` / `0.68`       | Rolling resistance in degrees/second² and viscous damping per second                 |
| `stopVelocity`                                 | `3`                 | Natural-settle threshold in degrees/second                                           |
| `waitingVelocity` / `waitingStrategy`          | `72` / `hold`       | Hold at or below current velocity, or continue `coast`, while awaiting a result      |
| `velocitySmoothing`                            | `1`                 | Additional 0–1 regression smoothing; first samples are not biased from zero          |
| `sampleWindow` / `sampleHalfLife`              | `110` / `55`        | Weighted velocity-regression window and half-life in milliseconds                    |
| `releaseWindow` / `releaseDamping`             | `180` / `7`         | Valid release window and exponential stale-sample damping                            |
| `maxSubstep` / `maxCatchUp`                    | `10` / `220`        | Physics integration substep and maximum catch-up time in milliseconds                |
| `minLandingTurns` / `maxLandingTurns`          | `0` / `10`          | Additional full-turn search range for controlled landings                            |
| `minLandingDuration` / `maxLandingDuration`    | `280` / `12000`     | Controlled-braking duration range in milliseconds                                    |
| `accelerationBlendDuration`                    | `120`               | Target duration for the C² transition from current acceleration                      |
| `maxBrake` / `maxJerk`                         | `2400` / `50000`    | Maximum angular deceleration and jerk                                                |
| `landingSamples` / `forbidSpeedUp`             | `96` / `true`       | Validation samples and release-speed monotonicity rule                               |
| `errorStrategy`                                | `coast`             | Settle naturally after result errors; `stop` halts immediately                       |
| `resultTimeout`                                | `10000`             | Async result timeout; `0` disables it                                                |
| `dragFrom` / `direction`                       | `prizes` / `both`   | Interactive region and allowed rotation direction                                    |
| `resultMode` / `snapToPrize`                   | `natural` / `false` | Natural or weighted release behavior and optional center snapping                    |
| `touchAction`                                  | `none`              | Canvas touch action while enabled; the original value is restored on disable/destroy |
| `onStart` / `onRelease` / `onEnd` / `onCancel` | -                   | Physical interaction lifecycle                                                       |

`onRelease` receives signed `velocity`, absolute `speed`, `direction`, `rotation`, and `source`. Returning an index plans a smooth landing from current position, velocity, and acceleration. The planner verifies no reversal, no forbidden speed gain, and configured brake/jerk bounds. A Promise may supply a server result. It must resolve to an integer in the current prize range.

Rejected, timed-out, invalid, and impossible results emit `error`, never a winning `end`. The default error strategy preserves momentum and coasts naturally. Catch-up time above `maxCatchUp` is intentionally discarded after a background stall.

## Scripted animation: `defaultConfig`

```js
defaultConfig: {
    gutter: 2,
    offsetDegree: 0,
    speed: 20,
    speedFunction: 'quad',
    accelerationTime: 800,
    decelerationTime: 2500,
    stopRange: 0.8,
    useGraphicWeight: true,
    graphicWeightSource: 'displayWeight',
    maxDpr: 3,
    maxCanvasPixels: 16777216,
    imageConcurrency: 6,
}
```

| Property              | Default    | Description                                                                       |
| --------------------- | ---------- | --------------------------------------------------------------------------------- |
| `gutter`              | `0`        | Gap between sectors                                                               |
| `offsetDegree`        | `0`        | Global sector angle offset                                                        |
| `speed`               | `20`       | Maximum scripted speed in degrees per 60Hz frame                                  |
| `speedFunction`       | `quad`     | Acceleration easing: `quad`, `cubic`, `quart`, `quint`, `sine`, `expo`, or `circ` |
| `accelerationTime`    | `2500`     | Acceleration duration in milliseconds                                             |
| `decelerationTime`    | `2500`     | Scripted deceleration duration in milliseconds                                    |
| `stopRange`           | `0`        | Random position range inside the winning sector, `0..1`                           |
| `useGraphicWeight`    | `false`    | Draw sectors with independent visual weights                                      |
| `graphicWeightSource` | `auto`     | `auto`, `displayWeight`, or `range`                                               |
| `maxDpr`              | `3`        | Maximum Canvas backing-store DPR; `0` disables the limit                          |
| `maxCanvasPixels`     | `16777216` | Maximum backing-store pixel count; `0` disables the limit                         |
| `imageConcurrency`    | `6`        | Concurrent image load/decode tasks; `0` is unlimited                              |

## Visual weighting

Visual weighting is disabled by default. When enabled, `displayWeight` can size sectors independently from `range`:

```js
prizes: [
    { range: 10, displayWeight: 1, fonts: [{ text: 'First prize' }] },
    { range: 30, displayWeight: 2, fonts: [{ text: 'Second prize' }] },
    { range: 60, displayWeight: 3, fonts: [{ text: 'Try again' }] },
],
defaultConfig: {
    useGraphicWeight: true,
    graphicWeightSource: 'displayWeight',
}
```

The visible angles are 60°, 120°, and 180°, while selection probability still follows `range`. Every positive weight retains a representable minimum sector even under extreme floating-point ratios. The same geometry is used by drawing, `stop(index)`, `getCurrentPrizeIndex()`, text and image layout, and `onCurrentChange`.

An active spin freezes its layout. Structural prize changes cancel that spin, emit `error`, and do not emit `end`.

## Default typography: `defaultStyle`

```js
defaultStyle: {
    background: '#fff',
    fontColor: '#333',
    fontSize: '16px',
    fontStyle: 'sans-serif',
    fontWeight: '400',
    lineHeight: '22px',
    wordWrap: true,
    lengthLimit: '90%',
    lineClamp: 2,
    orientation: 'horizontal',
    top: '18%',
    left: '0%',
    textAlign: 'center',
    verticalAlign: 'middle',
    textOverflow: 'ellipsis',
    ellipsis: '...',
}
```

Per-prize and per-font settings override these defaults.

## Text: `FontConfig`

| Property        | Type               | Description                                                    |
| --------------- | ------------------ | -------------------------------------------------------------- |
| `visible`       | `boolean`          | Draw this text layer                                           |
| `text`          | `string \| number` | Content                                                        |
| `top`           | `string \| number` | Radial position; positive values move toward the rim           |
| `left`          | `string \| number` | Tangential offset within the sector                            |
| `fontColor`     | `string`           | Color                                                          |
| `fontSize`      | `string \| number` | Font size                                                      |
| `fontStyle`     | `string`           | Font family under the compatibility field name                 |
| `fontFamily`    | `string`           | Alias for `fontStyle`                                          |
| `fontWeight`    | `string \| number` | Weight                                                         |
| `lineHeight`    | `string \| number` | Line height                                                    |
| `wordWrap`      | `boolean`          | Automatic wrapping                                             |
| `lengthLimit`   | `string \| number` | Maximum line width                                             |
| `lineClamp`     | `number`           | Maximum lines, or visible characters in vertical mode          |
| `orientation`   | `string`           | `horizontal` or Unicode-aware `vertical` layout                |
| `textAlign`     | `string`           | `left`, `center`, or `right`                                   |
| `verticalAlign` | `string`           | Button text `top`, `middle`, or `bottom` when `top` is omitted |
| `textOverflow`  | `string`           | `ellipsis` or `clip`                                           |
| `ellipsis`      | `string`           | Custom marker such as `…`                                      |

Percentage `fontSize` and `lineHeight` values use the shorter logical canvas edge. Percentage `top` uses drawable radius; percentage `left` uses the sector chord width. Single-line text still respects `lengthLimit` and overflow rules when `wordWrap` is false.

## Images: `ImageConfig`

| Property      | Type               | Description                                                      |
| ------------- | ------------------ | ---------------------------------------------------------------- |
| `src`         | `string`           | URL, Data URL, or relative asset path                            |
| `visible`     | `boolean`          | Load and draw; `false` preserves configuration without rendering |
| `width`       | `string \| number` | Draw width                                                       |
| `height`      | `string \| number` | Draw height; omit to preserve aspect ratio                       |
| `top`         | `string \| number` | Vertical position                                                |
| `left`        | `string \| number` | Horizontal/tangential offset                                     |
| `rotate`      | `boolean`          | Rotate a block image with the wheel                              |
| `crossOrigin` | `string`           | For example `anonymous`                                          |
| `formatter`   | `function`         | Async or sync post-load transformation                           |
| `timeout`     | `number`           | Per-image timeout overriding host `imageTimeout`                 |

Wait for `wheel.ready` before relying on image pixels. Changing `src`, `crossOrigin`, or `formatter` invalidates the resource result. A failed asset emits `error` and is skipped safely.

## Recommended draw flow

```js
const wheel = new WheelCanvasJS.WheelCanvas('#wheel', {
    async start() {
        wheel.play()
        const response = await fetch('/api/draw', { method: 'POST' })
        const result = await response.json()
        wheel.stop(result.prizeIndex)
    },
    end(prize) {
        showResult(prize)
    },
    error(error) {
        showError(error)
    },
})
```

`play()` starts motion. `stop(index)` determines the winning prize.

## Live updates

Use `update()` instead of destroying the instance:

```js
await wheel.update({
    width: '400px',
    prizes: generatedPrizes,
    defaultStyle: { fontColor: '#5f3dc4' },
    defaultConfig: { speed: 24, decelerationTime: 3200 },
})
```

Arrays are replaced. `defaultStyle` and `defaultConfig` are merged. Direct reactive edits remain supported:

```js
wheel.defaultStyle.background = '#f8f9fa'
wheel.defaultConfig.speed = 24
wheel.prizes[0].background = '#ffe8cc'
wheel.buttons[0].fonts[0].text = 'SPIN'
wheel.setSize('420px')
```

Do not mutate structural prize, angle, pointer, or physics fields during a spin.

## Feedback: `feedback`

`feedback` is a dependency-free semantic adapter layer. The core determines when to emit cues; applications provide audio and celebration behavior.

```js
feedback: {
    enabled: true,
    sound: {
        enabled: true,
        pack: 'mechanical',
        sectorCue: 'snap',
        resultCue: 'reward',
        volume: 0.3,
        minInterval: 35,
        play(cue, detail, config) {
            audioAdapter.play(cue, config)
        },
    },
    celebration: {
        enabled: true,
        style: 'subtle',
        particleCount: 48,
        disableForReducedMotion: true,
        fire(style, detail, config) {
            celebrationAdapter.fire(style, detail, config)
        },
    },
}
```

| Property                              | Default      | Description                                                  |
| ------------------------------------- | ------------ | ------------------------------------------------------------ |
| `enabled`                             | `true`       | Master feedback switch; never changes selection              |
| `sound.enabled`                       | `false`      | Enable the sound adapter                                     |
| `sound.pack`                          | `mechanical` | Semantic pack identifier for the adapter                     |
| `sound.sectorCue`                     | `snap`       | Cue emitted on sector changes                                |
| `sound.resultCue`                     | `reward`     | Cue emitted after a successful result                        |
| `sound.volume`                        | `0.3`        | Suggested adapter volume, clamped to `0..1`                  |
| `sound.minInterval`                   | `35`         | Minimum sector cue interval, clamped to `0..1000ms`          |
| `sound.play`                          | -            | `(cue, detail, soundConfig)`, optionally async               |
| `celebration.enabled`                 | `false`      | Call the celebration adapter after success                   |
| `celebration.style`                   | `subtle`     | Semantic style identifier                                    |
| `celebration.particleCount`           | `48`         | Suggested particle count                                     |
| `celebration.disableForReducedMotion` | `true`       | Adapter should respect reduced-motion preference             |
| `celebration.fire`                    | -            | `(style, resultDetail, celebrationConfig)`, optionally async |

Initialization, cancellation, failure, and destruction do not emit result feedback. Adapter errors become `WheelCanvasFeedbackError` and enter `error` without stopping the wheel.

## Public methods

| Method                   | Description                                                                |
| ------------------------ | -------------------------------------------------------------------------- |
| `play()`                 | Begin scripted rotation                                                    |
| `spin(velocity)`         | Begin physical inertia; negative velocity is counterclockwise              |
| `stop(index)`            | Stop on a specific prize                                                   |
| `stop()`                 | Select using `range`; no valid weights ends without a winner               |
| `cancel(reason)`         | Cancel without a winning `end` callback                                    |
| `init()`                 | Reset, reload images, and draw                                             |
| `update(config)`         | Merge configuration and reinitialize                                       |
| `setSize(width, height)` | Update logical dimensions with one reflow; omitted height creates a square |
| `resize()`               | Recompute DPR, dimensions, and coordinates                                 |
| `clearCanvas()`          | Clear the canvas                                                           |
| `getCurrentPrizeIndex()` | Return the index under the logical pointer                                 |
| `isRunning()`            | Report active scripted or physical motion                                  |
| `isWeb()`                | Return the current Web flag                                                |
| `destroy()`              | Cancel work, remove listeners/observers, and restore host DOM              |

Compatibility extension methods remain available: `loadImg()`, `drawImage()`, `computedWidthAndHeight()`, `changeUnits()`, `getLength()`, `getOffsetX()`, `getOffscreenCanvas()`, `$set()`, `$computed()`, `$watch()`, and `conversionAxis()`.

The TypeScript declarations in [`../dist/wheel-canvas-js.d.ts`](../dist/wheel-canvas-js.d.ts) are the final machine-readable API contract.
