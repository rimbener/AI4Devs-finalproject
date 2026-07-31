Feature: CardListWithABMDialog
  As a developer building list-management screens, I want a reusable organism that
  renders a titled card list with per-item edit/remove actions backed by dialogs,
  so any screen needing add/edit/remove-a-card gets consistent MD3 behavior for free.

  @s1
  Scenario: Populated list renders title, add button, and each item's content
    Given a list of items each with caller-supplied content
    When CardListWithABMDialog renders
    Then it shows the title prop
    And it shows an add button (Button with icon="add")
    And it shows one Card per item containing that item's content

  @s2
  Scenario: Disabled card is grayed out and its icon buttons are non-interactive
    Given an item with disabled: true and both showEditButton and showRemoveButton true
    When its card renders
    Then the card renders at reduced opacity (theme.disabledOpacity)
    And its edit and remove icon buttons render disabled (no-op on press)

  @s3
  Scenario: showEditButton false hides only the edit icon
    Given an item with showEditButton: false and showRemoveButton: true
    When its card renders
    Then no edit icon button renders for that card
    And the remove icon button still renders

  @s4
  Scenario: showRemoveButton false hides only the remove icon
    Given an item with showRemoveButton: false and showEditButton: true
    When its card renders
    Then no remove icon button renders for that card
    And the edit icon button still renders

  @s5
  Scenario: Edit icon opens the edit dialog with that item's content
    Given a card with an enabled edit icon button
    When the user taps the edit icon
    Then an edit dialog opens
    And its body is the result of renderEditForm(item) for that item
    And its title/submit label/cancel label are the static editDialogTitle/editSubmitLabel/editCancelLabel props

  @s6
  Scenario: Remove icon opens the remove-confirmation dialog with that item's content
    Given a card with an enabled remove icon button
    When the user taps the remove icon
    Then a remove-confirmation dialog opens
    And its body is the result of renderRemoveConfirmation(item) for that item
    And its title/submit label/cancel label are the static removeDialogTitle/removeSubmitLabel/removeCancelLabel props

  @s7
  Scenario: Submitting the edit dialog notifies the caller with the item
    Given the edit dialog is open for a given item
    When the user taps its submit button
    Then onEditSubmit is called once with that item

  @s8
  Scenario: Submitting the remove dialog notifies the caller with the item
    Given the remove dialog is open for a given item
    When the user taps its submit button
    Then onRemoveConfirm is called once with that item

  @s9
  Scenario: Canceling the edit dialog does not submit
    Given the edit dialog is open for a given item
    When the user taps Cancel, taps the scrim, or dismisses via Escape
    Then the edit dialog closes
    And onEditSubmit is not called

  @s10
  Scenario: Canceling the remove dialog does not submit
    Given the remove dialog is open for a given item
    When the user taps Cancel, taps the scrim, or dismisses via Escape
    Then the remove dialog closes
    And onRemoveConfirm is not called

  @s11
  Scenario: isSubmitting swaps the edit dialog to a submitting state
    Given the edit dialog is open
    When isSubmitting becomes true
    Then the dialog body is replaced entirely by SubmittingIndicator
    And the cancel/submit buttons are hidden
    And tapping the scrim or dismissing via Escape does not close the dialog

  @s12
  Scenario: isSubmitting swaps the remove dialog to a submitting state
    Given the remove dialog is open
    When isSubmitting becomes true
    Then the dialog body is replaced entirely by SubmittingIndicator
    And the cancel/submit buttons are hidden
    And tapping the scrim or dismissing via Escape does not close the dialog

  @s13
  Scenario: isSubmitting returning to false closes the dialog
    Given a dialog is showing SubmittingIndicator because isSubmitting was true
    When isSubmitting returns to false
    Then the dialog closes outright (no form/confirmation content, no buttons)
    And a caller whose isSubmitting never becomes true after submit (a synchronous/no-op
    submit handler) still sees the dialog close on its own, rather than staying in the
    submitting state forever
    # Reconciled by review.md's Mini-gate 3 fix round: isSubmitting is a settle signal only —
    # errorMessage (@s26) is the dedicated failure-communication channel, so a settled
    # isSubmitting always means "done", never "show the form again". Previously read
    # "restores normal dialog content"; changed to match the already-implemented, already-
    # tested "close" behavior (and the real ApiKeySettingsScreen consumer's own local reducer,
    # which deliberately keeps its sticky submitting flag through a successful settle so the
    # dialog closes rather than reopening).

  @s14
  Scenario: Per-card icon buttons have card-specific accessible names
    Given two different cards each with edit and remove enabled
    When their icon buttons render
    Then each card's edit icon's accessible name is built by getEditAccessibilityLabel(item) and differs between the two cards
    And each card's remove icon's accessible name is built by getRemoveAccessibilityLabel(item) and differs between the two cards

  @s15
  Scenario: Empty list with emptyStateMessage
    Given items is an empty array
    And emptyStateMessage is provided
    When CardListWithABMDialog renders
    Then the title and add button still render
    And emptyStateMessage renders in place of the list

  @s16
  Scenario: Empty list without emptyStateMessage
    Given items is an empty array
    And emptyStateMessage is not provided
    When CardListWithABMDialog renders
    Then the title and add button still render
    And nothing renders in place of the list

  @s17
  Scenario: Add button notifies the caller
    Given CardListWithABMDialog is rendered (populated or empty)
    When the user taps the add button
    Then onAddPress is called once

  @s18
  Scenario: Storybook coverage of the full state matrix
    Given the CardListWithABMDialog Storybook file
    When its stories are enumerated
    Then stories exist for: populated list, empty list without emptyStateMessage, empty list with emptyStateMessage, a disabled card, an edit-only card, a remove-only card, edit dialog open, remove dialog open, isSubmitting true for the edit dialog, and isSubmitting true for the remove dialog

  @s19
  Scenario: Closing the edit dialog does not flash empty content
    Given the edit dialog is open showing renderEditForm(item) content
    When the user closes it via Cancel, scrim tap, or Escape
    Then the dialog's last content continues to render for the duration of its close transition
    And no empty dialog body is shown while it is closing

  @s20
  Scenario: Closing the remove dialog does not flash empty content
    Given the remove dialog is open showing renderRemoveConfirmation(item) content
    When the user closes it via Cancel, scrim tap, or Escape
    Then the dialog's last content continues to render for the duration of its close transition
    And no empty dialog body is shown while it is closing

  # @s21-@s27: added by the post-hoc doc pass reviewing the human's implementation changes
  # (the add dialog, single shared Dialog, errorMessage, submitDisabled). These describe code
  # that already exists and is already unit-tested (including @s26/@s27, now end-to-end from
  # CardListWithABMDialog itself, not just the CardListWithABMDialogDialog molecule in
  # isolation) — but none have been through spec_partner, spec_reviewer, the human gate,
  # reviewer_slice/reviews_lead, or mutation_tester. See spec.md's "Outstanding" section.

  @s21
  Scenario: Add icon opens the add dialog with that renderAddForm content
    Given the add button is present
    When the user taps it
    Then an add dialog opens
    And its body is the result of renderAddForm()
    And its title/submit label/cancel label are the static addDialogTitle/addSubmitLabel/addCancelLabel props
    And onAddPress is still called once (unchanged from @s17)

  @s22
  Scenario: Submitting the add dialog notifies the caller
    Given the add dialog is open
    When the user taps its submit button
    Then onAddSubmit is called once
    And the dialog swaps to its submitting state (mirrors @s11)

  @s23
  Scenario: Canceling the add dialog does not submit
    Given the add dialog is open
    When the user taps Cancel
    Then the add dialog closes
    And onAddSubmit is not called

  @s24
  Scenario: Closing the add dialog does not flash empty content
    Given the add dialog is open showing renderAddForm() content
    When the user closes it via Cancel
    Then the dialog's last content continues to render for the duration of its close transition
    And no empty dialog body is shown while it is closing (mirrors @s19/@s20)

  @s25
  Scenario: Only one of add/edit/remove is open at a time
    Given one of the add, edit, or remove dialogs is open
    When the user opens a different one of the three (e.g. taps an edit icon while the add dialog is open)
    Then the previously-open dialog closes
    And the newly-requested dialog opens with its own content
    And this holds for every pair of the three dialog types, not just adjacent ones

  @s26
  Scenario: errorMessage forces the shared dialog open in an error state
    Given errorMessage is set to a non-empty string
    When CardListWithABMDialog renders
    Then the shared dialog is open regardless of dialogType/dialogState
    And its body is replaced by an ErrorBanner showing errorMessage
    And its actions are replaced by a single localized "Close" button that calls onClose

  @s27
  Scenario: submitDisabled disables the dialog's submit button
    Given a dialog is open (add, edit, or remove)
    And submitDisabled is true
    When the dialog renders
    Then its submit/confirm button is disabled
