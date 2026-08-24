# WheelCanvasJS 配置说明

[English](../config.md) · 简体中文

## 创建实例

```js
const wheel = new WheelCanvasJS.WheelCanvas('#wheel', config)
```

第一个参数可以是 CSS 选择器或 DOM 元素，第二个参数是转盘配置。

原版的高级构造方式同样支持：

```js
const wheel = new WheelCanvasJS.WheelCanvas(
    {
        el: '#wheel',
        dpr: 2,
        handleCssUnit(number, unit) {
            if (unit === 'rpx') return number / 2
            return number
        },
        beforeResize() {},
        afterResize() {},
    },
    config,
)
```

高级构造参数支持 `flag`、`el`、`divElement`、`canvasElement`、`ctx`、`dpr`、`handleCssUnit`、`unitFunc`、`rAF`、`now`、`random`、`imageTimeout`、定时器覆盖和生命周期回调。自定义 `rAF` 的时间戳不会被信任；需要可控时钟的测试环境应同时传入 `now()`，传入返回 `[0, 1)` 的 `random()` 可复现权重选择与落点抖动。`imageTimeout` 默认 `30000` 毫秒，设为 `0` 可关闭超时。工具站在普通浏览器中通常使用第一种写法即可。

## 顶层配置

| 属性              | 类型               | 必填 | 说明                                               |
| ----------------- | ------------------ | ---- | -------------------------------------------------- |
| `width`           | `string \| number` | 是   | 宽度，例如 `320`、`320px`、`80vw`                  |
| `height`          | `string \| number` | 是   | 高度                                               |
| `ariaLabel`       | `string`           | 否   | Canvas 的可访问名称                                |
| `blocks`          | `Block[]`          | 否   | 转盘外圈                                           |
| `prizes`          | `Prize[]`          | 是   | 奖品列表                                           |
| `buttons`         | `Button[]`         | 否   | 中心按钮和指针                                     |
| `pointer`         | `PointerConfig`    | 否   | 中心、外置或隐藏指针                               |
| `physics`         | `PhysicsConfig`    | 否   | 拖动、释放速度与惯性旋转                           |
| `feedback`        | `FeedbackConfig`   | 否   | 可选声音与中奖庆祝适配器                           |
| `defaultConfig`   | `object`           | 否   | 动画和布局配置                                     |
| `defaultStyle`    | `object`           | 否   | 默认文字和奖品样式                                 |
| `start`           | `function`         | 否   | 点击中心按钮时触发                                 |
| `end`             | `function`         | 否   | 转盘停止后触发                                     |
| `error`           | `function`         | 否   | 资源、自定义 renderer 和物理结果等由引擎捕获的错误 |
| `onCurrentChange` | `function`         | 否   | 指针进入不同奖品时触发                             |

还支持 `beforeCreate`、`beforeResize`、`afterResize`、`beforeInit`、`afterInit`、`beforeDraw`、`afterDraw` 和 `afterStart` 生命周期回调。生命周期、`end` 和 `onCurrentChange` 中主动抛出的异常会向当前调用栈传播，调用方应自行捕获；它们不会再次进入 `error`，以避免递归错误。

## 外圈 blocks

```js
blocks: [
    { padding: '12px', background: '#d9480f' },
    { padding: '4px', background: '#fff3bf' },
]
```

| 属性         | 类型               | 说明         |
| ------------ | ------------------ | ------------ |
| `padding`    | `string \| number` | 当前外圈厚度 |
| `background` | `string`           | 背景颜色     |
| `imgs`       | `ImageConfig[]`    | 外圈图片     |

## 奖品 prizes

```js
prizes: [
    {
        range: 10,
        displayWeight: 2,
        background: '#fff4df',
        fonts: [{ text: '一等奖', top: '18%', fontColor: '#c92a2a' }],
        imgs: [{ src: './gift.png', width: '40px', top: '42%' }],
    },
]
```

| 属性            | 类型            | 说明                                 |
| --------------- | --------------- | ------------------------------------ |
| `range`         | `number`        | 调用无参数 `stop()` 时使用的中奖权重 |
| `displayWeight` | `number`        | 开启图形权重时使用的扇区角度权重     |
| `background`    | `string`        | 当前扇区背景                         |
| `fonts`         | `FontConfig[]`  | 奖品文字                             |
| `imgs`          | `ImageConfig[]` | 奖品图片                             |

