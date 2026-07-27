# Splash screen shows the AI Study Buddy logomark until auth state resolves

**As a** student opening the app
**I want** to see the AI Study Buddy logomark on its native Royal Blue tile as the very first thing on launch, staying visible until the app knows whether I'm logged in
**so that** I never see a blank or generic loading screen, and I land directly on my lessons (if already logged in) or the login screen (if not) with no flash of the wrong screen in between

## Context

- `apps/app-study-buddy/app.json` already configures the `expo-splash-screen` config plugin (native splash), currently pointing at the placeholder `assets/images/splash-icon.png` with `backgroundColor: "#208AEF"` and `imageWidth: 76`. This story replaces that image + background with the brand logomark treatment.
- DESIGN.md already specifies this: "Full-bleed Royal Blue is reserved for hero/focus moments (generating screen, splash), where the logomark sits on its native navy tile." Royal Blue is `#002C5D` (`libs/components/src/theme/colors.ts`).
- The loading/routing gate already exists and needs no logic changes — `apps/app-study-buddy/src/app/_layout.tsx`:
  - Calls `SplashScreen.preventAutoHideAsync()` at module scope.
  - `RootValidation()` reads `useProfile()` (`profile`, `isLoading`, `error`) and `useFonts()`. While `isLoading` (profile/session still loading) or fonts aren't loaded, it renders `null` — the native splash stays on screen.
  - Once loading finishes, it calls `SplashScreen.hideAsync()` and renders `RootNavigator({ guard: !!profile })`, which uses `Stack.Protected` to route to `(app)` when a profile exists (logged in) or `(auth)`/`login` when it doesn't (not logged in).
  - This already matches Expo's recommended pattern (prevent-auto-hide → hide only once the app is truly ready) — see https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/.
- Treatment is the same in light and dark system mode — no separate dark-mode splash variant (`expo-splash-screen`'s `dark` config key is not used).
- Source assets (`apps/app-study-buddy/assets/`, currently untracked):
  - `logomark.png` (880×840) — the source mark, used to derive the splash image.
  - `brand-logo.png` (404×384) — currently corrupted (valid-looking PNG header per `file`/`sips`, but fails to decode/render as an image). Not referenced anywhere in code yet.
  - `logo-full.png` (2000×2000, logomark + "AI Study Buddy" wordmark on Royal Blue) — already valid and visually consistent with `logomark.png`. Out of scope; leave untouched.
- No `supabase/` schema, RLS, or edge-function changes are needed — this is a frontend/app-only story.

## Acceptance criteria

- `app.json`'s `expo-splash-screen` plugin config uses a splash-ready image derived from `logomark.png` (replacing `assets/images/splash-icon.png`) and `backgroundColor: "#002C5D"` (Royal Blue), applied identically regardless of system light/dark mode.
- The splash image is sized so the logomark is clearly legible without spanning the full screen width (a moderate, centered mark on the full-bleed Royal Blue background — not a tiny icon, not edge-to-edge).
- On launch, the logomark splash is the first thing shown — no blank/white/default screen before it appears, on iOS, Android, and web.
- If the student is already logged in (a session + profile resolve successfully), the splash remains visible until both are loaded, then the app navigates directly to the logged-in experience (`(app)`) — no flash of the login screen first.
- If the student is not logged in (no session, or profile resolution completes with no profile), the splash remains visible only until that's determined, then the app navigates to the login screen (`(auth)`) — it does not wait further once that outcome is known.
- If profile loading errors out, the existing `ErrorScreen` behavior is preserved (splash hides, error screen with retry shows) — unchanged by this story.
- `brand-logo.png` is replaced with a valid, non-corrupted PNG derived from `logomark.png`, at its existing 404×384 dimensions, that renders correctly.
- `logo-full.png` is left untouched.

## Notes

- Expo SDK 57 splash screen reference: https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/
- Design reference: `.agents/DESIGN.md` (Colors / Backgrounds sections — Royal Blue as the logomark's native tile).
- No analytics event or feature flag identified as needed for this change.
