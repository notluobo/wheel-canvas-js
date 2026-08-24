# WheelCanvasJS 能力清单

[English](../CAPABILITIES.md) · 简体中文

本文档描述 `1.0.0` 当前已经实现、具有类型声明并纳入测试的能力。字段细节见 [配置参考](./config.md)，浏览器中的可运行版本见 [首页配置工作台](../../index.html)。

## 1. 接入与运行环境

- 零运行时依赖，使用原生 Canvas 2D。
- 浏览器 `<script>` / UMD 全局变量 `WheelCanvasJS`。
- CommonJS `require('wheel-canvas-js')`。
- 原生 ESM 默认导入和命名导入。
- TypeScript CJS/ESM 类型声明。
- 支持 CSS 选择器、HTMLElement、已有 Canvas 和高级宿主配置。
- 支持数字、`px`、`%`、`rem`、`vw`、`vh` 及自定义单位转换。
- 自动处理 DPR、容器 resize、键盘激活和实例销毁。

## 2. 转盘结构

| 能力                      | 配置入口                                   |
| ------------------------- | ------------------------------------------ |
| 多层外圈、纯色背景        | `blocks[].padding/background`              |
| 外圈图片、旋转/静止背景图 | `blocks[].imgs[]`、`ImageConfig.rotate`    |
| 奖品背景、文字、图片      | `prizes[].background/fonts/imgs`           |
| 扇区间距                  | `defaultConfig.gutter`                     |
| 整体角度偏移              | `defaultConfig.offsetDegree`               |
| 等分扇区                  | `useGraphicWeight: false`                  |
| 不等宽扇区                | `useGraphicWeight: true` + `displayWeight` |
| 视觉权重与中奖权重分离    | `displayWeight` / `range`                  |

`range` 只适合普通前端随机测试。涉及库存、资金、优惠权益或公平审计时，应由可信后端返回中奖下标，再调用 `stop(index)`。

## 3. 文字系统

扇区文字与中心按钮文字共用 `FontConfig`：

- `visible` 控制单条文字显示。
- `orientation: 'horizontal'` 横排；`vertical` 按 Unicode 字符沿半径逐字竖排。
- `top` 控制从中心向外缘的径向位置，`left` 控制切向偏移；`textAlign` 控制锚点对齐。三项均可设为全局默认值，也可由单个奖品覆盖。
- `fontColor`、`fontSize`、`fontFamily` / `fontStyle`、`fontWeight`、`lineHeight`。
- `fontSize` / `lineHeight` 使用百分比时随画布短边等比缩放，其他 CSS 长度单位保持原语义。
- `wordWrap` 控制自动换行；显式换行符始终可用于手动分行。
- `lengthLimit` 控制每行宽度，关闭自动换行时仍会执行裁切或省略。
- `lineClamp` 控制最大行数或竖排字符数。
- `textOverflow: 'ellipsis' | 'clip'` 控制溢出策略。
- `ellipsis` 自定义省略标记。
- 按钮文字省略 `top` 时默认 `verticalAlign: 'middle'`；也可选择 `top` 或 `bottom`。
- `defaultStyle` 可以统一设置上述默认值，每条文字仍可覆盖。

可运行示例：首页配置工作台 → “奖品内容与文字”。

## 4. 中心按钮

- 一个或多个同心按钮。
- `visible` 隐藏整个按钮；隐藏后不会占用扇区文字空间，也不会保留点击热区。
- `textVisible` 只隐藏按钮文字。
- `radius`、`background`、`opacity`。
- `borderColor`、`borderWidth`。
- 官方视觉默认无阴影；兼容字段 `shadowColor`、`shadowBlur`、`shadowOffsetX`、`shadowOffsetY` 仅供显式扩展。
- 每层按钮都可配置文字和图片。
- 未填写顶层 `pointer` 时，`buttons[].pointer: true` 保留原有中心指针兼容行为。

可运行示例：首页实时控制显示、文字、大小、颜色、边框、字号和垂直对齐。

## 5. 指针

