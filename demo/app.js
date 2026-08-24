/* global WheelCanvasI18n, WheelCanvasJS */

const translateDemoText = value =>
    typeof WheelCanvasI18n === 'object' && WheelCanvasI18n.currentLocale === 'en'
        ? WheelCanvasI18n.translate(value)
        : value

const DEMO_THEME = Object.freeze({
    frame: '#f4efe4',
    frameInner: '#ffffff',
    center: '#6047dd',
    centerBorder: '#ffffff',
    text: '#2d2142',
    sectors: Object.freeze(['#f5f1ff', '#e9e3ff', '#fff4ea', '#fce8da', '#edf7f2', '#dff1e8']),
})

const prizes = [
    {
        range: 8,
        displayWeight: 1,
        background: DEMO_THEME.sectors[0],
        fonts: [{ text: translateDemoText('一等奖') }],
    },
    {
        range: 16,
        displayWeight: 2,
        background: DEMO_THEME.sectors[1],
        fonts: [{ text: translateDemoText('二等奖') }],
    },
    {
        range: 20,
        displayWeight: 1,
        background: DEMO_THEME.sectors[2],
        fonts: [{ text: translateDemoText('三等奖') }],
    },
    {
        range: 32,
        displayWeight: 3,
        background: DEMO_THEME.sectors[3],
        fonts: [{ text: translateDemoText('谢谢参与') }],
    },
    {
        range: 12,
        displayWeight: 1,
        background: DEMO_THEME.sectors[4],
        fonts: [{ text: translateDemoText('五等奖') }],
    },
    {
        range: 12,
        displayWeight: 2,
        background: DEMO_THEME.sectors[5],
        fonts: [{ text: translateDemoText('六等奖') }],
    },
]

const POINTER_REFERENCE_SIZE = 360
const CENTER_POINTER_PRESET_SIZES = Object.freeze({
    minimal: [58, 78],
    classic: [100, 108],
    flapper: [72, 122],
    wedge: [108, 86],
    needle: [18, 142],
    pin: [62, 126],
    glass: [72, 122],
    jewel: [76, 126],
    triangle: [88, 82],
    kite: [68, 126],
    arrow: [82, 128],
    chevron: [108, 88],
    diamond: [68, 128],
    notch: [102, 106],
    teardrop: [62, 128],
    spear: [38, 146],
    soft: [82, 88],
    tab: [90, 80],
    dart: [68, 132],
    shield: [88, 108],
    ribbon: [86, 122],
})
const EXTERNAL_POINTER_PRESET_SIZES = Object.freeze({
    minimal: [6, 5],
    classic: [7.5, 14.5],
    flapper: [6.5, 16],
    wedge: [10, 7.5],
    needle: [3.2, 14.5],
    pin: [7.5, 12.5],
    glass: [8.5, 13.5],
    jewel: [9, 13],
    triangle: [10, 7.5],
    kite: [8.5, 13.5],
    arrow: [8, 13],
    chevron: [10, 8],
    diamond: [8, 13],
    notch: [10, 9],
    teardrop: [7, 13],
    spear: [4.5, 15],
    soft: [8.5, 7.5],
    tab: [8.5, 6.5],
    dart: [6.5, 14],
    shield: [9, 11],
    ribbon: [8, 13],
})
const EXTERNAL_POINTER_MOUNT_RADII = Object.freeze({
    classic: 2.6,
    flapper: 3,
    needle: 2.2,
    pin: 2.6,
    glass: 2.8,
    jewel: 2.4,
})
const UI_SFX_VERSION = '0.4.0'
const UI_SFX_PACKS = new Set(['minimal', 'soft', 'glass', 'mechanical', 'arcade'])
const UI_SFX_BASE_URL = `https://cdn.jsdelivr.net/npm/uisfx@${UI_SFX_VERSION}/sounds`
const CONFETTI_VERSION = '1.9.4'
const CONFETTI_URL = `https://cdn.jsdelivr.net/npm/canvas-confetti@${CONFETTI_VERSION}/dist/confetti.browser.js`
const CONFETTI_INTEGRITY = 'sha384-bopE5cbMjKUprmGnIRk2UdvCnHImrRLCtNW2uR6oDYqO+o3XWJeuIrWWxDzeDgNW'
const MAX_EDITOR_PRIZES = 100
const MAX_EDITOR_IMAGE_BYTES = 2 * 1024 * 1024
const TYPOGRAPHY_REFERENCE_SIZE = 360
const WORKBENCH_STORAGE_KEY = 'wheel-canvas-js:workbench-config:v1'
const WORKBENCH_STORAGE_VERSION = 1
const WORKBENCH_STORAGE_DELAY = 180
const DEFAULT_EDITOR_IMAGE = Object.freeze({
    visible: true,
    width: '34%',
    top: '42%',
    left: '0%',
})
const customSelectInstances = new Map()
let activeCustomSelect = null
let customSelectSequence = 0
const soundPools = new Map()
let soundVoiceCursor = 0
let confettiLoadPromise = null
let workbenchPersistenceTimer = null
let workbenchPersistenceReady = false
let workbenchPersistenceSuspended = false

function selectElement(id) {
    return document.querySelector(`#${id}`)
}

function createControlMap(names) {
    return Object.fromEntries(
        names
            .trim()
            .split(/\s+/)
            .map(name => {
                const id =
                    name === 'liveConfig'
                        ? 'live-config-json'
                        : name.replace(/[A-Z]/g, character => `-${character.toLowerCase()}`)
                return [name, selectElement(id)]
            }),
    )
}

const resultElement = selectElement('result')
const spinAnnouncer = selectElement('spin-announcer')
const prizeListElement = selectElement('wheel-prize-list')
const graphicWeightToggle = selectElement('graphic-weight')
const pointerColorInput = selectElement('pointer-color')
const pointerColorSourceSelect = selectElement('pointer-color-source')
const pointerPositionSelect = selectElement('pointer-position')
const pointerPresetSelect = selectElement('pointer-preset')
const pointerSizeInput = selectElement('pointer-size')
const pointerSizeValue = selectElement('pointer-size-value')
const pointerInsetInput = selectElement('pointer-inset')
const pointerInsetValue = selectElement('pointer-inset-value')
const centerTextToggle = selectElement('center-text')
const centerSizeInput = selectElement('center-size')
const centerSizeValue = selectElement('center-size-value')
const centerBorderInput = selectElement('center-border')
const centerBorderValue = selectElement('center-border-value')
const physicsModeToggle = selectElement('physics-mode')
const playButton = selectElement('play')
const contentEditorDialog = selectElement('content-editor')
const contentEditorOpenButton = selectElement('content-editor-open')
const contentEditorCloseButton = selectElement('content-editor-close')
const contentEditorResetButton = selectElement('content-editor-reset')
const contentEditorAddButton = selectElement('content-editor-add')
const contentEditorList = selectElement('prize-editor-list')
const contentEditorStatus = selectElement('content-editor-status')
const tutorialDialog = selectElement('tutorial-dialog')
const tutorialOpenButton = selectElement('tutorial-open')
const tutorialCloseButton = selectElement('tutorial-close')
const resetWorkbenchConfigButton = selectElement('reset-workbench-config')
const configStorageStatus = selectElement('config-storage-status')
const controls = createControlMap(`
    pointerBorderColor pointerBorder pointerBorderValue pointerRadius pointerRadiusValue
    pointerWobble pointerWobbleAmplitude pointerWobbleAmplitudeValue pointerWobbleDuration
    pointerWobbleDurationValue pointerWobbleFrequency pointerWobbleFrequencyValue
    pointerWobbleDamping pointerWobbleDampingValue soundEnabled soundPack sectorSound resultSound
    soundVolume soundVolumeValue soundInterval soundIntervalValue previewSound celebrationEnabled
    celebrationStyle celebrationCount celebrationCountValue celebrationReducedMotion pointerOffset
    pointerOffsetValue pointerMount pointerLayout pointerSpace pointerSpaceValue centerPointerAngle
    centerPointerAngleValue centerPointerOffset centerPointerOffsetValue centerPointerFused
    centerFusionStyle outerColor outerWidth outerWidthValue innerColor innerWidth innerWidthValue
    sectorGutter sectorGutterValue sectorOffset sectorOffsetValue canvasSize canvasSizeValue
    canvasPreviewSize centerVisible centerLabel centerColor centerBorderColor centerAlign centerFontSize
    centerFontSizeValue prizeContentMode prizeImageUrl prizeImageFile prizeImageCrossOrigin
    prizeImageSize prizeImageSizeValue prizeImageTop prizeImageTopValue centerLogoVisible centerLogoUrl
    centerLogoFile centerLogoSize centerLogoSizeValue prizeTextVisible textWrap textAutoScale
    textOrientation textAlign textOverflow textColor textSize textSizeValue textLength textLengthValue
    textClamp textClampValue textTop textTopValue textLeft textLeftValue spinSpeed spinSpeedValue
    speedFunction acceleration accelerationValue deceleration decelerationValue stopRange
    stopRangeValue sensitivity sensitivityValue friction frictionValue drag dragValue physicsDirection
    maxDpr maxDprValue maxCanvasPixels imageConcurrency imageConcurrencyValue liveConfig
    applyLiveConfig resetLiveConfig copyLiveConfig
`)
const prefersReducedMotion =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

const wheelConfig = {
    width: '520px',
    height: '520px',
    ariaLabel: translateDemoText('抽奖转盘。奖项与中奖权重见页面辅助说明。'),
    blocks: [
        { padding: '4px', background: DEMO_THEME.frame },
        { padding: '4px', background: DEMO_THEME.frameInner },
    ],
    prizes,
    buttons: [
        {
            radius: '18%',
            background: DEMO_THEME.center,
            borderColor: DEMO_THEME.centerBorder,
            borderWidth: 3,
            shadowColor: 'transparent',
            shadowBlur: 0,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            pointer: true,
            fonts: [
                {
                    text: translateDemoText('开始'),
                    fontColor: '#fff',
                    fontSize: '4.444444%',
                    fontWeight: '750',
                    verticalAlign: 'middle',
                },
            ],
        },
    ],
    pointer: createCenterPointer('minimal', DEMO_THEME.center, 100, {
        angle: 0,
        borderColor: DEMO_THEME.centerBorder,
        borderWidth: 2,
        colorSource: 'currentPrize',
        fused: true,
        fusionStyle: 'droplet',
        wobble: {
            enabled: true,
            amplitude: 2.5,
            duration: 180,
            frequency: 14,
            damping: 12,
            respectReducedMotion: true,
        },
    }),
    defaultStyle: {
        fontColor: DEMO_THEME.text,
        fontSize: '3.888889%',
        fontWeight: '600',
        wordWrap: true,
        lengthLimit: '90%',
        lineClamp: 2,
        textOverflow: 'ellipsis',
        orientation: 'horizontal',
        top: '18%',
        left: '0%',
        textAlign: 'center',
    },
    defaultConfig: {
        speed: 20,
        accelerationTime: prefersReducedMotion ? 120 : 800,
        decelerationTime: prefersReducedMotion ? 360 : 2500,
        stopRange: 0.7,
        gutter: '4px',
        offsetDegree: -30,
        useGraphicWeight: false,
        graphicWeightSource: 'displayWeight',
        maxDpr: 3,
        maxCanvasPixels: 16777216,
        imageConcurrency: 6,
    },
    physics: {
        enabled: true,
        sensitivity: 1,
        innerRadius: '8%',
        minVelocity: 36,
        maxVelocity: 1800,
        friction: 24,
        drag: 0.68,
        stopVelocity: 3,
        resultMode: 'natural',
        onStart(_detail) {
            setControlsDisabled(true)
            setSpinMessage('拖动中：释放越快，旋转越快')
        },
        onRelease(detail) {
            setSpinMessage(`释放速度：${Math.round(detail.speed)}°/s，正在自然减速……`)
        },
        onCancel() {
            setControlsDisabled(false)
            setSpinMessage('滑动已取消，可以重新操作')
        },
    },
    feedback: {
        sound: {
            enabled: true,
            pack: 'mechanical',
            sectorCue: 'snap',
            resultCue: 'reward',
            volume: 0.3,
            minInterval: 35,
            play: playWheelSound,
        },
        celebration: {
            enabled: true,
            style: 'subtle',
            particleCount: 48,
            disableForReducedMotion: true,
            fire: fireWheelCelebration,
        },
    },
    async start() {
        await startDraw()
    },
    afterResize() {
        updateCanvasPreviewMetrics(this.boxWidth, this.boxHeight, this.dpr)
    },
    end(prize) {
        setControlsDisabled(false)
        setSpinMessage(`结果：${getPrizeLabel(prize)}`)
    },
    error(error) {
        setControlsDisabled(false)
        setSpinMessage(`抽奖失败：${error.message || error}`)
    },
}

function getPrizeLabel(prize) {
    const font =
        prize && Array.isArray(prize.fonts) ? prize.fonts.find(item => item.text != null) : null
    if (font) return String(font.text)
    if (prize && prize.name != null) return String(prize.name)
    if (prize && prize.label != null) return String(prize.label)
    return translateDemoText('未命名奖品')
}

function playWheelSound(cue, detail, config = {}) {
    if (config.enabled !== true || typeof window === 'undefined') return
    const AudioConstructor = window.Audio
    if (typeof AudioConstructor !== 'function' || document.hidden) return
    const pack = UI_SFX_PACKS.has(config.pack) ? config.pack : 'mechanical'
    const safeCue = /^[a-z0-9-]+$/.test(String(cue)) ? String(cue) : 'snap'
    const poolKey = `${pack}/${safeCue}`
    let pool = soundPools.get(poolKey)
    if (!pool) {
        pool = Array.from({ length: safeCue === config.sectorCue ? 4 : 2 }, () => {
            const audio = new AudioConstructor(`${UI_SFX_BASE_URL}/${pack}/${safeCue}.mp3`)
            audio.preload = 'auto'
            return audio
        })
        soundPools.set(poolKey, pool)
    }
    const available = pool.find(audio => audio.paused || audio.ended)
    const audio = available || pool[soundVoiceCursor++ % pool.length]
    try {
        audio.pause()
        audio.currentTime = 0
        audio.volume = Math.max(0, Math.min(1, Number(config.volume) || 0))
        const velocity = Math.abs(Number(detail && detail.angularVelocity) || 0)
        audio.playbackRate =
            detail && detail.type === 'sector' ? 0.9 + Math.min(0.35, velocity / 4800) : 1
        const playback = audio.play()
        if (playback && typeof playback.catch === 'function') playback.catch(() => {})
    } catch (_error) {
        // Sound is optional; autoplay policies or network failures must never interrupt a spin.
    }
}

