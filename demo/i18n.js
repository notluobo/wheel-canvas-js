;(function (root, factory) {
    const api = factory()
    if (typeof module === 'object' && module.exports) module.exports = api
    if (root) root.WheelCanvasI18n = api
    if (root && root.document) api.init()
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict'

    const SUPPORTED_LOCALES = Object.freeze(['en', 'zh-CN'])
    const STORAGE_KEY = 'wheel-canvas-js-locale'
    const LOCALIZABLE_PATTERN = /[\p{Script=Han}，。；：“”《》？！、]/u
    const TRANSLATIONS = Object.freeze({
        'WheelCanvasJS 是一个零运行时依赖、配置驱动、支持图形权重的原生 JavaScript Canvas 大转盘。':
            'WheelCanvasJS is a zero-runtime-dependency, configuration-driven JavaScript Canvas prize wheel with visual weighting.',
        'WheelCanvasJS — 配置驱动的原生大转盘': 'WheelCanvasJS — A configurable Canvas prize wheel',
        'WheelCanvasJS 首页': 'WheelCanvasJS home',
        'WheelCanvasJS 在线配置与使用示例': 'WheelCanvasJS live configuration and examples',
        '抽奖转盘。奖项与中奖权重见页面辅助说明。':
            'Prize wheel. See the page description for prizes and selection weights.',
        跳到主要内容: 'Skip to main content',
        使用教程: 'Tutorial',
        实时转盘预览: 'Live wheel preview',
        'Canvas · 立即生效': 'Canvas · Live updates',
        本地自动保存: 'Autosave locally',
        已保存到本地: 'Saved locally',
        已恢复本地配置: 'Local configuration restored',
        本地存储不可用: 'Local storage unavailable',
        本地配置无效已忽略: 'Invalid local configuration ignored',
        本地配置格式无效: 'Invalid local configuration format',
        本地空间不足未保存: 'Not saved: local storage is full',
        重置配置: 'Reset configuration',
        清除本地配置并恢复官方默认值: 'Clear the local configuration and restore official defaults',
        '点击转盘中心或按 Enter、空格键开始。开启滑动物理后，可以拖动扇区并释放。':
            'Click the center or press Enter or Space to start. With drag physics enabled, drag a sector and release it.',
        点击中心开始抽奖: 'Click the center to spin',
        立即试转: 'Spin now',
        配置内容: 'Edit prizes',
        转盘配置: 'Wheel settings',
        转盘实时配置: 'Live wheel settings',
        '外观 · 交互 · 性能': 'Appearance · interaction · performance',
        '这里的配置全部由核心直接执行，不依赖声音、烟花或页面框架。':
            'Every setting here is executed by the core without sound, confetti, or a page framework.',
        核心能力: 'Core capabilities',
        扇区与双权重: 'Sectors and independent weights',
        中心与外置指针: 'Center and external pointers',
        图片和文字排版: 'Image and text layout',
        边框与中心按钮: 'Rings and center control',
        脚本动画: 'Scripted animation',
        拖动物理: 'Drag physics',
        指针: 'Pointer',
        位置: 'Position',
        中心: 'Center',
        上方: 'Top',
        右侧: 'Right',
        下方: 'Bottom',
        左侧: 'Left',
        隐藏指针: 'Hide pointer',
        造型: 'Preset',
        极简融合箭头: 'Minimal fused pointer',
        极简箭头: 'Minimal pointer',
        经典拨片: 'Classic flapper',
        机械拨片: 'Mechanical flapper',
        简洁箭头: 'Clean wedge',
        精细针尖: 'Fine needle',
        图钉: 'Pin',
        玻璃: 'Glass',
        宝石: 'Jewel',
        经典中心三角: 'Classic center triangle',
        三角: 'Triangle',
        风筝: 'Kite',
        长柄箭头: 'Long arrow',
        折角箭头: 'Chevron',
        菱形指针: 'Diamond',
        凹口箭头: 'Notched pointer',
        水滴指针: 'Teardrop',
        矛尖指针: 'Spear',
        柔和箭头: 'Soft pointer',
        圆角标签: 'Rounded tab',
        飞镖箭头: 'Dart',
        盾形箭头: 'Shield',
        缎带箭头: 'Ribbon',
        主体颜色: 'Body color',
        颜色来源: 'Color source',
        固定颜色: 'Fixed color',
        跟随当前扇区: 'Follow current sector',
        跟随扇区颜色: 'Follow sector color',
        描边颜色: 'Outline color',
        尺寸: 'Size',
        中心角度: 'Center angle',
        与中心按钮融合: 'Fuse with center button',
        融合轮廓: 'Fusion style',
        自适应一体轮廓: 'Adaptive unified outline',
        水滴形固定轮廓: 'Fixed droplet outline',
        圆形按钮与独立箭头: 'Circular button and separate pointer',
        '圆形按钮 + 独立箭头': 'Circular button + separate pointer',
        外置布局: 'External layout',
        外置指针布局: 'External pointer layout',
        '稳定：调指针不缩盘': 'Stable: pointer changes do not resize wheel',
        '自适应：完整避让': 'Fit: keep pointer in bounds',
        '覆盖：最大转盘': 'Overlay: maximum wheel size',
        固定安全区: 'Fixed safe area',
        中心径向偏移: 'Center radial offset',
        深入: 'Tip inset',
        描边: 'Outline',
        边缘圆角: 'Corner radius',
        跨扇区轻微回弹: 'Subtle boundary wobble',
        回弹幅度: 'Wobble amplitude',
        回弹时长: 'Wobble duration',
        回弹频率: 'Wobble frequency',
        回弹阻尼: 'Wobble damping',
        切向偏移: 'Tangent offset',
        显示固定座: 'Show mount',
        外圈与扇区: 'Rings and sectors',
        外边框颜色: 'Outer ring color',
        外边框宽度: 'Outer ring width',
        内边框颜色: 'Inner ring color',
        内边框宽度: 'Inner ring width',
        扇区缝隙: 'Sector gap',
        角度偏移: 'Angle offset',
        画布尺寸: 'Canvas size',
        图形权重: 'Visual weight',
        '支持 280–1200px 设计尺寸；中间预览会自动适应可用空间，复制出的配置仍保留设计尺寸。':
            'Supports a 280–1200px design size. The preview fits available space while copied configuration preserves the design size.',
        当前预览: 'Current preview',
        中心按钮: 'Center control',
        显示中心按钮: 'Show center control',
        显示中心文字: 'Show center text',
        中心文字: 'Center text',
        开始: 'SPIN',
        背景颜色: 'Background color',
        边框颜色: 'Border color',
        文字对齐: 'Text alignment',
        顶部: 'Top',
        居中: 'Center',
        底部: 'Bottom',
        中心大小: 'Center size',
        中心边框: 'Center outline',
        中心字号: 'Center font size',
        批量图片内容: 'Batch image content',
        奖品内容模式: 'Prize content mode',
        仅文字: 'Text only',
        '文字 + 图片': 'Text + image',
        仅图片: 'Image only',
        全部奖品首层图片: 'First image for all prizes',
        上传全部奖品图片: 'Upload image for all prizes',
        跨域模式: 'Cross-origin mode',
        不设置: 'Not set',
        奖品图片大小: 'Prize image size',
        奖品图片位置: 'Prize image position',
        显示中心Logo: 'Show center logo',
        中心Logo地址: 'Center logo URL',
        中心Logo大小: 'Center logo size',
        '显示中心 Logo': 'Show center logo',
        '中心 Logo 地址': 'Center logo URL',
        '上传中心 Logo': 'Upload center logo',
        '中心 Logo 大小': 'Center logo size',
        '此处批量控制每个奖品的首层图片，并保留高级 JSON 中配置的其余图片层。支持 URL、Data URL 和本地图片；跨域服务器需允许 CORS。本地上传限制为 5 MiB。':
            'This batch control updates the first image of each prize and preserves additional layers from Advanced JSON. URL, Data URL, and local files are supported. Cross-origin servers must allow CORS. Local uploads are limited to 5 MiB.',
        奖品文字: 'Prize text',
        '此处修改全局文字默认值；高级 JSON 中每个奖品的独立字体覆盖会被保留。':
            'These controls update global typography defaults while preserving per-prize overrides from Advanced JSON.',
        文字随画布等比缩放: 'Scale text with canvas',
        显示奖品文字: 'Show prize text',
        自动换行: 'Automatic wrapping',
        排列方向: 'Orientation',
        横排: 'Horizontal',
        竖排: 'Vertical',
        水平对齐: 'Horizontal alignment',
        左对齐: 'Left',
        右对齐: 'Right',
        溢出方式: 'Overflow',
        省略: 'Ellipsis',
        裁剪: 'Clip',
        文字颜色: 'Text color',
        基准字号: 'Base font size',
        沿半径位置: 'Radial position',
        横向偏移: 'Tangential offset',
        宽度限制: 'Width limit',
        最多行数: 'Maximum lines',
        '沿半径位置从中心向外缘递增；横向偏移按当前扇区宽度计算。每个奖项仍可在高级 JSON 中单独覆盖。':
            'Radial position increases from center to rim. Tangential offset uses the current sector width. Advanced JSON can still override each prize.',
        动画与物理: 'Animation and physics',
        旋转速度: 'Rotation speed',
        加速曲线: 'Acceleration easing',
        加速时间: 'Acceleration time',
        减速时间: 'Deceleration time',
        停止范围: 'Stop range',
        滑动物理: 'Drag physics',
        滑动灵敏度: 'Drag sensitivity',
        滚动阻力: 'Rolling resistance',
        黏性阻尼: 'Viscous damping',
        允许方向: 'Allowed direction',
        双向: 'Both',
        顺时针: 'Clockwise',
        逆时针: 'Counterclockwise',
        性能与资源: 'Performance and resources',
        '限制高清画布和图片并发峰值；默认值适合常规桌面与移动设备。':
            'Limit high-resolution Canvas and concurrent image peaks. Defaults suit typical desktop and mobile devices.',
        最大DPR: 'Maximum DPR',
        '最大 DPR': 'Maximum DPR',
        最大画布像素: 'Maximum canvas pixels',
        '约 419 万': 'About 4.19 million',
        '约 839 万': 'About 8.39 million',
        '约 1677 万 · 推荐': 'About 16.77 million · Recommended',
        '约 3355 万': 'About 33.55 million',
        不限制: 'Unlimited',
        图片并发: 'Image concurrency',
        辅助配置: 'Optional adapters',
        可选适配器: 'Optional adapters',
        辅助体验配置: 'Optional experience configuration',
        '这些能力通过核心反馈接口接入，不进入中奖计算，也不会改变最终落点。':
            'These capabilities use core feedback hooks. They never participate in selection or change the final landing.',
        辅助能力: 'Optional capabilities',
        经过扇区声音: 'Sector tick sound',
        中奖结果声音: 'Result sound',
        彩带与烟花: 'Confetti and celebration',
        配置导入导出: 'Configuration import/export',
        声音与庆祝: 'Sound and celebration',
        '扇区经过声使用 UI SFX 的 CC0 音频，推荐机械卡点；中奖彩带使用 canvas-confetti。两项都可以关闭，声音仅在用户操作后播放，彩带默认尊重系统“减少动态效果”偏好。':
            'Sector ticks use CC0 UI SFX audio with a mechanical cue by default. Winner confetti uses canvas-confetti. Both can be disabled; sound starts only after user interaction and confetti respects reduced-motion preferences.',
        开启转盘声音: 'Enable wheel sound',
        声音风格: 'Sound pack',
        '机械 · 推荐': 'Mechanical · Recommended',
        极简: 'Minimal',
        柔和: 'Soft',
        街机: 'Arcade',
        经过扇区: 'Sector tick',
        指针进入当前扇区: 'Pointer enters the current sector',
        '卡点 · 推荐': 'Snap · Recommended',
        步进: 'Step',
        选择: 'Select',
        落点: 'Drop',
        中奖结束: 'Winning result',
        '奖励 · 推荐': 'Reward · Recommended',
        完成: 'Complete',
        成就: 'Achievement',
        惊喜: 'Bonus',
        音量: 'Volume',
        最小音效间隔: 'Minimum cue interval',
        试听中奖声音: 'Preview result sound',
        中奖彩带: 'Winner confetti',
        彩带风格: 'Celebration style',
        '克制庆祝 · 推荐': 'Subtle · Recommended',
        盛大爆发: 'Large burst',
        星星: 'Stars',
        粒子数量: 'Particle count',
        尊重减少动态效果: 'Respect reduced motion',
        '高级 JSON · 全部配置': 'Advanced JSON · Complete configuration',
        '可编辑 blocks、prizes、buttons、pointer、defaultStyle、defaultConfig 、physics 与 feedback。函数回调请在业务代码中配置。':
            'Edit blocks, prizes, buttons, pointer, defaultStyle, defaultConfig, physics, and feedback. Configure function callbacks in application code.',
        完整转盘JSON配置: 'Complete wheel JSON configuration',
        '完整转盘 JSON 配置': 'Complete wheel JSON configuration',
        应用JSON: 'Apply JSON',
        '应用 JSON': 'Apply JSON',
        恢复默认: 'Restore defaults',
        复制配置: 'Copy configuration',
        实时配置: 'Live configuration',
        转盘内容: 'Wheel content',
        关闭内容配置: 'Close prize editor',
        '可配置每个奖项的文字、颜色、图片和权重；图片支持地址或本地上传，修改后立即显示在中间转盘。':
            'Configure each prize label, color, image, and weight. Images support URLs and local uploads, and changes appear immediately.',
        奖项配置列表: 'Prize configuration list',
        当前配置会同步到高级JSON: 'Current values are synchronized to Advanced JSON.',
        '当前配置会同步到高级 JSON。': 'Current values are synchronized to Advanced JSON.',
        恢复默认奖项: 'Restore default prizes',
        添加奖项: 'Add prize',
        从零开始使用WheelCanvasJS: 'Start with WheelCanvasJS',
        '从零开始使用 WheelCanvasJS': 'Start with WheelCanvasJS',
        '零运行时依赖、配置驱动的 Canvas 转盘。下面从引入文件开始，完整讲解内容、权重、指针、物理旋转、事件、性能和上线检查。':
            'A zero-runtime-dependency, configuration-driven Canvas wheel. This guide covers files, content, weights, pointers, physical rotation, events, performance, and production checks.',
        关闭使用教程: 'Close tutorial',
        教程目录: 'Tutorial contents',
        '01 · 快速开始': '01 · Quick start',
        '02 · 配置结构': '02 · Configuration',
        '03 · 奖项与图片': '03 · Prizes and images',
        '04 · 双权重': '04 · Independent weights',
        '05 · 指针与中心': '05 · Pointer and center',
        '06 · 开始和停止': '06 · Start and stop',
        '07 · 滑动物理': '07 · Drag physics',
        '08 · 事件与反馈': '08 · Events and feedback',
        '09 · 性能与适配': '09 · Performance',
        '10 · 上线检查': '10 · Production checks',
        '11 · 常见问题': '11 · Troubleshooting',
        快速开始: 'Quick start',
        下载发布包中的: 'From the release package, load',
        '，按顺序放入页面。UMD 入口会暴露全局对象':
            '. Load files in order. The UMD entry exposes the global object',
        '，不需要 Vue、React 或其他运行时。': ', with no Vue, React, or other runtime.',
        '最低准备：一个有明确尺寸的容器、核心脚本、奖项数组，以及一个':
            'Minimum setup: a sized container, the core script, a prize array, and one',
        '实例。': 'instance.',
        '下载发布包中的 wheel-canvas-js.umd.js 与页面放在一起，按顺序放入页面。UMD 入口会暴露全局对象 WheelCanvasJS，不需要 Vue、React 或其他运行时。':
            'Place wheel-canvas-js.umd.js next to the page and load it before your application. The UMD entry exposes WheelCanvasJS without Vue, React, or another runtime.',
        '最低准备：一个有明确尺寸的容器、核心脚本、奖项数组，以及一个 WheelCanvas 实例。':
            'Minimum setup: a sized container, the core script, a prize array, and one WheelCanvas instance.',
        复制代码: 'Copy code',
        开始抽奖: 'Start draw',
        抽中: 'Result',
        未命名奖项: 'Unnamed prize',
        理解配置结构: 'Understand the configuration',
        '常用配置按职责分成六部分，辅助声音和彩带不属于核心中奖计算。':
            'Common settings are grouped by responsibility. Optional sound and confetti are not part of core selection.',
        奖项颜色文字图片和权重: 'Prizes, colors, text, images, and weights',
        '奖项、颜色、文字、图片和权重': 'Prizes, colors, text, images, and weights',
        中心按钮文字和Logo: 'Center controls, text, and logo',
        '中心按钮、文字和 Logo': 'Center controls, text, and logo',
        外圈内圈和多层边框: 'Outer, inner, and layered rings',
        '外圈、内圈和多层边框': 'Outer, inner, and layered rings',
        中心外置隐藏及21种造型: 'Center, external, hidden, and 21 presets',
        '中心、外置、隐藏及 21 种造型': 'Center, external, hidden, and 21 presets',
        速度停靠范围图形权重和质量: 'Speed, landing, visual weight, and quality',
        '速度、停靠范围、图形权重和质量': 'Speed, landing, visual weight, and quality',
        拖动惯性阻力和受控落点: 'Drag, inertia, resistance, and controlled landing',
        '拖动、惯性、阻力和受控落点': 'Drag, inertia, resistance, and controlled landing',
        完整配置骨架: 'Complete configuration skeleton',
        奖项文字与图片: 'Prizes, text, and images',
        '奖项、文字与图片': 'Prizes, text, and images',
        '每个奖项可包含多层文字和多张图片。尺寸、位置支持数字、px 和百分比；百分比会随转盘尺寸变化。长文字可通过换行、行数和省略策略约束。':
            'Each prize may contain multiple text and image layers. Size and position accept numbers, px, and percentages. Wrapping, line limits, and ellipsis constrain long labels.',
        图文奖项: 'Text and image prize',
        '礼品卡 100 元': '$100 gift card',
        '同源图片可直接使用；跨域图片需要服务器允许 CORS。':
            'Same-origin images work directly. Cross-origin servers must allow CORS.',
        '修改图片地址或 formatter 后，引擎会重新加载，不复用错误结果。':
            'Changing an image URL or formatter reloads the resource instead of reusing an invalid result.',
        图片加载完成以: 'Image loading is complete when',
        '为准。': 'resolves.',
        '图片加载完成以 await wheel.ready 为准。':
            'Wait for await wheel.ready before relying on images.',
        '大量 Data URL 会放大 JSON 和内存，应优先使用经过压缩的资源地址。':
            'Large Data URLs increase JSON and memory use. Prefer compressed asset URLs.',
        中奖权重与图形权重: 'Selection and visual weights',
        '决定随机抽中的概率；': 'controls random selection probability;',
        '只决定扇区面积。两者彼此独立，避免“看起来大就一定更容易中奖”的误解。':
            'controls only sector area. The two are independent, so a larger-looking sector is not necessarily more likely to win.',
        'range 决定随机抽中的概率；displayWeight 只决定扇区面积。两者彼此独立，避免“看起来大就一定更容易中奖”的误解。':
            'range controls selection probability; displayWeight controls sector area. They are independent.',
        开启不等宽扇区: 'Enable unequal sectors',
        视觉更大: 'Visually larger',
        中奖率更高: 'Higher probability',
        '真实商业抽奖应由可信后端决定结果，再调用 stop(index)；不要把浏览器端随机数作为安全抽奖凭证。':
            'Trusted server logic must decide valuable outcomes before stop(index). Browser randomness is not a security control.',
        '真实商业抽奖应由可信后端决定结果，再调用':
            'Trusted server logic must decide valuable outcomes before calling',
        '；不要把浏览器端随机数作为安全抽奖凭证。':
            '; never treat browser randomness as a secure draw credential.',
        指针和中心按钮: 'Pointer and center control',
        '指针支持中心、上/右/下/左外置、任意角度及隐藏。所有预设支持尺寸、颜色、扇区跟色、圆角与回弹。':
            'Pointers support center, four external sides, arbitrary angle, and hidden mode. Every preset supports size, color, sector following, corner radius, and wobble.',
        中心自适应融合: 'Adaptive center fusion',
        融合模式: 'Fusion mode',
        适用场景: 'Use case',
        '保留所选造型，与中心按钮形成无内部描边的一体轮廓':
            'Preserves the selected shape and forms one center outline without an internal seam',
        '固定水滴形连续轮廓，不随 preset 改变形状':
            'Uses a fixed continuous droplet that does not change with the preset',
        '中心圆和箭头分别着色、分别描边':
            'Colors and outlines the center circle and pointer separately',
        '外置指针使用 stable 可避免调整指针时缩小转盘；使用 fit 可让极端尺寸完整避让。':
            'Use stable to prevent pointer edits from resizing the wheel; use fit to contain extreme pointer dimensions.',
        外置指针使用: 'External pointers can use',
        '可避免调整指针时缩小转盘；使用': 'to prevent pointer edits from shrinking the wheel; use',
        可让极端尺寸完整避让: 'to contain extreme dimensions.',
        开始停止与后端结果: 'Start, stop, and server results',
        '开始、停止与后端结果': 'Start, stop, and server results',
        受控抽奖: 'Controlled draw',
        抽奖接口不可用: 'Draw API unavailable',
        'play() 进入加速和巡航状态。': 'play() enters acceleration and cruise.',
        'stop(index) 精确落到指定奖项。': 'stop(index) lands on the requested prize.',
        'stop() 按 range 权重选择奖项。': 'stop() selects using range weights.',
        '进入加速和巡航状态。': 'enters acceleration and cruise.',
        '精确落到指定奖项。': 'lands on the requested prize.',
        '按 range 权重选择奖项。': 'selects using range weights.',
        '取消本次抽奖，不触发中奖回调。': 'Cancel the draw without a winning callback.',
        '运行时不要增删或重排奖项；核心会拒绝不一致结果。':
            'Do not add, remove, or reorder prizes while running; the core rejects inconsistent results.',
        真实滑动物理: 'Natural drag physics',
        '用户可以直接拖动轮盘并释放。引擎使用时间窗口估算角速度、固定子步积分阻力，并在指定结果下生成连续减速轨迹。':
            'Users can drag and release the wheel. The engine estimates angular velocity over time, integrates resistance in fixed substeps, and produces a continuous target-braking path.',
        自然甩动: 'Natural fling',
        释放速度: 'Release velocity',
        不返回下标自然停靠: 'Return no index for a natural landing',
        返回下标或Promise受控落点: 'Return an index or Promise for controlled landing',
        '不返回下标：自然停靠': 'Return no index: settle naturally',
        '返回下标或 Promise：受控落点': 'Return an index or Promise: controlled landing',
        '返回奖项下标时，轨迹会保持位置、速度和加速度连续，并遵守最大制动力与 jerk 限制；返回 Promise 时可等待后端结果。':
            'An index produces a position-, velocity-, and acceleration-continuous trajectory within brake and jerk limits. A Promise can wait for a server result.',
        生命周期声音和彩带: 'Lifecycle, sound, and celebration',
        '生命周期、声音和彩带': 'Lifecycle, sound, and celebration',
        '核心不打包音频文件和烟花库。可选反馈通过适配器注入，失败不会改变中奖结果。':
            'The core bundles no audio or confetti library. Optional adapters inject feedback, and failures never change the result.',
        生命周期与反馈适配器: 'Lifecycle and feedback adapters',
        开始旋转: 'Spin started',
        指针经过: 'Pointer crossed',
        最终结果: 'Final result',
        '音频必须由用户手势解锁；请尊重系统“减少动态效果”，并对 tick 音效设置最小间隔，避免高速旋转时创建过多音频节点。':
            'Unlock audio from a user gesture, respect reduced motion, and rate-limit tick sounds to avoid excessive audio nodes.',
        响应式清晰度与性能: 'Responsive clarity and performance',
        '响应式、清晰度与性能': 'Responsive clarity and performance',
        '容器必须具有可计算宽度；推荐转盘宽度使用 100%。':
            'The container needs a computable width; 100% wheel width is recommended.',
        '容器必须具有可计算宽度；推荐转盘宽度使用':
            'The container needs a computable width; recommended wheel width:',
        '百分比字号、图片和中心尺寸随可绘制直径缩放；px 指针保持绝对尺寸。':
            'Percentage typography, images, and center sizes scale with drawable diameter; px pointers remain absolute.',
        'maxDpr 限制高分屏倍率，maxCanvasPixels 防止超大画布占用过多内存。':
            'maxDpr limits high-density scaling and maxCanvasPixels prevents oversized backing stores.',
        限制高分屏倍率: 'limits high-density scaling,',
        防止超大画布占用过多内存: 'prevents oversized canvases from consuming excessive memory.',
        '窗口、父容器和设备像素比变化时调用 resize。':
            'Call resize when the window, parent, or device pixel ratio changes.',
        '销毁组件或切换页面时调用 destroy()，清理监听器、动画和资源。':
            'Call destroy() when unmounting to clean listeners, animation, and resources.',
        '窗口、父容器和设备像素比变化时调用':
            'When the window, parent, or device pixel ratio changes, call',
        销毁组件或切换页面时调用: 'When unmounting or changing pages, call',
        '，清理监听器、动画和资源。': 'to clean listeners, animation, and resources.',
        质量预算: 'Quality budget',
        上线前检查: 'Production checklist',
        结果可信: 'Trusted result',
        '有价值的抽奖由后端生成 index，并记录业务流水':
            'Generate valuable results on the server and record business transactions',
        异常可见: 'Visible errors',
        '监听 error；接口失败时取消，不伪造中奖结果':
            'Handle error; cancel failed requests instead of fabricating a result',
        资源可用: 'Available resources',
        '验证图片 CORS、404、字体加载和弱网降级':
            'Test image CORS, 404s, fonts, and slow-network fallback',
        无障碍: 'Accessibility',
        '提供 ariaLabel、键盘入口、焦点状态和结果播报':
            'Provide ariaLabel, keyboard input, visible focus, and result announcements',
        移动端: 'Mobile',
        '验证 320px 宽度、横竖屏、安全区和触控拖动':
            'Test 320px width, orientations, safe areas, and touch dragging',
        生命周期: 'Lifecycle',
        '重复创建/销毁无监听器、定时器和 Canvas 泄漏':
            'Repeated create/destroy leaves no listener, timer, or Canvas leak',
        '发布前运行 npm test 和 npm run pack:check。类型、UMD、ESM、兼容、边界与性能测试均应通过。':
            'Run npm test and npm run pack:check before release. Types, UMD, ESM, compatibility, edge, and performance checks must pass.',
        发布前运行: 'Before release, run',
        和: 'and',
        '。类型、UMD、ESM、兼容、边界与性能测试均应通过。':
            '. Type, UMD, ESM, compatibility, edge, and performance tests must pass.',
        常见问题: 'Troubleshooting',
        页面没有显示转盘: 'The wheel is not visible',
        '确认先加载 wheel-canvas-js.umd.js，再创建实例；容器需要可计算宽度，并检查控制台是否有选择器或图片错误。':
            'Load wheel-canvas-js.umd.js before creating the instance, give the container a computable width, and inspect selector or image errors.',
        画面模糊或占用过高: 'The Canvas is blurry or uses too much memory',
        '不要用 CSS 强行二次缩放 Canvas；合理设置 maxDpr 和 maxCanvasPixels，并在容器尺寸改变后调用 resize。':
            'Do not scale Canvas a second time with CSS. Set maxDpr/maxCanvasPixels and call resize after container changes.',
        中奖概率与扇区大小不一致: 'Probability and sector size differ',
        '这是双权重的预期行为：range 控制概率，displayWeight 控制面积。关闭 useGraphicWeight 后扇区恢复等分。':
            'This is expected: range controls probability and displayWeight controls area. Disable useGraphicWeight for equal sectors.',
        跨域图片无法导出或显示: 'A cross-origin image cannot display or export',
        "图片服务器必须返回允许当前站点的 CORS 响应头，并在图片配置中设置 crossOrigin: 'anonymous'。":
            "The image server must allow this origin with CORS and the image config must use crossOrigin: 'anonymous'.",
        应该查看哪里获得全部字段: 'Where is the complete field reference?',
        '应该查看哪里获得全部字段？': 'Where is the complete field reference?',
        查看随包发布的: 'See the packaged',
        '。类型文件是 API 契约，实际运行入口是 wheel-canvas-js.umd.js 或 wheel-canvas-js.esm.mjs。':
            '. Declarations are the API contract; runtime entries are wheel-canvas-js.umd.js and wheel-canvas-js.esm.mjs.',
        '查看随包发布的 README.md、docs/config.md、docs/CAPABILITIES.md 和 wheel-canvas-js.d.ts。类型文件是 API 契约，实际运行入口是 wheel-canvas-js.umd.js 或 wheel-canvas-js.esm.mjs。':
            'See README.md, docs/config.md, docs/CAPABILITIES.md, and wheel-canvas-js.d.ts. Declarations are the API contract; the runtime entries are the UMD and ESM files.',
        一等奖: 'First prize',
        二等奖: 'Second prize',
        三等奖: 'Third prize',
        五等奖: 'Fifth prize',
        六等奖: 'Sixth prize',
        谢谢参与: 'Try again',
        未命名奖品: 'Unnamed prize',
        中奖: 'Selection',
        图形: 'Visual',
        中奖权重: 'Selection weight',
        扇区占比: 'Sector share',
        奖项名称: 'Prize name',
        颜色: 'Color',
        奖项图片: 'Prize image',
        宽度: 'Width',
        上下位置: 'Vertical position',
        左右偏移: 'Horizontal offset',
        清除图片: 'Clear images',
        显示图片: 'Show image',
        图片地址: 'Image URL',
        'https://example.com/prize.png 或 ./prize.png':
            'https://example.com/prize.png or ./prize.png',
        '本地上传 · 最大 2MB': 'Local upload · 2MB maximum',
        已显示: 'Visible',
        已隐藏: 'Hidden',
        未设置: 'Not set',
        搜索选项: 'Search options',
        搜索下拉选项: 'Search select options',
        没有匹配选项: 'No matching options',
        选择一个选项: 'Choose an option',
        请选择: 'Choose',
        已复制: 'Copied',
        请手动复制: 'Copy manually',
        转盘图片已实时更新: 'Wheel images updated live',
        新奖项已添加到转盘: 'The new prize was added to the wheel',
        奖项已从转盘移除: 'The prize was removed from the wheel',
        读取失败: 'Read failed',
    })

    const TRANSLATION_ENTRIES = Object.freeze(
        Object.entries(TRANSLATIONS).sort((left, right) => right[0].length - left[0].length),
    )

    const DYNAMIC_PATTERNS = Object.freeze([
        [/拖动中：释放越快，旋转越快/g, 'Dragging: a faster release spins faster'],
        [/释放速度：([\d-]+)°\/s，正在自然减速……/g, 'Release speed: $1°/s; coasting naturally…'],
        [/滑动已取消，可以重新操作/g, 'Drag cancelled; ready again'],
        [/结果：/g, 'Result: '],
        [/抽奖失败：/g, 'Draw failed: '],
        [/请至少配置一个奖品后再开始/g, 'Add at least one prize before starting'],
        [/正在等待抽奖结果……/g, 'Waiting for the draw result…'],
        [/已删除第 (\d+) 个奖项/g, 'Removed prize $1'],
        [/已添加第 (\d+) 个奖项/g, 'Added prize $1'],
        [/删除第 (\d+) 个奖项/g, 'Remove prize $1'],
        [
            /请先为第 (\d+) 个奖项设置图片地址或上传图片/g,
            'Set an image URL or upload an image for prize $1 first',
        ],
        [/显示第 (\d+) 个奖项图片/g, 'Show image for prize $1'],
        [/第 (\d+) 个奖项图片地址/g, 'Image URL for prize $1'],
        [/上传第 (\d+) 个奖项图片/g, 'Upload image for prize $1'],
        [/第 (\d+) 个奖项图片/g, 'Prize $1 image '],
        [/第 (\d+) 个奖项/g, 'Prize $1 '],
        [
            /请先为Prize (\d+) 设置图片地址或上传图片/g,
            'Set an image URL or upload an image for prize $1 first',
        ],
        [/请选择有效的图片文件/g, 'Choose a valid image file'],
        [
            /单张图片不能超过 2MB，建议压缩后再上传/g,
            'One image cannot exceed 2MB; compress it before uploading',
        ],
        [/图片不能超过 5 MiB/g, 'The image cannot exceed 5 MiB'],
        [
            /转盘状态已变化，本次图片上传未应用/g,
            'Wheel state changed; this image upload was not applied',
        ],
        [/图片读取失败：/g, 'Image read failed: '],
        [/转盘图片已实时更新/g, 'Wheel images updated live'],
        [/图片已实时更新/g, ' image updated live'],
        [/的全部图片已清除/g, ' images cleared'],
        [/权重必须在 0 到 1000000 之间/g, ' weight must be between 0 and 1,000,000'],
        [/已实时更新/g, ' updated live'],
        [/内容编辑器最多支持 (\d+) 个奖项/g, 'The editor supports at most $1 prizes'],
        [/奖项 (\d+)/g, 'Prize $1'],
        [/已添加Prize (\d+)/g, 'Added prize $1'],
        [/已删除Prize (\d+)/g, 'Removed prize $1'],
        [/默认奖项已恢复/g, 'Default prizes restored'],
        [/已恢复默认奖项/g, 'Restored default prizes'],
        [/恢复失败：/g, 'Restore failed: '],
        [
            /指针已隐藏；中奖角度仍使用十二点方向计算/g,
            'Pointer hidden; results still use the twelve o’clock direction',
        ],
        [/已切换为可配置中心 · /g, 'Switched to configurable center · '],
        [/已切换为/g, 'Switched to '],
        [/指针 · /g, ' pointer · '],
        [
            /中心按钮样式已更新，文字保持垂直居中/g,
            'Center style updated; text remains vertically centered',
        ],
        [/中心文字已隐藏，按钮仍可点击/g, 'Center text hidden; the button remains clickable'],
        [
            /批量奖品图片已更新，资源加载完成后会自动重绘/g,
            'Batch prize images updated; the wheel redraws after loading',
        ],
        [/当前使用纯文字奖品内容/g, 'Prizes currently use text only'],
        [/中心 Logo 已更新，奖品图片保持不变/g, 'Center logo updated; prize images are unchanged'],
        [/中心 Logo 已隐藏，奖品图片保持不变/g, 'Center logo hidden; prize images are unchanged'],
        [/滑动物理已开启：按住扇区并快速甩动/g, 'Drag physics enabled: hold a sector and fling'],
        [/滑动物理已关闭：点击中心开始/g, 'Drag physics disabled: click the center to start'],
        [/声音与庆祝配置已更新/g, 'Sound and celebration settings updated'],
        [/正在试听中奖声音/g, 'Previewing result sound'],
        [/外边框、内边框与扇区布局已更新/g, 'Rings and sector layout updated'],
        [
            /逻辑画布已更新为 ([^，]+)，预览按容器自动适应/g,
            'Logical canvas updated to $1; preview fits its container',
        ],
        [/奖品文字已切换为/g, 'Prize text switched to '],
        [/，超长内容按当前规则处理/g, '; long content follows current overflow rules'],
        [/动画与滑动物理参数已更新/g, 'Animation and drag physics updated'],
        [/性能与资源预算已更新/g, 'Performance and resource budgets updated'],
        [/配置根节点必须是 JSON 对象/g, 'The configuration root must be a JSON object'],
        [/不支持的顶层字段：/g, 'Unsupported top-level field: '],
        [/不安全的配置字段：/g, 'Unsafe configuration field: '],
        [/完整 JSON 配置已应用/g, 'Complete JSON configuration applied'],
        [/配置无效：/g, 'Invalid configuration: '],
        [/已恢复默认配置/g, 'Default configuration restored'],
        [/完整配置已复制/g, 'Complete configuration copied'],
        [/请按 Ctrl\/Cmd \+ C 复制配置/g, 'Press Ctrl/Cmd + C to copy the configuration'],
    ])

    function normalizeLocale(value) {
        const locale = String(value || '').toLowerCase()
        if (locale === 'zh' || locale.startsWith('zh-')) return 'zh-CN'
        return 'en'
    }

    function readStoredLocale() {
        try {
            return typeof localStorage === 'undefined' ? null : localStorage.getItem(STORAGE_KEY)
        } catch (_error) {
            return null
        }
    }

    function resolveLocale(locationObject, navigatorObject) {
        const queryLocale = (() => {
            try {
                return new URLSearchParams(locationObject.search).get('lang')
            } catch (_error) {
                return null
            }
        })()
        if (queryLocale && SUPPORTED_LOCALES.includes(normalizeLocale(queryLocale))) {
            return normalizeLocale(queryLocale)
        }
        const storedLocale = readStoredLocale()
        if (storedLocale && SUPPORTED_LOCALES.includes(storedLocale)) return storedLocale
        return normalizeLocale(navigatorObject && navigatorObject.language)
    }

    function translate(value) {
        let output = String(value == null ? '' : value)
        if (!LOCALIZABLE_PATTERN.test(output)) return output
        DYNAMIC_PATTERNS.forEach(([pattern, replacement]) => {
            output = output.replace(pattern, replacement)
        })
        TRANSLATION_ENTRIES.forEach(([source, target]) => {
            if (output.includes(source)) output = output.split(source).join(target)
        })
        return output
            .replace(/([.!?])。/g, '$1')
            .replace(/([,;])，/g, '$1')
            .replace(/：/g, ': ')
            .replace(/，/g, ', ')
            .replace(/。/g, '.')
            .replace(/；/g, '; ')
            .replace(/、/g, ', ')
            .replace(/？/g, '?')
            .replace(/！/g, '!')
            .replace(/[“”]/g, '"')
    }

    function translateText(value) {
        const source = String(value == null ? '' : value)
        const content = source.trim()
        if (!content) return source
        const normalizedContent = content.replace(/\s+/g, ' ')
        const translatedContent = translate(normalizedContent)
        if (translatedContent === normalizedContent) return translate(source)
        const leadingWhitespace = source.match(/^\s*/)[0]
        const trailingWhitespace = source.match(/\s*$/)[0]
        return `${leadingWhitespace}${translatedContent}${trailingWhitespace}`
    }

    function shouldSkip(node) {
        const parent = node.nodeType === 1 ? node : node.parentElement
        return Boolean(parent && parent.closest('[data-i18n-skip], script, style'))
    }

    function translateElement(element) {
        if (!element || shouldSkip(element)) return
        ;['aria-label', 'placeholder', 'title', 'content'].forEach(attribute => {
            if (!element.hasAttribute(attribute)) return
            const currentValue = element.getAttribute(attribute)
            const translatedValue = translate(currentValue)
            if (translatedValue !== currentValue) element.setAttribute(attribute, translatedValue)
        })
        if (element.matches('input[type="text"], input[type="button"], input[type="submit"]')) {
            const translatedValue = translate(element.value)
            if (translatedValue !== element.value) element.value = translatedValue
        }
    }

    function translateTree(rootNode) {
        if (!rootNode || typeof document === 'undefined') return
        if (rootNode.nodeType === 3 && !shouldSkip(rootNode)) {
            const translatedValue = translateText(rootNode.nodeValue)
            if (translatedValue !== rootNode.nodeValue) rootNode.nodeValue = translatedValue
            return
        }
        if (rootNode.nodeType !== 1 && rootNode.nodeType !== 9 && rootNode.nodeType !== 11) return
        if (rootNode.nodeType === 1) translateElement(rootNode)
        const walker = document.createTreeWalker(
            rootNode,
            typeof NodeFilter === 'undefined' ? 4 : NodeFilter.SHOW_TEXT,
        )
        let node = walker.nextNode()
        while (node) {
            if (!shouldSkip(node)) {
                const translatedValue = translateText(node.nodeValue)
                if (translatedValue !== node.nodeValue) node.nodeValue = translatedValue
            }
            node = walker.nextNode()
        }
        if (rootNode.querySelectorAll) rootNode.querySelectorAll('*').forEach(translateElement)
    }

    function localeUrl(locale) {
        const url = new URL(window.location.href)
        url.searchParams.set('lang', locale)
        return url.href
    }

    function setupLocaleToggle(locale) {
        if (typeof document.querySelector !== 'function') return
        const toggle = document.querySelector('[data-locale-toggle]')
        if (!toggle) return
        const targetLocale = locale === 'en' ? 'zh-CN' : 'en'
        const currentLabel = locale === 'en' ? 'EN' : '中文'
        const targetLabel = targetLocale === 'en' ? 'English' : 'Simplified Chinese'
        const accessibleLabel =
            locale === 'en'
                ? `Language: English. Switch to ${targetLabel}`
                : '语言：简体中文。切换到 English'
        toggle.href = localeUrl(targetLocale)
        toggle.lang = targetLocale
        toggle.setAttribute('hreflang', targetLocale)
        toggle.setAttribute('aria-label', accessibleLabel)
        toggle.setAttribute('title', accessibleLabel)
        const currentLocale = toggle.querySelector('[data-locale-current]')
        if (currentLocale) currentLocale.textContent = currentLabel
        toggle.addEventListener('click', () => {
            try {
                localStorage.setItem(STORAGE_KEY, targetLocale)
            } catch (_error) {
                // A blocked storage API must not prevent explicit locale navigation.
            }
        })
    }

    function startEnglishLocalization() {
        translateTree(document.documentElement)
        if (typeof MutationObserver === 'function' && !api.observer) {
            const observer = new MutationObserver(records => {
                records.forEach(record => {
                    if (record.type === 'characterData') translateTree(record.target)
                    else if (record.type === 'attributes') translateElement(record.target)
                    else record.addedNodes.forEach(translateTree)
                })
            })
            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['aria-label', 'placeholder', 'title', 'content'],
                characterData: true,
                childList: true,
                subtree: true,
            })
            api.observer = observer
        }
    }

    function init() {
        const locale = resolveLocale(window.location, window.navigator)
        api.currentLocale = locale
        document.documentElement.lang = locale
        if (locale === 'en' && typeof document.documentElement.setAttribute === 'function') {
            document.documentElement.setAttribute('data-locale-pending', 'true')
        }
        const startLocalization = () => {
            try {
                setupLocaleToggle(locale)
                if (locale === 'en') startEnglishLocalization()
            } finally {
                if (typeof document.documentElement.removeAttribute === 'function') {
                    document.documentElement.removeAttribute('data-locale-pending')
                }
            }
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', startLocalization, { once: true })
        } else {
            startLocalization()
        }
        return locale
    }

    const api = {
        currentLocale: 'zh-CN',
        init,
        normalizeLocale,
        resolveLocale,
        startEnglishLocalization,
        translate,
        translateText,
        translateTree,
    }

    return api
})
