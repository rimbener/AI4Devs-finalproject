import { LanguageSettings, ScreenContainer } from '@helsoft/components';
import { ApiKeySettingsSection, SettingsSignOut } from '@helsoft/study-buddy';

export default function SettingsScreen() {
  return (
    <ScreenContainer>
      <ApiKeySettingsSection />
      <LanguageSettings />
      <SettingsSignOut />
    </ScreenContainer>
  );
}
