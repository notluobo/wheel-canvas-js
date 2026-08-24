const assert = require('assert')
const fs = require('fs')
const path = require('path')

const projectDirectory = path.join(__dirname, '..')
const readFile = fileName => fs.readFileSync(path.join(projectDirectory, fileName), 'utf8')
const i18n = require('../demo/i18n.js')
const i18nSource = readFile('demo/i18n.js')

const localizedPairs = [
    ['README.en.md', 'README.md'],
    ['CHANGELOG.md', 'docs/zh-CN/CHANGELOG.md'],
    ['.github/CONTRIBUTING.md', 'docs/zh-CN/CONTRIBUTING.md'],
    ['.github/SECURITY.md', 'docs/zh-CN/SECURITY.md'],
    ['.github/CODE_OF_CONDUCT.md', 'docs/zh-CN/CODE_OF_CONDUCT.md'],
    ['assets/brand/README.md', 'assets/brand/README.zh-CN.md'],
    ['docs/config.md', 'docs/zh-CN/config.md'],
    ['docs/CAPABILITIES.md', 'docs/zh-CN/CAPABILITIES.md'],
    ['docs/CODING_STYLE.md', 'docs/zh-CN/CODING_STYLE.md'],
    ['docs/PRODUCT-ROADMAP.md', 'docs/zh-CN/PRODUCT-ROADMAP.md'],
    ['docs/RELEASE.md', 'docs/zh-CN/RELEASE.md'],
    ['docs/LOCALIZATION.md', 'docs/zh-CN/LOCALIZATION.md'],
]

localizedPairs.forEach(([englishFile, chineseFile]) => {
    const english = readFile(englishFile)
    const chinese = readFile(chineseFile)
    assert.match(english, new RegExp(path.basename(chineseFile).replace('.', '\\.')))
    assert.match(chinese, new RegExp(path.basename(englishFile).replace('.', '\\.')))
    assert.ok(english.length > 200, `${englishFile} must contain useful English documentation`)
    assert.ok(chinese.length > 200, `${chineseFile} must contain useful Chinese documentation`)
})

const packageManifest = JSON.parse(readFile('package.json'))
assert.doesNotMatch(packageManifest.description, /[^\p{ASCII}]/u)
;['docs', '.github/CONTRIBUTING.md', '.github/SECURITY.md', '.github/CODE_OF_CONDUCT.md'].forEach(
    fileName => {
        assert.ok(
            packageManifest.files.includes(fileName),
            `${fileName} must be included in the package`,
        )
    },
)

const homePage = readFile('index.html')
const chineseContent = /[\p{Script=Han}，。；：“”《》？！]/u
assert.match(homePage, /class="locale-button"[^>]+data-locale-toggle/)
assert.match(homePage, /data-locale-current>ZH</)
assert.ok(homePage.indexOf('./demo/i18n.js') < homePage.indexOf('./demo/app.js'))
assert.match(i18nSource, /document\.readyState === 'loading'/)
assert.match(
    i18nSource,
    /document\.addEventListener\('DOMContentLoaded', startLocalization, \{ once: true \}\)/,
)
assert.strictEqual(i18n.normalizeLocale('en-US'), 'en')
assert.strictEqual(i18n.normalizeLocale('zh-Hans'), 'zh-CN')
assert.strictEqual(i18n.translate('使用教程'), 'Tutorial')
assert.strictEqual(i18n.translate('指针进入当前扇区'), 'Pointer enters the current sector')
assert.strictEqual(
    i18n.translate('释放速度：320°/s，正在自然减速……'),
    'Release speed: 320°/s; coasting naturally…',
)
assert.strictEqual(i18n.translate('抽奖失败：network'), 'Draw failed: network')
assert.strictEqual(
    i18n
        .translateText(
            `
            扇区经过声使用 UI SFX 的 CC0
            音频，推荐机械卡点；中奖彩带使用
            canvas-confetti。两项都可以关闭，声音仅在用户操作后播放，彩带默认尊重系统“减少动态效果”偏好。
        `,
        )
        .trim(),
    'Sector ticks use CC0 UI SFX audio with a mechanical cue by default. Winner confetti uses canvas-confetti. Both can be disabled; sound starts only after user interaction and confetti respects reduced-motion preferences.',
)

