export as namespace WheelCanvasJS

export type CssLength = number | string
export type WheelTarget = string | HTMLElement | HTMLCanvasElement
export type WheelState =
    'idle' | 'dragging' | 'coasting' | 'settling' | 'accelerating' | 'cruising' | 'decelerating'
export type SpeedFunction = 'quad' | 'cubic' | 'quart' | 'quint' | 'sine' | 'expo' | 'circ'
export type GraphicWeightSource = 'auto' | 'displayWeight' | 'range'
export type PointerType = 'center' | 'external' | 'none'
export type PointerPosition = 'top' | 'right' | 'bottom' | 'left'
export type PointerLayout = 'fit' | 'stable' | 'overlay'
export type PointerFusionStyle = 'adaptive' | 'layered' | 'droplet'
export type PointerColorSource = 'fixed' | 'currentPrize'
export type PointerShape =
    | 'minimal'
    | 'classic'
    | 'flapper'
    | 'wedge'
    | 'needle'
    | 'pin'
    | 'glass'
    | 'jewel'
    | 'triangle'
    | 'kite'
    | 'arrow'
    | 'chevron'
    | 'diamond'
    | 'notch'
    | 'teardrop'
    | 'spear'
    | 'soft'
    | 'tab'
    | 'dart'
    | 'shield'
    | 'ribbon'
export type TextOrientation = 'horizontal' | 'vertical'
export type TextAlign = 'left' | 'center' | 'right'
export type VerticalAlign = 'top' | 'middle' | 'bottom'
export type TextOverflow = 'ellipsis' | 'clip'
export type PhysicsDirection = 'both' | 'clockwise' | 'counterclockwise'
export type PhysicsResultMode = 'natural' | 'weighted'
export type PhysicsDragFrom = 'prizes' | 'wheel'

export interface ImageConfig {
    src: string
    /** Keeps an image layer configured while temporarily excluding it from loading and drawing. */
    visible?: boolean
    width?: CssLength
    height?: CssLength
    top?: CssLength
    left?: CssLength
    rotate?: boolean
    crossOrigin?: string
    formatter?: (
        this: WheelCanvas,
        image: HTMLImageElement,
    ) => CanvasImageSource | Promise<CanvasImageSource>
    timeout?: number
}

export interface FontConfig {
    visible?: boolean
    text?: string | number
    top?: CssLength
    left?: CssLength
    fontColor?: string
    fontSize?: CssLength
    fontStyle?: string
    fontFamily?: string
    fontWeight?: string | number
    lineHeight?: CssLength
    wordWrap?: boolean
    lengthLimit?: CssLength
    lineClamp?: number
    /** Horizontal text uses rows; vertical text stacks Unicode characters radially. */
    orientation?: TextOrientation
    textAlign?: TextAlign
    /** Button text defaults to middle when top is omitted. */
    verticalAlign?: VerticalAlign
    textOverflow?: TextOverflow
    ellipsis?: string
}

export interface Block {
    padding?: CssLength
    background?: string
    imgs?: ImageConfig[]
}

export interface Prize {
    /** Probability weight used by stop() when no index is supplied. */
    range?: number
    /** Sector-size weight used only when useGraphicWeight is enabled. */
    displayWeight?: number
    background?: string
    fonts?: FontConfig[]
    imgs?: ImageConfig[]
    [key: string]: unknown
}

export interface Button {
    visible?: boolean
    textVisible?: boolean
    radius?: CssLength
    background?: string
    borderColor?: string
    borderWidth?: CssLength
    opacity?: number
    shadowColor?: string
    shadowBlur?: CssLength
    shadowOffsetX?: CssLength
    shadowOffsetY?: CssLength
    pointer?: boolean
    fonts?: FontConfig[]
    imgs?: ImageConfig[]
    [key: string]: unknown
}

export interface PointerWobbleConfig {
    enabled?: boolean
    /** Peak visual deflection in degrees. Does not change the winning geometry. */
    amplitude?: number
    /** Feedback duration in milliseconds. */
    duration?: number
    /** Oscillation frequency in hertz. */
    frequency?: number
    /** Exponential damping strength. */
    damping?: number
    /** Disables the effect when the system requests reduced motion. Defaults to true. */
    respectReducedMotion?: boolean
}