async function fireWheelCelebration(style, detail, config = {}) {
    if (config.enabled !== true || typeof window === 'undefined') return
    if (
        config.disableForReducedMotion !== false &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
        return
    }
    let confetti = window.confetti
    if (typeof confetti !== 'function') {
        try {
            confetti = await loadConfetti()
        } catch (_error) {
            return
        }
    }
    const rect =
        wheel.canvas && typeof wheel.canvas.getBoundingClientRect === 'function'
            ? wheel.canvas.getBoundingClientRect()
            : null
    const viewportWidth = Math.max(
        1,
        window.innerWidth || document.documentElement.clientWidth || 1,
    )
    const viewportHeight = Math.max(
        1,
        window.innerHeight || document.documentElement.clientHeight || 1,
    )
    const origin = rect
        ? {
              x: Math.max(0, Math.min(1, (rect.left + rect.width / 2) / viewportWidth)),
              y: Math.max(0, Math.min(1, (rect.top + rect.height * 0.45) / viewportHeight)),
          }
        : { x: 0.5, y: 0.45 }
    const colors = (detail.colors || []).filter(color => /^#[\da-f]{3,8}$/i.test(color))
    const particleCount = Math.max(12, Math.min(180, Number(config.particleCount) || 48))
    const common = {
        origin,
        colors: colors.length ? colors : [...DEMO_THEME.sectors, DEMO_THEME.center],
        disableForReducedMotion: config.disableForReducedMotion !== false,
        zIndex: 1000,
    }
    try {
        if (style === 'stars') {
            confetti({
                ...common,
                particleCount,
                spread: 76,
                startVelocity: 30,
                ticks: 150,
                scalar: 1.05,
                shapes: ['star'],
            })
        } else if (style === 'burst') {
            confetti({
                ...common,
                particleCount,
                spread: 100,
                startVelocity: 38,
                gravity: 0.95,
                ticks: 180,
            })
        } else {
            confetti({
                ...common,
                particleCount: Math.min(particleCount, 64),
                spread: 62,
                startVelocity: 26,
                gravity: 0.9,
                decay: 0.93,
                ticks: 125,
                scalar: 0.82,
            })
        }
    } catch (_error) {
        // Celebration is decorative and cannot be allowed to affect the result lifecycle.
    }
}

function loadConfetti() {
    if (typeof window.confetti === 'function') return Promise.resolve(window.confetti)
    if (confettiLoadPromise) return confettiLoadPromise
    confettiLoadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script')
        script.src = CONFETTI_URL
        script.integrity = CONFETTI_INTEGRITY
        script.crossOrigin = 'anonymous'
        script.dataset.wheelCanvasFeedback = 'confetti'
        script.addEventListener('load', () => {
            if (typeof window.confetti === 'function') {
                resolve(window.confetti)
            } else {
                reject(new Error('canvas-confetti did not expose its browser API'))
            }
        })
        script.addEventListener('error', () => {
            reject(new Error('canvas-confetti could not be loaded'))
        })
        ;(document.head || document.body).appendChild(script)
    }).catch(error => {
        confettiLoadPromise = null
        throw error
    })
    return confettiLoadPromise
}

const wheel = new WheelCanvasJS.WheelCanvas('#wheel-canvas', wheelConfig)
const defaultSerializableConfig = cloneSerializable(getSerializableWheelConfig())
if (wheel.canvas) {
    wheel.canvas.setAttribute('aria-describedby', 'wheel-instructions wheel-prize-list')
}
window.addEventListener('pagehide', handlePageHide)
setControlsDisabled(false)
syncControlsFromWheel()
syncJsonEditor()
void initializeWorkbenchPersistence()

function handlePageHide() {
    flushWorkbenchPersistence()
    releaseOptionalFeedback()
}

function releaseOptionalFeedback() {
    soundPools.forEach(releaseAudioPool)
    soundPools.clear()
    if (window.confetti && typeof window.confetti.reset === 'function') {
        window.confetti.reset()
    }
}

function releaseAudioPool(pool) {
    pool.forEach(audio => {
        try {
            audio.pause()
            audio.currentTime = 0
        } catch (_error) {
            // Optional audio may already be detached or unavailable.
        }
    })
}

async function startDraw() {
    if (wheel.isRunning()) return
    if (!wheel.prizes.length) {
        setSpinMessage('请至少配置一个奖品后再开始')
        return
    }
    setSpinMessage('正在等待抽奖结果……')
    setControlsDisabled(true)
    wheel.play()

    try {
        wheel.stop(await requestPrizeIndex())
    } catch (error) {
        wheel.stop(-1)
        setControlsDisabled(false)
        setSpinMessage(`抽奖失败：${error.message || error}`)
    }
}

function setSpinMessage(message) {
    resultElement.textContent = message
    if (spinAnnouncer) spinAnnouncer.textContent = message
}

function setControlsDisabled(disabled) {
    if (wheel.canvas) {
        wheel.canvas.setAttribute('aria-busy', String(disabled))
        wheel.canvas.setAttribute('aria-disabled', String(disabled))
    }
    playButton.disabled = disabled
    if (resetWorkbenchConfigButton) resetWorkbenchConfigButton.disabled = disabled
    if (disabled && contentEditorDialog.open) closeContentEditor()
    contentEditorOpenButton.disabled = disabled
    document
        .querySelectorAll(
            '.demo-control-panel input, .demo-control-panel select, .demo-control-panel textarea, .demo-control-panel button',
        )
        .forEach(control => {
            control.disabled = disabled
        })
    const centerPointer = pointerPositionSelect.value === 'center'
    const hiddenPointer = pointerPositionSelect.value === 'none'
    const fusedCenterPointer = centerPointer && controls.centerPointerFused.checked
    const unifiedFusion = fusedCenterPointer && controls.centerFusionStyle.value !== 'layered'
    ;[
        pointerInsetInput,
        controls.pointerOffset,
        controls.pointerMount,
        controls.pointerLayout,
    ].forEach(control => {
        control.disabled = disabled || centerPointer || hiddenPointer
    })
    controls.pointerSpace.disabled =
        disabled || centerPointer || hiddenPointer || controls.pointerLayout.value !== 'stable'
    ;[
        controls.centerPointerAngle,
        controls.centerPointerOffset,
        controls.centerPointerFused,
        controls.centerFusionStyle,
    ].forEach(control => {
        control.disabled =
            disabled ||
            !centerPointer ||
            hiddenPointer ||
            (control === controls.centerFusionStyle && !controls.centerPointerFused.checked)
    })
    ;[
        pointerColorInput,
        pointerPresetSelect,
        pointerSizeInput,
        controls.pointerBorderColor,
        controls.pointerBorder,
    ].forEach(control => {
        const inheritedColorControl =
            control === pointerColorInput || control === controls.pointerBorderColor
        control.disabled =
            disabled ||
            hiddenPointer ||
            (fusedCenterPointer && inheritedColorControl) ||
            (unifiedFusion && control === controls.pointerBorder)
    })
    controls.prizeTextVisible.disabled = disabled || controls.prizeContentMode.value === 'image'
    if (!disabled) syncFeedbackControlState()
    refreshCustomSelects()
}

function requestPrizeIndex() {
    return new Promise(resolve => {
        setTimeout(() => {
            const currentPrizes = wheel.prizes
            if (!currentPrizes.length) {
                resolve(-1)
                return
            }
            const weights = currentPrizes.map(prize => {
                const weight = Number(prize.range)
                return Number.isFinite(weight) && weight > 0 ? weight : 0
            })
            const maximumWeight = weights.reduce((maximum, weight) => Math.max(maximum, weight), 0)
            const normalizedWeights = maximumWeight
                ? weights.map(weight => weight / maximumWeight)
                : weights
            const total = normalizedWeights.reduce((sum, weight) => sum + weight, 0)
            if (!(total > 0)) {
                resolve(Math.floor(Math.random() * currentPrizes.length))
                return
            }
            let cursor = Math.random() * total
            let lastPositiveIndex = 0
            for (let index = 0; index < normalizedWeights.length; index += 1) {
                const weight = normalizedWeights[index]
                if (!(weight > 0)) continue
                lastPositiveIndex = index
                if (cursor < weight) {
                    resolve(index)
                    return
                }
                cursor -= weight
            }
            resolve(lastPositiveIndex)
        }, 800)
    })
}

playButton.addEventListener('click', startDraw)

function openContentEditor() {
    if (wheel.isRunning()) return
    renderContentEditor()
    if (typeof contentEditorDialog.showModal === 'function') {
        contentEditorDialog.showModal()
    } else {
        contentEditorDialog.setAttribute('open', '')
        contentEditorDialog.open = true
    }
    contentEditorCloseButton.focus()
}

function closeContentEditor() {
    if (typeof contentEditorDialog.close === 'function' && contentEditorDialog.open) {
        contentEditorDialog.close()
    } else {
        contentEditorDialog.removeAttribute('open')
        contentEditorDialog.open = false
    }
    contentEditorOpenButton.focus()
}

function openTutorial() {
    if (contentEditorDialog.open) closeContentEditor()
    if (typeof tutorialDialog.showModal === 'function') {
        tutorialDialog.showModal()
    } else {
        tutorialDialog.setAttribute('open', '')
        tutorialDialog.open = true
    }
    const content = tutorialDialog.querySelector('.tutorial-content')
    if (content) content.scrollTop = 0
    tutorialCloseButton.focus()
}

function closeTutorial() {
    if (typeof tutorialDialog.close === 'function' && tutorialDialog.open) {
        tutorialDialog.close()
    } else {
        tutorialDialog.removeAttribute('open')
        tutorialDialog.open = false
    }
    tutorialOpenButton.focus()
}

function normalizeCodeSample(source) {
    const lines = source.replace(/\r\n?/g, '\n').split('\n')
    while (lines.length && !lines[0].trim()) lines.shift()
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop()

    const contentLines = lines.filter(line => line.trim())
    const commonIndent = contentLines.reduce((minimum, line) => {
        const indent = line.match(/^\s*/)[0].length
        return Math.min(minimum, indent)
    }, Number.POSITIVE_INFINITY)

    if (!Number.isFinite(commonIndent)) return ''
    return lines.map(line => line.slice(commonIndent)).join('\n')
}

function normalizeTutorialCodeSamples() {
    document.querySelectorAll('.tutorial-code-block code').forEach(code => {
        code.textContent = normalizeCodeSample(code.textContent)
    })
}

async function copyTutorialCode(button) {
    const block = button.closest('.tutorial-code-block')
    const code = block && block.querySelector('code')
    if (!code) return

    const source = code.textContent
    let copied
    try {
        if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') {
            throw new Error('Clipboard API is unavailable')
        }
        await navigator.clipboard.writeText(source)
        copied = true
    } catch {
        const temporary = document.createElement('textarea')
        temporary.value = source
        temporary.setAttribute('readonly', '')
        temporary.style.position = 'fixed'
        temporary.style.opacity = '0'
        document.body.appendChild(temporary)
        temporary.select()
        copied = typeof document.execCommand === 'function' && document.execCommand('copy')
        temporary.remove()
    }

    const originalLabel = button.dataset.originalLabel || button.textContent
    button.dataset.originalLabel = originalLabel
    button.textContent = copied ? '已复制' : '请手动复制'
    window.setTimeout(() => {
        button.textContent = originalLabel
    }, 1400)
}

function clearContentEditorList() {
    if (typeof contentEditorList.replaceChildren === 'function') {
        contentEditorList.replaceChildren()
        return
    }
    contentEditorList.textContent = ''
    if (Array.isArray(contentEditorList.children)) contentEditorList.children.length = 0
}

function renderContentEditor() {
    clearContentEditorList()
    wheel.prizes.forEach((prize, index) => {
        const row = document.createElement('article')
        row.className = 'prize-editor-row'

        const rowIndex = document.createElement('span')
        rowIndex.className = 'prize-editor-index'
        rowIndex.textContent = String(index + 1).padStart(2, '0')
        row.appendChild(rowIndex)

        row.appendChild(
            createPrizeEditorField('奖项名称', 'text', getPrizeLabel(prize), 'text', index),
        )
        row.appendChild(
            createPrizeEditorField(
                '颜色',
                'color',
                getEditablePrizeColor(prize.background, index),
                'background',
                index,
            ),
        )
        row.appendChild(
            createPrizeEditorField(
                '文字颜色',
                'color',
                getEditablePrizeTextColor(prize),
                'fontColor',
                index,
            ),
        )
        row.appendChild(
            createPrizeEditorField('中奖权重', 'number', prize.range ?? 1, 'range', index),
        )
        row.appendChild(
            createPrizeEditorField(
                '图形权重',
                'number',
                prize.displayWeight ?? 1,
                'displayWeight',
                index,
            ),
        )

        const removeButton = document.createElement('button')
        removeButton.className = 'prize-editor-remove'
        removeButton.type = 'button'
        removeButton.textContent = '×'
        removeButton.disabled = wheel.prizes.length <= 1
        removeButton.setAttribute('aria-label', `删除第 ${index + 1} 个奖项`)
        removeButton.addEventListener('click', () => removePrizeFromEditor(index))
        row.appendChild(removeButton)
        row.appendChild(createPrizeImageEditor(prize, index))
        contentEditorList.appendChild(row)
    })
}

function createPrizeEditorField(labelText, type, value, field, index) {
    const label = document.createElement('label')
    label.className = 'prize-editor-field'
    label.dataset.field = field

    const labelName = document.createElement('span')
    labelName.textContent = labelText
    label.appendChild(labelName)

    const input = document.createElement('input')
    input.type = type
    input.value = String(value)
    input.setAttribute('aria-label', `第 ${index + 1} 个奖项${labelText}`)
    if (type === 'text') {
        input.maxLength = 80
    } else if (type === 'number') {
        input.min = '0'
        input.max = '1000000'
        input.step = '0.1'
        input.inputMode = 'decimal'
    }
    input.addEventListener('input', () => updatePrizeFromEditor(index, field, input.value))
    label.appendChild(input)
    return label
}

function getEditablePrizeColor(value, index) {
    return /^#[0-9a-f]{6}$/i.test(String(value))
        ? String(value)
        : DEMO_THEME.sectors[index % DEMO_THEME.sectors.length]
}

