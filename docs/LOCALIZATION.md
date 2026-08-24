# Localization policy

English · [简体中文](./zh-CN/LOCALIZATION.md)

## Locale structure

- `README.md` is the canonical Simplified Chinese repository entry shown by GitHub.
- `README.en.md` is the English repository entry.
- English long-form docs keep their stable names under `docs/`.
- Simplified Chinese counterparts live in `docs/zh-CN/` and use the same file names as the English documents.
- The workbench uses one DOM and one JavaScript implementation. Locale data lives in `demo/i18n.js`, so localization does not enter the core UMD/ESM bundle.
- `?lang=en` and `?lang=zh-CN` are stable workbench links. Without a query, the page uses the last explicit choice and then the browser language.

## Source-of-truth rules

- Runtime identifiers, option values, file names, npm commands, error names, and code syntax remain English and must not be translated.
- Prose, labels, descriptions, accessibility names, status messages, and tutorial text must be localized.
- English is the semantic source for new public contracts. The Simplified Chinese version must ship in the same pull request.
- A translation may improve natural wording but must not add, remove, or change behavior.
- Code examples may localize visible prize labels, but their API structure must remain identical.

## Pull-request checklist

- [ ] Both README entries link to each other near the title.
- [ ] Public API sections exist in both configuration references.
- [ ] Both changelogs contain the release version.
- [ ] New workbench strings have an English translation.
- [ ] Accessibility labels and dynamic error/status messages are translated.
- [ ] `npm test` passes the localization contract.
- [ ] Both locales are manually checked at mobile and desktop widths.

## Adding another locale

Use a BCP 47 locale tag, add a visible language entry, provide translated README/docs, extend the workbench locale catalog, and add parity tests. Do not fork core behavior by locale.
