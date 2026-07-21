# @helsoft/rn-utils

React Native-specific TypeScript utilities shared across mobile and web targets.

## Allowed

- React Native APIs such as `Platform`, `AccessibilityInfo`, `Dimensions`, and `PixelRatio`.
- Platform-aware utility functions and adapters in `.ts` files.
- Platform-specific files using React Native suffixes when behavior differs.
- Kebab-case files under `src/`, exported from `src/index.ts`.

## Forbidden

- React components, hooks, JSX, or render logic.
- Expo-only, browser DOM, Node.js, Supabase, or app-specific code.
- Services, DAOs, storage, networking, analytics, or business logic.
- Runtime dependencies unless explicitly approved and React Native-specific.

Keep APIs small, framework-independent beyond React Native, and safe across supported targets.
