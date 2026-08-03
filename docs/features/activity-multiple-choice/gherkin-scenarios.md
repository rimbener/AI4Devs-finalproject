# Gherkin scenarios — activity-multiple-choice

The signed contract. Every `@s` tag is the traceability key the `implementer` and reviewers use;
each maps to ≥ 1 concrete test. Every acceptance criterion in `spec.md` maps to ≥ 1 scenario here.

```gherkin
Feature: Multiple-choice activity slide
  As a learner, I want to select an answer on a multiple-choice activity slide,
  submit it, and see whether I got it right, so that I know if I understood the
  material without waiting until the end of the lesson.

  Background:
    Given a multiple-choice slide with a question, several options, and one correct option

  @s1
  Scenario: The slide renders all options, unanswered
    When the slide is shown
    Then every option is visible and selectable
    And no option is pre-selected
    And the Submit control is hidden
    And no result is shown

  @s2
  Scenario: Selecting an option shows Submit without locking
    When I select an option
    Then that option becomes my pending selection
    And the Submit control becomes visible
    And all options remain interactive
    And no result is shown yet

  @s3
  Scenario: Submitting a correct choice is marked correct
    Given I have selected the correct option
    When I tap Submit
    Then my option is marked correct
    And a correct result is shown
    And all options become non-interactive

  @s4
  Scenario: Submitting an incorrect choice is marked incorrect and reveals the correct option
    Given I have selected an option that is not the correct one
    When I tap Submit
    Then my option is marked incorrect
    And the correct option is revealed alongside it
    And an incorrect result is shown
    And all options become non-interactive

  @s5
  Scenario: The explanation is shown with the result
    Given the slide has an explanation
    And I have selected any option
    When I tap Submit
    Then the explanation is shown together with the result

  @s6
  Scenario: Only one graded answer per attempt
    Given I have already submitted an option
    When I attempt to select a different option or submit again
    Then my original answer is unchanged
    And no new answer is recorded

  @s7
  Scenario: The graded result is exposed as answered state
    Given I have selected an option
    When I tap Submit
    Then the slide's answered state reports the chosen option, the correct option, and whether it was correct
    And that answered state is available to the end-of-lesson score and to resume

  @s8
  Scenario: A slide with no options shows an unavailable state
    Given a multiple-choice slide that has no options
    When the slide is shown
    Then an unavailable notice is shown instead of a question
    And nothing is selectable

  @s9
  Scenario: A malformed slide degrades gracefully
    Given a multiple-choice slide whose correct option is not among its options
    When the slide is shown
    Then an unavailable notice is shown instead of a broken question
    And the slide does not crash

  @s10
  Scenario: Result and explanation chrome are localized
    Given the app locale is set to a supported language
    When feedback is shown after I submit
    Then the Submit label, correct/incorrect result label, explanation heading, and unavailable notice are rendered from activity.result.* in the active locale bundle
    And no user-facing chrome string is hardcoded

  @s11
  Scenario: The slide is accessible
    When the slide is shown
    Then each option exposes a button role and an accessible label
    And correctness is conveyed by text and icon, not color alone
    When I submit
    Then the result is announced to assistive technology
```

## AC → scenario coverage

| AC | Scenario(s) |
|---|---|
| AC1 (renders all options, none pre-selected, Submit hidden) | @s1 |
| AC2 (select → Submit visible, still unlocked) | @s2 |
| AC3 (submit correct feedback) | @s3 |
| AC4 (submit incorrect feedback + reveal correct) | @s4 |
| AC5 (explanation shown with result) | @s5 |
| AC6 (lock after submit, no re-answer) | @s6 |
| AC7 (answered state exposed for R7/R9) | @s7 |
| AC8 (empty — no options) | @s8 |
| AC9 (error — malformed payload) | @s9 |
| AC10 (i18n chrome via activity.result.*) | @s10 |
| AC11 (accessibility) | @s11 |

## Scenario → primary test kind (how the implementer consumes it)

| Scenario | Primary test |
|---|---|
| @s1 | `templates/multiple-choice/multiple-choice.test.tsx` (unanswered: options, no selection, Submit hidden) |
| @s2 | `multiple-choice.test.tsx` (select → Submit visible, options still enabled) |
| @s3 | `grading/grade-multiple-choice.test.ts` + `multiple-choice.test.tsx` (submit correct) |
| @s4 | grader + `multiple-choice.test.tsx` (submit incorrect + reveal) |
| @s5 | `multiple-choice.test.tsx` (explanation with result via ActivityResultContent) |
| @s6 | `multiple-choice.test.tsx` (locked ignore taps/resubmit; onAnswered once) |
| @s7 | grader shape + activity `onAnswered` payload |
| @s8 | `multiple-choice.test.tsx` (zero options → unavailable) |
| @s9 | unavailable + grader throws on unknown option |
| @s10 | `activity.result.*` via `t()` + localization coverage |
| @s11 | a11y assertions + Playwright e2e (`multiple-choice.e2e.js`) |
```
