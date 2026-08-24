const assert = require('assert')

function createCanvas() {
    const listeners = {}
    const attributes = {}
    const context = {
        canvas: null,
        setTransform() {},
        scale() {},
        clearRect() {},
        beginPath() {},
        bezierCurveTo(...points) {
            this.bezierCalls = (this.bezierCalls || 0) + 1
            if (this.captureBezierPoints) this.bezierPoints.push(points)
        },
        quadraticCurveTo(...points) {
            this.quadraticCalls = (this.quadraticCalls || 0) + 1
            if (this.captureQuadraticPoints) this.quadraticPoints.push(points)
        },
        createLinearGradient() {
            this.gradientCalls = (this.gradientCalls || 0) + 1
            return {
                addColorStop: () => {
                    if (this.throwGradient) throw new Error('invalid gradient color')
                    this.gradientStopCalls = (this.gradientStopCalls || 0) + 1
                },
            }
        },
        createRadialGradient() {
            this.radialGradientCalls = (this.radialGradientCalls || 0) + 1
            return {
                addColorStop: () => {
                    if (this.throwGradient) throw new Error('invalid gradient color')
                    this.radialGradientStopCalls = (this.radialGradientStopCalls || 0) + 1
                },
            }
        },
        moveTo(x, y) {
            if (this.captureMovePoints) this.movePoints.push({ x, y })
        },
        lineTo(x, y) {
            if (this.captureLinePoints) this.linePoints.push({ x, y })
        },
        rect() {},
        clip(rule) {
            this.clipRules = this.clipRules || []
            this.clipRules.push(rule)
        },
        arc(...points) {
            if (this.captureArcPoints) this.arcPoints.push(points)
        },
        closePath() {},
        fill() {
            if (this.captureFillAlpha) this.fillAlphas.push(this.globalAlpha)
            if (this.captureFillStyles) this.fillStyles.push(this.fillStyle)
            if (this.captureDrawOperations) {
                this.drawOperations.push({ type: 'fill', fillStyle: this.fillStyle })
            }
        },
        stroke() {
            this.strokeCalls = (this.strokeCalls || 0) + 1
            if (this.captureDrawOperations) {
                this.drawOperations.push({
                    type: 'stroke',
                    lineWidth: this.lineWidth,
                    strokeStyle: this.strokeStyle,
                })
            }
        },
        save() {
            this.saveDepth = (this.saveDepth || 0) + 1
        },
        restore() {
            this.saveDepth = Math.max(0, (this.saveDepth || 0) - 1)
        },
        translate() {},
        rotate() {},
        fillText(text, x, y) {
            if (this.captureText) {
                this.textCalls.push({
                    text: String(text),
                    textAlign: this.textAlign,
                    textBaseline: this.textBaseline,
                    x,
                    y,
                })
            }
        },
        drawImage() {},
        measureText: text => ({ width: String(text).length * 8 }),
        imageSmoothingEnabled: false,
        imageSmoothingQuality: 'low',
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
        getAttribute: name => (attributes[name] == null ? null : attributes[name]),
        setAttribute: (name, value) => {
            attributes[name] = String(value)
        },
        removeAttribute: name => {
            delete attributes[name]
        },
        addEventListener: (name, callback) => {
            listeners[name] = callback
        },
        removeEventListener: name => {
            delete listeners[name]
        },
        getBoundingClientRect: () => ({ left: 0, top: 0, width: 300, height: 300 }),
    }
    context.canvas = canvas
    return { canvas, context, listeners, attributes }
}

const host = createCanvas()
let imageInstances = 0
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
    createElement: () => host.canvas,
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
}

global.Image = class Image {
    constructor() {
        imageInstances += 1
        this.width = 10
        this.height = 10
        this.naturalWidth = 10
        this.naturalHeight = 10
    }

    set src(value) {
        this._src = value
        queueMicrotask(() => this.onload())
    }
}

const { WheelCanvas } = require('../dist/wheel-canvas-js.umd.js')

