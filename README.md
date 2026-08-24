<p align="center">
    <img src="./assets/brand/wheel-canvas-js-logo.png" alt="WheelCanvasJS Logo" width="160" height="160" />
</p>

# WheelCanvasJS

[English](./README.en.md) · 简体中文

一个零运行时依赖、通过配置生成 Canvas 大转盘的原生 JavaScript 库。它提供双权重、中心/外置指针、拖拽物理旋转、UMD/CJS/ESM 入口、TypeScript 类型和键盘操作。

> 源码仓库：[`notluobo/wheel-canvas-js`](https://github.com/notluobo/wheel-canvas-js)。首次发布 npm 前仍需启用私密漏洞报告、配置私密行为准则举报渠道，并确认包名。

## 在线示例与使用教程

访问 [WheelCanvasJS 在线演示](https://notluobo.github.io/wheel-canvas-js/) 即可使用单页配置示例；本地也可以直接打开 [`index.html?lang=zh-CN`](./index.html?lang=zh-CN)。顶部语言入口可以切换 English / 简体中文；“使用教程”包含 UMD/ESM 接入、奖项与图片、双权重、指针融合、物理甩动、后端结果、性能适配、上线检查和故障排查。完整字段说明见 [`config.md`](./docs/zh-CN/config.md)，能力边界见 [`CAPABILITIES.md`](./docs/zh-CN/CAPABILITIES.md)。

工作台为纯静态 HTML、CSS 和 JavaScript，不引入页面框架或额外运行时依赖。

工作台会把可序列化的转盘配置自动保存在当前浏览器中，并在下次打开时恢复。点击实时预览标题旁的“重置配置”可以清除旧状态并恢复官方默认值；函数和第三方适配器实现不会写入浏览器存储。

## 目录结构

```text
wheel-canvas-js/
├── .github/       # 社区规范、模板与持续集成
├── assets/        # 项目 Logo 等品牌资产
├── demo/          # 首页行为、样式与示例素材
├── dist/          # UMD、ESM 与 TypeScript 发布入口
├── docs/          # 英文文档与 zh-CN 中文文档集
├── tests/         # 模块、类型、兼容、边界与性能测试
├── index.html     # 在线配置示例与内置使用教程
└── package.json   # 发布入口、脚本与依赖声明
```

`node_modules/` 只由 `npm ci` 在本地生成，不提交，也不会进入 npm 发布包。

## 命名约定

- 项目名称：`WheelCanvasJS`
- npm 包名：`wheel-canvas-js`
- 浏览器 UMD 全局变量：`WheelCanvasJS`
- 核心类：`WheelCanvas`
- 工厂函数：`createWheelCanvas`
- UMD 文件：`wheel-canvas-js.umd.js`
- ESM 文件：`wheel-canvas-js.esm.mjs`

首个公开版本只导出以上正式名称，不再提供旧项目名称的兼容别名，避免新项目继续背负混乱的双重 API。

## 直接在 HTML 中使用

把 `wheel-canvas-js.umd.js` 与页面放在一起：

```html
<div id="wheel"></div>

<script src="./wheel-canvas-js.umd.js"></script>
<script>
    const wheel = new WheelCanvasJS.WheelCanvas('#wheel', {
        width: '320px',
        height: '320px',
        prizes: [
            {
                range: 1,
                displayWeight: 1,
                background: '#fff4df',
                fonts: [{ text: '一等奖', top: '18%' }],
            },
            {
                range: 3,
                displayWeight: 2,
                background: '#ffd8a8',
                fonts: [{ text: '二等奖', top: '18%' }],
            },
            {
                range: 6,
                displayWeight: 3,
                background: '#fff4df',
                fonts: [{ text: '谢谢参与', top: '18%' }],
            },
        ],
        buttons: [
            {
                radius: '32%',
                pointer: true,
                background: '#e8590c',
                fonts: [{ text: '开始', fontColor: '#fff' }],
            },
        ],
        defaultConfig: {
            useGraphicWeight: true,
            graphicWeightSource: 'displayWeight',
        },
        async start() {
            wheel.play()
            const prizeIndex = await requestPrizeFromServer()
            wheel.stop(prizeIndex)
        },
        end(prize) {
            console.log('中奖结果：', prize)
        },
        error(error) {
            console.error('抽奖失败：', error)
        },
    })
</script>
```

完整可运行页面是 [`index.html`](./index.html)，页面配置在 [`demo/app.js`](./demo/app.js)，样式和示例素材也统一放在 [`demo/`](./demo/) 中。本地双击即可运行；图片跨域或接口请求场景建议通过静态服务器打开。

包发布以后，可以固定版本加载 CDN 文件，避免 `latest` 导致线上行为变化：

```html
<script src="https://cdn.jsdelivr.net/npm/wheel-canvas-js@1.0.0/dist/wheel-canvas-js.umd.js"></script>
```

## 首页实时配置工作台

打开 `index.html` 后，第一视口就是完整的三栏转盘工作台：左侧为转盘配置，中间始终保留实时转盘，右侧放声音、彩带和 JSON 导入导出等可选辅助能力；中等屏幕自动变为“预览在上、双配置在下”，移动端改为单列。默认显示小尺寸的水滴形一体中心按钮：圆形和向上尖端共用一条连续白色轮廓，并跟随当前经过的扇区颜色。页面可以继续调整指针位置、造型、固定/扇区跟随颜色、跨扇区回弹、尺寸、融合轮廓、深入距离、空间策略、描边、固定座，外边框和内边框的颜色与宽度，扇区间距和角度，中心按钮，奖品文字/图片排版，脚本动画、滑动物理，以及 DPR、画布像素和图片并发预算。官方视觉采用中性色、细边框和紧凑卡片，默认不使用任何阴影。

“高级 JSON · 全部配置”会展示当前实例的全部可序列化配置，适合继续编辑 `blocks`、`prizes`、`buttons`、`pointer`、`defaultStyle`、`defaultConfig`、`physics` 和 `feedback`，并支持应用、复制与恢复默认。函数回调、图片 formatter、自定义 renderer 与反馈适配器不能安全序列化，应继续在业务 JavaScript 中配置。

## npm / 模块使用

CommonJS：

```js
const { WheelCanvas } = require('wheel-canvas-js')
```

ESM：

```js
import WheelCanvasJS, { WheelCanvas, createWheelCanvas } from 'wheel-canvas-js'
```

`dist/wheel-canvas-js.umd.js` 是可直接阅读和修改的主实现，并非压缩产物。`dist/wheel-canvas-js.esm.mjs` 是保持相同 API 的 ESM 入口。

## 图形权重与中奖权重

`range` 决定无参数 `stop()` 的前端随机权重；`displayWeight` 决定扇区显示大小。两者可以独立配置：

```js
defaultConfig: {
  useGraphicWeight: true,
  graphicWeightSource: 'displayWeight'
}
```

`graphicWeightSource` 有三种取值：

- `displayWeight`：只读取 `displayWeight`，缺失或非法时按 `1`。
- `range`：直接使用 `range` 绘制扇区。
- `auto`：默认值；优先读取 `displayWeight`，缺失时回退到 `range`。

关闭 `useGraphicWeight` 时始终等分扇区，旧配置不会改变外观。

涉及库存、资金或权益时，中奖结果必须由可信后端生成，再调用 `wheel.stop(index)`。浏览器中的 `range` 和 `Math.random()` 不能承担防作弊职责。

## 指针样式

不填写顶层 `pointer` 时，继续使用 `buttons[].pointer: true` 的原有中心指针，视觉和旧配置不变。外置指针会自动为转盘预留空间，并且指针方向会参与中奖扇区计算：

```js
pointer: {
    type: 'external',
    position: 'top',
    // angle: 45, // 可用任意顺时针角度覆盖 position
    preset: 'minimal',
    color: '#7c3aed',
    // currentPrize 会自动使用指针当前经过的扇区颜色
    colorSource: 'currentPrize',
    cornerRadius: 3,
    borderColor: '#ffffff',
    borderWidth: 2,
    width: '6%',
    height: '5%',
    layout: 'stable',
    space: 18,
    tipInset: 14,
    mount: false,
    wobble: {
        enabled: true,
        amplitude: 2.5,
        duration: 180,
        frequency: 14,
        damping: 12,
        respectReducedMotion: true,
    },
}
```

`type` 可选 `center`、`external`、`none`；`position` 可选 `top`、`right`、`bottom`、`left`，也可用 `angle` 设置任意角度。内置 21 种造型：`minimal`、`classic`、`flapper`、`wedge`、`needle`、`pin`、`glass`、`jewel`、`triangle`、`kite`、`arrow`、`chevron`、`diamond`、`notch`、`teardrop`、`spear`、`soft`、`tab`、`dart`、`shield` 和 `ribbon`。中心和外置指针共用造型、颜色、尺寸、描边、`cornerRadius` 轮廓圆角与角度；圆角默认 `3px`，设为 `0` 可恢复锐角。`colorSource: 'currentPrize'` 会让指针跟随当前扇区颜色，`wobble` 可配置跨扇区时的轻微阻尼回弹；二者都只改变视觉，不改变中奖角度、权重或最终结果。中心指针额外支持 `radialOffset`、`fused`，以及独立模式的 `referenceSize`，外置指针使用 `tipInset`、`tangentOffset`、`mount` 和 `layout`。所有内置指针默认关闭阴影。

外置布局支持三种策略：`fit` 按指针实际包围盒自动缩放轮盘，`stable` 使用固定 `space`（未填写时为画布直径的 `5%`）并把超出部分向轮盘内覆盖，`overlay` 不预留空间。需要“调指针但不改变转盘大小”时使用 `layout: 'stable'`；极端尺寸或大幅切向偏移必须完整避让时使用 `fit`；需要“改转盘但保持指针绝对大小”时把 `width` / `height` 写成 `px`，百分比尺寸会按画布正常缩放。

显式中心指针示例：

```js
pointer: {
    type: 'center',
    preset: 'arrow',
    angle: 90,
    radialOffset: 8,
    width: '82%',
    height: '128%',
    color: '#7c3aed',
    borderColor: '#fff',
    borderWidth: 2,
    fused: true,
    // adaptive 会保留 arrow 造型，并与中心按钮融合为同色连续轮廓
    fusionStyle: 'adaptive',
    // fused: false 时可用 referenceSize: '30%' 脱离按钮独立定尺寸
    shadow: false,
}
```

`fusionStyle: 'adaptive'` 会保留当前 `preset` 的真实轮廓，适合在中心位置切换不同箭头；它使用中心按钮的颜色、描边和透明度，通过联合轮廓消除圆形与箭头交界处的内部描边。`droplet` 是固定的连续水滴造型，因此不会随 `preset` 改变形状；`layered` 则保留圆形按钮与独立箭头的双色分层效果。

## 图片内容

奖品、中心按钮和多层外圈都支持图片。只提供 `width` 或 `height` 时保持原图比例；奖品可以选择纯文字、纯图片或图文混排：

```js
prizes: [
    {
        name: '旅行礼券',
        fonts: [{ text: '旅行礼券', top: '18%' }],
        imgs: [
            {
                src: './gift.png',
                visible: true,
                width: '34%',
                top: '42%',
                crossOrigin: 'anonymous',
            },
        ],
    },
]
```

中心 Logo 使用 `buttons[].imgs`。跨域图片必须由资源服务器允许 CORS；高价值奖品即使只显示图片，也应保留 `name` 或文字副本，供结果提示与无障碍界面使用。

## 中心按钮与文字排版

中心按钮不需要通过负 `top` 偏移模拟居中。未配置 `font.top` 时，按钮文字默认 `verticalAlign: 'middle'`：

```js
buttons: [
    {
        visible: true,
        textVisible: true,
        radius: '30%',
        background: '#7c3aed',
        borderColor: '#ffffff',
        borderWidth: 4,
        fonts: [{ text: '开始\n抽奖', verticalAlign: 'middle', wordWrap: false }],
    },
]
```

扇区和按钮共用 `FontConfig`。它支持 `visible`、`horizontal` / `vertical`、显式换行、自动换行、`lengthLimit`、`lineClamp`、`ellipsis` / `clip`、自定义省略标记及对齐：

```js
fonts: [
    {
        text: '这是一段很长的奖品名称',
        orientation: 'horizontal',
        wordWrap: true,
        lengthLimit: '72%',
        lineClamp: 2,
        textOverflow: 'ellipsis',
        ellipsis: '…',
    },
]
```

`fontSize` 与 `lineHeight` 使用百分比时，以画布短边为基准等比缩放；使用数字、`px`、`rem`、`vw` 或 `vh` 时保留相应单位语义。即使关闭 `wordWrap`，`lengthLimit` 与溢出策略仍然生效，不会让单行长文字穿出扇区。需要同时修改宽高时，使用 `wheel.setSize(width, height)`，只触发一次重排；省略 `height` 会创建正方形画布。

奖品文字的位置可以通过 `defaultStyle.top`、`defaultStyle.left` 和 `defaultStyle.textAlign` 统一调整，也可以在 `prizes[].fonts[]` 中单独覆盖。`top` 沿半径从中心向外缘移动，`left` 沿扇区切线方向偏移；首页“奖品文字”面板提供对应的实时控制。

首页将 280–1200px 作为设计尺寸范围，并单独显示当前适应容器后的预览尺寸与 DPR。设计尺寸会保留在可复制配置中，预览缩放不会静默改写它。

## 拖动与物理旋转

物理交互默认关闭，不影响原有 `play()` / `stop(index)` 流程。开启后可在鼠标、触控笔或触屏上拖动扇区，释放速度越大，初始角速度越高：

```js
physics: {
    enabled: true,
    sensitivity: 1,
    innerRadius: '8%',
    minVelocity: 36,
    maxVelocity: 1800,
    friction: 24,
    drag: 0.68,
    stopVelocity: 3,
    waitingVelocity: 72,
    waitingStrategy: 'hold',
    sampleWindow: 110,
    releaseDamping: 7,
    maxSubstep: 10,
    maxCatchUp: 220,
    accelerationBlendDuration: 120,
    errorStrategy: 'coast',
    resultTimeout: 10000,
    dragFrom: 'prizes',
    direction: 'both',
    resultMode: 'natural',
    snapToPrize: false,
}
```

速度单位是度/秒。`friction` 是滚动阻力（度/秒²），`drag` 是随速度变化的黏性阻尼（每秒）。引擎使用最近采样窗口的加权回归估算释放速度，并以小步长积分混合阻力，因此不同刷新率下保持一致。释放后的绝对速度不会回升；受控中奖会从当前位置、速度和加速度规划平滑目标制动轨迹，不再复用固定 `decelerationTime`。低速长距离场景会先用 `accelerationBlendDuration` 平滑衔接当前制动力，再渐进制动，不会为了赶时间偷偷加速。

`resultMode: 'natural'` 按物理位置自然停止；`weighted` 会在释放时根据 `range` 选择结果。也可在 `onRelease` 返回下标或 `Promise<下标>`，把后端结果接入受控停止。`waitingStrategy: 'hold'` 只会在当前速度仍高于 `waitingVelocity` 时保持低速，绝不会把慢速抬高；`coast` 会在等待期间继续自然减速。超过 `resultTimeout` 会触发 `error` 且不会触发中奖 `end`：

异步结果无效、拒绝、超时或无法在物理限制内安全落点时，默认 `errorStrategy: 'coast'` 会保留当前速度并自然减速，不会突然瞬停，也不会触发中奖 `end`；如业务明确需要立即停止，可配置为 `stop`。`maxCatchUp` 限制页面后台或严重卡顿后单帧补算的最长时间，超过部分会被主动丢弃，避免恢复页面时突然跳过大量角度。

```js
physics: {
    enabled: true,
    async onRelease({ speed, direction }) {
        const response = await fetch('/api/draw', {
            method: 'POST',
            body: JSON.stringify({ speed, direction }),
        })
        const result = await response.json()
        return result.prizeIndex
    },
}
```

也可以通过 `wheel.spin(900)` 或 `wheel.spin(-900)` 以指定顺/逆时针速度启动惯性旋转。

## 声音与中奖庆祝

核心库不内置音频文件，也不强制依赖特效库。`feedback` 提供语义化适配器：指针进入新扇区时调用 `sound.play(sectorCue, ...)`，一次成功抽奖结束时调用结果声音和庆祝适配器。声音、彩带和总开关都可以独立关闭；适配器异常只进入 `error`，不会改变中奖结果或中断动画。

```js
const wheel = new WheelCanvasJS.WheelCanvas('#wheel', {
    prizes,
    feedback: {
        enabled: true,
        sound: {
            enabled: true,
            pack: 'mechanical',
            sectorCue: 'snap',
            resultCue: 'reward',
            volume: 0.3,
            minInterval: 35,
            play(cue, detail, soundConfig) {
                // 接入 UI SFX、Web Audio 或业务自己的音频播放器
                uiSfx.play(cue, { volume: soundConfig.volume })
            },
        },
        celebration: {
            enabled: true,
            style: 'subtle',
            particleCount: 48,
            disableForReducedMotion: true,
            fire(style, detail, celebrationConfig) {
                confetti({
                    particleCount: celebrationConfig.particleCount,
                    colors: detail.colors,
                    disableForReducedMotion: celebrationConfig.disableForReducedMotion,
                })
            },
        },
    },
})
```

首页工作台已提供声音包、经过扇区声音、结果声音、音量、最小触发间隔、预听、彩带样式和粒子数量控件。示例按 [UI SFX](https://github.com/romainsimon/uisfx) 的语义分类使用 `snap` 作为扇区刻度声、`reward` 作为中奖声，并通过按版本固定的 CDN 按需加载 CC0 MP3；中奖特效使用可关闭的 [canvas-confetti](https://github.com/catdad/canvas-confetti)。生产环境、离线页面或有内容安全策略的站点，建议把音频与脚本下载到自己的静态资源域名。浏览器可能要求第一次声音播放发生在用户手势中；示例会静默忽略自动播放或网络错误。涉及高价值奖品时，声音和特效始终只是反馈层，中奖下标仍应由后端决定。

## 公开方法

图片和 formatter 参与异步初始化；截图、读取像素或依赖图片展示前先等待 `await wheel.ready`。资源失败会进入 `error` 并跳过该资源，销毁实例会取消尚未完成的图片等待。

- `play()`：开始旋转。
- `spin(velocity)`：按指定度/秒启动物理惯性旋转，负数表示逆时针。
- `stop(index)`：停止到指定下标。
- `stop()`：根据 `range` 进行前端加权选择。
- `init()`：重置状态、加载图片并绘制。
- `update(config)`：合并配置并重新初始化。
- `resize()`：重新计算尺寸和 DPR。
- `getCurrentPrizeIndex()`：读取指针所在奖品下标。
- `isRunning()`：判断是否正在旋转。
- `clearCanvas()`：清空 Canvas。
- `destroy()`：取消动画、监听器和观察器，并恢复宿主 DOM。

完整字段、生命周期和兼容方法见 [`config.md`](./docs/zh-CN/config.md)。TypeScript 定义见 [`wheel-canvas-js.d.ts`](./dist/wheel-canvas-js.d.ts)。竞品调研、核心/扩展/工具站边界和分阶段发布门槛见 [`PRODUCT-ROADMAP.md`](./docs/zh-CN/PRODUCT-ROADMAP.md)。

## 动态配置约束

普通颜色、文字和图片配置可以直接修改并自动重绘。一次抽奖开始后，引擎会冻结该次抽奖的奖品顺序、角度布局、完整指针视觉和物理参数，避免旋转过程中突然缩放、换向或改变阻力。

旋转中增删、替换或重排 `prizes` 会取消本次抽奖、触发 `error`，且不会触发 `end`，因为旧中奖项可能已不存在。图形权重、角度偏移和指针配置会在本次结束后统一生效；改变逻辑指针角度时，结束后的重新对齐仍可能产生视觉跳动。配置工具应在旋转期间禁用奖品、`displayWeight`、`useGraphicWeight`、`offsetDegree` 和全部 `pointer` 控件，结束后再开放。

## 浏览器兼容

运行环境需要：

- Canvas 2D；
- Pointer Events（仅拖动物理模式需要）；
- `Promise` 与 `Promise.prototype.finally`；
- `Proxy`（用于深层配置自动重绘）；
- `Map`、`WeakMap`、`Set` 和 `requestAnimationFrame`，其中动画帧有定时器降级。

`ResizeObserver` 和 `MutationObserver` 是渐进增强能力，不支持时仍可通过窗口 `resize` 或手动调用 `wheel.resize()`。

## 开发与验证

```powershell
npm install
npm test
npm run pack:check
```

测试覆盖 CJS、ESM、浏览器全局、TypeScript 声明、原版 API 兼容、动画落点、图形权重、图片缓存、异常回滚、资源销毁，以及稳定动画帧的布局/文字缓存和 Canvas 像素预算。默认 `maxDpr: 3`、`maxCanvasPixels: 16777216`，可防止异常高 DPR 或超大画布产生失控的 backing-store 内存占用；`imageConcurrency: 6` 用于限制批量图片的加载和解码峰值。需要超高清导出时可以显式调整。CI 配置位于 `.github/workflows/ci.yml`。

真实 Canvas 的跨浏览器视觉回归仍建议在每次大版本发布前人工检查 `index.html`；当前自动化测试使用 Canvas mock，不等同于像素级截图测试。

## 参与贡献与安全

- 贡献流程：[`CONTRIBUTING.md`](./docs/zh-CN/CONTRIBUTING.md)
- 编码规范：[`CODING_STYLE.md`](./docs/zh-CN/CODING_STYLE.md)
- 安全问题：[`SECURITY.md`](./docs/zh-CN/SECURITY.md)
- 行为准则：[`CODE_OF_CONDUCT.md`](./docs/zh-CN/CODE_OF_CONDUCT.md)
- 发布清单：[`RELEASE.md`](./docs/zh-CN/RELEASE.md)
- 版本记录：[`CHANGELOG.md`](./docs/zh-CN/CHANGELOG.md)
- 本地化规范：[`LOCALIZATION.md`](./docs/zh-CN/LOCALIZATION.md)

## 许可证与来源

本项目采用 Apache License 2.0，详见 [`LICENSE`](./LICENSE)。依法保留的来源、版权与修改归属集中记录在 [`NOTICE`](./NOTICE)，不会作为 WheelCanvasJS 的产品名称、包名或公开 API 使用。
