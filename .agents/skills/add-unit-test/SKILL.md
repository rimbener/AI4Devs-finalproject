---
name: add-unit-test
description: Write or extend the co-located Jest unit test file (`*.test.ts` / `*.test.tsx`) for a DAO, service, hook, reducer, helpers file, or component in this monorepo, following the mocking and coverage conventions in `.agents/rules/tdd.mdc`, `hooks-service-dao.mdc`, `tanstack-query.mdc`, `component-split.mdc`, and `state.mdc`. Use whenever the user gives a filename and asks for its unit test, points out a file has no tests or thin coverage, or says things like "add tests for X", "write unit tests for this hook/service/dao/component", "test this reducer", or "this file needs coverage." Applies to `@helsoft/services`, `@helsoft/supabase-services`, `@helsoft/hooks`, `@helsoft/components`, `@helsoft/activities`, `@helsoft/logging-in-out`, `@helsoft/study-buddy`, and any lib following the same layering. Do NOT use for Playwright `.e2e.js` interaction tests (that's the `storybook-e2e-tests` skill) or for `*.stories.tsx` files (that's `add-storybook-story`).
---

# Add Unit Test

Every layer in this monorepo (`Component → Hook → Service → DAO`, plus reducers/helpers) gets its own
co-located Jest suite, and each layer mocks a *different* thing: a DAO test mocks the transport, a
service test mocks the DAO, a hook test mocks the service, and a component test mocks nothing but its
own hook/context dependencies. Get the mock at the wrong layer and the test either won't compile or
silently exercises code two layers away from what you meant to cover. This skill reads the target
file (and its real neighbors) first, decides which layer it is, and writes tests that match how this
repo already tests that layer — never a generic template.

## Step 1 — Read the file and place it in the architecture

Open the file the user pointed at and work out:

- **Which layer, from its path and name** (table below) — this decides the mocking strategy in Step 2.
- **Whether a test file already exists** (`{same-name}.test.ts(x)` in the same folder). If it does,
  read it in full before touching anything: reuse its fixtures/mocks, and only add the cases it's
  missing — don't regenerate the file from scratch and don't duplicate a case it already covers.
- **Its real dependencies** — what it imports and calls one layer down (the DAO a service calls, the
  service a hook calls, the hook/context a component reads). Mock exactly that, not a guess at what a
  class like this *usually* depends on.

| Path / name pattern | Layer | Lib(s) |
|---|---|---|
| `src/dao/{feature}.dao.ts` | DAO | `@helsoft/services`, `@helsoft/supabase-services` |
| `src/services/{feature}.service.ts` | Service | `@helsoft/services`, `@helsoft/supabase-services` |
| `src/hooks/use-{feature}.ts` | Hook | `@helsoft/hooks` |
| `*.reducer.ts` (co-located, e.g. `use-foo.reducer.ts`) | Reducer | any lib using `state.mdc` |
| `*.helpers.ts` (co-located) | Helpers | any lib |
| `*.tsx` under `/atoms/`, `/molecules/`, `/organisms/`, `/templates/` | Component | `@helsoft/components`, `@helsoft/activities`, `@helsoft/logging-in-out`, `libs/study-buddy` |

If the path doesn't match any row (e.g. a plain utility in `@helsoft/js-utils` / `@helsoft/rn-utils`),
treat it like Helpers — pure input → output, no mocking — unless the file itself imports something
that clearly needs mocking, in which case follow whichever row it most resembles.

## Step 2 — Match the layer's mocking + coverage pattern

Full worked examples for every row live in this repo — read the referenced file if the pattern below
isn't enough on its own (full paths in the reference table at the bottom).

### DAO — mock the transport, not the DAO's own logic

Mock `getSupabase()` (Supabase DAOs) or the concrete transport (`fetch`, `AsyncStorage`, etc.)
(REST/platform-store DAOs) — never mock the DAO under test. Cover: the call is made with exactly the
right arguments/shape, the success return is passed through untransformed, and a transport-level
failure propagates as-is (a DAO does not normalize errors — that's the service's job; don't test for
that here).

```typescript
// Supabase DAO
jest.mock('../supabase/supabase-client', () => ({ getSupabase: jest.fn() }));
import { getSupabase } from '../supabase/supabase-client';
const mockGetSupabase = getSupabase as jest.Mock;
// beforeEach: mockGetSupabase.mockReturnValue({ /* the chain the DAO actually calls */ });

// Platform-store DAO
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn() },
}));
```

### Service — mock the DAO(s), never `fetch`/`getSupabase` directly

```typescript
jest.mock('../dao/generation-preference.dao', () => ({
  GenerationPreferenceDao: { getStoredPreference: jest.fn(), setStoredPreference: jest.fn() },
}));
const dao = GenerationPreferenceDao as jest.Mocked<typeof GenerationPreferenceDao>;
```

Cover every validation branch (rejects/short-circuits *before* calling the DAO on bad input), every
DAO call the service composes, and its actual error-handling contract as written — read the
implementation to see whether it rethrows, swallows to a default, or normalizes to an error code, and
test *that* behavior rather than assuming one.

### Hook — mock the service; wrap in `QueryClientProvider` if it's tanstack-query

Mock `@helsoft/services` or `@helsoft/supabase-services` (whichever the hook imports) — never the DAO
underneath it.

```typescript
jest.mock('@helsoft/supabase-services', () => ({ AuthService: { signOut: jest.fn() } }));

const createWrapper = () => {
  const queryClient = new QueryClient();
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
};

renderHook(() => useSignOut(), { wrapper: createWrapper() });
```

First check whether the hook actually uses `useQuery`/`useMutation` — if it's one of the named
exemptions in `.agents/rules/tanstack-query.mdc` (a stage-machine hook with its own interval/progress
state, a one-shot initializer, a thin imperative wrapper), it still needs `renderHook` but **no**
`QueryClientProvider` wrapper.

