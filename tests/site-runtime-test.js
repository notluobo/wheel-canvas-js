const assert = require('assert')
const fs = require('fs')
const path = require('path')
const vm = require('vm')

function createElement(overrides = {}) {
    const listeners = new Map()
    const attributes = new Map()
    const classNames = new Set()
    const element = {
        appendChild(child) {
            this.children.push(child)
            child.parentElement = this
            return child
        },
        addEventListener(type, listener) {
            const previous = listeners.get(type)
            listeners.set(type, event => {
                if (previous) previous(event)
                return listener(event)
            })
        },
        classList: null,
        closest() {
            return null
        },
        contains(target) {
            if (target === this) return true
            return this.children.some(child => child.contains && child.contains(target))
        },
        checked: false,
        children: [],
        dataset: {},
        disabled: false,
        dispatchEvent(event) {
            event.target = this
            event.currentTarget = this
            const listener = listeners.get(event.type)
            if (listener) listener(event)
            return true
        },
        focus() {},
        getBoundingClientRect() {
            return { top: 120, right: 320, bottom: 160, left: 80, width: 240, height: 40 }
        },
        getAttribute(name) {
            return attributes.get(name) || null
        },
        listeners,
        hidden: false,
        parentElement: null,
        querySelector(selector) {
            if (!selector.startsWith('.')) return null
            const className = selector.slice(1)
            const queue = [...this.children]
            while (queue.length) {
                const child = queue.shift()
                const childClasses = String(child.className || '').split(/\s+/)
                if (
                    childClasses.includes(className) ||
                    (child.classList && child.classList.contains(className))
                ) {
                    return child
                }
                queue.push(...(child.children || []))
            }
            return null
        },
        selectionEnd: 0,
        selectionStart: 0,
        select() {},
        removeAttribute(name) {
            attributes.delete(name)
        },
        replaceChildren(...children) {
            this.children = children
        },
        setAttribute(name, value) {
            attributes.set(name, String(value))
        },
        setRangeText(text) {
            this.value += text
        },
        style: {},
        textContent: '',
        value: '',
    }
    element.classList = {
        add(...names) {
            names.forEach(name => classNames.add(name))
        },
        contains(name) {
            return classNames.has(name)
        },
        remove(...names) {
            names.forEach(name => classNames.delete(name))
        },
        toggle(name, force) {
            const enabled = force === undefined ? !classNames.has(name) : force
            if (enabled) classNames.add(name)
            else classNames.delete(name)
            return enabled
        },
    }
    return Object.assign(element, overrides)
}

class WheelCanvasStub {
    static instances = []

    constructor(target, config) {
        this.target = target
        this.config = config
        this.options = config
        this.width = config.width
        this.height = config.height
        this.boxWidth = Number.parseFloat(config.width)
        this.boxHeight = Number.parseFloat(config.height)
        this.dpr = 1
        this.blocks = config.blocks || []
        this.prizes = config.prizes || []
        this.defaultConfig = config.defaultConfig || {}
        this.defaultStyle = config.defaultStyle || {}
        this.buttons = config.buttons || []
        this.pointer = config.pointer || null
        this.physics = config.physics || {}
        this.feedback = config.feedback || {}
        this.canvas = createElement()
        this.running = false
        this.destroyed = false
        WheelCanvasStub.instances.push(this)
        if (typeof config.afterResize === 'function') config.afterResize.call(this)
    }

    destroy() {
        this.destroyed = true
        this.running = false
    }

    isRunning() {
        return this.running
    }

    play() {
        this.running = true
        return true
    }

    stop() {
        this.running = false
        return true
    }

    resize() {
        this.resizeCalls = (this.resizeCalls || 0) + 1
    }

    setSize(width, height = width) {
        this.width = width
        this.height = height
        this.options.width = width
        this.options.height = height
        this.boxWidth = Number.parseFloat(width)
        this.boxHeight = Number.parseFloat(height)
        this.resize()
        if (typeof this.config.afterResize === 'function') this.config.afterResize.call(this)
    }

    async update(patch = {}) {
        Object.assign(this.options, patch)
        if ('width' in patch) this.width = patch.width
        if ('height' in patch) this.height = patch.height
        if ('blocks' in patch) this.blocks = patch.blocks || []
        if ('prizes' in patch) this.prizes = patch.prizes || []
        if ('buttons' in patch) this.buttons = patch.buttons || []
        if ('pointer' in patch) this.pointer = patch.pointer || null
        if (patch.defaultConfig) Object.assign(this.defaultConfig, patch.defaultConfig)
        if (patch.defaultStyle) Object.assign(this.defaultStyle, patch.defaultStyle)
        if (patch.physics) Object.assign(this.physics, patch.physics)
        if (patch.feedback) Object.assign(this.feedback, patch.feedback)
    }
}