async function run() {
    let startCalls = 0
    let endPrize = null
    let clearedWatchers = 0
    const wheel = new WheelCanvas(
        {
            canvasElement: host.canvas,
            ctx: host.context,
            rAF(callback) {
                return setTimeout(() => {
                    callback()
                }, 0)
            },
            cancelAnimationFrame: clearTimeout,
            setInterval: () => 42,
            clearInterval: timer => {
                assert.strictEqual(timer, 42)
                clearedWatchers += 1
            },
        },
        {
            width: 300,
            height: 300,
            ariaLabel: '幸运抽奖',
            prizes: [
                {
                    range: 0,
                    displayWeight: 0,
                    fonts: [{ text: 'A' }],
                    imgs: [{ src: 'shared.png', formatter: image => ({ ...image, marker: 'A' }) }],
                },
                {
                    range: 0,
                    displayWeight: -2,
                    fonts: [{ text: 'B' }],
                    imgs: [{ src: 'shared.png', formatter: image => ({ ...image, marker: 'B' }) }],
                },
                { range: 0, displayWeight: 'invalid', fonts: [{ text: 'C' }] },
            ],
            buttons: [{ radius: '30%', pointer: true }],
            defaultConfig: {
                useGraphicWeight: true,
                speed: 8,
                accelerationTime: 0,
                decelerationTime: 20,
                stopRange: 0,
            },
            start() {
                startCalls += 1
            },
            end(prize) {
                endPrize = prize
            },
        },
    )

    await wheel.ready
    assert.deepStrictEqual(
        wheel._getPrizeLayout().map(item => Math.round(item.degree)),
        [120, 120, 120],
    )
    assert.strictEqual(host.attributes.role, 'button')
    assert.strictEqual(host.attributes.tabindex, '0')
    assert.strictEqual(host.attributes['aria-label'], '幸运抽奖')
    await wheel.update({ ariaLabel: '更新后的抽奖转盘' })
    assert.strictEqual(host.attributes['aria-label'], '更新后的抽奖转盘')
    assert.strictEqual(imageInstances, 1, 'identical image URLs should share one network load')
    assert.strictEqual(wheel._getCachedImage(wheel.prizes[0].imgs[0]).marker, 'A')
    assert.strictEqual(wheel._getCachedImage(wheel.prizes[1].imgs[0]).marker, 'B')

    const mutableImage = wheel.prizes[0].imgs[0]
    mutableImage.src = 'changed.png'
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.strictEqual(imageInstances, 2)
    assert.strictEqual(wheel._getCachedImage(mutableImage).marker, 'A')
    mutableImage.formatter = image => ({ ...image, marker: 'A2' })
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.strictEqual(imageInstances, 2, 'formatter changes should reuse the raw image')
    assert.strictEqual(wheel._getCachedImage(mutableImage).marker, 'A2')
    mutableImage.crossOrigin = 'use-credentials'
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.strictEqual(imageInstances, 3)
    assert.strictEqual(wheel._getCachedImage(mutableImage).marker, 'A2')

    wheel.defaultStyle.background = '#abcdef'
    wheel.prizes.push({ imgs: [{ src: 'batched.png' }] })
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.strictEqual(imageInstances, 4, 'batched mutations must preserve the reload request')
    assert.ok(wheel._getCachedImage(wheel.prizes[3].imgs[0]))

    const originalPrizes = wheel.prizes
    const originalButtons = wheel.buttons
    host.context.captureText = true
    host.context.textCalls = []
    wheel.prizes = [
        {
            background: '#ffffff',
            fonts: [
                {
                    text: '竖排示例',
                    orientation: 'vertical',
                    lineClamp: 3,
                    ellipsis: '…',
                },
                { text: '不应绘制', visible: false },
            ],
        },
    ]
    wheel.buttons = [
        { visible: false, radius: '45%', fonts: [{ text: '隐藏按钮' }] },
        {
            radius: '20%',
            textVisible: true,
            borderColor: '#ffffff',
            borderWidth: 4,
            fonts: [
                {
                    text: '中心\n文字',
                    wordWrap: false,
                    verticalAlign: 'middle',
                },
                {
                    text: 'ABCDEFGHIJ',
                    wordWrap: false,
                    lengthLimit: 24,
                    lineClamp: 1,
                    ellipsis: '...',
                },
            ],
        },
    ]
    wheel.draw()
    assert.strictEqual(wheel.maxButtonRadius, wheel.prizeRadius * 0.2 + 2)
    assert.deepStrictEqual(
        host.context.textCalls.slice(0, 3).map(call => call.text),
        ['竖', '排', '…'],
    )
    const centeredText = host.context.textCalls.filter(call => ['中心', '文字'].includes(call.text))
    assert.strictEqual(centeredText.length, 2)
    assert.strictEqual(centeredText[0].textBaseline, 'middle')
    assert.ok(Math.abs(centeredText[0].y + centeredText[1].y) < Number.EPSILON)
    const clippedText = host.context.textCalls.find(call => call.text === '...')
    assert.ok(clippedText, 'single-line text must honor lengthLimit when wrapping is disabled')
    assert.ok(host.context.measureText(clippedText.text).width <= 24)
    host.context.textCalls = []
    wheel.buttons[1].textVisible = false
    wheel.draw()
    assert.strictEqual(
        host.context.textCalls.some(call => ['中心', '文字'].includes(call.text)),
        false,
    )
    wheel.prizes = originalPrizes
    wheel.buttons = originalButtons
    host.context.captureText = false

    let prevented = false
    host.listeners.keydown({
        key: ' ',
        preventDefault() {
            prevented = true
        },
    })
    assert.strictEqual(startCalls, 1)
    assert.strictEqual(prevented, true)

    assert.strictEqual(wheel.play(), true)
    assert.strictEqual(wheel.stop(2), true)
    const startedAt = Date.now()
    while (wheel.isRunning() && Date.now() - startedAt < 1000) {
        await new Promise(resolve => setTimeout(resolve, 5))
    }
    assert.strictEqual(wheel.isRunning(), false, 'rAF without a timestamp must still finish')
    assert.strictEqual(endPrize.fonts[0].text, 'C')
    assert.strictEqual(wheel.getCurrentPrizeIndex(), 2)

    wheel.$watch('rotation', () => {})
    assert.throws(() => wheel.$watch('rotation'), /requires a function handler/)
    wheel.destroy()
    assert.strictEqual(clearedWatchers, 1)
    assert.strictEqual(host.listeners.click, undefined)
    assert.strictEqual(host.listeners.keydown, undefined)
    assert.strictEqual(host.listeners.pointerdown, undefined)
    assert.strictEqual(host.listeners.pointermove, undefined)
    assert.strictEqual(host.listeners.pointerup, undefined)
    assert.strictEqual(host.listeners.pointercancel, undefined)
    assert.strictEqual(host.attributes.role, undefined)
    assert.strictEqual(host.attributes.tabindex, undefined)

    const noRangeHost = createCanvas()
    const noRangeWheel = new WheelCanvas(
        {
            canvasElement: noRangeHost.canvas,
            ctx: noRangeHost.context,
            rAF: callback => setTimeout(() => callback(Date.now()), 0),
            cancelAnimationFrame: clearTimeout,
        },
        {
            width: 300,
            height: 300,
            prizes: [{ range: 0 }, { range: -1 }],
            defaultConfig: { accelerationTime: 0, decelerationTime: 1 },
        },
    )
    await noRangeWheel.ready
    noRangeWheel.play()
    assert.strictEqual(noRangeWheel.stop(), false)
    assert.strictEqual(noRangeWheel.isRunning(), false)
    noRangeWheel.destroy()

    const feedbackHost = createCanvas()
    let feedbackNow = 100
    const soundEvents = []
    const celebrationEvents = []
    const feedbackErrors = []
    const feedbackWheel = new WheelCanvas(
        {
            canvasElement: feedbackHost.canvas,
            ctx: feedbackHost.context,
            now: () => feedbackNow,
            rAF: callback =>
                setTimeout(() => {
                    feedbackNow += 16
                    callback()
                }, 0),
            cancelAnimationFrame: clearTimeout,
        },
        {
            width: 300,
            height: 300,
            prizes: [
                { range: 1, background: '#ff0000' },
                { range: 1, background: '#00ff00' },
            ],
            defaultConfig: {
                accelerationTime: 0,
                decelerationTime: 1,
            },
            feedback: {
                sound: {
                    enabled: true,
                    pack: 'mechanical',
                    sectorCue: 'snap',
                    resultCue: 'reward',
                    volume: 0.3,
                    minInterval: 35,
                    play(cue, detail) {
                        soundEvents.push({ cue, detail, wheel: this })
                    },
                },
                celebration: {
                    enabled: true,
                    style: 'subtle',
                    particleCount: 48,
                    fire(style, detail) {
                        celebrationEvents.push({ style, detail, wheel: this })
                    },
                },
            },
            error(error) {
                feedbackErrors.push(error)
            },
        },
    )
    await feedbackWheel.ready
    feedbackWheel._emitSectorFeedback(1, 0)
    feedbackNow += 10
    feedbackWheel._emitSectorFeedback(0, 1)
    assert.strictEqual(
        soundEvents.filter(event => event.detail.type === 'sector').length,
        1,
        'sector feedback should respect minInterval',
    )
    feedbackNow += 35
    feedbackWheel._emitSectorFeedback(0, 1)
    const sectorEvents = soundEvents.filter(event => event.detail.type === 'sector')
    assert.strictEqual(sectorEvents.length, 2)
    assert.strictEqual(sectorEvents[0].cue, 'snap')
    assert.strictEqual(sectorEvents[0].detail.index, 1)
    assert.strictEqual(sectorEvents[0].wheel, feedbackWheel)

    await feedbackWheel.update({ feedback: { sound: { volume: 0.8 } } })
    assert.strictEqual(feedbackWheel.feedback.sound.volume, 0.8)
    assert.strictEqual(feedbackWheel.feedback.sound.pack, 'mechanical')
    assert.strictEqual(feedbackWheel.feedback.celebration.style, 'subtle')

    assert.strictEqual(feedbackWheel.play(), true)
    assert.strictEqual(feedbackWheel.stop(1), true)
    const feedbackStartedAt = Date.now()
    while (feedbackWheel.isRunning() && Date.now() - feedbackStartedAt < 1000) {
        await new Promise(resolve => setTimeout(resolve, 5))
    }
    assert.strictEqual(feedbackWheel.isRunning(), false)
    const resultSounds = soundEvents.filter(event => event.detail.type === 'result')
    assert.strictEqual(resultSounds.length, 1)
    assert.strictEqual(resultSounds[0].cue, 'reward')
    assert.strictEqual(resultSounds[0].detail.index, 1)
    assert.deepStrictEqual(resultSounds[0].detail.colors, ['#ff0000', '#00ff00'])
    assert.strictEqual(celebrationEvents.length, 1)
    assert.strictEqual(celebrationEvents[0].style, 'subtle')

    const resultCountBeforeCancel = resultSounds.length
    const celebrationCountBeforeCancel = celebrationEvents.length
    assert.strictEqual(feedbackWheel.play(), true)
    assert.strictEqual(feedbackWheel.stop(-1), false)
    assert.strictEqual(
        soundEvents.filter(event => event.detail.type === 'result').length,
        resultCountBeforeCancel,
    )
    assert.strictEqual(celebrationEvents.length, celebrationCountBeforeCancel)

    feedbackNow += 100
    feedbackWheel.feedback.sound.play = () => {
        throw new Error('speaker failed')
    }
    feedbackWheel._emitSectorFeedback(1, 0)
    assert.strictEqual(feedbackErrors.length, 1)
    assert.strictEqual(feedbackErrors[0].name, 'WheelCanvasFeedbackError')
    assert.strictEqual(feedbackWheel.isRunning(), false)
    feedbackNow += 100
    feedbackWheel.feedback.sound.play = () => Promise.reject(new Error('decoder failed'))
    feedbackWheel._emitSectorFeedback(0, 1)
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.strictEqual(feedbackErrors.length, 2)
    assert.strictEqual(feedbackErrors[1].name, 'WheelCanvasFeedbackError')
    feedbackWheel.destroy()

    const hugeWeightHost = createCanvas()
    const hugeWeightWheel = new WheelCanvas(
        {
            canvasElement: hugeWeightHost.canvas,
            ctx: hugeWeightHost.context,
        },
        {
            width: 300,
            height: 300,
            prizes: [
                { range: Number.MAX_VALUE, displayWeight: Number.MAX_VALUE },
                { range: Number.MAX_VALUE, displayWeight: Number.MAX_VALUE },
            ],
            defaultConfig: { useGraphicWeight: true },
        },
    )
    await hugeWeightWheel.ready
    assert.deepStrictEqual(
        hugeWeightWheel._getPrizeLayout().map(item => item.degree),
        [180, 180],
    )
    await hugeWeightWheel.update({
        prizes: [{ displayWeight: Number.MAX_VALUE }, { displayWeight: 1 }, { displayWeight: 1 }],
    })
    const extremeLayout = hugeWeightWheel._getPrizeLayout()
    assert.ok(extremeLayout.every(item => item.degree > 0))
    assert.ok(
        extremeLayout.every((item, index) => {
            return index === 0 || item.startDegree >= extremeLayout[index - 1].endDegree
        }),
    )
    assert.strictEqual(extremeLayout[extremeLayout.length - 1].endDegree, 360)

    let propertySectorCount = 0
    for (let sample = 0; sample < 500; sample += 1) {
        const prizeCount = 2 + (sample % 40)
        const prizes = Array.from({ length: prizeCount }, (_, index) => {
            let displayWeight = 1 + (((sample + 3) * (index + 7)) % 1000)
            if (sample % 17 === 0 && index === 0) displayWeight = Number.MAX_VALUE
            if (sample % 19 === 0 && index === prizeCount - 1) displayWeight = Number.MIN_VALUE
            return { displayWeight }
        })
        hugeWeightWheel.prizes = prizes
        const layout = hugeWeightWheel._getPrizeLayout()
        propertySectorCount += layout.length
        assert.strictEqual(layout.length, prizeCount)
        layout.forEach((item, index) => {
            assert.ok(Number.isFinite(item.degree) && item.degree > 0)
            assert.ok(Number.isFinite(item.startDegree) && Number.isFinite(item.endDegree))
            if (index > 0) assert.strictEqual(item.startDegree, layout[index - 1].endDegree)
        })
        assert.strictEqual(layout[layout.length - 1].endDegree, 360)
    }
    assert.ok(propertySectorCount > 10000)
    hugeWeightWheel.destroy()

    const throwingHost = createCanvas()
    let resizeListenerCount = 0
    const originalAddEventListener = window.addEventListener
    window.addEventListener = name => {
        if (name === 'resize') resizeListenerCount += 1
    }
    assert.throws(
        () =>
            new WheelCanvas(
                {
                    canvasElement: throwingHost.canvas,
                    ctx: throwingHost.context,
                    beforeCreate() {
                        assert.strictEqual(this.canvas, throwingHost.canvas)
                        assert.strictEqual(this.ctx, throwingHost.context)
                        assert.strictEqual(this.prizes.length, 1)
                        assert.ok(this.defaultConfig)
                        throw new Error('beforeCreate failed')
                    },
                },
                { prizes: [{ range: 1 }] },
            ),
        /beforeCreate failed/,
    )
    assert.strictEqual(resizeListenerCount, 0)
    window.addEventListener = originalAddEventListener

    const destroyedBeforeCreateHost = createCanvas()
    let destroyedBeforeCreateWindowListeners = 0
    window.addEventListener = () => {
        destroyedBeforeCreateWindowListeners += 1
    }
    const destroyedBeforeCreateWheel = new WheelCanvas(
        {
            canvasElement: destroyedBeforeCreateHost.canvas,
            ctx: destroyedBeforeCreateHost.context,
            beforeCreate() {
                this.destroy()
            },
        },
        { prizes: [{ range: 1 }] },
    )
    await destroyedBeforeCreateWheel.ready
    assert.strictEqual(destroyedBeforeCreateWheel._destroyed, true)
    assert.strictEqual(destroyedBeforeCreateWindowListeners, 0)
    assert.deepStrictEqual(Object.keys(destroyedBeforeCreateHost.listeners), [])
    window.addEventListener = originalAddEventListener

    const destroyedBeforeResizeHost = createCanvas()
    let afterDestroyedResize = 0
    const destroyedBeforeResizeWheel = new WheelCanvas(
        {
            canvasElement: destroyedBeforeResizeHost.canvas,
            ctx: destroyedBeforeResizeHost.context,
            beforeResize() {
                this.destroy()
            },
            afterResize() {
                afterDestroyedResize += 1
            },
        },
        { width: 240, height: 260, prizes: [{ range: 1 }] },
    )
    await destroyedBeforeResizeWheel.ready
    assert.strictEqual(destroyedBeforeResizeWheel._destroyed, true)
    assert.strictEqual(afterDestroyedResize, 0)
    assert.strictEqual(destroyedBeforeResizeHost.canvas.width, 0)
    assert.strictEqual(destroyedBeforeResizeHost.canvas.height, 0)

    const noActionHost = createCanvas()
    const noActionWheel = new WheelCanvas(
        { canvasElement: noActionHost.canvas, ctx: noActionHost.context },
        { prizes: [{ range: 1 }], buttons: [] },
    )
    await noActionWheel.ready
    assert.strictEqual(noActionHost.attributes.role, undefined)
    assert.strictEqual(noActionHost.attributes.tabindex, undefined)
    assert.strictEqual(noActionHost.attributes['aria-busy'], 'false')
    assert.strictEqual(noActionHost.attributes['aria-disabled'], 'true')
    noActionWheel.destroy()

    const hookHost = createCanvas()
    const hookWheel = new WheelCanvas(
        {
            canvasElement: hookHost.canvas,
            ctx: hookHost.context,
            rAF: callback => setTimeout(() => callback(Date.now()), 100),
            cancelAnimationFrame: clearTimeout,
        },
        {
            width: 300,
            height: 300,
            prizes: [{ range: 1 }, { range: 1 }],
            defaultConfig: { accelerationTime: 1, decelerationTime: 1 },
        },
    )
    await hookWheel.ready
    hookWheel.config.afterStart = () => {
        throw new Error('afterStart failed')
    }
    assert.throws(() => hookWheel.play(), /afterStart failed/)
    assert.strictEqual(hookWheel.isRunning(), false)
    hookWheel.config.afterStart = null
    hookWheel.onCurrentChangeCallback = () => {
        throw new Error('change failed')
    }
    assert.strictEqual(hookWheel.play(), true)
    assert.throws(() => hookWheel._tick(Date.now() + 10), /change failed/)
    assert.strictEqual(hookWheel.isRunning(), false)
    hookWheel.destroy()

    const destroyGestureHost = createCanvas()
    let destroyGestureNow = 100
    const destroyGestureWheel = new WheelCanvas(
        {
            canvasElement: destroyGestureHost.canvas,
            ctx: destroyGestureHost.context,
            now: () => destroyGestureNow,
        },
        {
            width: 300,
            height: 300,
            prizes: [{ range: 1 }, { range: 1 }],
            physics: {
                enabled: true,
                dragFrom: 'wheel',
                innerRadius: 0,
                dragThreshold: 1,
                onStart() {
                    this.destroy()
                },
            },
        },
    )
    await destroyGestureWheel.ready
    const destroyGestureRotation = destroyGestureWheel.rotation
    destroyGestureWheel._handlePointerDown({
        pointerId: 81,
        button: 0,
        isPrimary: true,
        clientX: 150,
        clientY: 50,
    })
    destroyGestureNow += 20
    destroyGestureWheel._handlePointerMove({
        pointerId: 81,
        clientX: 200,
        clientY: 50,
        preventDefault() {},
    })
    assert.strictEqual(destroyGestureWheel._destroyed, true)
    assert.strictEqual(destroyGestureWheel.rotation, destroyGestureRotation)
    assert.strictEqual(destroyGestureWheel.state, 'idle')

    const weightedHost = createCanvas()
    const weightedWheel = new WheelCanvas(
        {
            canvasElement: weightedHost.canvas,
            ctx: weightedHost.context,
        },
        {
            prizes: [{ range: 0 }, { range: 10 }, { range: 0 }],
        },
    )
    await weightedWheel.ready
    const originalRandom = Math.random
    Math.random = () => 0
    weightedWheel.play()
    assert.strictEqual(weightedWheel.stop(), true)
    assert.strictEqual(weightedWheel._targetIndex, 1, 'zero-weight prizes must never win')
    Math.random = originalRandom
    weightedWheel.destroy()

    async function verifyStructuralCancellation(mutate) {
        const structuralHost = createCanvas()
        const sourcePrizes = [{ range: 1 }, { range: 1 }, { range: 1 }]
        let structuralEndCalled = false
        let structuralError = null
        const structuralWheel = new WheelCanvas(
            {
                canvasElement: structuralHost.canvas,
                ctx: structuralHost.context,
            },
            {
                prizes: sourcePrizes,
                end() {
                    structuralEndCalled = true
                },
                error(error) {
                    structuralError = error
                },
            },
        )
        await structuralWheel.ready
        structuralWheel.play()
        structuralWheel.stop(2)
        await Promise.resolve(mutate(structuralWheel, sourcePrizes))
        await new Promise(resolve => setTimeout(resolve, 30))
        assert.strictEqual(structuralWheel.isRunning(), false)
        assert.strictEqual(structuralEndCalled, false)
        assert.strictEqual(structuralError.name, 'WheelCanvasConfigurationError')
        structuralWheel.destroy()
    }

    await verifyStructuralCancellation(wheel => {
        wheel.prizes = [{ range: 1, name: 'replacement' }]
    })
    await verifyStructuralCancellation(wheel => {
        delete wheel.prizes[1]
    })
    await verifyStructuralCancellation((wheel, sourcePrizes) => {
        sourcePrizes.reverse()
    })
    await verifyStructuralCancellation(wheel => {
        return wheel.update({ prizes: [{ range: 1 }] })
    })

    const parent = { clientWidth: 500, clientHeight: 500 }
    const percentHost = createCanvas()
    percentHost.canvas.parentElement = parent
    const percentWheel = new WheelCanvas(
        {
            canvasElement: percentHost.canvas,
            ctx: percentHost.context,
        },
        { width: '80%', height: '80%', prizes: [{ range: 1 }] },
    )
    await percentWheel.ready
    assert.strictEqual(percentWheel.boxWidth, 400)
    percentWheel.resize()
    assert.strictEqual(percentWheel.boxWidth, 400, 'repeated resize must not shrink percentages')
    parent.clientWidth = 800
    parent.clientHeight = 800
    percentWheel.resize()
    assert.strictEqual(percentWheel.boxWidth, 640)
    percentWheel.destroy()

    const originalGetComputedStyle = window.getComputedStyle
    const responsiveParent = { clientWidth: 340, clientHeight: 500 }
    const responsiveHost = createCanvas()
    responsiveHost.canvas.parentElement = responsiveParent
    window.getComputedStyle = element =>
        element === responsiveParent
            ? {
                  paddingLeft: '20px',
                  paddingRight: '20px',
                  paddingTop: '0px',
                  paddingBottom: '0px',
              }
            : originalGetComputedStyle(element)
    window.devicePixelRatio = 2
    const responsiveWheel = new WheelCanvas(
        {
            canvasElement: responsiveHost.canvas,
            ctx: responsiveHost.context,
        },
        { width: 360, height: 360, prizes: [{ range: 1 }] },
    )
    await responsiveWheel.ready
    assert.strictEqual(responsiveWheel.boxWidth, 300)
    assert.strictEqual(responsiveWheel.boxHeight, 300)
    assert.strictEqual(responsiveHost.canvas.style.width, '300px')
    assert.strictEqual(responsiveHost.canvas.width, 600)
    assert.strictEqual(responsiveHost.context.imageSmoothingEnabled, true)
    assert.strictEqual(responsiveHost.context.imageSmoothingQuality, 'high')
    assert.strictEqual(responsiveWheel.config.dpr, undefined)
    window.devicePixelRatio = 3
    responsiveWheel.resize()
    assert.strictEqual(responsiveHost.canvas.width, 900)
    assert.strictEqual(responsiveWheel.dpr, 3)
    responsiveWheel.destroy()
    window.devicePixelRatio = 1
    window.getComputedStyle = originalGetComputedStyle

    const shortParent = { clientWidth: 800, clientHeight: 300 }
    const heightLimitedHost = createCanvas()
    heightLimitedHost.canvas.parentElement = shortParent
    const heightLimitedWheel = new WheelCanvas(
        {
            canvasElement: heightLimitedHost.canvas,
            ctx: heightLimitedHost.context,
        },
        { width: 600, height: 600, prizes: [{ range: 1 }] },
    )
    await heightLimitedWheel.ready
    assert.strictEqual(heightLimitedWheel.boxWidth, 300)
    assert.strictEqual(heightLimitedWheel.boxHeight, 300)
    heightLimitedWheel.destroy()

    const scaledTextHost = createCanvas()
    let scaledTextResizeCalls = 0
    const scaledTextWheel = new WheelCanvas(
        {
            canvasElement: scaledTextHost.canvas,
            ctx: scaledTextHost.context,
            beforeResize() {
                scaledTextResizeCalls += 1
            },
        },
        {
            width: 360,
            height: 360,
            prizes: [{ range: 1, fonts: [{ text: 'Responsive', fontSize: '4%' }] }],
            buttons: [],
        },
    )
    await scaledTextWheel.ready
    assert.match(scaledTextHost.context.font, / 14px /)
    const resizeCallsBeforeSetSize = scaledTextResizeCalls
    scaledTextWheel.setSize(720)
    assert.strictEqual(scaledTextResizeCalls, resizeCallsBeforeSetSize + 1)
    assert.strictEqual(scaledTextWheel.width, 720)
    assert.strictEqual(scaledTextWheel.height, 720)
    assert.match(scaledTextHost.context.font, / 29px /)
    scaledTextWheel.destroy()

    const positionedTextHost = createCanvas()
    positionedTextHost.context.captureText = true
    positionedTextHost.context.textCalls = []
    const positionedTextWheel = new WheelCanvas(
        {
            canvasElement: positionedTextHost.canvas,
            ctx: positionedTextHost.context,
        },
        {
            width: 360,
            height: 360,
            prizes: [
                { range: 1, fonts: [{ text: 'Inherited' }] },
                {
                    range: 1,
                    fonts: [
                        {
                            text: 'Override',
                            top: '10%',
                            left: '5%',
                            textAlign: 'left',
                        },
                    ],
                },
            ],
            buttons: [],
            defaultStyle: {
                top: '25%',
                left: '10%',
                textAlign: 'right',
            },
        },
    )
    await positionedTextWheel.ready
    const inheritedText = positionedTextHost.context.textCalls.find(
        call => call.text === 'Inherited',
    )
    const overriddenText = positionedTextHost.context.textCalls.find(
        call => call.text === 'Override',
    )
    assert.strictEqual(inheritedText.textAlign, 'right')
    assert.strictEqual(overriddenText.textAlign, 'left')
    assert.ok(inheritedText.x > overriddenText.x)
    assert.ok(inheritedText.y > overriddenText.y)
    positionedTextWheel.destroy()

    const pointerHost = createCanvas()
    let pointerNow = 0
    let pointerFrame = null
    const releasedSpeeds = []
    const physicsEndPrizes = []
    const physicsErrors = []
    let forcedPhysicsTarget = null
    const pointerWheel = new WheelCanvas(
        {
            canvasElement: pointerHost.canvas,
            ctx: pointerHost.context,
            now: () => pointerNow,
            rAF(callback) {
                pointerFrame = callback
                return 1
            },
            cancelAnimationFrame() {
                pointerFrame = null
            },
        },
        {
            width: 300,
            height: 300,
            prizes: [
                { name: 'A', range: 1 },
                { name: 'B', range: 1 },
                { name: 'C', range: 1 },
                { name: 'D', range: 1 },
            ],
            buttons: [{ radius: '30%', background: '#0f766e' }],
            pointer: {
                type: 'external',
                position: 'right',
                shape: 'kite',
                borderWidth: 2,
            },
            physics: {
                enabled: true,
                minVelocity: 100,
                maxVelocity: 1800,
                friction: 1000,
                stopVelocity: 10,
                velocitySmoothing: 1,
                releaseWindow: 200,
                onRelease(detail) {
                    releasedSpeeds.push(detail.speed)
                    return forcedPhysicsTarget
                },
            },
            defaultConfig: {
                stopRange: 0,
                decelerationTime: 1000,
            },
            end(prize) {
                physicsEndPrizes.push(prize)
            },
            error(error) {
                physicsErrors.push(error)
            },
        },
    )
    await pointerWheel.ready
    assert.ok(pointerWheel.prizeRadius < pointerWheel.radius)
    assert.ok(pointerHost.context.strokeCalls > 0)
    assert.strictEqual(pointerWheel.getCurrentPrizeIndex(), 1)
    pointerHost.listeners.pointerdown({
        pointerId: 99,
        button: 0,
        isPrimary: true,
        clientX: 150,
        clientY: 150,
    })
    assert.strictEqual(pointerWheel._gesture, null)
    pointerWheel.physics.dragFrom = 'wheel'
    pointerHost.listeners.pointerdown({
        pointerId: 100,
        button: 0,
        isPrimary: true,
        clientX: 180,
        clientY: 150,
    })
    assert.ok(pointerWheel._gesture)
    pointerHost.listeners.pointercancel({ pointerId: 100 })
    pointerWheel.physics.dragFrom = 'prizes'

    pointerWheel._captureActiveGeometry()
    pointerWheel.state = 'cruising'
    pointerWheel._currentSpeed = 12
    pointerWheel._targetIndex = 2
    pointerWheel.pointer.position = 'left'
    assert.strictEqual(pointerWheel._getPointerDegree(), 90)
    pointerWheel._beginDeceleration(pointerNow)
    assert.strictEqual(Math.round(((pointerWheel._decelerationTo % 360) + 360) % 360), 225)
    pointerWheel._stopAnimation(false)
    pointerWheel.pointer.position = 'right'

    function dragWheel(pointerId, moveX, moveY, elapsed) {
        pointerNow += 10
        pointerHost.listeners.pointerdown({
            pointerId,
            button: 0,
            isPrimary: true,
            clientX: 150,
            clientY: 50,
        })
        pointerNow += elapsed
        pointerHost.listeners.pointermove({
            pointerId,
            clientX: moveX,
            clientY: moveY,
            preventDefault() {},
        })
        pointerHost.listeners.pointerup({ pointerId, preventDefault() {} })
    }

    function finishPhysicalSpin() {
        let previousSpeed = Math.abs(pointerWheel._physicsVelocity)
        for (let frame = 0; frame < 300 && pointerWheel.isRunning(); frame += 1) {
            const callback = pointerFrame
            pointerFrame = null
            assert.strictEqual(typeof callback, 'function')
            pointerNow += 50
            callback(pointerNow)
            const currentSpeed = Math.abs(pointerWheel._physicsVelocity)
            assert.ok(
                currentSpeed <= previousSpeed + 0.1,
                `physics speed increased from ${previousSpeed} to ${currentSpeed}`,
            )
            previousSpeed = currentSpeed
        }
        assert.strictEqual(pointerWheel.isRunning(), false)
    }

    dragWheel(1, 200, 63.397, 100)
    assert.ok(releasedSpeeds[0] > 250 && releasedSpeeds[0] < 320)
    finishPhysicalSpin()
    dragWheel(2, 250, 150, 20)
    assert.strictEqual(releasedSpeeds[1], 1800)
    finishPhysicalSpin()
    assert.ok(releasedSpeeds[1] > releasedSpeeds[0])
    assert.strictEqual(
        physicsEndPrizes[physicsEndPrizes.length - 1],
        pointerWheel.prizes[pointerWheel.getCurrentPrizeIndex()],
    )

    assert.strictEqual(pointerWheel.spin(-720), true)
    assert.strictEqual(pointerWheel.state, 'coasting')
    assert.ok(pointerWheel._physicsVelocity < 0)
    finishPhysicalSpin()
    forcedPhysicsTarget = 3
    assert.strictEqual(pointerWheel.spin(900), true)
    assert.strictEqual(pointerWheel.state, 'settling')
    assert.strictEqual(pointerWheel._targetIndex, 3)
    const landingDurationSeconds = pointerWheel._physicsLandingDuration / 1000
    assert.ok(
        Math.abs(
            pointerWheel._evaluatePolynomialDerivative(
                pointerWheel._physicsLandingCoefficients,
                0,
            ) /
                landingDurationSeconds -
                900,
        ) < 1e-7,
    )
    assert.ok(
        Math.abs(
            pointerWheel._evaluatePolynomialSecondDerivative(
                pointerWheel._physicsLandingCoefficients,
                0,
            ) /
                (landingDurationSeconds * landingDurationSeconds),
        ) < 1e-7,
    )
    assert.ok(
        Math.abs(
            pointerWheel._evaluatePolynomialDerivative(pointerWheel._physicsLandingCoefficients, 1),
        ) < 1e-7,
    )
    assert.ok(
        Math.abs(
            pointerWheel._evaluatePolynomialSecondDerivative(
                pointerWheel._physicsLandingCoefficients,
                1,
            ),
        ) < 1e-7,
    )
    finishPhysicalSpin()
    assert.strictEqual(pointerWheel.getCurrentPrizeIndex(), 3)

    let resolvePhysicsTarget
    forcedPhysicsTarget = new Promise(resolve => {
        resolvePhysicsTarget = resolve
    })
    assert.strictEqual(pointerWheel.spin(900), true)
    for (let frame = 0; frame < 30; frame += 1) {
        const callback = pointerFrame
        pointerFrame = null
        pointerNow += 50
        callback(pointerNow)
    }
    assert.strictEqual(pointerWheel.state, 'coasting')
    assert.strictEqual(pointerWheel._physicsVelocity, 72)
    const waitingRotation = pointerWheel.rotation
    const waitingFrame = pointerFrame
    pointerFrame = null
    pointerNow += 50
    waitingFrame(pointerNow)
    assert.strictEqual(pointerWheel._physicsVelocity, 72)
    assert.ok(pointerWheel.rotation > waitingRotation)
    resolvePhysicsTarget(2)
    await Promise.resolve()
    await Promise.resolve()
    assert.strictEqual(pointerWheel.state, 'settling')
    finishPhysicalSpin()
    assert.strictEqual(pointerWheel.getCurrentPrizeIndex(), 2)

    const decayConfig = pointerWheel._getPhysicsConfig()
    const oneSecondDecay = pointerWheel._decayPhysicsSpeed(900, 1, 0, decayConfig)
    let subdividedSpeed = 900
    let subdividedDistance = 0
    for (let step = 0; step < 100; step += 1) {
        const decay = pointerWheel._decayPhysicsSpeed(subdividedSpeed, 0.01, 0, decayConfig)
        subdividedSpeed = decay.speed
        subdividedDistance += decay.distance
    }
    assert.ok(Math.abs(oneSecondDecay.speed - subdividedSpeed) < 1e-7)
    assert.ok(Math.abs(oneSecondDecay.distance - subdividedDistance) < 1e-7)
    const constrainedLanding = pointerWheel._createPhysicsLandingPlan(90, 1, 900, 0, {
        ...decayConfig,
        minLandingTurns: 2,
        maxLandingTurns: 2,
    })
    assert.ok(constrainedLanding)
    assert.ok(constrainedLanding.distance >= 810)
    const defaultLandingConfig = {
        ...decayConfig,
        friction: 24,
        drag: 0.68,
        maxLandingDuration: 12000,
    }
    for (const direction of [-1, 1]) {
        for (const speed of [36, 50, 72, 100, 150, 300, 900, 1800]) {
            for (const baseDistance of [0.01, 5, 15, 90, 180, 359.99]) {
                for (const acceleration of [
                    0,
                    -direction *
                        (defaultLandingConfig.friction + defaultLandingConfig.drag * speed),
                ]) {
                    const plan = pointerWheel._createPhysicsLandingPlan(
                        baseDistance,
                        direction,
                        speed,
                        acceleration,
                        defaultLandingConfig,
                    )
                    assert.ok(
                        plan,
                        `missing landing plan: direction=${direction}, speed=${speed}, distance=${baseDistance}, acceleration=${acceleration}`,
                    )
                    if (!plan.segments) {
                        assert.strictEqual(
                            pointerWheel._validatePhysicsLanding(
                                plan.coefficients,
                                plan.duration,
                                direction,
                                speed,
                                defaultLandingConfig,
                            ),
                            true,
                        )
                    }
                    pointerWheel._physicsLandingDuration = plan.duration
                    pointerWheel._physicsLandingCoefficients = plan.coefficients
                    pointerWheel._physicsLandingSegments = plan.segments || null
                    const startState = pointerWheel._evaluatePhysicsLandingState(0)
                    assert.ok(
                        Math.abs(startState.acceleration - acceleration) < 1e-5,
                        `landing acceleration jumped: initial=${acceleration}, planned=${startState.acceleration}`,
                    )
                    let maximumSpeed = 0
                    let previousPlannedSpeed = speed
                    for (let sample = 0; sample <= 2000; sample += 1) {
                        const state = pointerWheel._evaluatePhysicsLandingState(
                            (plan.duration * sample) / 2000,
                        )
                        const plannedSpeed = state.velocity * direction
                        maximumSpeed = Math.max(maximumSpeed, plannedSpeed)
                        assert.ok(
                            plannedSpeed <= previousPlannedSpeed + 1e-5,
                            `landing locally accelerated: previous=${previousPlannedSpeed}, current=${plannedSpeed}`,
                        )
                        previousPlannedSpeed = plannedSpeed
                    }
                    assert.ok(
                        maximumSpeed <= speed + Math.max(1e-7, speed * 1e-9),
                        `landing speed increased: initial=${speed}, maximum=${maximumSpeed}`,
                    )
                    const endState = pointerWheel._evaluatePhysicsLandingState(plan.duration)
                    assert.ok(Math.abs(endState.distance - plan.distance) < 1e-6)
                    assert.ok(Math.abs(endState.velocity) < 1e-6)
                    assert.ok(Math.abs(endState.acceleration) < 1e-6)
                    if (plan.segments) {
                        const bridge = plan.segments[0]
                        const main = plan.segments[1]
                        const bridgeSeconds = bridge.duration / 1000
                        const mainSeconds = main.duration / 1000
                        const bridgeEndVelocity =
                            pointerWheel._evaluatePolynomialDerivative(bridge.coefficients, 1) /
                            bridgeSeconds
                        const mainStartVelocity =
                            pointerWheel._evaluatePolynomialDerivative(main.coefficients, 0) /
                            mainSeconds
                        const bridgeEndAcceleration =
                            pointerWheel._evaluatePolynomialSecondDerivative(
                                bridge.coefficients,
                                1,
                            ) /
                            (bridgeSeconds * bridgeSeconds)
                        const mainStartAcceleration =
                            pointerWheel._evaluatePolynomialSecondDerivative(main.coefficients, 0) /
                            (mainSeconds * mainSeconds)
                        assert.ok(Math.abs(bridgeEndVelocity - mainStartVelocity) < 1e-6)
                        assert.ok(Math.abs(bridgeEndAcceleration - mainStartAcceleration) < 1e-6)
                    }
                }
            }
        }
    }

    let resolveLowSpeedTarget
    forcedPhysicsTarget = new Promise(resolve => {
        resolveLowSpeedTarget = resolve
    })
    assert.strictEqual(pointerWheel.spin(150), true)
    const lowSpeedCoastFrame = pointerFrame
    pointerFrame = null
    pointerNow += 50
    lowSpeedCoastFrame(pointerNow)
    const lowSpeedAcceleration = pointerWheel._physicsAcceleration
    assert.ok(lowSpeedAcceleration < 0)
    resolveLowSpeedTarget(2)
    await Promise.resolve()
    await Promise.resolve()
    assert.strictEqual(pointerWheel.state, 'settling')
    assert.ok(pointerWheel._physicsLandingSegments)
    const lowSpeedStartState = pointerWheel._evaluatePhysicsLandingState(0)
    assert.ok(Math.abs(lowSpeedStartState.acceleration - lowSpeedAcceleration) < 1e-5)
    finishPhysicalSpin()
    assert.strictEqual(pointerWheel.getCurrentPrizeIndex(), 2)
    forcedPhysicsTarget = null

    assert.strictEqual(
        Math.round(
            pointerWheel._estimateGestureVelocity(
                [
                    { time: 0, angle: 0 },
                    { time: 50, angle: 15 },
                    { time: 100, angle: 30 },
                ],
                55,
            ),
        ),
        300,
    )

    pointerWheel.pointer.body = {
        gradient: { from: '#111111', to: '#eeeeee' },
    }
    pointerWheel.pointer.mount = {
        gradient: { highlight: '#ffffff', middle: '#dddddd', edge: '#999999' },
    }
    pointerWheel._captureActiveGeometry()
    pointerWheel.pointer.body.gradient.from = '#ff0000'
    pointerWheel.pointer.mount.gradient.edge = '#000000'
    assert.strictEqual(pointerWheel._activePointerConfig.body.gradient.from, '#111111')
    assert.strictEqual(pointerWheel._activePointerConfig.mount.gradient.edge, '#999999')
    pointerWheel._clearActiveGeometry()
    delete pointerWheel.pointer.body
    delete pointerWheel.pointer.mount

    const directionIndexes = { top: 0, right: 1, bottom: 2, left: 3 }
    Object.entries(directionIndexes).forEach(([position, expectedIndex]) => {
        pointerWheel.pointer.position = position
        pointerWheel.rotation = 0
        pointerWheel.draw()
        assert.strictEqual(pointerWheel.getCurrentPrizeIndex(), expectedIndex)
        if (position === 'top') assert.ok(pointerWheel.centerY > 150)
        if (position === 'right') assert.ok(pointerWheel.centerX < 150)
        if (position === 'bottom') assert.ok(pointerWheel.centerY < 150)
        if (position === 'left') assert.ok(pointerWheel.centerX > 150)
    })
    for (const preset of [
        'minimal',
        'classic',
        'flapper',
        'wedge',
        'needle',
        'pin',
        'glass',
        'jewel',
        'triangle',
        'kite',
        'arrow',
        'chevron',
        'diamond',
        'notch',
        'teardrop',
        'spear',
        'soft',
        'tab',
        'dart',
        'shield',
        'ribbon',
    ]) {
        pointerWheel.pointer.preset = preset
        pointerWheel.draw()
    }
    pointerWheel.prizes.forEach((prize, index) => {
        prize.background = ['#ef4444', '#22c55e', '#3b82f6', '#f59e0b'][index]
    })
    pointerWheel.pointer.position = 'top'
    pointerWheel.pointer.color = '#111827'
    pointerWheel.pointer.colorSource = 'currentPrize'
    pointerWheel.rotation = 0
    pointerWheel.currentPrizeIndex = pointerWheel.getCurrentPrizeIndex()
    assert.strictEqual(
        pointerWheel._resolvePointerColor(pointerWheel.pointer, pointerWheel.pointer.color),
        '#ef4444',
    )
    pointerWheel.pointer.colorSource = 'fixed'
    assert.strictEqual(
        pointerWheel._resolvePointerColor(pointerWheel.pointer, pointerWheel.pointer.color),
        '#111827',
    )
    pointerWheel.pointer.wobble = {
        enabled: true,
        amplitude: 3,
        duration: 180,
        frequency: 14,
        damping: 12,
        respectReducedMotion: false,
    }
    pointerWheel.rotation = 90
    const visualPrizeIndex = pointerWheel.getCurrentPrizeIndex()
    assert.notStrictEqual(visualPrizeIndex, pointerWheel.currentPrizeIndex)
    pointerWheel._emitCurrentPrize()
    assert.strictEqual(pointerWheel._pointerWobbleStartedAt, pointerNow)
    pointerWheel.draw()
    assert.strictEqual(Math.abs(pointerWheel._pointerRenderWobbleAngle), 3)
    assert.strictEqual(pointerWheel.getCurrentPrizeIndex(), visualPrizeIndex)
    pointerNow += 181
    pointerWheel.draw()
    assert.strictEqual(pointerWheel._pointerRenderWobbleAngle, 0)
    pointerWheel.pointer.wobble = false
    pointerWheel.rotation = 180
    pointerWheel._emitCurrentPrize()
    assert.strictEqual(pointerWheel._pointerWobbleStartedAt, null)
    const followedExternalPointer = pointerWheel.pointer
    pointerWheel.rotation = 0
    pointerWheel.pointer = {
        type: 'center',
        preset: 'minimal',
        fused: true,
        fusionStyle: 'droplet',
        color: '#111827',
        colorSource: 'currentPrize',
        shadow: false,
    }
    pointerWheel.buttons[0].pointer = true
    pointerHost.context.captureFillStyles = true
    pointerHost.context.fillStyles = []
    pointerWheel._drawButtons()
    assert.ok(pointerHost.context.fillStyles.includes('#ef4444'))
    pointerHost.context.captureFillStyles = false
    pointerWheel.pointer = followedExternalPointer
    const externalPointer = pointerWheel.pointer
    pointerWheel.pointer = {
        type: 'external',
        position: 'top',
        preset: 'classic',
        width: '24px',
        height: '48px',
        layout: 'stable',
        space: '18px',
        tipInset: 8,
        borderWidth: 2,
    }
    pointerWheel.draw()
    const stableWheelRadius = pointerWheel.wheelRadius
    const stableCenterY = pointerWheel.centerY
    const stableMetricsBeforeResize = pointerWheel._getExternalPointerMetrics()
    pointerWheel.pointer.width = '48px'
    pointerWheel.pointer.height = '90px'
    pointerWheel.draw()
    const stableMetricsAfterResize = pointerWheel._getExternalPointerMetrics()
    assert.strictEqual(pointerWheel.wheelRadius, stableWheelRadius)
    assert.strictEqual(pointerWheel.centerY, stableCenterY)
    assert.strictEqual(stableMetricsAfterResize.width, 48)
    assert.strictEqual(stableMetricsAfterResize.height, 90)
    assert.ok(stableMetricsAfterResize.inwardShift > stableMetricsBeforeResize.inwardShift)
    delete pointerWheel.pointer.space
    pointerWheel.pointer.width = '24px'
    pointerWheel.pointer.height = '48px'
    pointerWheel.draw()
    const defaultStableRadius = pointerWheel.wheelRadius
    assert.strictEqual(pointerWheel._getExternalPointerMetrics().space, 15)
    pointerWheel.pointer.width = '48px'
    pointerWheel.pointer.height = '90px'
    pointerWheel.draw()
    assert.strictEqual(pointerWheel.wheelRadius, defaultStableRadius)
    pointerWheel.pointer.angle = 45
    pointerWheel.pointer.tangentOffset = -80
    pointerWheel.draw()
    const diagonalStableRadius = pointerWheel.wheelRadius
    const diagonalStableCenter = [pointerWheel.centerX, pointerWheel.centerY]
    pointerWheel.pointer.width = '96px'
    pointerWheel.pointer.height = '120px'
    pointerWheel.pointer.tangentOffset = 80
    pointerWheel.draw()
    assert.strictEqual(pointerWheel.wheelRadius, diagonalStableRadius)
    assert.deepStrictEqual([pointerWheel.centerX, pointerWheel.centerY], diagonalStableCenter)
    delete pointerWheel.pointer.angle
    delete pointerWheel.pointer.tangentOffset
    pointerWheel.pointer.width = '48px'
    pointerWheel.pointer.height = '90px'
    pointerWheel.width = 360
    pointerWheel.height = 360
    pointerWheel.resize()
    assert.strictEqual(pointerWheel._getExternalPointerMetrics().width, 48)
    assert.strictEqual(pointerWheel._getExternalPointerMetrics().height, 90)
    assert.ok(pointerWheel.wheelRadius > stableWheelRadius)
    pointerWheel.width = 300
    pointerWheel.height = 300
    pointerWheel.resize()
    pointerWheel.pointer = externalPointer
    for (const preset of [
        'minimal',
        'classic',
        'flapper',
        'wedge',
        'needle',
        'pin',
        'glass',
        'jewel',
        'triangle',
        'kite',
        'arrow',
        'chevron',
        'diamond',
        'notch',
        'teardrop',
        'spear',
        'soft',
        'tab',
        'dart',
        'shield',
        'ribbon',
    ]) {
        pointerWheel.pointer = {
            type: 'center',
            preset,
            angle: 90,
            radialOffset: 8,
            borderWidth: 2,
        }
        assert.doesNotThrow(() =>
            pointerWheel._drawCenterPointer(pointerWheel.buttons[0], 36, 'center'),
        )
        assert.strictEqual(pointerWheel._getPointerDegree(false), 90)
    }
    let customCenterPointerDraws = 0
    pointerWheel.pointer = {
        type: 'center',
        preset: 'arrow',
        renderer(_context, metrics) {
            customCenterPointerDraws += 1
            assert.strictEqual(metrics.type, 'center')
            assert.strictEqual(metrics.layout, 'overlay')
        },
    }
    pointerWheel._drawCenterPointer(pointerWheel.buttons[0], 36, 'center')
    assert.strictEqual(customCenterPointerDraws, 1)
    const centerButton = pointerWheel.buttons[0]
    const centerButtonState = {
        background: centerButton.background,
        borderWidth: centerButton.borderWidth,
        pointer: centerButton.pointer,
    }
    pointerWheel.pointer = { type: 'center', preset: 'arrow' }
    centerButton.pointer = true
    centerButton.background = '#0f766e'
    centerButton.borderWidth = 2
    const centerDrawOrder = []
    const originalDrawCenterPointer = pointerWheel._drawCenterPointer
    const originalFill = pointerHost.context.fill
    pointerWheel._drawCenterPointer = (_button, _radius, _type, renderMode = 'both') =>
        centerDrawOrder.push(renderMode)
    pointerHost.context.fill = () => centerDrawOrder.push('button')
    pointerWheel.pointer.fused = true
    pointerWheel._drawButtons()
    assert.deepStrictEqual(centerDrawOrder.slice(0, 3), ['button', 'fill', 'stroke'])
    assert.ok(pointerHost.context.clipRules.includes('evenodd'))
    centerDrawOrder.length = 0
    pointerWheel.pointer.fused = false
    pointerWheel._drawButtons()
    assert.ok(centerDrawOrder.indexOf('both') > centerDrawOrder.indexOf('button'))
    pointerWheel._drawCenterPointer = originalDrawCenterPointer
    pointerHost.context.fill = originalFill
    pointerWheel.pointer.fused = true
    centerButton.opacity = 0.4
    pointerHost.context.globalAlpha = 1
    pointerHost.context.captureFillAlpha = true
    pointerHost.context.fillAlphas = []
    pointerWheel._drawButtons()
    assert.deepStrictEqual(pointerHost.context.fillAlphas.slice(0, 2), [0.4, 0.4])
    pointerWheel.pointer.fused = false
    pointerWheel.pointer.opacity = 0.5
    pointerHost.context.globalAlpha = 1
    pointerHost.context.fillAlphas = []
    pointerWheel._drawButtons()
    assert.deepStrictEqual(pointerHost.context.fillAlphas.slice(0, 2), [0.4, 0.5])
    pointerHost.context.captureFillAlpha = false
    delete centerButton.opacity
    delete pointerWheel.pointer.opacity
    let independentPointerCalls = 0
    pointerWheel.buttons = []
    pointerWheel.pointer = {
        type: 'center',
        preset: 'arrow',
        fused: false,
        referenceSize: '32%',
        body: { borderWidth: 7 },
        shadow: { color: '#0000ff', blur: 6, offsetX: 3, radialOffset: 4 },
        renderer(context, metrics) {
            independentPointerCalls += 1
            assert.ok(metrics.referenceDiameter > 0)
            assert.strictEqual(metrics.borderWidth, 7)
            assert.strictEqual(metrics.shadowBlur, 6)
            assert.strictEqual(context.shadowColor, '#0000ff')
        },
    }
    pointerWheel._drawButtons()
    assert.strictEqual(independentPointerCalls, 1)
    let minimalCenterMetrics = null
    pointerWheel.buttons = [centerButton]
    pointerWheel.pointer = {
        type: 'center',
        preset: 'minimal',
        fused: false,
        referenceSize: '100px',
        renderer(_context, metrics) {
            minimalCenterMetrics = metrics
        },
    }
    pointerWheel._drawButtons()
    assert.ok(minimalCenterMetrics)
    assert.ok(Math.abs(minimalCenterMetrics.width - 58) < 1e-9)
    assert.ok(Math.abs(minimalCenterMetrics.height - 78) < 1e-9)
    const dropletBezierCalls = pointerHost.context.bezierCalls || 0
    let layeredPointerCalls = 0
    const layeredPointerModes = []
    pointerWheel._drawCenterPointer = (_button, _radius, _pointerType, renderMode = 'both') => {
        layeredPointerCalls += 1
        layeredPointerModes.push(renderMode)
    }
    pointerWheel.pointer = {
        type: 'center',
        preset: 'minimal',
        fused: true,
        fusionStyle: 'droplet',
        width: '58%',
        height: '78%',
    }
    centerButton.background = '#6047dd'
    centerButton.borderWidth = 3
    pointerWheel._drawButtons()
    assert.strictEqual(layeredPointerCalls, 0)
    assert.strictEqual(pointerHost.context.bezierCalls, dropletBezierCalls + 2)
    pointerHost.context.captureMovePoints = true
    pointerHost.context.captureBezierPoints = true
    pointerHost.context.captureQuadraticPoints = true
    pointerHost.context.captureArcPoints = true
    pointerHost.context.movePoints = []
    pointerHost.context.bezierPoints = []
    pointerHost.context.quadraticPoints = []
    pointerHost.context.arcPoints = []
    pointerWheel.ctx.beginPath()
    pointerWheel._createDropletButtonPath(50, pointerWheel.pointer)
    const [dropletStart] = pointerHost.context.movePoints
    const [rightCurve] = pointerHost.context.bezierPoints
    const [dropletArc] = pointerHost.context.arcPoints
    const [tipCurve] = pointerHost.context.quadraticPoints
    const crossProduct = (firstX, firstY, secondX, secondY) => {
        return firstX * secondY - firstY * secondX
    }
    assert.ok(dropletStart && rightCurve && dropletArc && tipCurve)
    assert.ok(
        Math.abs(
            crossProduct(
                rightCurve[0] - dropletStart.x,
                rightCurve[1] - dropletStart.y,
                tipCurve[2] - tipCurve[0],
                tipCurve[3] - tipCurve[1],
            ),
        ) < 1e-9,
    )
    assert.ok(
        Math.abs(
            crossProduct(
                rightCurve[4] - rightCurve[2],
                rightCurve[5] - rightCurve[3],
                -dropletArc[2] * Math.sin(dropletArc[3]),
                dropletArc[2] * Math.cos(dropletArc[3]),
            ),
        ) < 1e-9,
    )
    pointerHost.context.captureMovePoints = false
    pointerHost.context.captureBezierPoints = false
    pointerHost.context.captureQuadraticPoints = false
    pointerHost.context.captureArcPoints = false
    pointerHost.context.captureFillStyles = true
    pointerHost.context.fillStyles = []
    pointerWheel.pointer = {
        type: 'center',
        preset: 'arrow',
        fused: true,
        fusionStyle: 'adaptive',
        colorSource: 'currentPrize',
        width: '82%',
        height: '128%',
    }
    pointerWheel._drawButtons()
    assert.strictEqual(layeredPointerCalls, 1)
    assert.deepStrictEqual(layeredPointerModes, ['append-path'])
    assert.ok(pointerHost.context.fillStyles.includes('#ef4444'))
    pointerHost.context.captureFillStyles = false
    pointerWheel._drawCenterPointer = originalDrawCenterPointer
    pointerHost.context.captureDrawOperations = true
    pointerHost.context.drawOperations = []
    pointerWheel._drawButtons()
    pointerHost.context.captureDrawOperations = false
    assert.deepStrictEqual(
        pointerHost.context.drawOperations.slice(0, 2).map(operation => operation.type),
        ['stroke', 'fill'],
    )
    assert.strictEqual(pointerHost.context.drawOperations[0].lineWidth, 6)
    for (const preset of [
        'minimal',
        'classic',
        'flapper',
        'wedge',
        'needle',
        'pin',
        'glass',
        'jewel',
        'triangle',
        'kite',
        'arrow',
        'chevron',
        'diamond',
        'notch',
        'teardrop',
        'spear',
        'soft',
        'tab',
        'dart',
        'shield',
        'ribbon',
    ]) {
        pointerWheel.pointer = {
            type: 'center',
            preset,
            fused: true,
            fusionStyle: 'adaptive',
            borderWidth: 2,
            shadow: false,
        }
        pointerHost.context.captureDrawOperations = true
        pointerHost.context.drawOperations = []
        assert.doesNotThrow(() => pointerWheel._drawButtons())
        pointerHost.context.captureDrawOperations = false
        assert.deepStrictEqual(
            pointerHost.context.drawOperations.map(operation => operation.type),
            ['stroke', 'fill'],
            `${preset} adaptive fusion must render one continuous outline`,
        )
        assert.strictEqual(pointerHost.context.saveDepth, 0)
    }
    pointerWheel.pointer = {
        type: 'center',
        preset: 'minimal',
        fused: true,
        fusionStyle: 'adaptive',
        cornerRadius: 0,
        width: '60%',
        height: '60%',
    }
    pointerHost.context.captureMovePoints = true
    pointerHost.context.captureLinePoints = true
    pointerHost.context.movePoints = []
    pointerHost.context.linePoints = []
    pointerWheel._drawButtons()
    pointerHost.context.captureMovePoints = false
    pointerHost.context.captureLinePoints = false
    const adaptiveTriangle = [
        pointerHost.context.movePoints.at(-1),
        ...pointerHost.context.linePoints.slice(-2),
    ]
    const adaptiveTriangleArea = adaptiveTriangle.reduce((area, point, index) => {
        const next = adaptiveTriangle[(index + 1) % adaptiveTriangle.length]
        return area + point.x * next.y - point.y * next.x
    }, 0)
    assert.ok(adaptiveTriangleArea > 0)
    pointerHost.context.movePoints = []
    pointerHost.context.linePoints = []
    pointerHost.context.captureMovePoints = true
    pointerHost.context.captureLinePoints = true
    pointerWheel._traceRoundedPolygon(
        [
            { x: -1, y: 0 },
            { x: 1, y: 0 },
            { x: 0, y: -1 },
        ],
        0,
    )
    pointerHost.context.captureMovePoints = false
    pointerHost.context.captureLinePoints = false
    const normalizedPolygon = [pointerHost.context.movePoints[0], ...pointerHost.context.linePoints]
    const normalizedPolygonArea = normalizedPolygon.reduce((area, point, index) => {
        const next = normalizedPolygon[(index + 1) % normalizedPolygon.length]
        return area + point.x * next.y - point.y * next.x
    }, 0)
    assert.ok(normalizedPolygonArea > 0)
    pointerWheel.buttons = [centerButton]
    pointerWheel.pointer = { type: 'center', preset: 'arrow', fused: true }
    centerButton.background = 'transparent'
    centerButton.borderWidth = 0
    pointerHost.context.captureLinePoints = true
    pointerHost.context.linePoints = []
    pointerWheel.draw()
    pointerHost.context.captureLinePoints = false
    assert.ok(pointerHost.context.linePoints.length > 0)
    Object.assign(centerButton, centerButtonState)
    pointerWheel.pointer = externalPointer
    pointerWheel.pointer.preset = 'minimal'
    delete pointerWheel.pointer.width
    delete pointerWheel.pointer.height
    delete pointerWheel.pointer.tipInset
    delete pointerWheel.pointer.mount
    const minimalMetrics = pointerWheel._getExternalPointerMetrics()
    assert.strictEqual(minimalMetrics.showMount, false)
    assert.strictEqual(minimalMetrics.shadowBlur, 0)
    assert.strictEqual(minimalMetrics.inset, 14)
    assert.ok(Math.abs(minimalMetrics.width - pointerWheel.radius * 2 * 0.06) < 1e-9)
    assert.ok(Math.abs(minimalMetrics.height - pointerWheel.radius * 2 * 0.05) < 1e-9)
    pointerWheel.pointer.mount = { visible: true }
    assert.strictEqual(pointerWheel._getExternalPointerMetrics().showMount, true)
    delete pointerWheel.pointer.mount
    pointerWheel.pointer.preset = 'classic'
    assert.strictEqual(pointerWheel._getExternalPointerMetrics().shadowBlur, 0)
    pointerWheel.pointer.borderWidth = 2
    pointerWheel.pointer.mount = false
    pointerWheel.pointer.shadow = false
    delete pointerWheel.pointer.body
    const plainClassicStrokeCount = pointerHost.context.strokeCalls || 0
    pointerWheel._drawExternalPointer(pointerWheel._getExternalPointerMetrics())
    assert.strictEqual(pointerHost.context.strokeCalls, plainClassicStrokeCount + 1)
    pointerWheel.pointer.body = { shadeColor: '#3b0764' }
    pointerWheel._drawExternalPointer(pointerWheel._getExternalPointerMetrics())
    assert.strictEqual(pointerHost.context.strokeCalls, plainClassicStrokeCount + 3)
    pointerWheel.pointer.body = {
        gradient: { from: '#5b21b6', to: '#a78bfa' },
    }
    pointerWheel.draw()
    assert.ok(pointerHost.context.bezierCalls >= 4)
    assert.ok(pointerHost.context.gradientCalls >= 1)
    assert.ok(pointerHost.context.gradientStopCalls >= 2)
    assert.ok(pointerHost.context.radialGradientCalls >= 1)
    assert.ok(pointerHost.context.radialGradientStopCalls >= 3)
    pointerHost.context.throwGradient = true
    assert.doesNotThrow(() => pointerWheel.draw())
    pointerHost.context.throwGradient = false
    delete pointerWheel.pointer.body
    pointerWheel.pointer = {
        type: 'external',
        preset: 'flapper',
        borderWidth: 0,
        cornerRadius: 3,
        mount: false,
        shadow: false,
    }
    const roundedPointerCalls = pointerHost.context.quadraticCalls || 0
    const plainPointerStrokeCount = pointerHost.context.strokeCalls || 0
    const roundedPointerMetrics = pointerWheel._getExternalPointerMetrics()
    assert.strictEqual(roundedPointerMetrics.cornerRadius, 3)
    assert.ok(pointerWheel.prizeRadius > 0)
    assert.strictEqual(typeof pointerWheel._getPointerConfig().renderer, 'undefined')
    assert.strictEqual(pointerWheel._getPointerConfig().preset, 'flapper')
    assert.strictEqual(typeof pointerWheel.ctx.quadraticCurveTo, 'function')
    pointerWheel._drawExternalPointer(roundedPointerMetrics)
    assert.ok(pointerHost.context.quadraticCalls > roundedPointerCalls)
    assert.strictEqual(pointerHost.context.strokeCalls || 0, plainPointerStrokeCount)
    pointerWheel.pointer.accentColor = '#ffffff'
    pointerWheel._drawExternalPointer(pointerWheel._getExternalPointerMetrics())
    assert.strictEqual(pointerHost.context.strokeCalls, plainPointerStrokeCount + 1)
    pointerWheel.pointer.cornerRadius = 0
    const sharpPointerCalls = pointerHost.context.quadraticCalls
    pointerWheel._drawExternalPointer(pointerWheel._getExternalPointerMetrics())
    assert.strictEqual(pointerHost.context.quadraticCalls, sharpPointerCalls)
    delete pointerWheel.pointer.accentColor
    delete pointerWheel.pointer.mount
    pointerWheel.pointer.preset = 'needle'
    const needleMetrics = pointerWheel._getExternalPointerMetrics()
    pointerHost.context.captureLinePoints = true
    pointerHost.context.linePoints = []
    pointerWheel._drawExternalPointer(needleMetrics)
    pointerHost.context.captureLinePoints = false
    assert.ok(
        pointerHost.context.linePoints.some(
            point => Math.abs(Math.abs(point.x) - needleMetrics.width / 2) < 1e-9,
        ),
    )
    assert.ok(Math.abs(needleMetrics.mountRadius - pointerWheel.radius * 2 * 0.022) < 1e-9)
    pointerWheel.pointer.preset = 'wedge'
    const wedgeMetrics = pointerWheel._getExternalPointerMetrics()
    assert.ok(needleMetrics.width < wedgeMetrics.width)
    assert.ok(needleMetrics.height > wedgeMetrics.height)
    pointerWheel.pointer.preset = 'glass'
    delete pointerWheel.pointer.opacity
    pointerHost.context.captureFillAlpha = true
    pointerHost.context.fillAlphas = []
    pointerWheel.draw()
    assert.ok(pointerHost.context.fillAlphas.includes(0.72))
    assert.strictEqual(pointerHost.context.fillAlphas.at(-1), 1)
    pointerHost.context.captureFillAlpha = false
    let customPointerDraws = 0
    pointerWheel.pointer.renderer = () => {
        customPointerDraws += 1
    }
    pointerWheel.draw()
    assert.strictEqual(customPointerDraws, 1)
    delete pointerWheel.pointer.renderer

    const errorsBeforeRendererFailure = physicsErrors.length
    pointerWheel.pointer.renderer = () => {
        throw new Error('renderer failure')
    }
    pointerWheel.draw()
    assert.strictEqual(pointerHost.context.saveDepth, 0)
    assert.strictEqual(physicsErrors.length, errorsBeforeRendererFailure + 1)
    assert.strictEqual(physicsErrors[physicsErrors.length - 1].name, 'WheelCanvasRenderError')
    assert.strictEqual(physicsErrors[physicsErrors.length - 1].cause.message, 'renderer failure')
    delete pointerWheel.pointer.renderer

    pointerWheel.pointer.position = 'right'
    pointerWheel.pointer.shadow = { blur: 0, offsetX: 0, radialOffset: 3 }
    pointerWheel.draw()
    assert.ok(Math.abs(pointerHost.context.shadowOffsetX + 3) < 1e-9)
    assert.ok(Math.abs(pointerHost.context.shadowOffsetY) < 1e-9)
    pointerWheel.pointer.position = 'top'
    pointerWheel.pointer.preset = 'flapper'
    pointerWheel.pointer.mount = { radius: 40, borderWidth: 2 }
    pointerWheel.draw()
    const pointerMetrics = pointerWheel._getExternalPointerMetrics()
    const pointerBaseY =
        pointerWheel.centerY -
        pointerWheel.wheelRadius +
        pointerMetrics.inset -
        pointerMetrics.height
    assert.ok(pointerBaseY - pointerMetrics.mountRadius >= -1e-7)
    pointerWheel.pointer.angle = 45
    pointerWheel.draw()
    const diagonalMetrics = pointerWheel._getExternalPointerMetrics()
    const diagonalRadian = Math.PI / 4
    const diagonalOutwardX = Math.sin(diagonalRadian)
    const diagonalOutwardY = -Math.cos(diagonalRadian)
    const diagonalTangentX = Math.cos(diagonalRadian)
    const diagonalTangentY = Math.sin(diagonalRadian)
    const diagonalRadialDistance = pointerWheel.wheelRadius + diagonalMetrics.space
    const diagonalX = pointerWheel.centerX + diagonalOutwardX * diagonalRadialDistance
    const diagonalY = pointerWheel.centerY + diagonalOutwardY * diagonalRadialDistance
    const diagonalXExtent = Math.abs(diagonalTangentX) * diagonalMetrics.tangentExtent
    const diagonalYExtent = Math.abs(diagonalTangentY) * diagonalMetrics.tangentExtent
    assert.ok(diagonalX - diagonalXExtent >= -1e-4)
    assert.ok(diagonalX + diagonalXExtent <= pointerWheel.boxWidth + 1e-4)
    assert.ok(diagonalY - diagonalYExtent >= -1e-4)
    assert.ok(diagonalY + diagonalYExtent <= pointerWheel.boxHeight + 1e-4)
    delete pointerWheel.pointer.angle
    pointerWheel.pointer.reserveSpace = false
    pointerWheel.draw()
    const overlayMetrics = pointerWheel._getExternalPointerMetrics()
    assert.strictEqual(pointerWheel.centerX, 150)
    assert.strictEqual(pointerWheel.centerY, 150)
    assert.strictEqual(pointerWheel.wheelRadius, 150)
    assert.strictEqual(overlayMetrics.layout, 'overlay')
    assert.strictEqual(overlayMetrics.space, 0)
    assert.strictEqual(overlayMetrics.inwardShift, overlayMetrics.requiredSpace)
    delete pointerWheel.pointer.reserveSpace
    const offsetAngles = { top: 0, right: 90, bottom: 180, left: 270 }
    for (const [position, angle] of Object.entries(offsetAngles)) {
        pointerWheel.pointer.position = position
        for (const tangentOffset of [-140, 140]) {
            pointerWheel.pointer.tangentOffset = tangentOffset
            pointerWheel.draw()
            const offsetMetrics = pointerWheel._getExternalPointerMetrics()
            const radians = (angle * Math.PI) / 180
            const outwardX = Math.sin(radians)
            const outwardY = -Math.cos(radians)
            const tangentX = Math.cos(radians)
            const tangentY = Math.sin(radians)
            const radialDistance = pointerWheel.wheelRadius + offsetMetrics.space
            const centerX =
                pointerWheel.centerX + outwardX * radialDistance + tangentX * tangentOffset
            const centerY =
                pointerWheel.centerY + outwardY * radialDistance + tangentY * tangentOffset
            const xExtent = Math.abs(tangentX) * offsetMetrics.tangentExtent
            const yExtent = Math.abs(tangentY) * offsetMetrics.tangentExtent
            assert.ok(centerX - xExtent >= -1e-4)
            assert.ok(centerX + xExtent <= pointerWheel.boxWidth + 1e-4)
            assert.ok(centerY - yExtent >= -1e-4)
            assert.ok(centerY + yExtent <= pointerWheel.boxHeight + 1e-4)
        }
    }
    pointerWheel.pointer.angle = 45
    pointerWheel.pointer.tangentOffset = 100
    pointerWheel.draw()
    const diagonalOffsetMetrics = pointerWheel._getExternalPointerMetrics()
    const diagonalOffsetCenterX =
        pointerWheel.centerX +
        Math.sin(diagonalRadian) * (pointerWheel.wheelRadius + diagonalOffsetMetrics.space) +
        Math.cos(diagonalRadian) * 100
    const diagonalOffsetCenterY =
        pointerWheel.centerY -
        Math.cos(diagonalRadian) * (pointerWheel.wheelRadius + diagonalOffsetMetrics.space) +
        Math.sin(diagonalRadian) * 100
    const diagonalOffsetExtent =
        Math.abs(Math.cos(diagonalRadian)) * diagonalOffsetMetrics.tangentExtent
    assert.ok(diagonalOffsetCenterX + diagonalOffsetExtent <= pointerWheel.boxWidth + 1e-4)
    assert.ok(diagonalOffsetCenterY + diagonalOffsetExtent <= pointerWheel.boxHeight + 1e-4)
    assert.ok(diagonalOffsetCenterX - diagonalOffsetExtent >= -1e-4)
    assert.ok(diagonalOffsetCenterY - diagonalOffsetExtent >= -1e-4)
    delete pointerWheel.pointer.angle
    delete pointerWheel.pointer.tangentOffset
    pointerWheel.pointer.mount = undefined
    pointerWheel.pointer.shadow = undefined
    pointerWheel.pointer.position = 'right'
    pointerWheel.pointer.preset = 'kite'
    pointerWheel.draw()

    let cancelCalls = 0
    const cancelEvents = []
    pointerWheel.physics.onCancel = (detail, event) => {
        cancelCalls += 1
        cancelEvents.push(event)
        assert.strictEqual(detail.reason, 'test-cancel')
    }
    pointerNow += 10
    pointerHost.listeners.pointerdown({
        pointerId: 101,
        button: 0,
        isPrimary: true,
        clientX: pointerWheel.centerX,
        clientY: pointerWheel.centerY - 100,
    })
    pointerNow += 20
    pointerHost.listeners.pointermove({
        pointerId: 101,
        clientX: pointerWheel.centerX + 60,
        clientY: pointerWheel.centerY - 80,
        preventDefault() {},
    })
    pointerHost.listeners.pointercancel({ pointerId: 101, reason: 'test-cancel' })
    assert.strictEqual(pointerWheel.state, 'idle')
    assert.strictEqual(cancelCalls, 1)
    assert.ok(cancelEvents[0])

    pointerWheel.physics.onCancel = (detail, event) => {
        cancelCalls += 1
        cancelEvents.push(event)
        assert.strictEqual(detail.reason, 'physics-disabled')
    }
    pointerNow += 10
    pointerHost.listeners.pointerdown({
        pointerId: 102,
        button: 0,
        isPrimary: true,
        clientX: pointerWheel.centerX,
        clientY: pointerWheel.centerY - 100,
    })
    pointerNow += 20
    pointerHost.listeners.pointermove({
        pointerId: 102,
        clientX: pointerWheel.centerX + 60,
        clientY: pointerWheel.centerY - 80,
        preventDefault() {},
    })
    pointerWheel.physics.enabled = false
    assert.strictEqual(cancelEvents[1], null)
    pointerWheel.physics.enabled = true

    forcedPhysicsTarget = pointerWheel.prizes.length
    const endCountBeforeInvalidTarget = physicsEndPrizes.length
    assert.strictEqual(pointerWheel.spin(900), true)
    assert.strictEqual(pointerWheel.state, 'coasting')
    finishPhysicalSpin()
    assert.strictEqual(physicsEndPrizes.length, endCountBeforeInvalidTarget)
    assert.strictEqual(physicsErrors[physicsErrors.length - 1].name, 'WheelCanvasPhysicsError')

    const workingOnRelease = pointerWheel.physics.onRelease
    pointerWheel.physics.onRelease = () => {
        throw new Error('release callback failed')
    }
    assert.strictEqual(pointerWheel.spin(900), false)
    assert.strictEqual(pointerWheel.state, 'idle')
    assert.strictEqual(physicsErrors[physicsErrors.length - 1].message, 'release callback failed')
    pointerWheel.physics.onRelease = workingOnRelease

    pointerWheel.physics.onRelease = () => {
        return Object.defineProperty({}, 'then', {
            get() {
                throw new Error('then getter failed')
            },
        })
    }
    assert.strictEqual(pointerWheel.spin(900), true)
    assert.strictEqual(pointerWheel.state, 'coasting')
    assert.strictEqual(physicsErrors[physicsErrors.length - 1].message, 'then getter failed')
    finishPhysicalSpin()
    pointerWheel.physics.onRelease = workingOnRelease

    const endCountBeforeRejection = physicsEndPrizes.length
    forcedPhysicsTarget = Promise.reject(new Error('physics result failed'))
    assert.strictEqual(pointerWheel.spin(900), true)
    await Promise.resolve()
    await Promise.resolve()
    assert.strictEqual(pointerWheel.state, 'coasting')
    finishPhysicalSpin()
    assert.strictEqual(physicsEndPrizes.length, endCountBeforeRejection)
    assert.strictEqual(physicsErrors[physicsErrors.length - 1].message, 'physics result failed')

    pointerWheel.physics.resultTimeout = 5
    forcedPhysicsTarget = new Promise(() => {})
    assert.strictEqual(pointerWheel.spin(900), true)
    await new Promise(resolve => setTimeout(resolve, 10))
    assert.strictEqual(pointerWheel.state, 'coasting')
    finishPhysicalSpin()
    assert.strictEqual(physicsErrors[physicsErrors.length - 1].name, 'WheelCanvasPhysicsError')

    pointerWheel.physics.resultTimeout = 0
    pointerWheel.physics.waitingStrategy = 'coast'
    forcedPhysicsTarget = new Promise(() => {})
    const endCountBeforeCoastTimeout = physicsEndPrizes.length
    assert.strictEqual(pointerWheel.spin(900), true)
    finishPhysicalSpin()
    assert.strictEqual(physicsEndPrizes.length, endCountBeforeCoastTimeout)
    assert.match(
        physicsErrors[physicsErrors.length - 1].message,
        /not available before the wheel stopped/,
    )

    pointerWheel.physics.waitingStrategy = 'hold'
    pointerWheel.physics.errorStrategy = 'stop'
    forcedPhysicsTarget = pointerWheel.prizes.length
    assert.strictEqual(pointerWheel.spin(900), false)
    assert.strictEqual(pointerWheel.state, 'idle')
    pointerWheel.physics.errorStrategy = 'coast'

    const destroyOnStartHost = createCanvas()
    const destroyOnStartWheel = new WheelCanvas(
        {
            canvasElement: destroyOnStartHost.canvas,
            ctx: destroyOnStartHost.context,
            rAF: () => 1,
            cancelAnimationFrame() {},
        },
        {
            prizes: [{ range: 1 }],
            physics: {
                enabled: true,
                onStart() {
                    this.destroy()
                },
            },
        },
    )
    await destroyOnStartWheel.ready
    assert.strictEqual(destroyOnStartWheel.spin(500), false)
    assert.strictEqual(destroyOnStartWheel._destroyed, true)
    assert.strictEqual(destroyOnStartWheel.state, 'idle')
    assert.strictEqual(destroyOnStartWheel.isRunning(), false)

    const destroyOnErrorHost = createCanvas()
    let destroyOnErrorEnds = 0
    let destroyOnErrorPhysicsEnds = 0
    const destroyOnErrorWheel = new WheelCanvas(
        {
            canvasElement: destroyOnErrorHost.canvas,
            ctx: destroyOnErrorHost.context,
            rAF: () => 1,
            cancelAnimationFrame() {},
        },
        {
            prizes: [{ range: 1 }],
            physics: {
                enabled: true,
                onRelease: () => 99,
                onEnd() {
                    destroyOnErrorPhysicsEnds += 1
                },
            },
            end() {
                destroyOnErrorEnds += 1
            },
            error() {
                this.destroy()
            },
        },
    )
    await destroyOnErrorWheel.ready
    assert.strictEqual(destroyOnErrorWheel.spin(500), false)
    assert.strictEqual(destroyOnErrorWheel._destroyed, true)
    assert.strictEqual(destroyOnErrorWheel.state, 'idle')
    assert.strictEqual(destroyOnErrorPhysicsEnds, 0)
    assert.strictEqual(destroyOnErrorEnds, 0)

    const destroyMidLandingHost = createCanvas()
    let destroyMidLandingNow = 0
    let destroyMidLandingFrame = null
    let resolveDestroyMidLandingTarget
    let destroyMidLandingEnds = 0
    const destroyMidLandingWheel = new WheelCanvas(
        {
            canvasElement: destroyMidLandingHost.canvas,
            ctx: destroyMidLandingHost.context,
            now: () => destroyMidLandingNow,
            rAF(callback) {
                destroyMidLandingFrame = callback
                return 1
            },
            cancelAnimationFrame() {
                destroyMidLandingFrame = null
            },
        },
        {
            prizes: [{ range: 1 }, { range: 1 }, { range: 1 }, { range: 1 }],
            physics: {
                enabled: true,
                minVelocity: 100,
                friction: 1000,
                stopVelocity: 10,
                onRelease() {
                    return new Promise(resolve => {
                        resolveDestroyMidLandingTarget = resolve
                    })
                },
            },
            end() {
                destroyMidLandingEnds += 1
            },
        },
    )
    await destroyMidLandingWheel.ready
    assert.strictEqual(destroyMidLandingWheel.spin(150), true)
    const destroyMidCoastFrame = destroyMidLandingFrame
    destroyMidLandingFrame = null
    destroyMidLandingNow += 50
    destroyMidCoastFrame(destroyMidLandingNow)
    resolveDestroyMidLandingTarget(2)
    await Promise.resolve()
    await Promise.resolve()
    assert.strictEqual(destroyMidLandingWheel.state, 'settling')
    assert.ok(destroyMidLandingWheel._physicsLandingSegments)
    destroyMidLandingWheel.currentPrizeIndex = -1
    destroyMidLandingWheel.onCurrentChangeCallback = function () {
        this.destroy()
    }
    const destroyMidSettleFrame = destroyMidLandingFrame
    destroyMidLandingFrame = null
    destroyMidLandingNow += 50
    destroyMidSettleFrame(destroyMidLandingNow)
    assert.strictEqual(destroyMidLandingWheel._destroyed, true)
    assert.strictEqual(destroyMidLandingWheel.state, 'idle')
    assert.strictEqual(destroyMidLandingWheel._frameId, null)
    assert.strictEqual(destroyMidLandingFrame, null)
    assert.strictEqual(destroyMidLandingEnds, 0)

    pointerWheel.physics.resultTimeout = 10000
    forcedPhysicsTarget = null
    pointerWheel.currentPrizeIndex = -1
    pointerWheel.onCurrentChangeCallback = () => {
        throw new Error('gesture change failed')
    }
    dragWheel(3, 250, 150, 20)
    assert.strictEqual(pointerWheel.isRunning(), false)
    assert.strictEqual(physicsErrors[physicsErrors.length - 1].message, 'gesture change failed')
    pointerWheel.physics.enabled = false
    assert.strictEqual(pointerHost.canvas.style.touchAction, '')
    pointerWheel.physics.enabled = true
    assert.strictEqual(pointerHost.canvas.style.touchAction, 'none')
    pointerWheel.destroy()
    assert.strictEqual(pointerHost.listeners.pointerdown, undefined)
    assert.strictEqual(pointerHost.canvas.style.touchAction, undefined)

    let loadOverrides = 0
    let sizeOverrides = 0
    class ExtendedWheel extends WheelCanvas {
        loadImg() {
            loadOverrides += 1
            return Promise.resolve({ width: 20, height: 10, naturalWidth: 20, naturalHeight: 10 })
        }

        computedWidthAndHeight(...args) {
            sizeOverrides += 1
            return super.computedWidthAndHeight(...args)
        }
    }
    const extensionHost = createCanvas()
    const extensionWheel = new ExtendedWheel(
        {
            canvasElement: extensionHost.canvas,
            ctx: extensionHost.context,
        },
        {
            width: 300,
            height: 300,
            prizes: [{ range: 1, imgs: [{ src: 'extended.png' }] }],
        },
    )
    await extensionWheel.ready
    assert.strictEqual(loadOverrides, 1)
    assert.ok(sizeOverrides > 0)
    extensionWheel.destroy()

    const asyncErrorHost = createCanvas()
    let asyncError = null
    const asyncErrorWheel = new WheelCanvas(
        {
            canvasElement: asyncErrorHost.canvas,
            ctx: asyncErrorHost.context,
        },
        {
            prizes: [{ range: 1 }],
            start() {
                this.play()
                return Promise.reject(new Error('network failed'))
            },
            error(error) {
                asyncError = error
            },
        },
    )
    await asyncErrorWheel.ready
    asyncErrorWheel._triggerStart({})
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.strictEqual(asyncError.message, 'network failed')
    assert.strictEqual(asyncErrorWheel.isRunning(), false)
    asyncErrorWheel.destroy()

    const workingImage = global.Image
    const originalConsoleError = console.error
    global.Image = class HangingImage {
        set src(value) {
            this._src = value
        }
    }
    console.error = () => {}
    try {
        const timeoutHost = createCanvas()
        let timeoutAssetError = null
        const timeoutWheel = new WheelCanvas(
            {
                canvasElement: timeoutHost.canvas,
                ctx: timeoutHost.context,
                imageTimeout: 5,
            },
            {
                prizes: [{ range: 1, imgs: [{ src: 'never-loads.png' }] }],
                error(error) {
                    timeoutAssetError = error
                },
            },
        )
        await Promise.race([
            timeoutWheel.ready,
            new Promise((resolve, reject) => {
                setTimeout(() => reject(new Error('Image timeout did not release ready')), 200)
            }),
        ])
        assert.strictEqual(timeoutAssetError.name, 'WheelCanvasAssetError')
        assert.strictEqual(timeoutAssetError.src, 'never-loads.png')
        timeoutWheel.destroy()

        const cancelHost = createCanvas()
        const cancelWheel = new WheelCanvas(
            {
                canvasElement: cancelHost.canvas,
                ctx: cancelHost.context,
                imageTimeout: 0,
            },
            {
                prizes: [{ range: 1, imgs: [{ src: 'cancel-on-destroy.png' }] }],
            },
        )
        const cancelledReady = cancelWheel.ready
        cancelWheel.destroy()
        await Promise.race([
            cancelledReady,
            new Promise((resolve, reject) => {
                setTimeout(() => reject(new Error('Destroy did not cancel image loading')), 200)
            }),
        ])
    } finally {
        global.Image = workingImage
        console.error = originalConsoleError
    }

    console.log('Standalone WheelCanvas edge-case test passed')
}

run().catch(error => {
    console.error(error)
    process.exitCode = 1
})
