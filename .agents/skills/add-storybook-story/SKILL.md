---
name: add-storybook-story
description: Generate a co-located `component-name.stories.tsx` for a component in this monorepo, following `.agents/rules/atomic-design.mdc` and `.agents/rules/component-split.mdc`. Use whenever the user gives a component filename and asks for its Storybook story, points out a component is missing one, or says things like "add a story for X", "create stories for this component", "storybook this", or "this component isn't done, it needs its story." Applies to `@helsoft/components`, `@helsoft/activities`, `@helsoft/logging-in-out`, `libs/study-buddy`, and any lib scaffolded from `@helsoft/lib-with-storybook`. Do NOT use for writing Playwright `.e2e.js` files (that's the `storybook-e2e-tests` skill) or for components outside a Storybook-enabled lib.
---

# Add Storybook Story

A component in a Storybook-enabled lib isn't done until it has a co-located `component-name.stories.tsx`
(`.agents/rules/atomic-design.mdc`). This skill takes a component's filename and produces that story
file by reading the component's actual props and behavior — never by guessing from the name alone.

## Step 1 — Read the component, not just its name

Open the `.tsx` file the user pointed at, plus whatever else it depends on:

- **Props type.** For simple atoms/molecules it's inline in the `.tsx`; for split components
  (`.agents/rules/component-split.mdc`) it's in the sibling `component-name.types.ts`. Read the
  actual shape — required vs optional props, literal unions, domain types imported from
  `@helsoft/types`.
- **The hook**, if one exists (`use-component-name.ts`). It tells you what's *interactive* (state
  that changes in response to user action) versus what's purely prop-driven — that distinction
  drives which stories are worth writing (see Step 3).
- **A sibling `component-name.context.tsx`**, if one exists. That means the component reads its
  state from React Context (`.agents/rules/state-sharing.mdc`) instead of taking it as props — the
  story has to wrap it in the matching Provider (Pattern D in Step 3), not pass `args` straight to
  the component.
- **A sibling `.stories.tsx` already in the same lib**, ideally the same folder tier (another
  organism, another molecule). Matching an existing neighbor's shape beats inventing a new one —
  this repo already has a consistent style per layer.

If the file has no story yet, skip straight to writing one. If it already has one, read it first —
regenerating blind can clobber hand-written decorators or mocks (see Step 5).

## Step 2 — Derive the `title`

Storybook's sidebar groups stories by `title: '{Layer}/{PascalCaseName}'`. The layer comes from the
component's **folder**, not from guessing:

| Path contains | Layer |
|---|---|
| `/atoms/` | `Atoms` |
| `/molecules/` | `Molecules` |
| `/organisms/` | `Organisms` |
| `/templates/` | `Templates` |
| `/pages/` | `Pages` |

`PascalCaseName` is the component name in PascalCase, e.g. folder `pdf-document-list` →
`PdfDocumentList`, so `title: 'Organisms/PdfDocumentList'`. Nested component-split subfolders (e.g.
`lesson-player/lesson-player-navigator/`) still resolve from their own nearest atomic-tier ancestor —
`Organisms/LessonPlayerNavigator`, not a nested path.

## Step 3 — Decide what stories earn their place

Don't default to a single `Default` story, and don't mechanically stamp out Loading/Content/
Error/Empty on every component either — base it on what the props actually express.

**Pattern A — data/async state.** If the props include an explicit state discriminant (commonly
named `state`, a literal union like `'loading' | 'content' | 'error' | 'empty'`), write one story
per state value, named for the value (`Loading`, `Content`/`Default`, `Error`, `Empty`). This is the
4-UI-states convention from `atomic-design.mdc`, and it only applies when the component itself
models those states — see `libs/components/src/organisms/pdf-document-list/pdf-document-list.stories.tsx`
for the shape (base `args` hold the `content` state; each variant story overrides just `state` +
whatever props that state needs).

**Pattern B — interactive / domain-driven.** If the component wraps a `use-*` hook that tracks
interaction (an answered/unanswered flashcard, a form with validation, a multi-step flow), the
meaningful variants are domain states, not generic ones: unanswered vs. correct vs. incorrect,
empty options, a plain `Interactive` story left to default args so a human can click through it live.
See `libs/activities/src/organisms/multiple-choice/multiple-choice.stories.tsx` — `Unanswered`,
`AnsweredCorrect`, `AnsweredIncorrect`, `Empty`, `Interactive`. Name each story after what it
demonstrates, not after a generic template.

**Pattern C — simple presentational atom/molecule.** If the component just renders one thing well
(a `Badge`, a `Chip`), a couple of variant stories driven by whatever enum/boolean props it has
(`Primary`/`Secondary`, `Enabled`/`Disabled`) is enough — no forced Loading/Error states that don't
exist in the props.

**Pattern D — Context-driven (`state-sharing.mdc`).** If the component itself takes no (or very
few) props and instead reads a value from a companion `component-name.context.tsx` Provider, `args`
can't be passed straight to `component:` — there's nothing there to receive them. Instead:

