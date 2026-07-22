import { ScreenContainer, spacing } from '@helsoft/components';
import { SavedLessons } from '@helsoft/study-buddy';

export default function HomeScreen() {
  return (
    <ScreenContainer style={{ gap: spacing.s3, padding: spacing.s5 }}>
      <SavedLessons />
    </ScreenContainer>
  );
}