function getEditablePrizeTextColor(prize) {
    const value = prize.fonts && prize.fonts[0] && prize.fonts[0].fontColor
    if (/^#[0-9a-f]{6}$/i.test(String(value))) return String(value)
    const fallback = wheel.defaultStyle && wheel.defaultStyle.fontColor
    return /^#[0-9a-f]{6}$/i.test(String(fallback)) ? String(fallback) : DEMO_THEME.text
}

function createPrizeImageEditor(prize, index) {
    const details = document.createElement('details')
    details.className = 'prize-editor-media'

    const summary = document.createElement('summary')
    summary.className = 'prize-editor-media-summary'
    const thumbnail = document.createElement('span')
    thumbnail.className = 'prize-editor-media-thumbnail'
    thumbnail.setAttribute('aria-hidden', 'true')
    const summaryCopy = document.createElement('span')
    summaryCopy.className = 'prize-editor-media-copy'
    const summaryTitle = document.createElement('strong')
    summaryTitle.textContent = '奖项图片'
    const summaryState = document.createElement('small')
    summaryCopy.appendChild(summaryTitle)
    summaryCopy.appendChild(summaryState)
    summary.appendChild(thumbnail)
    summary.appendChild(summaryCopy)
    details.appendChild(summary)

    const fields = document.createElement('div')
    fields.className = 'prize-editor-media-fields'
    const visibleField = createPrizeImageToggle(index)
    const sourceField = createPrizeImageSourceField(index)
    const uploadField = createPrizeImageUploadField(index)
    const widthField = createPrizeImageNumberField('宽度', 'width', index, 10, 100)
    const topField = createPrizeImageNumberField('上下位置', 'top', index, 0, 100)
    const leftField = createPrizeImageNumberField('左右偏移', 'left', index, -100, 100)
    const clearButton = document.createElement('button')
    clearButton.className = 'prize-editor-image-clear'
    clearButton.type = 'button'
    clearButton.textContent = '清除图片'
    clearButton.addEventListener('click', () => {
        clearPrimaryPrizeImage(index)
        syncPrizeImageEditor(editor)
    })

    ;[
        visibleField.label,
        sourceField.label,
        uploadField.label,
        widthField.label,
        topField.label,
        leftField.label,
        clearButton,
    ].forEach(element => fields.appendChild(element))
    details.appendChild(fields)

    const editor = {
        details,
        thumbnail,
        summaryState,
        visibleInput: visibleField.input,
        sourceInput: sourceField.input,
        uploadInput: uploadField.input,
        widthInput: widthField.input,
        topInput: topField.input,
        leftInput: leftField.input,
        clearButton,
        index,
    }

    visibleField.input.addEventListener('change', () => {
        const image = getPrimaryPrizeImage(wheel.prizes[index])
        if (!image || !String(image.src || '').trim()) {
            visibleField.input.checked = false
            contentEditorStatus.textContent = `请先为第 ${index + 1} 个奖项设置图片地址或上传图片`
            return
        }
        setPrimaryPrizeImage(index, { visible: visibleField.input.checked })
        syncPrizeImageEditor(editor)
    })
    sourceField.input.addEventListener('change', () => {
        const source = sourceField.input.value.trim()
        if (!source) {
            clearPrimaryPrizeImage(index)
        } else {
            setPrimaryPrizeImage(index, {
                src: source,
                visible: true,
                crossOrigin: /^(?:https?:)?\/\//i.test(source) ? 'anonymous' : undefined,
            })
        }
        syncPrizeImageEditor(editor)
    })
    uploadField.input.addEventListener('change', async () => {
        const file = uploadField.input.files && uploadField.input.files[0]
        if (!file) return
        const targetPrize = wheel.prizes[index]
        if (!String(file.type || '').startsWith('image/')) {
            contentEditorStatus.textContent = '请选择有效的图片文件'
            uploadField.input.value = ''
            return
        }
        if (Number(file.size || 0) > MAX_EDITOR_IMAGE_BYTES) {
            contentEditorStatus.textContent = '单张图片不能超过 2MB，建议压缩后再上传'
            uploadField.input.value = ''
            return
        }
        try {
            const source = await readFileAsDataUrl(file)
            if (wheel.prizes[index] !== targetPrize || wheel.isRunning()) {
                contentEditorStatus.textContent = '转盘状态已变化，本次图片上传未应用'
                return
            }
            setPrimaryPrizeImage(index, { src: source, visible: true, crossOrigin: undefined })
            syncPrizeImageEditor(editor)
        } catch (error) {
            contentEditorStatus.textContent = `图片读取失败：${error.message || error}`
        } finally {
            uploadField.input.value = ''
        }
    })
    ;[widthField, topField, leftField].forEach(field => {
        field.input.addEventListener('input', () => {
            if (!field.input.value.trim()) return
            const minimum = Number(field.input.min)
            const maximum = Number(field.input.max)
            const value = Math.min(maximum, Math.max(minimum, Number(field.input.value)))
            if (!Number.isFinite(value)) return
            field.input.value = String(value)
            setPrimaryPrizeImage(index, { [field.field]: `${value}%` })
            syncPrizeImageEditor(editor, false)
        })
    })

    syncPrizeImageEditor(editor)
    return details
}

function createPrizeImageToggle(index) {
    const label = document.createElement('label')
    label.className = 'prize-editor-image-toggle'
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('aria-label', `显示第 ${index + 1} 个奖项图片`)
    const text = document.createElement('span')
    text.textContent = '显示图片'
    label.appendChild(input)
    label.appendChild(text)
    return { label, input }
}

function createPrizeImageSourceField(index) {
    const label = document.createElement('label')
    label.className = 'prize-editor-image-field prize-editor-image-source'
    const text = document.createElement('span')
    text.textContent = '图片地址'
    const input = document.createElement('input')
    input.type = 'text'
    input.placeholder = 'https://example.com/prize.png 或 ./prize.png'
    input.inputMode = 'url'
    input.setAttribute('aria-label', `第 ${index + 1} 个奖项图片地址`)
    label.appendChild(text)
    label.appendChild(input)
    return { label, input }
}

function createPrizeImageUploadField(index) {
    const label = document.createElement('label')
    label.className = 'prize-editor-image-field prize-editor-image-upload'
    const text = document.createElement('span')
    text.textContent = '本地上传 · 最大 2MB'
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.setAttribute('aria-label', `上传第 ${index + 1} 个奖项图片`)
    label.appendChild(text)
    label.appendChild(input)
    return { label, input }
}

function createPrizeImageNumberField(labelText, field, index, minimum, maximum) {
    const label = document.createElement('label')
    label.className = 'prize-editor-image-field'
    const text = document.createElement('span')
    text.textContent = `${labelText}（%）`
    const input = document.createElement('input')
    input.type = 'number'
    input.min = String(minimum)
    input.max = String(maximum)
    input.step = '1'
    input.inputMode = 'decimal'
    input.setAttribute('aria-label', `第 ${index + 1} 个奖项图片${labelText}`)
    label.appendChild(text)
    label.appendChild(input)
    return { label, input, field }
}

function getPrimaryPrizeImage(prize) {
    return prize && Array.isArray(prize.imgs) && prize.imgs[0] && typeof prize.imgs[0] === 'object'
        ? prize.imgs[0]
        : null
}

function getImagePercent(value, fallback) {
    const numericValue = Number.parseFloat(String(value ?? ''))
    return Number.isFinite(numericValue) ? numericValue : fallback
}

function setPrimaryPrizeImage(index, patch) {
    const prize = wheel.prizes[index]
    if (!prize) return false
    const images = Array.isArray(prize.imgs) ? [...prize.imgs] : []
    const current = getPrimaryPrizeImage(prize)
    const next = {
        ...DEFAULT_EDITOR_IMAGE,
        ...(current || {}),
        ...patch,
    }
    images[0] = next
    prize.imgs = images
    contentEditorStatus.textContent = `第 ${index + 1} 个奖项图片已实时更新`
    resultElement.textContent = '转盘图片已实时更新'
    syncJsonEditor()
    return true
}

function clearPrimaryPrizeImage(index) {
    const prize = wheel.prizes[index]
    if (!prize || !Array.isArray(prize.imgs) || !prize.imgs.length) return
    prize.imgs = []
    contentEditorStatus.textContent = `第 ${index + 1} 个奖项的全部图片已清除`
    resultElement.textContent = '转盘图片已实时更新'
    syncJsonEditor()
}

function syncPrizeImageEditor(editor, syncSource = true) {
    const image = getPrimaryPrizeImage(wheel.prizes[editor.index])
    const source = image ? String(image.src || '').trim() : ''
    const visible = Boolean(source) && image.visible !== false
    editor.visibleInput.checked = visible
    editor.visibleInput.disabled = !source
    if (syncSource) editor.sourceInput.value = source
    editor.widthInput.value = String(getImagePercent(image && image.width, 34))
    editor.topInput.value = String(getImagePercent(image && image.top, 42))
    editor.leftInput.value = String(getImagePercent(image && image.left, 0))
    editor.clearButton.disabled = !source
    editor.summaryState.textContent = source ? (visible ? '已显示' : '已隐藏') : '未设置'
    editor.thumbnail.replaceChildren()
    if (source) {
        const preview = document.createElement('img')
        preview.src = source
        preview.alt = ''
        preview.loading = 'lazy'
        editor.thumbnail.appendChild(preview)
    } else {
        editor.thumbnail.textContent = 'IMG'
    }
}

function updatePrizeFromEditor(index, field, rawValue) {
    const prize = wheel.prizes[index]
    if (!prize) return

    if (field === 'text' || field === 'fontColor') {
        const fonts = Array.isArray(prize.fonts) ? [...prize.fonts] : []
        fonts[0] = {
            ...(fonts[0] || {}),
            [field === 'text' ? 'text' : 'fontColor']: rawValue,
        }
        prize.fonts = fonts
    } else if (field === 'background') {
        prize.background = rawValue
    } else {
        const numericValue = Number(rawValue)
        if (!Number.isFinite(numericValue) || numericValue < 0 || numericValue > 1000000) {
            contentEditorStatus.textContent = `${field === 'range' ? '中奖' : '图形'}权重必须在 0 到 1000000 之间`
            return
        }
        prize[field] = numericValue
    }

    contentEditorStatus.textContent = `第 ${index + 1} 个奖项已实时更新`
    resultElement.textContent = '转盘内容已实时更新'
    syncJsonEditor()
}

function addPrizeFromEditor() {
    if (wheel.prizes.length >= MAX_EDITOR_PRIZES) {
        contentEditorStatus.textContent = `内容编辑器最多支持 ${MAX_EDITOR_PRIZES} 个奖项`
        return
    }
    const index = wheel.prizes.length
    wheel.prizes.push({
        range: 1,
        displayWeight: 1,
        background: DEMO_THEME.sectors[index % DEMO_THEME.sectors.length],
        fonts: [
            {
                text: translateDemoText(`奖项 ${index + 1}`),
                fontColor: DEMO_THEME.text,
            },
        ],
    })
    renderContentEditor()
    syncJsonEditor()
    contentEditorStatus.textContent = `已添加第 ${index + 1} 个奖项`
    resultElement.textContent = '新奖项已添加到转盘'
}

function removePrizeFromEditor(index) {
    if (wheel.prizes.length <= 1) return
    wheel.prizes.splice(index, 1)
    renderContentEditor()
    syncJsonEditor()
    contentEditorStatus.textContent = `已删除第 ${index + 1} 个奖项`
    resultElement.textContent = '奖项已从转盘移除'
}

async function resetPrizesFromEditor() {
    await wheel.update({ prizes: cloneSerializable(defaultSerializableConfig.prizes) })
    renderContentEditor()
    syncControlsFromWheel()
    syncJsonEditor(true)
    contentEditorStatus.textContent = '默认奖项已恢复'
    resultElement.textContent = '已恢复默认奖项'
}

contentEditorOpenButton.addEventListener('click', openContentEditor)
contentEditorCloseButton.addEventListener('click', closeContentEditor)
contentEditorAddButton.addEventListener('click', addPrizeFromEditor)
contentEditorResetButton.addEventListener('click', () => {
    resetPrizesFromEditor().catch(error => {
        contentEditorStatus.textContent = `恢复失败：${error.message || error}`
    })
})
contentEditorDialog.addEventListener('click', event => {
    if (event.target === contentEditorDialog) closeContentEditor()
})
tutorialOpenButton.addEventListener('click', openTutorial)
tutorialCloseButton.addEventListener('click', closeTutorial)
tutorialDialog.addEventListener('click', event => {
    if (event.target === tutorialDialog) closeTutorial()
})
tutorialDialog.addEventListener('cancel', event => {
    event.preventDefault()
    closeTutorial()
})
normalizeTutorialCodeSamples()
document.querySelectorAll('[data-copy-code]').forEach(button => {
    button.addEventListener('click', () => {
        copyTutorialCode(button).catch(() => {
            button.textContent = '请手动复制'
        })
    })
})

graphicWeightToggle.addEventListener('change', event => {
    wheel.defaultConfig.useGraphicWeight = event.target.checked
    syncJsonEditor()
})

function applyPointerDemo(changedField = 'all') {
    const position = pointerPositionSelect.value
    const preset = pointerPresetSelect.value
    const color = pointerColorInput.value
    const colorSource = pointerColorSourceSelect.value
    const size = Number(pointerSizeInput.value)
    const inset = Number(pointerInsetInput.value)
    const borderColor = controls.pointerBorderColor.value
    const borderWidth = Number(controls.pointerBorder.value)
    const cornerRadius = Number(controls.pointerRadius.value)
    const wobble = {
        enabled: controls.pointerWobble.checked,
        amplitude: Number(controls.pointerWobbleAmplitude.value),
        duration: Number(controls.pointerWobbleDuration.value),
        frequency: Number(controls.pointerWobbleFrequency.value),
        damping: Number(controls.pointerWobbleDamping.value),
        respectReducedMotion: true,
    }
    const tangentOffset = Number(controls.pointerOffset.value)
    const centerAngle = Number(controls.centerPointerAngle.value)
    const centerOffset = Number(controls.centerPointerOffset.value)
    let fusionStyle = controls.centerFusionStyle.value
    const pointerLayout = controls.pointerLayout.value
    const pointerSpace = Number(controls.pointerSpace.value)
    const positionLabels = { top: '上方', right: '右侧', bottom: '下方', left: '左侧' }
    const presetLabels = {
        minimal: '极简箭头',
        classic: '经典拨片',
        flapper: '机械拨片',
        wedge: '简洁箭头',
        needle: '精细针尖',
        pin: '图钉',
        glass: '玻璃',
        jewel: '宝石',
        triangle: '三角',
        kite: '风筝',
        arrow: '长柄箭头',
        chevron: '折角箭头',
        diamond: '菱形指针',
        notch: '凹口箭头',
        teardrop: '水滴指针',
        spear: '矛尖指针',
        soft: '柔和箭头',
        tab: '圆角标签',
        dart: '飞镖箭头',
        shield: '盾形箭头',
        ribbon: '缎带箭头',
    }
    const centerPointer = position === 'center'
    const hiddenPointer = position === 'none'
    const fusedCenterPointer = centerPointer && controls.centerPointerFused.checked
    if (
        fusedCenterPointer &&
        preset !== 'minimal' &&
        fusionStyle === 'droplet' &&
        changedField !== 'fusionStyle'
    ) {
        fusionStyle = 'adaptive'
        controls.centerFusionStyle.value = fusionStyle
    }
    const unifiedFusion = fusedCenterPointer && fusionStyle !== 'layered'
    pointerInsetInput.disabled = centerPointer || hiddenPointer
    controls.pointerOffset.disabled = centerPointer || hiddenPointer
    controls.pointerMount.disabled = centerPointer || hiddenPointer
    controls.pointerLayout.disabled = centerPointer || hiddenPointer
    controls.pointerSpace.disabled = centerPointer || hiddenPointer || pointerLayout !== 'stable'
    controls.centerPointerAngle.disabled = !centerPointer || hiddenPointer
    controls.centerPointerOffset.disabled = !centerPointer || hiddenPointer
    controls.centerPointerFused.disabled = !centerPointer || hiddenPointer
    controls.centerFusionStyle.disabled =
        !centerPointer || hiddenPointer || !controls.centerPointerFused.checked
    pointerPresetSelect.disabled = hiddenPointer
    pointerSizeInput.disabled = hiddenPointer
    controls.pointerBorderColor.disabled = hiddenPointer || fusedCenterPointer
    controls.pointerBorder.disabled = hiddenPointer || unifiedFusion
    controls.pointerRadius.disabled = hiddenPointer
    pointerColorSourceSelect.disabled = hiddenPointer
    ;[
        controls.pointerWobbleAmplitude,
        controls.pointerWobbleDuration,
        controls.pointerWobbleFrequency,
        controls.pointerWobbleDamping,
    ].forEach(control => {
        control.disabled = hiddenPointer || !controls.pointerWobble.checked
    })
    controls.pointerWobble.disabled = hiddenPointer
    pointerColorInput.disabled =
        hiddenPointer || fusedCenterPointer || colorSource === 'currentPrize'
    pointerSizeValue.textContent = `${size}%`
    pointerInsetValue.textContent = `${inset}px`
    controls.pointerBorderValue.textContent = `${borderWidth}px`
    controls.pointerRadiusValue.textContent = `${cornerRadius}px`
    controls.pointerWobbleAmplitudeValue.textContent = `${wobble.amplitude}°`
    controls.pointerWobbleDurationValue.textContent = `${wobble.duration}ms`
    controls.pointerWobbleFrequencyValue.textContent = `${wobble.frequency}Hz`
    controls.pointerWobbleDampingValue.textContent = String(wobble.damping)
    controls.pointerOffsetValue.textContent = `${tangentOffset}px`
    controls.pointerSpaceValue.textContent = `${pointerSpace}px`
    controls.centerPointerAngleValue.textContent = `${centerAngle}°`
    controls.centerPointerOffsetValue.textContent = `${centerOffset}px`
    const nextPointer = hiddenPointer
        ? { type: 'none' }
        : centerPointer
          ? createCenterPointer(preset, color, size, {
                angle: centerAngle,
                borderColor,
                borderWidth,
                cornerRadius,
                colorSource,
                wobble,
                radialOffset: centerOffset,
                fused: controls.centerPointerFused.checked,
                fusionStyle,
            })
          : createExternalPointer(position, preset, color, size, inset, {
                borderColor,
                borderWidth,
                cornerRadius,
                colorSource,
                wobble,
                layout: pointerLayout,
                mount: controls.pointerMount.checked,
                space: pointerSpace,
                tangentOffset,
            })
    wheel.pointer = updatePointerFromControls(wheel.pointer, nextPointer, changedField)
    const colorSourceLabel = colorSource === 'currentPrize' ? '跟随扇区颜色' : '固定颜色'
    resultElement.textContent = hiddenPointer
        ? '指针已隐藏；中奖角度仍使用十二点方向计算'
        : centerPointer
          ? `已切换为可配置中心 · ${presetLabels[preset]}指针 · ${colorSourceLabel}`
          : `已切换为${positionLabels[position]} · ${presetLabels[preset]}指针 · ${colorSourceLabel}`
    syncJsonEditor()
}

function updatePointerFromControls(previous, next, changedField) {
    const rebuildsPointer = changedField === 'all' || changedField === 'preset'
    if (
        rebuildsPointer ||
        !previous ||
        typeof previous !== 'object' ||
        previous.type !== next.type
    ) {
        return preserveAdvancedPointerConfig(previous, next)
    }

    const updated = { ...previous }
    if (changedField === 'position') {
        updated.position = next.position
        delete updated.angle
        return updated
    }
    const fieldMap = {
        size: ['width', 'height', 'referenceSize'],
        inset: ['tipInset'],
        borderColor: ['borderColor'],
        borderWidth: ['borderWidth'],
        cornerRadius: ['cornerRadius'],
        tangentOffset: ['tangentOffset'],
        mount: ['mount'],
        layout: ['layout', 'reserveSpace', 'space'],
        space: ['space'],
        angle: ['angle'],
        radialOffset: ['radialOffset'],
        fused: ['fused', 'referenceSize'],
        fusionStyle: ['fusionStyle'],
        colorSource: ['colorSource'],
    }
    if (changedField === 'wobble') {
        const previousWobble =
            previous.wobble && typeof previous.wobble === 'object' ? previous.wobble : {}
        updated.wobble = { ...previousWobble, ...next.wobble }
        return updated
    }
    if (changedField === 'color') {
        updated.color = next.color
        if (previous.body && typeof previous.body === 'object') {
            updated.body = { ...previous.body }
            ;['color', 'gradient', 'shadeColor'].forEach(key => {
                if (next.body && Object.prototype.hasOwnProperty.call(next.body, key)) {
                    updated.body[key] = next.body[key]
                }
            })
        } else {
            updated.body = next.body
        }
        return updated
    }
    ;(fieldMap[changedField] || []).forEach(key => {
        updated[key] = next[key]
    })
    return updated
}

function preserveAdvancedPointerConfig(previous, next) {
    if (!previous || typeof previous !== 'object' || previous.type !== next.type) return next

    const merged = { ...previous, ...next }
    const baseline = createPointerBaseline(previous)
    ;['body', 'shadow'].forEach(key => {
        if (hasCustomPointerValue(previous[key], baseline && baseline[key])) {
            merged[key] = previous[key]
        }
    })
    if (next.mount !== false && hasCustomPointerValue(previous.mount, baseline && baseline.mount)) {
        merged.mount = previous.mount
    }
    if (typeof previous.renderer === 'function') merged.renderer = previous.renderer
    return merged
}

function createPointerBaseline(pointer) {
    const size = inferPointerSizePercent(pointer)
    if (pointer.type === 'center') {
        return createCenterPointer(
            pointer.preset || 'minimal',
            pointer.color || DEMO_THEME.center,
            size,
            {
                angle: pointer.angle,
                borderColor: pointer.borderColor,
                borderWidth: pointer.borderWidth,
                colorSource: pointer.colorSource,
                cornerRadius: pointer.cornerRadius,
                radialOffset: pointer.radialOffset,
                fused: pointer.fused !== false,
                fusionStyle: pointer.fusionStyle,
                wobble: pointer.wobble,
            },
        )
    }
    if (pointer.type !== 'external') return { type: pointer.type }
    return createExternalPointer(
        pointer.position || 'top',
        pointer.preset || 'minimal',
        pointer.color || DEMO_THEME.center,
        size,
        pointer.tipInset,
        {
            borderColor: pointer.borderColor,
            borderWidth: pointer.borderWidth,
            colorSource: pointer.colorSource,
            cornerRadius: pointer.cornerRadius,
            layout: pointer.layout,
            mount: Boolean(pointer.mount && pointer.mount.visible !== false),
            space: pointer.space,
            tangentOffset: pointer.tangentOffset,
            wobble: pointer.wobble,
        },
    )
}

function hasCustomPointerValue(value, baselineValue) {
    if (value === undefined) return false
    try {
        return JSON.stringify(value) !== JSON.stringify(baselineValue)
    } catch {
        return true
    }
}

pointerPositionSelect.addEventListener('change', () => applyPointerDemo('position'))
pointerPresetSelect.addEventListener('change', () => applyPointerDemo('preset'))
pointerColorInput.addEventListener('input', () => applyPointerDemo('color'))
pointerColorSourceSelect.addEventListener('change', () => applyPointerDemo('colorSource'))
pointerSizeInput.addEventListener('input', () => applyPointerDemo('size'))
pointerInsetInput.addEventListener('input', () => applyPointerDemo('inset'))
controls.pointerBorderColor.addEventListener('input', () => applyPointerDemo('borderColor'))
controls.pointerBorder.addEventListener('input', () => applyPointerDemo('borderWidth'))
controls.pointerRadius.addEventListener('input', () => applyPointerDemo('cornerRadius'))
controls.pointerOffset.addEventListener('input', () => applyPointerDemo('tangentOffset'))
controls.pointerMount.addEventListener('change', () => applyPointerDemo('mount'))
controls.pointerLayout.addEventListener('change', () => applyPointerDemo('layout'))
controls.pointerSpace.addEventListener('input', () => applyPointerDemo('space'))
controls.centerPointerAngle.addEventListener('input', () => applyPointerDemo('angle'))
controls.centerPointerOffset.addEventListener('input', () => applyPointerDemo('radialOffset'))
controls.centerPointerFused.addEventListener('change', () => applyPointerDemo('fused'))
controls.centerFusionStyle.addEventListener('change', () => applyPointerDemo('fusionStyle'))
controls.pointerWobble.addEventListener('change', () => applyPointerDemo('wobble'))
;[
    controls.pointerWobbleAmplitude,
    controls.pointerWobbleDuration,
    controls.pointerWobbleFrequency,
    controls.pointerWobbleDamping,
].forEach(control => control.addEventListener('input', () => applyPointerDemo('wobble')))

function applyCenterDemo(changedField = 'all') {
    const button =
        wheel.buttons[0] ||
        (wheel.buttons[0] = {
            radius: '18%',
            background: DEMO_THEME.center,
            borderColor: DEMO_THEME.centerBorder,
            borderWidth: 3,
            pointer: true,
            fonts: [
                {
                    text: translateDemoText('开始'),
                    fontColor: '#ffffff',
                    fontSize: formatResponsiveFontSize(16),
                    fontWeight: '750',
                    verticalAlign: 'middle',
                },
            ],
        })
    const size = Number(centerSizeInput.value)
    const borderWidth = Number(centerBorderInput.value)
    if (changedField === 'all' || changedField === 'size') button.radius = `${size}%`
    if (changedField === 'all' || changedField === 'borderWidth') {
        button.borderWidth = borderWidth
    }
    if (changedField === 'all' || changedField === 'textVisible') {
        button.textVisible = centerTextToggle.checked
    }
    if (changedField === 'all' || changedField === 'visible') {
        button.visible = controls.centerVisible.checked
    }
    if (changedField === 'all' || changedField === 'background') {
        button.background = controls.centerColor.value
    }
    if (changedField === 'all' || changedField === 'borderColor') {
        button.borderColor = controls.centerBorderColor.value
    }
    button.shadowColor = 'transparent'
    button.shadowBlur = 0
    button.shadowOffsetX = 0
    button.shadowOffsetY = 0
    const fonts = Array.isArray(button.fonts) ? button.fonts : (button.fonts = [])
    const font = fonts[0] || (fonts[0] = {})
    if (changedField === 'all' || changedField === 'text') {
        font.text = controls.centerLabel.value
    }
    if (changedField === 'all' || changedField === 'fontSize') {
        font.fontSize = formatResponsiveFontSize(Number(controls.centerFontSize.value))
    }
    if (changedField === 'all' || changedField === 'align') {
        font.verticalAlign = controls.centerAlign.value
    }
    centerSizeValue.textContent = `${size}%`
    centerBorderValue.textContent = `${borderWidth}px`
    updateTypographySizeOutputs()
    resultElement.textContent = centerTextToggle.checked
        ? '中心按钮样式已更新，文字保持垂直居中'
        : '中心文字已隐藏，按钮仍可点击'
    syncJsonEditor()
}

centerTextToggle.addEventListener('change', () => applyCenterDemo('textVisible'))
centerSizeInput.addEventListener('input', () => applyCenterDemo('size'))
centerBorderInput.addEventListener('input', () => applyCenterDemo('borderWidth'))
controls.centerVisible.addEventListener('change', () => applyCenterDemo('visible'))
controls.centerLabel.addEventListener('input', () => applyCenterDemo('text'))
controls.centerColor.addEventListener('input', () => applyCenterDemo('background'))
controls.centerBorderColor.addEventListener('input', () => applyCenterDemo('borderColor'))
controls.centerAlign.addEventListener('change', () => applyCenterDemo('align'))
controls.centerFontSize.addEventListener('input', () => applyCenterDemo('fontSize'))

function applyPrizeImageDemo() {
    const contentMode = controls.prizeContentMode.value
    const imageUrl = controls.prizeImageUrl.value.trim()
    const imageSize = Number(controls.prizeImageSize.value)
    const imageTop = Number(controls.prizeImageTop.value)
    const crossOrigin = controls.prizeImageCrossOrigin.value
    const showPrizeImage = contentMode !== 'text' && imageUrl !== ''
    const showPrizeText = contentMode !== 'image' && controls.prizeTextVisible.checked

    wheel.prizes.forEach(prize => {
        const images = Array.isArray(prize.imgs) ? prize.imgs : (prize.imgs = [])
        if (showPrizeImage) {
            const image = images[0] || (images[0] = { src: imageUrl })
            image.src = imageUrl
            image.width = `${imageSize}%`
            image.top = `${imageTop}%`
            image.visible = true
            if (crossOrigin) image.crossOrigin = crossOrigin
            else delete image.crossOrigin
        } else {
            images.forEach(image => {
                image.visible = false
            })
        }
        ;(prize.fonts || []).forEach(font => {
            font.visible = showPrizeText
        })
    })

    controls.prizeTextVisible.disabled = contentMode === 'image'
    controls.prizeImageSizeValue.textContent = `${imageSize}%`
    controls.prizeImageTopValue.textContent = `${imageTop}%`
    resultElement.textContent = showPrizeImage
        ? '批量奖品图片已更新，资源加载完成后会自动重绘'
        : '当前使用纯文字奖品内容'
    syncJsonEditor()
}

function applyCenterLogoDemo() {
    const centerLogoUrl = controls.centerLogoUrl.value.trim()
    const centerLogoSize = Number(controls.centerLogoSize.value)
    const button = wheel.buttons[0]
    if (button) {
        const images = Array.isArray(button.imgs) ? button.imgs : (button.imgs = [])
        if (controls.centerLogoVisible.checked && centerLogoUrl) {
            const image = images[0] || (images[0] = { src: centerLogoUrl })
            Object.assign(image, {
                src: centerLogoUrl,
                width: `${centerLogoSize}%`,
                height: `${centerLogoSize}%`,
                top: `${-centerLogoSize}%`,
                left: 0,
                visible: true,
            })
        } else {
            images.forEach(image => {
                image.visible = false
            })
        }
    }
    controls.centerLogoSizeValue.textContent = `${centerLogoSize}%`
    resultElement.textContent = controls.centerLogoVisible.checked
        ? '中心 Logo 已更新，奖品图片保持不变'
        : '中心 Logo 已隐藏，奖品图片保持不变'
    syncJsonEditor()
}

controls.prizeContentMode.addEventListener('change', () => {
    if (controls.prizeContentMode.value !== 'image') controls.prizeTextVisible.checked = true
    applyPrizeImageDemo()
})
controls.prizeImageUrl.addEventListener('change', applyPrizeImageDemo)
controls.prizeImageCrossOrigin.addEventListener('change', applyPrizeImageDemo)
controls.prizeImageSize.addEventListener('input', applyPrizeImageDemo)
controls.prizeImageTop.addEventListener('input', applyPrizeImageDemo)
controls.centerLogoVisible.addEventListener('change', applyCenterLogoDemo)
controls.centerLogoUrl.addEventListener('change', applyCenterLogoDemo)
controls.centerLogoSize.addEventListener('input', applyCenterLogoDemo)
bindImageUpload(controls.prizeImageFile, controls.prizeImageUrl, applyPrizeImageDemo)
bindImageUpload(controls.centerLogoFile, controls.centerLogoUrl, () => {
    controls.centerLogoVisible.checked = true
    applyCenterLogoDemo()
})

function bindImageUpload(input, urlInput, onLoaded) {
    let uploadGeneration = 0
    input.addEventListener('change', async () => {
        const file = input.files && input.files[0]
        if (!file) return
        const generation = ++uploadGeneration
        const targetPrizes = wheel.prizes
        const targetButtons = wheel.buttons
        if (!file.type || !file.type.startsWith('image/')) {
            input.value = ''
            resultElement.textContent = '请选择有效的图片文件'
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            input.value = ''
            resultElement.textContent = '图片不能超过 5 MiB'
            return
        }
        try {
            const source = await readFileAsDataUrl(file)
            if (
                generation !== uploadGeneration ||
                wheel.isRunning() ||
                wheel.prizes !== targetPrizes ||
                wheel.buttons !== targetButtons
            ) {
                resultElement.textContent = '转盘状态已变化，本次图片上传未应用'
                return
            }
            urlInput.value = source
            onLoaded()
        } catch (error) {
            resultElement.textContent = `图片读取失败：${error.message || error}`
        } finally {
            input.value = ''
        }
    })
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.addEventListener('load', () => resolve(String(reader.result || '')))
        reader.addEventListener('error', () => reject(reader.error || new Error('读取失败')))
        reader.readAsDataURL(file)
    })
}

