import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, DataTable, ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import { formatCurrency, formatCurrencyUrdu } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import ReportActions from '@/components/ReportActions';
import DateInput from '@/components/DateInput';

export default function ReceivableAgingScreen() {
  const { t } = useTranslation();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['receivable-aging', dateFrom, dateTo],
    queryFn: async () => {
      const params: any = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await api.get('/reports/receivable-aging', { params });
      return res.data.data;
    },
  });

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header with actions */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.base }}>
        <Text variant="headlineSmall" style={{ fontWeight: '700' }}>Receivable Aging</Text>
        {data?.parties?.length > 0 && <ReportActions reportTitle="Receivable_Aging" />}
      </View>

      {/* Date Filters */}
      <Surface style={styles.filterCard} nativeID="report-filter-card">
        <View style={styles.filterRow}>
          <View style={{ flex: 1, minWidth: 130 }}>
            <DateInput label="From Date" value={dateFrom} onChangeText={setDateFrom} />
          </View>
          <View style={{ flex: 1, minWidth: 130 }}>
            <DateInput label="To Date" value={dateTo} onChangeText={setDateTo} />
          </View>
        </View>
      </Surface>

      <View nativeID="printable-report">
      <View style={styles.summaryRow}>
        <Surface style={[styles.summaryCard, { backgroundColor: '#FFEBEE' }]}>
          <Text style={styles.summaryLabel}>{t('report.receivableAging')}</Text>
          <Text style={[styles.summaryValue, { color: colors.debit }]}>
            {formatCurrency(data?.total ?? 0)}
          </Text>
          <Text style={styles.urduAmt}>{formatCurrencyUrdu(data?.total ?? 0)}</Text>
          <Text style={styles.summaryCount}>{data?.count ?? 0} {t('dashboard.parties')}</Text>
        </Surface>
      </View>

      <Surface style={styles.tableCard}>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>{t('party.name')}</DataTable.Title>
            <DataTable.Title>{t('party.mobile')}</DataTable.Title>
            <DataTable.Title numeric>{t('party.balance')}</DataTable.Title>
            <DataTable.Title numeric>{t('session.lastActive')}</DataTable.Title>
          </DataTable.Header>

          {data?.parties?.map((party: any) => (
            <DataTable.Row key={party.id}>
              <DataTable.Cell>{party.name}</DataTable.Cell>
              <DataTable.Cell>{party.mobile || '—'}</DataTable.Cell>
              <DataTable.Cell numeric>
                <Text style={{ color: colors.debit, fontWeight: 'bold' }}>
                  {formatCurrency(party.balance)}
                </Text>
              </DataTable.Cell>
              <DataTable.Cell numeric>{formatDate(party.last_txn_date)}</DataTable.Cell>
            </DataTable.Row>
          ))}

          {(!data?.parties || data.parties.length === 0) && (
            <DataTable.Row>
              <DataTable.Cell><Text style={{ color: colors.textHint }}>{t('common.noData')}</Text></DataTable.Cell>
            </DataTable.Row>
          )}
        </DataTable>
      </Surface>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  summaryRow: { marginBottom: spacing.base },
  summaryCard: { padding: spacing.base, borderRadius: 12, elevation: 2, alignItems: 'center' },
  summaryLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },
  summaryValue: { fontSize: 24, fontWeight: 'bold', marginTop: 4 },
  urduAmt: { fontSize: 11, color: '#8A8FA8', marginTop: 2, fontFamily: 'serif' },
  summaryCount: { fontSize: 11, color: colors.textHint, marginTop: 2 },
  tableCard: { borderRadius: 12, elevation: 1 },
  filterCard: { padding: spacing.base, borderRadius: 12, marginBottom: spacing.base, elevation: 1 },
  filterRow: { flexDirection: 'row', gap: spacing.md },
});
