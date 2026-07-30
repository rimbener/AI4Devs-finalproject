import { LanguageSettings, ScreenContainer } from '@helsoft/components';
import { ApiKeySettingsButton, SettingsSignOut } from '@helsoft/study-buddy';

export default function SettingsScreen() {
  return (
    <ScreenContainer>
      <LanguageSettings />
      <ApiKeySettingsButton />
      <SettingsSignOut />
    </ScreenContainer>
  );
}
