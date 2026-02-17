import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { Text, Surface, ActivityIndicator, Button, DataTable, Divider, Chip, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import SearchableDropdown from '@/components/SearchableDropdown';
import ReportActions from '@/components/ReportActions';
import DateInput from '@/components/DateInput';
import SortableHeader, { toggleSort, sortData, type SortOrder } from '@/components/SortableHeader';
import { useCurrentBusiness } from '@/hooks/useCurrentBusiness';
import { formatDate } from '@/utils/formatDate';

export default function PartyStatementScreen() {
  const params = useLocalSearchParams<{ partyId?: string }>();
  const businessInfo = useCurrentBusiness();
  const { width } = useWindowDimensions();
  const isWide = width > 700;

  const [selectedPartyId, setSelectedPartyId] = useState<number | null>(
    params.partyId ? parseInt(params.partyId) : null
  );
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Filters
  const [searchDesc, setSearchDesc] = useState('');
  const [txnType, setTxnType] = useState<'all' | 'debit' | 'credit'>('all');

  // Sort
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const handleSort = (key: string) => {
    const result = toggleSort(sortBy, sortOrder, key);
    setSortBy(result.sortBy);
    setSortOrder(result.sortOrder);
  };

  // Fetch parties
  const { data: partiesData } = useQuery({
    queryKey: ['parties-list'],
    queryFn: async () => {
      const res = await api.get('/parties?per_page=200');
      return (res.data.data || []).map((p: any) => ({
        label: `${p.name}${p.khata_number ? ' (K-' + p.khata_number + ')' : ''}`,
        value: p.id,
      }));
    },
  });

  // Fetch statement
  const { data: statementData, isLoading, refetch } = useQuery({
    queryKey: ['party-statement', selectedPartyId, dateFrom, dateTo],
    queryFn: async () => {
      const p: any = {};
      if (dateFrom) p.date_from = dateFrom;
      if (dateTo) p.date_to = dateTo;
      const res = await api.get(`/reports/party-statement/${selectedPartyId}`, { params: p });
      return res.data.data;
    },
    enabled: !!selectedPartyId,
  });

  const statement = statementData;
  const entries = statement?.entries || [];

  const formatAmount = (val: number) =>
    val ? `Rs ${val.toLocaleString('en-PK', { minimumFractionDigits: 2 })}` : '-';

  // Apply filters + sort
  const filteredEntries = useMemo(() => {
    let items = entries;
    if (searchDesc) {
      const q = searchDesc.toLowerCase();
      items = items.filter((e: any) => e.description?.toLowerCase().includes(q) || e.reference?.toLowerCase().includes(q));
    }
    if (txnType === 'debit') items = items.filter((e: any) => e.debit > 0);
    if (txnType === 'credit') items = items.filter((e: any) => e.credit > 0);
    if (sortBy) return sortData(items, sortBy, sortOrder);
    return items;
  }, [entries, searchDesc, txnType, sortBy, sortOrder]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={[styles.headerRow, { justifyContent: 'space-between' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <MaterialCommunityIcons name="file-document-outline" size={28} color="#E84393" />
          <Text variant="headlineSmall" style={styles.title}>Party Statement</Text>
        </View>
        {entries.length > 0 && <ReportActions reportTitle="Party_Statement" businessInfo={businessInfo} />}
      </View>

      {/* Filters */}
      <Surface style={styles.filterCard} nativeID="report-filter-card">
        <View style={[styles.filterGrid, isWide && { flexDirection: 'row' }]}>
          <View style={{ flex: isWide ? 2 : 1, minWidth: 200 }}>
            <Text variant="labelMedium" style={styles.filterLabel}>Select Party</Text>
            <SearchableDropdown
              options={partiesData || []}
              selectedValue={selectedPartyId}
              onSelect={(v: any) => setSelectedPartyId(v)}
              placeholder="Choose a party..."
            />
          </View>
          <View style={{ flex: 1, minWidth: 130 }}>
            <DateInput label="From" value={dateFrom} onChangeText={setDateFrom} />
          </View>
          <View style={{ flex: 1, minWidth: 130 }}>
            <DateInput label="To" value={dateTo} onChangeText={setDateTo} />
          </View>
          <View style={{ justifyContent: 'flex-end' }}>
            <Button mode="contained" onPress={() => refetch()} disabled={!selectedPartyId} style={{ borderRadius: 8, marginTop: isWide ? 0 : 8 }} icon="file-eye">
              Generate
            </Button>
          </View>
        </View>
        {/* Additional Filters */}
        {entries.length > 0 && (
          <View style={[styles.filterGrid, isWide && { flexDirection: 'row' }, { marginTop: 10 }]}>
            <View style={{ flex: 2, minWidth: 160 }}>
              <TextInput
                label="Search Description / Ref"
                value={searchDesc}
                onChangeText={setSearchDesc}
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
                  selected={txnType === bt}
                  onPress={() => setTxnType(bt)}
                  compact
                  style={{ backgroundColor: txnType === bt ? (bt === 'debit' ? '#FFEBEE' : bt === 'credit' ? '#E0F2F1' : '#E8EAF6') : '#f5f5f5' }}
                  textStyle={{ fontSize: 11, fontWeight: '600' }}
                >
                  {bt === 'all' ? 'All' : bt === 'debit' ? 'Debit Only' : 'Credit Only'}
                </Chip>
              ))}
            </View>
          </View>
        )}
      </Surface>

      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Statement */}
      {statement && (
        <View nativeID="printable-report">
          {/* Business + Party Info Header */}
          <Surface style={styles.statementHeader}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text variant="titleLarge" style={{ fontWeight: '700' }}>{statement.business?.name || 'e-Khata'}</Text>
              {statement.business?.address ? (
                <Text variant="bodySmall" style={{ color: colors.textSecondary }}>{statement.business.address}</Text>
              ) : null}
              <Text variant="titleSmall" style={{ marginTop: 8, color: colors.primary, fontWeight: '600' }}>Account Statement</Text>
              <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                {statement.period?.from} to {statement.period?.to}
              </Text>
            </View>
            <Divider />
            <View style={[styles.partyInfoRow, isWide && { flexDirection: 'row' }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoLabel}>Party</Text>
                <Text style={styles.infoValue}>{statement.party?.name}</Text>
                <Text style={styles.infoSub}>{statement.party?.mobile}</Text>
                {statement.party?.address && <Text style={styles.infoSub}>{statement.party.address}, {statement.party.city}</Text>}
              </View>
              <View style={{ flex: 1, alignItems: isWide ? 'flex-end' : 'flex-start', marginTop: isWide ? 0 : 12 }}>
                {statement.party?.khata_number && (
                  <Text style={styles.infoSub}>Khata # {statement.party.khata_number}</Text>
                )}
                {statement.party?.book_number && (
                  <Text style={styles.infoSub}>Book # {statement.party.book_number}</Text>
                )}
                <Text style={[styles.infoLabel, { marginTop: 4 }]}>Generated: {statement.generated_at}</Text>
              </View>
            </View>
          </Surface>

          {/* Opening Balance */}
          <Surface style={[styles.balanceBar, { borderLeftColor: statement.opening_balance >= 0 ? colors.debit : colors.credit }]}>
            <Text style={styles.balanceLabel}>Opening Balance</Text>
            <Text style={[styles.balanceValue, { color: statement.opening_balance >= 0 ? colors.debit : colors.credit }]}>
              {formatAmount(Math.abs(statement.opening_balance))} {statement.opening_balance_type}
            </Text>
          </Surface>

          {/* Entries Table */}
          <Surface style={styles.tableCard}>
            <ScrollView horizontal={!isWide}>
              <DataTable style={{ minWidth: isWide ? undefined : 600 }}>
                <DataTable.Header style={styles.tableHeader}>
                  <SortableHeader label="Date" sortKey="date" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} style={{ flex: 1.2 }} />
                  <SortableHeader label="Description" sortKey="description" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} style={{ flex: 2.5 }} />
                  <SortableHeader label="Ref" sortKey="reference" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} style={{ flex: 0.8 }} />
                  <SortableHeader label="Debit" sortKey="debit" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} numeric style={{ flex: 1.2 }} />
                  <SortableHeader label="Credit" sortKey="credit" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} numeric style={{ flex: 1.2 }} />
                  <SortableHeader label="Balance" sortKey="balance" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} numeric style={{ flex: 1.5 }} />
                </DataTable.Header>

                {filteredEntries.map((e: any, i: number) => (
                  <DataTable.Row key={i}>
                    <DataTable.Cell style={{ flex: 1.2 }}><Text style={styles.cellText}>{formatDate(e.date)}</Text></DataTable.Cell>
                    <DataTable.Cell style={{ flex: 2.5 }}><Text style={styles.cellText}>{e.description}</Text></DataTable.Cell>
                    <DataTable.Cell style={{ flex: 0.8 }}><Text style={styles.cellText}>{e.reference || ''}</Text></DataTable.Cell>
                    <DataTable.Cell numeric style={{ flex: 1.2 }}>
                      <Text style={[styles.cellText, e.debit > 0 && { color: colors.debit, fontWeight: '600' }]}>
                        {e.debit > 0 ? formatAmount(e.debit) : '-'}
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={{ flex: 1.2 }}>
                      <Text style={[styles.cellText, e.credit > 0 && { color: colors.credit, fontWeight: '600' }]}>
                        {e.credit > 0 ? formatAmount(e.credit) : '-'}
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={{ flex: 1.5 }}>
                      <Text style={[styles.cellText, { fontWeight: '600', color: e.balance >= 0 ? colors.debit : colors.credit }]}>
                        {formatAmount(Math.abs(e.balance))} {e.balance_type}
                      </Text>
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            </ScrollView>
          </Surface>

          {/* Closing Balance + Summary */}
          <Surface style={[styles.balanceBar, { borderLeftColor: statement.closing_balance >= 0 ? colors.debit : colors.credit }]}>
            <Text style={styles.balanceLabel}>Closing Balance</Text>
            <Text style={[styles.balanceValue, { color: statement.closing_balance >= 0 ? colors.debit : colors.credit }]}>
              {formatAmount(Math.abs(statement.closing_balance))} {statement.closing_balance_type}
            </Text>
          </Surface>

          <Surface style={styles.summaryCard}>
            <Text variant="titleSmall" style={{ fontWeight: '700', marginBottom: 8 }}>Summary</Text>
            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Debit</Text>
                <Text style={[styles.summaryValue, { color: colors.debit }]}>{formatAmount(statement.summary?.total_debit || 0)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Credit</Text>
                <Text style={[styles.summaryValue, { color: colors.credit }]}>{formatAmount(statement.summary?.total_credit || 0)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Net Change</Text>
                <Text style={styles.summaryValue}>{formatAmount(Math.abs(statement.summary?.net_change || 0))}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Transactions</Text>
                <Text style={styles.summaryValue}>{statement.summary?.transaction_count || 0}</Text>
              </View>
            </View>
          </Surface>
        </View>
      )}

      {!isLoading && selectedPartyId && !statement && (
        <Surface style={styles.emptyCard}>
          <MaterialCommunityIcons name="file-document-outline" size={48} color="#ccc" />
          <Text style={{ color: colors.textSecondary, marginTop: 8 }}>Select a party and generate a statement.</Text>
        </Surface>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.base },
  title: { fontWeight: '700' },
  filterCard: { padding: spacing.base, borderRadius: 14, backgroundColor: '#fff', elevation: 1, marginBottom: 12, zIndex: 100 },
  filterGrid: { gap: 12 },
  filterLabel: { marginBottom: 4, color: colors.textSecondary, fontWeight: '600' },
  dateInput: { backgroundColor: '#fff', fontSize: 13 },
  statementHeader: { padding: spacing.lg, borderRadius: 14, backgroundColor: '#fff', elevation: 1, marginBottom: 12 },
  partyInfoRow: { marginTop: 12, gap: 8 },
  infoLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  infoValue: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  infoSub: { fontSize: 12, color: colors.textSecondary },
  balanceBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: spacing.base, borderRadius: 10, backgroundColor: '#fff',
    elevation: 1, marginBottom: 8, borderLeftWidth: 4,
  },
  balanceLabel: { fontWeight: '700', fontSize: 13 },
  balanceValue: { fontWeight: '700', fontSize: 16 },
  tableCard: { borderRadius: 14, backgroundColor: '#fff', elevation: 1, overflow: 'hidden', marginBottom: 8 },
  tableHeader: { backgroundColor: '#FFF0F6' },
  thText: { fontWeight: '700', fontSize: 12, color: '#333' },
  cellText: { fontSize: 12 },
  summaryCard: { padding: spacing.base, borderRadius: 14, backgroundColor: '#fff', elevation: 1, marginTop: 4 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  summaryItem: { minWidth: 130 },
  summaryLabel: { fontSize: 11, color: colors.textSecondary },
  summaryValue: { fontSize: 15, fontWeight: '700' },
  centered: { padding: 40, alignItems: 'center' },
  emptyCard: { padding: 40, borderRadius: 14, alignItems: 'center', backgroundColor: '#fff', elevation: 1 },
});
