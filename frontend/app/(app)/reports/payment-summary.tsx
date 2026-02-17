import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, DataTable, ActivityIndicator, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import ReportActions from '@/components/ReportActions';

export default function PaymentSummaryScreen() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['payment-summary'],
    queryFn: async () => {
      const res = await api.get('/reports/payment-summary');
      return res.data.data;
    },
  });

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'completed': return colors.credit;
      case 'pending': return colors.warning;
      case 'failed': return colors.error;
      default: return colors.textSecondary;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
        <Text variant="headlineSmall" style={{ fontWeight: '700' }}>{t('report.paymentReport')}</Text>
        {data?.payments?.length > 0 && <ReportActions />}
      </View>

      <View style={styles.statsRow}>
        <Surface style={styles.statCard}>
          <Text style={styles.statLabel}>{t('payment.collect')}</Text>
          <Text style={[styles.statValue, { color: colors.credit }]}>
            {formatCurrency(data?.summary?.total_collected ?? 0)}
          </Text>
        </Surface>
        <Surface style={styles.statCard}>
          <Text style={styles.statLabel}>{t('payment.send')}</Text>
          <Text style={[styles.statValue, { color: colors.debit }]}>
            {formatCurrency(data?.summary?.total_sent ?? 0)}
          </Text>
        </Surface>
        <Surface style={styles.statCard}>
          <Text style={styles.statLabel}>{t('payment.pending')}</Text>
          <Text style={[styles.statValue, { color: colors.warning }]}>
            {formatCurrency(data?.summary?.total_pending ?? 0)}
          </Text>
        </Surface>
      </View>

      <Surface style={styles.tableCard}>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>{t('common.type')}</DataTable.Title>
            <DataTable.Title>{t('payment.gateway')}</DataTable.Title>
            <DataTable.Title numeric>{t('common.amount')}</DataTable.Title>
            <DataTable.Title>{t('common.status')}</DataTable.Title>
            <DataTable.Title>{t('common.date')}</DataTable.Title>
          </DataTable.Header>

          {data?.payments?.map((p: any) => (
            <DataTable.Row key={p.id}>
              <DataTable.Cell>
                <Chip compact style={{ backgroundColor: p.type === 'collect' ? '#F0FFF4' : '#FFF0F0' }}>
                  {p.type === 'collect' ? t('payment.collect') : t('payment.send')}
                </Chip>
              </DataTable.Cell>
              <DataTable.Cell>{p.gateway}</DataTable.Cell>
              <DataTable.Cell numeric>
                <Text style={{ fontWeight: 'bold' }}>{formatCurrency(p.amount)}</Text>
              </DataTable.Cell>
              <DataTable.Cell>
                <Text style={{ color: statusColor(p.status), fontWeight: '600', fontSize: 12 }}>
                  {p.status}
                </Text>
              </DataTable.Cell>
              <DataTable.Cell>{p.created_at}</DataTable.Cell>
            </DataTable.Row>
          ))}

          {(!data?.payments || data.payments.length === 0) && (
            <DataTable.Row>
              <DataTable.Cell><Text style={{ color: colors.textHint }}>{t('common.noData')}</Text></DataTable.Cell>
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontWeight: '700', marginBottom: spacing.lg },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: spacing.base },
  statCard: { flex: 1, padding: spacing.md, borderRadius: 12, elevation: 1, alignItems: 'center', backgroundColor: '#fff' },
  statLabel: { fontSize: 11, color: colors.textSecondary },
  statValue: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  tableCard: { borderRadius: 12, elevation: 1 },
});
