/* global define */

/*
 * WheelCanvasJS v1.0.0
 * Copyright 2026 WheelCanvasJS contributors
 * Includes work Copyright 2021 Li Dong Qi; see NOTICE.
 * SPDX-License-Identifier: Apache-2.0
 *
 * This file is the maintained UMD source entry, not a generated Rollup artifact.
 * Browser usage:
 *
 *   new WheelCanvasJS.WheelCanvas('#wheel-canvas', options)
 */
;(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory)
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory()
    } else {
        root.WheelCanvasJS = factory()
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict'

    const VERSION = '1.0.0'
    const FRAME_DURATION = 1000 / 60
    const TWO_PI = Math.PI * 2
    const PHYSICS_CALLBACK_FAILED = Symbol('WheelCanvasPhysicsCallbackFailed')

    const DEFAULT_CONFIG = {
        gutter: 0,
        offsetDegree: 0,
        speed: 20,
        speedFunction: 'quad',
        accelerationTime: 2500,
        decelerationTime: 2500,
        stopRange: 0,
        useGraphicWeight: false,
        graphicWeightSource: 'auto',
        maxDpr: 3,
        maxCanvasPixels: 16777216,
        imageConcurrency: 6,
    }

    const DEFAULT_STYLE = {
        background: 'rgba(0, 0, 0, 0)',
        fontColor: '#000',
        fontSize: '18px',
        fontStyle: 'sans-serif',
        fontWeight: '400',
        lineHeight: null,
        wordWrap: true,
        lengthLimit: '90%',
        lineClamp: Infinity,
        orientation: 'horizontal',
        top: 0,
        left: 0,
        textAlign: 'center',
        verticalAlign: 'middle',
        textOverflow: 'ellipsis',
        ellipsis: '...',
    }

    const DEFAULT_PHYSICS = {
        enabled: false,
        sensitivity: 1,
        dragThreshold: 6,
        innerRadius: '8%',
        minVelocity: 36,
        maxVelocity: 1800,
        friction: 24,
        drag: 0.68,
        stopVelocity: 3,
        waitingVelocity: 72,
        waitingStrategy: 'hold',
        velocitySmoothing: 1,
        sampleWindow: 110,
        sampleHalfLife: 55,
        releaseWindow: 180,
        releaseDamping: 7,
        maxSubstep: 10,
        maxCatchUp: 220,
        minLandingTurns: 0,
        maxLandingTurns: 10,
        minLandingDuration: 280,
        maxLandingDuration: 12000,
        accelerationBlendDuration: 120,
        maxBrake: 2400,
        maxJerk: 50000,
        landingSamples: 96,
        forbidSpeedUp: true,
        errorStrategy: 'coast',
        resultTimeout: 10000,
        dragFrom: 'prizes',
        direction: 'both',
        resultMode: 'natural',
        snapToPrize: false,
    }

    const DEFAULT_FEEDBACK = {
        enabled: true,
        sound: {
            enabled: false,
            pack: 'mechanical',
            sectorCue: 'snap',
            resultCue: 'reward',
            volume: 0.3,
            minInterval: 35,
        },
        celebration: {
            enabled: false,
            style: 'subtle',
            particleCount: 48,
            disableForReducedMotion: true,
        },
    }

    function createFeedbackConfig(source) {
        const config = source && typeof source === 'object' ? source : {}
        const sound = config.sound && typeof config.sound === 'object' ? config.sound : {}
        const celebration =
            config.celebration && typeof config.celebration === 'object' ? config.celebration : {}
        return {
            ...DEFAULT_FEEDBACK,
            ...config,
            sound: { ...DEFAULT_FEEDBACK.sound, ...sound },
            celebration: { ...DEFAULT_FEEDBACK.celebration, ...celebration },
        }
    }

    const POINTER_POSITIONS = {
        top: 0,
        right: 90,
        bottom: 180,
        left: 270,
    }

    const CENTER_POINTER_PRESET_SIZES = Object.freeze({
        minimal: Object.freeze({ width: '58%', height: '78%' }),
        classic: Object.freeze({ width: '100%', height: '108%' }),
        flapper: Object.freeze({ width: '72%', height: '122%' }),
        wedge: Object.freeze({ width: '108%', height: '86%' }),
        needle: Object.freeze({ width: '18%', height: '142%' }),
        pin: Object.freeze({ width: '62%', height: '126%' }),
        glass: Object.freeze({ width: '72%', height: '122%' }),
        jewel: Object.freeze({ width: '76%', height: '126%' }),
        triangle: Object.freeze({ width: '88%', height: '82%' }),
        kite: Object.freeze({ width: '68%', height: '126%' }),
        arrow: Object.freeze({ width: '82%', height: '128%' }),
        chevron: Object.freeze({ width: '108%', height: '88%' }),
        diamond: Object.freeze({ width: '68%', height: '128%' }),
        notch: Object.freeze({ width: '102%', height: '106%' }),
        teardrop: Object.freeze({ width: '62%', height: '128%' }),
        spear: Object.freeze({ width: '38%', height: '146%' }),
        soft: Object.freeze({ width: '82%', height: '88%' }),
        tab: Object.freeze({ width: '90%', height: '80%' }),
        dart: Object.freeze({ width: '68%', height: '132%' }),
        shield: Object.freeze({ width: '88%', height: '108%' }),
        ribbon: Object.freeze({ width: '86%', height: '122%' }),
    })

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value))
    }

    function normalizeDegree(degree) {
        return ((degree % 360) + 360) % 360
    }

    function signedDegreeDelta(nextDegree, previousDegree) {
        const delta = normalizeDegree(nextDegree - previousDegree)
        return delta > 180 ? delta - 360 : delta
    }

    function degreeToRadian(degree) {
        return (degree * Math.PI) / 180
    }

    function easeInQuad(progress) {
        return progress * progress
    }

    function easeOutQuad(progress) {
        return 1 - Math.pow(1 - progress, 2)
    }

    const EASING = {
        quad: {
            easeIn: easeInQuad,
            easeOut: easeOutQuad,
        },
        cubic: {
            easeIn: progress => Math.pow(progress, 3),
            easeOut: progress => 1 - Math.pow(1 - progress, 3),
        },
        quart: {
            easeIn: progress => Math.pow(progress, 4),
            easeOut: progress => 1 - Math.pow(1 - progress, 4),
        },
        quint: {
            easeIn: progress => Math.pow(progress, 5),
            easeOut: progress => 1 - Math.pow(1 - progress, 5),
        },
        sine: {
            easeIn: progress => 1 - Math.cos((progress * Math.PI) / 2),
            easeOut: progress => Math.sin((progress * Math.PI) / 2),
        },
        expo: {
            easeIn: progress => (progress === 0 ? 0 : Math.pow(2, 10 * progress - 10)),
            easeOut: progress => (progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)),
        },
        circ: {
            easeIn: progress => 1 - Math.sqrt(1 - Math.pow(progress, 2)),
            easeOut: progress => Math.sqrt(1 - Math.pow(progress - 1, 2)),
        },
    }

    function hasOwn(object, key) {
        return Object.prototype.hasOwnProperty.call(object, key)
    }

    function hasBackground(color) {
        if (typeof color !== 'string') return false
        const value = color.trim().toLowerCase()
        if (!value || value === 'transparent') return false
        if (/^#[0-9a-f]{4}$/.test(value) && value.endsWith('0')) return false
        if (/^#[0-9a-f]{8}$/.test(value) && value.endsWith('00')) return false
        const slashAlpha = value.match(/\/\s*([+-]?(?:\d*\.)?\d+%?)\s*\)$/)
        if (slashAlpha) return Number.parseFloat(slashAlpha[1]) !== 0
        const legacyAlpha = value.match(/^(?:rgba|hsla)\([^)]*,\s*([^,\s)]+)\s*\)$/)
        return !legacyAlpha || Number.parseFloat(legacyAlpha[1]) !== 0
    }

    function getRootFontSize() {
        if (typeof window === 'undefined' || typeof document === 'undefined') return 16
        const value = window.getComputedStyle(document.documentElement).fontSize
        return Number.parseFloat(value) || 16
    }

    /**
     * Converts a number or a CSS-like length into logical canvas pixels.
     * Supported units: px, %, rem, vw and vh.
     */
    function toLength(value, relativeLength, customUnitHandler) {
        if (typeof value === 'number' && Number.isFinite(value)) return value
        if (typeof value !== 'string') return 0

        const text = value.trim()
        const match = text.match(/^(-?\d+(?:\.\d+)?)\s*([a-z%]*)$/i)
        if (!match) return Number.parseFloat(text) || 0

        const number = Number(match[1])
        const unit = (match[2] || 'px').toLowerCase()
        if (unit === '%') return (number / 100) * (relativeLength || 0)
        if (unit === 'rem') return number * getRootFontSize()
        if (unit === 'vw' && typeof window !== 'undefined')
            return (number / 100) * window.innerWidth
        if (unit === 'vh' && typeof window !== 'undefined')
            return (number / 100) * window.innerHeight
        if (unit && unit !== 'px' && typeof customUnitHandler === 'function') {
            return Number(customUnitHandler(number, unit)) || 0
        }
        return number
    }

    function resolveElement(target) {
        if (typeof document === 'undefined') {
            throw new Error('WheelCanvas can only be instantiated in a browser document')
        }
        if (typeof target === 'string') {
            const element = document.querySelector(target)
            if (!element) throw new Error(`WheelCanvas target was not found: ${target}`)
            return element
        }
        if (target && target.nodeType === 1) return target
        throw new TypeError('WheelCanvas target must be a selector or an Element')
    }

    function chooseByWeight(prizes, randomProvider = Math.random) {
        const rawWeights = prizes.map(prize => {
            const weight = Number(prize.range)
            return Number.isFinite(weight) && weight > 0 ? weight : 0
        })
        const maxWeight = rawWeights.reduce((max, weight) => Math.max(max, weight), 0)
        if (maxWeight <= 0) return -1
        const weights = rawWeights.map(weight => weight / maxWeight)
        const total = weights.reduce((sum, weight) => sum + weight, 0)

        const randomValue = Number(randomProvider())
        const normalizedRandom = Number.isFinite(randomValue)
            ? clamp(randomValue, 0, 1 - Number.EPSILON)
            : 0
        let random = normalizedRandom * total
        for (let index = 0; index < weights.length; index += 1) {
            if (weights[index] <= 0) continue
            if (random < weights[index]) return index
            random -= weights[index]
        }
        return Math.max(0, prizes.length - 1)
    }

    function resolveTextWidth(maxWidth, lineIndex) {
        const width = typeof maxWidth === 'function' ? maxWidth(lineIndex) : maxWidth
        return Number.isFinite(width) ? Math.max(0, width) : Infinity
    }

    function fitTextPrefix(ctx, value, width, suffix = '') {
        const characters = Array.from(String(value))
        const source = characters.join('')
        if (!Number.isFinite(width)) return source
        if (width <= 0 || (suffix && ctx.measureText(suffix).width > width)) return ''
        if (ctx.measureText(`${source}${suffix}`).width <= width) return source

        let low = 0
        let high = characters.length
        while (low < high) {
            const middle = Math.ceil((low + high) / 2)
            const candidate = `${characters.slice(0, middle).join('')}${suffix}`
            if (ctx.measureText(candidate).width <= width) {
                low = middle
            } else {
                high = middle - 1
            }
        }
        return characters.slice(0, low).join('')
    }

    function splitLines(ctx, text, maxWidth, lineClamp, textOverflow, ellipsis) {
        const sourceLines = String(text).split('\n')
        const lines = []
        const limit = Number.isFinite(lineClamp) ? Math.max(0, Math.floor(lineClamp)) : Infinity
        if (limit === 0) return []
        let overflowed = false

        outer: for (const sourceLine of sourceLines) {
            if (!sourceLine) {
                lines.push('')
                if (lines.length > limit) {
                    overflowed = true
                    break
                }
                continue
            }
            let line = ''
            for (const character of Array.from(sourceLine)) {
                const candidate = line + character
                const currentMaxWidth = resolveTextWidth(maxWidth, lines.length)
                if (line && ctx.measureText(candidate).width > currentMaxWidth) {
                    lines.push(fitTextPrefix(ctx, line, currentMaxWidth))
                    if (lines.length > limit) {
                        overflowed = true
                        break outer
                    }
                    line = character
                } else {
                    line = candidate
                }
            }
            if (line) {
                lines.push(fitTextPrefix(ctx, line, resolveTextWidth(maxWidth, lines.length)))
                if (lines.length > limit) {
                    overflowed = true
                    break
                }
            }
        }

        if (overflowed || lines.length > limit) {
            const visible = lines.slice(0, limit)
            if (textOverflow === 'clip') return visible
            const lastIndex = visible.length - 1
            const lastMaxWidth = resolveTextWidth(maxWidth, lastIndex)
            const marker = fitTextPrefix(
                ctx,
                ellipsis == null ? '...' : String(ellipsis),
                lastMaxWidth,
            )
            const last = fitTextPrefix(ctx, visible[lastIndex], lastMaxWidth, marker)
            visible[lastIndex] = `${last}${marker}`
            return visible
        }
        return lines
    }

    function splitUnwrappedLines(ctx, text, maxWidth, lineClamp, textOverflow, ellipsis) {
        const sourceLines = String(text).split('\n')
        const limit = Number.isFinite(lineClamp) ? Math.max(0, Math.floor(lineClamp)) : Infinity
        if (limit === 0) return []

        const visible = sourceLines.slice(0, limit)
        return visible.map((line, lineIndex) => {
            const width = resolveTextWidth(maxWidth, lineIndex)
            const omittedLine =
                lineIndex === visible.length - 1 && sourceLines.length > visible.length
            const overflows = Number.isFinite(width) && ctx.measureText(line).width > width
            if (!overflows && !omittedLine) return line
            if (textOverflow === 'clip') return fitTextPrefix(ctx, line, width)
            const marker = fitTextPrefix(ctx, ellipsis == null ? '...' : String(ellipsis), width)
            return `${fitTextPrefix(ctx, line, width, marker)}${marker}`
        })
    }

    function splitVerticalText(text, lineClamp, textOverflow, ellipsis) {
        const characters = Array.from(String(text).replace(/\n/g, ''))
        const limit = Number.isFinite(lineClamp) ? Math.max(0, Math.floor(lineClamp)) : Infinity
        if (characters.length <= limit) return characters
        if (limit === 0) return []
        const visible = characters.slice(0, limit)
        if (textOverflow !== 'clip') {
            visible[visible.length - 1] = ellipsis == null ? '…' : String(ellipsis)
        }
        return visible
    }

    function requestFrame(callback) {
        if (typeof window !== 'undefined' && window.requestAnimationFrame) {
            return window.requestAnimationFrame(callback)
        }
        return setTimeout(() => callback(Date.now()), FRAME_DURATION)
    }

    function cancelFrame(frameId) {
        if (typeof window !== 'undefined' && window.cancelAnimationFrame) {
            window.cancelAnimationFrame(frameId)
        } else {
            clearTimeout(frameId)
        }
    }

    function nowTimestamp() {
        if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
            return performance.now()
        }
        return Date.now()
    }

    function deepSnapshot(value) {
        const seen = new WeakSet()
        return JSON.stringify(value, (key, entry) => {
            if (typeof entry === 'bigint') return `__bigint__:${entry.toString()}`
            if (entry && typeof entry === 'object') {
                if (seen.has(entry)) return '__circular__'
                seen.add(entry)
            }
            return entry
        })
    }

    class WheelCanvas {
        constructor(targetOrConfig, data) {
            const usesHostConfig =
                targetOrConfig &&
                typeof targetOrConfig === 'object' &&
                targetOrConfig.nodeType !== 1
            this.config = usesHostConfig ? Object.assign({}, targetOrConfig) : {}
            this.options = data || {}

            if (!usesHostConfig) {
                if (typeof targetOrConfig === 'string') this.config.el = targetOrConfig
                else if (targetOrConfig && targetOrConfig.nodeType === 1) {
                    if (String(targetOrConfig.tagName).toLowerCase() === 'canvas') {
                        this.config.canvasElement = targetOrConfig
                    } else {
                        this.config.divElement = targetOrConfig
                    }
                }
            }

            this.config.flag = this.config.flag || 'WEB'
            const hostTarget =
                this.config.divElement ||
                this.config.canvasElement ||
                (this.config.ctx && this.config.ctx.canvas) ||
                this.config.el
            this.element = resolveElement(hostTarget)

            this.version = VERSION
            this.rotation = 0
            this.state = 'idle'
            this.currentPrizeIndex = -1
            this.maxButtonRadius = 0
            this.prizeRadius = 0
            this.wheelRadius = 0
            this.imageCache = new Map()
            this._imageResults = new WeakMap()
            this._imagePromises = new WeakMap()
            this._rawImagePromises = new Map()
            this._pendingImageLoads = new Set()
            this._activeImageSources = new Set()
            this._activeImageLoads = 0
            this._imageLoadQueue = []

            this._frameId = null
            this._lastFrameTime = 0
            this._phaseStartTime = 0
            this._targetIndex = null
            this._decelerationFrom = 0
            this._decelerationTo = 0
            this._decelerationTangent = 0
            this._currentSpeed = 0
            this._physicsVelocity = 0
            this._physicsAcceleration = 0
            this._physicsLandingFrom = 0
            this._physicsLandingTo = 0
            this._physicsLandingDuration = 0
            this._physicsLandingCoefficients = null
            this._physicsLandingSegments = null
            this._physicsResultToken = null
            this._physicsResultTimer = null
            this._physicsOutcomeCancelled = false
            this._gesture = null
            this._suppressClick = false
            this._activeLayout = null
            this._activePrizes = null
            this._activeButtons = null
            this._activeOffsetDegree = 0
            this._activePointerDegree = 0
            this._activePointerConfig = null
            this._activePhysicsConfig = null
            this._pointerDirtyDuringSpin = false
            this._buttonDirtyDuringSpin = false
            this._pointerWobbleStartedAt = null
            this._pointerWobbleDirection = 1
            this._pointerRenderWobbleAngle = 0
            this._lastSectorFeedbackAt = -Infinity
            this._renderCacheVersion = 0
            this._prizeLayoutCache = null
            this._geometryCache = null
            this._textLayoutCache = new WeakMap()
            this._dprConfigSignature = null
            this._destroyed = false
            this._reactiveReady = false
            this._reactiveRefreshPending = false
            this._reactiveReloadImages = false
            this._initGeneration = 0
            this._watchStops = new Set()
            this._resizeFrameId = null
            this._createdCanvas = false
            this._canvasSnapshot = null
            this._originalTouchAction = ''
            this._elementStyleSnapshot = this.element.style
                ? {
                      overflow: this.element.style.overflow,
                      width: this.element.style.width,
                      height: this.element.style.height,
                  }
                : null

            this.canvas = this._createCanvas(this.element)
            this._originalTouchAction = (this.canvas.style && this.canvas.style.touchAction) || ''
            this.ctx = this.config.ctx || this.canvas.getContext('2d')
            if (!this.ctx) {
                this._restoreDom()
                throw new Error('The browser does not provide a 2D canvas context')
            }
            this.config.divElement =
                this.element === this.canvas ? this.canvas.parentElement || null : this.element
            this.config.canvasElement = this.canvas
            this.config.ctx = this.ctx
            const browserWindow = typeof window !== 'undefined' ? window : null
            this.config.setTimeout =
                this.config.setTimeout ||
                (browserWindow && browserWindow.setTimeout
                    ? browserWindow.setTimeout.bind(browserWindow)
                    : setTimeout)
            this.config.setInterval =
                this.config.setInterval ||
                (browserWindow && browserWindow.setInterval
                    ? browserWindow.setInterval.bind(browserWindow)
                    : setInterval)
            this.config.clearTimeout =
                this.config.clearTimeout ||
                (browserWindow && browserWindow.clearTimeout
                    ? browserWindow.clearTimeout.bind(browserWindow)
                    : clearTimeout)
            this.config.clearInterval =
                this.config.clearInterval ||
                (browserWindow && browserWindow.clearInterval
                    ? browserWindow.clearInterval.bind(browserWindow)
                    : clearInterval)
            this._requestAnimationFrame = this.config.rAF || requestFrame
            this._cancelAnimationFrame = this.config.cancelAnimationFrame || cancelFrame
            this._nowProvider =
                typeof this.config.now === 'function' ? this.config.now.bind(this) : nowTimestamp
            this._randomProvider =
                typeof this.config.random === 'function'
                    ? this.config.random.bind(this)
                    : Math.random
            this._tickFrame = this._tick.bind(this)

            this._defineReactiveData()
            try {
                this._callHook('beforeCreate')
            } catch (error) {
                this._restoreDom()
                throw error
            }
            if (this._destroyed) {
                this.ready = Promise.resolve()
                return
            }

            this._onClick = this._handleClick.bind(this)
            this._onKeyDown = this._handleKeyDown.bind(this)
            this._onPointerDown = this._handlePointerDown.bind(this)
            this._onPointerMove = this._handlePointerMove.bind(this)
            this._onPointerUp = this._handlePointerUp.bind(this)
            this._onPointerCancel = this._handlePointerCancel.bind(this)
            this._onWindowBlur = () => this._handlePointerCancel({ reason: 'window-blur' }, null)
            this._onResize = this._scheduleResize.bind(this)
            this.canvas.addEventListener('click', this._onClick)
            this.canvas.addEventListener('keydown', this._onKeyDown)
            this.canvas.addEventListener('pointerdown', this._onPointerDown)
            this.canvas.addEventListener('pointermove', this._onPointerMove)
            this.canvas.addEventListener('pointerup', this._onPointerUp)
            this.canvas.addEventListener('pointercancel', this._onPointerCancel)
            this.canvas.addEventListener('lostpointercapture', this._onPointerCancel)
            const getCanvasAttribute = name =>
                this.canvas.getAttribute ? this.canvas.getAttribute(name) : null
            this._manageCanvasRole = getCanvasAttribute('role') == null
            this._manageCanvasTabIndex = getCanvasAttribute('tabindex') == null
            this._manageCanvasBusy = getCanvasAttribute('aria-busy') == null
            this._manageCanvasDisabled = getCanvasAttribute('aria-disabled') == null
            if (!this.canvas.getAttribute || !this.canvas.getAttribute('aria-label')) {
                this.canvas.setAttribute('aria-label', this.options.ariaLabel || '抽奖转盘')
            }
            if (typeof window !== 'undefined') {
                window.addEventListener('resize', this._onResize)
                window.addEventListener('pointermove', this._onPointerMove)
                window.addEventListener('pointerup', this._onPointerUp)
                window.addEventListener('pointercancel', this._onPointerCancel)
                window.addEventListener('blur', this._onWindowBlur)
            }
            if (typeof window !== 'undefined' && typeof window.MutationObserver === 'function') {
                this._fontObserver = new window.MutationObserver(this._onResize)
                this._fontObserver.observe(document.documentElement, { attributes: true })
            }
            if (typeof window !== 'undefined' && typeof window.ResizeObserver === 'function') {
                this._resizeObserver = new window.ResizeObserver(this._onResize)
                this._resizeObserver.observe(this.element.parentElement || this.element)
            }
            if (
                typeof document !== 'undefined' &&
                document.fonts &&
                typeof document.fonts.addEventListener === 'function'
            ) {
                this._fontSet = document.fonts
                this._onFontsChanged = () => {
                    if (this._destroyed) return
                    this._invalidateRenderCaches()
                    this.draw()
                }
                this._fontSet.addEventListener('loadingdone', this._onFontsChanged)
                this._fontSet.addEventListener('loadingerror', this._onFontsChanged)
            }

            this.ready = this.init()
        }

        _defineReactiveData() {
            this._defineReactiveProperty(
                'width',
                this.options.width || this.config.width || 300,
                () => {
                    this.options.width = this.width
                    this.resize()
                },
            )
            this._defineReactiveProperty(
                'height',
                this.options.height || this.config.height || 300,
                () => {
                    this.options.height = this.height
                    this.resize()
                },
            )
            this._defineReactiveProperty('blocks', this.options.blocks || [], () => {
                this.options.blocks = this.blocks
                this._scheduleReactiveRefresh(true)
            })
            this._defineReactiveProperty('prizes', this.options.prizes || [], () => {
                this.options.prizes = this.prizes
                this._cancelForStructuralPrizeChange()
                this._scheduleReactiveRefresh(true)
            })
            this._defineReactiveProperty('buttons', this.options.buttons || [], () => {
                this.options.buttons = this.buttons
                if (this._activeLayout) this._buttonDirtyDuringSpin = true
                this._scheduleReactiveRefresh(true)
            })
            this._defineReactiveProperty('pointer', this.options.pointer || null, () => {
                this.options.pointer = this.pointer
                if (this._activeLayout) this._pointerDirtyDuringSpin = true
                this._scheduleReactiveRefresh(false)
            })
            this._defineReactiveProperty(
                'physics',
                Object.assign({}, DEFAULT_PHYSICS, this.options.physics),
                () => {
                    this.options.physics = this.physics
                    this._syncInteractionStyle()
                    if (!this.physics.enabled && this._gesture) {
                        this._handlePointerCancel({ reason: 'physics-disabled' }, null)
                    }
                },
            )
            this._defineReactiveProperty(
                'feedback',
                createFeedbackConfig(this.options.feedback),
                () => {
                    this.options.feedback = this.feedback
                },
            )
            this._defineReactiveProperty(
                'defaultConfig',
                Object.assign({}, DEFAULT_CONFIG, this.options.defaultConfig),
                () => {
                    this.options.defaultConfig = this.defaultConfig
                    this._scheduleReactiveRefresh(false)
                },
            )
            this._defineReactiveProperty(
                'defaultStyle',
                Object.assign({}, DEFAULT_STYLE, this.options.defaultStyle),
                () => {
                    this.options.defaultStyle = this.defaultStyle
                    this._scheduleReactiveRefresh(false)
                },
            )
            this._defineReactiveProperty(
                'startCallback',
                this.options.start,
                () => {
                    this.options.start = this.startCallback
                },
                false,
            )
            this._defineReactiveProperty(
                'endCallback',
                this.options.end,
                () => {
                    this.options.end = this.endCallback
                },
                false,
            )
            this._defineReactiveProperty(
                'errorCallback',
                this.options.error,
                () => {
                    this.options.error = this.errorCallback
                },
                false,
            )
            this._defineReactiveProperty(
                'onCurrentChangeCallback',
                this.options.onCurrentChange,
                () => {
                    this.options.onCurrentChange = this.onCurrentChangeCallback
                },
                false,
            )
            this.options.width = this.width
            this.options.height = this.height
            this.options.blocks = this.blocks
            this.options.prizes = this.prizes
            this.options.buttons = this.buttons
            this.options.pointer = this.pointer
            this.options.physics = this.physics
            this.options.feedback = this.feedback
            this.options.defaultConfig = this.defaultConfig
            this.options.defaultStyle = this.defaultStyle
            this._reactiveReady = true
        }

        _defineReactiveProperty(name, initialValue, onChange, deep = true) {
            let value = deep ? this._makeReactive(initialValue, onChange) : initialValue
            Object.defineProperty(this, name, {
                configurable: true,
                enumerable: true,
                get: () => value,
                set: nextValue => {
                    value = deep ? this._makeReactive(nextValue, onChange) : nextValue
                    if (this._reactiveReady) onChange()
                },
            })
        }

        _makeReactive(value, onChange, cache) {
            if (!value || typeof value !== 'object' || typeof Proxy !== 'function') return value
            const proxyCache = cache || new WeakMap()
            if (proxyCache.has(value)) return proxyCache.get(value)

            const proxy = new Proxy(value, {
                get: (target, key, receiver) => {
                    return this._makeReactive(
                        Reflect.get(target, key, receiver),
                        onChange,
                        proxyCache,
                    )
                },
                set: (target, key, nextValue, receiver) => {
                    const previousValue = target[key]
                    const changed = Reflect.set(target, key, nextValue, receiver)
                    if (changed && previousValue !== nextValue && this._reactiveReady) onChange()
                    return changed
                },
                deleteProperty: (target, key) => {
                    const existed = hasOwn(target, key)
                    const changed = Reflect.deleteProperty(target, key)
                    if (changed && existed && this._reactiveReady) onChange()
                    return changed
                },
            })
            proxyCache.set(value, proxy)
            return proxy
        }

        _scheduleReactiveRefresh(reloadImages) {
            if (!this._reactiveReady || this._destroyed) return
            this._invalidateRenderCaches()
            this._reactiveReloadImages = this._reactiveReloadImages || reloadImages
            if (this._reactiveRefreshPending) return
            this._reactiveRefreshPending = true
            Promise.resolve().then(async () => {
                this._reactiveRefreshPending = false
                const shouldReloadImages = this._reactiveReloadImages
                this._reactiveReloadImages = false
                if (this._destroyed) return
                if (shouldReloadImages) await this._loadImages()
                if (this._destroyed) return
                if (this._dprConfigSignature !== this._getDprConfigSignature()) {
                    this.resize()
                    return
                }
                this.draw()
            })
        }

        _invalidateRenderCaches() {
            this._renderCacheVersion += 1
            this._prizeLayoutCache = null
            this._geometryCache = null
            this._textLayoutCache = new WeakMap()
        }

        _getDprConfigSignature() {
            const deviceDpr =
                typeof window !== 'undefined' && Number.isFinite(Number(window.devicePixelRatio))
                    ? Number(window.devicePixelRatio)
                    : 1
            return [
                this.config.dpr,
                this.defaultConfig.dpr,
                this.defaultConfig.maxDpr,
                this.defaultConfig.maxCanvasPixels,
                deviceDpr,
            ].join('\u0001')
        }

        _limitDpr(value, logicalWidth, logicalHeight) {
            let dpr = Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : 1
            const maxDpr = Number(this.defaultConfig.maxDpr)
            if (maxDpr > 0) dpr = Math.min(dpr, maxDpr)
            const maxCanvasPixels = Number(this.defaultConfig.maxCanvasPixels)
            const logicalPixels = logicalWidth * logicalHeight
            if (maxCanvasPixels > 0 && logicalPixels > 0) {
                dpr = Math.min(dpr, Math.sqrt(maxCanvasPixels / logicalPixels))
            }
            return Math.max(Number.EPSILON, dpr)
        }

        _createCanvas(element) {
            if (this.config.canvasElement) {
                this._captureCanvasState(this.config.canvasElement)
                this.config.canvasElement.dataset.wheelCanvas = 'true'
                this.config.canvasElement.setAttribute('package', `wheel-canvas-js@${VERSION}`)
                return this.config.canvasElement
            }
            if (element.tagName && element.tagName.toLowerCase() === 'canvas') {
                this._captureCanvasState(element)
                element.dataset.wheelCanvas = 'true'
                element.setAttribute('package', `wheel-canvas-js@${VERSION}`)
                return element
            }

            let canvas = element.querySelector('canvas[data-wheel-canvas="true"]')
            if (!canvas) {
                canvas = document.createElement('canvas')
                this._createdCanvas = true
                canvas.dataset.wheelCanvas = 'true'
                element.appendChild(canvas)
            } else {
                this._captureCanvasState(canvas)
            }
            canvas.setAttribute('package', `wheel-canvas-js@${VERSION}`)
            return canvas
        }

        _captureCanvasState(canvas) {
            if (this._canvasSnapshot || !canvas) return
            const getAttribute = name =>
                typeof canvas.getAttribute === 'function' ? canvas.getAttribute(name) : null
            this._canvasSnapshot = {
                width: canvas.width,
                height: canvas.height,
                style: canvas.style
                    ? {
                          width: canvas.style.width,
                          height: canvas.style.height,
                          display: canvas.style.display,
                          touchAction: canvas.style.touchAction,
                      }
                    : null,
                attributes: {
                    package: getAttribute('package'),
                    role: getAttribute('role'),
                    tabindex: getAttribute('tabindex'),
                    ariaLabel: getAttribute('aria-label'),
                    ariaBusy: getAttribute('aria-busy'),
                    ariaDisabled: getAttribute('aria-disabled'),
                    wheelCanvas: getAttribute('data-wheel-canvas'),
                },
            }
        }

        _restoreAttribute(element, name, value) {
            if (!element) return
            if (value == null) {
                if (typeof element.removeAttribute === 'function') element.removeAttribute(name)
            } else if (typeof element.setAttribute === 'function') {
                element.setAttribute(name, value)
            }
        }

        _restoreDom() {
            if (this._createdCanvas) {
                if (
                    this.canvas.parentNode &&
                    typeof this.canvas.parentNode.removeChild === 'function'
                ) {
                    this.canvas.parentNode.removeChild(this.canvas)
                }
            } else if (this._canvasSnapshot) {
                const snapshot = this._canvasSnapshot
                this.canvas.width = snapshot.width
                this.canvas.height = snapshot.height
                if (snapshot.style && this.canvas.style) {
                    Object.assign(this.canvas.style, snapshot.style)
                }
                this._restoreAttribute(this.canvas, 'package', snapshot.attributes.package)
                this._restoreAttribute(this.canvas, 'role', snapshot.attributes.role)
                this._restoreAttribute(this.canvas, 'tabindex', snapshot.attributes.tabindex)
                this._restoreAttribute(this.canvas, 'aria-label', snapshot.attributes.ariaLabel)
                this._restoreAttribute(this.canvas, 'aria-busy', snapshot.attributes.ariaBusy)
                this._restoreAttribute(
                    this.canvas,
                    'aria-disabled',
                    snapshot.attributes.ariaDisabled,
                )
                this._restoreAttribute(
                    this.canvas,
                    'data-wheel-canvas',
                    snapshot.attributes.wheelCanvas,
                )
                if (snapshot.attributes.wheelCanvas == null && this.canvas.dataset) {
                    delete this.canvas.dataset.wheelCanvas
                }
            }
            if (this._elementStyleSnapshot && this.element.style && this.element !== this.canvas) {
                Object.assign(this.element.style, this._elementStyleSnapshot)
            }
        }

        _callHook(name, ...args) {
            const callback = this.config[name] || this.options[name]
            if (typeof callback === 'function') return callback.apply(this, args)
        }

        _syncAccessibilityState() {
            if (!this.canvas || this._destroyed) return
            const canStart = typeof this.startCallback === 'function' && this.maxButtonRadius > 0
            const busy = this.state !== 'idle'
            if (this._manageCanvasRole) {
                this._restoreAttribute(this.canvas, 'role', canStart ? 'button' : null)
            }
            if (this._manageCanvasTabIndex) {
                this._restoreAttribute(this.canvas, 'tabindex', canStart ? '0' : null)
            }
            if (this._manageCanvasBusy) {
                this._restoreAttribute(this.canvas, 'aria-busy', String(busy))
            }
            if (this._manageCanvasDisabled) {
                this._restoreAttribute(this.canvas, 'aria-disabled', String(!canStart || busy))
            }
        }

        getLength(value, relativeLength) {
            const customUnitHandler = this.config.handleCssUnit || this.config.unitFunc
            return toLength(value, relativeLength, customUnitHandler)
        }

        changeUnits(value, relativeLength) {
            return this.getLength(value, relativeLength)
        }

        getOffsetX(width, maxWidth) {
            return ((maxWidth || 0) - width) / 2
        }

        clearCanvas() {
            if (!this.ctx) return
            this.ctx.setTransform(1, 0, 0, 1, 0, 0)
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        }

        isWeb() {
            return ['WEB', 'UNI-H5', 'TARO-H5'].includes(this.config.flag)
        }

        loadImg(src, info) {
            const imageInfo = info || { src }
            return new Promise((resolve, reject) => {
                if (!src) {
                    reject(new Error(`'${imageInfo.src || ''}' 不能为空或不合法`))
                    return
                }
                const image = new Image()
                let settled = false
                let timeoutId = null
                const cleanup = () => {
                    if (timeoutId != null) this.config.clearTimeout(timeoutId)
                    this._pendingImageLoads.delete(abort)
                    image.onload = null
                    image.onerror = null
                }
                const finish = (callback, value) => {
                    if (settled) return
                    settled = true
                    cleanup()
                    callback(value)
                }
                const abort = () => {
                    finish(reject, new Error(`'${src}' 图片加载已取消`))
                    try {
                        image.src = ''
                    } catch (error) {}
                }
                image.crossOrigin = imageInfo.crossOrigin || 'anonymous'
                image.onload = () => finish(resolve, image)
                image.onerror = () => finish(reject, new Error(`'${src}' 图片加载失败`))
                const configuredTimeout = hasOwn(imageInfo, 'timeout')
                    ? imageInfo.timeout
                    : hasOwn(this.config, 'imageTimeout')
                      ? this.config.imageTimeout
                      : 30000
                const timeout = Math.max(0, Number(configuredTimeout) || 0)
                if (timeout > 0) {
                    timeoutId = this.config.setTimeout(() => {
                        finish(reject, new Error(`'${src}' 图片加载超时`))
                    }, timeout)
                }
                this._pendingImageLoads.add(abort)
                image.src = src
            })
        }

        drawImage(ctx, image, ...rectInfo) {
            try {
                ctx.drawImage(image, ...rectInfo)
            } catch (error) {
                // Keep drawing resilient to transient Safari image errors.
            }
        }

        computedWidthAndHeight(image, imageInfo, maxWidth, maxHeight) {
            const size = this._imageSize(image, imageInfo, maxWidth, maxHeight)
            return [size.width, size.height]
        }

        getOffscreenCanvas(width, height) {
            if (!this._offscreenCanvas) {
                this._offscreenCanvas =
                    this.config.offscreenCanvas || document.createElement('canvas')
            }
            const widthValue = Number(width)
            const heightValue = Number(height)
            const logicalWidth = Number.isFinite(widthValue) && widthValue > 0 ? widthValue : 300
            const logicalHeight =
                Number.isFinite(heightValue) && heightValue > 0 ? heightValue : 150
            const dpr = this._limitDpr(this.dpr, logicalWidth, logicalHeight)
            const canvas = this._offscreenCanvas
            canvas.width = Math.round(logicalWidth * dpr)
            canvas.height = Math.round(logicalHeight * dpr)
            const ctx = canvas.getContext('2d')
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.scale(dpr, dpr)
            ctx.dpr = dpr
            return { _offscreenCanvas: canvas, _ctx: ctx }
        }

        $set(data, key, value) {
            if (!data || typeof data !== 'object') return
            data[key] = value
        }

        $computed(data, key, callback) {
            Object.defineProperty(data, key, {
                configurable: true,
                enumerable: true,
                get: () => callback.call(this),
            })
        }

        $watch(expression, handler, watchOptions) {
            const options = typeof handler === 'object' ? handler : watchOptions || {}
            const callback = typeof handler === 'object' ? handler.handler : handler
            if (typeof callback !== 'function') {
                throw new TypeError('WheelCanvas.$watch requires a function handler')
            }
            const getter =
                typeof expression === 'function'
                    ? expression.bind(this)
                    : () =>
                          String(expression)
                              .split('.')
                              .reduce((value, key) => {
                                  return value == null ? value : value[key]
                              }, this)
            const snapshot = value => (options.deep ? deepSnapshot(value) : value)
            let previousValue = getter()
            let previousSnapshot = snapshot(previousValue)
            if (options.immediate && typeof callback === 'function') {
                callback.call(this, previousValue)
            }
            const timer = this.config.setInterval(() => {
                if (this._destroyed) return
                const nextValue = getter()
                const nextSnapshot = snapshot(nextValue)
                if (nextSnapshot !== previousSnapshot) {
                    const oldValue = previousValue
                    previousValue = nextValue
                    previousSnapshot = nextSnapshot
                    callback.call(this, nextValue, oldValue)
                }
            }, 16)
            const stop = () => {
                this.config.clearInterval(timer)
                this._watchStops.delete(stop)
            }
            this._watchStops.add(stop)
            return stop
        }

        _logicalSize(value, fallback, relativeLength) {
            const size = this.getLength(value, relativeLength)
            return Number.isFinite(size) && size > 0 ? size : fallback
        }

        _contentBoxLength(element, axis) {
            if (!element) return 0
            const isWidth = axis === 'width'
            const clientLength = Number(isWidth ? element.clientWidth : element.clientHeight)
            if (!(clientLength > 0)) return 0
            if (typeof window === 'undefined' || typeof window.getComputedStyle !== 'function') {
                return clientLength
            }
            try {
                const style = window.getComputedStyle(element)
                const start = Number.parseFloat(isWidth ? style.paddingLeft : style.paddingTop) || 0
                const end =
                    Number.parseFloat(isWidth ? style.paddingRight : style.paddingBottom) || 0
                return Math.max(0, clientLength - start - end)
            } catch (_error) {
                return clientLength
            }
        }

        setSize(width, height) {
            if (this._destroyed) return
            const reactiveState = this._reactiveReady
            this._reactiveReady = false
            this.width = width
            this.height = height == null ? width : height
            this.options.width = this.width
            this.options.height = this.height
            this._reactiveReady = reactiveState
            this.resize()
        }

        resize() {
            if (this._destroyed) return
            this._callHook('beforeResize')
            if (this._destroyed) return

            const referenceElement = this.element.parentElement
            const parentWidth =
                this._contentBoxLength(referenceElement, 'width') || this.element.clientWidth || 300
            const parentHeight =
                this._contentBoxLength(referenceElement, 'height') ||
                this.element.clientHeight ||
                parentWidth
            const desiredWidth = this._logicalSize(this.width, 300, parentWidth)
            const desiredHeight = this._logicalSize(this.height, desiredWidth, parentHeight)
            const widthScale = referenceElement && parentWidth > 0 ? parentWidth / desiredWidth : 1
            const heightScale =
                referenceElement && parentHeight > 0 ? parentHeight / desiredHeight : 1
            const containerScale = Math.min(1, widthScale, heightScale)
            this.boxWidth = desiredWidth * containerScale
            this.boxHeight = desiredHeight * containerScale
            this.radius = Math.min(this.boxWidth, this.boxHeight) / 2
            this.wheelRadius = this.radius
            this.centerX = this.boxWidth / 2
            this.centerY = this.boxHeight / 2

            const configuredDpr = Number(this.config.dpr || this.defaultConfig.dpr)
            const deviceDpr = Number(
                (typeof window !== 'undefined' && window.devicePixelRatio) || 1,
            )
            let dpr =
                Number.isFinite(configuredDpr) && configuredDpr > 0
                    ? configuredDpr
                    : Number.isFinite(deviceDpr) && deviceDpr > 0
                      ? Math.max(1, deviceDpr)
                      : 1
            this.dpr = this._limitDpr(dpr, this.boxWidth, this.boxHeight)
            this._dprConfigSignature = this._getDprConfigSignature()
            this._invalidateRenderCaches()

            this.canvas.width = Math.round(this.boxWidth * this.dpr)
            this.canvas.height = Math.round(this.boxHeight * this.dpr)
            this.canvas.style.width = `${this.boxWidth}px`
            this.canvas.style.height = `${this.boxHeight}px`
            this.canvas.style.display = 'block'
            this._syncInteractionStyle()

            if (this.element !== this.canvas) {
                this.element.style.overflow = 'hidden'
                this.element.style.width = `${this.boxWidth}px`
                this.element.style.height = `${this.boxHeight}px`
            }

            this.draw()
            if (this._destroyed) return
            this._callHook('afterResize')
        }

        _scheduleResize() {
            if (this._destroyed || this._resizeFrameId != null) return
            this._resizeFrameId = this._requestAnimationFrame(() => {
                this._resizeFrameId = null
                this.resize()
            })
        }

        async init() {
            if (this._destroyed) return
            const generation = ++this._initGeneration
            this._stopAnimation(false)
            this.rotation = 0
            this.currentPrizeIndex = -1
            this._targetIndex = null
            this.resize()
            if (this._destroyed) return
            this._callHook('beforeInit')
            if (this._destroyed) return
            this.draw()
            if (this._destroyed) return
            await this._loadImages()
            if (this._destroyed || generation !== this._initGeneration) return
            this.draw()
            this._callHook('afterInit')
        }

        async _loadImages() {
            const imageItems = []
            ;[this.blocks, this.prizes, this.buttons].forEach(collection => {
                collection.forEach(item => {
                    ;(item.imgs || []).forEach(image => {
                        if (image && image.visible !== false) imageItems.push(image)
                    })
                })
            })

            const activeSources = new Set()
            const activeRawKeys = new Set()
            imageItems.forEach(imageInfo => {
                if (!imageInfo || !imageInfo.src) return
                activeSources.add(imageInfo.src)
                activeRawKeys.add(`${imageInfo.crossOrigin || 'anonymous'}\n${imageInfo.src}`)
            })
            this._activeImageSources = activeSources
            Array.from(this.imageCache.keys()).forEach(src => {
                if (!activeSources.has(src)) this.imageCache.delete(src)
            })
            Array.from(this._rawImagePromises.keys()).forEach(key => {
                if (!activeRawKeys.has(key)) this._rawImagePromises.delete(key)
            })
            const configuredConcurrency = Number(this.defaultConfig.imageConcurrency)
            const concurrency =
                Number.isFinite(configuredConcurrency) && configuredConcurrency > 0
                    ? Math.max(1, Math.floor(configuredConcurrency))
                    : Infinity
            await Promise.all(
                imageItems.map(imageInfo => this._loadImageWithLimit(imageInfo, concurrency)),
            )
        }

        _acquireImageLoadSlot(limit) {
            if (this._destroyed) return Promise.resolve(false)
            return new Promise(resolve => {
                this._imageLoadQueue.push({ limit, resolve })
                this._drainImageLoadQueue()
            })
        }

        _drainImageLoadQueue() {
            if (this._destroyed) {
                this._imageLoadQueue.splice(0).forEach(ticket => ticket.resolve(false))
                return
            }
            while (this._imageLoadQueue.length) {
                const ticketIndex = this._imageLoadQueue.findIndex(
                    ticket => this._activeImageLoads < ticket.limit,
                )
                if (ticketIndex < 0) return
                const [ticket] = this._imageLoadQueue.splice(ticketIndex, 1)
                this._activeImageLoads += 1
                ticket.resolve(true)
            }
        }

        async _loadImageWithLimit(imageInfo, limit) {
            const acquired = await this._acquireImageLoadSlot(limit)
            if (!acquired || this._destroyed) return
            try {
                await this._loadImage(imageInfo)
            } finally {
                this._activeImageLoads = Math.max(0, this._activeImageLoads - 1)
                this._drainImageLoadQueue()
            }
        }

        _loadImage(imageInfo) {
            if (!imageInfo || typeof imageInfo !== 'object' || !imageInfo.src) {
                return Promise.resolve()
            }

            const crossOrigin = imageInfo.crossOrigin || 'anonymous'
            const rawKey = `${crossOrigin}\n${imageInfo.src}`
            const formatter = imageInfo.formatter
            const cachedRecord = this._imageResults.get(imageInfo)
            if (
                cachedRecord &&
                cachedRecord.rawKey === rawKey &&
                cachedRecord.formatter === formatter
            ) {
                return Promise.resolve()
            }
            const pendingRecord = this._imagePromises.get(imageInfo)
            if (
                pendingRecord &&
                pendingRecord.rawKey === rawKey &&
                pendingRecord.formatter === formatter
            ) {
                return pendingRecord.promise
            }

            let rawPromise = this._rawImagePromises.get(rawKey)
            if (!rawPromise) {
                rawPromise = this.loadImg(imageInfo.src, imageInfo).catch(cause => {
                    this._rawImagePromises.delete(rawKey)
                    if (!this._destroyed) {
                        const error = new Error(
                            `WheelCanvas image failed to load: ${imageInfo.src}`,
                        )
                        error.name = 'WheelCanvasAssetError'
                        error.cause = cause
                        error.src = imageInfo.src
                        this._emitError(error)
                    }
                    return null
                })
                this._rawImagePromises.set(rawKey, rawPromise)
            }

            const imagePromise = rawPromise
                .then(async image => {
                    if (!image || this._destroyed) return
                    let result = image
                    if (typeof formatter === 'function') {
                        try {
                            result = await formatter.call(this, image)
                        } catch (cause) {
                            const error = new Error(
                                `WheelCanvas image formatter failed: ${imageInfo.src}`,
                            )
                            error.name = 'WheelCanvasAssetError'
                            error.cause = cause
                            error.src = imageInfo.src
                            this._emitError(error)
                        }
                    }
                    const currentRawKey = `${imageInfo.crossOrigin || 'anonymous'}\n${imageInfo.src}`
                    if (
                        this._destroyed ||
                        currentRawKey !== rawKey ||
                        imageInfo.formatter !== formatter ||
                        !this._activeImageSources.has(imageInfo.src)
                    )
                        return
                    this._imageResults.set(imageInfo, { rawKey, formatter, result })
                    this.imageCache.set(imageInfo.src, result)
                })
                .finally(() => {
                    const currentPending = this._imagePromises.get(imageInfo)
                    if (currentPending && currentPending.promise === imagePromise) {
                        this._imagePromises.delete(imageInfo)
                    }
                })
            this._imagePromises.set(imageInfo, { rawKey, formatter, promise: imagePromise })
            return imagePromise
        }

        _getCachedImage(imageInfo) {
            if (!imageInfo || typeof imageInfo !== 'object') return null
            const rawKey = `${imageInfo.crossOrigin || 'anonymous'}\n${imageInfo.src}`
            const record = this._imageResults.get(imageInfo)
            if (!record || record.rawKey !== rawKey || record.formatter !== imageInfo.formatter)
                return null
            return record.result || null
        }

        _prepareContext() {
            const ctx = this.ctx
            ctx.setTransform(1, 0, 0, 1, 0, 0)
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
            ctx.setTransform(
                this.dpr,
                0,
                0,
                this.dpr,
                this.centerX * this.dpr,
                this.centerY * this.dpr,
            )
            ctx.textBaseline = 'alphabetic'
            ctx.textAlign = 'center'
            if ('imageSmoothingEnabled' in ctx) ctx.imageSmoothingEnabled = true
            if ('imageSmoothingQuality' in ctx) ctx.imageSmoothingQuality = 'high'
        }

        _syncInteractionStyle() {
            if (!this.canvas || !this.canvas.style) return
            this.canvas.style.touchAction =
                this.physics && this.physics.enabled
                    ? this.physics.touchAction == null
                        ? 'none'
                        : String(this.physics.touchAction)
                    : this._originalTouchAction
        }

        _getPointerConfig() {
            return this._activeLayout ? this._activePointerConfig : this.pointer
        }

        _getPointerType() {
            const pointer = this._getPointerConfig()
            if (!pointer || typeof pointer !== 'object') return 'legacy'
            const type = String(pointer.type || 'center').toLowerCase()
            return ['center', 'external', 'none'].includes(type) ? type : 'center'
        }

        _getPointerDegree(useActive = true) {
            if (useActive && this._activeLayout) return this._activePointerDegree
            const pointer = this.pointer
            if (!pointer || typeof pointer !== 'object') return 0
            const configuredDegree = Number(pointer.angle)
            if (Number.isFinite(configuredDegree)) return normalizeDegree(configuredDegree)
            const position = String(pointer.position || 'top').toLowerCase()
            return POINTER_POSITIONS[position] == null ? 0 : POINTER_POSITIONS[position]
        }

        _resolvePointerColor(pointer, fallbackColor) {
            if (!pointer || String(pointer.colorSource || 'fixed') !== 'currentPrize') {
                return fallbackColor
            }
            const prizes = this._activePrizes || this.prizes
            const index = this.getCurrentPrizeIndex()
            const prize = index >= 0 ? prizes[index] : null
            const prizeColor = prize && (prize.background || this.defaultStyle.background)
            return hasBackground(prizeColor) ? prizeColor : fallbackColor
        }

        _getPointerWobbleConfig(pointer) {
            const source = pointer && pointer.wobble
            const config = source && typeof source === 'object' ? source : {}
            const enabled = source === true || (source && config.enabled !== false)
            const numberOr = (value, fallback) => {
                if (value == null) return fallback
                const number = Number(value)
                return Number.isFinite(number) ? number : fallback
            }
            return {
                enabled: Boolean(enabled),
                amplitude: clamp(numberOr(config.amplitude, 2.4), 0, 12),
                duration: clamp(numberOr(config.duration, 180), 40, 1200),
                frequency: clamp(numberOr(config.frequency, 14), 1, 40),
                damping: clamp(numberOr(config.damping, 12), 0, 40),
                respectReducedMotion: config.respectReducedMotion !== false,
            }
        }

        _isPointerWobbleReduced(config) {
            if (!config.respectReducedMotion) return false
            if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
                return false
            try {
                return window.matchMedia('(prefers-reduced-motion: reduce)').matches
            } catch (_error) {
                return false
            }
        }

        _triggerPointerWobble() {
            const pointer = this._getPointerConfig()
            const config = this._getPointerWobbleConfig(pointer)
            if (!config.enabled || this._isPointerWobbleReduced(config)) return
            const gestureVelocity = this._gesture && Number(this._gesture.velocity)
            const direction = Math.sign(
                this._physicsVelocity || this._currentSpeed || gestureVelocity || 1,
            )
            this._pointerWobbleDirection = direction > 0 ? -1 : 1
            this._pointerWobbleStartedAt = this._getNow()
        }

        _getPointerWobbleAngle(pointer) {
            if (this._pointerWobbleStartedAt == null) return 0
            const config = this._getPointerWobbleConfig(pointer)
            if (!config.enabled || this._isPointerWobbleReduced(config)) {
                this._resetPointerWobble()
                return 0
            }
            const elapsed = Math.max(0, this._getNow() - this._pointerWobbleStartedAt)
            if (elapsed >= config.duration) {
                this._resetPointerWobble()
                return 0
            }
            const seconds = elapsed / 1000
            const progress = elapsed / config.duration
            const envelope = Math.exp(-config.damping * seconds) * (1 - progress) ** 2
            return (
                this._pointerWobbleDirection *
                config.amplitude *
                envelope *
                Math.cos(TWO_PI * config.frequency * seconds)
            )
        }

        _resetPointerWobble() {
            this._pointerWobbleStartedAt = null
            this._pointerRenderWobbleAngle = 0
        }

        _getPointerRenderDegree() {
            return this._getPointerDegree() + this._pointerRenderWobbleAngle
        }

        _invokeFeedbackHandler(handler, cue, detail, config) {
            if (typeof handler !== 'function') return
            try {
                const result = handler.call(this, cue, detail, config)
                if (result && typeof result.then === 'function') {
                    Promise.resolve(result).catch(cause => this._handleFeedbackError(cause))
                }
            } catch (cause) {
                this._handleFeedbackError(cause)
            }
        }

        _handleFeedbackError(cause) {
            if (this._destroyed) return
            const error = new Error('WheelCanvas feedback handler failed')
            error.name = 'WheelCanvasFeedbackError'
            error.cause = cause
            this._emitError(error)
        }

        _emitSectorFeedback(index, previousIndex) {
            const feedback = this.feedback || {}
            const sound = feedback.sound && typeof feedback.sound === 'object' ? feedback.sound : {}
            if (feedback.enabled === false || sound.enabled !== true) return
            const now = this._getNow()
            const minInterval = clamp(Number(sound.minInterval) || 0, 0, 1000)
            const elapsed = now - this._lastSectorFeedbackAt
            if (elapsed >= 0 && elapsed < minInterval) return
            this._lastSectorFeedbackAt = now
            const prizes = this._activePrizes || this.prizes
            const angularVelocity = Number(
                this._physicsVelocity || (Number(this._currentSpeed) || 0) * 60,
            )
            this._invokeFeedbackHandler(
                sound.play,
                String(sound.sectorCue || 'snap'),
                {
                    type: 'sector',
                    index,
                    previousIndex,
                    prize: prizes[index] || null,
                    angularVelocity: Number.isFinite(angularVelocity) ? angularVelocity : 0,
                    rotation: normalizeDegree(this.rotation),
                },
                sound,
            )
        }

        _emitResultFeedback(index, prize) {
            const feedback = this.feedback || {}
            if (feedback.enabled === false || !prize) return
            const prizes = this._activePrizes || this.prizes
            const detail = {
                type: 'result',
                index,
                prize,
                rotation: normalizeDegree(this.rotation),
                colors: prizes
                    .map(item => item && item.background)
                    .filter(color => typeof color === 'string' && hasBackground(color)),
            }
            const sound = feedback.sound && typeof feedback.sound === 'object' ? feedback.sound : {}
            if (sound.enabled === true) {
                this._invokeFeedbackHandler(
                    sound.play,
                    String(sound.resultCue || 'reward'),
                    detail,
                    sound,
                )
                if (this._destroyed) return
            }
            const celebration =
                feedback.celebration && typeof feedback.celebration === 'object'
                    ? feedback.celebration
                    : {}
            if (celebration.enabled === true) {
                this._invokeFeedbackHandler(
                    celebration.fire,
                    String(celebration.style || 'subtle'),
                    detail,
                    celebration,
                )
            }
        }

        _getExternalPointerMetrics() {
            if (this._getPointerType() !== 'external') return null
            const pointer = this._getPointerConfig() || {}
            const body = pointer.body && typeof pointer.body === 'object' ? pointer.body : {}
            const mount = pointer.mount && typeof pointer.mount === 'object' ? pointer.mount : {}
            const shadow =
                pointer.shadow && typeof pointer.shadow === 'object' ? pointer.shadow : {}
            const shadowDisabled = pointer.shadow === false
            const preset = String(pointer.preset || pointer.shape || 'minimal').toLowerCase()
            const presetSize = {
                minimal: { width: '6%', height: '5%' },
                classic: { width: '7.5%', height: '14.5%' },
                flapper: { width: '6.5%', height: '16%' },
                wedge: { width: '10%', height: '7.5%' },
                triangle: { width: '10%', height: '7.5%' },
                needle: { width: '3.2%', height: '14.5%' },
                pin: { width: '7.5%', height: '12.5%' },
                glass: { width: '8.5%', height: '13.5%' },
                jewel: { width: '9%', height: '13%' },
                kite: { width: '8.5%', height: '13.5%' },
                arrow: { width: '8%', height: '13%' },
                chevron: { width: '10%', height: '8%' },
                diamond: { width: '8%', height: '13%' },
                notch: { width: '10%', height: '9%' },
                teardrop: { width: '7%', height: '13%' },
                spear: { width: '4.5%', height: '15%' },
                soft: { width: '8.5%', height: '7.5%' },
                tab: { width: '8.5%', height: '6.5%' },
                dart: { width: '6.5%', height: '14%' },
                shield: { width: '9%', height: '11%' },
                ribbon: { width: '8%', height: '13%' },
            }[preset] || { width: '9%', height: '15%' }
            const relativeLength = this.radius * 2
            const width = Math.max(
                1,
                this.getLength(
                    pointer.width == null ? presetSize.width : pointer.width,
                    relativeLength,
                ),
            )
            const height = Math.max(
                1,
                this.getLength(
                    pointer.height == null ? presetSize.height : pointer.height,
                    relativeLength,
                ),
            )
            const borderWidth = Math.max(
                0,
                this.getLength(
                    body.borderWidth == null
                        ? pointer.borderWidth == null
                            ? preset === 'minimal'
                                ? 2
                                : 3
                            : pointer.borderWidth
                        : body.borderWidth,
                    relativeLength,
                ),
            )
            const cornerRadius = this._getPointerCornerRadius(pointer, relativeLength)
            const presetMountRatio =
                {
                    classic: 0.026,
                    flapper: 0.03,
                    needle: 0.022,
                    pin: 0.026,
                    glass: 0.028,
                    jewel: 0.024,
                }[preset] || null
            const defaultMountRadius =
                presetMountRatio == null ? width * 0.28 : relativeLength * presetMountRatio
            const mountRadius = Math.max(
                0,
                this.getLength(
                    mount.radius == null
                        ? pointer.mountRadius == null
                            ? defaultMountRadius
                            : pointer.mountRadius
                        : mount.radius,
                    relativeLength,
                ),
            )
            const mountBorderWidth = Math.max(
                0,
                this.getLength(
                    mount.borderWidth == null
                        ? pointer.mountBorderWidth == null
                            ? 2
                            : pointer.mountBorderWidth
                        : mount.borderWidth,
                    relativeLength,
                ),
            )
            const hasExplicitMount =
                pointer.mount === true || (pointer.mount && typeof pointer.mount === 'object')
            const showMount =
                pointer.mount !== false &&
                mount.visible !== false &&
                (hasExplicitMount ||
                    ![
                        'minimal',
                        'triangle',
                        'wedge',
                        'kite',
                        'arrow',
                        'chevron',
                        'diamond',
                        'notch',
                        'soft',
                        'tab',
                        'dart',
                        'shield',
                        'ribbon',
                    ].includes(preset))
            const shadowBlur = shadowDisabled
                ? 0
                : Math.max(
                      0,
                      this.getLength(
                          shadow.blur == null
                              ? pointer.shadowBlur == null
                                  ? 0
                                  : pointer.shadowBlur
                              : shadow.blur,
                          relativeLength,
                      ),
                  )
            const shadowTangentOffset = shadowDisabled
                ? 0
                : this.getLength(
                      shadow.offsetX == null
                          ? pointer.shadowOffsetX == null
                              ? 0
                              : pointer.shadowOffsetX
                          : shadow.offsetX,
                      relativeLength,
                  )
            const shadowRadialOffset = shadowDisabled
                ? 0
                : this.getLength(
                      shadow.radialOffset == null
                          ? pointer.shadowOffsetY == null
                              ? 0
                              : pointer.shadowOffsetY
                          : shadow.radialOffset,
                      relativeLength,
                  )
            const configuredInset = this.getLength(
                pointer.tipInset == null
                    ? pointer.inset == null
                        ? preset === 'minimal'
                            ? 14
                            : 8
                        : pointer.inset
                    : pointer.tipInset,
                relativeLength,
            )
            const bodyOutward = Math.max(0, height - configuredInset) + borderWidth / 2
            const mountOutward = showMount
                ? Math.max(0, height - configuredInset + mountRadius + mountBorderWidth / 2)
                : 0
            const shadowSafety = shadowBlur * 2 + Math.abs(shadowRadialOffset)
            const requiredSpace = Math.max(bodyOutward, mountOutward) + shadowSafety
            const configuredLayout = String(pointer.layout || '').toLowerCase()
            const layout =
                pointer.reserveSpace === false || configuredLayout === 'overlay'
                    ? 'overlay'
                    : configuredLayout === 'stable'
                      ? 'stable'
                      : 'fit'
            const reserveSpace = layout !== 'overlay'
            const defaultSpace = layout === 'stable' ? '5%' : requiredSpace
            const space = reserveSpace
                ? Math.max(
                      0,
                      this.getLength(
                          pointer.space == null ? defaultSpace : pointer.space,
                          relativeLength,
                      ),
                  )
                : 0
            const inwardShift = layout === 'fit' ? 0 : Math.max(0, requiredSpace - space)
            const inset = configuredInset + inwardShift
            return {
                width,
                height,
                referenceDiameter: 0,
                borderWidth,
                cornerRadius,
                mountRadius,
                mountBorderWidth,
                showMount,
                shadowBlur,
                shadowTangentOffset,
                shadowRadialOffset,
                tangentExtent:
                    Math.max(
                        width / 2 + borderWidth / 2,
                        showMount ? mountRadius + mountBorderWidth / 2 : 0,
                    ) +
                    shadowBlur * 2 +
                    Math.abs(shadowTangentOffset),
                layout,
                reserveSpace,
                space,
                requiredSpace,
                configuredInset,
                inwardShift,
                inset,
                offset: this.getLength(
                    pointer.tangentOffset == null
                        ? pointer.offset == null
                            ? 0
                            : pointer.offset
                        : pointer.tangentOffset,
                    relativeLength,
                ),
            }
        }

        _updateWheelGeometry(externalPointer) {
            if (!externalPointer || !externalPointer.reserveSpace) {
                this.centerX = this.boxWidth / 2
                this.centerY = this.boxHeight / 2
                this.wheelRadius = this.radius
                return
            }
            const pointerRadian = degreeToRadian(this._getPointerDegree())
            const outwardX = Math.sin(pointerRadian)
            const outwardY = -Math.cos(pointerRadian)
            const tangentX = Math.cos(pointerRadian)
            const tangentY = Math.sin(pointerRadian)
            const keepsWheelGeometry = externalPointer.layout === 'stable'
            const tangentExtent = keepsWheelGeometry ? 0 : externalPointer.tangentExtent
            const tangentOffset = keepsWheelGeometry ? 0 : externalPointer.offset
            const tangentXExtent = Math.abs(tangentX) * tangentExtent
            const tangentYExtent = Math.abs(tangentY) * tangentExtent
            let candidateRadius = this.radius
            let top = 0
            let right = 0
            let bottom = 0
            let left = 0
            const updateMargins = () => {
                const radialDistance = candidateRadius + externalPointer.space
                const pointerX = outwardX * radialDistance + tangentX * tangentOffset
                const pointerY = outwardY * radialDistance + tangentY * tangentOffset
                right = Math.max(0, pointerX + tangentXExtent - candidateRadius)
                left = Math.max(0, -pointerX + tangentXExtent - candidateRadius)
                bottom = Math.max(0, pointerY + tangentYExtent - candidateRadius)
                top = Math.max(0, -pointerY + tangentYExtent - candidateRadius)
            }
            for (let iteration = 0; iteration < 128; iteration += 1) {
                updateMargins()
                const availableWidth = Math.max(0, this.boxWidth - left - right)
                const availableHeight = Math.max(0, this.boxHeight - top - bottom)
                const nextRadius = Math.max(0, Math.min(availableWidth, availableHeight) / 2)
                if (Math.abs(nextRadius - candidateRadius) <= 1e-7) {
                    candidateRadius = nextRadius
                    break
                }
                candidateRadius = nextRadius
            }
            updateMargins()
            const availableWidth = Math.max(0, this.boxWidth - left - right)
            const availableHeight = Math.max(0, this.boxHeight - top - bottom)
            this.centerX = left + availableWidth / 2
            this.centerY = top + availableHeight / 2
            this.wheelRadius = Math.max(0, Math.min(availableWidth, availableHeight) / 2)
            externalPointer.wheelRadius = this.wheelRadius
        }

        _resolveRenderGeometry() {
            const cached = this._geometryCache
            if (cached && cached.version === this._renderCacheVersion) {
                this.centerX = cached.centerX
                this.centerY = cached.centerY
                this.wheelRadius = cached.wheelRadius
                return cached.externalPointer
            }
            const externalPointer = this._getExternalPointerMetrics()
            this._updateWheelGeometry(externalPointer)
            this._geometryCache = {
                version: this._renderCacheVersion,
                externalPointer,
                centerX: this.centerX,
                centerY: this.centerY,
                wheelRadius: this.wheelRadius,
            }
            return externalPointer
        }

        draw() {
            if (this._destroyed || !this.ctx || !this.radius) return
            const externalPointer = this._resolveRenderGeometry()
            this._pointerRenderWobbleAngle = this._getPointerWobbleAngle(this._getPointerConfig())
            this._prepareContext()
            this._callHook('beforeDraw', this.ctx)
            if (this._destroyed) return

            this.prizeRadius = this._drawBlocks(this.wheelRadius)
            if (this._destroyed) return
            const buttons = this._activeButtons || this.buttons
            this.maxButtonRadius = buttons.reduce((maxRadius, button) => {
                if (button.visible === false) return maxRadius
                const radius = this.getLength(button.radius, this.prizeRadius)
                const borderWidth = Math.max(
                    0,
                    this.getLength(button.borderWidth, this.prizeRadius * 2),
                )
                return Math.max(maxRadius, radius + borderWidth / 2)
            }, 0)
            this._syncAccessibilityState()

            this._drawPrizes()
            if (this._destroyed) return
            this._drawButtons()
            if (this._destroyed) return
            this._drawExternalPointer(externalPointer)
            if (this._destroyed) return
            this._callHook('afterDraw', this.ctx)
        }

        _drawBlocks(initialRadius) {
            let radius = initialRadius
            this.blocks.forEach(block => {
                if (hasBackground(block.background)) {
                    this.ctx.beginPath()
                    this.ctx.fillStyle = block.background
                    this.ctx.arc(0, 0, Math.max(0, radius), 0, TWO_PI)
                    this.ctx.fill()
                }
                this._drawBlockImages(block, radius)
                const padding = String(block.padding == null ? 0 : block.padding)
                    .trim()
                    .split(/\s+/)[0]
                radius = Math.max(0, radius - this.getLength(padding, radius))
            })
            return radius
        }

        _drawBlockImages(block, radius) {
            ;(block.imgs || []).forEach(imageInfo => {
                if (!imageInfo || imageInfo.visible === false) return
                const image = this._getCachedImage(imageInfo)
                if (!image) return
                const [width, height] = this.computedWidthAndHeight(
                    image,
                    imageInfo,
                    radius * 2,
                    radius * 2,
                )
                const size = { width, height }
                const x =
                    -radius +
                    this.getLength(imageInfo.left, radius * 2) +
                    (radius * 2 - size.width) / 2
                const y = -radius + this.getLength(imageInfo.top, radius * 2)
                this.ctx.save()
                if (imageInfo.rotate) this.ctx.rotate(degreeToRadian(this.rotation))
                this.drawImage(this.ctx, image, x, y, size.width, size.height)
                this.ctx.restore()
            })
        }

        _getPrizeLayout() {
            if (!this.prizes.length) return []
            const cached = this._prizeLayoutCache
            if (cached && cached.version === this._renderCacheVersion) return cached.layout
            const useGraphicWeight = Boolean(this.defaultConfig.useGraphicWeight)
            const weightSource = String(this.defaultConfig.graphicWeightSource || 'auto')
            const rawWeights = this.prizes.map(prize => {
                if (!useGraphicWeight) return 1
                let configuredWeight
                if (weightSource === 'range') configuredWeight = prize.range
                else if (weightSource === 'displayWeight') configuredWeight = prize.displayWeight
                else {
                    configuredWeight = hasOwn(prize, 'displayWeight')
                        ? prize.displayWeight
                        : prize.range
                }
                const weight = Number(configuredWeight)
                return Number.isFinite(weight) && weight > 0 ? weight : 1
            })
            const maxWeight = rawWeights.reduce((max, weight) => Math.max(max, weight), 0)
            const minimumNormalizedWeight = Number.EPSILON * Math.max(1, rawWeights.length) * 2
            const weights = rawWeights.map(weight => {
                return Math.max(weight / maxWeight, minimumNormalizedWeight)
            })
            const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
            let cursor = 0

            const layout = weights.map((weight, index) => {
                const calculatedDegree = (360 * weight) / totalWeight
                const endDegree = index === weights.length - 1 ? 360 : cursor + calculatedDegree
                const degree = endDegree - cursor
                const item = {
                    index,
                    weight,
                    startDegree: cursor,
                    endDegree,
                    middleDegree: cursor + degree / 2,
                    degree,
                    radian: degreeToRadian(degree),
                }
                cursor = endDegree
                return item
            })
            this._prizeLayoutCache = {
                version: this._renderCacheVersion,
                layout,
            }
            return layout
        }

        _getCachedTextLines(owner, key, createLines) {
            if (!owner || typeof owner !== 'object') return createLines()
            let cache = this._textLayoutCache.get(owner)
            if (!cache) {
                cache = new Map()
                this._textLayoutCache.set(owner, cache)
            }
            if (cache.has(key)) return cache.get(key)
            const lines = createLines()
            cache.set(key, lines)
            return lines
        }

        _drawPrizes() {
            const prizes = this._activePrizes || this.prizes
            if (!prizes.length || this.prizeRadius <= 0) return
            const layout = this._activeLayout || this._getPrizeLayout()
            const gutter = Math.max(0, this.getLength(this.defaultConfig.gutter, this.prizeRadius))
            const offsetDegree = this._activeLayout
                ? this._activeOffsetDegree
                : Number(this.defaultConfig.offsetDegree) || 0
            const startDegree = this.rotation - 90 + offsetDegree

            layout.forEach(layoutItem => {
                const prize = prizes[layoutItem.index]
                const maxGutterRadian = Math.max(0, layoutItem.radian / 2 - Number.EPSILON)
                const gutterRadian = this.prizeRadius
                    ? Math.min(gutter / this.prizeRadius / 2, maxGutterRadian)
                    : 0
                const sectorStart =
                    degreeToRadian(startDegree + layoutItem.startDegree) + gutterRadian
                const sectorEnd = degreeToRadian(startDegree + layoutItem.endDegree) - gutterRadian
                const middle = degreeToRadian(startDegree + layoutItem.middleDegree)
                const background = prize.background || this.defaultStyle.background

                if (hasBackground(background) && sectorEnd > sectorStart) {
                    const halfRadian = layoutItem.radian / 2
                    const innerRadius =
                        gutter > 0 && Math.abs(Math.sin(halfRadian)) > Number.EPSILON
                            ? Math.min(
                                  this.prizeRadius,
                                  gutter / 2 / Math.abs(Math.sin(halfRadian)),
                              )
                            : 0
                    this.ctx.beginPath()
                    this.ctx.moveTo(Math.cos(middle) * innerRadius, Math.sin(middle) * innerRadius)
                    this.ctx.arc(0, 0, this.prizeRadius, sectorStart, sectorEnd)
                    this.ctx.closePath()
                    this.ctx.fillStyle = background
                    this.ctx.fill()
                }

                this.ctx.save()
                this.ctx.translate(
                    Math.cos(middle) * this.prizeRadius,
                    Math.sin(middle) * this.prizeRadius,
                )
                this.ctx.rotate(middle + Math.PI / 2)
                this._drawPrizeImages(prize, layoutItem.radian)
                this._drawPrizeFonts(prize, layoutItem.radian)
                this.ctx.restore()
            })
        }

        _drawPrizeImages(prize, segmentRadian) {
            const visibleHeight = Math.max(0, this.prizeRadius - this.maxButtonRadius)
            const chordWidth = 2 * this.prizeRadius * Math.sin(segmentRadian / 2)
            ;(prize.imgs || []).forEach(imageInfo => {
                if (!imageInfo || imageInfo.visible === false) return
                const image = this._getCachedImage(imageInfo)
                if (!image) return
                const [width, height] = this.computedWidthAndHeight(
                    image,
                    imageInfo,
                    segmentRadian * this.prizeRadius,
                    visibleHeight,
                )
                const size = { width, height }
                const x = -size.width / 2 + this.getLength(imageInfo.left, chordWidth)
                const y = this.getLength(imageInfo.top, visibleHeight)
                this.drawImage(this.ctx, image, x, y, size.width, size.height)
            })
        }

        _drawPrizeFonts(prize, segmentRadian) {
            const visibleHeight = Math.max(0, this.prizeRadius - this.maxButtonRadius)
            const outerChord = 2 * this.prizeRadius * Math.sin(segmentRadian / 2)

            ;(prize.fonts || []).forEach(font => {
                if (font.visible === false) return
                const fontReferenceSize = this.radius * 2
                this._applyFont(font, fontReferenceSize)
                const fontSize = this.getLength(
                    hasOwn(font, 'fontSize') ? font.fontSize : this.defaultStyle.fontSize,
                    fontReferenceSize,
                )
                const lineHeight =
                    this.getLength(
                        hasOwn(font, 'lineHeight')
                            ? font.lineHeight
                            : this.defaultStyle.lineHeight || fontSize * 1.2,
                        fontReferenceSize,
                    ) || fontSize * 1.2
                const top = this.getLength(
                    hasOwn(font, 'top') ? font.top : this.defaultStyle.top,
                    visibleHeight,
                )
                const left = this.getLength(
                    hasOwn(font, 'left') ? font.left : this.defaultStyle.left,
                    outerChord,
                )
                const wordWrap = hasOwn(font, 'wordWrap')
                    ? font.wordWrap
                    : this.defaultStyle.wordWrap
                const lineClamp = Number(
                    hasOwn(font, 'lineClamp') ? font.lineClamp : this.defaultStyle.lineClamp,
                )
                const orientation = String(
                    hasOwn(font, 'orientation')
                        ? font.orientation
                        : this.defaultStyle.orientation || 'horizontal',
                ).toLowerCase()
                const textOverflow = String(
                    hasOwn(font, 'textOverflow')
                        ? font.textOverflow
                        : this.defaultStyle.textOverflow || 'ellipsis',
                ).toLowerCase()
                const ellipsis = hasOwn(font, 'ellipsis')
                    ? font.ellipsis
                    : this.defaultStyle.ellipsis
                const lengthLimit = lineIndex => {
                    const depth = Math.max(0, this.prizeRadius - top - (lineIndex + 1) * lineHeight)
                    const tangentWidth = 2 * depth * Math.abs(Math.tan(segmentRadian / 2))
                    const availableChord =
                        segmentRadian >= Math.PI ? 2 * depth : Math.min(tangentWidth, 2 * depth)
                    return this.getLength(
                        hasOwn(font, 'lengthLimit')
                            ? font.lengthLimit
                            : this.defaultStyle.lengthLimit,
                        Math.max(0, availableChord - this.getLength(this.defaultConfig.gutter)),
                    )
                }
                const text = font.text == null ? '' : String(font.text)
                const cacheKey = [
                    'prize',
                    this.ctx.font,
                    text,
                    orientation,
                    wordWrap,
                    lineClamp,
                    textOverflow,
                    ellipsis,
                    segmentRadian,
                    this.prizeRadius,
                    this.maxButtonRadius,
                    visibleHeight,
                    top,
                    lineHeight,
                    String(
                        hasOwn(font, 'lengthLimit')
                            ? font.lengthLimit
                            : this.defaultStyle.lengthLimit,
                    ),
                    String(this.defaultConfig.gutter),
                ].join('\u0001')
                const lines = this._getCachedTextLines(font, cacheKey, () => {
                    if (orientation === 'vertical') {
                        return splitVerticalText(text, lineClamp, textOverflow, ellipsis)
                    }
                    if (wordWrap) {
                        return splitLines(
                            this.ctx,
                            text,
                            lengthLimit,
                            lineClamp,
                            textOverflow,
                            ellipsis,
                        )
                    }
                    return splitUnwrappedLines(
                        this.ctx,
                        text,
                        lengthLimit,
                        lineClamp,
                        textOverflow,
                        ellipsis,
                    )
                })

                lines.forEach((line, lineIndex) => {
                    this.ctx.fillText(line, left, top + (lineIndex + 1) * lineHeight)
                })
            })
        }

        _drawButtons() {
            const pointerType = this._getPointerType()
            const pointer = this._getPointerConfig()
            let explicitCenterPointerDrawn = false
            const buttons = this._activeButtons || this.buttons
            buttons.forEach(button => {
                if (this._destroyed) return
                const radius = Math.max(0, this.getLength(button.radius, this.prizeRadius))
                const borderWidth = Math.max(
                    0,
                    this.getLength(button.borderWidth, this.prizeRadius * 2),
                )
                const requestsCenterPointer = Boolean(
                    !explicitCenterPointerDrawn &&
                    button.pointer &&
                    pointerType === 'center' &&
                    pointer,
                )
                if (button.visible === false) {
                    if (requestsCenterPointer && pointer.fused === false) {
                        this.ctx.save()
                        this.ctx.globalAlpha = 1
                        this.ctx.shadowColor = 'rgba(0, 0, 0, 0)'
                        this.ctx.shadowBlur = 0
                        this.ctx.shadowOffsetX = 0
                        this.ctx.shadowOffsetY = 0
                        this._drawCenterPointer(button, radius, pointerType)
                        this.ctx.restore()
                        explicitCenterPointerDrawn = true
                    }
                    return
                }
                this.ctx.save()
                this.ctx.globalAlpha = clamp(
                    Number(button.opacity == null ? 1 : button.opacity),
                    0,
                    1,
                )
                this.ctx.shadowColor = button.shadowColor || 'rgba(0, 0, 0, 0)'
                this.ctx.shadowBlur = Math.max(
                    0,
                    this.getLength(button.shadowBlur, this.prizeRadius * 2),
                )
                this.ctx.shadowOffsetX = this.getLength(button.shadowOffsetX, this.prizeRadius * 2)
                this.ctx.shadowOffsetY = this.getLength(button.shadowOffsetY, this.prizeRadius * 2)

                const hasCenterPointer = requestsCenterPointer && pointer.fused !== false
                const usesDropletFusion = Boolean(
                    hasCenterPointer &&
                    String(pointer.fusionStyle || '').toLowerCase() === 'droplet' &&
                    typeof pointer.renderer !== 'function',
                )
                const usesAdaptiveFusion = Boolean(
                    hasCenterPointer &&
                    String(pointer.fusionStyle || '').toLowerCase() === 'adaptive' &&
                    typeof pointer.renderer !== 'function',
                )
                const usesNativeLayeredFusion = Boolean(
                    hasCenterPointer &&
                    !usesDropletFusion &&
                    !usesAdaptiveFusion &&
                    typeof pointer.renderer !== 'function',
                )
                const buttonBackground =
                    usesDropletFusion || usesAdaptiveFusion
                        ? this._resolvePointerColor(pointer, button.background)
                        : button.background
                if (
                    hasCenterPointer &&
                    !usesDropletFusion &&
                    !usesAdaptiveFusion &&
                    !usesNativeLayeredFusion
                ) {
                    this.ctx.save()
                    if (
                        (hasBackground(button.background) || borderWidth > 0) &&
                        typeof this.ctx.rect === 'function' &&
                        typeof this.ctx.clip === 'function'
                    ) {
                        this.ctx.beginPath()
                        this.ctx.rect(
                            -this.boxWidth,
                            -this.boxHeight,
                            this.boxWidth * 2,
                            this.boxHeight * 2,
                        )
                        this.ctx.arc(0, 0, radius, 0, TWO_PI)
                        this.ctx.clip('evenodd')
                    }
                    this._drawCenterPointer(button, radius, pointerType)
                    this.ctx.restore()
                    explicitCenterPointerDrawn = true
                } else if (hasCenterPointer) {
                    explicitCenterPointerDrawn = true
                }
                if (this._destroyed) {
                    this.ctx.restore()
                    return
                }

                if (usesAdaptiveFusion) {
                    if (hasBackground(buttonBackground) || borderWidth > 0) {
                        this.ctx.save()
                        this.ctx.beginPath()
                        this.ctx.arc(0, 0, radius, 0, TWO_PI)
                        this._drawCenterPointer(button, radius, pointerType, 'append-path')
                        if (borderWidth > 0 && typeof this.ctx.stroke === 'function') {
                            this.ctx.lineWidth = borderWidth * 2
                            this.ctx.strokeStyle = button.borderColor || '#ffffff'
                            this.ctx.lineJoin = 'round'
                            this.ctx.stroke()
                        }
                        if (hasBackground(buttonBackground)) {
                            this.ctx.fillStyle = buttonBackground
                            this.ctx.fill()
                        }
                        this.ctx.restore()
                    }
                } else {
                    if (hasBackground(buttonBackground) || borderWidth > 0) {
                        this.ctx.save()
                        this.ctx.beginPath()
                        if (usesDropletFusion) {
                            this._createDropletButtonPath(radius, pointer)
                        } else {
                            this.ctx.arc(0, 0, radius, 0, TWO_PI)
                        }
                        if (hasBackground(buttonBackground)) {
                            this.ctx.fillStyle = buttonBackground
                            this.ctx.fill()
                        }
                        if (borderWidth > 0 && typeof this.ctx.stroke === 'function') {
                            this.ctx.lineWidth = borderWidth
                            this.ctx.strokeStyle = button.borderColor || '#ffffff'
                            this.ctx.stroke()
                        }
                        this.ctx.restore()
                    }
                    if (this._destroyed) {
                        this.ctx.restore()
                        return
                    }

                    if (usesNativeLayeredFusion) {
                        this.ctx.save()
                        this._drawCenterPointer(button, radius, pointerType, 'fill')
                        this.ctx.restore()
                        if (this._destroyed) {
                            this.ctx.restore()
                            return
                        }

                        this.ctx.save()
                        if (
                            (hasBackground(button.background) || borderWidth > 0) &&
                            typeof this.ctx.rect === 'function' &&
                            typeof this.ctx.clip === 'function'
                        ) {
                            this.ctx.beginPath()
                            this.ctx.rect(
                                -this.boxWidth,
                                -this.boxHeight,
                                this.boxWidth * 2,
                                this.boxHeight * 2,
                            )
                            this.ctx.arc(0, 0, radius, 0, TWO_PI)
                            this.ctx.clip('evenodd')
                        }
                        this._drawCenterPointer(button, radius, pointerType, 'stroke')
                        this.ctx.restore()
                    }
                }
                if (this._destroyed) {
                    this.ctx.restore()
                    return
                }

                if (
                    !hasCenterPointer &&
                    button.pointer &&
                    pointerType !== 'external' &&
                    pointerType !== 'none' &&
                    (pointerType !== 'legacy' ||
                        hasBackground(button.background) ||
                        borderWidth > 0)
                ) {
                    if (pointerType === 'center') {
                        if (!explicitCenterPointerDrawn) {
                            this.ctx.save()
                            this.ctx.globalAlpha = 1
                            this.ctx.shadowColor = 'rgba(0, 0, 0, 0)'
                            this.ctx.shadowBlur = 0
                            this.ctx.shadowOffsetX = 0
                            this.ctx.shadowOffsetY = 0
                            this._drawCenterPointer(button, radius, pointerType)
                            this.ctx.restore()
                            explicitCenterPointerDrawn = true
                        }
                    } else {
                        this._drawCenterPointer(button, radius, pointerType)
                    }
                }
                if (this._destroyed) {
                    this.ctx.restore()
                    return
                }

                this.ctx.shadowColor = 'rgba(0, 0, 0, 0)'
                this.ctx.shadowBlur = 0
                this.ctx.shadowOffsetX = 0
                this.ctx.shadowOffsetY = 0

                ;(button.imgs || []).forEach(imageInfo => {
                    if (!imageInfo || imageInfo.visible === false) return
                    const image = this._getCachedImage(imageInfo)
                    if (!image) return
                    const [width, height] = this.computedWidthAndHeight(
                        image,
                        imageInfo,
                        radius * 2,
                        radius * 2,
                    )
                    const size = { width, height }
                    const x = -size.width / 2 + this.getLength(imageInfo.left, radius)
                    const y = this.getLength(imageInfo.top, radius)
                    this.drawImage(this.ctx, image, x, y, size.width, size.height)
                })

                const prizeCount = this._activeLayout
                    ? this._activeLayout.length
                    : this.prizes.length
                const segmentRadian = prizeCount ? TWO_PI / prizeCount : 0
                const prizeChord = 2 * this.prizeRadius * Math.sin(segmentRadian / 2)
                ;(button.textVisible === false ? [] : button.fonts || []).forEach(font => {
                    if (font.visible === false) return
                    const fontReferenceSize = this.radius * 2
                    this._applyFont(font, fontReferenceSize)
                    const fontSize = this.getLength(
                        hasOwn(font, 'fontSize') ? font.fontSize : this.defaultStyle.fontSize,
                        fontReferenceSize,
                    )
                    const lineHeight =
                        this.getLength(
                            hasOwn(font, 'lineHeight')
                                ? font.lineHeight
                                : this.defaultStyle.lineHeight || fontSize * 1.2,
                            fontReferenceSize,
                        ) || fontSize * 1.2
                    const left = this.getLength(font.left, prizeChord)
                    const lineClamp = Number(
                        hasOwn(font, 'lineClamp') ? font.lineClamp : this.defaultStyle.lineClamp,
                    )
                    const orientation = String(
                        hasOwn(font, 'orientation')
                            ? font.orientation
                            : this.defaultStyle.orientation || 'horizontal',
                    ).toLowerCase()
                    const textOverflow = String(
                        hasOwn(font, 'textOverflow')
                            ? font.textOverflow
                            : this.defaultStyle.textOverflow || 'ellipsis',
                    ).toLowerCase()
                    const ellipsis = hasOwn(font, 'ellipsis')
                        ? font.ellipsis
                        : this.defaultStyle.ellipsis
                    const wordWrap = hasOwn(font, 'wordWrap')
                        ? font.wordWrap
                        : this.defaultStyle.wordWrap
                    const text = String(font.text == null ? '' : font.text)
                    const maxWidth = this.getLength(
                        hasOwn(font, 'lengthLimit')
                            ? font.lengthLimit
                            : this.defaultStyle.lengthLimit,
                        radius * 2,
                    )
                    const cacheKey = [
                        'button',
                        this.ctx.font,
                        text,
                        orientation,
                        wordWrap,
                        lineClamp,
                        textOverflow,
                        ellipsis,
                        radius,
                        maxWidth,
                        lineHeight,
                        segmentRadian,
                    ].join('\u0001')
                    const lines = this._getCachedTextLines(font, cacheKey, () => {
                        if (orientation === 'vertical') {
                            return splitVerticalText(text, lineClamp, textOverflow, ellipsis)
                        }
                        return wordWrap
                            ? splitLines(
                                  this.ctx,
                                  text,
                                  maxWidth,
                                  lineClamp,
                                  textOverflow,
                                  ellipsis,
                              )
                            : splitUnwrappedLines(
                                  this.ctx,
                                  text,
                                  maxWidth,
                                  lineClamp,
                                  textOverflow,
                                  ellipsis,
                              )
                    })
                    const verticalAlign = String(
                        hasOwn(font, 'verticalAlign')
                            ? font.verticalAlign
                            : this.defaultStyle.verticalAlign || 'middle',
                    ).toLowerCase()

                    if (hasOwn(font, 'top')) {
                        const top = this.getLength(font.top, radius)
                        lines.forEach((line, lineIndex) => {
                            this.ctx.fillText(line, left, top + (lineIndex + 1) * lineHeight)
                        })
                        return
                    }

                    this.ctx.save()
                    this.ctx.textBaseline = 'middle'
                    let firstLineY = -((lines.length - 1) * lineHeight) / 2
                    if (verticalAlign === 'top') firstLineY = -radius + lineHeight / 2
                    if (verticalAlign === 'bottom') {
                        firstLineY = radius - (lines.length - 0.5) * lineHeight
                    }
                    lines.forEach((line, lineIndex) => {
                        this.ctx.fillText(line, left, firstLineY + lineIndex * lineHeight)
                    })
                    this.ctx.restore()
                })
                this.ctx.restore()
            })
            if (
                pointerType === 'center' &&
                pointer &&
                pointer.fused === false &&
                !explicitCenterPointerDrawn
            ) {
                this.ctx.save()
                this.ctx.globalAlpha = 1
                this.ctx.shadowColor = 'rgba(0, 0, 0, 0)'
                this.ctx.shadowBlur = 0
                this.ctx.shadowOffsetX = 0
                this.ctx.shadowOffsetY = 0
                this._drawCenterPointer({}, 0, pointerType)
                this.ctx.restore()
            }
        }

        _getCenterPointerDimensions(pointer, referenceDiameter) {
            const preset = String(pointer.preset || pointer.shape || 'classic').toLowerCase()
            const presetSize = CENTER_POINTER_PRESET_SIZES[preset] || {
                width: '100%',
                height: '100%',
            }
            return {
                preset,
                width: Math.max(
                    0,
                    this.getLength(
                        pointer.width == null ? presetSize.width : pointer.width,
                        referenceDiameter,
                    ),
                ),
                height: Math.max(
                    0,
                    this.getLength(
                        pointer.height == null ? presetSize.height : pointer.height,
                        referenceDiameter,
                    ),
                ),
            }
        }

        _getPointerCornerRadius(pointer, relativeLength) {
            const configuredRadius = pointer.cornerRadius == null ? 3 : pointer.cornerRadius
            return Math.max(0, this.getLength(configuredRadius, relativeLength))
        }

        _traceRoundedPolygon(points, cornerRadius) {
            const validVertices = points.filter(
                point => point && Number.isFinite(point.x) && Number.isFinite(point.y),
            )
            const signedArea = validVertices.reduce((area, point, index) => {
                const next = validVertices[(index + 1) % validVertices.length]
                return area + point.x * next.y - point.y * next.x
            }, 0)
            const vertices = signedArea < 0 ? [...validVertices].reverse() : validVertices
            if (vertices.length < 3 || !(cornerRadius > 0)) {
                if (!vertices.length) return
                this.ctx.moveTo(vertices[0].x, vertices[0].y)
                vertices.slice(1).forEach(point => this.ctx.lineTo(point.x, point.y))
                return
            }

            const corners = vertices.map((point, index) => {
                const previous = vertices[(index - 1 + vertices.length) % vertices.length]
                const next = vertices[(index + 1) % vertices.length]
                const previousX = previous.x - point.x
                const previousY = previous.y - point.y
                const nextX = next.x - point.x
                const nextY = next.y - point.y
                const previousLength = Math.hypot(previousX, previousY)
                const nextLength = Math.hypot(nextX, nextY)
                if (!(previousLength > 0) || !(nextLength > 0)) {
                    return { point, start: point, end: point }
                }
                const previousUnitX = previousX / previousLength
                const previousUnitY = previousY / previousLength
                const nextUnitX = nextX / nextLength
                const nextUnitY = nextY / nextLength
                const angle = Math.acos(
                    clamp(previousUnitX * nextUnitX + previousUnitY * nextUnitY, -1, 1),
                )
                const tangent = Math.tan(angle / 2)
                const requestedDistance = tangent > 1e-6 ? cornerRadius / tangent : 0
                const distance = Math.min(requestedDistance, previousLength / 2, nextLength / 2)
                return {
                    point,
                    start: {
                        x: point.x + previousUnitX * distance,
                        y: point.y + previousUnitY * distance,
                    },
                    end: {
                        x: point.x + nextUnitX * distance,
                        y: point.y + nextUnitY * distance,
                    },
                }
            })

            this.ctx.moveTo(corners[0].start.x, corners[0].start.y)
            corners.forEach((corner, index) => {
                if (index > 0) this.ctx.lineTo(corner.start.x, corner.start.y)
                if (typeof this.ctx.quadraticCurveTo === 'function') {
                    this.ctx.quadraticCurveTo(
                        corner.point.x,
                        corner.point.y,
                        corner.end.x,
                        corner.end.y,
                    )
                } else if (typeof this.ctx.bezierCurveTo === 'function') {
                    this.ctx.bezierCurveTo(
                        corner.start.x + ((corner.point.x - corner.start.x) * 2) / 3,
                        corner.start.y + ((corner.point.y - corner.start.y) * 2) / 3,
                        corner.end.x + ((corner.point.x - corner.end.x) * 2) / 3,
                        corner.end.y + ((corner.point.y - corner.end.y) * 2) / 3,
                        corner.end.x,
                        corner.end.y,
                    )
                } else {
                    this.ctx.lineTo(corner.point.x, corner.point.y)
                    this.ctx.lineTo(corner.end.x, corner.end.y)
                }
            })
        }

        _createDropletButtonPath(radius, pointer) {
            const safeRadius = Math.max(0, radius)
            const { width, height } = this._getCenterPointerDimensions(pointer, safeRadius * 2)
            const halfWidth = clamp(width / 2, safeRadius * 0.04, safeRadius * 0.82)
            const shoulderY = -Math.sqrt(
                Math.max(0, safeRadius * safeRadius - halfWidth * halfWidth),
            )
            const radialOffset = this.getLength(pointer.radialOffset, safeRadius)
            const tipY = -Math.max(safeRadius * 1.04, height + radialOffset)
            const curveHeight = shoulderY - tipY
            const rightAngle = Math.atan2(shoulderY, halfWidth)
            const leftAngle = Math.atan2(shoulderY, -halfWidth) + TWO_PI
            const cornerRadius = this._getPointerCornerRadius(pointer, safeRadius * 2)
            const tipRound = Math.min(cornerRadius, halfWidth * 0.56, curveHeight * 0.22)
            const tipHalfWidth = tipRound * 0.48
            const tipStartY = tipY + tipRound
            const shoulderControlX = Math.min(halfWidth * 0.28, curveHeight * 0.28)
            const shoulderControlY = shoulderY < 0 ? (shoulderControlX * halfWidth) / -shoulderY : 0
            const tipTangentLength = Math.min(curveHeight * 0.2, halfWidth * 0.26)
            const tipTangentMagnitude = Math.hypot(tipHalfWidth, tipRound)
            const tipControlX =
                tipTangentMagnitude > 0
                    ? (tipHalfWidth * tipTangentLength) / tipTangentMagnitude
                    : halfWidth * 0.08
            const tipControlY =
                tipTangentMagnitude > 0
                    ? (tipRound * tipTangentLength) / tipTangentMagnitude
                    : curveHeight * 0.28

            this.ctx.rotate(degreeToRadian(this._getPointerRenderDegree()))
            this.ctx.moveTo(tipHalfWidth, tipStartY)
            if (typeof this.ctx.bezierCurveTo === 'function') {
                this.ctx.bezierCurveTo(
                    tipHalfWidth + tipControlX,
                    tipStartY + tipControlY,
                    halfWidth - shoulderControlX,
                    shoulderY - shoulderControlY,
                    halfWidth,
                    shoulderY,
                )
            } else {
                this.ctx.lineTo(halfWidth, shoulderY)
            }
            this.ctx.arc(0, 0, safeRadius, rightAngle, leftAngle)
            if (typeof this.ctx.bezierCurveTo === 'function') {
                this.ctx.bezierCurveTo(
                    -halfWidth + shoulderControlX,
                    shoulderY - shoulderControlY,
                    -tipHalfWidth - tipControlX,
                    tipStartY + tipControlY,
                    -tipHalfWidth,
                    tipStartY,
                )
            } else {
                this.ctx.lineTo(-tipHalfWidth, tipStartY)
            }
            if (tipRound > 0 && typeof this.ctx.quadraticCurveTo === 'function') {
                this.ctx.quadraticCurveTo(0, tipY, tipHalfWidth, tipStartY)
            } else {
                this.ctx.lineTo(0, tipY)
            }
            this.ctx.closePath()
        }

        _drawCenterPointer(button, radius, pointerType, renderMode = 'both') {
            if (pointerType === 'legacy') {
                this.ctx.beginPath()
                this.ctx.moveTo(-radius, 0)
                this.ctx.lineTo(radius, 0)
                this.ctx.lineTo(0, -radius * 2)
                this.ctx.closePath()
                this.ctx.fill()
                return
            }

            const pointer = this._getPointerConfig() || {}
            const body = pointer.body && typeof pointer.body === 'object' ? pointer.body : {}
            const shadow =
                pointer.shadow && typeof pointer.shadow === 'object' ? pointer.shadow : {}
            const preset = String(pointer.preset || pointer.shape || 'classic').toLowerCase()
            const fused = pointer.fused !== false
            const adaptiveFusion =
                fused && String(pointer.fusionStyle || '').toLowerCase() === 'adaptive'
            const appendPath = renderMode === 'append-path'
            const shadowDisabled = pointer.shadow === false || renderMode === 'stroke' || appendPath
            const referenceDiameter = fused
                ? radius * 2
                : Math.max(
                      0,
                      this.getLength(
                          pointer.referenceSize == null ? '30%' : pointer.referenceSize,
                          this.prizeRadius * 2,
                      ),
                  )
            const { width, height } = this._getCenterPointerDimensions(pointer, referenceDiameter)
            const cornerRadius = this._getPointerCornerRadius(pointer, referenceDiameter)
            const borderWidth = Math.max(
                0,
                this.getLength(
                    body.borderWidth == null ? pointer.borderWidth || 0 : body.borderWidth,
                    this.prizeRadius * 2,
                ),
            )
            const tangentOffset = this.getLength(
                pointer.tangentOffset == null ? pointer.offset : pointer.tangentOffset,
                referenceDiameter,
            )
            const radialOffset = this.getLength(pointer.radialOffset, referenceDiameter / 2)
            const shadowBlur = shadowDisabled
                ? 0
                : Math.max(
                      0,
                      this.getLength(
                          shadow.blur == null ? pointer.shadowBlur : shadow.blur,
                          referenceDiameter,
                      ),
                  )
            const shadowTangentOffset = shadowDisabled
                ? 0
                : this.getLength(
                      shadow.offsetX == null ? pointer.shadowOffsetX : shadow.offsetX,
                      referenceDiameter,
                  )
            const shadowRadialOffset = shadowDisabled
                ? 0
                : this.getLength(
                      shadow.radialOffset == null ? pointer.shadowOffsetY : shadow.radialOffset,
                      referenceDiameter,
                  )
            const baseY = 0
            const tipY = -height
            this.ctx.save()
            const inheritedOpacity = clamp(Number(this.ctx.globalAlpha), 0, 1)
            const pointerRadian = degreeToRadian(this._getPointerRenderDegree())
            this.ctx.rotate(pointerRadian)
            this.ctx.translate(tangentOffset, -radialOffset)
            this.ctx.shadowColor = shadowDisabled
                ? 'rgba(0, 0, 0, 0)'
                : shadow.color || pointer.shadowColor || 'rgba(0, 0, 0, 0)'
            this.ctx.shadowBlur = shadowBlur
            this.ctx.shadowOffsetX =
                shadowTangentOffset * Math.cos(pointerRadian) -
                shadowRadialOffset * Math.sin(pointerRadian)
            this.ctx.shadowOffsetY =
                shadowTangentOffset * Math.sin(pointerRadian) +
                shadowRadialOffset * Math.cos(pointerRadian)
            this.ctx.globalAlpha = adaptiveFusion
                ? inheritedOpacity
                : inheritedOpacity *
                  clamp(
                      Number(
                          body.opacity == null
                              ? pointer.opacity == null
                                  ? preset === 'glass'
                                      ? 0.72
                                      : 1
                                  : pointer.opacity
                              : body.opacity,
                      ),
                      0,
                      1,
                  )
            if (typeof pointer.renderer === 'function') {
                try {
                    pointer.renderer.call(this, this.ctx, {
                        type: 'center',
                        width,
                        height,
                        referenceDiameter,
                        wheelRadius: this.prizeRadius,
                        borderWidth,
                        cornerRadius,
                        mountRadius: 0,
                        mountBorderWidth: 0,
                        showMount: false,
                        shadowBlur,
                        shadowTangentOffset,
                        shadowRadialOffset,
                        tangentExtent: width / 2 + borderWidth / 2,
                        layout: 'overlay',
                        reserveSpace: false,
                        space: 0,
                        requiredSpace: 0,
                        configuredInset: radialOffset,
                        inwardShift: 0,
                        inset: radialOffset,
                        offset: tangentOffset,
                        tipY,
                        baseY,
                        wobbleAngle: this._pointerRenderWobbleAngle,
                        preset,
                        pointer,
                    })
                } catch (cause) {
                    const error = new Error('WheelCanvas custom pointer renderer failed')
                    error.name = 'WheelCanvasRenderError'
                    error.cause = cause
                    this._emitError(error)
                }
                this.ctx.restore()
                return
            }
            if (!appendPath) this.ctx.beginPath()
            if (preset === 'classic') {
                const tipRound = Math.min(cornerRadius, width * 0.18, height * 0.16)
                const tipHalfWidth = tipRound * 0.48
                const tipStartY = tipY + tipRound
                this.ctx.moveTo(tipHalfWidth, tipStartY)
                if (typeof this.ctx.bezierCurveTo === 'function') {
                    this.ctx.bezierCurveTo(
                        width * 0.12,
                        tipY + height * 0.18,
                        width * 0.52,
                        baseY - height * 0.18,
                        width * 0.48,
                        baseY,
                    )
                    this.ctx.lineTo(-width * 0.48, baseY)
                    this.ctx.bezierCurveTo(
                        -width * 0.52,
                        baseY - height * 0.18,
                        -width * 0.12,
                        tipY + height * 0.18,
                        -tipHalfWidth,
                        tipStartY,
                    )
                    if (tipRound > 0 && typeof this.ctx.quadraticCurveTo === 'function') {
                        this.ctx.quadraticCurveTo(0, tipY, tipHalfWidth, tipStartY)
                    } else {
                        this.ctx.lineTo(0, tipY)
                    }
                } else {
                    this.ctx.lineTo(width / 2, baseY)
                    this.ctx.lineTo(-width / 2, baseY)
                }
            } else if (preset === 'arrow') {
                this._traceRoundedPolygon(
                    [
                        { x: 0, y: tipY },
                        { x: width / 2, y: tipY + height * 0.42 },
                        { x: width * 0.2, y: tipY + height * 0.42 },
                        { x: width * 0.2, y: baseY },
                        { x: -width * 0.2, y: baseY },
                        { x: -width * 0.2, y: tipY + height * 0.42 },
                        { x: -width / 2, y: tipY + height * 0.42 },
                    ],
                    cornerRadius,
                )
            } else if (preset === 'chevron') {
                this._traceRoundedPolygon(
                    [
                        { x: 0, y: tipY },
                        { x: width / 2, y: baseY },
                        { x: 0, y: baseY - height * 0.38 },
                        { x: -width / 2, y: baseY },
                    ],
                    cornerRadius,
                )
            } else if (preset === 'notch') {
                this._traceRoundedPolygon(
                    [
                        { x: 0, y: tipY },
                        { x: width / 2, y: baseY - height * 0.1 },
                        { x: width * 0.24, y: baseY },
                        { x: 0, y: baseY - height * 0.22 },
                        { x: -width * 0.24, y: baseY },
                        { x: -width / 2, y: baseY - height * 0.1 },
                    ],
                    cornerRadius,
                )
            } else if (preset === 'kite' || preset === 'diamond' || preset === 'glass') {
                this._traceRoundedPolygon(
                    [
                        { x: 0, y: tipY },
                        { x: width / 2, y: baseY - height * 0.3 },
                        { x: 0, y: baseY },
                        { x: -width / 2, y: baseY - height * 0.3 },
                    ],
                    cornerRadius,
                )
            } else if (preset === 'needle' || preset === 'spear') {
                this._traceRoundedPolygon(
                    [
                        { x: 0, y: tipY },
                        { x: width / 2, y: baseY - height * 0.16 },
                        { x: 0, y: baseY },
                        { x: -width / 2, y: baseY - height * 0.16 },
                    ],
                    cornerRadius,
                )
            } else if (preset === 'pin' || preset === 'teardrop') {
                const tipRound = Math.min(cornerRadius, width * 0.18, height * 0.16)
                const tipHalfWidth = tipRound * 0.48
                const tipStartY = tipY + tipRound
                this.ctx.moveTo(tipHalfWidth, tipStartY)
                if (typeof this.ctx.bezierCurveTo === 'function') {
                    this.ctx.bezierCurveTo(
                        width * 0.08,
                        tipY + height * 0.12,
                        width * 0.52,
                        baseY - height * 0.2,
                        0,
                        baseY,
                    )
                    this.ctx.bezierCurveTo(
                        -width * 0.52,
                        baseY - height * 0.2,
                        -width * 0.08,
                        tipY + height * 0.12,
                        -tipHalfWidth,
                        tipStartY,
                    )
                    if (tipRound > 0 && typeof this.ctx.quadraticCurveTo === 'function') {
                        this.ctx.quadraticCurveTo(0, tipY, tipHalfWidth, tipStartY)
                    } else {
                        this.ctx.lineTo(0, tipY)
                    }
                } else {
                    this.ctx.lineTo(width / 2, baseY - height * 0.2)
                    this.ctx.lineTo(0, baseY)
                    this.ctx.lineTo(-width / 2, baseY - height * 0.2)
                }
            } else if (preset === 'jewel') {
                this._traceRoundedPolygon(
                    [
                        { x: 0, y: tipY },
                        { x: width * 0.32, y: tipY + height * 0.34 },
                        { x: width / 2, y: baseY - height * 0.14 },
                        { x: 0, y: baseY },
                        { x: -width / 2, y: baseY - height * 0.14 },
                        { x: -width * 0.32, y: tipY + height * 0.34 },
                    ],
                    cornerRadius,
                )
            } else if (preset === 'flapper') {
                this._traceRoundedPolygon(
                    [
                        { x: 0, y: tipY },
                        { x: width * 0.24, y: tipY + height * 0.24 },
                        { x: width * 0.42, y: baseY - height * 0.16 },
                        { x: width * 0.28, y: baseY },
                        { x: -width * 0.28, y: baseY },
                        { x: -width * 0.42, y: baseY - height * 0.16 },
                        { x: -width * 0.24, y: tipY + height * 0.24 },
                    ],
                    cornerRadius,
                )
            } else if (preset === 'soft') {
                this._traceRoundedPolygon(
                    [
                        { x: 0, y: tipY },
                        { x: width / 2, y: baseY - height * 0.12 },
                        { x: width * 0.34, y: baseY },
                        { x: -width * 0.34, y: baseY },
                        { x: -width / 2, y: baseY - height * 0.12 },
                    ],
                    cornerRadius,
                )
            } else if (preset === 'tab') {
                this._traceRoundedPolygon(
                    [
                        { x: 0, y: tipY },
                        { x: width / 2, y: tipY + height * 0.42 },
                        { x: width * 0.42, y: baseY },
                        { x: -width * 0.42, y: baseY },
                        { x: -width / 2, y: tipY + height * 0.42 },
                    ],
                    cornerRadius,
                )
            } else if (preset === 'dart') {
                this._traceRoundedPolygon(
                    [
                        { x: 0, y: tipY },
                        { x: width / 2, y: tipY + height * 0.32 },
                        { x: width * 0.2, y: tipY + height * 0.45 },
                        { x: width * 0.34, y: baseY },
                        { x: 0, y: baseY - height * 0.18 },
                        { x: -width * 0.34, y: baseY },
                        { x: -width * 0.2, y: tipY + height * 0.45 },
                        { x: -width / 2, y: tipY + height * 0.32 },
                    ],
                    cornerRadius,
                )
            } else if (preset === 'shield') {
                this._traceRoundedPolygon(
                    [
                        { x: 0, y: tipY },
                        { x: width / 2, y: tipY + height * 0.42 },
                        { x: width * 0.4, y: baseY - height * 0.08 },
                        { x: 0, y: baseY },
                        { x: -width * 0.4, y: baseY - height * 0.08 },
                        { x: -width / 2, y: tipY + height * 0.42 },
                    ],
                    cornerRadius,
                )
            } else if (preset === 'ribbon') {
                this._traceRoundedPolygon(
                    [
                        { x: 0, y: tipY },
                        { x: width / 2, y: tipY + height * 0.34 },
                        { x: width * 0.28, y: tipY + height * 0.48 },
                        { x: width * 0.45, y: baseY },
                        { x: 0, y: baseY - height * 0.24 },
                        { x: -width * 0.45, y: baseY },
                        { x: -width * 0.28, y: tipY + height * 0.48 },
                        { x: -width / 2, y: tipY + height * 0.34 },
                    ],
                    cornerRadius,
                )
            } else {
                this._traceRoundedPolygon(
                    [
                        { x: 0, y: tipY },
                        { x: width / 2, y: baseY },
                        { x: -width / 2, y: baseY },
                    ],
                    cornerRadius,
                )
            }
            this.ctx.closePath()
            if (appendPath) {
                this.ctx.restore()
                return
            }
            const fallbackColor = adaptiveFusion
                ? (hasBackground(button.background)
                      ? button.background
                      : body.color || pointer.color) || '#7c3aed'
                : body.color ||
                  (fused && hasBackground(button.background) ? button.background : pointer.color) ||
                  '#7c3aed'
            const color = this._resolvePointerColor(pointer, fallbackColor)
            const gradient =
                adaptiveFusion || String(pointer.colorSource || 'fixed') === 'currentPrize'
                    ? null
                    : body.gradient && typeof body.gradient === 'object'
                      ? body.gradient
                      : null
            if (gradient && typeof this.ctx.createLinearGradient === 'function') {
                try {
                    const fill = this.ctx.createLinearGradient(0, baseY, 0, tipY)
                    fill.addColorStop(0, gradient.from || color)
                    fill.addColorStop(1, gradient.to || color)
                    this.ctx.fillStyle = fill
                } catch (_error) {
                    this.ctx.fillStyle = color
                }
            } else {
                this.ctx.fillStyle = color
            }
            if (renderMode === 'both' || renderMode === 'fill') this.ctx.fill()
            if (
                (renderMode === 'both' || renderMode === 'stroke') &&
                borderWidth > 0 &&
                typeof this.ctx.stroke === 'function'
            ) {
                this.ctx.lineWidth = borderWidth
                this.ctx.strokeStyle = adaptiveFusion
                    ? button.borderColor || body.borderColor || pointer.borderColor || '#ffffff'
                    : body.borderColor ||
                      (fused ? button.borderColor : pointer.borderColor) ||
                      pointer.borderColor ||
                      '#ffffff'
                this.ctx.lineJoin = 'round'
                this.ctx.stroke()
            }
            this.ctx.restore()
        }

        _drawExternalPointer(metrics) {
            const pointer = this._getPointerConfig()
            if (!metrics || !pointer || this.prizeRadius <= 0) return
            const body = pointer.body && typeof pointer.body === 'object' ? pointer.body : {}
            const mount = pointer.mount && typeof pointer.mount === 'object' ? pointer.mount : {}
            const shadow =
                pointer.shadow && typeof pointer.shadow === 'object' ? pointer.shadow : {}
            const shadowDisabled = pointer.shadow === false
            const preset = String(pointer.preset || pointer.shape || 'minimal').toLowerCase()
            const wheelRadius = Number.isFinite(metrics.wheelRadius)
                ? metrics.wheelRadius
                : this.wheelRadius || this.prizeRadius
            const tipY = -wheelRadius + metrics.inset
            const baseY = tipY - metrics.height
            this.ctx.save()
            try {
                const pointerRadian = degreeToRadian(this._getPointerDegree())
                const wobbleRadian = degreeToRadian(this._pointerRenderWobbleAngle)
                const visualPointerRadian = pointerRadian + wobbleRadian
                this.ctx.rotate(pointerRadian)
                this.ctx.translate(metrics.offset, baseY)
                this.ctx.rotate(wobbleRadian)
                this.ctx.translate(0, -baseY)
                const pointerOpacity = clamp(
                    Number(pointer.opacity == null ? 1 : pointer.opacity),
                    0,
                    1,
                )
                const bodyOpacity = clamp(
                    Number(
                        body.opacity == null
                            ? preset === 'glass'
                                ? 0.72 * pointerOpacity
                                : pointerOpacity
                            : body.opacity,
                    ),
                    0,
                    1,
                )
                this.ctx.globalAlpha = bodyOpacity
                const bodyColor = this._resolvePointerColor(
                    pointer,
                    body.color || pointer.color || '#7c3aed',
                )
                const bodyGradient =
                    String(pointer.colorSource || 'fixed') === 'currentPrize'
                        ? null
                        : body.gradient && typeof body.gradient === 'object'
                          ? body.gradient
                          : null
                if (bodyGradient && typeof this.ctx.createLinearGradient === 'function') {
                    try {
                        const gradient = this.ctx.createLinearGradient(0, baseY, 0, tipY)
                        gradient.addColorStop(0, bodyGradient.from || bodyColor)
                        gradient.addColorStop(1, bodyGradient.to || bodyColor)
                        this.ctx.fillStyle = gradient
                    } catch (_error) {
                        this.ctx.fillStyle = bodyColor
                    }
                } else {
                    this.ctx.fillStyle = bodyColor
                }
                this.ctx.strokeStyle = body.borderColor || pointer.borderColor || '#ffffff'
                this.ctx.lineWidth = metrics.borderWidth
                this.ctx.lineJoin = 'round'
                this.ctx.shadowColor = shadowDisabled
                    ? 'rgba(0, 0, 0, 0)'
                    : shadow.color || pointer.shadowColor || 'rgba(0, 0, 0, 0)'
                this.ctx.shadowBlur = metrics.shadowBlur
                this.ctx.shadowOffsetX =
                    metrics.shadowTangentOffset * Math.cos(visualPointerRadian) -
                    metrics.shadowRadialOffset * Math.sin(visualPointerRadian)
                this.ctx.shadowOffsetY =
                    metrics.shadowTangentOffset * Math.sin(visualPointerRadian) +
                    metrics.shadowRadialOffset * Math.cos(visualPointerRadian)

                if (typeof pointer.renderer === 'function') {
                    try {
                        pointer.renderer.call(this, this.ctx, {
                            type: 'external',
                            ...metrics,
                            preset,
                            tipY,
                            baseY,
                            wobbleAngle: this._pointerRenderWobbleAngle,
                            pointer,
                        })
                    } catch (cause) {
                        const error = new Error('WheelCanvas custom pointer renderer failed')
                        error.name = 'WheelCanvasRenderError'
                        error.cause = cause
                        this._emitError(error)
                    }
                    return
                }

                this.ctx.beginPath()
                if (preset === 'classic') {
                    const tipRound = Math.min(
                        metrics.cornerRadius,
                        metrics.width * 0.18,
                        metrics.height * 0.16,
                    )
                    const tipHalfWidth = tipRound * 0.48
                    const tipStartY = tipY - tipRound
                    this.ctx.moveTo(tipHalfWidth, tipStartY)
                    if (typeof this.ctx.bezierCurveTo === 'function') {
                        this.ctx.bezierCurveTo(
                            metrics.width * 0.08,
                            tipY - metrics.height * 0.16,
                            metrics.width * 0.5,
                            baseY + metrics.height * 0.42,
                            metrics.width * 0.46,
                            baseY + metrics.height * 0.22,
                        )
                        this.ctx.bezierCurveTo(
                            metrics.width * 0.43,
                            baseY + metrics.height * 0.06,
                            metrics.width * 0.3,
                            baseY,
                            0,
                            baseY,
                        )
                        this.ctx.bezierCurveTo(
                            -metrics.width * 0.3,
                            baseY,
                            -metrics.width * 0.43,
                            baseY + metrics.height * 0.06,
                            -metrics.width * 0.46,
                            baseY + metrics.height * 0.22,
                        )
                        this.ctx.bezierCurveTo(
                            -metrics.width * 0.5,
                            baseY + metrics.height * 0.42,
                            -metrics.width * 0.08,
                            tipY - metrics.height * 0.16,
                            -tipHalfWidth,
                            tipStartY,
                        )
                        if (tipRound > 0 && typeof this.ctx.quadraticCurveTo === 'function') {
                            this.ctx.quadraticCurveTo(0, tipY, tipHalfWidth, tipStartY)
                        } else {
                            this.ctx.lineTo(0, tipY)
                        }
                    } else {
                        this.ctx.lineTo(metrics.width * 0.46, baseY + metrics.height * 0.22)
                        this.ctx.lineTo(metrics.width * 0.3, baseY)
                        this.ctx.lineTo(-metrics.width * 0.3, baseY)
                        this.ctx.lineTo(-metrics.width * 0.46, baseY + metrics.height * 0.22)
                    }
                } else if (preset === 'kite' || preset === 'glass' || preset === 'diamond') {
                    this._traceRoundedPolygon(
                        [
                            { x: 0, y: tipY },
                            { x: metrics.width / 2, y: baseY + metrics.height * 0.34 },
                            { x: 0, y: baseY },
                            { x: -metrics.width / 2, y: baseY + metrics.height * 0.34 },
                        ],
                        metrics.cornerRadius,
                    )
                } else if (preset === 'needle' || preset === 'spear') {
                    this._traceRoundedPolygon(
                        [
                            { x: 0, y: tipY },
                            { x: metrics.width / 2, y: baseY + metrics.height * 0.2 },
                            { x: 0, y: baseY },
                            { x: -metrics.width / 2, y: baseY + metrics.height * 0.2 },
                        ],
                        metrics.cornerRadius,
                    )
                } else if (preset === 'pin' || preset === 'teardrop') {
                    const tipRound = Math.min(
                        metrics.cornerRadius,
                        metrics.width * 0.18,
                        metrics.height * 0.16,
                    )
                    const tipHalfWidth = tipRound * 0.48
                    const tipStartY = tipY - tipRound
                    this.ctx.moveTo(tipHalfWidth, tipStartY)
                    if (typeof this.ctx.bezierCurveTo === 'function') {
                        this.ctx.bezierCurveTo(
                            metrics.width * 0.08,
                            tipY - metrics.height * 0.12,
                            metrics.width * 0.48,
                            baseY + metrics.height * 0.42,
                            0,
                            baseY,
                        )
                        this.ctx.bezierCurveTo(
                            -metrics.width * 0.48,
                            baseY + metrics.height * 0.42,
                            -metrics.width * 0.08,
                            tipY - metrics.height * 0.12,
                            -tipHalfWidth,
                            tipStartY,
                        )
                        if (tipRound > 0 && typeof this.ctx.quadraticCurveTo === 'function') {
                            this.ctx.quadraticCurveTo(0, tipY, tipHalfWidth, tipStartY)
                        } else {
                            this.ctx.lineTo(0, tipY)
                        }
                    } else {
                        this.ctx.lineTo(metrics.width * 0.36, baseY + metrics.height * 0.24)
                        this.ctx.lineTo(0, baseY)
                        this.ctx.lineTo(-metrics.width * 0.36, baseY + metrics.height * 0.24)
                    }
                } else if (preset === 'jewel') {
                    this._traceRoundedPolygon(
                        [
                            { x: 0, y: tipY },
                            { x: metrics.width * 0.32, y: tipY - metrics.height * 0.36 },
                            { x: metrics.width / 2, y: baseY + metrics.height * 0.22 },
                            { x: 0, y: baseY },
                            { x: -metrics.width / 2, y: baseY + metrics.height * 0.22 },
                            { x: -metrics.width * 0.32, y: tipY - metrics.height * 0.36 },
                        ],
                        metrics.cornerRadius,
                    )
                } else if (preset === 'flapper') {
                    this._traceRoundedPolygon(
                        [
                            { x: 0, y: tipY },
                            { x: metrics.width * 0.24, y: tipY - metrics.height * 0.24 },
                            { x: metrics.width * 0.42, y: baseY + metrics.height * 0.22 },
                            { x: metrics.width * 0.28, y: baseY },
                            { x: -metrics.width * 0.28, y: baseY },
                            { x: -metrics.width * 0.42, y: baseY + metrics.height * 0.22 },
                            { x: -metrics.width * 0.24, y: tipY - metrics.height * 0.24 },
                        ],
                        metrics.cornerRadius,
                    )
                } else if (preset === 'arrow') {
                    this._traceRoundedPolygon(
                        [
                            { x: 0, y: tipY },
                            { x: metrics.width / 2, y: tipY - metrics.height * 0.38 },
                            { x: metrics.width * 0.2, y: tipY - metrics.height * 0.38 },
                            { x: metrics.width * 0.2, y: baseY },
                            { x: -metrics.width * 0.2, y: baseY },
                            { x: -metrics.width * 0.2, y: tipY - metrics.height * 0.38 },
                            { x: -metrics.width / 2, y: tipY - metrics.height * 0.38 },
                        ],
                        metrics.cornerRadius,
                    )
                } else if (preset === 'chevron') {
                    this._traceRoundedPolygon(
                        [
                            { x: 0, y: tipY },
                            { x: metrics.width / 2, y: baseY },
                            { x: 0, y: baseY + metrics.height * 0.38 },
                            { x: -metrics.width / 2, y: baseY },
                        ],
                        metrics.cornerRadius,
                    )
                } else if (preset === 'notch') {
                    this._traceRoundedPolygon(
                        [
                            { x: 0, y: tipY },
                            { x: metrics.width / 2, y: baseY + metrics.height * 0.12 },
                            { x: metrics.width * 0.25, y: baseY },
                            { x: 0, y: baseY + metrics.height * 0.24 },
                            { x: -metrics.width * 0.25, y: baseY },
                            { x: -metrics.width / 2, y: baseY + metrics.height * 0.12 },
                        ],
                        metrics.cornerRadius,
                    )
                } else if (preset === 'soft') {
                    this._traceRoundedPolygon(
                        [
                            { x: 0, y: tipY },
                            { x: metrics.width / 2, y: baseY + metrics.height * 0.12 },
                            { x: metrics.width * 0.34, y: baseY },
                            { x: -metrics.width * 0.34, y: baseY },
                            { x: -metrics.width / 2, y: baseY + metrics.height * 0.12 },
                        ],
                        metrics.cornerRadius,
                    )
                } else if (preset === 'tab') {
                    this._traceRoundedPolygon(
                        [
                            { x: 0, y: tipY },
                            { x: metrics.width / 2, y: tipY - metrics.height * 0.42 },
                            { x: metrics.width * 0.42, y: baseY },
                            { x: -metrics.width * 0.42, y: baseY },
                            { x: -metrics.width / 2, y: tipY - metrics.height * 0.42 },
                        ],
                        metrics.cornerRadius,
                    )
                } else if (preset === 'dart') {
                    this._traceRoundedPolygon(
                        [
                            { x: 0, y: tipY },
                            { x: metrics.width / 2, y: tipY - metrics.height * 0.32 },
                            { x: metrics.width * 0.2, y: tipY - metrics.height * 0.45 },
                            { x: metrics.width * 0.34, y: baseY },
                            { x: 0, y: baseY + metrics.height * 0.18 },
                            { x: -metrics.width * 0.34, y: baseY },
                            { x: -metrics.width * 0.2, y: tipY - metrics.height * 0.45 },
                            { x: -metrics.width / 2, y: tipY - metrics.height * 0.32 },
                        ],
                        metrics.cornerRadius,
                    )
                } else if (preset === 'shield') {
                    this._traceRoundedPolygon(
                        [
                            { x: 0, y: tipY },
                            { x: metrics.width / 2, y: tipY - metrics.height * 0.42 },
                            { x: metrics.width * 0.4, y: baseY + metrics.height * 0.08 },
                            { x: 0, y: baseY },
                            { x: -metrics.width * 0.4, y: baseY + metrics.height * 0.08 },
                            { x: -metrics.width / 2, y: tipY - metrics.height * 0.42 },
                        ],
                        metrics.cornerRadius,
                    )
                } else if (preset === 'ribbon') {
                    this._traceRoundedPolygon(
                        [
                            { x: 0, y: tipY },
                            { x: metrics.width / 2, y: tipY - metrics.height * 0.34 },
                            { x: metrics.width * 0.28, y: tipY - metrics.height * 0.48 },
                            { x: metrics.width * 0.45, y: baseY },
                            { x: 0, y: baseY + metrics.height * 0.24 },
                            { x: -metrics.width * 0.45, y: baseY },
                            { x: -metrics.width * 0.28, y: tipY - metrics.height * 0.48 },
                            { x: -metrics.width / 2, y: tipY - metrics.height * 0.34 },
                        ],
                        metrics.cornerRadius,
                    )
                } else {
                    this._traceRoundedPolygon(
                        [
                            { x: -metrics.width / 2, y: baseY },
                            { x: metrics.width / 2, y: baseY },
                            { x: 0, y: tipY },
                        ],
                        metrics.cornerRadius,
                    )
                }
                this.ctx.closePath()
                this.ctx.fill()
                if (metrics.borderWidth > 0 && typeof this.ctx.stroke === 'function')
                    this.ctx.stroke()

                if (preset === 'classic' && hasBackground(body.shadeColor)) {
                    this.ctx.shadowColor = 'rgba(0, 0, 0, 0)'
                    this.ctx.beginPath()
                    this.ctx.moveTo(metrics.width * 0.08, tipY - metrics.height * 0.16)
                    if (typeof this.ctx.bezierCurveTo === 'function') {
                        this.ctx.bezierCurveTo(
                            metrics.width * 0.22,
                            tipY - metrics.height * 0.32,
                            metrics.width * 0.48,
                            baseY + metrics.height * 0.38,
                            metrics.width * 0.3,
                            baseY + metrics.height * 0.08,
                        )
                    } else {
                        this.ctx.lineTo(metrics.width * 0.3, baseY + metrics.height * 0.08)
                    }
                    this.ctx.strokeStyle = body.shadeColor
                    this.ctx.lineWidth = Math.max(
                        1,
                        this.getLength(
                            body.shadeWidth == null ? 1.4 : body.shadeWidth,
                            this.radius * 2,
                        ),
                    )
                    this.ctx.stroke()
                }

                if (metrics.showMount && metrics.mountRadius > 0) {
                    this.ctx.globalAlpha = clamp(
                        Number(mount.opacity == null ? pointerOpacity : mount.opacity),
                        0,
                        1,
                    )
                    this.ctx.shadowColor = 'rgba(0, 0, 0, 0)'
                    this.ctx.beginPath()
                    this.ctx.arc(0, baseY, metrics.mountRadius, 0, TWO_PI)
                    const mountColor = mount.color || pointer.mountColor || '#ffffff'
                    const mountGradient =
                        mount.gradient && typeof mount.gradient === 'object' ? mount.gradient : null
                    if (
                        (mountGradient || preset === 'classic') &&
                        mount.gradient !== false &&
                        typeof this.ctx.createRadialGradient === 'function'
                    ) {
                        try {
                            const gradient = this.ctx.createRadialGradient(
                                -metrics.mountRadius * 0.34,
                                baseY - metrics.mountRadius * 0.34,
                                Math.max(0.5, metrics.mountRadius * 0.08),
                                0,
                                baseY,
                                metrics.mountRadius,
                            )
                            gradient.addColorStop(
                                0,
                                (mountGradient && mountGradient.highlight) || '#ffffff',
                            )
                            gradient.addColorStop(
                                0.58,
                                (mountGradient && mountGradient.middle) || mountColor,
                            )
                            gradient.addColorStop(
                                1,
                                (mountGradient && mountGradient.edge) || '#d8d3e3',
                            )
                            this.ctx.fillStyle = gradient
                        } catch (_error) {
                            this.ctx.fillStyle = mountColor
                        }
                    } else {
                        this.ctx.fillStyle = mountColor
                    }
                    this.ctx.fill()
                    if (metrics.mountBorderWidth > 0 && typeof this.ctx.stroke === 'function') {
                        this.ctx.lineWidth = metrics.mountBorderWidth
                        this.ctx.strokeStyle =
                            mount.borderColor || pointer.mountBorderColor || '#6d28d9'
                        this.ctx.stroke()
                    }
                    const innerRadius = metrics.mountRadius * 0.42
                    if (innerRadius > 0) {
                        this.ctx.beginPath()
                        this.ctx.arc(0, baseY, innerRadius, 0, TWO_PI)
                        this.ctx.fillStyle =
                            mount.innerColor || pointer.accentColor || 'rgba(124, 58, 237, 0.22)'
                        this.ctx.fill()
                    }
                }

                const accentColor = pointer.accentColor
                if (accentColor && preset !== 'triangle') {
                    this.ctx.globalAlpha = bodyOpacity
                    this.ctx.shadowColor = 'rgba(0, 0, 0, 0)'
                    this.ctx.beginPath()
                    if (preset === 'classic') {
                        this.ctx.moveTo(-metrics.width * 0.16, baseY + metrics.height * 0.32)
                        if (typeof this.ctx.bezierCurveTo === 'function') {
                            this.ctx.bezierCurveTo(
                                -metrics.width * 0.2,
                                baseY + metrics.height * 0.5,
                                -metrics.width * 0.1,
                                tipY - metrics.height * 0.32,
                                -metrics.width * 0.035,
                                tipY - metrics.height * 0.18,
                            )
                        } else {
                            this.ctx.lineTo(-metrics.width * 0.035, tipY - metrics.height * 0.18)
                        }
                    } else if (preset === 'jewel') {
                        const facetBaseY = Math.min(
                            tipY - metrics.height * 0.12,
                            baseY + metrics.mountRadius * 1.08,
                        )
                        this.ctx.moveTo(0, tipY)
                        this.ctx.lineTo(metrics.width * 0.32, tipY - metrics.height * 0.36)
                        this.ctx.moveTo(0, tipY)
                        this.ctx.lineTo(-metrics.width * 0.32, tipY - metrics.height * 0.36)
                        this.ctx.moveTo(0, facetBaseY)
                        this.ctx.lineTo(metrics.width * 0.32, tipY - metrics.height * 0.36)
                        this.ctx.moveTo(0, facetBaseY)
                        this.ctx.lineTo(-metrics.width * 0.32, tipY - metrics.height * 0.36)
                    } else if (preset === 'glass') {
                        this.ctx.moveTo(-metrics.width * 0.18, baseY + metrics.height * 0.18)
                        this.ctx.lineTo(-metrics.width * 0.04, tipY - metrics.height * 0.08)
                        this.ctx.moveTo(metrics.width * 0.04, baseY + metrics.height * 0.16)
                        this.ctx.lineTo(metrics.width * 0.2, baseY + metrics.height * 0.38)
                    } else {
                        this.ctx.moveTo(0, baseY + metrics.height * 0.22)
                        this.ctx.lineTo(0, tipY - metrics.height * 0.2)
                    }
                    this.ctx.strokeStyle = accentColor
                    this.ctx.lineWidth = Math.max(
                        1,
                        this.getLength(
                            pointer.accentWidth == null ? 1 : pointer.accentWidth,
                            this.radius * 2,
                        ),
                    )
                    this.ctx.stroke()
                }
            } finally {
                this.ctx.restore()
            }
        }

        _applyFont(font, relativeLength) {
            const fontColor = hasOwn(font, 'fontColor')
                ? font.fontColor
                : this.defaultStyle.fontColor
            const fontWeight = hasOwn(font, 'fontWeight')
                ? font.fontWeight
                : this.defaultStyle.fontWeight
            const fontSize = Math.max(
                1,
                this.getLength(
                    hasOwn(font, 'fontSize') ? font.fontSize : this.defaultStyle.fontSize,
                    relativeLength,
                ),
            )
            const fontFamily =
                font.fontFamily ||
                font.fontStyle ||
                this.defaultStyle.fontFamily ||
                this.defaultStyle.fontStyle
            this.ctx.fillStyle = fontColor
            this.ctx.font = `${fontWeight} ${Math.round(fontSize)}px ${fontFamily}`
            const textAlign = String(
                hasOwn(font, 'textAlign')
                    ? font.textAlign
                    : this.defaultStyle.textAlign || 'center',
            ).toLowerCase()
            this.ctx.textAlign = ['left', 'right', 'center'].includes(textAlign)
                ? textAlign
                : 'center'
        }

        _imageSize(image, imageInfo, maxWidth, maxHeight) {
            const naturalWidth = image.naturalWidth || image.width || 1
            const naturalHeight = image.naturalHeight || image.height || 1
            let width = this.getLength(imageInfo.width, maxWidth)
            let height = this.getLength(imageInfo.height, maxHeight)

            if (!width && !height) {
                width = naturalWidth
                height = naturalHeight
            } else if (!width) {
                width = (height * naturalWidth) / naturalHeight
            } else if (!height) {
                height = (width * naturalHeight) / naturalWidth
            }
            return { width, height }
        }

        _getEventPoint(event) {
            if (!event || !this.canvas || typeof this.canvas.getBoundingClientRect !== 'function') {
                return null
            }
            const rect = this.canvas.getBoundingClientRect()
            if (!rect.width || !rect.height) return null
            const clientX = Number(event.clientX)
            const clientY = Number(event.clientY)
            if (!Number.isFinite(clientX) || !Number.isFinite(clientY)) return null
            return {
                x: ((clientX - rect.left) * this.boxWidth) / rect.width - this.centerX,
                y: ((clientY - rect.top) * this.boxHeight) / rect.height - this.centerY,
            }
        }

        _getPhysicsConfig() {
            const physics = this.physics || DEFAULT_PHYSICS
            const readNumber = (name, minimum, maximum = Infinity) => {
                const configured = Number(physics[name])
                const fallback = Number(DEFAULT_PHYSICS[name])
                const value = Number.isFinite(configured) ? configured : fallback
                return clamp(value, minimum, maximum)
            }
            const minVelocity = readNumber('minVelocity', 0)
            const maxVelocity = Math.max(minVelocity, readNumber('maxVelocity', 0))
            const minLandingTurns = Math.floor(readNumber('minLandingTurns', 0, 100))
            const maxLandingTurns = Math.max(
                minLandingTurns,
                Math.floor(readNumber('maxLandingTurns', 0, 100)),
            )
            const minLandingDuration = readNumber('minLandingDuration', 1, 60000)
            const maxLandingDuration = Math.max(
                minLandingDuration,
                readNumber('maxLandingDuration', 1, 60000),
            )
            const wheelDiameter = Math.max(1, (this.wheelRadius || this.radius || 1) * 2)
            return {
                enabled: Boolean(physics.enabled),
                sensitivity: readNumber('sensitivity', 0, 10),
                dragThreshold: Math.max(0, this.getLength(physics.dragThreshold, 1)),
                innerRadius: Math.max(
                    0,
                    this.getLength(
                        physics.innerRadius == null
                            ? DEFAULT_PHYSICS.innerRadius
                            : physics.innerRadius,
                        wheelDiameter,
                    ),
                ),
                minVelocity,
                maxVelocity,
                friction: readNumber('friction', 0),
                drag: readNumber('drag', 0),
                stopVelocity: readNumber('stopVelocity', 0),
                waitingVelocity: readNumber('waitingVelocity', 0, maxVelocity),
                waitingStrategy: physics.waitingStrategy === 'coast' ? 'coast' : 'hold',
                velocitySmoothing: readNumber('velocitySmoothing', 0, 1),
                sampleWindow: readNumber('sampleWindow', 16, 1000),
                sampleHalfLife: readNumber('sampleHalfLife', 1, 1000),
                releaseWindow: readNumber('releaseWindow', 0, 5000),
                releaseDamping: readNumber('releaseDamping', 0, 100),
                maxSubstep: readNumber('maxSubstep', 1, 50),
                maxCatchUp: readNumber('maxCatchUp', 16, 2000),
                minLandingTurns,
                maxLandingTurns,
                minLandingDuration,
                maxLandingDuration,
                accelerationBlendDuration: readNumber('accelerationBlendDuration', 0, 2000),
                maxBrake: readNumber('maxBrake', 1, 100000),
                maxJerk: readNumber('maxJerk', 1, 1000000),
                landingSamples: Math.floor(readNumber('landingSamples', 24, 512)),
                forbidSpeedUp: physics.forbidSpeedUp !== false,
                errorStrategy: physics.errorStrategy === 'stop' ? 'stop' : 'coast',
                resultTimeout: readNumber('resultTimeout', 0),
                dragFrom: physics.dragFrom === 'wheel' ? 'wheel' : 'prizes',
                direction: ['clockwise', 'counterclockwise'].includes(physics.direction)
                    ? physics.direction
                    : 'both',
                resultMode: physics.resultMode === 'weighted' ? 'weighted' : 'natural',
                snapToPrize: Boolean(physics.snapToPrize),
            }
        }

        _applyPhysicsDirection(value, direction) {
            if (direction === 'clockwise') return Math.max(0, value)
            if (direction === 'counterclockwise') return Math.min(0, value)
            return value
        }

        _captureActiveGeometry() {
            this._activeLayout = this._getPrizeLayout().map(item => Object.assign({}, item))
            this._activePrizes = this.prizes.slice()
            this._activeButtons = this.buttons.map(button => ({
                ...button,
                fonts: (button.fonts || []).map(font => ({ ...font })),
                imgs: (button.imgs || []).slice(),
            }))
            this._activeOffsetDegree = Number(this.defaultConfig.offsetDegree) || 0
            this._activePointerDegree = this._getPointerDegree(false)
            this._activePointerConfig = this.pointer
                ? {
                      ...this.pointer,
                      body:
                          this.pointer.body && typeof this.pointer.body === 'object'
                              ? {
                                    ...this.pointer.body,
                                    gradient:
                                        this.pointer.body.gradient &&
                                        typeof this.pointer.body.gradient === 'object'
                                            ? { ...this.pointer.body.gradient }
                                            : this.pointer.body.gradient,
                                }
                              : this.pointer.body,
                      mount:
                          this.pointer.mount && typeof this.pointer.mount === 'object'
                              ? {
                                    ...this.pointer.mount,
                                    gradient:
                                        this.pointer.mount.gradient &&
                                        typeof this.pointer.mount.gradient === 'object'
                                            ? { ...this.pointer.mount.gradient }
                                            : this.pointer.mount.gradient,
                                }
                              : this.pointer.mount,
                      shadow:
                          this.pointer.shadow && typeof this.pointer.shadow === 'object'
                              ? { ...this.pointer.shadow }
                              : this.pointer.shadow,
                  }
                : null
            this._pointerDirtyDuringSpin = false
            this._buttonDirtyDuringSpin = false
            this._invalidateRenderCaches()
        }

        _handlePointerDown(event) {
            const physics = this._getPhysicsConfig()
            if (
                !physics.enabled ||
                this._destroyed ||
                this.state !== 'idle' ||
                !this.prizes.length
            ) {
                return
            }
            if (event && event.isPrimary === false) return
            if (event && event.button != null && event.button !== 0) return
            const point = this._getEventPoint(event)
            const distance = point ? Math.hypot(point.x, point.y) : Infinity
            const outerLimit = physics.dragFrom === 'wheel' ? this.wheelRadius : this.prizeRadius
            if (
                !point ||
                distance > outerLimit ||
                distance < physics.innerRadius ||
                (physics.dragFrom === 'prizes' && distance <= this.maxButtonRadius)
            ) {
                return
            }

            const now = this._getNow()
            this._gesture = {
                pointerId: event.pointerId,
                startX: point.x,
                startY: point.y,
                lastAngle: (Math.atan2(point.y, point.x) * 180) / Math.PI,
                lastTime: now,
                cumulativeAngle: 0,
                samples: [{ time: now, angle: 0 }],
                velocity: 0,
                hasVelocity: false,
                dragging: false,
                event,
            }
            if (typeof this.canvas.setPointerCapture === 'function' && event.pointerId != null) {
                try {
                    this.canvas.setPointerCapture(event.pointerId)
                } catch (error) {}
            }
        }

        _handlePointerMove(event) {
            const gesture = this._gesture
            if (!gesture || (event.pointerId != null && event.pointerId !== gesture.pointerId))
                return
            const physics = this._getPhysicsConfig()
            const now = this._getNow()
            const coalescedEvents =
                event && typeof event.getCoalescedEvents === 'function'
                    ? event.getCoalescedEvents()
                    : null
            const movementEvents =
                Array.isArray(coalescedEvents) && coalescedEvents.length ? coalescedEvents : [event]
            let movedWheel = false

            movementEvents.forEach((movementEvent, sampleIndex) => {
                if (this._destroyed || this._gesture !== gesture) return
                const point = this._getEventPoint(movementEvent)
                if (!point) return
                const eventTime = Number(movementEvent.timeStamp)
                const sampleTime =
                    Number.isFinite(eventTime) && eventTime > 0 && Math.abs(eventTime - now) <= 1000
                        ? eventTime
                        : sampleIndex === movementEvents.length - 1
                          ? now
                          : NaN
                if (!Number.isFinite(sampleTime) || sampleTime <= gesture.lastTime) return

                if (!gesture.dragging) {
                    const moved = Math.hypot(point.x - gesture.startX, point.y - gesture.startY)
                    if (moved < physics.dragThreshold) return
                    gesture.dragging = true
                    this._captureActiveGeometry()
                    this.state = 'dragging'
                    this._syncAccessibilityState()
                    const callbackResult = this._invokePhysicsCallback('onStart', event, {
                        rotation: normalizeDegree(this.rotation),
                        source: 'gesture',
                    })
                    if (callbackResult === PHYSICS_CALLBACK_FAILED) return
                    if (this._destroyed || this._gesture !== gesture || this.state !== 'dragging') {
                        return
                    }
                }

                const angle = (Math.atan2(point.y, point.x) * 180) / Math.PI
                let delta = signedDegreeDelta(angle, gesture.lastAngle) * physics.sensitivity
                delta = this._applyPhysicsDirection(delta, physics.direction)
                gesture.cumulativeAngle += delta
                gesture.lastAngle = angle
                gesture.lastTime = sampleTime
                gesture.samples.push({ time: sampleTime, angle: gesture.cumulativeAngle })
                const oldestTime = sampleTime - physics.sampleWindow
                while (gesture.samples.length > 2 && gesture.samples[1].time < oldestTime) {
                    gesture.samples.shift()
                }
                const estimatedVelocity = this._estimateGestureVelocity(
                    gesture.samples,
                    physics.sampleHalfLife,
                )
                if (Number.isFinite(estimatedVelocity)) {
                    if (!gesture.hasVelocity) {
                        gesture.velocity = estimatedVelocity
                        gesture.hasVelocity = true
                    } else {
                        const smoothing = physics.velocitySmoothing
                        gesture.velocity =
                            gesture.velocity * (1 - smoothing) + estimatedVelocity * smoothing
                    }
                }
                this.rotation += delta
                movedWheel = true
            })
            if (!movedWheel) return
            if (typeof event.preventDefault === 'function') event.preventDefault()
            try {
                this._emitCurrentPrize()
                this.draw()
            } catch (error) {
                this._releasePointerCapture(event)
                this._stopAnimation(false)
                this._emitError(error)
            }
        }

        _handlePointerUp(event) {
            const gesture = this._gesture
            if (!gesture || (event.pointerId != null && event.pointerId !== gesture.pointerId)) {
                return
            }
            this._gesture = null
            this._releasePointerCapture(event)
            if (!gesture.dragging) return
            if (typeof event.preventDefault === 'function') event.preventDefault()
            this._suppressClick = true
            this.config.setTimeout(() => {
                this._suppressClick = false
            }, 0)

            const physics = this._getPhysicsConfig()
            const idleTime = Math.max(0, this._getNow() - gesture.lastTime)
            const releaseFactor =
                physics.releaseWindow > 0 && idleTime >= physics.releaseWindow
                    ? 0
                    : Math.exp((-physics.releaseDamping * idleTime) / 1000)
            this._startPhysicsMotion(gesture.velocity * releaseFactor, event, true)
        }

        _estimateGestureVelocity(samples, halfLife) {
            if (!Array.isArray(samples) || samples.length < 2) return 0
            const latestTime = samples[samples.length - 1].time
            const decay = Math.log(2) / Math.max(1, halfLife)
            let totalWeight = 0
            let meanTime = 0
            let meanAngle = 0
            samples.forEach(sample => {
                const weight = Math.exp((sample.time - latestTime) * decay)
                totalWeight += weight
                meanTime += sample.time * weight
                meanAngle += sample.angle * weight
            })
            if (!totalWeight) return 0
            meanTime /= totalWeight
            meanAngle /= totalWeight
            let covariance = 0
            let variance = 0
            samples.forEach(sample => {
                const weight = Math.exp((sample.time - latestTime) * decay)
                const timeDelta = sample.time - meanTime
                covariance += weight * timeDelta * (sample.angle - meanAngle)
                variance += weight * timeDelta * timeDelta
            })
            return variance > Number.EPSILON ? (covariance * 1000) / variance : 0
        }

        _handlePointerCancel(event, callbackEvent = event) {
            if (
                !this._gesture ||
                (event.pointerId != null && event.pointerId !== this._gesture.pointerId)
            ) {
                return
            }
            const wasDragging = this._gesture.dragging
            const pointerId = this._gesture.pointerId
            this._gesture = null
            this._releasePointerCapture({ pointerId })
            if (wasDragging) {
                this.state = 'idle'
                this._clearActiveGeometry()
                this.draw()
                this._invokePhysicsCallback('onCancel', callbackEvent, {
                    reason: (event && event.reason) || (event && event.type) || 'pointer-cancel',
                    rotation: normalizeDegree(this.rotation),
                })
            }
        }

        _releasePointerCapture(event) {
            if (
                event &&
                event.pointerId != null &&
                typeof this.canvas.releasePointerCapture === 'function'
            ) {
                try {
                    this.canvas.releasePointerCapture(event.pointerId)
                } catch (error) {}
            }
        }

        _invokePhysicsCallback(name, event, detail) {
            const callback = this.physics && this.physics[name]
            if (typeof callback !== 'function') return undefined
            try {
                return callback.call(this, detail, event)
            } catch (error) {
                if (name === 'onStart' || name === 'onRelease') {
                    this._stopAnimation(false)
                }
                this._emitError(error)
                return PHYSICS_CALLBACK_FAILED
            }
        }

        _handleClick(event) {
            if (this._suppressClick) {
                this._suppressClick = false
                return
            }
            if (this.state !== 'idle' || this.maxButtonRadius <= 0) return
            const point = this._getEventPoint(event)
            if (!point || Math.hypot(point.x, point.y) > this.maxButtonRadius) return

            this._triggerStart(event)
        }

        _handleKeyDown(event) {
            if (!event || (event.key !== 'Enter' && event.key !== ' ')) return
            if (this.state !== 'idle' || this.maxButtonRadius <= 0) return
            if (typeof event.preventDefault === 'function') event.preventDefault()
            this._triggerStart(event)
        }

        _triggerStart(event) {
            const callback = this.startCallback
            if (typeof callback !== 'function') return
            try {
                const result = callback.call(this, event)
                if (result && typeof result.then === 'function') {
                    Promise.resolve(result).catch(error => this._handleStartError(error))
                }
            } catch (error) {
                this._handleStartError(error)
            }
        }

        _handleStartError(error) {
            this._stopAnimation(false)
            this._emitError(error)
        }

        _emitError(error) {
            if (typeof this.errorCallback === 'function') {
                try {
                    this.errorCallback.call(this, error)
                } catch (callbackError) {
                    if (typeof console !== 'undefined' && typeof console.error === 'function') {
                        console.error('WheelCanvas error callback failed:', callbackError)
                    }
                }
                return
            }
            if (typeof console !== 'undefined' && typeof console.error === 'function') {
                console.error('WheelCanvas error:', error)
            }
        }

        _hasStructuralPrizeChange() {
            if (!this._activePrizes || this.prizes.length !== this._activePrizes.length) return true
            for (let index = 0; index < this.prizes.length; index += 1) {
                if (hasOwn(this.prizes, index) !== hasOwn(this._activePrizes, index)) return true
                if (this.prizes[index] !== this._activePrizes[index]) return true
            }
            return false
        }

        _cancelForStructuralPrizeChange() {
            if (this.state === 'idle' || !this._hasStructuralPrizeChange()) return false
            this._stopAnimation(false)
            const error = new Error('WheelCanvas prizes changed structurally during an active spin')
            error.name = 'WheelCanvasConfigurationError'
            this._emitError(error)
            this._scheduleReactiveRefresh(true)
            return true
        }

        play() {
            if (this._destroyed || this.state !== 'idle' || !this.prizes.length) return false
            const now = this._getNow()
            this._gesture = null
            this._captureActiveGeometry()
            this.state = 'accelerating'
            this._syncAccessibilityState()
            this._targetIndex = null
            this._physicsVelocity = 0
            this._phaseStartTime = now
            this._lastFrameTime = now
            try {
                this._callHook('afterStart')
            } catch (error) {
                this._stopAnimation(false)
                throw error
            }
            this._frameId = this._requestAnimationFrame(this._tickFrame)
            return true
        }

        spin(velocity) {
            if (this._destroyed || this.state !== 'idle' || !this.prizes.length) return false
            const physics = this._getPhysicsConfig()
            const configuredVelocity = this._applyPhysicsDirection(
                Number(velocity) || 0,
                physics.direction,
            )
            if (Math.abs(configuredVelocity) < physics.minVelocity) return false
            this._captureActiveGeometry()
            const callbackResult = this._invokePhysicsCallback('onStart', null, {
                rotation: normalizeDegree(this.rotation),
                source: 'api',
            })
            if (callbackResult === PHYSICS_CALLBACK_FAILED) return false
            if (this._destroyed || this.state !== 'idle') return false
            return this._startPhysicsMotion(configuredVelocity, null, false)
        }

        _startPhysicsMotion(velocity, event, fromGesture) {
            if (
                this._destroyed ||
                !this.prizes.length ||
                (this.state !== 'idle' && this.state !== 'dragging')
            ) {
                return false
            }
            const physics = this._getPhysicsConfig()
            this._activePhysicsConfig = physics
            this._physicsOutcomeCancelled = false
            let nextVelocity = Number(velocity)
            if (!Number.isFinite(nextVelocity)) nextVelocity = 0
            nextVelocity = this._applyPhysicsDirection(nextVelocity, physics.direction)
            nextVelocity = clamp(nextVelocity, -physics.maxVelocity, physics.maxVelocity)
            const detail = {
                velocity: nextVelocity,
                speed: Math.abs(nextVelocity),
                direction: nextVelocity < 0 ? 'counterclockwise' : 'clockwise',
                rotation: normalizeDegree(this.rotation),
                source: fromGesture ? 'gesture' : 'api',
            }
            const belowMinimum = Math.abs(nextVelocity) < physics.minVelocity
            if (belowMinimum && !fromGesture) {
                this._clearActiveGeometry()
                return false
            }

            const now = this._getNow()
            this.state = 'coasting'
            this._syncAccessibilityState()
            this._physicsVelocity = nextVelocity
            this._physicsAcceleration = 0
            this._currentSpeed = (nextVelocity * FRAME_DURATION) / 1000
            this._targetIndex = null
            this._lastFrameTime = now
            const callbackResult = this._invokePhysicsCallback('onRelease', event, detail)
            if (callbackResult === PHYSICS_CALLBACK_FAILED) return false
            if (this._destroyed || this.state === 'idle') return false

            const applyTarget = target => this._applyPhysicsTarget(target)
            let isThenable
            try {
                isThenable = callbackResult != null && typeof callbackResult.then === 'function'
            } catch (error) {
                this._failPhysics(error)
                if (this.state !== 'coasting') return false
                this._frameId = this._requestAnimationFrame(this._tickFrame)
                return true
            }
            if (isThenable) {
                this._waitForPhysicsResult(callbackResult, applyTarget, physics)
            } else if (
                !applyTarget(callbackResult) &&
                this.state === 'coasting' &&
                physics.resultMode === 'weighted'
            ) {
                this.stop()
            }

            if (this._destroyed || this.state === 'idle') return false
            if (
                belowMinimum &&
                this.state === 'coasting' &&
                !this._physicsResultToken &&
                physics.resultMode === 'natural'
            ) {
                this._finishPhysics()
                return false
            }
            this._frameId = this._requestAnimationFrame(this._tickFrame)
            return true
        }

        _applyPhysicsTarget(target) {
            if (target == null || this.state !== 'coasting') return false
            let targetIndex
            try {
                targetIndex = Number(target)
            } catch (error) {
                this._failPhysics(error)
                return true
            }
            const prizes = this._activePrizes || this.prizes
            if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= prizes.length) {
                const error = new RangeError(
                    `WheelCanvas physics result must be an integer from 0 to ${Math.max(0, prizes.length - 1)}`,
                )
                error.name = 'WheelCanvasPhysicsError'
                this._failPhysics(error)
                return true
            }
            return this.stop(targetIndex)
        }

        _failPhysics(error) {
            const physics = this._activePhysicsConfig || this._getPhysicsConfig()
            const canCoast =
                !this._destroyed && this.state === 'coasting' && physics.errorStrategy !== 'stop'
            this._clearPendingPhysicsResult()
            this._targetIndex = null
            this._physicsOutcomeCancelled = true
            this._emitError(error)
            if (this._destroyed || this.state !== 'coasting') return
            if (!canCoast) {
                this._stopAnimation(false)
                return
            }
            if (Math.abs(this._physicsVelocity) <= physics.stopVelocity) {
                this._finishPhysics()
            }
        }

        _waitForPhysicsResult(result, applyTarget, physics) {
            this._clearPendingPhysicsResult()
            const token = {}
            this._physicsResultToken = token
            if (physics.resultTimeout > 0) {
                this._physicsResultTimer = this.config.setTimeout(() => {
                    if (this._physicsResultToken !== token) return
                    const error = new Error('WheelCanvas physics result timed out')
                    error.name = 'WheelCanvasPhysicsError'
                    this._failPhysics(error)
                }, physics.resultTimeout)
            }
            Promise.resolve(result)
                .then(target => {
                    if (this._physicsResultToken !== token) return
                    this._clearPendingPhysicsResult()
                    if (applyTarget(target)) return
                    if (this.state !== 'coasting' || physics.resultMode !== 'weighted') return
                    this.stop()
                })
                .catch(error => {
                    if (this._physicsResultToken !== token) return
                    this._failPhysics(error)
                })
        }

        _clearPendingPhysicsResult() {
            this._physicsResultToken = null
            if (this._physicsResultTimer != null) {
                this.config.clearTimeout(this._physicsResultTimer)
                this._physicsResultTimer = null
            }
        }

        stop(index) {
            if (
                this._destroyed ||
                this.state === 'idle' ||
                this.state === 'dragging' ||
                this.state === 'decelerating' ||
                this.state === 'settling'
            ) {
                return false
            }
            if (this._cancelForStructuralPrizeChange()) return false

            let prizeIndex = index
            const prizes = this._activePrizes || this.prizes
            if (prizeIndex == null) prizeIndex = chooseByWeight(prizes, () => this._getRandom())
            try {
                prizeIndex = Number(prizeIndex)
            } catch (error) {
                this._stopAnimation(false)
                this._emitError(error)
                return false
            }
            if (!Number.isFinite(prizeIndex) || prizeIndex < 0) {
                this._stopAnimation(false)
                return false
            }

            this._clearPendingPhysicsResult()
            this._targetIndex = Math.floor(prizeIndex) % prizes.length
            if (this.state === 'coasting') {
                this._beginPhysicsLanding(this._getNow())
            } else if (this.state === 'cruising') {
                this._beginDeceleration(this._getNow())
            }
            return true
        }

        _getEasing(direction) {
            const name = String(this.defaultConfig.speedFunction || 'quad').toLowerCase()
            const easing = EASING[name] || EASING.quad
            return direction === 'in' ? easing.easeIn : easing.easeOut
        }

        _tick(now) {
            try {
                this._advanceAnimation(now)
            } catch (error) {
                this._stopAnimation(false)
                throw error
            }
        }

        _advanceAnimation(now) {
            if (this._destroyed || this.state === 'idle') return
            if (this._cancelForStructuralPrizeChange()) return
            now = this._getNow()
            const rawElapsed = Math.max(0, now - this._lastFrameTime)
            const elapsed = Math.min(50, rawElapsed)
            this._lastFrameTime = now
            const speed = Math.max(0, Number(this.defaultConfig.speed) || 0)

            if (this.state === 'accelerating') {
                const duration = Math.max(0, Number(this.defaultConfig.accelerationTime) || 0)
                const progress = duration ? clamp((now - this._phaseStartTime) / duration, 0, 1) : 1
                const currentSpeed = speed * this._getEasing('in')(progress)
                this._currentSpeed = currentSpeed
                this.rotation += (currentSpeed * elapsed) / FRAME_DURATION
                if (progress >= 1) {
                    this.state = 'cruising'
                    if (this._targetIndex != null) this._beginDeceleration(now)
                }
            } else if (this.state === 'cruising') {
                this._currentSpeed = speed
                this.rotation += (speed * elapsed) / FRAME_DURATION
                if (this._targetIndex != null) this._beginDeceleration(now)
            } else if (this.state === 'coasting') {
                const physics = this._activePhysicsConfig || this._getPhysicsConfig()
                if (this._advancePhysicsCoast(rawElapsed, physics)) return
            } else if (this.state === 'settling') {
                if (this._advancePhysicsLanding(now)) return
            } else if (this.state === 'decelerating') {
                const duration = Math.max(1, Number(this.defaultConfig.decelerationTime) || 1)
                const progress = clamp((now - this._phaseStartTime) / duration, 0, 1)
                const progressSquared = progress * progress
                const progressCubed = progressSquared * progress
                const hermiteProgress =
                    -2 * progressCubed +
                    3 * progressSquared +
                    this._decelerationTangent * (progressCubed - 2 * progressSquared + progress)
                this.rotation =
                    this._decelerationFrom +
                    (this._decelerationTo - this._decelerationFrom) * hermiteProgress

                if (progress >= 1) {
                    this.rotation = this._decelerationTo
                    this._emitCurrentPrize()
                    if (this._destroyed || this.state === 'idle') return
                    this.draw()
                    if (this._destroyed || this.state === 'idle') return
                    this._finish()
                    return
                }
            }

            this._emitCurrentPrize()
            if (this._destroyed || this.state === 'idle') return
            this.draw()
            if (this._destroyed || this.state === 'idle') return
            this._frameId = this._requestAnimationFrame(this._tickFrame)
        }

        _advancePhysicsCoast(elapsedMilliseconds, physics) {
            let remainingMilliseconds = Math.min(elapsedMilliseconds, physics.maxCatchUp)
            while (remainingMilliseconds > 0 && this.state === 'coasting') {
                const stepMilliseconds = Math.min(remainingMilliseconds, physics.maxSubstep)
                const stepSeconds = stepMilliseconds / 1000
                const direction = Math.sign(this._physicsVelocity) || 1
                const speedBefore = Math.abs(this._physicsVelocity)
                const shouldHold = this._physicsResultToken && physics.waitingStrategy === 'hold'
                const floorSpeed = shouldHold ? Math.min(speedBefore, physics.waitingVelocity) : 0
                const decay = this._decayPhysicsSpeed(
                    speedBefore,
                    stepSeconds,
                    shouldHold ? floorSpeed : physics.stopVelocity,
                    physics,
                )
                const speedAfter = shouldHold ? Math.max(floorSpeed, decay.speed) : decay.speed
                const heldTime = shouldHold ? Math.max(0, stepSeconds - decay.travelTime) : 0
                const distance = decay.distance + speedAfter * heldTime
                this.rotation += distance * direction
                this._physicsVelocity = speedAfter * direction
                this._physicsAcceleration = stepSeconds
                    ? ((speedAfter - speedBefore) / stepSeconds) * direction
                    : 0
                this._currentSpeed = (this._physicsVelocity * FRAME_DURATION) / 1000
                remainingMilliseconds -= stepMilliseconds

                if (
                    this._physicsResultToken &&
                    physics.waitingStrategy === 'coast' &&
                    (decay.stopped || speedAfter <= physics.stopVelocity)
                ) {
                    const error = new Error(
                        'WheelCanvas physics result was not available before the wheel stopped',
                    )
                    error.name = 'WheelCanvasPhysicsError'
                    this._failPhysics(error)
                    return true
                }

                if (
                    !this._physicsResultToken &&
                    (decay.stopped || speedAfter <= physics.stopVelocity)
                ) {
                    this._emitCurrentPrize()
                    if (this._destroyed || this.state === 'idle') return true
                    this.draw()
                    if (this._destroyed || this.state === 'idle') return true
                    this._finishPhysics()
                    return true
                }
            }
            return false
        }

        _decayPhysicsSpeed(speed, elapsedSeconds, stopVelocity, physics) {
            if (speed <= stopVelocity || elapsedSeconds <= 0) {
                return {
                    speed: Math.max(0, speed),
                    distance: 0,
                    stopped: speed <= stopVelocity,
                    travelTime: 0,
                }
            }
            const friction = physics.friction
            const drag = physics.drag
            let travelTime = elapsedSeconds
            let timeToStop = Infinity
            if (drag > Number.EPSILON) {
                const offset = friction / drag
                const denominator = stopVelocity + offset
                if (denominator > 0) {
                    timeToStop = Math.log((speed + offset) / denominator) / drag
                }
            } else if (friction > Number.EPSILON) {
                timeToStop = (speed - stopVelocity) / friction
            }
            if (Number.isFinite(timeToStop)) travelTime = Math.min(travelTime, timeToStop)

            let nextSpeed
            let distance
            if (drag > Number.EPSILON) {
                const offset = friction / drag
                nextSpeed = (speed + offset) * Math.exp(-drag * travelTime) - offset
                distance = (speed - nextSpeed - friction * travelTime) / drag
            } else {
                nextSpeed = Math.max(0, speed - friction * travelTime)
                distance = ((speed + nextSpeed) / 2) * travelTime
            }
            const stopped =
                travelTime + Number.EPSILON < elapsedSeconds || nextSpeed <= stopVelocity
            return {
                speed: stopped ? stopVelocity : Math.max(0, nextSpeed),
                distance: Math.max(0, distance),
                stopped,
                travelTime,
            }
        }

        _beginPhysicsLanding(now) {
            if (this._targetIndex == null || this.state !== 'coasting') return false
            const physics = this._activePhysicsConfig || this._getPhysicsConfig()
            const layout = (this._activeLayout || this._getPrizeLayout())[this._targetIndex]
            if (!layout) {
                this._failPhysics(new RangeError('WheelCanvas physics target no longer exists'))
                return false
            }
            const speed = Math.abs(this._physicsVelocity)
            if (speed <= physics.stopVelocity) {
                const error = new Error(
                    'WheelCanvas cannot reach the selected prize without increasing speed',
                )
                error.name = 'WheelCanvasPhysicsError'
                this._failPhysics(error)
                return false
            }

            const direction = Math.sign(this._physicsVelocity) || 1
            const offset = this._activeLayout
                ? this._activeOffsetDegree
                : Number(this.defaultConfig.offsetDegree) || 0
            const stopRange = clamp(this.getLength(this.defaultConfig.stopRange, 1), 0, 1)
            const safeStopRange = stopRange * (1 - 1e-9)
            const jitter = (this._getRandom() - 0.5) * layout.degree * safeStopRange
            const desiredRotation = normalizeDegree(
                this._getPointerDegree() - layout.middleDegree - offset + jitter,
            )
            const currentRotation = normalizeDegree(this.rotation)
            let baseDistance =
                direction > 0
                    ? normalizeDegree(desiredRotation - currentRotation)
                    : normalizeDegree(currentRotation - desiredRotation)
            if (baseDistance < 1e-7) baseDistance = 360

            const plan = this._createPhysicsLandingPlan(
                baseDistance,
                direction,
                speed,
                this._physicsAcceleration,
                physics,
            )
            if (!plan) {
                const error = new Error(
                    'WheelCanvas could not create a target landing within the configured physical limits',
                )
                error.name = 'WheelCanvasPhysicsError'
                this._failPhysics(error)
                return false
            }

            this.state = 'settling'
            this._phaseStartTime = now
            this._lastFrameTime = now
            this._physicsLandingFrom = this.rotation
            this._physicsLandingTo = this.rotation + plan.distance
            this._physicsLandingDuration = plan.duration
            this._physicsLandingCoefficients = plan.coefficients
            this._physicsLandingSegments = plan.segments || null
            return true
        }

        _createPhysicsLandingPlan(baseDistance, direction, speed, acceleration, physics) {
            const idealDistance = this._estimatePhysicsStopDistance(speed, physics)
            const turnCounts = []
            for (
                let turns = physics.minLandingTurns;
                turns <= physics.maxLandingTurns;
                turns += 1
            ) {
                turnCounts.push(turns)
            }
            turnCounts.sort((left, right) => {
                const leftDistance = Math.abs(baseDistance + left * 360 - idealDistance)
                const rightDistance = Math.abs(baseDistance + right * 360 - idealDistance)
                return leftDistance - rightDistance
            })

            for (const turns of turnCounts) {
                const distance = baseDistance + turns * 360
                const signedDistance = distance * direction
                const minimumForAverageSpeed = (distance / speed) * 1000
                const minimumDuration = Math.max(
                    physics.minLandingDuration,
                    physics.forbidSpeedUp ? minimumForAverageSpeed : 1,
                )
                if (minimumDuration > physics.maxLandingDuration) continue
                const idealDuration = clamp(
                    (2 * distance * 1000) / speed,
                    minimumDuration,
                    physics.maxLandingDuration,
                )
                const durationCandidates = []
                const candidateCount = 72
                for (let index = 0; index <= candidateCount; index += 1) {
                    durationCandidates.push(
                        minimumDuration +
                            ((physics.maxLandingDuration - minimumDuration) * index) /
                                candidateCount,
                    )
                }
                durationCandidates.push(idealDuration)
                durationCandidates.sort(
                    (left, right) =>
                        Math.abs(left - idealDuration) - Math.abs(right - idealDuration),
                )

                for (const duration of durationCandidates) {
                    const coefficients = this._createQuinticLandingCoefficients(
                        signedDistance,
                        speed * direction,
                        acceleration,
                        duration,
                    )
                    if (
                        this._validatePhysicsLanding(
                            coefficients,
                            duration,
                            direction,
                            speed,
                            physics,
                        )
                    ) {
                        return { distance: signedDistance, duration, coefficients }
                    }
                }
            }

            for (const turns of turnCounts) {
                const distance = baseDistance + turns * 360
                const signedDistance = distance * direction
                const directionalAcceleration = acceleration * direction
                if (directionalAcceleration > Number.EPSILON) continue
                const bridge = this._createPhysicsAccelerationBridge(
                    direction,
                    speed,
                    acceleration,
                    physics,
                )
                if (Math.abs(directionalAcceleration) > Number.EPSILON && !bridge) continue
                const bridgeDistance = bridge ? bridge.distance * direction : 0
                const remainingDistance = distance - bridgeDistance
                const mainSpeed = bridge ? bridge.endSpeed : speed
                if (remainingDistance <= 0 || mainSpeed <= physics.stopVelocity) continue
                for (let exponent = 2; exponent <= 24; exponent += 1) {
                    const averageRatio = 1 - 2 / (exponent + 1) + 1 / (2 * exponent + 1)
                    const mainDurationSeconds = remainingDistance / (mainSpeed * averageRatio)
                    const mainDuration = mainDurationSeconds * 1000
                    const bridgeDuration = bridge ? bridge.duration : 0
                    const duration = bridgeDuration + mainDuration
                    if (
                        !Number.isFinite(duration) ||
                        duration < physics.minLandingDuration ||
                        duration > physics.maxLandingDuration
                    ) {
                        continue
                    }
                    const scaledVelocity = mainSpeed * direction * mainDurationSeconds
                    const coefficients = Array(exponent * 2 + 2).fill(0)
                    coefficients[1] = scaledVelocity
                    coefficients[exponent + 1] = (-2 * scaledVelocity) / (exponent + 1)
                    coefficients[exponent * 2 + 1] = scaledVelocity / (exponent * 2 + 1)
                    if (
                        Math.abs(
                            this._evaluatePolynomial(coefficients, 1) -
                                remainingDistance * direction,
                        ) > 1e-7
                    ) {
                        continue
                    }
                    if (
                        !this._validatePhysicsLanding(
                            coefficients,
                            mainDuration,
                            direction,
                            mainSpeed,
                            physics,
                        )
                    ) {
                        continue
                    }
                    if (!bridge) {
                        return { distance: signedDistance, duration, coefficients }
                    }
                    return {
                        distance: signedDistance,
                        duration,
                        coefficients: null,
                        segments: [
                            bridge,
                            {
                                coefficients,
                                distance: remainingDistance * direction,
                                duration: mainDuration,
                                offset: bridge.distance,
                            },
                        ],
                    }
                }
            }
            return null
        }

        _createPhysicsAccelerationBridge(direction, speed, acceleration, physics) {
            const directionalAcceleration = acceleration * direction
            if (Math.abs(directionalAcceleration) <= Number.EPSILON) return null
            if (directionalAcceleration >= 0 || Math.abs(acceleration) > physics.maxBrake)
                return null
            const minimumDuration = Math.abs(acceleration) / physics.maxJerk
            const maximumDuration =
                (2 * Math.max(0, speed - physics.stopVelocity)) / Math.abs(directionalAcceleration)
            const preferredDuration = physics.accelerationBlendDuration / 1000
            const durationSeconds = Math.min(
                Math.max(minimumDuration, preferredDuration),
                maximumDuration * 0.95,
            )
            if (
                !Number.isFinite(durationSeconds) ||
                durationSeconds <= 0 ||
                durationSeconds >= maximumDuration
            ) {
                return null
            }
            const signedVelocity = speed * direction
            const scaledAcceleration = acceleration * durationSeconds * durationSeconds
            const coefficients = [
                0,
                signedVelocity * durationSeconds,
                scaledAcceleration / 2,
                -scaledAcceleration / 6,
            ]
            const duration = durationSeconds * 1000
            if (!this._validatePhysicsLanding(coefficients, duration, direction, speed, physics)) {
                return null
            }
            const endVelocity =
                this._evaluatePolynomialDerivative(coefficients, 1) / durationSeconds
            return {
                coefficients,
                distance: this._evaluatePolynomial(coefficients, 1),
                duration,
                endSpeed: Math.max(0, endVelocity * direction),
                offset: 0,
            }
        }

        _createQuinticLandingCoefficients(distance, velocity, acceleration, duration) {
            const durationSeconds = duration / 1000
            const scaledVelocity = velocity * durationSeconds
            const scaledAcceleration = acceleration * durationSeconds * durationSeconds
            return [
                0,
                scaledVelocity,
                scaledAcceleration / 2,
                10 * distance - 6 * scaledVelocity - 1.5 * scaledAcceleration,
                -15 * distance + 8 * scaledVelocity + 1.5 * scaledAcceleration,
                6 * distance - 3 * scaledVelocity - 0.5 * scaledAcceleration,
            ]
        }

        _validatePhysicsLanding(coefficients, duration, direction, initialSpeed, physics) {
            const durationSeconds = duration / 1000
            let previousSpeed = initialSpeed
            const speedTolerance = Math.max(1e-7, initialSpeed * 1e-9)
            const limitTolerance = Math.max(1e-6, physics.maxBrake * 1e-9, physics.maxJerk * 1e-9)
            for (let index = 0; index <= physics.landingSamples; index += 1) {
                const progress = index / physics.landingSamples
                const velocity =
                    this._evaluatePolynomialDerivative(coefficients, progress) / durationSeconds
                const acceleration =
                    this._evaluatePolynomialSecondDerivative(coefficients, progress) /
                    (durationSeconds * durationSeconds)
                const jerk =
                    this._evaluatePolynomialThirdDerivative(coefficients, progress) /
                    (durationSeconds * durationSeconds * durationSeconds)
                const directionalSpeed = velocity * direction
                if (directionalSpeed < -speedTolerance) return false
                if (physics.forbidSpeedUp) {
                    if (directionalSpeed > initialSpeed + speedTolerance) return false
                    if (directionalSpeed > previousSpeed + speedTolerance) return false
                }
                if (Math.abs(acceleration) > physics.maxBrake + limitTolerance) return false
                if (Math.abs(jerk) > physics.maxJerk + limitTolerance) return false
                previousSpeed = Math.max(0, directionalSpeed)
            }
            return true
        }

        _estimatePhysicsStopDistance(speed, physics) {
            if (speed <= physics.stopVelocity) return 0
            if (physics.drag > Number.EPSILON) {
                const offset = physics.friction / physics.drag
                const duration =
                    Math.log(
                        (speed + offset) / Math.max(Number.EPSILON, physics.stopVelocity + offset),
                    ) / physics.drag
                return Math.max(
                    0,
                    (speed - physics.stopVelocity - physics.friction * duration) / physics.drag,
                )
            }
            if (physics.friction > Number.EPSILON) {
                return (
                    (speed * speed - physics.stopVelocity * physics.stopVelocity) /
                    (2 * physics.friction)
                )
            }
            return Infinity
        }

        _advancePhysicsLanding(now) {
            const duration = Math.max(1, this._physicsLandingDuration)
            const progress = clamp((now - this._phaseStartTime) / duration, 0, 1)
            const state = this._evaluatePhysicsLandingState(progress * duration)
            this.rotation = this._physicsLandingFrom + state.distance
            this._physicsVelocity = state.velocity
            this._physicsAcceleration = state.acceleration
            this._currentSpeed = (state.velocity * FRAME_DURATION) / 1000
            if (progress >= 1) {
                this.rotation = this._physicsLandingTo
                this._physicsVelocity = 0
                this._physicsAcceleration = 0
                this._currentSpeed = 0
                this._emitCurrentPrize()
                if (this._destroyed || this.state === 'idle') return true
                this.draw()
                if (this._destroyed || this.state === 'idle') return true
                this._finish()
                return true
            }
            return false
        }

        _evaluatePhysicsLandingState(elapsedMilliseconds) {
            const segments = this._physicsLandingSegments
            if (Array.isArray(segments) && segments.length) {
                const elapsed = clamp(elapsedMilliseconds, 0, this._physicsLandingDuration)
                let segmentStart = 0
                for (let index = 0; index < segments.length; index += 1) {
                    const segment = segments[index]
                    const segmentEnd = segmentStart + segment.duration
                    if (elapsed <= segmentEnd || index === segments.length - 1) {
                        const durationSeconds = Math.max(1e-9, segment.duration / 1000)
                        const progress = clamp(
                            (elapsed - segmentStart) / Math.max(1, segment.duration),
                            0,
                            1,
                        )
                        return {
                            distance:
                                segment.offset +
                                this._evaluatePolynomial(segment.coefficients, progress),
                            velocity:
                                this._evaluatePolynomialDerivative(segment.coefficients, progress) /
                                durationSeconds,
                            acceleration:
                                this._evaluatePolynomialSecondDerivative(
                                    segment.coefficients,
                                    progress,
                                ) /
                                (durationSeconds * durationSeconds),
                        }
                    }
                    segmentStart = segmentEnd
                }
            }
            const duration = Math.max(1, this._physicsLandingDuration)
            const durationSeconds = duration / 1000
            const progress = clamp(elapsedMilliseconds / duration, 0, 1)
            return {
                distance: this._evaluatePolynomial(this._physicsLandingCoefficients, progress),
                velocity:
                    this._evaluatePolynomialDerivative(this._physicsLandingCoefficients, progress) /
                    durationSeconds,
                acceleration:
                    this._evaluatePolynomialSecondDerivative(
                        this._physicsLandingCoefficients,
                        progress,
                    ) /
                    (durationSeconds * durationSeconds),
            }
        }

        _evaluatePolynomial(coefficients, value) {
            return coefficients.reduceRight(
                (result, coefficient) => result * value + coefficient,
                0,
            )
        }

        _evaluatePolynomialDerivative(coefficients, value) {
            let result = 0
            for (let index = coefficients.length - 1; index >= 1; index -= 1) {
                result = result * value + coefficients[index] * index
            }
            return result
        }

        _evaluatePolynomialSecondDerivative(coefficients, value) {
            let result = 0
            for (let index = coefficients.length - 1; index >= 2; index -= 1) {
                result = result * value + coefficients[index] * index * (index - 1)
            }
            return result
        }

        _evaluatePolynomialThirdDerivative(coefficients, value) {
            let result = 0
            for (let index = coefficients.length - 1; index >= 3; index -= 1) {
                result = result * value + coefficients[index] * index * (index - 1) * (index - 2)
            }
            return result
        }

        _beginDeceleration(now) {
            if (this._targetIndex == null || this.state === 'decelerating') return

            const targetLayout = (this._activeLayout || this._getPrizeLayout())[this._targetIndex]
            if (!targetLayout) {
                this._stopAnimation(false)
                return
            }
            const offset = this._activeLayout
                ? this._activeOffsetDegree
                : Number(this.defaultConfig.offsetDegree) || 0
            const pointerDegree = this._getPointerDegree()
            const stopRange = clamp(this.getLength(this.defaultConfig.stopRange, 1), 0, 1)
            const safeStopRange = stopRange * (1 - 1e-9)
            const jitter = (this._getRandom() - 0.5) * targetLayout.degree * safeStopRange
            const desiredRotation = normalizeDegree(
                pointerDegree - targetLayout.middleDegree - offset + jitter,
            )
            const currentRotation = normalizeDegree(this.rotation)
            const direction = this._currentSpeed < 0 ? -1 : 1
            const remainingDegree =
                direction > 0
                    ? normalizeDegree(desiredRotation - currentRotation)
                    : -normalizeDegree(currentRotation - desiredRotation)
            const duration = Math.max(1, Number(this.defaultConfig.decelerationTime) || 1)
            const velocity = this._currentSpeed / FRAME_DURATION
            const speed = Math.abs(velocity)
            const remainingDistance = Math.abs(remainingDegree)
            const idealDistance = (speed * duration) / 2
            let fullTurns = Math.max(0, Math.round((idealDistance - remainingDistance) / 360))
            const minimumDistance = (speed * duration) / 3
            if (remainingDistance + fullTurns * 360 < minimumDistance) {
                fullTurns = Math.max(0, Math.ceil((minimumDistance - remainingDistance) / 360))
            }
            const distance = direction * (remainingDistance + fullTurns * 360)

            this.state = 'decelerating'
            this._phaseStartTime = now
            this._decelerationFrom = this.rotation
            this._decelerationTo = this.rotation + distance
            this._decelerationTangent =
                distance !== 0 ? clamp((velocity * duration) / distance, 0, 3) : 0
        }

        _emitCurrentPrize() {
            const index = this.getCurrentPrizeIndex()
            if (index < 0 || index === this.currentPrizeIndex) return
            const previousIndex = this.currentPrizeIndex
            this.currentPrizeIndex = index
            if (previousIndex >= 0) {
                this._triggerPointerWobble()
                this._emitSectorFeedback(index, previousIndex)
            }
            if (typeof this.onCurrentChangeCallback === 'function') {
                const prizes = this._activePrizes || this.prizes
                this.onCurrentChangeCallback.call(this, index, prizes[index])
            }
        }

        _finish() {
            if (this._cancelForStructuralPrizeChange()) return
            const physicsLanding = this.state === 'settling'
            const index = this._targetIndex
            const prizes = this._activePrizes || this.prizes
            const prize = index == null ? null : prizes[index] || {}
            const geometryChanged = this._didActiveGeometryChange()
            const pointerChanged = this._pointerDirtyDuringSpin
            const buttonChanged = this._buttonDirtyDuringSpin
            const pointerWasWobbling = this._pointerWobbleStartedAt != null
            this.state = 'idle'
            this._syncAccessibilityState()
            this._frameId = null
            this._targetIndex = null
            this._physicsVelocity = 0
            this._physicsAcceleration = 0
            this._physicsLandingCoefficients = null
            this._physicsLandingSegments = null
            this._currentSpeed = 0
            this._clearPendingPhysicsResult()
            this._clearActiveGeometry()
            if (geometryChanged && index != null) {
                this._alignRotationToPrize(index)
                this.draw()
            } else if (pointerChanged || buttonChanged || pointerWasWobbling) {
                this.draw()
            }
            if (this._destroyed) return
            this._emitResultFeedback(index == null ? -1 : index, prize)
            if (this._destroyed) return
            if (physicsLanding) {
                this._invokePhysicsCallback('onEnd', null, {
                    index: index == null ? -1 : index,
                    prize,
                    rotation: normalizeDegree(this.rotation),
                })
            }
            if (this._destroyed) return
            if (prize && typeof this.endCallback === 'function') {
                this.endCallback.call(this, prize)
            }
        }

        _finishPhysics() {
            if (this._cancelForStructuralPrizeChange()) return
            const index = this.getCurrentPrizeIndex()
            const prizes = this._activePrizes || this.prizes
            const prize = index < 0 ? null : prizes[index] || {}
            const physics = this._activePhysicsConfig || this._getPhysicsConfig()
            const outcomeCancelled = this._physicsOutcomeCancelled
            const geometryChanged = this._didActiveGeometryChange()
            if (physics.snapToPrize && index >= 0) this._alignRotationToActivePrize(index)
            this.state = 'idle'
            this._syncAccessibilityState()
            this._frameId = null
            this._targetIndex = null
            this._physicsVelocity = 0
            this._physicsAcceleration = 0
            this._physicsLandingCoefficients = null
            this._physicsLandingSegments = null
            this._physicsOutcomeCancelled = false
            this._currentSpeed = 0
            this._clearPendingPhysicsResult()
            this._clearActiveGeometry()
            if (geometryChanged && index >= 0) this._alignRotationToPrize(index)
            this._emitCurrentPrize()
            if (this._destroyed) return
            this.draw()
            if (this._destroyed) return
            const detail = {
                index,
                prize,
                rotation: normalizeDegree(this.rotation),
            }
            if (!outcomeCancelled) {
                this._emitResultFeedback(index, prize)
                if (this._destroyed) return
                this._invokePhysicsCallback('onEnd', null, detail)
                if (this._destroyed) return
                if (prize && typeof this.endCallback === 'function') {
                    this.endCallback.call(this, prize)
                }
            }
        }

        _clearActiveGeometry() {
            this._activeLayout = null
            this._activePrizes = null
            this._activeButtons = null
            this._activeOffsetDegree = 0
            this._activePointerDegree = 0
            this._activePointerConfig = null
            this._activePhysicsConfig = null
            this._pointerDirtyDuringSpin = false
            this._buttonDirtyDuringSpin = false
            this._resetPointerWobble()
            this._invalidateRenderCaches()
        }

        _stopAnimation(emitEnd) {
            if (this._frameId != null) this._cancelAnimationFrame(this._frameId)
            if (this._gesture && this._gesture.pointerId != null) {
                this._releasePointerCapture({ pointerId: this._gesture.pointerId })
            }
            const index = this._targetIndex
            const prizes = this._activePrizes || this.prizes
            const prize = index == null ? null : prizes[index] || {}
            this._frameId = null
            this._targetIndex = null
            this.state = 'idle'
            this._syncAccessibilityState()
            this._physicsVelocity = 0
            this._physicsAcceleration = 0
            this._physicsLandingCoefficients = null
            this._physicsLandingSegments = null
            this._physicsOutcomeCancelled = false
            this._currentSpeed = 0
            this._gesture = null
            this._clearPendingPhysicsResult()
            this._clearActiveGeometry()
            if (emitEnd && prize && typeof this.endCallback === 'function') {
                this.endCallback.call(this, prize)
            }
        }

        getCurrentPrizeIndex() {
            const prizes = this._activePrizes || this.prizes
            if (!prizes.length) return -1
            const offset = this._activeLayout
                ? this._activeOffsetDegree
                : Number(this.defaultConfig.offsetDegree) || 0
            const pointerDegree = normalizeDegree(this._getPointerDegree() - this.rotation - offset)
            const layout = this._activeLayout || this._getPrizeLayout()
            const layoutItem = layout.find(item => {
                return pointerDegree >= item.startDegree && pointerDegree < item.endDegree
            })
            return layoutItem ? layoutItem.index : prizes.length - 1
        }

        _getNow() {
            const value = Number(this._nowProvider())
            return Number.isFinite(value) ? value : nowTimestamp()
        }

        _getRandom() {
            const value = Number(this._randomProvider())
            return Number.isFinite(value) ? clamp(value, 0, 1 - Number.EPSILON) : 0
        }

        _alignRotationToPrize(index) {
            const layoutItem = this._getPrizeLayout()[index]
            if (!layoutItem) return
            const offset = Number(this.defaultConfig.offsetDegree) || 0
            const desiredRotation = normalizeDegree(
                this._getPointerDegree(false) - layoutItem.middleDegree - offset,
            )
            this.rotation += normalizeDegree(desiredRotation - normalizeDegree(this.rotation))
            this.currentPrizeIndex = this.getCurrentPrizeIndex()
        }

        _alignRotationToActivePrize(index) {
            const layoutItem = (this._activeLayout || this._getPrizeLayout())[index]
            if (!layoutItem) return
            const offset = this._activeLayout
                ? this._activeOffsetDegree
                : Number(this.defaultConfig.offsetDegree) || 0
            const desiredRotation = normalizeDegree(
                this._getPointerDegree() - layoutItem.middleDegree - offset,
            )
            this.rotation += signedDegreeDelta(desiredRotation, normalizeDegree(this.rotation))
            this.currentPrizeIndex = this.getCurrentPrizeIndex()
        }

        _didActiveGeometryChange() {
            if (!this._activeLayout) return false
            const currentOffset = Number(this.defaultConfig.offsetDegree) || 0
            if (currentOffset !== this._activeOffsetDegree) return true
            if (this._getPointerDegree(false) !== this._activePointerDegree) return true
            const currentLayout = this._getPrizeLayout()
            if (currentLayout.length !== this._activeLayout.length) return true
            return currentLayout.some((item, index) => {
                const activeItem = this._activeLayout[index]
                return (
                    !activeItem ||
                    Math.abs(item.startDegree - activeItem.startDegree) > 1e-9 ||
                    Math.abs(item.endDegree - activeItem.endDegree) > 1e-9
                )
            })
        }

        isRunning() {
            return this.state !== 'idle'
        }

        conversionAxis(x, y) {
            return [x / this.dpr - this.centerX, y / this.dpr - this.centerY]
        }

        update(patch) {
            const next = patch || {}
            const reactiveState = this._reactiveReady
            this._reactiveReady = false
            Object.assign(this.options, next)
            if (hasOwn(next, 'width')) this.width = next.width
            if (hasOwn(next, 'height')) this.height = next.height
            if (hasOwn(next, 'blocks')) this.blocks = next.blocks || []
            if (hasOwn(next, 'prizes')) this.prizes = next.prizes || []
            if (hasOwn(next, 'buttons')) this.buttons = next.buttons || []
            if (hasOwn(next, 'pointer')) this.pointer = next.pointer || null
            if (next.physics) Object.assign(this.physics, next.physics)
            if (next.feedback) {
                if (!this.feedback || typeof this.feedback !== 'object') {
                    this.feedback = createFeedbackConfig()
                }
                if (next.feedback.sound) {
                    if (!this.feedback.sound || typeof this.feedback.sound !== 'object') {
                        this.feedback.sound = { ...DEFAULT_FEEDBACK.sound }
                    }
                    Object.assign(this.feedback.sound, next.feedback.sound)
                }
                if (next.feedback.celebration) {
                    if (
                        !this.feedback.celebration ||
                        typeof this.feedback.celebration !== 'object'
                    ) {
                        this.feedback.celebration = { ...DEFAULT_FEEDBACK.celebration }
                    }
                    Object.assign(this.feedback.celebration, next.feedback.celebration)
                }
                Object.keys(next.feedback).forEach(key => {
                    if (key !== 'sound' && key !== 'celebration') {
                        this.feedback[key] = next.feedback[key]
                    }
                })
            }
            if (next.defaultConfig) Object.assign(this.defaultConfig, next.defaultConfig)
            if (next.defaultStyle) Object.assign(this.defaultStyle, next.defaultStyle)
            if (hasOwn(next, 'start')) this.startCallback = next.start
            if (hasOwn(next, 'end')) this.endCallback = next.end
            if (hasOwn(next, 'error')) this.errorCallback = next.error
            if (hasOwn(next, 'onCurrentChange')) {
                this.onCurrentChangeCallback = next.onCurrentChange
            }
            if (hasOwn(next, 'ariaLabel') && this.canvas) {
                this.canvas.setAttribute('aria-label', String(next.ariaLabel || '抽奖转盘'))
            }
            this.options.blocks = this.blocks
            this.options.prizes = this.prizes
            this.options.buttons = this.buttons
            this.options.pointer = this.pointer
            this.options.physics = this.physics
            this.options.feedback = this.feedback
            this.options.defaultConfig = this.defaultConfig
            this.options.defaultStyle = this.defaultStyle
            this._reactiveReady = reactiveState
            if (hasOwn(next, 'prizes')) this._cancelForStructuralPrizeChange()
            return this.init()
        }

        destroy() {
            if (this._destroyed) return
            this._destroyed = true
            this._initGeneration += 1
            if (this._resizeFrameId != null) {
                this._cancelAnimationFrame(this._resizeFrameId)
                this._resizeFrameId = null
            }
            this._stopAnimation(false)
            this.canvas.removeEventListener('click', this._onClick)
            this.canvas.removeEventListener('keydown', this._onKeyDown)
            this.canvas.removeEventListener('pointerdown', this._onPointerDown)
            this.canvas.removeEventListener('pointermove', this._onPointerMove)
            this.canvas.removeEventListener('pointerup', this._onPointerUp)
            this.canvas.removeEventListener('pointercancel', this._onPointerCancel)
            this.canvas.removeEventListener('lostpointercapture', this._onPointerCancel)
            if (typeof window !== 'undefined') {
                window.removeEventListener('resize', this._onResize)
                window.removeEventListener('pointermove', this._onPointerMove)
                window.removeEventListener('pointerup', this._onPointerUp)
                window.removeEventListener('pointercancel', this._onPointerCancel)
                window.removeEventListener('blur', this._onWindowBlur)
            }
            if (this._fontObserver) this._fontObserver.disconnect()
            if (this._resizeObserver) this._resizeObserver.disconnect()
            if (
                this._fontSet &&
                this._onFontsChanged &&
                typeof this._fontSet.removeEventListener === 'function'
            ) {
                this._fontSet.removeEventListener('loadingdone', this._onFontsChanged)
                this._fontSet.removeEventListener('loadingerror', this._onFontsChanged)
            }
            Array.from(this._watchStops).forEach(stop => stop())
            Array.from(this._pendingImageLoads).forEach(abort => abort())
            this._pendingImageLoads.clear()
            this.imageCache.clear()
            this._activeImageSources.clear()
            this._drainImageLoadQueue()
            this._imageResults = new WeakMap()
            this._imagePromises = new WeakMap()
            this._rawImagePromises.clear()
            this._prizeLayoutCache = null
            this._geometryCache = null
            this._textLayoutCache = new WeakMap()
            this._restoreDom()
        }
    }

    WheelCanvas.version = VERSION

    function createWheelCanvas(target, options) {
        return new WheelCanvas(target, options)
    }

    return {
        version: VERSION,
        WheelCanvas,
        createWheelCanvas,
    }
})