- `type: 'center' | 'external' | 'none'`。
- `position: 'top' | 'right' | 'bottom' | 'left'`。
- `angle` 支持从十二点方向顺时针计算的任意角度。
- 中心和外置指针共用 21 种内置预设：`minimal`、`classic`、`flapper`、`wedge`、`needle`、`pin`、`glass`、`jewel`、`triangle`、`kite`、`arrow`、`chevron`、`diamond`、`notch`、`teardrop`、`spear`、`soft`、`tab`、`dart`、`shield`、`ribbon`。
- 默认外置预设 `minimal` 是无固定座、无材质装饰的极简箭头。
- `width` / `height` 独立控制尺寸；`px` 保持绝对尺寸，`%` 随画布缩放。
- `cornerRadius` 控制内置中心与外置指针的真实轮廓圆角，默认 `3px`，设为 `0` 可恢复锐角。
- `tipInset` 控制尖端深入轮盘的距离；`tangentOffset` 控制沿轮缘切线偏移。
- 中心指针支持独立方向、尺寸、描边和 `radialOffset` 径向位置；`fused` 控制是否与中心按钮融合；`adaptive` 保留所选预设，`droplet` 使用固定连续水滴轮廓，`layered` 使用圆形按钮和独立箭头。
- `layout: 'fit' | 'stable' | 'overlay'` 与 `space` 控制外置安全区；稳定模式下调整指针不会改变转盘半径。
- 主体颜色、描边、透明度、渐变、暗面。
- `colorSource: 'fixed' | 'currentPrize'` 可使用固定色或跟随当前扇区颜色。
- `wobble` 可配置跨扇区回弹的幅度、时长、频率、阻尼与减少动态效果策略；反馈不参与中奖计算。
- 固定座显示、半径、颜色、边框、透明度、金属渐变。
- 默认关闭的可选阴影颜色、模糊、切向和径向偏移。
- `renderer(ctx, metrics)` 可完全接管指针绘制；Canvas 状态和异常由引擎隔离。
- 指针角度参与绘制、目标停止和当前奖品计算，四方向不会造成视觉结果错位。

首页可实时切换中心/外置/隐藏指针、21 种造型、固定/扇区跟随颜色、跨扇区回弹、尺寸、轮廓圆角、空间策略、角度、径向位置、深入距离、描边、切向偏移、固定座、中心融合与水滴一体轮廓；所有可序列化字段都可通过高级 JSON 调整。

## 6. 图片与资源

- 外圈、奖品和按钮图片。
- 首页支持奖品纯文字、纯图片、图文混排，以及中心 Logo 的 URL 或本地上传配置。
- 首页逐奖项图片限制为 2 MiB，批量图片和中心 Logo 限制为 5 MiB；非图片文件会被拒绝，跨域图片可配置 `crossOrigin`。
- 仅指定宽或高时保持原图比例。
- 位置、旋转、跨域模式和单图超时配置。
- `formatter` 支持同步或异步预处理。
- 相同 URL 共享原始加载结果，不同 formatter 保持独立结果。
- 原地修改 `src`、`crossOrigin` 或 `formatter` 会重新解析。
- 加载错误通过 `error` 可观察；`destroy()` 后迟到资源不会复活实例。

## 7. 脚本动画与抽奖

- `play()` 开始；`stop(index)` 停到指定奖品。
- 无参数 `stop()` 按 `range` 选择前端测试结果。
- `speed`、`speedFunction`、`accelerationTime`、`decelerationTime`。
- `stopRange` 控制中奖扇区内随机落点范围。
- `start` 支持同步函数或 Promise，适合请求后端结果。
- `end(prize)` 只在成功确认中奖时触发。
- `error(error)` 处理初始化、回调、资源和物理结果错误。
- `onCurrentChange(index, prize)` 观察指针当前扇区变化。

## 8. 拖动与物理旋转

- 鼠标、触控笔和触屏 Pointer Events。
- 拖动阈值、中心死区、灵敏度、允许方向和拖动区域。
- 使用最近样本窗口的时间加权回归估算释放角速度。
- 混合滚动阻力和黏性阻尼；自然滑动不会先人为加速。
- 固定物理子步与补算上限，常规不同帧率下保持一致。
- 自然停止、按权重选结果或 `onRelease` 返回同步/异步结果。
- 受控结果使用满足速度、加速度和 jerk 约束的平滑落点规划。
- 等待后端时可选择保持低速或自然滑行；保持策略不会抬高当前速度。
- 结果超时、拒绝或非法下标有错误策略，不会误发中奖 `end`。
- `onStart`、`onRelease`、`onEnd`、`onCancel` 和全局 `error`。
- Pointer capture 丢失、窗口失焦、动态关闭物理和销毁均有取消清理。