export interface PointerConfig {
    /** Defaults to center. Omit the entire object to preserve legacy button.pointer rendering. */
    type?: PointerType
    position?: PointerPosition
    /** Clockwise degrees from the 12 o'clock position; takes precedence over position. */
    angle?: number
    /** Built-in visual preset. `shape` remains as a compatible alias. */
    preset?: PointerShape
    shape?: PointerShape
    color?: string
    /** Uses the configured color or follows the sector currently under the pointer. */
    colorSource?: PointerColorSource
    /** Optional damped visual response when the pointer crosses a sector boundary. */
    wobble?: boolean | PointerWobbleConfig
    borderColor?: string
    borderWidth?: CssLength
    /** Built-in pointer corner radius. Defaults to 3px; use 0 for sharp corners. */
    cornerRadius?: CssLength
    width?: CssLength
    height?: CssLength
    /** External layout: fit adapts the wheel, stable keeps a fixed lane, overlay draws inward. */
    layout?: PointerLayout
    /** External-pointer space; stable layout defaults to 5% of the canvas diameter. */
    space?: CssLength
    reserveSpace?: boolean
    /** Distance the external pointer tip overlaps the wheel. */
    inset?: CssLength
    /** Tangential offset from the configured pointer angle. */
    offset?: CssLength
    tipInset?: CssLength
    tangentOffset?: CssLength
    /** Moves a center pointer outward from the center along its configured angle. */
    radialOffset?: CssLength
    /** Draws a center pointer behind its button so both parts form one continuous control. */
    fused?: boolean
    /** `adaptive` preserves the selected preset in a unified silhouette; `droplet` uses one fixed droplet outline. */
    fusionStyle?: PointerFusionStyle
    /** Independent center-pointer reference diameter when fused is false. Defaults to 30%. */
    referenceSize?: CssLength
    opacity?: number
    body?: {
        color?: string
        borderColor?: string
        borderWidth?: CssLength
        opacity?: number
        gradient?: false | { from?: string; to?: string }
        shadeColor?: string | false
        shadeWidth?: CssLength
    }
    mount?:
        | boolean
        | {
              visible?: boolean
              radius?: CssLength
              color?: string
              innerColor?: string
              borderColor?: string
              borderWidth?: CssLength
              opacity?: number
              gradient?: false | { highlight?: string; middle?: string; edge?: string }
          }
    mountRadius?: CssLength
    mountColor?: string
    mountBorderColor?: string
    mountBorderWidth?: CssLength
    accentColor?: string | false
    accentWidth?: CssLength
    shadowColor?: string
    shadowBlur?: CssLength
    shadowOffsetX?: CssLength
    shadowOffsetY?: CssLength
    shadow?:
        | false
        | {
              color?: string
              blur?: CssLength
              offsetX?: CssLength
              radialOffset?: CssLength
          }
    renderer?: (
        this: WheelCanvas,
        ctx: CanvasRenderingContext2D,
        metrics: Readonly<{
            type: PointerType
            width: number
            height: number
            /** Center-pointer sizing reference; equals zero for external pointers. */
            referenceDiameter: number
            wheelRadius: number
            borderWidth: number
            cornerRadius: number
            mountRadius: number
            mountBorderWidth: number
            showMount: boolean
            shadowBlur: number
            shadowTangentOffset: number
            shadowRadialOffset: number
            tangentExtent: number
            layout: PointerLayout
            reserveSpace: boolean
            space: number
            requiredSpace: number
            configuredInset: number
            inwardShift: number
            inset: number
            offset: number
            tipY: number
            baseY: number
            preset: PointerShape | string
            pointer: PointerConfig
            /** Current visual deflection in degrees; excluded from winning geometry. */
            wobbleAngle: number
        }>,
    ) => void
}

export interface PhysicsStartDetail {
    rotation: number
    source?: 'gesture' | 'api'
}

export interface PhysicsReleaseDetail {
    /** Signed angular velocity in degrees per second. */
    velocity: number
    speed: number
    direction: Exclude<PhysicsDirection, 'both'>
    rotation: number
    source: 'gesture' | 'api'
}

export interface PhysicsEndDetail {
    index: number
    prize: Prize | null
    rotation: number
}

export interface PhysicsCancelDetail {
    reason: string
    rotation: number
}

export interface PhysicsConfig {
    enabled?: boolean
    sensitivity?: number
    dragThreshold?: CssLength
    /** Center dead zone that avoids atan2 instability. */
    innerRadius?: CssLength
    /** Minimum release speed in degrees per second. */
    minVelocity?: number
    /** Maximum release speed in degrees per second. */
    maxVelocity?: number
    /** Rolling-friction deceleration in degrees per second squared. */
    friction?: number
    /** Viscous damping coefficient per second. */
    drag?: number
    stopVelocity?: number
    /** Speed maintained while an asynchronous onRelease result is pending. */
    waitingVelocity?: number
    waitingStrategy?: 'hold' | 'coast'
    velocitySmoothing?: number
    sampleWindow?: number
    sampleHalfLife?: number
    releaseWindow?: number
    releaseDamping?: number
    maxSubstep?: number
    maxCatchUp?: number
    minLandingTurns?: number
    maxLandingTurns?: number
    minLandingDuration?: number
    maxLandingDuration?: number
    /** C² bridge duration used to blend coast acceleration into target braking. */
    accelerationBlendDuration?: number
    maxBrake?: number
    maxJerk?: number
    landingSamples?: number
    forbidSpeedUp?: boolean
    /** Continue slowing naturally after result errors, or stop immediately. */
    errorStrategy?: 'coast' | 'stop'
    resultTimeout?: number
    touchAction?: string
    dragFrom?: PhysicsDragFrom
    direction?: PhysicsDirection
    resultMode?: PhysicsResultMode
    snapToPrize?: boolean
    onStart?: (this: WheelCanvas, detail: PhysicsStartDetail, event: PointerEvent | null) => void
    onRelease?: (
        this: WheelCanvas,
        detail: PhysicsReleaseDetail,
        event: PointerEvent | null,
    ) => number | void | Promise<number | void>
    onEnd?: (this: WheelCanvas, detail: PhysicsEndDetail, event: null) => void
    onCancel?: (
        this: WheelCanvas,
        detail: PhysicsCancelDetail,
        event: PointerEvent | Event | null,
    ) => void
}