For a tanstack-query hook, cover: the initial/idle state; the success path; the pending flag actually
flipping, read via `await waitFor(...)` **after** the triggering `act()` — never a synchronous read
immediately after `act`, because query/mutation state updates land on the next macrotask; the error
path normalized to whatever error-code union the hook returns (not a raw `Error`); `reset` if the hook
exposes one; and referential stability of any returned function across a `rerender()` with unchanged
deps (mutation testing bites hard on an accidentally-unstable callback a memoized consumer relies on).

### Reducer — pure, no mocks

Import the reducer + its initial state directly. One test per action type: given a state and an
action, assert the *exact* resulting state — spread the untouched fields into the expectation so the
assertion also proves what the action *didn't* touch.

```typescript
import { apiKeyFormReducer, initialApiKeyFormState } from './use-api-key-form.reducer';

expect(
  apiKeyFormReducer(initialApiKeyFormState, { type: 'set-api-key', apiKey: 'sk-live' }),
).toEqual({ ...initialApiKeyFormState, apiKey: 'sk-live' });
```

Enumerate every action the reducer's `Action` union declares — a reducer test missing an action is the
easiest gap to spot by just re-reading that union before writing anything.

### Helpers — pure, no mocks, no React

One `describe` per exported function. Cover every branch — each member of a literal union via
`it.each`, boundary/empty inputs (`[]`, `undefined`, the item that isn't found) — not just the one path
that was obviously intended.

```typescript
it.each(['pending', 'paired', undefined] as const)(
  'returns the bare label when state is %s',
  (state) => {
    expect(itemAccessibilityLabel(item, state, 'correct', 'incorrect')).toBe('France');
  },
);
```

### Component (`.tsx`) — RTL, cover states / branches / handlers / a11y

Component tests are written **last** relative to the component itself (`.agents/rules/tdd.mdc` — UI is
impl-first, not TDD). If you're backfilling tests for a component whose `.tsx`/`.stories.tsx` already
exist, that ordering is already satisfied — just write the suite.

Read the same signals the `add-storybook-story` skill reads before writing stories: the `Props` type
(inline, or a sibling `.types.ts` for split components — `component-split.mdc`), a sibling
`use-component-name.ts` (what's actually interactive vs. purely prop-driven), and a sibling
`component-name.context.tsx` (render inside its Provider, not with bare `args`/props —
`state-sharing.mdc`). Then cover:

- **Every UI state** the component models — a `state: 'loading' | 'content' | 'error' | 'empty'`
  discriminant or equivalent — one test per state at minimum.
- **Every conditional branch** — an optional prop (`onDelete?`) present vs. absent, a domain field
  that's legitimately missing.
- **Handler wiring** — `fireEvent.press` / `.changeText` on the right accessible target, asserting the
  callback fired **with the right argument**, not just that it fired at all.
- **Accessibility** — accessible names via `getByRole('button', { name: … })` / `getByLabelText`,
  live-region announcements via `jest.spyOn(AccessibilityInfo, 'announceForAccessibility')` for
  loading/empty/error states (`.agents/rules/pre-slice-checklist.mdc`).
- **Referential stability**, only where the component actually optimizes for it — a `FlatList`
  `keyExtractor` / `renderItem` that must stay identity-stable across a rerender with unchanged deps
  is a real mutation target; don't invent this test for a component with no such memoization.
- Real `Modal` + `fireEvent(node, 'requestClose')` if the component uses one — never
  `jest.mock('react-native')` for `Modal` (the atom-ban / pre-slice-checklist rule).

`libs/components/src/organisms/pdf-document-list/pdf-document-list.test.tsx` hits essentially every
bullet above in one component — read it if you want the fullest worked example.

## Step 3 — Comment sparingly, tag scenarios only if they exist

Some existing tests tag an `it()` with `// @s6 — …`, referencing a scenario in
`docs/features/<name>/gherkin-scenarios.md`. Only add that tag if this file's feature actually has that
doc and the case maps to a real `@s` tag in it. Otherwise, a one-line comment on the *why* (not the
*what*) is enough for a genuinely non-obvious case — most test names should already be self-explanatory
and need no comment at all.

## Step 4 — Verify before handing back

```bash
pnpm --filter <workspace> test -- <test-file> --silent   # e.g. --filter @helsoft/hooks
pnpm --filter <workspace> exec biome check <test-file>
```

Run the file-scoped test, not the whole workspace suite and never `yarn test-ci`
(`.agents/rules/pre-slice-checklist.mdc`) — the full suite is a slice-gate concern, not this skill's.
Fix anything Biome or the type checker flags (import order, unused vars) before considering the test
done.

If a new test passes on its very first run, be suspicious of it: momentarily break the implementation
it's supposed to cover (comment out a line, flip a condition), confirm the test actually goes red, then
restore the implementation. A test that can't fail proves nothing (`.agents/rules/tdd.mdc`).

## Reference: layer → example test file in this repo

| Layer | Example |
|---|---|
| DAO (Supabase) | `libs/supabase-services/src/dao/lesson-generation.dao.test.ts` |
| DAO (platform store) | `libs/services/src/dao/generation-preference.dao.test.ts` |
| Service | `libs/services/src/services/generation-preference.service.test.ts` |
| Hook (tanstack-query) | `libs/hooks/src/hooks/use-sign-out.test.ts` |
| Reducer | `libs/components/src/organisms/api-key-form/use-api-key-form.reducer.test.ts` |
| Helpers | `libs/activities/src/organisms/matching/matching.helpers.test.ts` |
| Component | `libs/components/src/organisms/pdf-document-list/pdf-document-list.test.tsx` |
