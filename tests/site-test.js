const assert = require('assert')
const fs = require('fs')
const path = require('path')

const projectDirectory = path.join(__dirname, '..')
const pages = ['index.html']

function readFile(fileName) {
    return fs.readFileSync(path.join(projectDirectory, fileName), 'utf8')
}

function isExternalReference(reference) {
    return /^(?:[a-z]+:|#|\/\/)/i.test(reference)
}

function resolveReference(page, reference) {
    const cleanReference = reference.split(/[?#]/, 1)[0]
    return path.resolve(projectDirectory, path.dirname(page), cleanReference)
}

pages.forEach(page => {
    const html = readFile(page)
    assert.match(html, /<html lang="zh-CN">/, `${page} must declare the document language`)
    assert.match(html, /<meta name="viewport"/, `${page} must include a viewport declaration`)
    assert.match(html, /viewport-fit=cover/, `${page} must support mobile safe areas`)
    assert.match(html, /<h1[ >]/, `${page} must include one primary heading`)
    assert.match(html, /class="skip-link"/, `${page} must provide a skip link`)
    assert.match(html, /<main id="main-content">/, `${page} must expose the main landmark target`)
    assert.match(html, /href="\.\/demo\/site\.css"/, `${page} must load the shared stylesheet`)
    assert.match(html, /src="\.\/demo\/app\.js"/, `${page} must load homepage behavior`)

    const ids = Array.from(html.matchAll(/\sid="([^"]+)"/g), match => match[1])
    assert.strictEqual(new Set(ids).size, ids.length, `${page} must not contain duplicate IDs`)

    const renderedHtml = html.replace(/<pre[\s\S]*?<\/pre>/g, '')
    const references = Array.from(
        renderedHtml.matchAll(/(?:href|src)="([^"]+)"/g),
        match => match[1],
    )
    references
        .filter(reference => !isExternalReference(reference))
        .forEach(reference => {
            assert.ok(
                fs.existsSync(resolveReference(page, reference)),
                `${page} contains a broken local reference: ${reference}`,
            )
        })
})

const homePage = readFile('index.html')
const brandLogo = fs.readFileSync(
    path.join(projectDirectory, 'assets', 'brand', 'wheel-canvas-js-logo.png'),
)
const tutorialCodeBlocks = Array.from(
    homePage.matchAll(/^( *)<pre><code>\n([\s\S]*?)\n\1<\/code><\/pre>$/gm),
)
const getControlTag = id => {
    const match = homePage.match(new RegExp(`<input\\b[^>]*\\bid="${id}"[^>]*>`, 's'))
    assert.ok(match, `index.html must expose input ${id}`)
    return match[0]
}
assert.ok(homePage.indexOf('./dist/wheel-canvas-js.umd.js') < homePage.indexOf('./demo/app.js'))
assert.strictEqual(brandLogo.toString('hex', 0, 8), '89504e470d0a1a0a')
assert.strictEqual(brandLogo.readUInt32BE(16), 192)
assert.strictEqual(brandLogo.readUInt32BE(20), 192)
assert.strictEqual(brandLogo[25], 6, 'the canonical logo must retain its RGBA transparency')
assert.ok(tutorialCodeBlocks.length >= 10, 'tutorial code blocks must use structured markup')
tutorialCodeBlocks.forEach(([, indentation, source]) => {
    const contentIndentation = `${indentation}    `
    source.split('\n').forEach(line => {
        assert.ok(
            !line.trim() || line.startsWith(contentIndentation),
            'tutorial source code must use four-space HTML indentation',
        )
    })
})
assert.doesNotMatch(homePage, /<pre><code>\S/)
assert.match(
    homePage,
    /class="brand-logo"[\s\S]*src="\.\/assets\/brand\/wheel-canvas-js-logo\.png"[\s\S]*width="192"[\s\S]*height="192"[\s\S]*alt=""/,
)
assert.match(homePage, /rel="icon"[\s\S]*wheel-canvas-js-logo\.png/)
assert.doesNotMatch(homePage, /class="brand-mark"/)
assert.strictEqual((homePage.match(/data-locale-toggle/g) || []).length, 1)
assert.match(homePage, /class="locale-button"[\s\S]*data-locale-current>ZH</)
assert.doesNotMatch(homePage, /data-locale="(?:en|zh-CN)"/)
assert.strictEqual((homePage.match(/class="social-link"/g) || []).length, 2)
assert.match(
    homePage,
    /href="https:\/\/github\.com\/notluobo\/wheel-canvas-js"[\s\S]*aria-label="WheelCanvasJS on GitHub"/,
)
assert.match(
    homePage,
    /href="https:\/\/x\.com\/heyluobo"[\s\S]*aria-label="WheelCanvasJS author on X"/,
)
assert.match(homePage, /rel="noopener noreferrer"/)
assert.match(
    homePage,
    /<\/main>\s*<!-- Content editor dialog -->\s*<dialog[\s\S]*id="content-editor"/,
)
assert.match(homePage, /id="wheel-canvas"/)
assert.match(homePage, /图形权重/)
assert.match(homePage, /id="pointer-position"/)
assert.match(homePage, /id="pointer-preset"/)
assert.match(homePage, /id="pointer-color"/)
assert.match(homePage, /id="pointer-size"/)
assert.match(homePage, /id="pointer-inset"/)
assert.match(homePage, /id="center-text"/)
assert.match(homePage, /id="center-size"/)
assert.match(homePage, /id="center-border"/)
;[
    'pointer-border',
    'pointer-offset',
    'pointer-mount',
    'pointer-layout',
    'pointer-space',
    'center-pointer-angle',
    'center-pointer-offset',
    'center-pointer-fused',
    'center-fusion-style',
    'outer-color',
    'outer-width',
    'inner-color',
    'inner-width',
    'sector-gutter',
    'sector-offset',
    'canvas-size',
    'text-auto-scale',
    'center-visible',
    'center-label',
    'center-align',
    'prize-content-mode',
    'prize-image-url',
    'prize-image-file',
    'prize-image-cross-origin',
    'prize-image-size',
    'prize-image-top',
    'center-logo-visible',
    'center-logo-url',
    'center-logo-file',
    'center-logo-size',
    'prize-text-visible',
    'text-orientation',
    'text-align',
    'text-overflow',
    'text-length',
    'text-clamp',
    'text-top',
    'text-left',
    'spin-speed',
    'speed-function',
    'acceleration',
    'deceleration',
    'stop-range',
    'sensitivity',
    'friction',
    'drag',
    'physics-direction',
    'max-dpr',
    'max-canvas-pixels',
    'image-concurrency',
    'sound-enabled',
    'sound-pack',
    'sector-sound',
    'result-sound',
    'sound-volume',
    'sound-interval',
    'preview-sound',
    'celebration-enabled',
    'celebration-style',
    'celebration-count',
    'celebration-reduced-motion',
    'canvas-preview-size',
    'live-config-json',
    'apply-live-config',
    'reset-live-config',
    'copy-live-config',
    'reset-workbench-config',
    'config-storage-status',
    'content-editor',
    'content-editor-open',
    'content-editor-close',
    'content-editor-reset',
    'content-editor-add',
    'prize-editor-list',
    'content-editor-status',
    'spin-announcer',
    'tutorial-open',
    'tutorial-dialog',
    'tutorial-title',
    'tutorial-close',
].forEach(id => {
    assert.match(homePage, new RegExp(`id="${id}"`), `index.html must expose ${id}`)
})
assert.match(homePage, /value="center" selected/)
assert.match(homePage, /value="minimal" selected/)
assert.match(homePage, /value="adaptive"/)
assert.match(homePage, /水滴形固定轮廓/)
assert.match(homePage, /class="[^"]*\bdemo-config-disclosure\b[^"]*" open/)
assert.match(homePage, /class="wheel-preview-card"/)
assert.match(homePage, /class="[^"]*\bcore-config-card\b[^"]*"/)
assert.match(homePage, /class="aux-config-card" open/)
assert.match(homePage, /class="wheel-preview-footer"/)
assert.match(homePage, /转盘配置/)
assert.match(homePage, /外观 · 交互 · 性能/)
assert.doesNotMatch(homePage, /<small>wheel-canvas-js\.umd\.js<\/small>/)
assert.match(homePage, /辅助配置/)
assert.match(homePage, /id="wheel-prize-list"/)
assert.match(homePage, /滑动物理/)
assert.match(homePage, /图片支持地址或本地上传/)
assert.match(homePage, /max="1200"/)
assert.match(homePage, /id="canvas-size"[\s\S]*min="280"[\s\S]*max="1200"/)
assert.match(homePage, /文字随画布等比缩放/)
assert.match(homePage, /id="physics-mode" type="checkbox" checked/)
assert.match(getControlTag('outer-color'), /value="#f4efe4"/)
assert.match(getControlTag('outer-width'), /value="4"/)
assert.match(getControlTag('inner-color'), /value="#ffffff"/)
assert.match(getControlTag('inner-width'), /value="4"/)
assert.match(getControlTag('sector-gutter'), /value="4"/)
assert.match(getControlTag('sector-offset'), /value="-30"/)
assert.match(getControlTag('canvas-size'), /value="520"/)
assert.doesNotMatch(getControlTag('graphic-weight'), /\bchecked\b/)
assert.match(
    homePage,
    /id="play"[\s\S]*id="content-editor-open"[\s\S]*id="result"/,
    'content editor action must appear directly to the right of the play action',
)
assert.doesNotMatch(homePage, /id="features"/)
assert.doesNotMatch(homePage, /class="[^"]*\bstat-strip\b/)
assert.doesNotMatch(homePage, /class="[^"]*\bcta-panel\b/)
assert.doesNotMatch(homePage, /class="site-footer"/)
assert.match(homePage, />\s*使用教程\s*<\/button>/)
assert.doesNotMatch(homePage, /转盘配置工作台/)
;[
    'tutorial-start',
    'tutorial-config',
    'tutorial-content',
    'tutorial-weight',
    'tutorial-pointer',
    'tutorial-spin',
    'tutorial-physics',
    'tutorial-events',
    'tutorial-quality',
    'tutorial-production',
    'tutorial-troubleshooting',
].forEach(id => {
    assert.match(homePage, new RegExp(`id="${id}"`), `tutorial must expose ${id}`)
})
assert.ok((homePage.match(/data-copy-code/g) || []).length >= 8)
assert.match(homePage, /npm install wheel-canvas-js/)
assert.match(homePage, /wheel-canvas-js\.umd\.js/)
assert.match(homePage, /range/)
assert.match(homePage, /displayWeight/)
assert.match(homePage, /fusionStyle/)
assert.match(homePage, /wheel\.destroy\(\)/)
assert.match(readFile('demo/app.js'), /UI_SFX_VERSION = '0\.4\.0'/)
assert.match(readFile('demo/app.js'), /npm\/uisfx@\$\{UI_SFX_VERSION\}\/sounds/)
assert.match(readFile('demo/app.js'), /CONFETTI_VERSION = '1\.9\.4'/)
assert.match(readFile('demo/app.js'), /CONFETTI_INTEGRITY/)