function executeBrowserScript(fileName, selectors, selectorLists = {}) {
    class EventStub {
        constructor(type, options = {}) {
            this.type = type
            this.bubbles = options.bubbles === true
        }
    }

    class FileReaderStub {
        constructor() {
            this.listeners = new Map()
            this.result = null
        }

        addEventListener(type, listener) {
            this.listeners.set(type, listener)
        }

        readAsDataURL(file) {
            this.result = `data:${file.type};base64,dGVzdA==`
            this.listeners.get('load')()
        }
    }

    const document = {
        activeElement: null,
        body: createElement({ dataset: { page: 'home' } }),
        documentElement: { clientHeight: 800, clientWidth: 1200 },
        head: createElement(),
        createElement() {
            return createElement()
        },
        querySelector(selector) {
            return selectors[selector] || null
        },
        querySelectorAll(selector) {
            return selectorLists[selector] || []
        },
    }
    const window = {
        addEventListener() {},
        clearTimeout() {},
        setTimeout() {
            return 1
        },
    }
    const storageValues = new Map()
    const localStorage = {
        getItem(key) {
            return storageValues.has(key) ? storageValues.get(key) : null
        },
        removeItem(key) {
            storageValues.delete(key)
        },
        setItem(key, value) {
            storageValues.set(key, String(value))
        },
    }
    window.localStorage = localStorage
    const context = {
        console,
        document,
        FileReader: FileReaderStub,
        Event: EventStub,
        WheelCanvasJS: { WheelCanvas: WheelCanvasStub },
        navigator: {
            clipboard: {
                async writeText() {},
            },
        },
        setTimeout: window.setTimeout,
        localStorage,
        storageValues,
        window,
    }

    const source = fs.readFileSync(path.join(__dirname, '..', fileName), 'utf8')
    vm.runInNewContext(source, context, { filename: fileName })
    return context
}

