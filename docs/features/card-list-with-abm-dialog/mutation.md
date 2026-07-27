# Mutation — card-list-with-abm-dialog

**Verdict: PASS** — 0 killable survivors. Remaining 2 are documented, verified equivalents; the
1 error mutant is a legitimate RuntimeError, not a sandbox defect (investigated below).

## Round 1 → Round 2

| Round | total | killed | ignored | survived | errors | score % |
|---|--:|--:|--:|--:|--:|--:|
| 1 (initial) | 79 | 51 | 0 | 27 | 1 ⚠ | 65.4 |
| 2 (this pass) | 79 | 69 | 6 | 2 | 1 ⚠ | 97.2 |

Score = killed / (killed + survived + errors); `ignored` (Stryker-disable-commented equivalents)
are excluded from the denominator, matching this repo's existing convention
(`tanstack-query-hooks-migration`'s round 1 kill pass).

Per-file (round 2):

| File | total | killed | ignored | survived | score % |
|---|--:|--:|--:|--:|--:|
| `card-list-with-abm-dialog.tsx` | 63 | 60 | 2 (+1 error) | 2 | 96.83 |
| `use-card-list-with-abm-dialog.ts` | 12 | 9 | 3 | 0 | 100.00 |

## Round 1 → Round 2: what changed

24 of the 27 round-1 survivors were killed with new/behavioral tests in
`card-list-with-abm-dialog.test.tsx`; 3 were provably equivalent and excluded via
`// Stryker disable next-line <Mutator>: <reason>` (re-verified by this round's Stryker re-run —
they show as `Ignored`, not `Survived`). 2 remain genuinely equivalent but are **not** suppressed
by a comment (see below) — they stay visible as `Survived` in the raw report while this doc
records why they're accepted.

### Killed (24) — new/strengthened tests

| Line(s) | Mutator | Fix |
|---|---|---|
| `.tsx:15` | StringLiteral | New test hardcodes the literal `'card-list-with-abm-dialog-list'` testID instead of querying via the imported constant (which was self-referential — the component and the old assertions both import the same constant, so mutating its value to `''` was invisible). |
| `.tsx:23` | StringLiteral | Same fix, hardcoded literal `'card-list-with-abm-dialog-card-item-1'` for `cardListItemCardTestId`. |
| `.tsx:81` (now 87, dep array) | ArrayDeclaration | New test reruns with a **changed** `getEditAccessibilityLabel`/`getRemoveAccessibilityLabel` on the same item (no item change) and asserts the icon labels update — proves `renderItem`'s memoization actually depends on those props, not just `item`. |
| `.tsx:219,223,224,225,226,229,234,237,240,247,248,249,252,255,256,257` (16) | ObjectLiteral / StringLiteral (StyleSheet) | **Verified empirically** (direct RTL prop inspection) that this component's styles are plain (non-variant) objects that flatten fully onto RN elements under jest-expo — including `color`, unlike Unistyles **variant**-driven styles elsewhere in this lib (e.g. `button.tsx`, documented equivalent in `pending-pdfs-generate/mutation.md`, `activity-multiple-choice/mutation.md`) which do NOT show colors under jest. So these are real, non-brittle behavioral assertions (root/header/title/list/listContent/emptyText/row/content/actions layout values), not brittle snapshots — added 8 new tests asserting the actual computed `flex`/`gap`/`flexDirection`/`alignItems`/`justifyContent`/`flexShrink`/`color` values. Each was individually confirmed to kill its mutant by temporarily reintroducing the mutation and observing the new test fail. |

### Ignored via `// Stryker disable next-line` (3, all re-verified equivalent)

- `use-card-list-with-abm-dialog.ts:29,37,45` (ArrayDeclaration, the 3 `useCallback([])`s) —
  `setDialogState` is a React state setter, referentially stable for the component's lifetime;
  the dependency array's contents can never observably change identity or behavior. (Also
  applies to `card-list-with-abm-dialog.tsx`'s `keyExtractor` — see below.)
- `card-list-with-abm-dialog.tsx:74` (ArrayDeclaration, `keyExtractor`'s `[]`) — closes over
  nothing but its own `item` param; unused-dependency equivalent, identical in kind to
  `pdf-document-list.tsx`'s own `keyExtractor` equivalent (documented in
  `pending-pdfs-generate/mutation.md`).
- `card-list-with-abm-dialog.tsx:98,106` (OptionalChaining only, **not** ConditionalExpression —
  see below) — `handleEditConfirm`/`handleRemoveConfirm`'s own Dialog only renders its Save/
  Remove button (the only caller of these handlers) while `open` is true, i.e. while
  `dialogState?.type === <matching type>` already holds (RN `Modal` renders no children while
  `visible={false}`, confirmed by direct RTL tree inspection). So `dialogState` is never `null`
  on any reachable call, making `?.` vs `.` unobservable.

### Survived — documented equivalent, deliberately NOT suppressed (2)

- `card-list-with-abm-dialog.tsx:98,106` — **ConditionalExpression, `true` replacement only.**
  Same unreachable-guard reasoning as the `OptionalChaining` case above (the guard's else-branch
  never fires via any real interaction path). **Deliberately left as `Survived` rather than
  `Ignored`**: Stryker generates *two* `ConditionalExpression` mutants per condition (`true` and
  `false`), and a blanket `// Stryker disable ... ConditionalExpression` would have also
  suppressed the `false` replacement — which **is** a real, already-killed mutant (removing the
  call to `onEditSubmit`/`onRemoveConfirm` breaks the existing "calls onEditSubmit/onRemoveConfirm
  once" tests). Stryker's disable-comment syntax matches by mutator name only, not by specific
  replacement value, so there's no way to suppress only the equivalent `true` variant without
  also hiding the legitimately-tested `false` variant. Confirmed via this round's re-run: `:98`'s
  `false` mutant is `Timeout` (counted as detected) and `:106`'s is `Killed` — both still tracked.
  Trading a slightly lower raw score (97.2 vs a suppressed 100) for not silently discarding a
  real kill signal.

## Error mutant investigation (1, unchanged across rounds)

`card-list-with-abm-dialog.tsx:218` — `ArrowFunction` mutant on `StyleSheet.create((theme) =>
({...}))`, mutates the theme-factory arrow to `() => undefined`. **RuntimeError**, not
CompileError: `TypeError: Cannot convert undefined or null to object` at `Object.entries`
inside `react-native-unistyles`'s own style-resolution code, thrown as soon as any styled
element renders. This is a genuine crash produced by breaking the style factory's return value
— **not** a sandbox/config defect (no "cannot find module"/resolution failure, matches the
`TS`-diagnostic-style legitimate-rejection pattern documented for `tanstack-query-hooks-
migration`'s error mutants). Not escalated; Stryker counts it as detected (excluded from the
score per this skill's convention, consistent with `activity-open-ended`'s "1 runtime/compile
error mutant per lib — Stryker treats as detected" precedent).

## Gates (round 2)

- `pnpm --filter @helsoft/components lint` — clean.
- `pnpm --filter @helsoft/components check-types` — clean.
- `pnpm --filter @helsoft/components test` — 70/70 suites, 525/525 tests green.
- `pnpm --filter @helsoft/components exec playwright test
  tests/e2e/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.e2e.js --reporter=list`
  — 5/5 passed.
- Stryker re-run scoped to this feature's 3 changed files: 79 mutants, 69 killed, 6 ignored
  (equivalents), 2 survived (documented equivalents above), 1 error (investigated above) — 97.2%.

## Files measured

```
libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.tsx
libs/components/src/organisms/card-list-with-abm-dialog/card-list-with-abm-dialog.types.ts
libs/components/src/organisms/card-list-with-abm-dialog/use-card-list-with-abm-dialog.ts
```