`range` 是相对权重，不要求总和等于 100。例如 `[1, 2, 7]` 对应约 10%、20%、70%。真正涉及奖品库存或资金价值时，应该由后端决定中奖下标，再调用 `stop(index)`；不要把重要抽奖逻辑只放在浏览器中。

`range` 和 `displayWeight` 是两个独立概念：前者决定中奖概率，后者决定画出来的扇区大小。

## 中心按钮 buttons

```js
buttons: [
    {
        visible: true,
        textVisible: true,
        radius: '34%',
        background: '#e8590c',
        borderColor: '#fff',
        borderWidth: 4,
        pointer: true,
        fonts: [
            {
                text: '开始',
                fontColor: '#fff',
                fontSize: '20px',
                verticalAlign: 'middle',
            },
        ],
    },
]
```

| 属性                                     | 类型                | 说明                                          |
| ---------------------------------------- | ------------------- | --------------------------------------------- |
| `visible` / `textVisible`                | `boolean`           | 分别控制整个按钮、仅按钮文字是否显示          |
| `radius`                                 | `string \| number`  | 按钮半径，相对于奖品区域                      |
| `background` / `opacity`                 | `string` / `number` | 按钮背景和整体透明度                          |
| `borderColor` / `borderWidth`            | -                   | 圆形按钮边框                                  |
| `shadowColor` / `shadowBlur` / `shadow*` | 默认关闭            | 可选阴影颜色、模糊、X/Y 偏移；官方示例不启用  |
| `pointer`                                | `boolean`           | 未配置顶层 `pointer` 时是否绘制兼容的中心指针 |
| `fonts`                                  | `FontConfig[]`      | 按钮文字；未设置 `top` 时默认真正垂直居中     |
| `imgs`                                   | `ImageConfig[]`     | 按钮图片                                      |

## 指针 pointer

省略顶层 `pointer` 时，`buttons[].pointer: true` 会保持原有中心指针样式。显式配置后可切换中心、外置或隐藏指针：

```js
pointer: {
    type: 'external',
    position: 'top',
    angle: 0,
    preset: 'minimal',
    color: '#7c3aed',
    colorSource: 'currentPrize',
    borderColor: '#ffffff',
    borderWidth: 2,
    width: '6%',
    height: '5%',
    layout: 'stable',
    space: 18,
    reserveSpace: true,
    tipInset: 14,
    tangentOffset: 0,
    mount: false,
    wobble: {
        enabled: true,
        amplitude: 2.5,
        duration: 180,
        frequency: 14,
        damping: 12,
        respectReducedMotion: true,
    },
    shadow: false,
}
```

| 属性                          | 默认值        | 说明                                                                                  |
| ----------------------------- | ------------- | ------------------------------------------------------------------------------------- |
| `type`                        | `center`      | `center`、`external` 或 `none`                                                        |
| `position`                    | `top`         | `top`、`right`、`bottom` 或 `left`                                                    |
| `angle`                       | -             | 从 12 点方向顺时针计算；优先于 `position`                                             |
| `preset` / `shape`            | `minimal`     | 21 种内置造型，包含极简、柔和、圆角标签、飞镖、盾形和缎带等；`shape` 是兼容别名       |
| `color` / `body`              | 紫色 / 纯色   | 主体颜色、边框、透明度、`gradient.from/to` 渐变；显式设置 `shadeColor` 才绘制暗面线   |
| `colorSource`                 | `fixed`       | `fixed` 使用配置颜色；`currentPrize` 跟随指针当前经过的扇区颜色                       |
| `width` / `height`            | 按预设        | 每个 preset 有独立默认比例；`px` 保持绝对尺寸，`%` 随画布缩放                         |
| `cornerRadius`                | `3`           | 内置指针轮廓的边缘圆角；支持 px、百分比等长度，设为 `0` 恢复锐角                      |
| `layout`                      | `fit`         | `fit` 保证完整避让；`stable` 保持轮盘几何且过大部分向内覆盖；`overlay` 不缩小转盘     |
| `space` / `reserveSpace`      | 自动 / `true` | 外置安全区；`stable` 未填写 `space` 时使用画布直径的 `5%`，调整指针不会改变转盘半径   |
| `tipInset` / `tangentOffset`  | `14` / `0`    | 极简预设默认深入 14，其他预设默认 8；`inset` / `offset` 是兼容别名                    |
| `radialOffset`                | `0`           | 中心指针沿当前角度向外移动的距离                                                      |
| `fused`                       | `true`        | 中心指针与按钮按同一轮廓绘制并继承按钮颜色和边框；设为 `false` 可独立显示             |
| `fusionStyle`                 | `layered`     | `adaptive` 保留所选造型并同色融合；`droplet` 使用固定水滴轮廓；`layered` 使用双色分层 |
| `referenceSize`               | `30%`         | `fused: false` 时中心指针独立于按钮的尺寸基准，可使用 `px` 或 `%`                     |
| `mount`                       | 极简无固定座  | 其他预设按造型显示；`false` 可关闭，对象可配置半径、透明度、内外颜色、边框和金属渐变  |
| `shadow`                      | `false`       | 默认无阴影；如品牌确有需要，可显式配置颜色、模糊、X 偏移和径向偏移                    |
| `accentColor` / `accentWidth` | `false` / `1` | 箭头内部装饰线默认关闭；只有显式设置颜色后才绘制，可用 `false` 保持纯色极简箭头       |
| `wobble`                      | `false`       | 跨扇区视觉回弹；可配置开关、幅度、时长、频率、阻尼和是否尊重系统“减少动态效果”偏好    |
| `renderer(ctx, metrics)`      | -             | 完全自定义视觉；绘制状态由引擎隔离，异常进入 `error` 回调                             |