physicsModeToggle.addEventListener('change', event => {
    wheel.physics.enabled = event.target.checked
    resultElement.textContent = event.target.checked
        ? '滑动物理已开启：按住扇区并快速甩动'
        : '滑动物理已关闭：点击中心开始'
    syncJsonEditor()
})

function applyFeedbackDemo(message = '声音与庆祝配置已更新') {
    Object.assign(wheel.feedback.sound, {
        enabled: controls.soundEnabled.checked,
        pack: controls.soundPack.value,
        sectorCue: controls.sectorSound.value,
        resultCue: controls.resultSound.value,
        volume: Number(controls.soundVolume.value),
        minInterval: Number(controls.soundInterval.value),
    })
    Object.assign(wheel.feedback.celebration, {
        enabled: controls.celebrationEnabled.checked,
        style: controls.celebrationStyle.value,
        particleCount: Number(controls.celebrationCount.value),
        disableForReducedMotion: controls.celebrationReducedMotion.checked,
    })
    const activeSoundPools = new Set([
        `${wheel.feedback.sound.pack}/${wheel.feedback.sound.sectorCue}`,
        `${wheel.feedback.sound.pack}/${wheel.feedback.sound.resultCue}`,
    ])
    soundPools.forEach((pool, key) => {
        if (activeSoundPools.has(key)) return
        releaseAudioPool(pool)
        soundPools.delete(key)
    })
    syncFeedbackControlState()
    updateControlOutputs()
    resultElement.textContent = message
    syncJsonEditor()
}

