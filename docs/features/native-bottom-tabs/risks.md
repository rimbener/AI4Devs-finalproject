# Risks — native-bottom-tabs

## Technical
- **Unstable API (`expo-router/unstable-native-tabs`).** Isolated to native `(tabs)/_layout.tsx`; pin on SDK upgrade. **Human-accepted (Q1).**
- **NativeTabs web chrome is wrong.** Mitigation: narrow web `WebBottomTabs` + `expo-router/ui`. (Q3/Q4)
- **`TabList` screen discovery.** Mitigation: `<TabList asChild>` on sticky bar View.
- **Runtime navigator swap on web resize across 768.** `WebBottomTabs` ↔ `AppChrome`+`Slot` remount — rare; URL-driven state. **Human-accepted (Q3).**
- **`expo-router` peerDep on `@helsoft/components`.** Storybook mocks `expo-router/ui`.
- **Route restructure.** `(tabs)` groupless; lesson routes remain Stack siblings (no tab bar). **`/upload` removed** — create path is `/pdf-files` + `PdfDocuments`. (s7, s9, s16)
- **Deleting `MobileBar` + `DesktopBar.newLesson`.** Grep importers; keep `AccountMenu`.

## Product
- **Create entry.** New Lesson CTA → PDF files tab (list + Choose PDF). No immersive upload stack screen.
- **Sign-out reachability.** Settings `SignOut` on mobile; `AccountMenu` on wide web (s12–s14).

## Timeline / dependencies
- Depends on shipped `navigation-menus`, PDF list/upload/generate. `expo-router` peer on components for `WebBottomTabs`.