指针角度同时用于绘制、`stop(index)` 和 `getCurrentPrizeIndex()`，所以中心或外置指针调整方向后，中奖判断仍与视觉一致。中心指针和外置指针共用全部 21 种 `preset`；外置指针另有安全区和固定座配置。颜色跟随和回弹只属于视觉反馈层，不参与中奖计算。

`adaptive` 是真正的一体式中心轮廓：中心圆和箭头先绘制共同外描边，再用同色填充覆盖内部交叉线。它统一继承中心按钮的背景、边框和透明度；若需要分别配置箭头颜色或描边，请使用 `layered` 或 `fused: false`。

21 种造型分别是：`minimal`、`classic`、`flapper`、`wedge`、`needle`、`pin`、`glass`、`jewel`、`triangle`、`kite`、`arrow`、`chevron`、`diamond`、`notch`、`teardrop`、`spear`、`soft`、`tab`、`dart`、`shield`、`ribbon`。

## 物理旋转 physics

```js
physics: {
    enabled: true,
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
    onStart(detail, event) {},
    onRelease(detail, event) {},
    onEnd(detail) {},
    onCancel(detail, event) {},
}
```

| 属性                                           | 默认值              | 说明                                                                 |
| ---------------------------------------------- | ------------------- | -------------------------------------------------------------------- |
| `enabled`                                      | `false`             | 是否启用拖拽；默认关闭以保持旧版行为                                 |
| `sensitivity` / `dragThreshold`                | `1` / `6`           | 拖动角度倍率和开始拖动前的像素阈值                                   |
| `innerRadius`                                  | `8%`                | 圆心死区，避免 `atan2` 在中心附近产生异常角速度                      |
| `minVelocity` / `maxVelocity`                  | `36` / `1800`       | 触发惯性的最小和最大释放速度，度/秒                                  |
| `friction` / `drag`                            | `24` / `0.68`       | 滚动阻力（度/秒²）和黏性阻尼（每秒）                                 |
| `stopVelocity`                                 | `3`                 | 低于此速度时完成自然停止，度/秒                                      |
| `waitingVelocity` / `waitingStrategy`          | `72` / `hold`       | 等待异步结果时保持当前低速或继续 `coast`；永远不会把当前速度抬高     |
| `velocitySmoothing`                            | `1`                 | 对回归速度的额外平滑，0～1；首个样本不会从 0 做 EMA                  |
| `sampleWindow` / `sampleHalfLife`              | `110` / `55`        | 加权速度回归的采样窗口和半衰期，毫秒                                 |
| `releaseWindow` / `releaseDamping`             | `180` / `7`         | 停手到释放的有效窗口和指数衰减系数                                   |
| `maxSubstep` / `maxCatchUp`                    | `10` / `220`        | 物理积分子步和单帧最大追赶时间，毫秒                                 |
| `minLandingTurns` / `maxLandingTurns`          | `0` / `10`          | 受控落点允许增加的整圈范围                                           |
| `minLandingDuration` / `maxLandingDuration`    | `280` / `12000`     | 受控制动的允许时长范围，毫秒                                         |
| `accelerationBlendDuration`                    | `120`               | 低速渐进制动前平滑衔接当前加速度的目标时长；必要时按剩余速度缩短     |
| `maxBrake` / `maxJerk`                         | `2400` / `50000`    | 受控制动最大角加速度和角加加速度                                     |
| `landingSamples` / `forbidSpeedUp`             | `96` / `true`       | 规划验证采样数；是否拒绝任何释放后增速的轨迹                         |
| `errorStrategy`                                | `coast`             | 结果错误时自然减速；设为 `stop` 才会立即停止                         |
| `resultTimeout`                                | `10000`             | 异步结果超时毫秒数；`0` 表示不限制                                   |
| `dragFrom` / `direction`                       | `prizes` / `both`   | 拖动区域和允许旋转方向                                               |
| `resultMode` / `snapToPrize`                   | `natural` / `false` | 自然/权重结果模式，以及自然停止后是否吸附扇区中心                    |
| `touchAction`                                  | `none`              | 物理模式开启时使用的 Canvas `touch-action`；关闭或销毁后恢复宿主原值 |
| `onStart` / `onRelease` / `onEnd` / `onCancel` | -                   | 物理交互生命周期；取消回调可恢复页面控件                             |