function syncFeedbackControlState() {
    const soundDisabled = !controls.soundEnabled.checked
    ;[
        controls.soundPack,
        controls.sectorSound,
        controls.resultSound,
        controls.soundVolume,
        controls.soundInterval,
        controls.previewSound,
    ].forEach(control => {
        control.disabled = soundDisabled
    })
    const celebrationDisabled = !controls.celebrationEnabled.checked
    ;[
        controls.celebrationStyle,
        controls.celebrationCount,
        controls.celebrationReducedMotion,
    ].forEach(control => {
        control.disabled = celebrationDisabled
    })
}

controls.soundEnabled.addEventListener('change', () => applyFeedbackDemo())
controls.soundPack.addEventListener('change', () => applyFeedbackDemo())
controls.sectorSound.addEventListener('change', () => applyFeedbackDemo())
controls.resultSound.addEventListener('change', () => applyFeedbackDemo())
controls.soundVolume.addEventListener('input', () => applyFeedbackDemo())
controls.soundInterval.addEventListener('input', () => applyFeedbackDemo())
controls.celebrationEnabled.addEventListener('change', () => applyFeedbackDemo())
controls.celebrationStyle.addEventListener('change', () => applyFeedbackDemo())
controls.celebrationCount.addEventListener('input', () => applyFeedbackDemo())
controls.celebrationReducedMotion.addEventListener('change', () => applyFeedbackDemo())
controls.previewSound.addEventListener('click', () => {
    applyFeedbackDemo('正在试听中奖声音')
    playWheelSound.call(
        wheel,
        wheel.feedback.sound.resultCue,
        { type: 'result', angularVelocity: 0 },
        wheel.feedback.sound,
    )
})

function applyFrameStyleDemo(changedField) {
    const outerWidth = Number(controls.outerWidth.value)
    const innerWidth = Number(controls.innerWidth.value)
    const gutter = Number(controls.sectorGutter.value)
    const offsetDegree = Number(controls.sectorOffset.value)
    const blocks = wheel.blocks

    const outer = blocks[0] || (blocks[0] = {})
    const inner = blocks[1] || (blocks[1] = {})
    if (changedField === 'outerColor') outer.background = controls.outerColor.value
    if (changedField === 'outerWidth') outer.padding = `${outerWidth}px`
    if (changedField === 'innerColor') inner.background = controls.innerColor.value
    if (changedField === 'innerWidth') inner.padding = `${innerWidth}px`
    if (changedField === 'gutter') wheel.defaultConfig.gutter = `${gutter}px`
    if (changedField === 'offset') wheel.defaultConfig.offsetDegree = offsetDegree

    controls.outerWidthValue.textContent = `${outerWidth}px`
    controls.innerWidthValue.textContent = `${innerWidth}px`
    controls.sectorGutterValue.textContent = `${gutter}px`
    controls.sectorOffsetValue.textContent = `${offsetDegree}°`
    resultElement.textContent = '外边框、内边框与扇区布局已更新'
    syncJsonEditor()
}

controls.outerColor.addEventListener('input', () => applyFrameStyleDemo('outerColor'))
controls.outerWidth.addEventListener('input', () => applyFrameStyleDemo('outerWidth'))
controls.innerColor.addEventListener('input', () => applyFrameStyleDemo('innerColor'))
controls.innerWidth.addEventListener('input', () => applyFrameStyleDemo('innerWidth'))
controls.sectorGutter.addEventListener('input', () => applyFrameStyleDemo('gutter'))
controls.sectorOffset.addEventListener('input', () => applyFrameStyleDemo('offset'))
controls.canvasSize.addEventListener('input', () => {
    controls.canvasSizeValue.textContent = `${controls.canvasSize.value}px`
    updateTypographySizeOutputs(Number(controls.canvasSize.value))
})
controls.canvasSize.addEventListener('change', () => {
    const canvasSize = Number(controls.canvasSize.value)
    wheel.setSize(`${canvasSize}px`)
    controls.canvasSizeValue.textContent = `${canvasSize}px`
    updateTypographySizeOutputs(canvasSize)
    resultElement.textContent = `逻辑画布已更新为 ${canvasSize} × ${canvasSize}px，预览按容器自动适应`
    syncJsonEditor()
})

function applyTypographyDemo(changedField = 'all') {
    const fontSize = Number(controls.textSize.value)
    const length = Number(controls.textLength.value)
    const lineClamp = Number(controls.textClamp.value)
    const top = Number(controls.textTop.value)
    const left = Number(controls.textLeft.value)
    const showPrizeText =
        controls.prizeContentMode.value !== 'image' && controls.prizeTextVisible.checked

    if (changedField === 'all' || changedField === 'color') {
        wheel.defaultStyle.fontColor = controls.textColor.value
    }
    if (changedField === 'all' || changedField === 'fontSize') {
        wheel.defaultStyle.fontSize = formatResponsiveFontSize(fontSize)
    }
    if (changedField === 'all' || changedField === 'wrap') {
        wheel.defaultStyle.wordWrap = controls.textWrap.checked
    }
    if (changedField === 'all' || changedField === 'length') {
        wheel.defaultStyle.lengthLimit = `${length}%`
    }
    if (changedField === 'all' || changedField === 'clamp') {
        wheel.defaultStyle.lineClamp = lineClamp
    }
    if (changedField === 'all' || changedField === 'overflow') {
        wheel.defaultStyle.textOverflow = controls.textOverflow.value
    }
    if (changedField === 'all' || changedField === 'orientation') {
        wheel.defaultStyle.orientation = controls.textOrientation.value
    }
    if (changedField === 'all' || changedField === 'align') {
        wheel.defaultStyle.textAlign = controls.textAlign.value
    }
    if (changedField === 'all' || changedField === 'top') {
        wheel.defaultStyle.top = `${top}%`
    }
    if (changedField === 'all' || changedField === 'left') {
        wheel.defaultStyle.left = `${left}%`
    }
    if (changedField === 'all' || changedField === 'visible') {
        wheel.prizes.forEach(prize => {
            ;(prize.fonts || []).forEach(font => {
                font.visible = showPrizeText
            })
        })
    }

    updateTypographySizeOutputs()
    controls.textLengthValue.textContent = `${length}%`
    controls.textClampValue.textContent = String(lineClamp)
    controls.textTopValue.textContent = `${top}%`
    controls.textLeftValue.textContent = `${left}%`
    resultElement.textContent = `奖品文字已切换为${
        controls.textOrientation.value === 'vertical' ? '竖排' : '横排'
    }，超长内容按当前规则处理`
    syncJsonEditor()
}

controls.prizeTextVisible.addEventListener('change', () => applyTypographyDemo('visible'))
controls.textWrap.addEventListener('change', () => applyTypographyDemo('wrap'))
controls.textAutoScale.addEventListener('change', () => {
    applyTypographyDemo('fontSize')
    applyCenterDemo('fontSize')
})
controls.textOrientation.addEventListener('change', () => applyTypographyDemo('orientation'))
controls.textAlign.addEventListener('change', () => applyTypographyDemo('align'))
controls.textOverflow.addEventListener('change', () => applyTypographyDemo('overflow'))
controls.textColor.addEventListener('input', () => applyTypographyDemo('color'))
controls.textSize.addEventListener('input', () => applyTypographyDemo('fontSize'))
controls.textLength.addEventListener('input', () => applyTypographyDemo('length'))
controls.textClamp.addEventListener('input', () => applyTypographyDemo('clamp'))
controls.textTop.addEventListener('input', () => applyTypographyDemo('top'))
controls.textLeft.addEventListener('input', () => applyTypographyDemo('left'))

function applyMotionDemo() {
    const speed = Number(controls.spinSpeed.value)
    const accelerationTime = Number(controls.acceleration.value)
    const decelerationTime = Number(controls.deceleration.value)
    const stopRange = Number(controls.stopRange.value)
    const sensitivity = Number(controls.sensitivity.value)
    const friction = Number(controls.friction.value)
    const drag = Number(controls.drag.value)

    Object.assign(wheel.defaultConfig, {
        speed,
        speedFunction: controls.speedFunction.value,
        accelerationTime,
        decelerationTime,
        stopRange,
    })
    Object.assign(wheel.physics, {
        enabled: physicsModeToggle.checked,
        sensitivity,
        friction,
        drag,
        direction: controls.physicsDirection.value,
    })

    controls.spinSpeedValue.textContent = String(speed)
    controls.accelerationValue.textContent = `${accelerationTime}ms`
    controls.decelerationValue.textContent = `${decelerationTime}ms`
    controls.stopRangeValue.textContent = stopRange.toFixed(2)
    controls.sensitivityValue.textContent = sensitivity.toFixed(2)
    controls.frictionValue.textContent = String(friction)
    controls.dragValue.textContent = drag.toFixed(2)
    resultElement.textContent = '动画与滑动物理参数已更新'
    syncJsonEditor()
}

controls.spinSpeed.addEventListener('input', applyMotionDemo)
controls.speedFunction.addEventListener('change', applyMotionDemo)
controls.acceleration.addEventListener('input', applyMotionDemo)
controls.deceleration.addEventListener('input', applyMotionDemo)
controls.stopRange.addEventListener('input', applyMotionDemo)
controls.sensitivity.addEventListener('input', applyMotionDemo)
controls.friction.addEventListener('input', applyMotionDemo)
controls.drag.addEventListener('input', applyMotionDemo)
controls.physicsDirection.addEventListener('change', applyMotionDemo)

function applyPerformanceDemo() {
    const maxDpr = Number(controls.maxDpr.value)
    const maxCanvasPixels = Number(controls.maxCanvasPixels.value)
    const imageConcurrency = Number(controls.imageConcurrency.value)
    Object.assign(wheel.defaultConfig, {
        maxDpr,
        maxCanvasPixels,
        imageConcurrency,
    })
    controls.maxDprValue.textContent = String(maxDpr)
    controls.imageConcurrencyValue.textContent = String(imageConcurrency)
    resultElement.textContent = '性能与资源预算已更新'
    syncJsonEditor()
}

