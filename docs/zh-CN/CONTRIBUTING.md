# 参与贡献

[English](../../.github/CONTRIBUTING.md) · 简体中文

感谢参与 WheelCanvasJS。提交改动前请先搜索已有 issue，并让一个 pull request 只解决一个主题。

## 开发环境

需要 Node.js 20.19 或更高版本和 npm：

```powershell
npm install
npm test
npm run pack:check
```

## 代码约定

- 源码、测试、类型和配置统一使用 UTF-8、LF 与 4 个空格缩进，详细规则见 [`CODING_STYLE.md`](./CODING_STYLE.md)。
- 提交前运行 `npm run format:check` 和 `npm run lint`，禁止通过大范围关闭规则绕过错误。
- 保持零运行时依赖；新增依赖前必须说明必要性和包体积影响。
- 不要直接编辑压缩文件；`dist/wheel-canvas-js.umd.js` 就是主源码。
- 新增或修改公开 API 时，同步更新 `dist/wheel-canvas-js.d.ts`、中英文 README、配置文档和 CHANGELOG。
- 用户可见文字遵循 [`LOCALIZATION.md`](./LOCALIZATION.md)，中英文必须在同一个 Pull Request 更新。
- 动画、权重、图片缓存或生命周期修改必须带回归测试。
- 保持 UMD、CJS、ESM 和浏览器全局入口导出一致。
- 不提交 `.tgz`、日志、编辑器配置或真实密钥。

## Pull request 检查

提交前确认：

1. `npm test` 通过。
2. `npm run pack:check` 的文件列表只包含预期发布文件。
3. 在真实浏览器打开 `index.html`，检查鼠标、键盘、等分扇区和图形权重。
4. 用户可见变更已经写入根目录 `CHANGELOG.md` 和本目录 `CHANGELOG.md`。
5. 没有在转盘前端加入可被当作可信抽奖结果的安全承诺。

贡献默认按项目的 Apache-2.0 许可证提交。
