import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, DataTable, ActivityIndicator } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import { formatDate } from '@/utils/formatDate';

export default function AdminBusinessReport() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports', 'businesses'],
    queryFn: async () => {
      const res = await api.get('/admin/reports/businesses');
      return res.data;
    },
  });

  if (isLoading) return <ActivityIndicator style={{ flex: 1, marginTop: 60 }} />;

  const businesses = data?.data?.businesses ?? [];
  const total = data?.data?.total ?? businesses.length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.title}>{t('admin.businessReport')}</Text>

      <Surface style={styles.summaryCard}>
        <Text variant="headlineMedium" style={styles.summaryNum}>{total}</Text>
        <Text variant="bodySmall" style={styles.summaryLabel}>{t('admin.totalBusinesses')}</Text>
      </Surface>

      <Surface style={styles.tableWrap}>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>{t('common.name')}</DataTable.Title>
            <DataTable.Title numeric>{t('admin.users')}</DataTable.Title>
            <DataTable.Title numeric>{t('nav.parties')}</DataTable.Title>
            <DataTable.Title numeric>{t('nav.transactions')}</DataTable.Title>
            <DataTable.Title>{t('common.date')}</DataTable.Title>
          </DataTable.Header>
          {businesses.map((b: any) => (
            <DataTable.Row key={b.id}>
              <DataTable.Cell>{b.name ?? b.business_name ?? '-'}</DataTable.Cell>
              <DataTable.Cell numeric>{b.users_count ?? 0}</DataTable.Cell>
              <DataTable.Cell numeric>{b.parties_count ?? 0}</DataTable.Cell>
              <DataTable.Cell numeric>{b.transactions_count ?? 0}</DataTable.Cell>
              <DataTable.Cell>{formatDate(b.created_at)}</DataTable.Cell>
            </DataTable.Row>
          ))}
          {businesses.length === 0 && (
            <DataTable.Row>
              <DataTable.Cell>{t('common.noResults')}</DataTable.Cell>
            </DataTable.Row>
          )}
        </DataTable>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: 40 },
  title: { fontWeight: '700', marginBottom: spacing.base },
  summaryCard: { padding: spacing.base, borderRadius: 14, backgroundColor: '#F0FFF4', marginBottom: 16, alignItems: 'center' },
  summaryNum: { fontWeight: '700', color: '#10B981' },
  summaryLabel: { color: colors.textSecondary, marginTop: 2 },
  tableWrap: { borderRadius: 12, elevation: 1, backgroundColor: '#fff', overflow: 'hidden' },
});
