# Release checklist

English · [简体中文](./zh-CN/RELEASE.md)

## Before the first public release

- [ ] Fill real `repository`, `homepage`, and `bugs` values in `package.json`.
- [ ] Configure a private vulnerability-reporting channel in both security-policy languages.
- [ ] Replace conduct contacts with a real maintainer address or reporting form.
- [ ] Confirm the copyright and modification statements in `NOTICE`.
- [ ] Confirm npm ownership and package-name availability while authenticated.
- [ ] Verify English and Simplified Chinese landing links in GitHub and the workbench.

## Every release

- [ ] Update [`CHANGELOG.md`](../CHANGELOG.md) and [`zh-CN/CHANGELOG.md`](./zh-CN/CHANGELOG.md) with the same version and sections.
- [ ] Update English and Simplified Chinese docs for every public API change.
- [ ] Run `npm ci` from a clean checkout.
- [ ] Run `npm test`.
- [ ] Run `npm run pack:check` and inspect the file list.
- [ ] Run `npx publint`.
- [ ] Run `npx @arethetypeswrong/cli --pack .`.
- [ ] Run `npm publish --dry-run`.
- [ ] Inspect the workbench in Chromium, Firefox, and WebKit at desktop and mobile widths.
- [ ] Test keyboard use, touch cancellation, reduced motion, CJK and Latin typography, images, DPR 1/2/3, and create/destroy loops.
- [ ] Confirm there are no secrets, logs, `.tgz` files, test fixtures, or `node_modules` in the package.
- [ ] Confirm high-value examples use a trusted server result.
