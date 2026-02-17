import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Surface, DataTable } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import ReportActions from '@/components/ReportActions';

export default function TrialBalanceScreen() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['trial-balance'],
    queryFn: async () => {
      const res = await api.get('/reports/trial-balance');
      return res.data.data;
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header with actions */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.base }}>
        <Text variant="headlineSmall" style={{ fontWeight: '700' }}>Trial Balance</Text>
        {data?.parties?.length > 0 && <ReportActions reportTitle="Trial_Balance" />}
      </View>

      <View nativeID="printable-report">
      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <Surface style={[styles.summaryCard, { backgroundColor: '#FFEBEE' }]}>
          <Text style={styles.summaryLabel}>{t('dashboard.receivable')}</Text>
          <Text style={[styles.summaryValue, { color: colors.debit }]}>
            {formatCurrency(data?.totals?.total_debit_balance ?? 0)}
          </Text>
        </Surface>
        <Surface style={[styles.summaryCard, { backgroundColor: '#E0F2F1' }]}>
          <Text style={styles.summaryLabel}>{t('dashboard.payable')}</Text>
          <Text style={[styles.summaryValue, { color: colors.credit }]}>
            {formatCurrency(data?.totals?.total_credit_balance ?? 0)}
          </Text>
        </Surface>
      </View>

      {/* Trial Balance Table */}
      <Card style={styles.tableCard} mode="outlined">
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>{t('party.name')}</DataTable.Title>
            <DataTable.Title numeric>{t('transaction.debit')}</DataTable.Title>
            <DataTable.Title numeric>{t('transaction.credit')}</DataTable.Title>
            <DataTable.Title numeric>{t('party.balance')}</DataTable.Title>
          </DataTable.Header>

          {data?.parties?.map((party: any) => (
            <DataTable.Row key={party.id}>
              <DataTable.Cell>{party.name}</DataTable.Cell>
              <DataTable.Cell numeric>
                <Text style={{ color: colors.debit }}>{formatCurrency(party.debit_balance)}</Text>
              </DataTable.Cell>
              <DataTable.Cell numeric>
                <Text style={{ color: colors.credit }}>{formatCurrency(party.credit_balance)}</Text>
              </DataTable.Cell>
              <DataTable.Cell numeric>
                <Text style={{
                  color: party.net_balance > 0 ? colors.debit : party.net_balance < 0 ? colors.credit : colors.neutral,
                  fontWeight: 'bold',
                }}>
                  {formatCurrency(Math.abs(party.net_balance ?? 0))}
                </Text>
              </DataTable.Cell>
            </DataTable.Row>
          ))}

          <DataTable.Row style={{ backgroundColor: colors.surface }}>
            <DataTable.Cell><Text style={{ fontWeight: 'bold' }}>{t('common.total')}</Text></DataTable.Cell>
            <DataTable.Cell numeric>
              <Text style={{ fontWeight: 'bold', color: colors.debit }}>{formatCurrency(data?.totals?.total_debit_balance ?? 0)}</Text>
            </DataTable.Cell>
            <DataTable.Cell numeric>
              <Text style={{ fontWeight: 'bold', color: colors.credit }}>{formatCurrency(data?.totals?.total_credit_balance ?? 0)}</Text>
            </DataTable.Cell>
            <DataTable.Cell numeric>
              <Text style={{ fontWeight: 'bold' }}>{formatCurrency(data?.totals?.net_balance ?? 0)}</Text>
            </DataTable.Cell>
          </DataTable.Row>
        </DataTable>
      </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: 40 },
  summaryRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.base },
  summaryCard: { flex: 1, padding: spacing.md, borderRadius: 12, elevation: 2, alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: colors.textSecondary },
  summaryValue: { fontSize: 18, fontWeight: 'bold', marginTop: 2 },
  tableCard: { borderRadius: 12 },
});
