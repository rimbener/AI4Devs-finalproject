import {
  CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID,
  cardListItemCardTestId,
  cardListItemEditTestId,
  cardListItemRemoveTestId,
} from './card-list-with-abm-dialog.helpers';

describe('card-list-with-abm-dialog helpers', () => {
  it('exports the list testID', () => {
    expect(CARD_LIST_WITH_ABM_DIALOG_LIST_TEST_ID).toBe('card-list-with-abm-dialog-list');
  });

  it('builds stable per-item card / edit / remove testIDs', () => {
    expect(cardListItemCardTestId('item-1')).toBe('card-list-with-abm-dialog-card-item-1');
    expect(cardListItemEditTestId('item-1')).toBe('card-list-with-abm-dialog-edit-item-1');
    expect(cardListItemRemoveTestId('item-1')).toBe('card-list-with-abm-dialog-remove-item-1');
  });
});
