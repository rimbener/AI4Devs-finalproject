import { createContext, type ReactNode, useContext } from 'react';

import type { LessonGenerationPanelValue } from './lesson-generation-panel.types';

const LessonGenerationPanelContext = createContext<LessonGenerationPanelValue | null>(null);

type LessonGenerationPanelProviderProps = {
  value: LessonGenerationPanelValue;
  children: ReactNode;
};

export const LessonGenerationPanelProvider = ({
  value,
  children,
}: LessonGenerationPanelProviderProps) => (
  <LessonGenerationPanelContext.Provider value={value}>
    {children}
  </LessonGenerationPanelContext.Provider>
);

export const useLessonGenerationPanel = (): LessonGenerationPanelValue => {
  const value = useContext(LessonGenerationPanelContext);
  if (!value) {
    throw new Error('useLessonGenerationPanel must be used within LessonGenerationPanelProvider');
  }
  return value;
};
