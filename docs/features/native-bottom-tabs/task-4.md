---
id: task-4
title: Desktop chrome — My lessons + PDF files; slim AppChrome
slice: 2
scenarios: [s3, s11, s12]
status: done
paths:
  [
    libs/components/src/organisms/desktop-bar/desktop-bar.tsx,
    libs/components/src/organisms/desktop-bar/desktop-bar.types.ts,
    libs/components/src/organisms/desktop-bar/desktop-bar.stories.tsx,
    libs/components/src/organisms/desktop-bar/desktop-bar.test.tsx,
    libs/study-buddy/src/components/app-chrome/app-chrome.tsx,
    libs/study-buddy/src/components/app-chrome/use-app-chrome.ts,
    libs/study-buddy/src/components/app-chrome/app-chrome.test.tsx,
    libs/study-buddy/src/components/app-chrome/use-app-chrome.test.ts,
  ]
---

## Goal
1. **`DesktopBar`** — `home` + **`pdfFiles`** nav items; no New lesson / Settings bar items.
2. **`AppChrome`** desktop-only — wires both destinations; `AccountMenu` keeps Settings + Sign out.

## Done criteria
- [x] DesktopBar shows My lessons + My PDF files; no New lesson / Settings (s3)
- [x] AppChrome navigates `/` and `/pdf-files`; marks active from pathname
- [x] Settings via AccountMenu only (s11); Sign out via AccountMenu (s12)
- [x] stories / unit / e2e updated; lint / types / tests green

## Notes
- `nav.newLesson` remains the My lessons CTA label (task-3), not a bar item.