`onRelease` 的 `detail` 包含带方向的 `velocity`、绝对值 `speed`、`direction`、`rotation` 和 `source`。返回下标后，引擎会沿当前方向从当前位置、速度和加速度规划平滑目标制动轨迹，并逐点验证速度不回升、方向不反转且不超过制动/jerk 限制；低速长距离场景会先用 C² 衔接段平滑撤去当前制动力，再使用渐进制动曲线，而不是重新加速。不返回时使用 `resultMode`。Promise 等待、拒绝或超时不会误触发中奖 `end`，返回值也必须是当前奖品数组范围内的整数。

默认错误策略会让转盘保留当前动量并自然停下，同时只触发 `error`，不会把错误路径当作中奖结果。`waitingStrategy: 'coast'` 若在结果到达前已经自然停止，也会安全取消本次受控结果。`maxCatchUp` 以上的后台停顿时间不会补算，以避免页面恢复时产生大角度跳变。

```js
physics: {
    enabled: true,
    async onRelease(detail) {
        const response = await fetch('/api/draw', {
            method: 'POST',
            body: JSON.stringify({ releaseSpeed: detail.speed }),
        })
        return (await response.json()).prizeIndex
    },
}
```

## 动画 defaultConfig

```js
defaultConfig: {
  gutter: 2,
  offsetDegree: 0,
  speed: 20,
  speedFunction: 'quad',
  accelerationTime: 800,
  decelerationTime: 2500,
  stopRange: 0.8,
  useGraphicWeight: true,
  graphicWeightSource: 'displayWeight',
  maxDpr: 3,
  maxCanvasPixels: 16777216,
  imageConcurrency: 6,
}
```

| 属性                  | 默认值     | 说明                                                                             |
| --------------------- | ---------- | -------------------------------------------------------------------------------- |
| `gutter`              | `0`        | 奖品扇区间距                                                                     |
| `offsetDegree`        | `0`        | 整体角度偏移                                                                     |
| `speed`               | `20`       | 最大旋转速度，按 60 FPS 的每帧角度理解                                           |
| `speedFunction`       | `quad`     | 加速阶段缓动函数，可用 `quad`、`cubic`、`quart`、`quint`、`sine`、`expo`、`circ` |
| `accelerationTime`    | `2500`     | 加速时间，毫秒                                                                   |
| `decelerationTime`    | `2500`     | 减速时间，毫秒                                                                   |
| `stopRange`           | `0`        | 在中奖扇区内的随机停止范围，`0` 到 `1`                                           |
| `useGraphicWeight`    | `false`    | 是否按照奖品权重绘制不同大小的扇区                                               |
| `graphicWeightSource` | `auto`     | 图形权重来源：`auto`、`displayWeight` 或 `range`                                 |
| `maxDpr`              | `3`        | Canvas backing store 的最大 DPR；`0` 表示关闭限制                                |
| `maxCanvasPixels`     | `16777216` | Canvas backing store 最大总像素数；`0` 表示关闭限制                              |
| `imageConcurrency`    | `6`        | 同时处理的图片加载数；`0` 表示不限制并发                                         |