可运行示例：首页勾选“滑动物理”。

## 9. 声音与庆祝反馈

- `feedback.enabled` 提供反馈总开关，声音与庆祝效果可再独立开关。
- `sound.play(cue, detail, config)` 接收扇区 `sectorCue` 和结果 `resultCue`，支持声音包、音量与扇区触发最小间隔。
- `celebration.fire(style, detail, config)` 只在成功结束时调用，支持样式、粒子数量和减少动态效果偏好。
- 初始化、取消、失败和销毁不会误触发中奖庆祝；反馈适配器异常不会改变动画、落点或 `end` 语义。
- 核心不携带音频文件或特效运行时。首页示例按需连接 UI SFX 的 CC0 音频与 canvas-confetti，生产环境可替换为本地资源或自有实现。

## 10. 动态配置与生命周期

- 可直接响应式修改 `prizes`、`blocks`、`buttons`、`pointer`、`physics`、`defaultStyle` 和 `defaultConfig`。
- `update(patch)` 支持批量合并配置并重新初始化。
- 百分比尺寸基于包含块，不会连续 resize 时反复缩小。
- 旋转期间冻结中奖布局；不兼容的奖品结构变化会安全失败，不会回调错误奖品。
- 生命周期：`beforeCreate`、`beforeResize`、`afterResize`、`beforeInit`、`afterInit`、`beforeDraw`、`afterDraw`、`afterStart`。
- 公开方法：`init`、`update`、`resize`、`draw`、`clearCanvas`、`play`、`spin`、`stop`、`getCurrentPrizeIndex`、`conversionAxis`、`isRunning`、`destroy`。
- 兼容扩展方法：`getLength`、`changeUnits`、`loadImg`、`drawImage`、`computedWidthAndHeight`、`getOffscreenCanvas`、`$set`、`$computed`、`$watch`。

## 11. 可访问性与工程保证

- Canvas 自动配置按钮角色、键盘焦点和可定制 `ariaLabel`。
- 点击中心、Enter 和空格可以触发 `start`。
- 示例站包含隐藏奖品说明、`aria-live` 结果和忙碌状态。
- 所有公开 API 维持 4 空格缩进和 ESLint / Prettier 规范。
- 发布检查覆盖格式、Lint、语法、TypeScript、CJS/ESM/UMD、文档脚本、兼容行为、边界条件和 npm 打包。
- 默认限制最大 DPR 和 Canvas backing-store 总像素数，避免高 DPR 大画布产生不可控内存占用；两项预算均可配置。
- 离屏画布复用同一像素预算，批量图片加载支持可配置并发上限。
- 扇区布局、外置指针几何与文字换行在配置稳定时复用缓存，旋转帧不重复测量同一段文字；字体加载完成后自动失效重算。
- 核心保持零运行时依赖，不内置统计 SDK、广告、WebAudio、振动、历史数据库或后端公平性服务；这些属于业务层或后续插件层，不会污染抽奖核心。

## 示例索引

| 示例       | 重点                                 |
| ---------- | ------------------------------------ |
| 等分扇区   | 原版等角扇区与 `range`               |
| 图形权重   | `displayWeight` 改变扇区大小         |
| 概率分离   | 概率权重与视觉权重互不影响           |
| 图片装饰   | 多层外圈、旋转边框图、奖品图和按钮图 |
| 文字排版   | 横排、竖排、手动换行、长文字省略     |
| 中心按钮   | 显示、尺寸、颜色、边框、垂直居中文字 |
| 落点与速度 | `stopRange`、速度函数与加减速时间    |
| 物理旋转   | 极简外置指针、拖动释放和自然惯性     |
| Playground | 粘贴 JSON 后实时重建                 |

## 明确边界

- 核心不替代后端抽奖、防作弊、库存扣减和审计系统。
- Canvas 内部内容不是 DOM 文本；重要奖品和结果应在页面提供可访问的文字副本。
- 自定义图片受浏览器 CORS 规则约束。
- 物理手感仍应在目标手机、触屏和高刷新率设备上进行发布前真机验收。