export interface FeedbackSectorDetail {
    type: 'sector'
    index: number
    previousIndex: number
    prize: Prize | null
    /** Signed angular velocity in degrees per second. */
    angularVelocity: number
    rotation: number
}

export interface FeedbackResultDetail {
    type: 'result'
    index: number
    prize: Prize
    rotation: number
    colors: string[]
}

export interface FeedbackSoundConfig {
    enabled?: boolean
    /** Semantic sound-pack identifier consumed by the configured player. */
    pack?: string
    sectorCue?: string
    resultCue?: string
    volume?: number
    /** Minimum time between sector cues in milliseconds. */
    minInterval?: number
    play?: (
        this: WheelCanvas,
        cue: string,
        detail: FeedbackSectorDetail | FeedbackResultDetail,
        config: FeedbackSoundConfig,
    ) => void | Promise<void>
}

export interface FeedbackCelebrationConfig {
    enabled?: boolean
    style?: string
    particleCount?: number
    disableForReducedMotion?: boolean
    fire?: (
        this: WheelCanvas,
        style: string,
        detail: FeedbackResultDetail,
        config: FeedbackCelebrationConfig,
    ) => void | Promise<void>
}

export interface FeedbackConfig {
    enabled?: boolean
    sound?: FeedbackSoundConfig
    celebration?: FeedbackCelebrationConfig
}

export interface DefaultConfig {
    gutter?: CssLength
    offsetDegree?: number
    speed?: number
    speedFunction?: SpeedFunction
    accelerationTime?: number
    decelerationTime?: number
    stopRange?: CssLength
    useGraphicWeight?: boolean
    graphicWeightSource?: GraphicWeightSource
    dpr?: number
    /** Maximum backing-store DPR. Set to 0 to disable this limit. */
    maxDpr?: number
    /** Maximum canvas backing-store pixel count. Set to 0 to disable this limit. */
    maxCanvasPixels?: number
    /** Maximum number of image loads processed concurrently. Set to 0 for unlimited. */
    imageConcurrency?: number
}

export interface DefaultStyle {
    background?: string
    fontColor?: string
    fontSize?: CssLength
    fontStyle?: string
    fontFamily?: string
    fontWeight?: string | number
    lineHeight?: CssLength | null
    wordWrap?: boolean
    lengthLimit?: CssLength
    lineClamp?: number
    orientation?: TextOrientation
    /** Default radial position for prize text. */
    top?: CssLength
    /** Default tangential offset for prize text. */
    left?: CssLength
    textAlign?: TextAlign
    verticalAlign?: VerticalAlign
    textOverflow?: TextOverflow
    ellipsis?: string
}

export interface LifecycleHooks {
    beforeCreate?: (this: WheelCanvas) => void
    beforeResize?: (this: WheelCanvas) => void
    afterResize?: (this: WheelCanvas) => void
    beforeInit?: (this: WheelCanvas) => void
    afterInit?: (this: WheelCanvas) => void
    beforeDraw?: (this: WheelCanvas, context: CanvasRenderingContext2D) => void
    afterDraw?: (this: WheelCanvas, context: CanvasRenderingContext2D) => void
    afterStart?: (this: WheelCanvas) => void
}

export interface WheelCanvasOptions extends LifecycleHooks {
    width?: CssLength
    height?: CssLength
    ariaLabel?: string
    blocks?: Block[]
    prizes?: Prize[]
    buttons?: Button[]
    pointer?: PointerConfig | null
    physics?: PhysicsConfig
    feedback?: FeedbackConfig
    defaultConfig?: DefaultConfig
    defaultStyle?: DefaultStyle
    start?: (this: WheelCanvas, event: MouseEvent | KeyboardEvent) => void | Promise<void>
    end?: (this: WheelCanvas, prize: Prize) => void
    error?: (this: WheelCanvas, error: unknown) => void
    onCurrentChange?: (this: WheelCanvas, index: number, prize: Prize) => void
}

