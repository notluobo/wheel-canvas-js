const assert = require('assert')
const { performance } = require('perf_hooks')

function createCanvas() {
    const attributes = new Map()
    const listeners = new Map()
    const context = {
        canvas: null,
        measureTextCalls: 0,
        setTransform() {},
        clearRect() {},
        beginPath() {},
        closePath() {},
        moveTo() {},
        lineTo() {},
        arc() {},
        rect() {},
        clip() {},
        fill() {},
        stroke() {},
        save() {},
        restore() {},
        translate() {},
        rotate() {},
        fillText() {},
        drawImage() {},
        scale() {},
        createLinearGradient() {
            return { addColorStop() {} }
        },
        createRadialGradient() {
            return { addColorStop() {} }
        },
        measureText(text) {
            this.measureTextCalls += 1
            return { width: Array.from(String(text)).length * 8 }
        },
    }
    const canvas = {
        nodeType: 1,
        tagName: 'CANVAS',
        dataset: {},
        style: {},
        parentElement: null,
        width: 0,
        height: 0,
        getContext: () => context,
        getAttribute: name => attributes.get(name) || null,
        setAttribute: (name, value) => attributes.set(name, String(value)),
        removeAttribute: name => attributes.delete(name),
        addEventListener: (name, listener) => listeners.set(name, listener),
        removeEventListener: name => listeners.delete(name),
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 480, height: 480 }),
    }
    context.canvas = canvas
    return { canvas, context, listeners }
}

const fontListeners = new Map()
const container = {
    nodeType: 1,
    tagName: 'DIV',
    clientWidth: 480,
    clientHeight: 480,
    style: {},
    parentElement: null,
    querySelector: () => null,
    appendChild() {},
}

global.document = {
    documentElement: {},
    querySelector: () => container,
    createElement: () => createCanvas().canvas,
    fonts: {
        addEventListener(name, listener) {
            fontListeners.set(name, listener)
        },
        removeEventListener(name) {
            fontListeners.delete(name)
        },
    },
}

global.window = {
    devicePixelRatio: 8,
    innerWidth: 1280,
    innerHeight: 720,
    getComputedStyle: () => ({ fontSize: '16px' }),
    addEventListener() {},
    removeEventListener() {},
    setTimeout,
    setInterval,
    clearTimeout,
    clearInterval,
}

const { WheelCanvas } = require('../dist/wheel-canvas-js.umd.js')

