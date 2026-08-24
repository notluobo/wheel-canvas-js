import * as umdModule from './wheel-canvas-js.umd.js'

const WheelCanvasJS = umdModule.default || globalThis.WheelCanvasJS

if (!WheelCanvasJS) {
    throw new Error('WheelCanvasJS failed to initialize its UMD core')
}

export const version = WheelCanvasJS.version
export const WheelCanvas = WheelCanvasJS.WheelCanvas
export const createWheelCanvas = WheelCanvasJS.createWheelCanvas
export default WheelCanvasJS