assert.ok(
    !readFile('demo/site.css').includes('box-shadow:'),
    'the documentation site must be shadow-free',
)
const siteStyles = readFile('demo/site.css')
assert.match(siteStyles, /\.locale-button \{[\s\S]*border: 2px solid var\(--ink\)/)
assert.match(siteStyles, /\.locale-button:focus-visible/)
assert.match(siteStyles, /\.social-link \{[\s\S]*border: 2px solid var\(--ink\)/)
assert.match(siteStyles, /\.social-link:focus-visible/)
assert.match(siteStyles, /html\[data-locale-pending='true'\] body/)
assert.doesNotMatch(siteStyles, /\.locale-switcher a\[aria-current='page'\]/)
assert.match(siteStyles, /\.wheel-card \{/)
assert.match(
    siteStyles,
    /grid-template-columns: minmax\(280px, 320px\) minmax\(420px, 1fr\) minmax\(280px, 320px\)/,
)
assert.match(siteStyles, /\.wheel-preview-card/)
assert.match(siteStyles, /\.core-config-card\[open\],[\s\S]*\.aux-config-card\[open\]/)
assert.match(siteStyles, /grid-template-rows: 58px minmax\(0, 1fr\)/)
assert.match(siteStyles, /\.demo-control-panel[\s\S]*min-height: 0/)
assert.match(siteStyles, /overflow-y: auto/)
assert.match(siteStyles, /appearance: none/)
assert.match(siteStyles, /\.custom-select-popover/)
assert.match(siteStyles, /\.custom-select-search/)
assert.match(siteStyles, /\.custom-select-option\.is-selected/)
assert.match(siteStyles, /\.content-editor-dialog/)
assert.match(siteStyles, /\.tutorial-dialog/)
assert.match(siteStyles, /\.tutorial-navigation/)
assert.match(siteStyles, /\.tutorial-code-block/)
assert.match(siteStyles, /\.prize-editor-row/)
assert.match(siteStyles, /\.prize-editor-media-fields/)
assert.match(siteStyles, /@media \(max-width: 719px\)/)
assert.match(siteStyles, /env\(safe-area-inset-top\)/)
assert.match(siteStyles, /env\(safe-area-inset-bottom\)/)
assert.match(siteStyles, /calc\(100svh - 190px\)/)
assert.match(
    siteStyles,
    /@media \(max-width: 719px\)[\s\S]*\.demo-control input\[type='range'\][\s\S]*min-height: 44px/,
)
assert.match(
    siteStyles,
    /@media \(max-width: 719px\)[\s\S]*\.content-editor-dialog[\s\S]*width: 100%/,
)
assert.match(
    siteStyles,
    /@media \(max-width: 719px\)[\s\S]*\.wheel-preview-footer[\s\S]*margin-top: 12px/,
)
assert.match(siteStyles, /@media \(max-width: 380px\)/)
assert.match(siteStyles, /orientation: landscape/)
assert.match(readFile('docs/config.md'), /`shadow`\s+\| `false`/)
const homepageScript = readFile('demo/app.js')
assert.match(homepageScript, /function initializeCustomSelects\(\)/)
assert.match(homepageScript, /function normalizeCodeSample\(source\)/)
assert.match(homepageScript, /function normalizeTutorialCodeSamples\(\)/)
assert.match(homepageScript, /role', 'listbox'/)
assert.match(homepageScript, /aria-multiselectable', 'false'/)
assert.match(homepageScript, /handleCustomSelectTriggerKeydown/)
assert.match(homepageScript, /filterCustomSelectOptions/)
assert.match(homepageScript, /function createPrizeImageEditor\(prize, index\)/)
assert.match(homepageScript, /MAX_EDITOR_IMAGE_BYTES = 2 \* 1024 \* 1024/)

;[
    'guide.html',
    'examples.html',
    'examples.js',
    'config.html',
    'playground.html',
    'playground.js',
    'site.js',
].forEach(fileName => {
    assert.ok(
        !fs.existsSync(path.join(projectDirectory, fileName)),
        `${fileName} must stay removed`,
    )
})

const capabilities = readFile('docs/CAPABILITIES.md')
const chineseCapabilities = readFile('docs/zh-CN/CAPABILITIES.md')
;[
    ['Integration and runtime', '接入与运行环境'],
    ['Wheel structure', '转盘结构'],
    ['Typography', '文字系统'],
    ['Center control', '中心按钮'],
    ['Pointer system', '指针'],
    ['Images and resources', '图片与资源'],
    ['Scripted animation and selection', '脚本动画与抽奖'],
    ['Drag and physics', '拖动与物理旋转'],
    ['Reactive updates and lifecycle', '动态配置与生命周期'],
    ['Accessibility and engineering guarantees', '可访问性与工程保证'],
    ['Explicit boundaries', '明确边界'],
].forEach(([englishTerm, chineseTerm]) => {
    assert.ok(capabilities.includes(englishTerm), `CAPABILITIES.md must document ${englishTerm}`)
    assert.ok(
        chineseCapabilities.includes(chineseTerm),
        `docs/zh-CN/CAPABILITIES.md must document ${chineseTerm}`,
    )
})

;['demo-gift.svg', 'demo-spark.svg'].forEach(fileName => {
    assert.ok(
        fs.existsSync(path.join(projectDirectory, 'demo', 'assets', fileName)),
        `missing example asset: ${fileName}`,
    )
})

console.log('Standalone WheelCanvas homepage test passed')
