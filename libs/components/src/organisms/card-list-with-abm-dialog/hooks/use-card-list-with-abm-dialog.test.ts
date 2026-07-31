import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import type { CardListItem } from '../card-list-with-abm-dialog.types';
import { CardListWithABMDialogProvider } from './card-list-with-abm-dialog.context';
import type { CardListWithABMDialogValue } from './card-list-with-abm-dialog.context.types';
import { useCardListWithABMDialog } from './use-card-list-with-abm-dialog';

type StoryItem = { note: string };

const item: CardListItem<StoryItem> = {
  id: 'item-1',
  content: null,
  accessibleLabel: 'First card',
  data: { note: 'first' },
};

const otherItem: CardListItem<StoryItem> = {
  id: 'item-2',
  content: null,
  accessibleLabel: 'Second card',
  data: { note: 'second' },
};

const contextValue: CardListWithABMDialogValue<StoryItem> = {
  title: 'Cards',
  items: [],
  addButtonLabel: 'Add item',
  renderAddForm: () => null,
  addDialogTitle: 'Add card',
  renderEditForm: () => null,
  editDialogTitle: 'Edit card',
  renderRemoveConfirmation: () => null,
  getEditAccessibilityLabel: () => 'Edit',
  getRemoveAccessibilityLabel: () => 'Remove',
  isSubmitting: false,
};

const wrapper = ({ children }: { children: ReactNode }) =>
  CardListWithABMDialogProvider<StoryItem>({ value: contextValue, children });

