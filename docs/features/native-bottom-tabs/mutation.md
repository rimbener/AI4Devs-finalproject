# Mutation — native-bottom-tabs

Base ref: `feature-entrega3-HernanLaura`  
Threshold: 100% killed on changed lines in scope  
Verdict: **SURVIVORS**

## Scores

| Lib | total | killed | timeout | survived | no cov | errors | score |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `@helsoft/components` | 70 | 68 | 0 | 1 | 0 | 1 | 98.55% |
| `@helsoft/activities` | 41 | 27 | 12 | 1 | 1 | 0 | 95.12% |
| `@helsoft/study-buddy` | 112 | 75 | 13 | 22 | 1 | 1 | 79.28% |
| `@helsoft/services` | — | — | — | — | — | — | skipped (no changed source) |
| `@helsoft/supabase-services` | — | — | — | — | — | — | skipped |
| `@helsoft/hooks` | — | — | — | — | — | — | skipped |
| `@helsoft/logging-in-out` | — | — | — | — | — | — | skipped |

Notes:
- Deleted paths in the diff (`mobile-bar/*`, `app-chrome.helpers.ts`) produced no mutate targets.
- Feature chrome files at 100%: `desktop-bar.tsx`, `app-chrome.tsx`, `native-tabs-triggers.ts`, `use-app-chrome.ts`, `settings-sign-out.tsx`.

## Survivors

### `@helsoft/components`

- `src/organisms/api-key-form/use-api-key-form.ts:72` — ConditionalExpression: `if (isReplacing)` → `if (true)`

### `@helsoft/activities`

- `src/organisms/slide-image/use-slide-image.ts:14` — NoCoverage StringLiteral: default `layout = 'stacked'` → `layout = ""`
- `src/organisms/slide-image/use-slide-image.ts:30` — ConditionalExpression: `layout === 'split' && paneSize` → `true && paneSize`

### `@helsoft/study-buddy`

#### `new-lesson-dialog.tsx`

- `:32` — NoCoverage BlockStatement: `handleClose` body → `{}`
- `:36` — StringLiteral: `step === 'upload'` → `step === ""`
- `:36` — ConditionalExpression: ternary → always generation branch (`false ? …`)
- `:36` — StringLiteral: `t('upload.dialogHeadline')` → `t("")`
- `:48` — StringLiteral: `t('upload.dialogClose')` → `t("")`
- `:52` — ConditionalExpression: upload panel guard → `true ? <PdfUploadPanel…>`
- `:52` — EqualityOperator: `step === 'upload'` → `step !== 'upload'`
- `:52` — ConditionalExpression: upload panel guard → `false ? <PdfUploadPanel…>`
- `:52` — StringLiteral: `step === 'upload'` → `step === ""`
- `:53` — ConditionalExpression: generate panel guard → `true ? (`

#### `saved-lessons.tsx`

- `:28` — ArrayDeclaration: `onOpenLesson` deps `[router]` → `[]`
- `:33` — ArrayDeclaration: `onNewLesson` deps `[router]` → `[]`
- `:40` — ArrayDeclaration: `onDelete` deps `[deleteLesson]` → `[]`
- `:48` — ArrayDeclaration: a11y effect deps `[state, error, deleteFailedLabel]` → `[]`
- `:77` — ObjectLiteral: `StyleSheet.create` styles object → `{}`
- `:78` — ObjectLiteral: `root` style → `{}`
- `:82` — ObjectLiteral: `header` style → `{}`
- `:83` — StringLiteral: `flexDirection: 'row'` → `""`
- `:84` — StringLiteral: `alignItems: 'center'` → `""`
- `:85` — StringLiteral: `justifyContent: 'space-between'` → `""`
- `:88` — ObjectLiteral: `heading` style → `{}`
- `:93` — ObjectLiteral: `count` style → `{}`
- `:97` — ObjectLiteral: `deleteError` style → `{}`
