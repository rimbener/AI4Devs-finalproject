import { ScreenContainer, spacing } from '@helsoft/components';
import { ApiKeyGate, PdfDocuments } from '@helsoft/study-buddy';

export default function PdfFilesScreen() {
  return (
    <ScreenContainer style={{ gap: spacing.s3, padding: spacing.s5 }}>
      <ApiKeyGate>
        <PdfDocuments />
      </ApiKeyGate>
    </ScreenContainer>
  );
}
