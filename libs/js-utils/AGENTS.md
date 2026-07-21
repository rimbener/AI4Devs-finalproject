# @helsoft/js-utils

Pure TypeScript utilities shared across runtimes.

## Allowed

- Platform-agnostic TypeScript in `.ts` files.
- Deterministic utility functions and data transformations.
- Kebab-case files under `src/`, exported from `src/index.ts`.

## Forbidden

- React, React Native, Expo, Supabase, or framework-specific code.
- Browser, DOM, Node.js, mobile, OS, or other platform APIs/globals.
- Hooks, components, services, DAOs, storage, networking, or UI code.
- JSX.
- Runtime dependencies unless explicitly approved and runtime-agnostic.

Keep production code portable, side-effect-free, and independent of platform setup.
