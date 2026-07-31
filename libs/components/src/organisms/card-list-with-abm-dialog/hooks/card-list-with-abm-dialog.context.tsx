import { createContext, type ReactNode, useContext } from 'react';
import type { CardListWithABMDialogValue } from './card-list-with-abm-dialog.context.types';

// createContext can't be generic — store as unknown; Provider/hook reintroduce TItem via cast.
const CardListWithABMDialogContext = createContext<CardListWithABMDialogValue<unknown> | null>(
  null,
);

type CardListWithABMDialogProviderProps<TItem> = {
  value: CardListWithABMDialogValue<TItem>;
  children: ReactNode;
};

export const CardListWithABMDialogProvider = <TItem,>({
  value,
  children,
}: CardListWithABMDialogProviderProps<TItem>) => (
  <CardListWithABMDialogContext.Provider value={value as CardListWithABMDialogValue<unknown>}>
    {children}
  </CardListWithABMDialogContext.Provider>
);

export const useCardListWithABMDialogContext = <TItem,>(): CardListWithABMDialogValue<TItem> => {
  const value = useContext(CardListWithABMDialogContext);
  if (!value) {
    throw new Error(
      'useCardListWithABMDialogContext must be used within CardListWithABMDialogProvider',
    );
  }

  return value as CardListWithABMDialogValue<TItem>;
};
