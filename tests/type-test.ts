import WheelCanvasJS = require('wheel-canvas-js')

declare const container: HTMLDivElement
declare const canvas: HTMLCanvasElement
declare const context: CanvasRenderingContext2D

const pointerLayout: WheelCanvasJS.PointerLayout = 'stable'
const pointerFusionStyle: WheelCanvasJS.PointerFusionStyle = 'adaptive'
const pointerColorSource: WheelCanvasJS.PointerColorSource = 'currentPrize'
void [pointerLayout, pointerFusionStyle, pointerColorSource]

const centerPointer: WheelCanvasJS.PointerConfig = {
    type: 'center',
    preset: 'arrow',
    angle: 90,
    radialOffset: 8,
    fused: true,
    fusionStyle: 'adaptive',
    colorSource: 'currentPrize',
    wobble: { enabled: true, amplitude: 2.5, duration: 180, frequency: 14, damping: 12 },
    shadow: false,
}
void centerPointer

const prizes: WheelCanvasJS.Prize[] = [
    { range: 1, displayWeight: 2, fonts: [{ text: '一等奖' }] },
    { range: 9, displayWeight: 1, fonts: [{ text: '谢谢参与' }] },
]

const options: WheelCanvasJS.WheelCanvasOptions = {
    width: '320px',
    height: '320px',
    prizes,
    buttons: [
        {
            visible: true,
            textVisible: true,
            radius: '30%',
            borderColor: '#fff',
            borderWidth: 4,
            shadowBlur: 0,
            fonts: [{ text: '开始', verticalAlign: 'middle', textOverflow: 'ellipsis' }],
        },
    ],
    pointer: {
        type: 'external',
        position: 'top',
        preset: 'ribbon',
        color: '#7c3aed',
        colorSource: 'currentPrize',
        wobble: true,
        cornerRadius: 3,
        layout: 'stable',
        space: 18,
        body: {
            gradient: { from: '#5b21b6', to: '#a78bfa' },
            shadeColor: '#3b0764',
            shadeWidth: 1.2,
        },
        accentColor: false,
        mount: {
            color: '#fff',
            innerColor: '#ddd6fe',
            gradient: { highlight: '#fff', middle: '#eee', edge: '#ccc' },
        },
        shadow: false,
        renderer(ctx, metrics) {
            ctx.lineTo(0, metrics.tipY)
        },
    },
    physics: {
        enabled: true,
        innerRadius: '8%',
        friction: 24,
        drag: 0.68,
        waitingStrategy: 'coast',
        forbidSpeedUp: true,
        accelerationBlendDuration: 120,
        errorStrategy: 'coast',
        onRelease(detail) {
            return detail.speed > 1000 ? 0 : undefined
        },
        onCancel(detail, event) {
            void detail.reason
            event?.preventDefault()
        },
    },
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
                void [cue, detail.type, config.volume, this.rotation]
            },
        },
        celebration: {
            enabled: true,
            style: 'subtle',
            particleCount: 48,
            disableForReducedMotion: true,
            fire(style, detail, config) {
                void [style, detail.colors, config.particleCount, this.rotation]
            },
        },
    },
    defaultConfig: {
        useGraphicWeight: true,
        graphicWeightSource: 'displayWeight',
        maxDpr: 3,
        maxCanvasPixels: 16777216,
        imageConcurrency: 6,
    },
    defaultStyle: {
        orientation: 'horizontal',
        top: '18%',
        left: 0,
        textAlign: 'center',
        verticalAlign: 'middle',
        textOverflow: 'clip',
    },
    start() {
        this.play()
    },
    end(prize) {
        void prize.range
    },
    error(error) {
        console.error(error)
    },
}

const directWheel = new WheelCanvasJS.WheelCanvas(container, options)
const hostConfig: WheelCanvasJS.HostConfig = {
    canvasElement: canvas,
    ctx: context,
    now: Date.now,
}
const hostedWheel = WheelCanvasJS.createWheelCanvas(hostConfig, options)
const factoryWheel = WheelCanvasJS.createWheelCanvas(container, options)

const axis: [number, number] = directWheel.conversionAxis(10, 20)
const physicalStarted: boolean = directWheel.spin(720)
const feedback: WheelCanvasJS.FeedbackConfig = directWheel.feedback
directWheel.setSize('720px')
void [hostedWheel, factoryWheel, axis, physicalStarted, feedback]
