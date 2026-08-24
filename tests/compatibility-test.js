const assert = require('assert')

function createCanvas() {
    const calls = {
        clearRect: 0,
        drawImage: 0,
        fillText: 0,
    }
    const context = {
        canvas: null,
        setTransform() {},
        scale() {},
        clearRect() {
            calls.clearRect += 1
        },
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
        fillText() {
            calls.fillText += 1
        },
        drawImage() {
            calls.drawImage += 1
        },
        measureText(text) {
            return { width: String(text).length * 8 }
        },
    }
    const listeners = {}
    const attributes = {}
    const canvas = {
        nodeType: 1,
        tagName: 'CANVAS',
        dataset: {},
        style: {},
        width: 0,
        height: 0,
        parentElement: null,
        getContext: () => context,
        setAttribute: (name, value) => {
            attributes[name] = value
        },
        addEventListener: (name, callback) => {
            listeners[name] = callback
        },
        removeEventListener: name => {
            delete listeners[name]
        },
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 320, height: 320 }),
    }
    context.canvas = canvas
    return { canvas, context, calls, listeners, attributes }
}

const createdCanvases = []
let observerDisconnected = false

global.document = {
    documentElement: {},
    querySelector: () => null,
    createElement: tagName => {
        assert.strictEqual(tagName, 'canvas')
        const item = createCanvas()
        createdCanvases.push(item)
        return item.canvas
    },
}

global.window = {
    devicePixelRatio: 1,
    innerWidth: 1280,
    innerHeight: 720,
    getComputedStyle: () => ({ fontSize: '16px' }),
    addEventListener() {},
    removeEventListener() {},
    setTimeout,
    setInterval,
    clearTimeout,
    clearInterval,
    requestAnimationFrame: callback => setTimeout(() => callback(performance.now()), 1),
    cancelAnimationFrame: frameId => clearTimeout(frameId),
    MutationObserver: class MutationObserver {
        constructor(callback) {
            this.callback = callback
        }
        observe() {}
        disconnect() {
            observerDisconnected = true
        }
    },
}

let lastImage = null
global.Image = class Image {
    constructor() {
        this.width = 100
        this.height = 50
        this.naturalWidth = 100
        this.naturalHeight = 50
        lastImage = this
    }

    set src(value) {
        this._src = value
        queueMicrotask(() => this.onload())
    }

    get src() {
        return this._src
    }
}

const WheelCanvasJS = require('../dist/wheel-canvas-js.umd.js')

