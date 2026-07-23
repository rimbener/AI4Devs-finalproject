# Engineering review — native-bottom-tabs (round 2)

**Verdict:** APPROVED  
**CI:** green @ `c6b3b3619b467a1b44cad12e579a7b25e076de1b`  
**Base:** `feature-entrega3-HernanLaura`

## Lenses N/A

- **performance:** UI/nav chrome only (3-tab `NativeTabs` / `WebBottomTabs`, breakpoint switch, no lists/queries). No findings.
- **security:** No new service/DAO/network/storage trust boundary; SignOut reposition only; no secrets. No findings. (OWASP: N/A)

## Prior r1 findings — verified resolved

1. **major [code]** Dead `isNativeTabSelected` removed. `@s5` → `tabs-layout.native.test.tsx`.
2. **major [code]** `unstable_settings.initialRouteName: '(tabs)'` asserted.
3. **minor [code]** Shared `NATIVE_TAB_TRIGGERS` (now 3 tabs incl. `pdf-files`); native + web consume it.
4. **minor [arch]** Structure suite in `apps/app-study-buddy/src/__tests__/…`.

## Findings

None.

## Post-review follow-up (docs/code aligned)
`WebBottomTabs` in `@helsoft/components`; DesktopBar `pdfFiles`; retire `/upload`; `PdfDocuments` prop-less on `(tabs)/pdf-files`.