WheelCanvasStub.instances = []
const pointerColorInput = createElement({ value: '#6047dd' })
const pointerPositionSelect = createElement({ value: 'top' })
const pointerPresetSelect = createElement({ value: 'minimal' })
const pointerSizeInput = createElement({ value: '100' })
const pointerSizeValue = createElement()
const pointerInsetInput = createElement({ value: '14' })
const pointerInsetValue = createElement()
const centerTextToggle = createElement({ checked: true })
const centerSizeInput = createElement({ value: '18' })
const centerSizeValue = createElement()
const centerBorderInput = createElement({ value: '3' })
const centerBorderValue = createElement()
const physicsModeToggle = createElement({ checked: false })
const contentEditorDialog = createElement({
    open: false,
    close() {
        this.open = false
    },
    showModal() {
        this.open = true
    },
})
const tutorialDialog = createElement({
    open: false,
    close() {
        this.open = false
    },
    showModal() {
        this.open = true
    },
})
const pointerPresetParent = createElement()
pointerPresetSelect.setAttribute('aria-label', '指针造型')
pointerPresetSelect.options = [
    ['minimal', '极简融合箭头'],
    ['classic', '经典拨片'],
    ['flapper', '机械拨片'],
    ['wedge', '简洁箭头'],
    ['needle', '精细针尖'],
    ['pin', '图钉'],
    ['glass', '玻璃'],
    ['jewel', '宝石'],
].map(([value, textContent]) => ({ value, textContent, disabled: false }))
pointerPresetParent.appendChild(pointerPresetSelect)
const homeSelectors = {
    '#graphic-weight': createElement({ checked: false }),
    '#pointer-color': pointerColorInput,
    '#pointer-color-source': createElement({ value: 'currentPrize' }),
    '#pointer-position': pointerPositionSelect,
    '#pointer-preset': pointerPresetSelect,
    '#pointer-size': pointerSizeInput,
    '#pointer-size-value': pointerSizeValue,
    '#pointer-inset': pointerInsetInput,
    '#pointer-inset-value': pointerInsetValue,
    '#center-text': centerTextToggle,
    '#center-size': centerSizeInput,
    '#center-size-value': centerSizeValue,
    '#center-border': centerBorderInput,
    '#center-border-value': centerBorderValue,
    '#physics-mode': physicsModeToggle,
    '#play': createElement(),
    '#content-editor': contentEditorDialog,
    '#content-editor-open': createElement(),
    '#content-editor-close': createElement(),
    '#content-editor-reset': createElement(),
    '#content-editor-add': createElement(),
    '#prize-editor-list': createElement(),
    '#content-editor-status': createElement(),
    '#tutorial-dialog': tutorialDialog,
    '#tutorial-open': createElement(),
    '#tutorial-close': createElement(),
    '#result': createElement(),
    '#spin-announcer': createElement(),
    '#pointer-border-color': createElement({ value: '#3d2b78' }),
    '#pointer-border': createElement({ value: '2' }),
    '#pointer-border-value': createElement(),
    '#pointer-radius': createElement({ value: '3' }),
    '#pointer-radius-value': createElement(),
    '#pointer-wobble': createElement({ checked: true }),
    '#pointer-wobble-amplitude': createElement({ value: '2.5' }),
    '#pointer-wobble-amplitude-value': createElement(),
    '#pointer-wobble-duration': createElement({ value: '180' }),
    '#pointer-wobble-duration-value': createElement(),
    '#pointer-wobble-frequency': createElement({ value: '14' }),
    '#pointer-wobble-frequency-value': createElement(),
    '#pointer-wobble-damping': createElement({ value: '12' }),
    '#pointer-wobble-damping-value': createElement(),
    '#sound-enabled': createElement({ checked: true }),
    '#sound-pack': createElement({ value: 'mechanical' }),
    '#sector-sound': createElement({ value: 'snap' }),
    '#result-sound': createElement({ value: 'reward' }),
    '#sound-volume': createElement({ value: '0.3' }),
    '#sound-volume-value': createElement(),
    '#sound-interval': createElement({ value: '35' }),
    '#sound-interval-value': createElement(),
    '#preview-sound': createElement(),
    '#celebration-enabled': createElement({ checked: true }),
    '#celebration-style': createElement({ value: 'subtle' }),
    '#celebration-count': createElement({ value: '48' }),
    '#celebration-count-value': createElement(),
    '#celebration-reduced-motion': createElement({ checked: true }),
    '#pointer-offset': createElement({ value: '0' }),
    '#pointer-offset-value': createElement(),
    '#pointer-mount': createElement({ checked: false }),
    '#pointer-layout': createElement({ value: 'stable' }),
    '#pointer-space': createElement({ value: '18' }),
    '#pointer-space-value': createElement(),
    '#center-pointer-angle': createElement({ value: '0' }),
    '#center-pointer-angle-value': createElement(),
    '#center-pointer-offset': createElement({ value: '0' }),
    '#center-pointer-offset-value': createElement(),
    '#center-pointer-fused': createElement({ checked: true }),
    '#center-fusion-style': createElement({ value: 'droplet' }),
    '#outer-color': createElement({ value: '#f4efe4' }),
    '#outer-width': createElement({ value: '4' }),
    '#outer-width-value': createElement(),
    '#inner-color': createElement({ value: '#ffffff' }),
    '#inner-width': createElement({ value: '4' }),
    '#inner-width-value': createElement(),
    '#sector-gutter': createElement({ value: '4' }),
    '#sector-gutter-value': createElement(),
    '#sector-offset': createElement({ value: '0' }),
    '#sector-offset-value': createElement(),
    '#canvas-size': createElement({ value: '520' }),
    '#canvas-size-value': createElement(),
    '#canvas-preview-size': createElement(),
    '#center-visible': createElement({ checked: true }),
    '#center-label': createElement({ value: '开始' }),
    '#center-color': createElement({ value: '#6047dd' }),
    '#center-border-color': createElement({ value: '#ffffff' }),
    '#center-align': createElement({ value: 'middle' }),
    '#center-font-size': createElement({ value: '16' }),
    '#center-font-size-value': createElement(),
    '#prize-content-mode': createElement({ value: 'text' }),
    '#prize-image-url': createElement({ value: './demo/assets/demo-gift.svg' }),
    '#prize-image-file': createElement(),
    '#prize-image-cross-origin': createElement({ value: 'anonymous' }),
    '#prize-image-size': createElement({ value: '34' }),
    '#prize-image-size-value': createElement(),
    '#prize-image-top': createElement({ value: '42' }),
    '#prize-image-top-value': createElement(),
    '#center-logo-visible': createElement({ checked: false }),
    '#center-logo-url': createElement({ value: './demo/assets/demo-spark.svg' }),
    '#center-logo-file': createElement(),
    '#center-logo-size': createElement({ value: '42' }),
    '#center-logo-size-value': createElement(),
    '#prize-text-visible': createElement({ checked: true }),
    '#text-wrap': createElement({ checked: true }),
    '#text-auto-scale': createElement({ checked: true }),
    '#text-orientation': createElement({ value: 'horizontal' }),
    '#text-align': createElement({ value: 'center' }),
    '#text-overflow': createElement({ value: 'ellipsis' }),
    '#text-color': createElement({ value: '#2d2142' }),
    '#text-size': createElement({ value: '14' }),
    '#text-size-value': createElement(),
    '#text-length': createElement({ value: '90' }),
    '#text-length-value': createElement(),
    '#text-clamp': createElement({ value: '2' }),
    '#text-clamp-value': createElement(),
    '#text-top': createElement({ value: '18' }),
    '#text-top-value': createElement(),
    '#text-left': createElement({ value: '0' }),
    '#text-left-value': createElement(),
    '#spin-speed': createElement({ value: '20' }),
    '#spin-speed-value': createElement(),
    '#speed-function': createElement({ value: 'quad' }),
    '#acceleration': createElement({ value: '800' }),
    '#acceleration-value': createElement(),
    '#deceleration': createElement({ value: '2500' }),
    '#deceleration-value': createElement(),
    '#stop-range': createElement({ value: '0.7' }),
    '#stop-range-value': createElement(),
    '#sensitivity': createElement({ value: '1' }),
    '#sensitivity-value': createElement(),
    '#friction': createElement({ value: '24' }),
    '#friction-value': createElement(),
    '#drag': createElement({ value: '0.68' }),
    '#drag-value': createElement(),
    '#physics-direction': createElement({ value: 'both' }),
    '#max-dpr': createElement({ value: '3' }),
    '#max-dpr-value': createElement(),
    '#max-canvas-pixels': createElement({ value: '16777216' }),
    '#image-concurrency': createElement({ value: '6' }),
    '#image-concurrency-value': createElement(),
    '#live-config-json': createElement(),
    '#apply-live-config': createElement(),
    '#reset-live-config': createElement(),
    '#copy-live-config': createElement(),
    '#reset-workbench-config': createElement(),
    '#config-storage-status': createElement(),
    '#wheel-prize-list': createElement(),
}
const homeContext = executeBrowserScript('demo/app.js', homeSelectors, {
    '.demo-control-panel input, .demo-control-panel select, .demo-control-panel textarea, .demo-control-panel button':
        Object.values(homeSelectors),
    '.demo-control select': [pointerPresetSelect],
})
assert.strictEqual(WheelCanvasStub.instances.length, 1)
const homeWheel = WheelCanvasStub.instances[0]
assert.strictEqual(WheelCanvasStub.instances[0].config.prizes.length, 6)
assert.strictEqual(homeSelectors['#canvas-preview-size'].textContent, '520×520px · DPR 1')
assert.strictEqual(homeWheel.width, '520px')
assert.strictEqual(homeWheel.height, '520px')
assert.deepStrictEqual(
    Array.from(homeWheel.blocks, block => [block.padding, block.background]),
    [
        ['4px', '#f4efe4'],
        ['4px', '#ffffff'],
    ],
)
assert.strictEqual(homeWheel.defaultConfig.gutter, '4px')
assert.strictEqual(homeWheel.defaultConfig.offsetDegree, -30)
assert.strictEqual(homeWheel.defaultConfig.useGraphicWeight, false)
assert.strictEqual(WheelCanvasStub.instances[0].pointer.type, 'center')
assert.strictEqual(WheelCanvasStub.instances[0].pointer.preset, 'minimal')
assert.strictEqual(WheelCanvasStub.instances[0].pointer.fused, true)
assert.strictEqual(WheelCanvasStub.instances[0].pointer.width, '58%')
assert.strictEqual(WheelCanvasStub.instances[0].pointer.height, '78%')
assert.strictEqual(WheelCanvasStub.instances[0].pointer.borderWidth, 2)
assert.strictEqual(WheelCanvasStub.instances[0].pointer.cornerRadius, 3)
assert.strictEqual(WheelCanvasStub.instances[0].pointer.fusionStyle, 'droplet')
assert.strictEqual(WheelCanvasStub.instances[0].pointer.shadow, false)
assert.strictEqual(WheelCanvasStub.instances[0].pointer.colorSource, 'currentPrize')
assert.strictEqual(WheelCanvasStub.instances[0].pointer.wobble.enabled, true)
assert.strictEqual(WheelCanvasStub.instances[0].pointer.wobble.amplitude, 2.5)
assert.strictEqual(homeSelectors['#wheel-prize-list'].children.length, 6)
assert.strictEqual(WheelCanvasStub.instances[0].feedback.sound.enabled, true)
assert.strictEqual(WheelCanvasStub.instances[0].feedback.sound.pack, 'mechanical')
assert.strictEqual(WheelCanvasStub.instances[0].feedback.celebration.enabled, true)
assert.strictEqual(WheelCanvasStub.instances[0].physics.enabled, true)
assert.strictEqual(physicsModeToggle.checked, true)
assert.strictEqual(homeSelectors['#sound-volume-value'].textContent, '30%')
assert.strictEqual(homeWheel.defaultConfig.maxDpr, 3)
assert.strictEqual(homeWheel.defaultConfig.maxCanvasPixels, 16777216)
assert.strictEqual(homeWheel.defaultConfig.imageConcurrency, 6)
assert.strictEqual(homeSelectors['#config-storage-status'].textContent, '本地自动保存')
const customSelectRoot = pointerPresetParent.children[1]
const customSelectTrigger = customSelectRoot.children[0]
assert.strictEqual(customSelectTrigger.children[0].textContent, '极简融合箭头')
customSelectTrigger.listeners.get('click')({ preventDefault() {} })
const customSelectPopover = homeContext.document.body.children[0]
assert.strictEqual(customSelectPopover.hidden, false)
assert.strictEqual(customSelectPopover.children[0].children[0].placeholder, '搜索选项')
const customSelectList = customSelectPopover.children[1]
customSelectList.children[1].listeners.get('click')()
assert.strictEqual(pointerPresetSelect.value, 'classic')
assert.strictEqual(homeWheel.pointer.preset, 'classic')
customSelectTrigger.listeners.get('click')({ preventDefault() {} })
customSelectList.children[0].listeners.get('click')()
assert.strictEqual(pointerPresetSelect.value, 'minimal')
homeSelectors['#tutorial-open'].listeners.get('click')()
assert.strictEqual(tutorialDialog.open, true)
homeSelectors['#tutorial-close'].listeners.get('click')()
assert.strictEqual(tutorialDialog.open, false)
homeSelectors['#content-editor-open'].listeners.get('click')()
assert.strictEqual(contentEditorDialog.open, true)
assert.strictEqual(homeSelectors['#prize-editor-list'].children.length, 6)
const firstPrizeEditorRow = homeSelectors['#prize-editor-list'].children[0]
const firstPrizeNameInput = firstPrizeEditorRow.children[1].children[1]
firstPrizeNameInput.value = '超级大奖'
firstPrizeNameInput.listeners.get('input')()
assert.strictEqual(homeWheel.prizes[0].fonts[0].text, '超级大奖')
const firstPrizeTextColorInput = firstPrizeEditorRow.children[3].children[1]
firstPrizeTextColorInput.value = '#123456'
firstPrizeTextColorInput.listeners.get('input')()
assert.strictEqual(homeWheel.prizes[0].fonts[0].fontColor, '#123456')
const firstPrizeImageEditor = firstPrizeEditorRow.children[7]
const firstPrizeImageFields = firstPrizeImageEditor.children[1]
const firstPrizeImageVisible = firstPrizeImageFields.children[0].children[0]
const firstPrizeImageSource = firstPrizeImageFields.children[1].children[1]
const firstPrizeImageWidth = firstPrizeImageFields.children[3].children[1]
firstPrizeImageSource.value = './demo/assets/demo-gift.svg'
firstPrizeImageSource.listeners.get('change')()
assert.strictEqual(homeWheel.prizes[0].imgs[0].src, './demo/assets/demo-gift.svg')
assert.strictEqual(homeWheel.prizes[0].imgs[0].visible, true)
assert.strictEqual(firstPrizeImageVisible.checked, true)
firstPrizeImageWidth.value = '48'
firstPrizeImageWidth.listeners.get('input')()
assert.strictEqual(homeWheel.prizes[0].imgs[0].width, '48%')
firstPrizeImageVisible.checked = false
firstPrizeImageVisible.listeners.get('change')()
assert.strictEqual(homeWheel.prizes[0].imgs[0].visible, false)
assert.strictEqual(
    homeSelectors['#wheel-prize-list'].children[0].textContent.includes('超级大奖'),
    true,
)
homeSelectors['#content-editor-add'].listeners.get('click')()
assert.strictEqual(homeWheel.prizes.length, 7)
assert.strictEqual(homeSelectors['#prize-editor-list'].children.length, 7)
homeSelectors['#prize-editor-list'].children[6].children[6].listeners.get('click')()
assert.strictEqual(homeWheel.prizes.length, 6)
homeSelectors['#content-editor-close'].listeners.get('click')()
assert.strictEqual(contentEditorDialog.open, false)
homeSelectors['#max-dpr'].value = '2.5'
homeSelectors['#max-dpr'].listeners.get('input')()
assert.strictEqual(homeWheel.defaultConfig.maxDpr, 2.5)
homeSelectors['#max-canvas-pixels'].value = '8388608'
homeSelectors['#max-canvas-pixels'].listeners.get('change')()
assert.strictEqual(homeWheel.defaultConfig.maxCanvasPixels, 8388608)
homeSelectors['#image-concurrency'].value = '4'
homeSelectors['#image-concurrency'].listeners.get('input')()
assert.strictEqual(homeWheel.defaultConfig.imageConcurrency, 4)
homeSelectors['#sound-pack'].value = 'glass'
homeSelectors['#sound-pack'].listeners.get('change')()
assert.strictEqual(WheelCanvasStub.instances[0].feedback.sound.pack, 'glass')
homeSelectors['#sound-enabled'].checked = false
homeSelectors['#sound-enabled'].listeners.get('change')()
assert.strictEqual(WheelCanvasStub.instances[0].feedback.sound.enabled, false)
assert.strictEqual(homeSelectors['#sector-sound'].disabled, true)
homeSelectors['#sound-enabled'].checked = true
homeSelectors['#sound-enabled'].listeners.get('change')()
homeSelectors['#celebration-style'].value = 'stars'
homeSelectors['#celebration-style'].listeners.get('change')()
assert.strictEqual(WheelCanvasStub.instances[0].feedback.celebration.style, 'stars')

