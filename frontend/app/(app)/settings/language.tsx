import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, RadioButton, Text, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import i18n from '@/services/i18n';
import { enableRTL, disableRTL } from '@/utils/rtl';
import { colors, spacing } from '@/theme';

export default function LanguageSettingsScreen() {
  const { t } = useTranslation();
  const [language, setLanguage] = React.useState(i18n.language);

  const changeLanguage = async (lang: string) => {
    setLanguage(lang);
    await i18n.changeLanguage(lang);
    if (lang === 'ur') {
      enableRTL();
    } else {
      disableRTL();
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text variant="titleMedium" style={styles.sectionTitle}>{t('settings.language')}</Text>

      <RadioButton.Group onValueChange={changeLanguage} value={language}>
        <List.Item
          title="English"
          description="Default language"
          right={() => <RadioButton value="en" />}
          onPress={() => changeLanguage('en')}
        />
        <Divider />
        <List.Item
          title="اردو"
          description="Urdu - Right to Left"
          right={() => <RadioButton value="ur" />}
          onPress={() => changeLanguage('ur')}
        />
      </RadioButton.Group>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  sectionTitle: { padding: spacing.base, fontWeight: '600' },
});