async function run() {
    const host = createCanvas()
    const lifecycle = []
    let formatterCalled = false
    let animationFrameCalled = false

    const data = {
        width: '320px',
        height: '320px',
        blocks: [
            {
                padding: '10px',
                background: '#f00',
                imgs: [{ src: 'ring.png', width: '50%', rotate: true }],
            },
        ],
        prizes: [
            {
                range: 0,
                background: '#fff',
                fonts: [
                    {
                        text: 'A very long prize',
                        top: '10%',
                        left: '1px',
                        fontColor: '#111',
                        fontSize: '16px',
                        fontStyle: 'serif',
                        fontWeight: '700',
                        lineHeight: '20px',
                        wordWrap: true,
                        lengthLimit: '80%',
                        lineClamp: 2,
                    },
                ],
                imgs: [
                    {
                        src: 'prize.png',
                        top: '30%',
                        left: '2px',
                        width: '30%',
                        formatter(image) {
                            formatterCalled = true
                            return image
                        },
                    },
                ],
            },
            { range: 10, background: '#eee', fonts: [{ text: 'B' }] },
            { range: 0, background: '#fff', fonts: [{ text: 'C' }] },
        ],
        buttons: [
            {
                radius: '30%',
                pointer: true,
                background: '#f60',
                fonts: [{ text: '开始', top: '-10px' }],
                imgs: [{ src: 'button.png', width: '20px', height: '10px' }],
            },
        ],
        defaultConfig: {
            gutter: '2px',
            offsetDegree: 5,
            speed: 8,
            speedFunction: 'cubic',
            accelerationTime: 5,
            decelerationTime: 15,
            stopRange: 0.8,
        },
        defaultStyle: {
            background: '#fafafa',
            fontColor: '#333',
            fontSize: '15px',
            fontStyle: 'sans-serif',
            fontWeight: '400',
            lineHeight: '18px',
            wordWrap: true,
            lengthLimit: '90%',
            lineClamp: 2,
        },
        onCurrentChange: index => lifecycle.push(`change:${index}`),
    }

    const wheel = new WheelCanvasJS.WheelCanvas(
        {
            flag: 'WEB',
            canvasElement: host.canvas,
            ctx: host.context,
            dpr: 2,
            handleCssUnit: (number, unit) => (unit === 'rpx' ? number / 2 : number),
            rAF: callback => {
                animationFrameCalled = true
                return setTimeout(() => callback(performance.now()), 1)
            },
            cancelAnimationFrame: frameId => clearTimeout(frameId),
            beforeCreate: () => lifecycle.push('beforeCreate'),
            beforeResize: () => lifecycle.push('beforeResize'),
            afterResize: () => lifecycle.push('afterResize'),
            beforeInit: () => lifecycle.push('beforeInit'),
            afterInit: () => lifecycle.push('afterInit'),
            beforeDraw: () => lifecycle.push('beforeDraw'),
            afterDraw: () => lifecycle.push('afterDraw'),
            afterStart: () => lifecycle.push('afterStart'),
        },
        data,
    )

    await wheel.ready

    assert.strictEqual(WheelCanvasJS.version, require('../package.json').version)
    assert.strictEqual(WheelCanvasJS.WheelCanvas.version, WheelCanvasJS.version)
    assert.strictEqual(wheel.version, WheelCanvasJS.version)
    assert.strictEqual(host.canvas.width, 640)
    assert.strictEqual(host.canvas.height, 640)
    assert.strictEqual(host.attributes.package, `wheel-canvas-js@${WheelCanvasJS.version}`)
    assert.strictEqual(wheel.config.dpr, 2)
    assert.strictEqual(wheel.getLength('20rpx'), 10)
    assert.strictEqual(wheel.isWeb(), true)
    assert.strictEqual(formatterCalled, true)
    assert.strictEqual(lastImage.crossOrigin, 'anonymous')
    assert.ok(host.calls.drawImage > 0)
    assert.ok(host.calls.fillText > 0)

    assert.ok(lifecycle.indexOf('beforeCreate') < lifecycle.indexOf('beforeResize'))
    assert.ok(lifecycle.indexOf('beforeResize') < lifecycle.indexOf('afterResize'))
    assert.ok(lifecycle.indexOf('afterResize') < lifecycle.indexOf('beforeInit'))
    assert.ok(lifecycle.indexOf('beforeInit') < lifecycle.indexOf('afterInit'))

    let reactiveDraws = 0
    const originalDraw = wheel.draw.bind(wheel)
    wheel.draw = () => {
        reactiveDraws += 1
        return originalDraw()
    }
    wheel.defaultStyle.background = '#123456'
    wheel.prizes[0].background = '#654321'
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.ok(reactiveDraws > 0)

    wheel.width = '300px'
    assert.strictEqual(host.canvas.width, 600)
    wheel.$set(wheel.defaultConfig, 'speed', 9)
    assert.strictEqual(wheel.defaultConfig.speed, 9)

    let endPrize = null
    let resolveEnd
    const ended = new Promise(resolve => {
        resolveEnd = resolve
    })
    wheel.endCallback = prize => {
        endPrize = prize
        resolveEnd()
    }

    assert.strictEqual(wheel.play(), true)
    assert.strictEqual(wheel.stop(), true)
    await Promise.race([
        ended,
        new Promise((resolve, reject) => {
            setTimeout(() => reject(new Error('Compatibility animation timed out')), 1000)
        }),
    ])

    assert.strictEqual(endPrize.fonts[0].text, 'B')
    assert.strictEqual(wheel.getCurrentPrizeIndex(), 1)
    assert.strictEqual(animationFrameCalled, true)
    assert.ok(lifecycle.includes('afterStart'))

    await wheel.update({
        width: '280px',
        defaultConfig: { speedFunction: 'sine' },
        defaultStyle: { fontColor: '#abc' },
    })
    assert.strictEqual(wheel.boxWidth, 280)
    assert.strictEqual(wheel.defaultConfig.speedFunction, 'sine')
    assert.strictEqual(wheel.defaultStyle.fontColor, '#abc')

    const graphicPrizes = [
        { range: 100, displayWeight: 1, fonts: [{ text: '小扇区' }] },
        { range: 100, displayWeight: 2, fonts: [{ text: '中扇区' }] },
        { range: 100, displayWeight: 3, fonts: [{ text: '大扇区' }] },
    ]
    await wheel.update({
        prizes: graphicPrizes,
        defaultConfig: {
            useGraphicWeight: false,
            speedFunction: 'quad',
            accelerationTime: 5,
            decelerationTime: 15,
            stopRange: 0,
        },
    })
    assert.deepStrictEqual(
        wheel._getPrizeLayout().map(item => Math.round(item.degree)),
        [120, 120, 120],
    )

    wheel.defaultConfig.useGraphicWeight = true
    await Promise.resolve()
    assert.deepStrictEqual(
        wheel._getPrizeLayout().map(item => Math.round(item.degree)),
        [60, 120, 180],
    )

    let graphicEndPrize = null
    let resolveGraphicEnd
    const graphicEnded = new Promise(resolve => {
        resolveGraphicEnd = resolve
    })
    wheel.endCallback = prize => {
        graphicEndPrize = prize
        resolveGraphicEnd()
    }
    assert.strictEqual(wheel.play(), true)
    assert.strictEqual(wheel.stop(2), true)
    await Promise.race([
        graphicEnded,
        new Promise((resolve, reject) => {
            setTimeout(() => reject(new Error('Graphic-weight animation timed out')), 1000)
        }),
    ])
    assert.strictEqual(graphicEndPrize.fonts[0].text, '大扇区')
    assert.strictEqual(wheel.getCurrentPrizeIndex(), 2)

    let changedLayoutPrize = null
    let resolveChangedLayout
    const changedLayoutEnded = new Promise(resolve => {
        resolveChangedLayout = resolve
    })
    wheel.endCallback = prize => {
        changedLayoutPrize = prize
        resolveChangedLayout()
    }
    assert.strictEqual(wheel.play(), true)
    assert.strictEqual(wheel.stop(1), true)
    const layoutWaitStarted = Date.now()
    while (wheel.state !== 'decelerating' && Date.now() - layoutWaitStarted < 500) {
        await new Promise(resolve => setTimeout(resolve, 1))
    }
    assert.strictEqual(wheel.state, 'decelerating')
    wheel.defaultConfig.useGraphicWeight = false
    await Promise.race([
        changedLayoutEnded,
        new Promise((resolve, reject) => {
            setTimeout(() => reject(new Error('Changed-layout animation timed out')), 1000)
        }),
    ])
    assert.strictEqual(changedLayoutPrize.fonts[0].text, '中扇区')
    assert.strictEqual(wheel.getCurrentPrizeIndex(), 1)

    wheel.defaultConfig.stopRange = 0.8
    let resolveStyleChangeEnd
    const styleChangeEnded = new Promise(resolve => {
        resolveStyleChangeEnd = resolve
    })
    wheel.endCallback = () => resolveStyleChangeEnd()
    const originalRandom = Math.random
    Math.random = () => 0.1
    assert.strictEqual(wheel.play(), true)
    assert.strictEqual(wheel.stop(0), true)
    const styleWaitStarted = Date.now()
    while (wheel.state !== 'decelerating' && Date.now() - styleWaitStarted < 500) {
        await new Promise(resolve => setTimeout(resolve, 1))
    }
    assert.strictEqual(wheel.state, 'decelerating')
    const jitteredTargetRotation = wheel._decelerationTo
    wheel.defaultStyle.fontColor = '#fedcba'
    await Promise.race([
        styleChangeEnded,
        new Promise((resolve, reject) => {
            setTimeout(() => reject(new Error('Style-change animation timed out')), 1000)
        }),
    ])
    Math.random = originalRandom
    assert.strictEqual(wheel.rotation, jitteredTargetRotation)

    await wheel.update({
        prizes: [
            { range: 1, fonts: [{ text: '1' }] },
            { range: 2, fonts: [{ text: '2' }] },
            { range: 3, fonts: [{ text: '3' }] },
        ],
        defaultConfig: { useGraphicWeight: true },
    })
    assert.deepStrictEqual(
        wheel._getPrizeLayout().map(item => Math.round(item.degree)),
        [60, 120, 180],
    )

    const beforeClear = host.calls.clearRect
    wheel.clearCanvas()
    assert.ok(host.calls.clearRect > beforeClear)
    wheel.destroy()
    assert.strictEqual(observerDisconnected, true)

    console.log('Standalone WheelCanvas compatibility test passed')
}

run().catch(error => {
    console.error(error)
    process.exitCode = 1
})
