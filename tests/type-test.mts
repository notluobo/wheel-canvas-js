import WheelCanvasJS, {
    WheelCanvas,
    createWheelCanvas,
    type WheelCanvasOptions,
    type PointerFusionStyle,
} from 'wheel-canvas-js'

declare const container: HTMLDivElement
const pointerFusionStyle: PointerFusionStyle = 'droplet'
void pointerFusionStyle

const options: WheelCanvasOptions = {
    prizes: [
        {
            range: 1,
            displayWeight: 2,
            fonts: [{ text: '竖排', orientation: 'vertical', lineClamp: 2, ellipsis: '…' }],
        },
    ],
    defaultConfig: {
        useGraphicWeight: true,
        maxDpr: 3,
        maxCanvasPixels: 16777216,
        imageConcurrency: 6,
    },
    pointer: {
        type: 'external',
        angle: 45,
        preset: 'soft',
        colorSource: 'currentPrize',
        wobble: { amplitude: 3, respectReducedMotion: true },
        layout: 'overlay',
        body: { gradient: { from: '#5b21b6', to: '#a78bfa' } },
    },
    physics: {
        enabled: true,
        direction: 'clockwise',
        maxSubstep: 8,
        errorStrategy: 'stop',
    },
    feedback: {
        sound: {
            enabled: true,
            play(cue, detail) {
                void [cue, detail.type, this.rotation]
            },
        },
        celebration: {
            enabled: true,
            fire(style, detail) {
                void [style, detail.index, this.rotation]
            },
        },
    },
}

const direct = new WheelCanvas(container, options)
const factory = createWheelCanvas(container, options)
const defaultFactory = WheelCanvasJS.createWheelCanvas(container, options)

direct.setSize(720)
void [direct, factory, defaultFactory]