减速阶段使用初速度连续、末速度为零的 Hermite 曲线，以避免不同 `speedFunction` 导致停止时突然加速。`speedFunction` 只影响加速阶段。

`dpr` 属于高级构造参数；为方便普通配置生成器，当前实现也兼容把它写在 `defaultConfig` 中。未设置时会使用当前屏幕的 `devicePixelRatio`，并在窗口缩放或跨屏后重新检测，避免 Canvas 被低分辨率拉伸。引擎默认用 `maxDpr: 3` 和约 1677 万像素的 backing-store 预算约束主画布与离屏画布，避免超大画布在高 DPR 设备上占用过量内存；导出超高分辨率图片时可显式提高限制或设为 `0`，同时应由调用方评估设备内存。图片默认最多同时处理 6 个加载任务，批量图片场景可通过 `imageConcurrency` 调整。

## 图形权重

默认关闭，因此旧配置仍然平均分配扇区：

```js
defaultConfig: {
    useGraphicWeight: false
}
```

开启后可以通过 `displayWeight` 配置角度比例：

```js
prizes: [
  { range: 10, displayWeight: 1, fonts: [{ text: '一等奖' }] },
  { range: 30, displayWeight: 2, fonts: [{ text: '二等奖' }] },
  { range: 60, displayWeight: 3, fonts: [{ text: '谢谢参与' }] }
],
defaultConfig: {
  useGraphicWeight: true,
  graphicWeightSource: 'displayWeight'
}
```

上面的图形角度分别是 `60°`、`120°`、`180°`，但中奖概率仍由 `range` 独立决定。

图形权重读取规则：

1. 关闭 `useGraphicWeight` 时，每个奖品角度相等。
2. `graphicWeightSource: 'displayWeight'` 只读取 `displayWeight`。
3. `graphicWeightSource: 'range'` 只读取 `range`。
4. 默认的 `auto` 优先读取 `displayWeight`，没有时兼容使用 `range`。
5. 选中的权重不存在或不是正数时按 `1` 计算。

极端权重比例超过 JavaScript 浮点数可分辨范围时，引擎会为每个正权重保留一个最小可表示扇区，避免扇区坍缩为零；正常业务比例不受影响。

图形权重不仅影响绘制，也会同步用于 `stop(index)`、`getCurrentPrizeIndex()`、`onCurrentChange`、图片和文字布局。

工具站可以动态开关：

```js
wheel.defaultConfig.useGraphicWeight = true
wheel.defaultConfig.useGraphicWeight = false
```

一次旋转会冻结当次布局。旋转中增删、替换或重排 `prizes` 会取消本次抽奖、触发 `error`，且不触发 `end`。为避免取消或结束时重新对齐产生视觉跳动，工具站应在 `wheel.isRunning()` 为 `true` 时禁用奖品、图形权重、角度偏移和指针角度编辑。

## 默认样式 defaultStyle

```js
defaultStyle: {
  background: '#fff',
  fontColor: '#333',
  fontSize: '16px',
  fontStyle: 'sans-serif',
  fontWeight: '400',
  lineHeight: '22px',
  wordWrap: true,
  lengthLimit: '90%',
  lineClamp: 2,
  orientation: 'horizontal',
  top: '18%',
  left: '0%',
  textAlign: 'center',
  verticalAlign: 'middle',
  textOverflow: 'ellipsis',
  ellipsis: '...'
}
```

这些值会被每个奖品或文字项自己的配置覆盖。

## 文字 FontConfig

| 属性            | 类型               | 说明                                                        |
| --------------- | ------------------ | ----------------------------------------------------------- |
| `visible`       | `boolean`          | 是否绘制当前文字                                            |
| `text`          | `string \| number` | 显示内容                                                    |
| `top`           | `string \| number` | 沿半径的位置；正值从中心向外缘移动                          |
| `left`          | `string \| number` | 沿扇区切线方向的偏移                                        |
| `fontColor`     | `string`           | 颜色                                                        |
| `fontSize`      | `string \| number` | 字号                                                        |
| `fontStyle`     | `string`           | 字体名称，保留原版字段名称                                  |
| `fontFamily`    | `string`           | `fontStyle` 的可选别名                                      |
| `fontWeight`    | `string \| number` | 字重                                                        |
| `lineHeight`    | `string \| number` | 行高                                                        |
| `wordWrap`      | `boolean`          | 是否自动换行                                                |
| `lengthLimit`   | `string \| number` | 每行最大宽度                                                |
| `lineClamp`     | `number`           | 最大行数                                                    |
| `orientation`   | `string`           | `horizontal` 横排，`vertical` 按 Unicode 字符沿半径逐字竖排 |
| `textAlign`     | `string`           | `left`、`center` 或 `right`                                 |
| `verticalAlign` | `string`           | 按钮文字的 `top`、`middle`、`bottom`；省略 `top` 时生效     |
| `textOverflow`  | `string`           | 超出 `lineClamp` 后使用 `ellipsis` 或 `clip`                |
| `ellipsis`      | `string`           | 自定义省略标记，例如 `…`                                    |