describe('useCardListWithABMDialog', () => {
  it('starts closed with no dialog type or item', async () => {
    const { result } = await renderHook(
      () =>
        useCardListWithABMDialog<StoryItem>({
          initialDialogState: 'closed',
        }),
      { wrapper },
    );

    expect(result.current?.dialogState).toBe('closed');
    expect(result.current?.dialogType).toBeNull();
    expect(result.current?.dialogItem).toBeNull();
  });

  // Mutation coverage: `dialog` falls back to `EMPTY_DIALOG_RESPONSE` (an exact literal, not just
  // "something falsy") before any dialog has ever been opened.
  it('exposes an empty dialog response before any dialog has been opened', async () => {
    const { result } = await renderHook(
      () =>
        useCardListWithABMDialog<StoryItem>({
          initialDialogState: 'closed',
        }),
      { wrapper },
    );

    expect(result.current?.dialog).toEqual({
      title: '',
      submitLabel: '',
      cancelLabel: '',
      onSubmit: undefined,
    });
  });

  // Mutation coverage: onAddPress?.() — a caller that omits onAddPress entirely must not throw
  // when openAddDialog runs.
  it('does not throw opening the add dialog when onAddPress is not provided', async () => {
    const { result } = await renderHook(
      () =>
        useCardListWithABMDialog<StoryItem>({
          initialDialogState: 'closed',
        }),
      { wrapper },
    );

    await act(async () => {
      result.current?.openAddDialog();
    });

    expect(result.current?.dialogType).toBe('add');
  });

  // Mutation coverage: `onAddSubmit?.()` (the "add" branch of `dialog.onSubmit`) — a caller that
  // omits onAddSubmit must not throw when the add dialog is submitted.
  it('does not throw submitting the add dialog when onAddSubmit is not provided', async () => {
    const { result } = await renderHook(
      () =>
        useCardListWithABMDialog<StoryItem>({
          initialDialogState: 'closed',
        }),
      { wrapper },
    );

    await act(async () => {
      result.current?.openAddDialog();
    });

    await act(async () => {
      result.current?.dialog.onSubmit?.();
    });

    expect(result.current?.dialogState).toBe('submitting');
  });

  // Mutation coverage: `onRemoveConfirm?.()` (the "remove" branch of `dialog.onSubmit`) — a
  // caller that omits onRemoveConfirm must not throw when the remove dialog is submitted.
  it('does not throw submitting the remove dialog when onRemoveConfirm is not provided', async () => {
    const { result } = await renderHook(
      () =>
        useCardListWithABMDialog<StoryItem>({
          initialDialogState: 'closed',
        }),
      { wrapper },
    );

    await act(async () => {
      result.current?.openRemoveDialog(item);
    });

    await act(async () => {
      result.current?.dialog.onSubmit?.();
    });

    expect(result.current?.dialogState).toBe('submitting');
  });

  // Mutation coverage: the auto-submit effect's compound guard — `isSubmitting && state.dialogState
  // === 'open'` — must require BOTH conditions. A caller whose isSubmitting starts true before any
  // dialog is ever opened (dialogState 'closed') must not have the reducer's 'submit' dispatched
  // for it (there is nothing open to submit).
  it('does not auto-dispatch submit when isSubmitting starts true but no dialog is open', async () => {
    const alreadySubmittingWrapper = ({ children }: { children: ReactNode }) =>
      CardListWithABMDialogProvider<StoryItem>({
        value: { ...contextValue, isSubmitting: true },
        children,
      });

    const { result } = await renderHook(
      () => useCardListWithABMDialog<StoryItem>({ initialDialogState: 'closed' }),
      { wrapper: alreadySubmittingWrapper },
    );

    expect(result.current?.dialogState).toBe('closed');
    expect(result.current?.dialogType).toBeNull();
  });

  it('openAddDialog sets dialogType to add and opens it', async () => {
    const { result } = await renderHook(
      () =>
        useCardListWithABMDialog<StoryItem>({
          initialDialogState: 'closed',
        }),
      { wrapper },
    );

    await act(async () => {
      result.current?.openAddDialog();
    });

    expect(result.current?.dialogType).toBe('add');
    expect(result.current?.dialogItem).toBeNull();
    expect(result.current?.dialogState).toBe('open');
  });

  it('openEditDialog sets dialogType to edit for that item and opens it', async () => {
    const { result } = await renderHook(
      () =>
        useCardListWithABMDialog<StoryItem>({
          initialDialogState: 'closed',
        }),
      { wrapper },
    );

    await act(async () => {
      result.current?.openEditDialog(item);
    });

    expect(result.current?.dialogType).toBe('edit');
    expect(result.current?.dialogItem).toEqual(item);
    expect(result.current?.dialogState).toBe('open');
  });

  it('openRemoveDialog sets dialogType to remove for that item and opens it', async () => {
    const { result } = await renderHook(
      () =>
        useCardListWithABMDialog<StoryItem>({
          initialDialogState: 'closed',
        }),
      { wrapper },
    );

    await act(async () => {
      result.current?.openRemoveDialog(item);
    });

    expect(result.current?.dialogType).toBe('remove');
    expect(result.current?.dialogItem).toEqual(item);
    expect(result.current?.dialogState).toBe('open');
  });

  // Same close-without-clear guarantee as @s19/@s20, for the add dialog.
  it('closeDialog flips dialogState to closed but keeps the last dialogType/dialogItem (add)', async () => {
    const { result } = await renderHook(
      () =>
        useCardListWithABMDialog<StoryItem>({
          initialDialogState: 'closed',
        }),
      { wrapper },
    );

    await act(async () => {
      result.current?.openAddDialog();
    });
    await act(async () => {
      result.current?.closeDialog();
    });

    expect(result.current?.dialogState).toBe('closed');
    expect(result.current?.dialogType).toBe('add');
    expect(result.current?.dialogItem).toBeNull();
  });

  // @s19 — closing the edit dialog flips dialogState to closed without clearing dialogType/
  // dialogItem, so the last {type, item} stays available for the remainder of the shared
  // Dialog's close transition (spec.md's post-pr_ready bug-fix decision).
  it('closeDialog flips dialogState to closed but keeps the last dialogType/dialogItem (edit)', async () => {
    const { result } = await renderHook(
      () =>
        useCardListWithABMDialog<StoryItem>({
          initialDialogState: 'closed',
        }),
      { wrapper },
    );

    await act(async () => {
      result.current?.openEditDialog(item);
    });
    await act(async () => {
      result.current?.closeDialog();
    });

    expect(result.current?.dialogState).toBe('closed');
    expect(result.current?.dialogType).toBe('edit');
    expect(result.current?.dialogItem).toEqual(item);
  });

  // @s20 — same guarantee for the remove dialog.
  it('closeDialog flips dialogState to closed but keeps the last dialogType/dialogItem (remove)', async () => {
    const { result } = await renderHook(
      () =>
        useCardListWithABMDialog<StoryItem>({
          initialDialogState: 'closed',
        }),
      { wrapper },
    );

    await act(async () => {
      result.current?.openRemoveDialog(item);
    });
    await act(async () => {
      result.current?.closeDialog();
    });

    expect(result.current?.dialogState).toBe('closed');
    expect(result.current?.dialogType).toBe('remove');
    expect(result.current?.dialogItem).toEqual(item);
  });

  it('opening a dialog after closing one replaces the stale dialogType/dialogItem', async () => {
    const { result } = await renderHook(
      () =>
        useCardListWithABMDialog<StoryItem>({
          initialDialogState: 'closed',
        }),
      { wrapper },
    );

    await act(async () => {
      result.current?.openEditDialog(item);
    });
    await act(async () => {
      result.current?.closeDialog();
    });
    await act(async () => {
      result.current?.openEditDialog(otherItem);
    });

    expect(result.current?.dialogState).toBe('open');
    expect(result.current?.dialogType).toBe('edit');
    expect(result.current?.dialogItem).toEqual(otherItem);
  });

  // review.md Mini-gate 3, findings 1/2 — exiting 'submitting'. Uses a dynamic wrapper (reads a
  // mutable `dynamicIsSubmitting` at render time) since the context value can't be threaded
  // through renderHook's own (prop-less) callback.
  describe('exiting the submitting state', () => {
    let dynamicIsSubmitting = false;
    const dynamicWrapper = ({ children }: { children: ReactNode }) =>
      CardListWithABMDialogProvider<StoryItem>({
        value: { ...contextValue, isSubmitting: dynamicIsSubmitting },
        children,
      });

    beforeEach(() => {
      dynamicIsSubmitting = false;
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    // Finding 1 — a caller whose isSubmitting stays false the whole time (a synchronous/no-op
    // submit handler, e.g. the Populated story) used to strand the dialog in 'submitting'
    // forever: the only exit effect only ever reacted to `isSubmitting` itself changing value,
    // which it never did. Immediately after submit it must still look like it's submitting
    // (@s22) — only after a grace tick, with isSubmitting still false, does it resolve.
    it('eventually closes on its own when isSubmitting never becomes true after submit', async () => {
      const { result } = await renderHook(
        () => useCardListWithABMDialog<StoryItem>({ initialDialogState: 'closed' }),
        { wrapper: dynamicWrapper },
      );

      await act(async () => {
        result.current?.openEditDialog(item);
      });
      await act(async () => {
        result.current?.dialog.onSubmit?.();
      });
      expect(result.current?.dialogState).toBe('submitting');

      await act(async () => {
        jest.runOnlyPendingTimers();
      });

      expect(result.current?.dialogState).toBe('closed');
    });

    // Mutation coverage: `wasReallySubmittingRef`'s initial value must be `false` — mounting
    // directly into 'submitting' (e.g. isSubmitting is already true when the caller first
    // renders) with isSubmitting false from the very first render must still honor the grace
    // period below, not treat it as an already-genuinely-true submit that closes immediately.
    it('honors the grace period even when it mounts already in the submitting state', async () => {
      const { result } = await renderHook(
        () => useCardListWithABMDialog<StoryItem>({ initialDialogState: 'submitting' }),
        { wrapper: dynamicWrapper },
      );

      expect(result.current?.dialogState).toBe('submitting');

      await act(async () => {
        jest.advanceTimersByTime(49);
      });
      expect(result.current?.dialogState).toBe('submitting');

      await act(async () => {
        jest.advanceTimersByTime(1);
      });
      expect(result.current?.dialogState).toBe('closed');
    });

    // @s13 — a real async caller's isSubmitting genuinely returning to false (having actually
    // been true first) closes the dialog immediately, with no grace delay.
    it('closes immediately once a genuinely-true isSubmitting returns to false', async () => {
      const { result, rerender } = await renderHook(
        () => useCardListWithABMDialog<StoryItem>({ initialDialogState: 'closed' }),
        { wrapper: dynamicWrapper },
      );

      await act(async () => {
        result.current?.openEditDialog(item);
      });
      await act(async () => {
        result.current?.dialog.onSubmit?.();
      });

      dynamicIsSubmitting = true;
      await act(async () => {
        rerender({});
      });
      expect(result.current?.dialogState).toBe('submitting');

      dynamicIsSubmitting = false;
      await act(async () => {
        rerender({});
      });

      expect(result.current?.dialogState).toBe('closed');
    });

    // Mutation coverage: the exit effect's `state.dialogState !== 'submitting'` early-return guard
    // must reset `wasReallySubmittingRef` on every render where the dialog isn't 'submitting' —
    // not just when it eventually closes. Without that reset, a stale "was really submitting" flag
    // from one genuinely-async submit cycle would silently auto-close the very next dialog the
    // caller opens, immediately, for no reason of its own.
    it('does not carry a stale "was really submitting" flag into the next dialog opened afterward', async () => {
      const { result, rerender } = await renderHook(
        () => useCardListWithABMDialog<StoryItem>({ initialDialogState: 'closed' }),
        { wrapper: dynamicWrapper },
      );

      await act(async () => {
        result.current?.openEditDialog(item);
      });
      await act(async () => {
        result.current?.dialog.onSubmit?.();
      });

      dynamicIsSubmitting = true;
      await act(async () => {
        rerender({});
      });
      expect(result.current?.dialogState).toBe('submitting');

      dynamicIsSubmitting = false;
      await act(async () => {
        rerender({});
      });
      expect(result.current?.dialogState).toBe('closed');

      await act(async () => {
        result.current?.openEditDialog(otherItem);
      });

      expect(result.current?.dialogState).toBe('open');
    });

    // review.md's "Full review — Round 1 (post-CI-fix)", finding 3 — the grace timer must not
    // fire before genuinely-elapsed real time reaches SUBMIT_WITHOUT_ASYNC_SIGNAL_GRACE_MS (50ms),
    // exercised via jest.advanceTimersByTime rather than a synchronous jest.runOnlyPendingTimers
    // flush, so the boundary itself is proven, not just "eventually fires".
    it('does not close before the grace period genuinely elapses', async () => {
      const { result } = await renderHook(
        () => useCardListWithABMDialog<StoryItem>({ initialDialogState: 'closed' }),
        { wrapper: dynamicWrapper },
      );

      await act(async () => {
        result.current?.openEditDialog(item);
      });
      await act(async () => {
        result.current?.dialog.onSubmit?.();
      });

      await act(async () => {
        jest.advanceTimersByTime(49);
      });
      expect(result.current?.dialogState).toBe('submitting');

      await act(async () => {
        jest.advanceTimersByTime(1);
      });
      expect(result.current?.dialogState).toBe('closed');
    });

    // review.md's "Full review — Round 1 (post-CI-fix)", finding 3 — proves the grace timer's
    // actual behavior under a genuinely-delayed async submit (real elapsed time via fake timers,
    // not a synchronous pre-set isSubmitting value): a caller whose isSubmitting only flips true
    // partway through the grace window must have its in-flight status respected — the dialog must
    // NOT be closed by the grace timer just because more than 50ms of real time has now passed.
    it('does not let a genuinely-delayed async submit be mistaken for a synchronous one', async () => {
      const { result, rerender } = await renderHook(
        () => useCardListWithABMDialog<StoryItem>({ initialDialogState: 'closed' }),
        { wrapper: dynamicWrapper },
      );

      await act(async () => {
        result.current?.openEditDialog(item);
      });
      await act(async () => {
        result.current?.dialog.onSubmit?.();
      });

      // Real elapsed time within the grace window (30ms < 50ms) before the caller's isSubmitting
      // genuinely turns true — modeling an async caller whose own scheduling isn't instantaneous.
      await act(async () => {
        jest.advanceTimersByTime(30);
      });
      dynamicIsSubmitting = true;
      await act(async () => {
        rerender({});
      });
      expect(result.current?.dialogState).toBe('submitting');

      // Advance real time well past the original 50ms grace window — since isSubmitting is now
      // genuinely true, the stale grace timeout must have been canceled and must not fire.
      await act(async () => {
        jest.advanceTimersByTime(200);
      });
      expect(result.current?.dialogState).toBe('submitting');

      dynamicIsSubmitting = false;
      await act(async () => {
        rerender({});
      });
      expect(result.current?.dialogState).toBe('closed');
    });
  });
});