export interface HostConfig extends LifecycleHooks {
    flag?: string
    el?: WheelTarget
    divElement?: HTMLElement
    canvasElement?: HTMLCanvasElement
    ctx?: CanvasRenderingContext2D
    width?: CssLength
    height?: CssLength
    dpr?: number
    offscreenCanvas?: HTMLCanvasElement
    handleCssUnit?: (value: number, unit: string) => number
    unitFunc?: (value: number, unit: string) => number
    rAF?: (callback: FrameRequestCallback) => number
    cancelAnimationFrame?: (handle: number) => void
    now?: () => number
    random?: () => number
    imageTimeout?: number
    setTimeout?: typeof globalThis.setTimeout
    setInterval?: typeof globalThis.setInterval
    clearTimeout?: typeof globalThis.clearTimeout
    clearInterval?: typeof globalThis.clearInterval
}

export interface PrizeLayout {
    index: number
    weight: number
    startDegree: number
    endDegree: number
    middleDegree: number
    degree: number
    radian: number
}

export class WheelCanvas {
    static readonly version: string
    readonly version: string
    readonly canvas: HTMLCanvasElement
    readonly ctx: CanvasRenderingContext2D
    readonly element: HTMLElement
    readonly ready: Promise<void>
    readonly config: HostConfig
    readonly options: WheelCanvasOptions
    width: CssLength
    height: CssLength
    blocks: Block[]
    prizes: Prize[]
    buttons: Button[]
    pointer: PointerConfig | null
    physics: PhysicsConfig
    feedback: FeedbackConfig
    defaultConfig: DefaultConfig
    defaultStyle: DefaultStyle
    rotation: number
    state: WheelState
    currentPrizeIndex: number
    boxWidth: number
    boxHeight: number
    radius: number
    wheelRadius: number
    prizeRadius: number
    maxButtonRadius: number
    dpr: number
    startCallback?: WheelCanvasOptions['start']
    endCallback?: WheelCanvasOptions['end']
    errorCallback?: WheelCanvasOptions['error']
    onCurrentChangeCallback?: WheelCanvasOptions['onCurrentChange']

    constructor(target: WheelTarget, options?: WheelCanvasOptions)
    constructor(hostConfig: HostConfig, options?: WheelCanvasOptions)

    init(): Promise<void>
    update(patch?: Partial<WheelCanvasOptions>): Promise<void>
    /** Updates both logical dimensions with one resize pass. Height defaults to width. */
    setSize(width: CssLength, height?: CssLength): void
    resize(): void
    draw(): void
    clearCanvas(): void
    play(): boolean
    /** Starts an inertial spin with signed velocity in degrees per second. */
    spin(velocity: number): boolean
    stop(index?: number): boolean
    getCurrentPrizeIndex(): number
    conversionAxis(x: number, y: number): [number, number]
    isRunning(): boolean
    isWeb(): boolean
    destroy(): void

    getLength(value: CssLength, relativeLength?: number): number
    changeUnits(value: CssLength, relativeLength?: number): number
    getOffsetX(width: number, maxWidth: number): number
    loadImg(src: string, info?: ImageConfig): Promise<HTMLImageElement>
    drawImage(context: CanvasRenderingContext2D, image: CanvasImageSource, ...rect: number[]): void
    computedWidthAndHeight(
        image: CanvasImageSource,
        imageInfo: ImageConfig,
        maxWidth: number,
        maxHeight: number,
    ): [number, number]
    getOffscreenCanvas(
        width?: number,
        height?: number,
    ): {
        _offscreenCanvas: HTMLCanvasElement
        _ctx: CanvasRenderingContext2D
    }
    $set<T extends object, K extends keyof T>(data: T, key: K, value: T[K]): void
    $computed<T extends object, K extends PropertyKey>(
        data: T,
        key: K,
        callback: () => unknown,
    ): void
    $watch<T>(
        expression: string | (() => T),
        handler:
            | ((value: T, oldValue?: T) => void)
            | {
                  handler: (value: T, oldValue?: T) => void
                  deep?: boolean
                  immediate?: boolean
              },
        options?: { deep?: boolean; immediate?: boolean },
    ): () => void
}

export const version: string
export function createWheelCanvas(target: WheelTarget, options?: WheelCanvasOptions): WheelCanvas
export function createWheelCanvas(hostConfig: HostConfig, options?: WheelCanvasOptions): WheelCanvas

declare const WheelCanvasJS: {
    readonly version: typeof version
    readonly WheelCanvas: typeof WheelCanvas
    readonly createWheelCanvas: typeof createWheelCanvas
}

export default WheelCanvasJS
