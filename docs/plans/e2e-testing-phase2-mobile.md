# E2E testing for app-study-buddy — Phase 2: Mobile (Maestro, Android + iOS)

> This is Phase 2 of a 2-phase plan. Phase 1 (Playwright, web) lives in a separate file: `e2e-testing-phase1-web.md`. This phase is independent and can start any time after Phase 1 lands — it reuses everything Phase 1 instruments (testIDs on `Button`/`IconButton`/`AnswerOption` and their call sites, the fixture PDF) without any changes, since `testID` maps directly to the native accessibility id Maestro reads on both iOS and Android.

## Context

Phase 1 stood up a Playwright golden-path suite for `apps/app-study-buddy` on web (login → upload PDF → generate lesson → play a mixed instructional/activity lesson → results), and — as a prerequisite — added `testID` props to the shared atoms/components the whole golden path is built from (`libs/components/src/atoms/button/button.tsx`, `icon-button.tsx`, `libs/components/src/molecules/answer-option/answer-option.tsx`, plus call sites in `login-form.tsx`, `pdf-upload-panel.tsx`, `pdf-document-list-item.tsx`, `lesson-generation-panel-content.tsx`, `results-summary.tsx`, `lesson-player-navigator.tsx`, `multiple-choice.tsx`, `flashcard.tsx`).

This phase extends the same golden path to iOS and Android using **Maestro** — Expo's own recommended E2E tool for RN apps (YAML flows, works against local `expo run:ios`/`expo run:android` dev builds, no EAS needed) — not Detox (its Expo support is community-maintained, lags SDK/New Architecture releases, and needs a release-mode native build incompatible with Expo's managed flow).

Decisions carried over from Phase 1 (unchanged): local-only (no CI), testID-based selectors, golden path only (no sign-up), seeded `test@paid.com`/`test123` account from `supabase/seed.sql`.

**Prerequisite check before starting this phase**: confirm Phase 1 has actually landed (testIDs present on the components listed above, fixture PDF exists at `apps/app-study-buddy/tests/fixtures/golden-path.pdf`). If Phase 1 hasn't merged yet, this phase's flows will fail to locate elements — do not duplicate the testID work here.

## Implementation order (vertical slices)

### Slice 1 — Maestro Android golden path (do first — deterministic file-picker story)

