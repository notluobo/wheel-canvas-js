const assert = require('assert')

function createContext() {
    return {
        setTransform() {},
        clearRect() {},
        beginPath() {},
        moveTo() {},
        lineTo() {},
        arc() {},
        closePath() {},
        fill() {},
        save() {},
        restore() {},
        translate() {},
        rotate() {},
        fillText() {},
        drawImage() {},
        measureText(text) {
            return { width: String(text).length * 8 }
        },
    }
}

const context = createContext()
const canvasListeners = {}
const canvas = {
    nodeType: 1,
    tagName: 'CANVAS',
    dataset: {},
    style: {},
    width: 0,
    height: 0,
    getContext: () => context,
    setAttribute() {},
    addEventListener: (name, callback) => {
        canvasListeners[name] = callback
    },
    removeEventListener: name => {
        delete canvasListeners[name]
    },
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 300, height: 300 }),
}

const container = {
    nodeType: 1,
    tagName: 'DIV',
    clientWidth: 300,
    clientHeight: 300,
    style: {},
    querySelector: () => null,
    appendChild() {},
}

global.document = {
    documentElement: {},
    querySelector: () => container,
    createElement: tagName => {
        assert.strictEqual(tagName, 'canvas')
        return canvas
    },
}

global.window = {
    devicePixelRatio: 2,
    innerWidth: 1280,
    innerHeight: 720,
    getComputedStyle: () => ({ fontSize: '16px' }),
    addEventListener() {},
    removeEventListener() {},
    requestAnimationFrame: callback => setTimeout(() => callback(performance.now()), 1),
    cancelAnimationFrame: frameId => clearTimeout(frameId),
}

const { WheelCanvas } = require('../dist/wheel-canvas-js.umd.js')

async function run() {
    let result = null
    const changes = []
    let resolveEnd
    const ended = new Promise(resolve => {
        resolveEnd = resolve
    })

    const wheel = new WheelCanvas(container, {
        width: 300,
        height: 300,
        blocks: [{ padding: 8, background: '#f00' }],
        prizes: [
            { background: '#fff', fonts: [{ text: 'A' }] },
            { background: '#eee', fonts: [{ text: 'B' }] },
            { background: '#fff', fonts: [{ text: 'C' }] },
            { background: '#eee', fonts: [{ text: 'D' }] },
        ],
        buttons: [{ radius: '30%', background: '#f60', pointer: true }],
        defaultConfig: {
            speed: 10,
            accelerationTime: 5,
            decelerationTime: 15,
        },
        onCurrentChange: index => changes.push(index),
        end: prize => {
            result = prize
            resolveEnd()
        },
    })

    await wheel.ready
    assert.strictEqual(canvas.width, 600)
    assert.strictEqual(wheel.play(), true)
    assert.strictEqual(wheel.stop(2), true)

    await Promise.race([
        ended,
        new Promise((resolve, reject) => {
            setTimeout(() => reject(new Error('WheelCanvas animation timed out')), 1000)
        }),
    ])

    assert.strictEqual(result.fonts[0].text, 'C')
    assert.strictEqual(wheel.getCurrentPrizeIndex(), 2)
    assert.strictEqual(wheel.isRunning(), false)
    assert.ok(changes.includes(2))
    wheel.destroy()
    console.log('Standalone WheelCanvas smoke test passed')
}

run().catch(error => {
    console.error(error)
    process.exitCode = 1
})
