# 发布清单

[English](../RELEASE.md) · 简体中文

## 首次公开前

- [ ] 确认 `wheel-canvas-js` npm 包名和项目名称可用。
- [ ] 在 `package.json` 填写真实的 `repository`、`homepage` 和 `bugs`。
- [ ] 在本目录的 `SECURITY.md` 与 `CODE_OF_CONDUCT.md` 填写私密联系渠道。
- [ ] 将本目录作为仓库根目录时，确认 `.github/workflows/ci.yml` 已启用。
- [ ] 确认 `LICENSE`、`NOTICE` 的归属说明与实际修改者一致。

## 每个版本

- [ ] 同步更新根目录英文 `CHANGELOG.md` 与本目录中文 `CHANGELOG.md`。
- [ ] 所有公开 API 变更已经同步中英文 README 和配置文档。
- [ ] 中英文工作台入口均完成桌面端与移动端人工检查。

1. 更新 `CHANGELOG.md`。
2. 运行 `npm version patch|minor|major`。
3. 同步 `dist/wheel-canvas-js.umd.js` 顶部和 `VERSION` 常量；`npm test` 会校验运行时与包版本。
4. 运行 `npm ci`、`npm run format:check`、`npm run lint`、`npm test` 和 `npm run pack:check`。
5. 运行 `npx publint` 和 `npx @arethetypeswrong/cli --pack .`，确认 CJS、ESM、旧版 Node 解析与 bundler 类型入口全部通过。
6. 在 Chromium、Firefox、WebKit 或对应真实浏览器人工检查 `index.html`。
7. 检查打包清单不含测试、日志、密钥或 `.tgz` 临时文件。
8. 先用 `npm publish --dry-run` 检查，再由有权限的维护者执行正式发布。
9. 创建签名 tag 和 GitHub Release，并附上 CHANGELOG 对应内容。

发布是外部写操作，本项目不会在测试或 CI 中自动执行 `npm publish`。