- Flows live at `apps/app-study-buddy/e2e/maestro/flows/golden-path.yaml` (scoped inside the app, matching this repo's per-workspace test ownership — not a root `.maestro/`). Fixture PDF reused as-is from `apps/app-study-buddy/tests/fixtures/golden-path.pdf` (Phase 1).
- package.json scripts: `test:e2e:android:build` (`expo run:android`, builds a local debug dev-client against the booted emulator — no EAS/`eas.json` involved), `test:e2e:android` (`maestro test e2e/maestro/flows/golden-path.yaml`).
- File-picker strategy: before the run, `adb push apps/app-study-buddy/tests/fixtures/golden-path.pdf /sdcard/Download/golden-path.pdf`. `expo-document-picker` on Android opens the Storage Access Framework picker, which surfaces `/sdcard/Download` reliably — drive it with `tapOn: "Downloads"` → `tapOn: "golden-path.pdf"`. Wrap the `adb push` in a small `e2e/maestro/seed-android.sh` invoked before `maestro test`.
- Flow steps mirror the Playwright golden path using Maestro's `tapOn: id: "<testID>"` / `inputText` / `assertVisible` primitives, with `extendedWaitUntil` around the ~4s-interval generation stepper:
  1. `launchApp` (clears state).
  2. Tap `login-form-email`, input `test@paid.com`; tap `login-form-password`, input `test123`; tap `login-form-submit`.
  3. `assertVisible` on the post-login PDF list screen.
  4. Tap `pdf-upload-panel-choose-file`; navigate the SAF picker to Downloads → the pushed fixture.
  5. `assertVisible` on extraction Content state; tap `pdf-upload-panel-continue`.
  6. Tap the row's Generate action; `extendedWaitUntil` through the stepper; tap `lesson-generation-panel-open-in-player`.
  7. `assertVisible: id: "lesson-player"`; drive one Flashcard slide (reveal → self-mark) and one MultipleChoice slide (select → submit → assert result) via `lesson-player-navigator-next`.
  8. Reach results; tap `results-summary-back-home`; assert return to the list.

### Slice 2 — Maestro iOS golden path (highest risk — needs a short spike first)

- Same flow file reused where possible; iOS-specific step only for the file picker.
- **Open risk, called out explicitly**: unlike Android's SAF, there's no reliable *scriptable* way found yet to seed a PDF into a location the iOS document picker (`UIDocumentPickerViewController`, browses Files/iCloud/On My iPhone) will show. `xcrun simctl addmedia` only reaches the Photos app, not Files.
- Before writing the iOS flow, spend a short spike (30–60 min, booted simulator) checking whether a file dragged/copied into the simulator's Files "On My iPhone" location surfaces under the picker's "Recents", and whether that can be done non-interactively (e.g. via a documented `xcrun simctl` file-copy path into the sandboxed Files container, or another supported mechanism — verify against the actual Xcode version in use rather than assuming).
- If no reliable non-interactive path exists: **scope iOS out of the automated upload step** (documented gap in `E2E_TESTS.md`) rather than block the rest of this phase. In that case, the fallback is to still exercise everything *after* the upload (generation, player, results) via a manually-uploaded or fixture-preloaded lesson if one can be seeded directly into Supabase for the test account, or to explicitly mark iOS coverage as partial until a future spike resolves it.
- package.json scripts: `test:e2e:ios:build` (`expo run:ios`, local debug dev-client build against the booted simulator), `test:e2e:ios` (`maestro test e2e/maestro/flows/golden-path.yaml`).

### Slice 3 — Local Supabase dependency (mobile-specific notes)

- Same prerequisite as Phase 1 (`npx supabase start`, seeded `test@paid.com`/`test123`) — call out in docs that Android/iOS runs share the same backend/reset requirement as the web suite, so running all three suites back-to-back without a reset in between will accumulate rows exactly as noted in Phase 1's Slice 3.
- Document `npx supabase db reset` before each mobile run too, for the same locator-ambiguity reason.

### Slice 4 — Documentation

- Extend the `E2E_TESTS.md` "App-level E2E" section (added in Phase 1) with a Maestro/mobile subsection: flow location, Android setup (`adb push` + emulator boot), iOS setup and its documented gap/status, and the shared Supabase prerequisite.
- Extend `.agents/skills/app-e2e-tests/SKILL.md` and `.agents/rules/app-e2e.mdc` (added in Phase 1) with the Maestro conventions (YAML flow structure, `id:` selector syntax, platform-specific file-picker handling) — extend, don't fork a second doc set.

**No `turbo.json` task added** — matches existing precedent of invoking e2e directly via `pnpm --filter app-study-buddy test:e2e:android` / `test:e2e:ios`.

## Critical files

- `apps/app-study-buddy/e2e/maestro/flows/golden-path.yaml`, `apps/app-study-buddy/e2e/maestro/seed-android.sh` (new)
- `apps/app-study-buddy/package.json` (new mobile scripts)
- `apps/app-study-buddy/tests/fixtures/golden-path.pdf` (reused from Phase 1, not recreated)
- `E2E_TESTS.md`, `.agents/skills/app-e2e-tests/SKILL.md`, `.agents/rules/app-e2e.mdc` (all extended from Phase 1)
- `supabase/seed.sql` (seeded test account reference)

## Verification

1. Emulator booted: `pnpm --filter app-study-buddy test:e2e:android:build` then `test:e2e:android` runs the Android golden path green.
2. Simulator booted: same for iOS — or documented as a known gap if the file-picker spike doesn't pan out.
3. Manual sanity: run each suite twice in a row post-`db reset` to confirm no locator ambiguity from accumulated rows, matching Phase 1's verification.