controls.maxDpr.addEventListener('input', applyPerformanceDemo)
controls.maxCanvasPixels.addEventListener('change', applyPerformanceDemo)
controls.imageConcurrency.addEventListener('input', applyPerformanceDemo)

function getSerializableWheelConfig() {
    return cloneSerializable({
        width: wheel.width,
        height: wheel.height,
        ariaLabel: wheel.options.ariaLabel,
        blocks: wheel.blocks,
        prizes: wheel.prizes,
        buttons: wheel.buttons,
        pointer: wheel.pointer,
        defaultStyle: wheel.defaultStyle,
        defaultConfig: wheel.defaultConfig,
        physics: wheel.physics,
        feedback: wheel.feedback,
    })
}

function cloneSerializable(value) {
    return JSON.parse(JSON.stringify(value))
}

function getWorkbenchStorage() {
    try {
        return window.localStorage || null
    } catch (_error) {
        return null
    }
}

function setWorkbenchStorageStatus(message, state = '') {
    if (!configStorageStatus) return
    configStorageStatus.textContent = translateDemoText(message)
    if (state) configStorageStatus.dataset.state = state
    else delete configStorageStatus.dataset.state
}

function cancelWorkbenchPersistenceTimer() {
    if (workbenchPersistenceTimer === null) return
    if (typeof window.clearTimeout === 'function') {
        window.clearTimeout(workbenchPersistenceTimer)
    }
    workbenchPersistenceTimer = null
}

function persistWorkbenchConfig() {
    if (!workbenchPersistenceReady || workbenchPersistenceSuspended) return false
    const storage = getWorkbenchStorage()
    if (!storage) {
        setWorkbenchStorageStatus('本地存储不可用', 'error')
        return false
    }
    try {
        storage.setItem(
            WORKBENCH_STORAGE_KEY,
            JSON.stringify({
                version: WORKBENCH_STORAGE_VERSION,
                savedAt: new Date().toISOString(),
                config: getSerializableWheelConfig(),
            }),
        )
        setWorkbenchStorageStatus('已保存到本地', 'saved')
        return true
    } catch (_error) {
        setWorkbenchStorageStatus('本地空间不足未保存', 'error')
        return false
    }
}

function scheduleWorkbenchPersistence() {
    if (!workbenchPersistenceReady || workbenchPersistenceSuspended) return
    cancelWorkbenchPersistenceTimer()
    workbenchPersistenceTimer = window.setTimeout(() => {
        workbenchPersistenceTimer = null
        persistWorkbenchConfig()
    }, WORKBENCH_STORAGE_DELAY)
}

function flushWorkbenchPersistence() {
    if (workbenchPersistenceTimer === null) return
    cancelWorkbenchPersistenceTimer()
    persistWorkbenchConfig()
}

async function initializeWorkbenchPersistence() {
    const storage = getWorkbenchStorage()
    if (!storage) {
        workbenchPersistenceReady = true
        setWorkbenchStorageStatus('本地存储不可用', 'error')
        return
    }
    let storedConfig = null
    try {
        const storedValue = storage.getItem(WORKBENCH_STORAGE_KEY)
        if (storedValue) {
            const payload = JSON.parse(storedValue)
            if (
                !payload ||
                payload.version !== WORKBENCH_STORAGE_VERSION ||
                !payload.config ||
                typeof payload.config !== 'object' ||
                Array.isArray(payload.config)
            ) {
                throw new TypeError('本地配置格式无效')
            }
            storedConfig = payload.config
        }
    } catch (_error) {
        try {
            storage.removeItem(WORKBENCH_STORAGE_KEY)
        } catch (_removeError) {
            // A blocked storage API must not prevent the default workbench from loading.
        }
        workbenchPersistenceReady = true
        setWorkbenchStorageStatus('本地配置无效已忽略', 'error')
        return
    }
    if (!storedConfig) {
        workbenchPersistenceReady = true
        setWorkbenchStorageStatus('本地自动保存')
        return
    }
    workbenchPersistenceSuspended = true
    try {
        await applyLiveConfig(storedConfig, '已恢复本地配置')
        setWorkbenchStorageStatus('已恢复本地配置', 'saved')
    } catch (_error) {
        try {
            storage.removeItem(WORKBENCH_STORAGE_KEY)
        } catch (_removeError) {
            // A blocked storage API must not prevent the default workbench from loading.
        }
        setWorkbenchStorageStatus('本地配置无效已忽略', 'error')
    } finally {
        workbenchPersistenceSuspended = false
        workbenchPersistenceReady = true
    }
}

async function resetWorkbenchConfig() {
    if (wheel.isRunning()) return
    cancelWorkbenchPersistenceTimer()
    workbenchPersistenceSuspended = true
    const storage = getWorkbenchStorage()
    try {
        if (storage) storage.removeItem(WORKBENCH_STORAGE_KEY)
        await applyLiveConfig(cloneSerializable(defaultSerializableConfig), '已恢复默认配置')
    } finally {
        workbenchPersistenceSuspended = false
        workbenchPersistenceReady = true
    }
    persistWorkbenchConfig()
}

function syncJsonEditor(force = false) {
    syncAccessiblePrizeList()
    scheduleWorkbenchPersistence()
    if (!force && document.activeElement === controls.liveConfig) return
    const details =
        typeof controls.liveConfig.closest === 'function'
            ? controls.liveConfig.closest('details')
            : null
    if (!force && details && !details.open) return
    controls.liveConfig.value = JSON.stringify(getSerializableWheelConfig(), null, 4)
}

function syncAccessiblePrizeList() {
    if (!prizeListElement) return
    const signature = wheel.prizes
        .map(prize => [getPrizeLabel(prize), prize.range, prize.displayWeight].join('\u0001'))
        .join('\u0002')
    if (signature === syncAccessiblePrizeList.lastSignature) return
    syncAccessiblePrizeList.lastSignature = signature
    if (typeof prizeListElement.replaceChildren === 'function') {
        prizeListElement.replaceChildren()
    } else {
        prizeListElement.textContent = ''
    }
    if (
        typeof document.createElement !== 'function' ||
        typeof prizeListElement.appendChild !== 'function'
    ) {
        return
    }
    wheel.prizes.forEach((prize, index) => {
        const item = document.createElement('li')
        const weight = Number(prize.range)
        const displayWeight = Number(prize.displayWeight)
        const parts = [`${index + 1}. ${getPrizeLabel(prize)}`]
        if (Number.isFinite(weight) && weight >= 0) parts.push(`中奖权重 ${weight}`)
        if (Number.isFinite(displayWeight) && displayWeight >= 0) {
            parts.push(`图形权重 ${displayWeight}`)
        }
        item.textContent = parts.join('，')
        prizeListElement.appendChild(item)
    })
}

const liveConfigDetails =
    typeof controls.liveConfig.closest === 'function'
        ? controls.liveConfig.closest('details')
        : null
if (liveConfigDetails) {
    liveConfigDetails.addEventListener('toggle', () => {
        if (liveConfigDetails.open) syncJsonEditor(true)
    })
}

async function applyLiveConfig(config, message) {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
        throw new TypeError('配置根节点必须是 JSON 对象')
    }
    assertSafeJson(config)
    const allowedKeys = new Set([
        'width',
        'height',
        'ariaLabel',
        'blocks',
        'prizes',
        'buttons',
        'pointer',
        'defaultStyle',
        'defaultConfig',
        'physics',
        'feedback',
    ])
    const unknownKey = Object.keys(config).find(key => !allowedKeys.has(key))
    if (unknownKey) throw new TypeError(`不支持的顶层字段：${unknownKey}`)

    const previousConfig = getSerializableWheelConfig()
    try {
        await updateCompleteConfig(config)
    } catch (error) {
        await updateCompleteConfig(previousConfig)
        throw error
    }
    syncControlsFromWheel()
    syncJsonEditor(true)
    resultElement.textContent = message
}

async function updateCompleteConfig(config) {
    const patch = { ...config }
    ;['defaultStyle', 'defaultConfig', 'physics'].forEach(key => {
        if (!Object.prototype.hasOwnProperty.call(config, key)) return
        const current = wheel[key] && typeof wheel[key] === 'object' ? wheel[key] : {}
        const callbacks = Object.fromEntries(
            Object.entries(current).filter(([, value]) => typeof value === 'function'),
        )
        wheel[key] = { ...(config[key] || {}), ...callbacks }
        delete patch[key]
    })
    if (config.feedback) {
        const currentFeedback = wheel.feedback || {}
        const currentSound = currentFeedback.sound || {}
        const currentCelebration = currentFeedback.celebration || {}
        wheel.feedback = {
            ...currentFeedback,
            ...config.feedback,
            sound: {
                ...currentSound,
                ...(config.feedback.sound || {}),
                play: currentSound.play || playWheelSound,
            },
            celebration: {
                ...currentCelebration,
                ...(config.feedback.celebration || {}),
                fire: currentCelebration.fire || fireWheelCelebration,
            },
        }
        delete patch.feedback
    }
    await wheel.update(patch)
}

function assertSafeJson(value, path = 'config') {
    if (!value || typeof value !== 'object') return
    Object.keys(value).forEach(key => {
        if (key === '__proto__' || key === 'prototype' || key === 'constructor') {
            throw new TypeError(`不安全的配置字段：${path}.${key}`)
        }
        assertSafeJson(value[key], `${path}.${key}`)
    })
}

controls.applyLiveConfig.addEventListener('click', async () => {
    try {
        await applyLiveConfig(JSON.parse(controls.liveConfig.value), '完整 JSON 配置已应用')
    } catch (error) {
        resultElement.textContent = `配置无效：${error.message || error}`
    }
})

controls.resetLiveConfig.addEventListener('click', async () => {
    try {
        await resetWorkbenchConfig()
    } catch (error) {
        resultElement.textContent = `恢复失败：${error.message || error}`
    }
})

if (resetWorkbenchConfigButton) {
    resetWorkbenchConfigButton.addEventListener('click', async () => {
        try {
            await resetWorkbenchConfig()
        } catch (error) {
            resultElement.textContent = `恢复失败：${error.message || error}`
        }
    })
}

controls.copyLiveConfig.addEventListener('click', async () => {
    syncJsonEditor(true)
    try {
        await navigator.clipboard.writeText(controls.liveConfig.value)
        resultElement.textContent = '完整配置已复制'
    } catch {
        controls.liveConfig.focus()
        controls.liveConfig.select()
        resultElement.textContent = '请按 Ctrl/Cmd + C 复制配置'
    }
})

