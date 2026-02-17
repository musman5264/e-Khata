import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions, Platform } from 'react-native';
import { Text, Surface, ActivityIndicator, Button, Divider, TextInput, DataTable, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import SearchableDropdown from '@/components/SearchableDropdown';

export default function PartyLedgerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ partyId?: string }>();
  const { width } = useWindowDimensions();
  const isWide = width > 700;

  const [selectedPartyId, setSelectedPartyId] = useState<number | null>(
    params.partyId ? parseInt(params.partyId) : null
  );
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Fetch parties for dropdown
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

  // Fetch ledger data
  const { data: ledgerData, isLoading, refetch } = useQuery({
    queryKey: ['party-ledger', selectedPartyId, dateFrom, dateTo],
    queryFn: async () => {
      const params: any = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await api.get(`/reports/party-ledger/${selectedPartyId}`, { params });
      return res.data.data;
    },
    enabled: !!selectedPartyId,
  });

  const ledger = ledgerData?.ledger || [];
  const party = ledgerData?.party;
  const totals = ledgerData?.totals;

  const formatAmount = (val: number) =>
    val ? `Rs ${val.toLocaleString('en-PK', { minimumFractionDigits: 2 })}` : '-';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerRow}>
        <MaterialCommunityIcons name="book-open-page-variant" size={28} color={colors.primary} />
        <Text variant="headlineSmall" style={styles.title}>Party Ledger</Text>
      </View>

      {/* Party Selector + Date Range */}
      <Surface style={styles.filterCard}>
        <View style={[styles.filterGrid, isWide && { flexDirection: 'row' }]}>
          <View style={{ flex: isWide ? 2 : 1, minWidth: 200 }}>
            <Text variant="labelMedium" style={styles.filterLabel}>Select Party</Text>
            <SearchableDropdown
              options={partiesData || []}
              selectedValue={selectedPartyId}
              onSelect={(v) => setSelectedPartyId(v)}
              placeholder="Choose a party..."
            />
          </View>
          <View style={{ flex: 1, minWidth: 130 }}>
            <Text variant="labelMedium" style={styles.filterLabel}>From Date</Text>
            <TextInput
              mode="outlined"
              value={dateFrom}
              onChangeText={setDateFrom}
              placeholder="YYYY-MM-DD"
              dense
              style={styles.dateInput}
            />
          </View>
          <View style={{ flex: 1, minWidth: 130 }}>
            <Text variant="labelMedium" style={styles.filterLabel}>To Date</Text>
            <TextInput
              mode="outlined"
              value={dateTo}
              onChangeText={setDateTo}
              placeholder="YYYY-MM-DD"
              dense
              style={styles.dateInput}
            />
          </View>
          <View style={{ justifyContent: 'flex-end' }}>
            <Button
              mode="contained"
              onPress={() => refetch()}
              disabled={!selectedPartyId}
              style={{ borderRadius: 8, marginTop: isWide ? 0 : 8 }}
              icon="magnify"
            >
              View Ledger
            </Button>
          </View>
        </View>
      </Surface>

      {/* Party Info */}
      {party && (
        <Surface style={styles.partyInfoCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <View>
              <Text variant="titleMedium" style={{ fontWeight: '700' }}>{party.name}</Text>
              <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                {party.mobile}{party.khata_number ? ` · Khata #${party.khata_number}` : ''}
                {party.book_number ? ` · Book #${party.book_number}` : ''}
              </Text>
            </View>
            <Chip
              mode="flat"
              style={{ backgroundColor: (totals?.closing_balance || 0) >= 0 ? '#FFF0F0' : '#F0FFF4' }}
              textStyle={{ fontWeight: '700', color: (totals?.closing_balance || 0) >= 0 ? colors.debit : colors.credit }}
            >
              {formatAmount(Math.abs(totals?.closing_balance || 0))} {totals?.balance_type || ''}
            </Chip>
          </View>
        </Surface>
      )}

      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Ledger Table */}
      {ledger.length > 0 && (
        <Surface style={styles.tableCard}>
          <ScrollView horizontal={!isWide}>
            <DataTable style={{ minWidth: isWide ? undefined : 650 }}>
              <DataTable.Header style={styles.tableHeader}>
                <DataTable.Title style={{ flex: 1.2 }}>
                  <Text style={styles.thText}>Date</Text>
                </DataTable.Title>
                <DataTable.Title style={{ flex: 2.5 }}>
                  <Text style={styles.thText}>Description</Text>
                </DataTable.Title>
                <DataTable.Title style={{ flex: 1 }}>
                  <Text style={styles.thText}>Ref #</Text>
                </DataTable.Title>
                <DataTable.Title numeric style={{ flex: 1.2 }}>
                  <Text style={styles.thText}>Debit (Dr)</Text>
                </DataTable.Title>
                <DataTable.Title numeric style={{ flex: 1.2 }}>
                  <Text style={styles.thText}>Credit (Cr)</Text>
                </DataTable.Title>
                <DataTable.Title numeric style={{ flex: 1.5 }}>
                  <Text style={styles.thText}>Balance</Text>
                </DataTable.Title>
              </DataTable.Header>

              {ledger.map((entry: any, idx: number) => (
                <DataTable.Row
                  key={entry.id || `row-${idx}`}
                  style={[
                    entry.is_opening && styles.openingRow,
                    entry.is_closing && styles.closingRow,
                  ]}
                >
                  <DataTable.Cell style={{ flex: 1.2 }}>
                    <Text style={[styles.cellText, (entry.is_opening || entry.is_closing) && styles.boldText]}>
                      {entry.date}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={{ flex: 2.5 }}>
                    <Text style={[styles.cellText, (entry.is_opening || entry.is_closing) && styles.boldText]}>
                      {entry.description}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={{ flex: 1 }}>
                    <Text style={styles.cellText}>{entry.reference_number || ''}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={{ flex: 1.2 }}>
                    <Text style={[styles.cellText, entry.debit > 0 && { color: colors.debit, fontWeight: '600' }]}>
                      {entry.debit > 0 ? formatAmount(entry.debit) : '-'}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={{ flex: 1.2 }}>
                    <Text style={[styles.cellText, entry.credit > 0 && { color: colors.credit, fontWeight: '600' }]}>
                      {entry.credit > 0 ? formatAmount(entry.credit) : '-'}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={{ flex: 1.5 }}>
                    <Text style={[styles.cellText, {
                      fontWeight: '600',
                      color: entry.running_balance >= 0 ? colors.debit : colors.credit,
                    }]}>
                      {formatAmount(Math.abs(entry.running_balance))} {entry.balance_type}
                    </Text>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </ScrollView>

          {/* Totals Summary */}
          {totals && (
            <View style={styles.totalsSummary}>
              <Divider style={{ marginBottom: 12 }} />
              <View style={styles.totalsRow}>
                <View style={styles.totalItem}>
                  <Text style={styles.totalLabel}>Total Debit</Text>
                  <Text style={[styles.totalValue, { color: colors.debit }]}>{formatAmount(totals.total_debit)}</Text>
                </View>
                <View style={styles.totalItem}>
                  <Text style={styles.totalLabel}>Total Credit</Text>
                  <Text style={[styles.totalValue, { color: colors.credit }]}>{formatAmount(totals.total_credit)}</Text>
                </View>
                <View style={styles.totalItem}>
                  <Text style={styles.totalLabel}>Closing Balance</Text>
                  <Text style={[styles.totalValue, { color: totals.closing_balance >= 0 ? colors.debit : colors.credit }]}>
                    {formatAmount(Math.abs(totals.closing_balance))} {totals.balance_type}
                  </Text>
                </View>
                <View style={styles.totalItem}>
                  <Text style={styles.totalLabel}>Transactions</Text>
                  <Text style={styles.totalValue}>{totals.transaction_count}</Text>
                </View>
              </View>
            </View>
          )}
        </Surface>
      )}

      {!isLoading && selectedPartyId && ledger.length === 0 && (
        <Surface style={styles.emptyCard}>
          <MaterialCommunityIcons name="book-off-outline" size={48} color="#ccc" />
          <Text style={{ color: colors.textSecondary, marginTop: 8 }}>No ledger entries found for the selected period.</Text>
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
  filterCard: { padding: spacing.base, borderRadius: 14, backgroundColor: '#fff', elevation: 1, marginBottom: 12 },
  filterGrid: { gap: 12 },
  filterLabel: { marginBottom: 4, color: colors.textSecondary, fontWeight: '600' },
  dateInput: { backgroundColor: '#fff', fontSize: 13 },
  partyInfoCard: { padding: spacing.base, borderRadius: 14, backgroundColor: '#fff', elevation: 1, marginBottom: 12 },
  tableCard: { borderRadius: 14, backgroundColor: '#fff', elevation: 1, overflow: 'hidden' },
  tableHeader: { backgroundColor: '#F5F7FF' },
  thText: { fontWeight: '700', fontSize: 12, color: '#333' },
  cellText: { fontSize: 12 },
  boldText: { fontWeight: '700' },
  openingRow: { backgroundColor: '#F0F7FF' },
  closingRow: { backgroundColor: '#FFF8E1' },
  totalsSummary: { padding: spacing.base },
  totalsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  totalItem: { minWidth: 130 },
  totalLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 2 },
  totalValue: { fontSize: 15, fontWeight: '700' },
  centered: { padding: 40, alignItems: 'center' },
  emptyCard: { padding: 40, borderRadius: 14, alignItems: 'center', backgroundColor: '#fff', elevation: 1 },
});