async function run() {
    const host = createCanvas()
    const prizes = Array.from({ length: 72 }, (_, index) => ({
        range: index + 1,
        displayWeight: (index % 5) + 1,
        background: index % 2 ? '#f5f3ff' : '#ede9fe',
        fonts: [
            {
                text: `Prize ${index + 1} with a deliberately long label`,
                lineClamp: 2,
                textOverflow: 'ellipsis',
                lengthLimit: '82%',
            },
        ],
    }))
    const wheel = new WheelCanvas(
        {
            canvasElement: host.canvas,
            ctx: host.context,
        },
        {
            width: 480,
            height: 480,
            prizes,
            blocks: [{ padding: 8, background: '#18181b' }],
            buttons: [
                {
                    radius: '18%',
                    background: '#ffffff',
                    fonts: [{ text: 'SPIN', lineClamp: 1 }],
                },
            ],
            pointer: {
                type: 'external',
                preset: 'minimal',
                position: 'top',
                layout: 'fit',
                shadow: false,
            },
            defaultConfig: {
                useGraphicWeight: true,
                maxDpr: 3,
                maxCanvasPixels: 16777216,
            },
        },
    )
    await wheel.ready

    assert.strictEqual(wheel.dpr, 3, 'default maxDpr must cap unusually large device DPR')
    assert.ok(
        host.canvas.width * host.canvas.height <= 16777216,
        'the backing canvas must stay inside the configured pixel budget',
    )

    const firstLayout = wheel._getPrizeLayout()
    assert.strictEqual(firstLayout, wheel._getPrizeLayout(), 'stable layouts should be cached')

    let metricCalculations = 0
    const getExternalPointerMetrics = wheel._getExternalPointerMetrics.bind(wheel)
    wheel._getExternalPointerMetrics = () => {
        metricCalculations += 1
        return getExternalPointerMetrics()
    }
    wheel._invalidateRenderCaches()
    host.context.measureTextCalls = 0
    wheel.draw()
    assert.ok(host.context.measureTextCalls > 0, 'the warm-up draw must measure text')
    assert.strictEqual(metricCalculations, 1)

    host.context.measureTextCalls = 0
    const startedAt = performance.now()
    for (let frame = 0; frame < 240; frame += 1) {
        wheel.rotation += 4.5
        wheel.draw()
    }
    const elapsed = performance.now() - startedAt
    assert.strictEqual(
        host.context.measureTextCalls,
        0,
        'animation frames must reuse cached text layout',
    )
    assert.strictEqual(
        metricCalculations,
        1,
        'animation frames must reuse external pointer geometry',
    )
    assert.ok(elapsed < 2000, `240 cached mock frames took ${elapsed.toFixed(1)}ms`)

    host.context.measureTextCalls = 0
    const layoutBeforeTextChange = wheel._getPrizeLayout()
    wheel.prizes[0].fonts[0].text = 'Updated prize label that needs a fresh layout'
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.ok(host.context.measureTextCalls > 0, 'text changes must invalidate the layout cache')
    assert.notStrictEqual(
        wheel._getPrizeLayout(),
        layoutBeforeTextChange,
        'reactive prize changes must invalidate cached layout objects',
    )

    const calculationsBeforePointerChange = metricCalculations
    wheel.pointer.width = '12%'
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.strictEqual(
        metricCalculations,
        calculationsBeforePointerChange + 1,
        'pointer geometry changes must recalculate the cached fit once',
    )
    wheel.draw()
    assert.strictEqual(
        metricCalculations,
        calculationsBeforePointerChange + 1,
        'the recalculated pointer fit must be reused by later frames',
    )

    host.context.measureTextCalls = 0
    fontListeners.get('loadingdone')()
    assert.ok(host.context.measureTextCalls > 0, 'loaded web fonts must trigger fresh measurements')

    wheel.defaultConfig.maxCanvasPixels = 1000000
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.ok(
        host.canvas.width * host.canvas.height <= 1005000,
        'reactive maxCanvasPixels changes must lower DPR without a manual resize',
    )

    wheel.width = 100000
    wheel.height = 100000
    assert.ok(wheel.dpr < 0.1, 'very large logical canvases must be allowed to use a DPR below 0.1')
    assert.ok(
        host.canvas.width * host.canvas.height <= 1005000,
        'extreme logical dimensions must not bypass the backing-store pixel budget',
    )

    const offscreen = wheel.getOffscreenCanvas(1000000, 1000000)._offscreenCanvas
    assert.ok(
        offscreen.width * offscreen.height <= 1005000,
        'offscreen canvases must use the same backing-store pixel budget',
    )

    let activeImageLoads = 0
    let peakImageLoads = 0
    let releaseImageLoads
    const imageLoadGate = new Promise(resolve => {
        releaseImageLoads = resolve
    })
    wheel.loadImg = async () => {
        activeImageLoads += 1
        peakImageLoads = Math.max(peakImageLoads, activeImageLoads)
        await imageLoadGate
        activeImageLoads -= 1
        return { width: 32, height: 32 }
    }
    wheel.defaultConfig.imageConcurrency = 3
    await new Promise(resolve => setTimeout(resolve, 0))
    wheel._reactiveReady = false
    wheel.prizes = Array.from({ length: 12 }, (_, index) => ({
        imgs: [{ src: `performance-image-a-${index}.png` }],
    }))
    wheel._reactiveReady = true
    const firstImageBatch = wheel._loadImages()
    wheel._reactiveReady = false
    wheel.prizes = Array.from({ length: 12 }, (_, index) => ({
        imgs: [{ src: `performance-image-b-${index}.png` }],
    }))
    wheel._reactiveReady = true
    const secondImageBatch = wheel._loadImages()
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.strictEqual(
        peakImageLoads,
        3,
        'overlapping image batches must share the imageConcurrency limit',
    )
    releaseImageLoads()
    await Promise.all([firstImageBatch, secondImageBatch])

    let resolveStaleImage
    wheel.loadImg = () =>
        new Promise(resolve => {
            resolveStaleImage = resolve
        })
    wheel._reactiveReady = false
    wheel.prizes = [{ imgs: [{ src: 'removed-before-load.png' }] }]
    wheel._reactiveReady = true
    const staleLoad = wheel._loadImages()
    await Promise.resolve()
    assert.strictEqual(typeof resolveStaleImage, 'function')
    wheel._reactiveReady = false
    wheel.prizes = []
    wheel._reactiveReady = true
    await wheel._loadImages()
    resolveStaleImage({ width: 32, height: 32 })
    await staleLoad
    assert.strictEqual(
        wheel.imageCache.has('removed-before-load.png'),
        false,
        'late removed images must not re-enter the active cache',
    )

    wheel.destroy()
    assert.strictEqual(fontListeners.size, 0, 'font listeners must be released on destroy')
    assert.strictEqual(wheel._prizeLayoutCache, null)
    assert.strictEqual(wheel._geometryCache, null)
}

run()
    .then(() => console.log('Standalone WheelCanvas performance test passed'))
    .catch(error => {
        console.error(error)
        process.exitCode = 1
    })
