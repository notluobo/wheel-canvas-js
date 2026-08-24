# 编码规范

[English](../CODING_STYLE.md) · 简体中文

用户可见内容的双语同步规则见 [`LOCALIZATION.md`](./LOCALIZATION.md)。

本规范适用于 WheelCanvasJS 的源码、测试、类型声明、示例和工程配置。自动化检查是合并代码的必要条件。

## 基础格式

- 文件统一使用 UTF-8、LF 行尾，并保留文件末尾换行。
- 缩进统一使用 4 个空格，禁止 Tab。
- JavaScript 使用单引号，不写分号，多行结构保留尾随逗号。
- 建议每行不超过 100 个字符；超出时由 Prettier 自动换行。
- 禁止行尾空白。
- `package-lock.json` 是 npm 自动生成文件，保持 npm 原生的 2 空格格式，不手工修改。

格式由 `.editorconfig` 和 Prettier 统一执行：

```powershell
npm run format
npm run format:check
```

## JavaScript 质量要求

- 不使用未声明变量、无效变量或隐式全局变量。
- 不使用 `eval`、动态拼接脚本或未经约束的 DOM HTML 注入。
- 所有异步操作必须考虑失败、超时、销毁和竞态。
- 动画状态变化必须保持 `state`、目标奖品、可见指针和回调结果一致。
- 资源监听器、定时器、观察器、图片请求和缓存必须能在 `destroy()` 时释放。
- 用户回调抛错或 Promise 拒绝时，不得让实例停留在虚假的运行状态。
- 新增运行时依赖前必须说明必要性、体积、安全和浏览器兼容影响。

ESLint 负责静态缺陷检查：

```powershell
npm run lint
```

不要通过大范围关闭规则来绕过错误。确实存在浏览器、AMD 或测试运行时全局时，应在对应文件中明确声明。

## API 与类型

- 公开 API 变更必须同步更新 UMD、CJS、ESM 和 TypeScript 契约。
- 同步更新 `dist/wheel-canvas-js.d.ts`、CJS/ESM 声明入口、README、配置文档和 CHANGELOG。
- 不暴露无法长期维护的内部状态。
- 兼容性改变必须在发布前说明迁移方式。

## 测试要求

每次修复必须增加能在修复前失败、修复后通过的回归测试。至少覆盖：

- 正常流程；
- 空值、非法值、极端数值和浮点边界；
- 异步失败、超时、销毁和竞态；
- 旋转中的配置变化；
- CJS、ESM、浏览器全局和 TypeScript 消费入口。

提交前执行：

```powershell
npm test
npm run pack:check
```

所有检查必须零错误、零警告通过。真实 Canvas 视觉改动还需要浏览器人工或截图回归验证。
