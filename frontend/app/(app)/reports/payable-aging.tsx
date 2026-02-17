import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, DataTable, ActivityIndicator, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import { formatCurrency, formatCurrencyUrdu } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import ReportActions from '@/components/ReportActions';
import DateInput from '@/components/DateInput';
import SortableHeader, { toggleSort, sortData, type SortOrder } from '@/components/SortableHeader';
import { useCurrentBusiness } from '@/hooks/useCurrentBusiness';

export default function PayableAgingScreen() {
  const { t } = useTranslation();
  const businessInfo = useCurrentBusiness();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Filters
  const [searchName, setSearchName] = useState('');
  const [minBalance, setMinBalance] = useState('');

  // Sort
  const [sortBy, setSortBy] = useState('balance');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (key: string) => {
    const result = toggleSort(sortBy, sortOrder, key);
    setSortBy(result.sortBy);
    setSortOrder(result.sortOrder);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['payable-aging', dateFrom, dateTo],
    queryFn: async () => {
      const params: any = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await api.get('/reports/payable-aging', { params });
      return res.data.data;
    },
  });

  const filteredParties = useMemo(() => {
    let parties = data?.parties || [];
    if (searchName) {
      const q = searchName.toLowerCase();
      parties = parties.filter((p: any) => p.name?.toLowerCase().includes(q) || p.mobile?.includes(searchName));
    }
    if (minBalance) {
      const min = parseFloat(minBalance);
      if (!isNaN(min)) parties = parties.filter((p: any) => p.balance >= min);
    }
    return sortData(parties, sortBy, sortOrder);
  }, [data?.parties, searchName, minBalance, sortBy, sortOrder]);

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header with actions */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.base }}>
        <Text variant="headlineSmall" style={{ fontWeight: '700' }}>Payable Aging</Text>
        {filteredParties.length > 0 && <ReportActions reportTitle="Payable_Aging" businessInfo={businessInfo} />}
      </View>

      {/* Filters */}
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
              label="Search Party / Mobile"
              value={searchName}
              onChangeText={setSearchName}
              mode="outlined"
              dense
              left={<TextInput.Icon icon="magnify" />}
              style={{ backgroundColor: '#fff', fontSize: 13 }}
            />
          </View>
          <View style={{ flex: 1, minWidth: 100 }}>
            <TextInput
              label="Min Balance"
              value={minBalance}
              onChangeText={setMinBalance}
              mode="outlined"
              dense
              keyboardType="numeric"
              left={<TextInput.Icon icon="currency-inr" />}
              style={{ backgroundColor: '#fff', fontSize: 13 }}
            />
          </View>
        </View>
      </Surface>

      <View nativeID="printable-report">
      <View style={styles.summaryRow}>
        <Surface style={[styles.summaryCard, { backgroundColor: '#E0F2F1' }]}>
          <Text style={styles.summaryLabel}>{t('report.payableAging')}</Text>
          <Text style={[styles.summaryValue, { color: colors.credit }]}>
            {formatCurrency(data?.total ?? 0)}
          </Text>
          <Text style={styles.urduAmt}>{formatCurrencyUrdu(data?.total ?? 0)}</Text>
          <Text style={styles.summaryCount}>{filteredParties.length} {t('dashboard.parties')}</Text>
        </Surface>
      </View>

      <Surface style={styles.tableCard}>
        <DataTable>
          <DataTable.Header>
            <SortableHeader label={t('party.name')} sortKey="name" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
            <SortableHeader label={t('party.mobile')} sortKey="mobile" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} />
            <SortableHeader label={t('party.balance')} sortKey="balance" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} numeric />
            <SortableHeader label={t('session.lastActive')} sortKey="last_txn_date" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} numeric />
          </DataTable.Header>

          {filteredParties.map((party: any) => (
            <DataTable.Row key={party.id}>
              <DataTable.Cell>{party.name}</DataTable.Cell>
              <DataTable.Cell>{party.mobile || '—'}</DataTable.Cell>
              <DataTable.Cell numeric>
                <Text style={{ color: colors.credit, fontWeight: 'bold' }}>
                  {formatCurrency(party.balance)}
                </Text>
              </DataTable.Cell>
              <DataTable.Cell numeric>{formatDate(party.last_txn_date)}</DataTable.Cell>
            </DataTable.Row>
          ))}

          {filteredParties.length === 0 && (
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
