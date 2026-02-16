import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, ActivityIndicator } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

export default function AdminDashboardScreen() {
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
    { label: 'Total Users', value: data?.total_users ?? 0, icon: '👥' },
    { label: 'Active Users', value: data?.active_users ?? 0, icon: '✅' },
    { label: 'Total Businesses', value: data?.total_tenants ?? 0, icon: '🏢' },
    { label: 'Active Businesses', value: data?.active_tenants ?? 0, icon: '🟢' },
    { label: 'Total Parties', value: data?.total_parties ?? 0, icon: '🤝' },
    { label: 'Total Transactions', value: data?.total_transactions ?? 0, icon: '📝' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.title}>System Overview</Text>

      <View style={styles.grid}>
        {stats.map((stat) => (
          <Surface key={stat.label} style={styles.card}>
            <Text style={styles.icon}>{stat.icon}</Text>
            <Text variant="headlineMedium" style={styles.value}>
              {stat.value}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>{stat.label}</Text>
          </Surface>
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
  card: {
    width: '48%',
    padding: spacing.base,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    marginBottom: spacing.xs,
  },
  icon: { fontSize: 28, marginBottom: 6 },
  value: { fontWeight: '700', color: colors.primary },
  statLabel: { color: colors.textSecondary, textAlign: 'center', marginTop: 2 },
});