function syncControlsFromWheel() {
    const pointer = wheel.pointer || {}
    const button = wheel.buttons[0] || { fonts: [{}] }
    const font = (button.fonts && button.fonts[0]) || {}
    const outer = wheel.blocks[0] || {}
    const inner = wheel.blocks[1] || {}
    const firstPrizeImage = wheel.prizes
        .flatMap(prize => prize.imgs || [])
        .find(image => image && image.src)
    const firstCenterLogo = (button.imgs || []).find(image => image && image.src)
    const hasVisiblePrizeImage = wheel.prizes.some(prize =>
        (prize.imgs || []).some(image => image && image.src && image.visible !== false),
    )

    pointerPositionSelect.value =
        pointer.type === 'none'
            ? 'none'
            : pointer.type === 'external'
              ? pointer.position || 'top'
              : 'center'
    pointerPresetSelect.value = pointer.preset || 'minimal'
    pointerColorInput.value = normalizeColor(pointer.color, DEMO_THEME.center)
    pointerColorSourceSelect.value =
        pointer.colorSource === 'currentPrize' ? 'currentPrize' : 'fixed'
    const pointerWobble = pointer.wobble && typeof pointer.wobble === 'object' ? pointer.wobble : {}
    controls.pointerWobble.checked =
        pointer.wobble === true || (Boolean(pointer.wobble) && pointerWobble.enabled !== false)
    controls.pointerWobbleAmplitude.value = numericValue(pointerWobble.amplitude, 2.5)
    controls.pointerWobbleDuration.value = numericValue(pointerWobble.duration, 180)
    controls.pointerWobbleFrequency.value = numericValue(pointerWobble.frequency, 14)
    controls.pointerWobbleDamping.value = numericValue(pointerWobble.damping, 12)
    controls.pointerBorderColor.value = normalizeColor(pointer.borderColor, '#ffffff')
    controls.pointerBorder.value = numericValue(pointer.borderWidth, 2)
    controls.pointerRadius.value = numericValue(pointer.cornerRadius, 3)
    if (pointer.type === 'external') {
        controls.pointerOffset.value = numericValue(pointer.tangentOffset, 0)
        controls.pointerMount.checked = Boolean(pointer.mount && pointer.mount.visible !== false)
        controls.pointerLayout.value =
            pointer.reserveSpace === false || pointer.layout === 'overlay'
                ? 'overlay'
                : pointer.layout === 'stable'
                  ? 'stable'
                  : 'fit'
        controls.pointerSpace.value = numericValue(pointer.space, 18)
        pointerInsetInput.value = numericValue(pointer.tipInset, 14)
    } else if (pointer.type !== 'none') {
        controls.centerPointerAngle.value = numericValue(pointer.angle, 0)
        controls.centerPointerOffset.value = numericValue(pointer.radialOffset, 0)
        controls.centerPointerFused.checked = pointer.fused !== false
        controls.centerFusionStyle.value = ['adaptive', 'droplet', 'layered'].includes(
            pointer.fusionStyle,
        )
            ? pointer.fusionStyle
            : 'layered'
    }
    pointerSizeInput.value = Math.max(60, Math.min(150, inferPointerSizePercent(pointer)))
    controls.outerColor.value = normalizeColor(outer.background, DEMO_THEME.frame)
    controls.outerWidth.value = numericValue(outer.padding, 10)
    controls.innerColor.value = normalizeColor(inner.background, DEMO_THEME.frameInner)
    controls.innerWidth.value = numericValue(inner.padding, 3)
    controls.sectorGutter.value = numericValue(wheel.defaultConfig.gutter, 0)
    controls.sectorOffset.value = numericValue(wheel.defaultConfig.offsetDegree, 0)
    controls.canvasSize.value = numericValue(wheel.width, 360)
    graphicWeightToggle.checked = wheel.defaultConfig.useGraphicWeight !== false
    controls.centerVisible.checked = button.visible !== false
    centerTextToggle.checked = button.textVisible !== false
    controls.centerLabel.value = font.text || ''
    controls.centerColor.value = normalizeColor(button.background, DEMO_THEME.center)
    controls.centerBorderColor.value = normalizeColor(button.borderColor, DEMO_THEME.centerBorder)
    controls.centerAlign.value = font.verticalAlign || 'middle'
    centerSizeInput.value = numericValue(button.radius, 18)
    centerBorderInput.value = numericValue(button.borderWidth, 3)
    controls.centerFontSize.value = getTypographyBaseSize(font.fontSize, 16)
    const prizeTextVisible = !wheel.prizes.some(prize =>
        (prize.fonts || []).some(prizeFont => prizeFont.visible === false),
    )
    controls.prizeTextVisible.checked = prizeTextVisible
    controls.prizeContentMode.value = hasVisiblePrizeImage
        ? prizeTextVisible
            ? 'both'
            : 'image'
        : 'text'
    if (firstPrizeImage) {
        controls.prizeImageUrl.value = firstPrizeImage.src
        controls.prizeImageCrossOrigin.value = firstPrizeImage.crossOrigin || ''
        controls.prizeImageSize.value = numericValue(firstPrizeImage.width, 34)
        controls.prizeImageTop.value = numericValue(firstPrizeImage.top, 42)
    }
    controls.centerLogoVisible.checked = Boolean(
        firstCenterLogo && firstCenterLogo.visible !== false,
    )
    if (firstCenterLogo) {
        controls.centerLogoUrl.value = firstCenterLogo.src
        controls.centerLogoSize.value = numericValue(firstCenterLogo.width, 42)
    }
    controls.textWrap.checked = wheel.defaultStyle.wordWrap !== false
    controls.textOrientation.value = wheel.defaultStyle.orientation || 'horizontal'
    controls.textAlign.value = wheel.defaultStyle.textAlign || 'center'
    controls.textOverflow.value = wheel.defaultStyle.textOverflow || 'ellipsis'
    controls.textColor.value = normalizeColor(wheel.defaultStyle.fontColor, DEMO_THEME.text)
    controls.textAutoScale.checked = isPercentageLength(wheel.defaultStyle.fontSize)
    controls.textSize.value = getTypographyBaseSize(wheel.defaultStyle.fontSize, 14)
    controls.textLength.value = numericValue(wheel.defaultStyle.lengthLimit, 90)
    controls.textClamp.value = numericValue(wheel.defaultStyle.lineClamp, 2)
    controls.textTop.value = numericValue(wheel.defaultStyle.top, 18)
    controls.textLeft.value = numericValue(wheel.defaultStyle.left, 0)
    controls.spinSpeed.value = numericValue(wheel.defaultConfig.speed, 20)
    controls.speedFunction.value = wheel.defaultConfig.speedFunction || 'quad'
    controls.acceleration.value = numericValue(wheel.defaultConfig.accelerationTime, 800)
    controls.deceleration.value = numericValue(wheel.defaultConfig.decelerationTime, 2500)
    controls.stopRange.value = numericValue(wheel.defaultConfig.stopRange, 0.7)
    physicsModeToggle.checked = wheel.physics.enabled === true
    controls.sensitivity.value = numericValue(wheel.physics.sensitivity, 1)
    controls.friction.value = numericValue(wheel.physics.friction, 24)
    controls.drag.value = numericValue(wheel.physics.drag, 0.68)
    controls.physicsDirection.value = wheel.physics.direction || 'both'
    controls.maxDpr.value = numericValue(wheel.defaultConfig.maxDpr, 3)
    controls.maxCanvasPixels.value = String(
        numericValue(wheel.defaultConfig.maxCanvasPixels, 16777216),
    )
    controls.imageConcurrency.value = numericValue(wheel.defaultConfig.imageConcurrency, 6)
    const feedback = wheel.feedback || {}
    const sound = feedback.sound || {}
    const celebration = feedback.celebration || {}
    controls.soundEnabled.checked = sound.enabled === true
    controls.soundPack.value = UI_SFX_PACKS.has(sound.pack) ? sound.pack : 'mechanical'
    controls.sectorSound.value = sound.sectorCue || 'snap'
    controls.resultSound.value = sound.resultCue || 'reward'
    controls.soundVolume.value = numericValue(sound.volume, 0.3)
    controls.soundInterval.value = numericValue(sound.minInterval, 35)
    controls.celebrationEnabled.checked = celebration.enabled === true
    controls.celebrationStyle.value = ['subtle', 'burst', 'stars'].includes(celebration.style)
        ? celebration.style
        : 'subtle'
    controls.celebrationCount.value = numericValue(celebration.particleCount, 48)
    controls.celebrationReducedMotion.checked = celebration.disableForReducedMotion !== false
    const centerPointer = pointerPositionSelect.value === 'center'
    const hiddenPointer = pointerPositionSelect.value === 'none'
    const fusedCenterPointer = centerPointer && controls.centerPointerFused.checked
    const unifiedFusion = fusedCenterPointer && controls.centerFusionStyle.value !== 'layered'
    const followPrizeColor = pointerColorSourceSelect.value === 'currentPrize'
    pointerInsetInput.disabled = centerPointer || hiddenPointer
    controls.pointerOffset.disabled = centerPointer || hiddenPointer
    controls.pointerMount.disabled = centerPointer || hiddenPointer
    controls.pointerLayout.disabled = centerPointer || hiddenPointer
    controls.pointerSpace.disabled =
        centerPointer || hiddenPointer || controls.pointerLayout.value !== 'stable'
    controls.centerPointerAngle.disabled = !centerPointer || hiddenPointer
    controls.centerPointerOffset.disabled = !centerPointer || hiddenPointer
    controls.centerPointerFused.disabled = !centerPointer || hiddenPointer
    controls.centerFusionStyle.disabled =
        !centerPointer || hiddenPointer || !controls.centerPointerFused.checked
    pointerColorSourceSelect.disabled = hiddenPointer
    controls.pointerWobble.disabled = hiddenPointer
    ;[
        controls.pointerWobbleAmplitude,
        controls.pointerWobbleDuration,
        controls.pointerWobbleFrequency,
        controls.pointerWobbleDamping,
    ].forEach(control => {
        control.disabled = hiddenPointer || !controls.pointerWobble.checked
    })
    controls.prizeTextVisible.disabled = controls.prizeContentMode.value === 'image'
    syncFeedbackControlState()
    ;[
        pointerColorInput,
        pointerPresetSelect,
        pointerSizeInput,
        controls.pointerBorderColor,
        controls.pointerBorder,
        controls.pointerRadius,
    ].forEach(control => {
        const inheritedColorControl =
            control === pointerColorInput || control === controls.pointerBorderColor
        control.disabled =
            hiddenPointer ||
            (fusedCenterPointer && inheritedColorControl) ||
            (followPrizeColor && control === pointerColorInput) ||
            (unifiedFusion && control === controls.pointerBorder)
    })
    refreshCustomSelects()
    updateControlOutputs()
}

function updateControlOutputs() {
    pointerSizeValue.textContent = `${pointerSizeInput.value}%`
    pointerInsetValue.textContent = `${pointerInsetInput.value}px`
    controls.pointerBorderValue.textContent = `${controls.pointerBorder.value}px`
    controls.pointerRadiusValue.textContent = `${controls.pointerRadius.value}px`
    controls.pointerWobbleAmplitudeValue.textContent = `${controls.pointerWobbleAmplitude.value}°`
    controls.pointerWobbleDurationValue.textContent = `${controls.pointerWobbleDuration.value}ms`
    controls.pointerWobbleFrequencyValue.textContent = `${controls.pointerWobbleFrequency.value}Hz`
    controls.pointerWobbleDampingValue.textContent = controls.pointerWobbleDamping.value
    controls.soundVolumeValue.textContent = `${Math.round(Number(controls.soundVolume.value) * 100)}%`
    controls.soundIntervalValue.textContent = `${controls.soundInterval.value}ms`
    controls.celebrationCountValue.textContent = controls.celebrationCount.value
    controls.pointerOffsetValue.textContent = `${controls.pointerOffset.value}px`
    controls.pointerSpaceValue.textContent = `${controls.pointerSpace.value}px`
    controls.centerPointerAngleValue.textContent = `${controls.centerPointerAngle.value}°`
    controls.centerPointerOffsetValue.textContent = `${controls.centerPointerOffset.value}px`
    controls.prizeImageSizeValue.textContent = `${controls.prizeImageSize.value}%`
    controls.prizeImageTopValue.textContent = `${controls.prizeImageTop.value}%`
    controls.centerLogoSizeValue.textContent = `${controls.centerLogoSize.value}%`
    controls.outerWidthValue.textContent = `${controls.outerWidth.value}px`
    controls.innerWidthValue.textContent = `${controls.innerWidth.value}px`
    controls.sectorGutterValue.textContent = `${controls.sectorGutter.value}px`
    controls.sectorOffsetValue.textContent = `${controls.sectorOffset.value}°`
    controls.canvasSizeValue.textContent = `${controls.canvasSize.value}px`
    updateCanvasPreviewMetrics(wheel.boxWidth, wheel.boxHeight, wheel.dpr)
    centerSizeValue.textContent = `${centerSizeInput.value}%`
    centerBorderValue.textContent = `${centerBorderInput.value}px`
    updateTypographySizeOutputs()
    controls.textLengthValue.textContent = `${controls.textLength.value}%`
    controls.textClampValue.textContent = controls.textClamp.value
    controls.textTopValue.textContent = `${controls.textTop.value}%`
    controls.textLeftValue.textContent = `${controls.textLeft.value}%`
    controls.spinSpeedValue.textContent = controls.spinSpeed.value
    controls.accelerationValue.textContent = `${controls.acceleration.value}ms`
    controls.decelerationValue.textContent = `${controls.deceleration.value}ms`
    controls.stopRangeValue.textContent = Number(controls.stopRange.value).toFixed(2)
    controls.sensitivityValue.textContent = Number(controls.sensitivity.value).toFixed(2)
    controls.frictionValue.textContent = controls.friction.value
    controls.dragValue.textContent = Number(controls.drag.value).toFixed(2)
    controls.maxDprValue.textContent = controls.maxDpr.value
    controls.imageConcurrencyValue.textContent = controls.imageConcurrency.value
}

function numericValue(value, fallback) {
    const number = Number.parseFloat(value)
    return Number.isFinite(number) ? number : fallback
}

function updateCanvasPreviewMetrics(width, height, dpr) {
    if (!controls.canvasPreviewSize) return
    const previewWidth = numericValue(width, 0)
    const previewHeight = numericValue(height, previewWidth)
    const previewDpr = numericValue(dpr, 1)
    controls.canvasPreviewSize.textContent = `${Math.round(previewWidth)}×${Math.round(
        previewHeight,
    )}px · DPR ${Number(previewDpr.toFixed(2))}`
}

function isPercentageLength(value) {
    return typeof value === 'string' && value.trim().endsWith('%')
}

function getTypographyBaseSize(value, fallback) {
    const numeric = numericValue(value, fallback)
    const baseSize = isPercentageLength(value)
        ? (numeric / 100) * TYPOGRAPHY_REFERENCE_SIZE
        : numeric
    return Math.round(baseSize * 1000) / 1000
}

function formatResponsiveFontSize(baseSize) {
    if (!controls.textAutoScale || !controls.textAutoScale.checked) return `${baseSize}px`
    return `${Number(((baseSize / TYPOGRAPHY_REFERENCE_SIZE) * 100).toFixed(6))}%`
}

function updateTypographySizeOutputs(canvasSizeOverride) {
    const canvasSize = Number.isFinite(canvasSizeOverride)
        ? canvasSizeOverride
        : numericValue(controls.canvasSize && controls.canvasSize.value, TYPOGRAPHY_REFERENCE_SIZE)
    const scale =
        controls.textAutoScale && controls.textAutoScale.checked
            ? canvasSize / TYPOGRAPHY_REFERENCE_SIZE
            : 1
    const formatOutput = value => {
        const baseSize = Number(value)
        const effectiveSize = Math.max(1, Math.round(baseSize * scale))
        return scale === 1 ? `${baseSize}px` : `${baseSize}px → ${effectiveSize}px`
    }
    if (controls.textSizeValue) {
        controls.textSizeValue.textContent = formatOutput(controls.textSize.value)
    }
    if (controls.centerFontSizeValue) {
        controls.centerFontSizeValue.textContent = formatOutput(controls.centerFontSize.value)
    }
}

function normalizeColor(value, fallback) {
    return typeof value === 'string' && /^#[\da-f]{6}$/i.test(value) ? value : fallback
}

function inferPointerSizePercent(pointer) {
    const preset = pointer.preset || 'minimal'
    if (pointer.type === 'center') {
        const presetSize = CENTER_POINTER_PRESET_SIZES[preset] || [100, 100]
        if (pointer.width == null) return 100
        return Math.round((numericValue(pointer.width, presetSize[0]) / presetSize[0]) * 100)
    }
    const presetSize = EXTERNAL_POINTER_PRESET_SIZES[preset] || [7.5, 14.5]
    if (pointer.width == null) return 100
    const width = numericValue(pointer.width, presetSize[0])
    const referenceWidth =
        typeof pointer.width === 'string' && pointer.width.trim().endsWith('%')
            ? presetSize[0]
            : (presetSize[0] * POINTER_REFERENCE_SIZE) / 100
    return Math.round((width / referenceWidth) * 100)
}

function createCenterPointer(preset, color, sizePercent, options = {}) {
    const scale = Math.max(0.6, Math.min(1.5, Number(sizePercent) / 100 || 1))
    const presetSize = CENTER_POINTER_PRESET_SIZES[preset] || [100, 100]

    return {
        type: 'center',
        preset,
        angle: Number(options.angle) || 0,
        color,
        colorSource: options.colorSource === 'currentPrize' ? 'currentPrize' : 'fixed',
        borderColor: options.borderColor || '#ffffff',
        borderWidth: Number.isFinite(options.borderWidth) ? options.borderWidth : 2,
        cornerRadius: Number.isFinite(options.cornerRadius) ? options.cornerRadius : 3,
        fused: options.fused !== false,
        fusionStyle: ['adaptive', 'droplet', 'layered'].includes(options.fusionStyle)
            ? options.fusionStyle
            : 'layered',
        referenceSize: options.fused === false ? '30%' : undefined,
        width: `${Math.round(presetSize[0] * scale * 100) / 100}%`,
        height: `${Math.round(presetSize[1] * scale * 100) / 100}%`,
        radialOffset: Number(options.radialOffset) || 0,
        wobble: options.wobble ? { ...options.wobble } : false,
        shadow: false,
    }
}

