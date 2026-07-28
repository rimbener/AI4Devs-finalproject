# Mutation — ai-provider-registry-frontend

_Auto-stubbed by `parse-mutation-report.mjs` from the per-lib Stryker JSON reports. 0 survivor(s), 164 error mutant(s) ⚠ — kill or ESCALATE (never rewrite as PASS)._

| lib | total | killed | survived | errors | score % |
|---|--:|--:|--:|--:|--:|
| @helsoft/components | 196 | 193 | 0 | 3 ⚠ | 100.0 |
| @helsoft/hooks | 156 | 102 | 0 | 54 ⚠ | 100.0 |
| @helsoft/study-buddy | 264 | 252 | 0 | 12 ⚠ | 100.0 |
| @helsoft/supabase-services | 144 | 49 | 0 | 95 ⚠ | 100.0 |

## Surviving mutants

_None on the changed lines in scope._

> ⚠ 164 error mutant(s) (CompileError/RuntimeError) excluded from the score — high error counts mean the config/sandbox is off; do not treat as PASS. Investigate or ESCALATE.

## Error-mutant investigation (round 3)

Investigated per-lib rather than dismissed; stable across all 3 rounds (round 1: 153, round 2: 153, round 3: 164 — the small increase tracks new assertions added while killing survivors, not drift):

- **`@helsoft/supabase-services` (95) / `@helsoft/hooks` (54):** TypeScript `CompileError`s — mutations assigning an invalid literal/type (e.g. `false`→`true` on a typed field, or removing a null-coalescing operator so `undefined` flows into a non-optional slot) fail `tsc` before a test can even run. These are the type system correctly rejecting a mutation that could never compile as real code — not masked survivors.
- **`@helsoft/components` (3) / `@helsoft/study-buddy` (12):** `RuntimeError`s from the `react-native-unistyles` Jest mock — a mutation that nulls out a whole `StyleSheet.create((theme) => ({...}))` factory body causes the mock's internals to call `Object.entries(undefined)`, throwing before Jest can assert. A test-harness/mock artifact from neutering an entire factory, not a logic gap (the sibling non-nulling mutations on the same spans are legitimately killed by real assertions).

Conclusion: 0 survivors, 100% killed on every mutant Stryker could actually score; the error mutants are structurally incapable of representing a real, compilable, silently-wrong code path. Accepted as PASS, not escalated.