const audioInstances = []
class AudioStub {
    constructor(src) {
        this.src = src
        this.paused = true
        this.ended = false
        this.currentTime = 0
        audioInstances.push(this)
    }

    pause() {
        this.paused = true
    }

    play() {
        this.paused = false
        return Promise.resolve()
    }
}
homeContext.window.Audio = AudioStub
homeSelectors['#preview-sound'].listeners.get('click')()
assert.strictEqual(audioInstances.length, 2)
assert.match(audioInstances[0].src, /uisfx@0\.4\.0\/sounds\/glass\/reward\.mp3$/)
assert.strictEqual(audioInstances[0].volume, 0.3)
assert.strictEqual(audioInstances[0].playbackRate, 1)
homeContext.playWheelSound.call(
    homeWheel,
    'snap',
    { type: 'sector', angularVelocity: 2400 },
    homeWheel.feedback.sound,
)
assert.strictEqual(audioInstances.length, 6)
assert.match(audioInstances[2].src, /uisfx@0\.4\.0\/sounds\/glass\/snap\.mp3$/)
assert.strictEqual(audioInstances[2].playbackRate, 1.25)

const confettiCalls = []
let confettiResetCalls = 0
homeContext.window.innerWidth = 1200
homeContext.window.innerHeight = 800
homeContext.window.matchMedia = () => ({ matches: false })
homeContext.fireWheelCelebration.call(
    homeWheel,
    'subtle',
    { colors: ['#ff0000'] },
    homeWheel.feedback.celebration,
)
const confettiScript = homeContext.document.head.children[0]
assert.match(confettiScript.src, /canvas-confetti@1\.9\.4\/dist\/confetti\.browser\.js$/)
assert.match(confettiScript.integrity, /^sha384-/)
assert.strictEqual(confettiScript.crossOrigin, 'anonymous')
confettiScript.listeners.get('error')()
homeContext.window.confetti = options => confettiCalls.push(options)
homeContext.window.confetti.reset = () => {
    confettiResetCalls += 1
}
homeContext.fireWheelCelebration.call(
    homeWheel,
    'stars',
    { colors: ['#ff0000', 'not-a-color'] },
    homeWheel.feedback.celebration,
)
assert.strictEqual(confettiCalls.length, 1)
assert.strictEqual(confettiCalls[0].particleCount, 48)
assert.deepStrictEqual(Array.from(confettiCalls[0].colors), ['#ff0000'])
assert.deepStrictEqual(Array.from(confettiCalls[0].shapes), ['star'])
homeContext.window.matchMedia = () => ({ matches: true })
homeContext.fireWheelCelebration.call(
    homeWheel,
    'stars',
    { colors: ['#ff0000'] },
    homeWheel.feedback.celebration,
)
assert.strictEqual(confettiCalls.length, 1)
homeContext.releaseOptionalFeedback()
assert.ok(audioInstances.every(audio => audio.paused && audio.currentTime === 0))
assert.strictEqual(confettiResetCalls, 1)
assert.strictEqual(WheelCanvasStub.instances[0].buttons[0].radius, '18%')
assert.strictEqual(WheelCanvasStub.instances[0].buttons[0].borderColor, '#ffffff')
assert.strictEqual(WheelCanvasStub.instances[0].buttons[0].fonts[0].fontSize, '4.444444%')
assert.strictEqual(homeSelectors['#pointer-border'].disabled, true)
assert.strictEqual(homeWheel.canvas.getAttribute('aria-disabled'), 'false')
homeSelectors['#pointer-color-source'].value = 'fixed'
homeSelectors['#pointer-color-source'].listeners.get('change')()
assert.strictEqual(WheelCanvasStub.instances[0].pointer.colorSource, 'fixed')
assert.strictEqual(pointerColorInput.disabled, true)
homeSelectors['#pointer-color-source'].value = 'currentPrize'
homeSelectors['#pointer-color-source'].listeners.get('change')()
assert.strictEqual(WheelCanvasStub.instances[0].pointer.colorSource, 'currentPrize')
homeSelectors['#pointer-wobble-amplitude'].value = '4'
homeSelectors['#pointer-wobble-amplitude'].listeners.get('input')()
assert.strictEqual(WheelCanvasStub.instances[0].pointer.wobble.amplitude, 4)
assert.strictEqual(homeSelectors['#pointer-wobble-amplitude-value'].textContent, '4°')
homeSelectors['#pointer-wobble'].checked = false
homeSelectors['#pointer-wobble'].listeners.get('change')()
assert.strictEqual(WheelCanvasStub.instances[0].pointer.wobble.enabled, false)
assert.strictEqual(homeSelectors['#pointer-wobble-duration'].disabled, true)
homeSelectors['#pointer-wobble'].checked = true
homeSelectors['#pointer-wobble'].listeners.get('change')()
pointerPresetSelect.value = 'minimal'
pointerPositionSelect.value = 'right'
pointerPositionSelect.listeners.get('change')()
assert.strictEqual(WheelCanvasStub.instances[0].pointer.type, 'external')
assert.strictEqual(WheelCanvasStub.instances[0].pointer.position, 'right')
assert.strictEqual(WheelCanvasStub.instances[0].pointer.preset, 'minimal')
pointerSizeInput.value = '120'
pointerSizeInput.listeners.get('input')()
assert.strictEqual(WheelCanvasStub.instances[0].pointer.width, '25.92px')
assert.strictEqual(WheelCanvasStub.instances[0].pointer.layout, 'stable')
assert.strictEqual(WheelCanvasStub.instances[0].pointer.space, '18px')
assert.strictEqual(pointerSizeValue.textContent, '120%')
homeSelectors['#pointer-radius'].value = '7'
homeSelectors['#pointer-radius'].listeners.get('input')()
assert.strictEqual(WheelCanvasStub.instances[0].pointer.cornerRadius, 7)
assert.strictEqual(homeSelectors['#pointer-radius-value'].textContent, '7px')
homeSelectors['#pointer-space'].value = '26'
homeSelectors['#pointer-space'].listeners.get('input')()
assert.strictEqual(WheelCanvasStub.instances[0].pointer.space, '26px')
homeSelectors['#pointer-layout'].value = 'overlay'
homeSelectors['#pointer-layout'].listeners.get('change')()
assert.strictEqual(WheelCanvasStub.instances[0].pointer.layout, 'overlay')
assert.strictEqual(WheelCanvasStub.instances[0].pointer.reserveSpace, false)
homeSelectors['#pointer-layout'].value = 'stable'
homeSelectors['#pointer-layout'].listeners.get('change')()
pointerInsetInput.value = '22'
pointerInsetInput.listeners.get('input')()
assert.strictEqual(WheelCanvasStub.instances[0].pointer.tipInset, 22)
assert.strictEqual(pointerInsetValue.textContent, '22px')
pointerColorInput.value = '#0f766e'
const customPointerRenderer = () => {}
WheelCanvasStub.instances[0].pointer.body.opacity = 0.35
WheelCanvasStub.instances[0].pointer.shadow = { color: '#000000', blur: 4 }
WheelCanvasStub.instances[0].pointer.renderer = customPointerRenderer
WheelCanvasStub.instances[0].pointer.width = '10%'
WheelCanvasStub.instances[0].pointer.height = '20%'
WheelCanvasStub.instances[0].pointer.tipInset = '6%'
WheelCanvasStub.instances[0].pointer.tangentOffset = '4%'
pointerColorInput.listeners.get('input')()
assert.strictEqual(WheelCanvasStub.instances[0].pointer.color, '#0f766e')
assert.strictEqual(WheelCanvasStub.instances[0].pointer.body.color, '#0f766e')
assert.strictEqual(WheelCanvasStub.instances[0].pointer.width, '10%')
assert.strictEqual(WheelCanvasStub.instances[0].pointer.height, '20%')
assert.strictEqual(WheelCanvasStub.instances[0].pointer.tipInset, '6%')
assert.strictEqual(WheelCanvasStub.instances[0].pointer.tangentOffset, '4%')
assert.strictEqual(WheelCanvasStub.instances[0].pointer.body.opacity, 0.35)
assert.deepStrictEqual(WheelCanvasStub.instances[0].pointer.shadow, {
    color: '#000000',
    blur: 4,
})
assert.strictEqual(WheelCanvasStub.instances[0].pointer.renderer, customPointerRenderer)
pointerPositionSelect.value = 'bottom'
pointerPositionSelect.listeners.get('change')()
assert.strictEqual(WheelCanvasStub.instances[0].pointer.position, 'bottom')
assert.strictEqual(WheelCanvasStub.instances[0].pointer.width, '10%')
assert.strictEqual(WheelCanvasStub.instances[0].pointer.tipInset, '6%')
pointerPositionSelect.value = 'center'
pointerPresetSelect.value = 'arrow'
homeSelectors['#center-pointer-angle'].value = '90'
homeSelectors['#center-pointer-offset'].value = '8'
pointerPositionSelect.listeners.get('change')()
assert.strictEqual(WheelCanvasStub.instances[0].pointer.type, 'center')
assert.strictEqual(WheelCanvasStub.instances[0].pointer.preset, 'arrow')
assert.strictEqual(WheelCanvasStub.instances[0].pointer.angle, 90)
assert.strictEqual(WheelCanvasStub.instances[0].pointer.radialOffset, 8)
assert.strictEqual(WheelCanvasStub.instances[0].pointer.fused, true)
assert.strictEqual(WheelCanvasStub.instances[0].pointer.fusionStyle, 'adaptive')
assert.strictEqual(homeSelectors['#center-fusion-style'].value, 'adaptive')
homeSelectors['#center-fusion-style'].value = 'layered'
homeSelectors['#center-fusion-style'].listeners.get('change')()
assert.strictEqual(WheelCanvasStub.instances[0].pointer.fusionStyle, 'layered')
assert.strictEqual(homeSelectors['#pointer-border'].disabled, false)
homeSelectors['#center-pointer-fused'].checked = false
homeSelectors['#center-pointer-fused'].listeners.get('change')()
assert.strictEqual(WheelCanvasStub.instances[0].pointer.fused, false)
pointerPositionSelect.value = 'right'
pointerPresetSelect.value = 'minimal'
pointerPositionSelect.listeners.get('change')()
centerTextToggle.checked = false
centerTextToggle.listeners.get('change')()
assert.strictEqual(WheelCanvasStub.instances[0].buttons[0].textVisible, false)
centerSizeInput.value = '36'
centerSizeInput.listeners.get('input')()
assert.strictEqual(WheelCanvasStub.instances[0].buttons[0].radius, '36%')
centerBorderInput.value = '6'
centerBorderInput.listeners.get('input')()
assert.strictEqual(WheelCanvasStub.instances[0].buttons[0].borderWidth, 6)
WheelCanvasStub.instances[0].buttons[0].fonts = undefined
assert.doesNotThrow(() => homeSelectors['#center-label'].listeners.get('input')())
assert.strictEqual(WheelCanvasStub.instances[0].buttons[0].fonts[0].text, '开始')
physicsModeToggle.listeners.get('change')({ target: { checked: false } })
assert.strictEqual(WheelCanvasStub.instances[0].physics.enabled, false)
homeSelectors['#outer-width'].value = '22'
homeSelectors['#outer-width'].listeners.get('input')()
assert.strictEqual(WheelCanvasStub.instances[0].blocks[0].padding, '22px')
WheelCanvasStub.instances[0].width = '80%'
WheelCanvasStub.instances[0].height = '60%'
homeSelectors['#outer-color'].value = '#112233'
homeSelectors['#outer-color'].listeners.get('input')()
assert.strictEqual(WheelCanvasStub.instances[0].width, '80%')
assert.strictEqual(WheelCanvasStub.instances[0].height, '60%')
const resizeCallsBeforeCanvasInput = WheelCanvasStub.instances[0].resizeCalls || 0
homeSelectors['#canvas-size'].value = '720'
homeSelectors['#canvas-size'].listeners.get('input')()
assert.strictEqual(WheelCanvasStub.instances[0].width, '80%')
assert.strictEqual(WheelCanvasStub.instances[0].resizeCalls || 0, resizeCallsBeforeCanvasInput)
assert.strictEqual(homeSelectors['#text-size-value'].textContent, '14px → 28px')
homeSelectors['#canvas-size'].listeners.get('change')()
assert.strictEqual(WheelCanvasStub.instances[0].width, '720px')
assert.strictEqual(WheelCanvasStub.instances[0].height, '720px')
assert.strictEqual(WheelCanvasStub.instances[0].resizeCalls, resizeCallsBeforeCanvasInput + 1)
assert.strictEqual(homeSelectors['#canvas-preview-size'].textContent, '720×720px · DPR 1')
homeSelectors['#text-size'].value = '18'
homeSelectors['#text-size'].listeners.get('input')()
assert.strictEqual(WheelCanvasStub.instances[0].defaultStyle.fontSize, '5%')
homeSelectors['#text-auto-scale'].checked = false
homeSelectors['#text-auto-scale'].listeners.get('change')()
assert.strictEqual(WheelCanvasStub.instances[0].defaultStyle.fontSize, '18px')
assert.strictEqual(WheelCanvasStub.instances[0].buttons[0].fonts[0].fontSize, '16px')
WheelCanvasStub.instances[0].defaultStyle.fontSize = '2rem'
homeSelectors['#text-color'].value = '#334455'
homeSelectors['#text-color'].listeners.get('input')()
assert.strictEqual(WheelCanvasStub.instances[0].defaultStyle.fontSize, '2rem')
homeSelectors['#text-orientation'].value = 'vertical'
WheelCanvasStub.instances[0].prizes[0].fonts[0].fontColor = '#123456'
homeSelectors['#text-orientation'].listeners.get('change')()
assert.strictEqual(WheelCanvasStub.instances[0].defaultStyle.orientation, 'vertical')
assert.strictEqual(WheelCanvasStub.instances[0].prizes[0].fonts[0].orientation, undefined)
assert.strictEqual(WheelCanvasStub.instances[0].prizes[0].fonts[0].fontColor, '#123456')
homeSelectors['#text-top'].value = '42'
homeSelectors['#text-top'].listeners.get('input')()
assert.strictEqual(WheelCanvasStub.instances[0].defaultStyle.top, '42%')
assert.strictEqual(WheelCanvasStub.instances[0].prizes[0].fonts[0].top, undefined)
homeSelectors['#text-left'].value = '-12'
homeSelectors['#text-left'].listeners.get('input')()
assert.strictEqual(WheelCanvasStub.instances[0].defaultStyle.left, '-12%')
homeSelectors['#text-align'].value = 'right'
homeSelectors['#text-align'].listeners.get('change')()
assert.strictEqual(WheelCanvasStub.instances[0].defaultStyle.textAlign, 'right')
WheelCanvasStub.instances[0].prizes[0].imgs = [
    { src: 'old.svg' },
    { src: 'overlay.svg', width: '12%' },
]
homeSelectors['#prize-content-mode'].value = 'both'
homeSelectors['#prize-content-mode'].listeners.get('change')()
assert.strictEqual(
    WheelCanvasStub.instances[0].prizes[0].imgs[0].src,
    './demo/assets/demo-gift.svg',
)
assert.strictEqual(WheelCanvasStub.instances[0].prizes[0].imgs[0].crossOrigin, 'anonymous')
assert.strictEqual(WheelCanvasStub.instances[0].prizes[0].imgs.length, 2)
assert.strictEqual(WheelCanvasStub.instances[0].prizes[0].imgs[1].src, 'overlay.svg')
homeSelectors['#prize-image-file'].files = [{ name: 'gift.png', type: 'image/png', size: 1024 }]
homeSelectors['#prize-image-file'].listeners
    .get('change')()
    .then(() => {
        assert.match(homeWheel.prizes[0].imgs[0].src, /^data:image\/png;base64,/)
    })
