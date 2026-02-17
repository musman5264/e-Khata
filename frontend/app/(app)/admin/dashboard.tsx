import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface, ActivityIndicator } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

export default function AdminDashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard');
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const stats = [
    { label: t('dashboard.totalUsers'), value: data?.total_users ?? 0, icon: '👥', route: '/(app)/admin/reports/users' },
    { label: t('dashboard.activeUsers'), value: data?.active_users ?? 0, icon: '✅', route: '/(app)/admin/reports/activity' },
    { label: t('dashboard.totalBusinesses'), value: data?.total_tenants ?? 0, icon: '🏢', route: '/(app)/admin/reports/businesses' },
    { label: t('dashboard.activeBusinesses'), value: data?.active_tenants ?? 0, icon: '🟢', route: '/(app)/admin/tenants' },
    { label: t('dashboard.totalParties'), value: data?.total_parties ?? 0, icon: '🤝', route: '/(app)/admin/reports/businesses' },
    { label: t('dashboard.totalTransactions'), value: data?.total_transactions ?? 0, icon: '📝', route: '/(app)/admin/reports/businesses' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.title}>{t('dashboard.systemOverview')}</Text>

      <View style={styles.grid}>
        {stats.map((stat) => (
          <TouchableOpacity
            key={stat.label}
            style={styles.cardWrap}
            activeOpacity={0.7}
            onPress={() => router.push(stat.route as any)}
          >
            <Surface style={styles.card}>
              <Text style={styles.icon}>{stat.icon}</Text>
              <Text variant="headlineMedium" style={styles.value}>
                {stat.value}
              </Text>
              <Text variant="bodySmall" style={styles.statLabel}>{stat.label}</Text>
            </Surface>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontWeight: '700', marginBottom: spacing.lg },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cardWrap: {
    width: '48%',
    marginBottom: spacing.xs,
  },
  card: {
    padding: spacing.base,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  icon: { fontSize: 28, marginBottom: 6 },
  value: { fontWeight: '700', color: colors.primary },
  statLabel: { color: colors.textSecondary, textAlign: 'center', marginTop: 2 },
});
