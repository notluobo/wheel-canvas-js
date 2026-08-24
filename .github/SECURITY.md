# Security policy

English · [简体中文](../docs/zh-CN/SECURITY.md)

## Supported versions

Security fixes are applied to the latest released version. Security advisories and changelog entries will identify affected versions when a fix is not yet public.

## Reporting a vulnerability

Do not disclose an unpatched vulnerability in a public issue. Report it through [GitHub Private Vulnerability Reporting](https://github.com/notluobo/wheel-canvas-js/security/advisories/new). The repository owner must keep this feature enabled before publishing.

This repository intentionally does not invent a maintainer email. If the private form is unavailable, open a detail-free issue asking the maintainers to enable private reporting; do not include vulnerability details in that issue.

Include the affected version, reproducible steps, impact, and any known mitigation. Coordinate disclosure timing with maintainers after acknowledgment.

## Prize-draw security boundary

WheelCanvasJS is a rendering and animation library, not a trusted random-number, inventory, identity, or payment system. When prizes carry value, server-side code must handle authentication, idempotency, inventory changes, audit records, and result selection. The browser should receive only an authorized result index and call `stop(index)`.