homeSelectors['#center-logo-visible'].checked = true
homeSelectors['#center-logo-visible'].listeners.get('change')()
assert.strictEqual(
    WheelCanvasStub.instances[0].buttons[0].imgs[0].src,
    './demo/assets/demo-spark.svg',
)
assert.strictEqual(WheelCanvasStub.instances[0].buttons[0].imgs[0].top, '-42%')
homeSelectors['#live-config-json'].value = JSON.stringify({
    blocks: [{ padding: '9px', background: '#112233' }],
    defaultConfig: { speed: 12 },
})
homeSelectors['#apply-live-config'].listeners
    .get('click')()
    .then(() => {
        assert.strictEqual(homeWheel.blocks[0].padding, '9px')
        assert.strictEqual(homeWheel.defaultConfig.speed, 12)
        homeWheel.defaultConfig.transientField = true
        return homeSelectors['#reset-live-config'].listeners.get('click')()
    })
    .then(() => {
        assert.strictEqual(homeWheel.defaultConfig.transientField, undefined)
        homeWheel.defaultConfig.speed = 77
        assert.strictEqual(homeContext.persistWorkbenchConfig(), true)
        assert.strictEqual(homeContext.storageValues.size, 1)
        const savedPayload = JSON.parse(Array.from(homeContext.storageValues.values())[0])
        assert.strictEqual(savedPayload.version, 1)
        assert.strictEqual(savedPayload.config.defaultConfig.speed, 77)
        homeWheel.defaultConfig.speed = 3
        return homeContext.initializeWorkbenchPersistence()
    })
    .then(() => {
        assert.strictEqual(homeWheel.defaultConfig.speed, 77)
        assert.strictEqual(homeSelectors['#config-storage-status'].textContent, '已恢复本地配置')
        return homeSelectors['#reset-workbench-config'].listeners.get('click')()
    })
    .then(() => {
        assert.strictEqual(homeWheel.defaultConfig.speed, 20)
        const resetPayload = JSON.parse(Array.from(homeContext.storageValues.values())[0])
        assert.strictEqual(resetPayload.config.defaultConfig.speed, 20)
        assert.strictEqual(homeSelectors['#config-storage-status'].textContent, '已保存到本地')
        const storageKey = Array.from(homeContext.storageValues.keys())[0]
        homeContext.storageValues.set(storageKey, '{invalid-json')
        return homeContext.initializeWorkbenchPersistence()
    })
    .then(() => {
        assert.strictEqual(homeContext.storageValues.size, 0)
        assert.strictEqual(
            homeSelectors['#config-storage-status'].textContent,
            '本地配置无效已忽略',
        )
    })

console.log('Standalone WheelCanvas homepage runtime test passed')
