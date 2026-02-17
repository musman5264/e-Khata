import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, spacing } from '@/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface ReportItem {
  label: string;
  icon: IconName;
  route: string;
  color: string;
  bg: string;
  description: string;
}

export default function ReportsIndexScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const reports: ReportItem[] = [
    {
      label: t('report.trialBalance'),
      icon: 'scale-balance',
      route: '/(app)/reports/trial-balance',
      color: colors.primary,
      bg: '#EEF0FF',
      description: 'All party balances at a glance',
    },
    {
      label: t('report.daybook'),
      icon: 'book-open-page-variant',
      route: '/(app)/(tabs)/daybook',
      color: '#8B5CF6',
      bg: '#F3E8FF',
      description: 'Daily transaction entries',
    },
    {
      label: t('report.receivableAging'),
      icon: 'arrow-bottom-left',
      route: '/(app)/reports/receivable-aging',
      color: colors.debit,
      bg: '#FFF0F0',
      description: 'Parties who owe you money',
    },
    {
      label: t('report.payableAging'),
      icon: 'arrow-top-right',
      route: '/(app)/reports/payable-aging',
      color: colors.credit,
      bg: '#F0FFF4',
      description: 'Parties you owe money to',
    },
    {
      label: t('report.paymentReport'),
      icon: 'credit-card-outline',
      route: '/(app)/reports/payment-summary',
      color: '#E84393',
      bg: '#FFF0F6',
      description: 'Payment gateway summary',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.title}>{t('report.title')}</Text>

      <View style={styles.grid}>
        {reports.map((r) => (
          <TouchableOpacity key={r.route} style={styles.card} onPress={() => router.push(r.route as any)} activeOpacity={0.7}>
            <Surface style={styles.cardInner}>
              <View style={[styles.iconWrap, { backgroundColor: r.bg }]}>
                <MaterialCommunityIcons name={r.icon} size={24} color={r.color} />
              </View>
              <Text variant="titleSmall" style={styles.cardLabel}>{r.label}</Text>
              <Text variant="bodySmall" style={styles.cardDesc}>{r.description}</Text>
            </Surface>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: 40 },
  title: { fontWeight: '700', marginBottom: spacing.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '48%', minWidth: 160 },
  cardInner: { padding: spacing.base, borderRadius: 14, elevation: 1, backgroundColor: '#fff' },
  iconWrap: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  cardLabel: { fontWeight: '600', marginBottom: 4 },
  cardDesc: { color: colors.textSecondary, fontSize: 11 },
});
