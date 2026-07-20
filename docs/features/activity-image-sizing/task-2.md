---
id: task-2
title: Add slideImage expand/close i18n keys in all locales
slice: 2
scenarios: [s12]
status: todo
paths:
  - libs/localization/src/resources/en.ts
  - libs/localization/src/resources/es.ts
  - libs/localization/src/resources/pt.ts
  - libs/localization/src/resources/de.ts
  - libs/localization/src/coverage/player-locale-parity.test.ts
---

## Goal
Add `player.slideImage.expand` and `player.slideImage.close` to the `player` namespace in all four bundles (en/es/pt/de) as real translations, and extend the player locale-parity test so es/pt/de are asserted to differ from the English base.

## Done criteria
- [ ] Scenario s12 covered (parity test lists `player.slideImage.expand` + `player.slideImage.close`)
- [ ] Keys present in en, es, pt, de under `translation.player.slideImage`
- [ ] es/pt/de values are real translations, not English stubs
- [ ] `player-locale-parity.test.ts` `PLAYER_KEYS` extended with the two new keys
- [ ] `pnpm check-types` green (bundles stay key-aligned with `TranslationResource`)
- [ ] `pnpm lint` + `pnpm test` green

## Notes
- Sits under existing `player` namespace (`libs/localization/src/resources/en.ts`).
- en copy suggestion: `expand: 'View image fullscreen'`, `close: 'Close image'` (final copy at implementer discretion).
