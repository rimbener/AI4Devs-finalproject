import { useCallback, useEffect, useReducer } from 'react';

import { usePdfUpload } from '../pdf-upload/use-pdf-upload';
import type { NewLessonDialogProps } from './new-lesson-dialog.types';
import {
  initialNewLessonDialogState,
  newLessonDialogReducer,
} from './use-new-lesson-dialog.reducer';

/**
 * Dialog open/step/documentId + pdf upload chooseFile (must stay on the trigger press).
 * Handlers stay in the component — hook exposes state + setters/actions.
 */
export const useNewLessonDialog = ({
  onExtracted,
  generateDocumentId,
  onGenerateHandled,
}: Pick<NewLessonDialogProps, 'onExtracted' | 'generateDocumentId' | 'onGenerateHandled'>) => {
  const [state, dispatch] = useReducer(newLessonDialogReducer, initialNewLessonDialogState);

  const handleExtracted = useCallback(
    (documentId: string) => {
      dispatch({ type: 'extracted', documentId });
      onExtracted?.(documentId);
    },
    [onExtracted],
  );

  const { chooseFile, panelProps, resetUpload } = usePdfUpload({
    onExtracted: handleExtracted,
  });

  useEffect(() => {
    if (!generateDocumentId) return;
    dispatch({ type: 'open-generate', documentId: generateDocumentId });
    onGenerateHandled?.();
  }, [generateDocumentId, onGenerateHandled]);

  const openUpload = useCallback(() => {
    dispatch({ type: 'open-upload' });
  }, []);

  const close = useCallback(() => {
    dispatch({ type: 'close' });
  }, []);

  return {
    open: state.open,
    step: state.step,
    documentId: state.documentId,
    panelProps,
    chooseFile,
    resetUpload,
    openUpload,
    close,
  };
};
