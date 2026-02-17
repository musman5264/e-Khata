import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Surface, DataTable, TextInput, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import { formatCurrency, formatCurrencyUrdu } from '@/utils/formatCurrency';
import ReportActions from '@/components/ReportActions';
import DateInput from '@/components/DateInput';
import SortableHeader, { toggleSort, sortData, type SortOrder } from '@/components/SortableHeader';
import { useCurrentBusiness } from '@/hooks/useCurrentBusiness';

export default function TrialBalanceScreen() {
  const { t } = useTranslation();
  const businessInfo = useCurrentBusiness();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Filters
  const [searchName, setSearchName] = useState('');
  const [balanceType, setBalanceType] = useState<'all' | 'debit' | 'credit'>('all');

  // Sort
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (key: string) => {
    const result = toggleSort(sortBy, sortOrder, key);
    setSortBy(result.sortBy);
    setSortOrder(result.sortOrder);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['trial-balance', dateFrom, dateTo],
    queryFn: async () => {
      const params: any = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await api.get('/reports/trial-balance', { params });
      return res.data.data;
    },
  });

  // Apply client-side filters + sort
  const filteredParties = useMemo(() => {
    let parties = data?.parties || [];
    if (searchName) {
      const q = searchName.toLowerCase();
      parties = parties.filter((p: any) => p.name?.toLowerCase().includes(q));
    }
    if (balanceType === 'debit') parties = parties.filter((p: any) => p.net_balance > 0);
    if (balanceType === 'credit') parties = parties.filter((p: any) => p.net_balance < 0);

    // Map sort keys
    const mapped = parties.map((p: any) => ({
      ...p,
      debit: p.debit_balance,
      credit: p.credit_balance,
      balance: Math.abs(p.net_balance ?? 0),
    }));
    return sortData(mapped, sortBy, sortOrder);
  }, [data?.parties, searchName, balanceType, sortBy, sortOrder]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header with actions */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.base }}>
        <Text variant="headlineSmall" style={{ fontWeight: '700' }}>Trial Balance</Text>
        {filteredParties.length > 0 && <ReportActions reportTitle="Trial_Balance" businessInfo={businessInfo} />}
      </View>

      {/* Date Filters + Search + Balance Type */}
      <Surface style={styles.filterCard} nativeID="report-filter-card">
        <View style={styles.filterRow}>
          <View style={{ flex: 1, minWidth: 130 }}>
            <DateInput label="From Date" value={dateFrom} onChangeText={setDateFrom} />
          </View>
          <View style={{ flex: 1, minWidth: 130 }}>
            <DateInput label="To Date" value={dateTo} onChangeText={setDateTo} />
          </View>
        </View>
        <View style={[styles.filterRow, { marginTop: 10 }]}>
          <View style={{ flex: 2, minWidth: 160 }}>
            <TextInput
              label="Search Party"
              value={searchName}
              onChangeText={setSearchName}
              mode="outlined"
              dense
              left={<TextInput.Icon icon="magnify" />}
              style={{ backgroundColor: '#fff', fontSize: 13 }}
            />
          </View>
          <View style={{ flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {(['all', 'debit', 'credit'] as const).map((bt) => (
              <Chip
                key={bt}
                selected={balanceType === bt}
                onPress={() => setBalanceType(bt)}
                compact
                style={{ backgroundColor: balanceType === bt ? (bt === 'debit' ? '#FFEBEE' : bt === 'credit' ? '#E0F2F1' : '#E8EAF6') : '#f5f5f5' }}
                textStyle={{ fontSize: 11, fontWeight: '600' }}
              >
                {bt === 'all' ? 'All' : bt === 'debit' ? 'Receivable' : 'Payable'}
              </Chip>
            ))}
          </View>
        </View>
      </Surface>

      <View nativeID="printable-report">
      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <Surface style={[styles.summaryCard, { backgroundColor: '#FFEBEE' }]}>
          <Text style={styles.summaryLabel}>{t('dashboard.receivable')}</Text>
          <Text style={[styles.summaryValue, { color: colors.debit }]}>
            {formatCurrency(data?.totals?.total_debit_balance ?? 0)}
          </Text>
          <Text style={styles.urduAmt}>{formatCurrencyUrdu(data?.totals?.total_debit_balance ?? 0)}</Text>
        </Surface>
        <Surface style={[styles.summaryCard, { backgroundColor: '#E0F2F1' }]}>
          <Text style={styles.summaryLabel}>{t('dashboard.payable')}</Text>
          <Text style={[styles.summaryValue, { color: colors.credit }]}>
            {formatCurrency(data?.totals?.total_credit_balance ?? 0)}
          </Text>
          <Text style={styles.urduAmt}>{formatCurrencyUrdu(data?.totals?.total_credit_balance ?? 0)}</Text>
        </Surface>
      </View>

      {/* Trial Balance Table */}
      <Card style={styles.tableCard} mode="outlined">
        <DataTable>
          <DataTable.Header>
            <SortableHeader label={t('party.name')} sortKey="name" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
            <SortableHeader label={t('transaction.debit')} sortKey="debit" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} numeric />
            <SortableHeader label={t('transaction.credit')} sortKey="credit" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} numeric />
            <SortableHeader label={t('party.balance')} sortKey="balance" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} numeric />
          </DataTable.Header>

          {filteredParties.map((party: any) => (
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
  urduAmt: { fontSize: 10, color: '#8A8FA8', marginTop: 1, fontFamily: 'serif' },
  tableCard: { borderRadius: 12 },
  filterCard: { padding: spacing.base, borderRadius: 12, marginBottom: spacing.base, elevation: 1 },
  filterRow: { flexDirection: 'row', gap: spacing.md },
});