const previousWindow = global.window
const previousDocument = global.document
let domReadyCallback = null
let translatedElementQueries = 0
const localeCode = { textContent: 'ZH' }
const localeAttributes = {}
const documentAttributes = {}
const localeToggle = {
    href: '',
    lang: '',
    addEventListener() {},
    querySelector(selector) {
        return selector === '[data-locale-current]' ? localeCode : null
    },
    setAttribute(name, value) {
        localeAttributes[name] = value
    },
}
global.window = {
    location: { href: 'https://example.com/index.html?lang=en', search: '?lang=en' },
    navigator: { language: 'en-US' },
}
global.document = {
    readyState: 'loading',
    documentElement: {
        nodeType: 1,
        lang: 'zh-CN',
        closest() {
            return null
        },
        hasAttribute() {
            return false
        },
        matches() {
            return false
        },
        setAttribute(name, value) {
            documentAttributes[name] = value
        },
        removeAttribute(name) {
            delete documentAttributes[name]
        },
        querySelectorAll() {
            translatedElementQueries += 1
            return []
        },
    },
    addEventListener(name, callback) {
        if (name === 'DOMContentLoaded') domReadyCallback = callback
    },
    querySelectorAll() {
        translatedElementQueries += 1
        return []
    },
    querySelector(selector) {
        return selector === '[data-locale-toggle]' ? localeToggle : null
    },
    createTreeWalker() {
        return { nextNode: () => null }
    },
}
i18n.init()
assert.strictEqual(documentAttributes['data-locale-pending'], 'true')
assert.strictEqual(
    translatedElementQueries,
    0,
    'English localization must wait until the parser completes',
)
assert.strictEqual(typeof domReadyCallback, 'function')
domReadyCallback()
assert.ok(translatedElementQueries > 0, 'English localization must run after DOMContentLoaded')
assert.strictEqual(documentAttributes['data-locale-pending'], undefined)
assert.strictEqual(localeCode.textContent, 'EN')
assert.match(localeToggle.href, /[?&]lang=zh-CN(?:&|$)/)
assert.doesNotMatch(localeAttributes['aria-label'], chineseContent)
global.window = previousWindow
global.document = previousDocument

const textNodes = Array.from(
    homePage.matchAll(/>([^<>]*[\u4e00-\u9fff][^<>]*)</g),
    match => match[1],
).filter(Boolean)
const translatedTextNodes = textNodes.map(i18n.translateText)
const untranslatedNodes = translatedTextNodes.filter(value => chineseContent.test(value))
assert.deepStrictEqual(
    Array.from(new Set(untranslatedNodes)),
    [],
    `English workbench contains untranslated text: ${Array.from(new Set(untranslatedNodes)).join(' | ')}`,
)

const localizedAttributes = Array.from(
    homePage.matchAll(/(?:aria-label|placeholder|title|content)="([^"]*[\u4e00-\u9fff][^"]*)"/g),
    match => match[1],
)
const untranslatedAttributes = localizedAttributes
    .map(i18n.translate)
    .filter(value => chineseContent.test(value))
assert.deepStrictEqual(
    Array.from(new Set(untranslatedAttributes)),
    [],
    `English workbench contains untranslated attributes: ${Array.from(new Set(untranslatedAttributes)).join(' | ')}`,
)

const appSource = readFile('demo/app.js')
const appStrings = Array.from(
    appSource.matchAll(/(['"`])([^'"`\r\n]*[\u4e00-\u9fff][^'"`\r\n]*)\1/g),
    match => match[2],
)
const untranslatedAppStrings = appStrings
    .map(value => value.replace(/\$\{[^}]*\}/g, '1'))
    .map(i18n.translate)
    .filter(value => chineseContent.test(value))
assert.deepStrictEqual(
    Array.from(new Set(untranslatedAppStrings)),
    [],
    `English workbench contains untranslated dynamic text: ${Array.from(new Set(untranslatedAppStrings)).join(' | ')}`,
)

const configSections = [
    ['## Create an instance', '## 创建实例'],
    ['## Pointer: `pointer`', '## 指针 pointer'],
    ['## Physical rotation: `physics`', '## 物理旋转 physics'],
    ['## Text: `FontConfig`', '## 文字 FontConfig'],
    ['## Images: `ImageConfig`', '## 图片 ImageConfig'],
    ['## Feedback: `feedback`', '## 反馈 feedback'],
    ['## Public methods', '## 公开方法'],
]
const englishConfig = readFile('docs/config.md')
const chineseConfig = readFile('docs/zh-CN/config.md')
configSections.forEach(([englishHeading, chineseHeading]) => {
    assert.ok(englishConfig.includes(englishHeading), `missing English section: ${englishHeading}`)
    assert.ok(chineseConfig.includes(chineseHeading), `missing Chinese section: ${chineseHeading}`)
})

assert.doesNotMatch(readFile('dist/wheel-canvas-js.umd.js'), /WheelCanvasI18n|demo\/i18n/)
assert.doesNotMatch(readFile('dist/wheel-canvas-js.esm.mjs'), /WheelCanvasI18n|demo\/i18n/)

console.log('WheelCanvasJS localization contract test passed')