function createExternalPointer(position, preset, color, sizePercent, inset, options = {}) {
    const scale = Math.max(0.6, Math.min(1.5, Number(sizePercent) / 100 || 1))
    const presetSize = EXTERNAL_POINTER_PRESET_SIZES[preset] || [7.5, 14.5]
    const width = Math.round(((presetSize[0] * POINTER_REFERENCE_SIZE) / 100) * scale * 100) / 100
    const height = Math.round(((presetSize[1] * POINTER_REFERENCE_SIZE) / 100) * scale * 100) / 100
    const layout = ['fit', 'stable', 'overlay'].includes(options.layout) ? options.layout : 'stable'
    const stableSpace = Number.isFinite(Number(options.space)) ? Number(options.space) : 18
    const pointer = {
        type: 'external',
        position,
        preset,
        color,
        colorSource: options.colorSource === 'currentPrize' ? 'currentPrize' : 'fixed',
        borderColor: options.borderColor || '#ffffff',
        borderWidth: Number.isFinite(options.borderWidth)
            ? options.borderWidth
            : preset === 'minimal'
              ? 2
              : 3,
        cornerRadius: Number.isFinite(options.cornerRadius) ? options.cornerRadius : 3,
        width: `${width}px`,
        height: `${height}px`,
        layout,
        space: layout === 'stable' ? `${Math.max(0, stableSpace)}px` : undefined,
        reserveSpace: layout !== 'overlay',
        tipInset: Number.isFinite(Number(inset)) ? Number(inset) : preset === 'minimal' ? 14 : 8,
        tangentOffset: Number(options.tangentOffset) || 0,
        wobble: options.wobble ? { ...options.wobble } : false,
        body: {
            gradient: {
                from: mixHexColor(color, '#000000', 0.24),
                to: mixHexColor(color, '#ffffff', 0.34),
            },
            shadeColor: mixHexColor(color, '#000000', 0.42),
            shadeWidth: 1.2,
        },
        mount: options.mount
            ? {
                  radius: `${
                      Math.round(
                          (EXTERNAL_POINTER_MOUNT_RADII[preset] || 2.6) *
                              POINTER_REFERENCE_SIZE *
                              scale,
                      ) / 100
                  }px`,
                  color: '#ffffff',
                  innerColor: mixHexColor(color, '#ffffff', 0.76),
                  borderColor: mixHexColor(color, '#000000', 0.18),
                  borderWidth: 2,
                  gradient: {
                      highlight: '#ffffff',
                      middle: mixHexColor(color, '#ffffff', 0.9),
                      edge: mixHexColor(color, '#ffffff', 0.68),
                  },
              }
            : false,
        accentColor: false,
        shadow: false,
    }

    if (preset === 'minimal') {
        pointer.body = {
            color,
            gradient: false,
            shadeColor: false,
        }
        if (!options.mount) pointer.mount = false
        pointer.accentColor = false
        pointer.shadow = false
    }
    return pointer
}

function mixHexColor(source, target, ratio) {
    const sourceValue = Number.parseInt(source.replace('#', ''), 16)
    const targetValue = Number.parseInt(target.replace('#', ''), 16)
    const amount = Math.max(0, Math.min(1, ratio))
    const channels = [16, 8, 0].map(shift => {
        const from = (sourceValue >> shift) & 255
        const to = (targetValue >> shift) & 255
        return Math.round(from + (to - from) * amount)
    })
    return `#${channels.map(channel => channel.toString(16).padStart(2, '0')).join('')}`
}

function initializeCustomSelects() {
    if (typeof document.querySelectorAll !== 'function') return
    document.querySelectorAll('.demo-control select').forEach(enhanceCustomSelect)
    if (typeof document.addEventListener === 'function') {
        document.addEventListener('pointerdown', handleCustomSelectOutsidePointer, true)
        document.addEventListener('scroll', positionActiveCustomSelect, true)
    }
    if (typeof window.addEventListener === 'function') {
        window.addEventListener('resize', positionActiveCustomSelect)
    }
}

function enhanceCustomSelect(select) {
    if (!select || !select.parentElement || customSelectInstances.has(select)) return
    const nativeOptions = Array.from(select.options || [])
    if (!nativeOptions.length) return

    customSelectSequence += 1
    const instanceId = `wheel-canvas-select-${customSelectSequence}`
    const root = document.createElement('div')
    root.className = 'custom-select'

    const trigger = document.createElement('button')
    trigger.className = 'custom-select-trigger'
    trigger.type = 'button'
    trigger.setAttribute('aria-haspopup', 'listbox')
    trigger.setAttribute('aria-expanded', 'false')
    trigger.setAttribute('aria-controls', `${instanceId}-list`)

    const triggerText = document.createElement('span')
    triggerText.className = 'custom-select-value'
    trigger.appendChild(triggerText)

    const triggerArrow = document.createElement('span')
    triggerArrow.className = 'custom-select-arrow'
    triggerArrow.setAttribute('aria-hidden', 'true')
    trigger.appendChild(triggerArrow)
    root.appendChild(trigger)

    const popover = document.createElement('div')
    popover.className = 'custom-select-popover'
    popover.hidden = true
    popover.dataset.selectId = instanceId

    let search = null
    if (nativeOptions.length >= 8) {
        const searchBox = document.createElement('div')
        searchBox.className = 'custom-select-search-box'
        search = document.createElement('input')
        search.className = 'custom-select-search'
        search.type = 'search'
        search.placeholder = '搜索选项'
        search.autocomplete = 'off'
        search.setAttribute('aria-label', '搜索下拉选项')
        searchBox.appendChild(search)
        popover.appendChild(searchBox)
    }

    const list = document.createElement('div')
    list.id = `${instanceId}-list`
    list.className = 'custom-select-list'
    list.setAttribute('role', 'listbox')
    list.setAttribute('aria-multiselectable', 'false')
    list.setAttribute('aria-label', getCustomSelectLabel(select))
    popover.appendChild(list)

    const empty = document.createElement('p')
    empty.className = 'custom-select-empty'
    empty.textContent = '没有匹配选项'
    empty.hidden = true
    popover.appendChild(empty)

    const instance = {
        select,
        root,
        trigger,
        triggerText,
        popover,
        list,
        search,
        empty,
        options: [],
    }

    nativeOptions.forEach((nativeOption, index) => {
        const option = document.createElement('button')
        option.id = `${instanceId}-option-${index}`
        option.className = 'custom-select-option'
        option.type = 'button'
        option.dataset.value = nativeOption.value
        option.dataset.search = nativeOption.textContent.trim().toLocaleLowerCase()
        option.disabled = nativeOption.disabled
        option.setAttribute('role', 'option')

        const optionMark = document.createElement('span')
        optionMark.className = 'custom-select-option-mark'
        optionMark.setAttribute('aria-hidden', 'true')
        option.appendChild(optionMark)

        const optionText = document.createElement('span')
        optionText.className = 'custom-select-option-text'
        optionText.textContent = nativeOption.textContent.trim()
        option.appendChild(optionText)
        option.addEventListener('click', () => selectCustomSelectOption(instance, option))
        option.addEventListener('keydown', event =>
            handleCustomSelectOptionKeydown(instance, event),
        )
        list.appendChild(option)
        instance.options.push(option)
    })

    trigger.addEventListener('click', event => {
        event.preventDefault()
        if (activeCustomSelect === instance) {
            closeCustomSelect(instance, true)
        } else {
            openCustomSelect(instance)
        }
    })
    trigger.addEventListener('keydown', event => handleCustomSelectTriggerKeydown(instance, event))
    select.addEventListener('change', () => refreshCustomSelect(instance))
    if (search) {
        search.addEventListener('input', () => filterCustomSelectOptions(instance))
        search.addEventListener('keydown', event =>
            handleCustomSelectSearchKeydown(instance, event),
        )
    }

    select.classList.add('native-select-enhanced')
    select.tabIndex = -1
    select.setAttribute('aria-hidden', 'true')
    select.parentElement.appendChild(root)
    document.body.appendChild(popover)
    customSelectInstances.set(select, instance)
    refreshCustomSelect(instance)
}

function getCustomSelectLabel(select) {
    const explicitLabel = select.getAttribute('aria-label')
    if (explicitLabel) return explicitLabel
    const parentLabel = select.parentElement && select.parentElement.querySelector('span')
    return parentLabel ? parentLabel.textContent.trim() : '选择一个选项'
}

function refreshCustomSelects() {
    customSelectInstances.forEach(refreshCustomSelect)
}

function refreshCustomSelect(instance) {
    const selectedOption = Array.from(instance.select.options || []).find(
        option => option.value === instance.select.value,
    )
    instance.triggerText.textContent = selectedOption ? selectedOption.textContent.trim() : '请选择'
    instance.trigger.disabled = instance.select.disabled
    instance.options.forEach(option => {
        const selected = option.dataset.value === instance.select.value
        option.classList.toggle('is-selected', selected)
        option.setAttribute('aria-selected', String(selected))
        option.querySelector('.custom-select-option-mark').textContent = ''
    })
    if (instance.select.disabled && activeCustomSelect === instance) closeCustomSelect(instance)
}

function openCustomSelect(instance) {
    if (instance.trigger.disabled) return
    if (activeCustomSelect && activeCustomSelect !== instance) closeCustomSelect(activeCustomSelect)
    activeCustomSelect = instance
    refreshCustomSelect(instance)
    resetCustomSelectFilter(instance)
    instance.popover.hidden = false
    instance.trigger.setAttribute('aria-expanded', 'true')
    positionCustomSelect(instance)
    if (instance.search) {
        instance.search.focus()
    } else {
        focusSelectedCustomSelectOption(instance)
    }
}

function closeCustomSelect(instance, restoreFocus = false) {
    if (!instance) return
    instance.popover.hidden = true
    instance.trigger.setAttribute('aria-expanded', 'false')
    resetCustomSelectFilter(instance)
    if (activeCustomSelect === instance) activeCustomSelect = null
    if (restoreFocus) instance.trigger.focus()
}

function positionActiveCustomSelect(event) {
    if (!activeCustomSelect || activeCustomSelect.popover.hidden) return
    if (event && activeCustomSelect.popover.contains(event.target)) return
    positionCustomSelect(activeCustomSelect)
}

function positionCustomSelect(instance) {
    const rect = instance.trigger.getBoundingClientRect()
    const viewportWidth = document.documentElement.clientWidth || window.innerWidth
    const viewportHeight = document.documentElement.clientHeight || window.innerHeight
    const gap = 6
    const edge = 8
    const width = Math.min(Math.max(rect.width, 240), viewportWidth - edge * 2)
    instance.popover.style.width = `${width}px`
    instance.popover.style.maxHeight = `${Math.max(180, viewportHeight - edge * 2)}px`
    const measuredHeight = Math.min(instance.popover.scrollHeight || 360, viewportHeight - edge * 2)
    const spaceBelow = viewportHeight - rect.bottom - gap - edge
    const spaceAbove = rect.top - gap - edge
    const openAbove = spaceBelow < Math.min(measuredHeight, 220) && spaceAbove > spaceBelow
    const left = Math.min(Math.max(edge, rect.left), viewportWidth - width - edge)
    const top = openAbove
        ? Math.max(edge, rect.top - measuredHeight - gap)
        : Math.min(rect.bottom + gap, viewportHeight - measuredHeight - edge)
    instance.popover.style.left = `${Math.round(left)}px`
    instance.popover.style.top = `${Math.round(top)}px`
    instance.popover.dataset.placement = openAbove ? 'top' : 'bottom'
}

function handleCustomSelectOutsidePointer(event) {
    if (!activeCustomSelect) return
    if (
        activeCustomSelect.root.contains(event.target) ||
        activeCustomSelect.popover.contains(event.target)
    ) {
        return
    }
    closeCustomSelect(activeCustomSelect)
}

function selectCustomSelectOption(instance, option) {
    if (option.disabled) return
    instance.select.value = option.dataset.value
    try {
        instance.select.dispatchEvent(new Event('change', { bubbles: true }))
    } finally {
        refreshCustomSelect(instance)
        closeCustomSelect(instance, true)
    }
}

function handleCustomSelectTriggerKeydown(instance, event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        openCustomSelect(instance)
        if (!instance.search) {
            focusCustomSelectEdge(instance, event.key === 'ArrowDown' ? 'first' : 'last')
        }
    } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        openCustomSelect(instance)
    }
}

function handleCustomSelectOptionKeydown(instance, event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        moveCustomSelectFocus(instance, event.currentTarget, event.key === 'ArrowDown' ? 1 : -1)
    } else if (event.key === 'Home' || event.key === 'End') {
        event.preventDefault()
        focusCustomSelectEdge(instance, event.key === 'Home' ? 'first' : 'last')
    } else if (event.key === 'Escape') {
        event.preventDefault()
        closeCustomSelect(instance, true)
    } else if (event.key === 'Tab') {
        closeCustomSelect(instance)
    }
}

function handleCustomSelectSearchKeydown(instance, event) {
    if (event.key === 'ArrowDown') {
        event.preventDefault()
        focusCustomSelectEdge(instance, 'first')
    } else if (event.key === 'Escape') {
        event.preventDefault()
        closeCustomSelect(instance, true)
    } else if (event.key === 'Tab') {
        closeCustomSelect(instance)
    }
}

function getVisibleCustomSelectOptions(instance) {
    return instance.options.filter(option => !option.hidden && !option.disabled)
}

function moveCustomSelectFocus(instance, currentOption, direction) {
    const options = getVisibleCustomSelectOptions(instance)
    if (!options.length) return
    const currentIndex = Math.max(0, options.indexOf(currentOption))
    const nextIndex = (currentIndex + direction + options.length) % options.length
    options[nextIndex].focus()
}

function focusCustomSelectEdge(instance, edge) {
    const options = getVisibleCustomSelectOptions(instance)
    if (!options.length) return
    options[edge === 'last' ? options.length - 1 : 0].focus()
}

function focusSelectedCustomSelectOption(instance) {
    const selected = instance.options.find(option => option.classList.contains('is-selected'))
    const fallback = getVisibleCustomSelectOptions(instance)[0]
    if (selected || fallback) (selected || fallback).focus()
}

function filterCustomSelectOptions(instance) {
    const query = instance.search.value.trim().toLocaleLowerCase()
    let visibleCount = 0
    instance.options.forEach(option => {
        const visible = !query || option.dataset.search.includes(query)
        option.hidden = !visible
        if (visible) visibleCount += 1
    })
    instance.empty.hidden = visibleCount > 0
}

function resetCustomSelectFilter(instance) {
    if (instance.search) instance.search.value = ''
    instance.options.forEach(option => {
        option.hidden = false
    })
    instance.empty.hidden = true
}

initializeCustomSelects()
if (typeof document.addEventListener === 'function') {
    document.addEventListener('input', scheduleWorkbenchPersistence, true)
    document.addEventListener('change', scheduleWorkbenchPersistence, true)
}
