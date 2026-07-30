import type {
  CardListDialogState,
  CardListDialogType,
  CardListItem,
} from '../card-list-with-abm-dialog.types';

export type CardListWithABMDialogReducerState<TItem> = {
  dialogType: CardListDialogType | null;
  dialogItem: CardListItem<TItem> | null;
  dialogState: CardListDialogState;
};

export type CardListWithABMDialogReducerAction<TItem> =
  | { type: 'open-add' }
  | { type: 'open-edit'; item: CardListItem<TItem> }
  | { type: 'open-remove'; item: CardListItem<TItem> }
  | { type: 'submit' }
  | { type: 'close' };

export const cardListWithABMDialogInitialState = <TItem>(
  initialDialogState: CardListDialogState,
): CardListWithABMDialogReducerState<TItem> => ({
  dialogType: null,
  dialogItem: null,
  dialogState: initialDialogState,
});

export function cardListWithABMDialogReducer<TItem>(
  state: CardListWithABMDialogReducerState<TItem>,
  action: CardListWithABMDialogReducerAction<TItem>,
): CardListWithABMDialogReducerState<TItem> {
  switch (action.type) {
    case 'open-add':
      return { dialogType: 'add', dialogItem: null, dialogState: 'open' };
    case 'open-edit':
      return { dialogType: 'edit', dialogItem: action.item, dialogState: 'open' };
    case 'open-remove':
      return { dialogType: 'remove', dialogItem: action.item, dialogState: 'open' };
    case 'submit':
      return { dialogType: null, dialogItem: null, dialogState: 'submitting' };
    case 'close':
      return { ...state, dialogState: 'closed' };
    default:
      return { ...state };
  }
}
