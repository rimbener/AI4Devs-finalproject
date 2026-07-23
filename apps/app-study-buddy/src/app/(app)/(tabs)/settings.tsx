import { LanguageSettings, ScreenContainer } from '@helsoft/components';
import { ApiKeySettings, SettingsSignOut } from '@helsoft/study-buddy';

export default function SettingsScreen() {
  return (
    <ScreenContainer>
      <LanguageSettings />
      <ApiKeySettings />
      <SettingsSignOut />
    </ScreenContainer>
  );
}