- Type `meta` against the **context value type**, not `typeof Component`
  (`satisfies Meta<LessonGenerationPanelValue>`, not `Meta<typeof LessonGenerationPanel>`).
- Give `meta` a `render` that wraps the component in the Provider, spreading `args` into the
  Provider's `value`.
- Each story variant still just sets `args` (the parts of the context value that change per
  state) — the shared `render` wiring stays in `meta` and doesn't need repeating per story, unless
  a variant needs genuinely interactive local state (e.g. a picker demo backed by `useState`), in
  which case give that one story its own `render` with a small wrapper component, same as any other
  interactive story.

See `libs/components/src/organisms/lesson-generation-panel/lesson-generation-panel.stories.tsx` for
the full shape — it also combines this with Pattern A (`state: 'empty' | 'loading' | 'content' |
'error' | 'missing-key'` lives on the context value, so its state variants are named the same way).

Two additions worth making regardless of which pattern above applies:

- **Optional props / edge cases in the data itself** get their own story rather than being folded
  into the base story — an optional `onDelete` that reveals a delete action (`ContentWithDelete`),
  but also a domain field that's legitimately missing or empty (`slide.explanation` undefined, an
  empty `back`/`content`) if the component has to handle that gracefully. See
  `libs/activities/src/organisms/flashcard/flashcard.stories.tsx`'s `WithoutExplanation` and
  `UnavailableMissingBack`/`UnavailableMissingFront`.
- **A toggle/selection prop often deserves one local demo story**, independent of pattern: wrap a
  few instances of the component in a small wrapper with its own `useState` so a human can see them
  interact as a group, not just flip one instance in isolation. See `FilterGroup` in
  `libs/components/src/atoms/chip/chip.stories.tsx` — a plain Pattern-C atom, but `selected` is
  worth demonstrating as a multi-chip toggle group, not just a static `selected: true` prop.

## Step 4 — Write the file

```tsx
import type { Meta, StoryObj } from '@storybook/react-native-web-vite';

import { ComponentName } from './component-name';
// only if props/domain types are split out or come from @helsoft/types:
import type { ComponentNameProps } from './component-name.types';

const meta = {
  title: 'Layer/ComponentName',
  component: ComponentName,
  args: {
    /* the props needed for the most representative default state */
  },
} satisfies Meta<typeof ComponentName>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
// ...additional named exports per Step 3
```

Rules that keep this consistent with the rest of the repo:

- Import order: types-only imports first (`import type`), then the component import, then
  sibling `.types` — Biome's import-order check enforces this; don't hand-order differently.
- Fixture data (slide content, filenames, labels passed as **props**) can be plain string
  literals — `.agents/rules/i18n.mdc` governs strings the *component* renders to a user, not
  fixture props a story passes in. Compare `multiple-choice.stories.tsx`'s hardcoded `'What is the
  capital of France?'` — that's fine.
- Reuse an existing fixture from a sibling `.test.tsx` in the same folder if one already models
  the domain type well, instead of inventing new sample data from scratch.
- Only reach for `decorators` when the component depends on a hook/context that must be mocked to
  render at all (e.g. `withLessonAttemptMock` in
  `libs/study-buddy/src/components/lesson-results/lesson-results.stories.tsx`). This is the
  exception, not the default — most components in this repo are prop-driven and need none.

## Step 5 — Verify, and respect existing hand-written stories

After writing (or updating) the file:

```bash
pnpm turbo run check-types --filter=@helsoft/{lib}
pnpm --filter @helsoft/{lib} exec biome check <path-to-stories-file>
```

Fix anything the type checker or Biome flags (unused imports, import order, missing `Story` type
params) before considering the story done — don't hand back a file that doesn't typecheck.

If a `.stories.tsx` already existed and used `decorators` or hook mocks, treat those as intentional
and preserve them when adding new variants — append/adjust rather than regenerating the whole file
from a template, since a blind rewrite can silently drop a mock a human tuned by hand.

## Reference: layer → example in this repo

| Layer | Example file |
|---|---|
| Atoms | `libs/components/src/atoms/button/button.stories.tsx` |
| Molecules | `libs/components/src/molecules/answer-option/answer-option.stories.tsx` |
| Organisms (data state) | `libs/components/src/organisms/pdf-document-list/pdf-document-list.stories.tsx` |
| Organisms (interactive/domain) | `libs/activities/src/organisms/multiple-choice/multiple-choice.stories.tsx` |
| Organisms (Context-driven) | `libs/components/src/organisms/lesson-generation-panel/lesson-generation-panel.stories.tsx` |
| Templates | `libs/components/src/templates/screen-container/screen-container.stories.tsx` |
| Features (study-buddy) | `libs/study-buddy/src/components/pdf-documents/pdf-documents.stories.tsx` |
| Mocked hook via decorator | `libs/study-buddy/src/components/lesson-results/lesson-results.stories.tsx` |