`fontSize` 和 `lineHeight` 使用百分比时，以当前逻辑画布短边为基准，因此会随画布等比缩放；使用 `px`、数字、`rem`、`vw` 或 `vh` 时保持对应单位语义。例如从 360px 设计稿等比缩放 14px 字号，可以配置 `fontSize: '3.888889%'`。

`defaultStyle.top`、`defaultStyle.left` 和 `defaultStyle.textAlign` 是全部奖品文字的默认位置与对齐方式。`top` 的百分比以当前可绘制半径为基准，`left` 的百分比以当前扇区弦宽为基准；单条 `prizes[].fonts[]` 配置同名字段时优先使用单条配置。

横排文字在 `wordWrap: true` 时会同时尊重显式 `\n` 和自动换行；`wordWrap: false` 只按 `\n` 换行。竖排文字使用 `Array.from()` 按 Unicode 字符拆分，不会把常见的代理对字符拆坏。按钮文字没有设置 `top` 时默认 `verticalAlign: 'middle'`，避免通过负偏移人工“看起来居中”。扇区变窄时，`lengthLimit`、`lineClamp` 与 `textOverflow` 继续负责换行和截断。

## 图片 ImageConfig

| 属性          | 类型               | 说明                                              |
| ------------- | ------------------ | ------------------------------------------------- |
| `src`         | `string`           | 图片地址                                          |
| `visible`     | `boolean`          | 是否加载和绘制；设为 `false` 时保留当前图片配置   |
| `width`       | `string \| number` | 绘制宽度                                          |
| `height`      | `string \| number` | 绘制高度，省略时保持比例                          |
| `top`         | `string \| number` | 垂直位置                                          |
| `left`        | `string \| number` | 水平偏移                                          |
| `rotate`      | `boolean`          | 外圈图片是否跟随转盘旋转                          |
| `crossOrigin` | `string`           | 跨域图片设置，例如 `anonymous`                    |
| `formatter`   | `function`         | 图片加载完成后的自定义处理函数                    |
| `timeout`     | `number`           | 单张图片超时毫秒数；覆盖高级配置的 `imageTimeout` |

## 推荐抽奖流程

```js
const wheel = new WheelCanvasJS.WheelCanvas('#wheel', {
    // 其他配置……
    async start() {
        wheel.play()

        const response = await fetch('/api/draw', { method: 'POST' })
        const result = await response.json()

        wheel.stop(result.prizeIndex)
    },
    end(prize) {
        showResult(prize)
    },
    error(error) {
        showError(error)
    },
})
```

`play()` 只负责开始动画，`stop(index)` 才决定最终停在哪个奖品。

## 工具站实时更新

配置编辑器修改表单后，不需要销毁实例：

```js
await wheel.update({
    width: '400px',
    prizes: generatedPrizes,
    defaultStyle: {
        fontColor: '#5f3dc4',
    },
    defaultConfig: {
        speed: 24,
        decelerationTime: 3200,
    },
})
```

数组配置会被替换，`defaultStyle` 和 `defaultConfig` 会被合并。

## 原版响应式修改

原版常见的直接修改方式也保留了：

```js
wheel.defaultStyle.background = '#f8f9fa'
wheel.defaultConfig.speed = 24
wheel.prizes[0].background = '#ffe8cc'
wheel.buttons[0].fonts[0].text = '抽奖'
wheel.width = '420px'
```

这些修改会自动触发重绘；图片的 `src`、`crossOrigin` 或 `formatter` 变化时会重新加载或处理。转动期间不要修改奖品列表、图形权重、角度偏移或指针角度；普通样式修改仍可安全重绘。

