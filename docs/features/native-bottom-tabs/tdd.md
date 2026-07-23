# TDD log — native-bottom-tabs

## @s → test map

| @s | test file | test name |
|---|---|---|
| @s1 | native-tabs-triggers.test.ts + tabs-layout.test.ts | 3 triggers index+pdf-files+settings; native layout imports contract |
| @s2 | tabs-layout-web.test.tsx + web-bottom-tabs.test.tsx | mobile WebBottomTabs; no AppChrome; no mobile-top/bottom-bar |
| @s3 | desktop-bar.test.tsx / app-chrome.test.tsx / tabs-layout-web.test.tsx | My lessons + PDF files; no New lesson/Settings bar items |
| @s4 | native-tabs-triggers.test.ts | three triggers with hrefs |
| @s5 | tabs-layout.native.test.tsx | Trigger accessibilityState.selected on NativeTabs |
| @s6 | saved-lessons.test.tsx | New Lesson CTA content+empty → push('/pdf-files') |
| @s7 | pdf-files.tsx + pdf-documents.* + tabs-layout.test.ts | no upload route; PdfDocuments on pdf-files |
| @s8 | saved-lessons + native-tabs-triggers | CTA → /pdf-files (PDF files tab) |
| @s9 | tabs-layout.test.ts | lesson routes Stack siblings |
| @s10 | native-tabs-triggers.test.ts + web-bottom-tab-button.test.tsx | nav keys + glyphs incl. myPdfFiles |
| @s11 | app-chrome.test.tsx | Settings via AccountMenu; not a bar item |
| @s12 | app-chrome.test.tsx | Sign out via AccountMenu |
| @s13 | settings-sign-out.test.tsx | mobile SignOut |
| @s14 | settings-sign-out.test.tsx | desktop null |
| @s15 | tabs-layout-web.test.tsx | breakpoint → WebBottomTabs or AppChrome+Slot |
| @s16 | tabs-layout.test.ts + app-layout-settings.test.ts | no upload; pdf-files tab; unstable_settings (tabs) |
| @s17 | mobile-bar-retired.test.ts | MobileBar gone; AccountMenu remains |
| web UI | web-bottom-tabs.e2e.js / desktop-bar.e2e.js | Storybook Playwright |

## Red→Green cycles

### Slices 1–3 + full review + mutation
- See git history through DoD PASS / `pr_ready`

### Post-DoD follow-ups (current)
- Narrow web: `WebBottomTabs` in `@helsoft/components`; `TabList asChild`
- Third tab: `pdf-files` + `nav.myPdfFiles`; DesktopBar `pdfFiles` prop
- `PdfDocuments` prop-less (router + profile + NewLessonDialog)
- Retire `/upload` Stack screen; New Lesson CTA → `/pdf-files`

## Gate
- components / study-buddy / app layout tests green; check-types clean
