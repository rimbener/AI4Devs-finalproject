# Standards Review — activity-image-sizing

Verdict: APPROVED

Round 2 — re-review of previously open findings only. CI green @ 481cdf4ec
(scoped activities/components/localization lint, types, tests).

## Security

N/A — UI-only presentation diff; no auth, trust-boundary input, storage, logging,
dependency, deep-link, WebView, or network-request construction changes.

## Accessibility

No open findings.

### Previously open — resolved

- **Touch target (WCAG 2.5.8)** — expand
  (`slide-image.tsx:49`) and close (`image-lightbox.tsx:58`) use
  `layout.touchTarget` / `theme.layout.touchTarget` (48). Asserted in
  `slide-image.test.tsx` and `image-lightbox.test.tsx`.
- **Non-text contrast (WCAG 1.4.11)** — both controls use `variant="filled"`
  (opaque `primary` fill + `onPrimary` icon), not transparent `standard` over
  image pixels (`slide-image.tsx:48`, `image-lightbox.tsx:57`).
- **Dialog name / focus (WCAG 2.4.3, 4.1.2)** — lightbox content has
  `role="dialog"` + `accessibilityLabel={dialogLabel}`
  (`image-lightbox.tsx:40-41`); focus moves in on `onShow`
  (`image-lightbox.tsx:20-23,33`); expand control restores focus on close
  (`slide-image.tsx:22-27`). Covered by tests.
