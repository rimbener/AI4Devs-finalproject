import type { CardListItem } from '../card-list-with-abm-dialog.types';
import {
  cardListWithABMDialogInitialState,
  cardListWithABMDialogReducer,
} from './use-card-list-with-abm-dialog.reducer';

type StoryItem = { note: string };

const item: CardListItem<StoryItem> = {
  id: 'item-1',
  content: null,
  accessibleLabel: 'Item 1',
  showEditButton: true,
  showRemoveButton: true,
  data: { note: 'first' },
};

describe('cardListWithABMDialogInitialState', () => {
  it('starts with no dialog type/item and the given dialog state', () => {
    expect(cardListWithABMDialogInitialState('closed')).toEqual({
      dialogType: null,
      dialogItem: null,
      dialogState: 'closed',
    });
  });

  it('honors a "submitting" initial dialog state', () => {
    expect(cardListWithABMDialogInitialState('submitting')).toEqual({
      dialogType: null,
      dialogItem: null,
      dialogState: 'submitting',
    });
  });
});

describe('cardListWithABMDialogReducer', () => {
  const closedState = cardListWithABMDialogInitialState<StoryItem>('closed');

  it('opens the add dialog with no item', () => {
    expect(cardListWithABMDialogReducer(closedState, { type: 'open-add' })).toEqual({
      dialogType: 'add',
      dialogItem: null,
      dialogState: 'open',
    });
  });

  it('opens the edit dialog with the given item', () => {
    expect(cardListWithABMDialogReducer(closedState, { type: 'open-edit', item })).toEqual({
      dialogType: 'edit',
      dialogItem: item,
      dialogState: 'open',
    });
  });

  it('opens the remove dialog with the given item', () => {
    expect(cardListWithABMDialogReducer(closedState, { type: 'open-remove', item })).toEqual({
      dialogType: 'remove',
      dialogItem: item,
      dialogState: 'open',
    });
  });

  // Regression coverage (review.md's Mini-gate 3, findings 1/2): submit must preserve the
  // existing dialogType/dialogItem — like `close` already does — so a caller that mounts (or
  // ends up) already `isSubmitting` before ever opening a dialog through the reducer, and then
  // opens one via a real open-* dispatch while still submitting, keeps its headline/body
  // content once the isSubmitting-driven effect folds it back into 'submitting'. Nulling them
  // (the old behavior) only worked by accident, via a separate `prevDialogRef` fallback in the
  // hook, and broke that fallback's very first render (no prior dialog to fall back to).
  it('preserves the existing dialogType/dialogItem and moves to submitting on submit', () => {
    const editOpen = cardListWithABMDialogReducer(closedState, { type: 'open-edit', item });

    expect(cardListWithABMDialogReducer(editOpen, { type: 'submit' })).toEqual({
      dialogType: 'edit',
      dialogItem: item,
      dialogState: 'submitting',
    });
  });

  // Regression coverage (see card-list-with-abm-dialog.tsx's @s19/@s20 comment): close must
  // preserve the stale dialogType/dialogItem so the dialog's last content keeps rendering while
  // the shared Dialog organism fades out, rather than flashing empty content.
  it('moves to closed while preserving the existing dialogType/dialogItem', () => {
    const editOpen = cardListWithABMDialogReducer(closedState, { type: 'open-edit', item });

    expect(cardListWithABMDialogReducer(editOpen, { type: 'close' })).toEqual({
      dialogType: 'edit',
      dialogItem: item,
      dialogState: 'closed',
    });
  });

  it('closing from the initial (no dialogType/dialogItem) state stays empty', () => {
    expect(cardListWithABMDialogReducer(closedState, { type: 'close' })).toEqual({
      dialogType: null,
      dialogItem: null,
      dialogState: 'closed',
    });
  });
});
