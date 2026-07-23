# Mutation — native-bottom-tabs

Base ref: `feature-entrega3-HernanLaura`  
Threshold: 100% killed on changed lines in scope  
Verdict: **PASS** (round 1 rework)

## Scores

| Lib | total | killed | timeout | survived | no cov | errors | score |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `@helsoft/components` | 70 | 69 | 0 | 0 | 0 | 1 | 100% |
| `@helsoft/activities` | 41 | 41 | 0 | 0 | 0 | 0 | 100% |
| `@helsoft/study-buddy` | 112 | 111 | 0 | 0 | 0 | 1 | 100% |
| `@helsoft/services` | — | — | — | — | — | — | skipped (no changed source) |
| `@helsoft/supabase-services` | — | — | — | — | — | — | skipped |
| `@helsoft/hooks` | — | — | — | — | — | — | skipped |
| `@helsoft/logging-in-out` | — | — | — | — | — | — | skipped |

Notes:
- Deleted paths in the diff (`mobile-bar/*`, `app-chrome.helpers.ts`) produced no mutate targets.
- Feature chrome files at 100%: `desktop-bar.tsx`, `app-chrome.tsx`, `native-tabs-triggers.ts`, `use-app-chrome.ts`, `settings-sign-out.tsx`.
- Round 1 rework killed prior survivors via TDD (see `tdd.md` §Mutation round 1).

## Survivors

None.
