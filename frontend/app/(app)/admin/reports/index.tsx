import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, spacing } from '@/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export default function AdminReportsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const reports = [
    {
      label: t('admin.userReport'), icon: 'account-group' as IconName,
      route: '/(app)/admin/reports/users', color: colors.primary, bg: '#EEF0FF',
      description: 'All users, roles & activity',
    },
    {
      label: t('admin.businessReport'), icon: 'store' as IconName,
      route: '/(app)/admin/reports/businesses', color: '#10B981', bg: '#F0FFF4',
      description: 'Businesses, parties, transactions',
    },
    {
      label: t('admin.activityReport'), icon: 'history' as IconName,
      route: '/(app)/admin/reports/activity', color: '#F59E0B', bg: '#FFF8E1',
      description: 'Active sessions & login activity',
    },
    {
      label: 'Financial Overview', icon: 'chart-line' as IconName,
      route: '/(app)/admin/reports/financial', color: '#8B5CF6', bg: '#F5F0FF',
      description: 'System-wide debit, credit, net balance',
    },
    {
      label: 'Growth Metrics', icon: 'trending-up' as IconName,
      route: '/(app)/admin/reports/growth', color: '#EC4899', bg: '#FFF0F7',
      description: 'User, business & transaction growth',
    },
    {
      label: 'Payment Summary', icon: 'cash-multiple' as IconName,
      route: '/(app)/admin/reports/payments', color: '#06B6D4', bg: '#ECFEFF',
      description: 'Collections, methods & monthly trends',
    },
    {
      label: 'Session Analytics', icon: 'monitor-cellphone' as IconName,
      route: '/(app)/admin/reports/sessions', color: '#EF4444', bg: '#FFF0F0',
      description: 'Browser, OS, device & login trends',
    },
    {
      label: 'Version History', icon: 'source-branch' as IconName,
      route: '/(app)/admin/reports/versions', color: '#14B8A6', bg: '#F0FDFA',
      description: 'Release timeline & changelog',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.title}>{t('admin.reports')}</Text>
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