## 反馈 feedback

`feedback` 是零依赖的语义适配层。核心只决定“何时触发”，播放音频与绘制庆祝效果由应用传入的函数完成，因此可以接入 UI SFX、Web Audio、canvas-confetti 或自有实现。

```js
feedback: {
    enabled: true,
    sound: {
        enabled: true,
        pack: 'mechanical',
        sectorCue: 'snap',
        resultCue: 'reward',
        volume: 0.3,
        minInterval: 35,
        play(cue, detail, config) {
            audioAdapter.play(cue, config)
        },
    },
    celebration: {
        enabled: true,
        style: 'subtle',
        particleCount: 48,
        disableForReducedMotion: true,
        fire(style, detail, config) {
            celebrationAdapter.fire(style, detail, config)
        },
    },
}
```

| 属性                                  | 默认值       | 说明                                                         |
| ------------------------------------- | ------------ | ------------------------------------------------------------ |
| `enabled`                             | `true`       | 反馈总开关，不影响动画或中奖计算                             |
| `sound.enabled`                       | `false`      | 声音开关                                                     |
| `sound.pack`                          | `mechanical` | 交给适配器解释的声音包名称                                   |
| `sound.sectorCue`                     | `snap`       | 指针进入新扇区时的语义声音名                                 |
| `sound.resultCue`                     | `reward`     | 成功结束时的语义声音名                                       |
| `sound.volume`                        | `0.3`        | 建议音量，适配器应限制在 `0..1`                              |
| `sound.minInterval`                   | `35`         | 扇区声音最小间隔，范围会被限制到 `0..1000ms`                 |
| `sound.play`                          | -            | `(cue, detail, soundConfig)`；支持返回 Promise               |
| `celebration.enabled`                 | `false`      | 成功结束时是否调用庆祝适配器                                 |
| `celebration.style`                   | `subtle`     | 交给适配器解释的样式名称                                     |
| `celebration.particleCount`           | `48`         | 建议粒子数                                                   |
| `celebration.disableForReducedMotion` | `true`       | 适配器应尊重系统减少动态效果偏好                             |
| `celebration.fire`                    | -            | `(style, resultDetail, celebrationConfig)`；支持返回 Promise |

扇区 `detail` 包含 `index`、`previousIndex`、`prize`、`angularVelocity` 和 `rotation`；结果 `detail` 包含 `index`、`prize`、`rotation` 和可用的扇区 `colors`。初始化时不会播放扇区声，取消、失败和被销毁的抽奖不会触发结果声音或庆祝效果。适配器抛错会产生 `WheelCanvasFeedbackError` 并进入 `error` 回调，但不会阻断转盘。

## 公开方法

首次渲染和图片处理是异步的。需要在截图、读取像素或显示依赖图片的界面前等待：

```js
await wheel.ready
```

`ready` 会在本次初始化及图片加载/格式化流程结束后完成；单个资源失败会触发 `error` 并安全跳过该资源，`destroy()` 会取消仍在等待的图片。

| 方法                     | 说明                                              |
| ------------------------ | ------------------------------------------------- |
| `play()`                 | 开始旋转                                          |
| `spin(velocity)`         | 按指定度/秒启动物理旋转；负数表示逆时针           |
| `stop(index)`            | 停止到指定奖品                                    |
| `stop()`                 | 根据 `range` 权重停止；没有有效权重时结束本次旋转 |
| `init()`                 | 重置状态、重新加载图片并绘制                      |
| `update(config)`         | 合并配置并重新初始化                              |
| `setSize(width, height)` | 一次重排同时更新逻辑宽高；省略高度时创建正方形    |
| `resize()`               | 重新计算 DPR、尺寸和坐标                          |
| `clearCanvas()`          | 清空 Canvas                                       |
| `getCurrentPrizeIndex()` | 获取当前指针区域                                  |
| `isRunning()`            | 是否正在旋转                                      |
| `isWeb()`                | 当前是否为 Web 标识                               |
| `destroy()`              | 取消动画、监听器和观察器，并恢复宿主 DOM          |

为了兼容原版的继承扩展，还保留了 `loadImg()`、`drawImage()`、`computedWidthAndHeight()`、`changeUnits()`、`getLength()`、`getOffsetX()`、`getOffscreenCanvas()`、`$set()`、`$computed()`、`$watch()` 和 `conversionAxis()`。
