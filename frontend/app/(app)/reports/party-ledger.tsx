import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { Text, Surface, ActivityIndicator, Button, Divider, TextInput, DataTable, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import SearchableDropdown from '@/components/SearchableDropdown';
import ReportActions from '@/components/ReportActions';
import { formatDate } from '@/utils/formatDate';

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
  const business = ledgerData?.business;
  const totals = ledgerData?.totals;

  const formatAmount = (val: number) =>
    val ? `Rs ${val.toLocaleString('en-PK', { minimumFractionDigits: 2 })}` : '-';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header with actions */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <MaterialCommunityIcons name="book-open-page-variant" size={28} color={colors.primary} />
          <Text variant="headlineSmall" style={styles.title}>Party Ledger</Text>
        </View>
        {ledger.length > 0 && <ReportActions />}
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

      {/* Business & Party Info Cards — side by side 6x6 */}
      {party && (
        <View style={[styles.infoCardsRow, !isWide && { flexDirection: 'column' }]}>
          {/* Business Info Card */}
          <Surface style={[styles.infoCard, isWide && { flex: 1 }]}>
            <View style={styles.infoCardHeader}>
              <MaterialCommunityIcons name="domain" size={20} color={colors.primary} />
              <Text variant="titleSmall" style={styles.infoCardTitle}>Business Information</Text>
            </View>
            <Divider style={{ marginVertical: 8 }} />
            <View style={styles.infoGrid}>
              <InfoRow label="Business Name" value={business?.name || '-'} />
              <InfoRow label="Address" value={business?.address || '-'} />
              <InfoRow label="City" value={business?.city || '-'} />
              <InfoRow label="Phone" value={business?.phone || '-'} />
              {business?.email ? <InfoRow label="Email" value={business.email} /> : null}
            </View>
          </Surface>

          {/* Party / Supplier-Customer Info Card */}
          <Surface style={[styles.infoCard, isWide && { flex: 1 }]}>
            <View style={styles.infoCardHeader}>
              <MaterialCommunityIcons
                name={party.type === 'supplier' ? 'truck-delivery' : 'account-cash'}
                size={20}
                color={party.type === 'supplier' ? '#E67E22' : '#27AE60'}
              />
              <Text variant="titleSmall" style={styles.infoCardTitle}>
                {party.type === 'supplier' ? 'Supplier' : 'Customer'} Information
              </Text>
              <Chip
                mode="flat"
                compact
                style={[styles.typeChip, {
                  backgroundColor: party.type === 'supplier' ? '#FFF3E0' : '#E8F5E9',
                }]}
                textStyle={{
                  fontSize: 10,
                  fontWeight: '700',
                  color: party.type === 'supplier' ? '#E67E22' : '#27AE60',
                }}
              >
                {(party.type || 'customer').toUpperCase()}
              </Chip>
            </View>
            <Divider style={{ marginVertical: 8 }} />
            <View style={styles.infoGrid}>
              <InfoRow label="Name" value={party.name} />
              <InfoRow label="Mobile" value={party.mobile || '-'} />
              {party.email ? <InfoRow label="Email" value={party.email} /> : null}
              {party.address ? (
                <InfoRow label="Address" value={`${party.address}${party.city ? `, ${party.city}` : ''}`} />
              ) : null}
              <InfoRow label="Khata #" value={party.khata_number || '-'} />
              {party.book_number ? <InfoRow label="Book #" value={party.book_number} /> : null}
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Balance</Text>
                <Text style={[styles.infoValue, {
                  color: (totals?.closing_balance || 0) >= 0 ? colors.debit : colors.credit,
                  fontWeight: '700',
                }]}>
                  {formatAmount(Math.abs(totals?.closing_balance || 0))} {totals?.balance_type || ''}
                </Text>
              </View>
            </View>
          </Surface>
        </View>
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
            <DataTable style={{ minWidth: isWide ? undefined : 750 }}>
              <DataTable.Header style={styles.tableHeader}>
                <DataTable.Title style={{ flex: 1.2 }}>
                  <Text style={styles.thText}>Date</Text>
                </DataTable.Title>
                <DataTable.Title style={{ flex: 2.5 }}>
                  <Text style={styles.thText}>Description</Text>
                </DataTable.Title>
                <DataTable.Title style={{ flex: 1.2 }}>
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
                      {formatDate(entry.date)}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={{ flex: 2.5 }}>
                    <Text style={[styles.cellText, (entry.is_opening || entry.is_closing) && styles.boldText]}>
                      {entry.description}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={{ flex: 1.2 }}>
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

              {/* Totals Footer — aligned under respective columns */}
              {totals && (
                <DataTable.Row style={styles.totalsFooterRow}>
                  <DataTable.Cell style={{ flex: 1.2 }}>
                    <Text style={styles.totalsFooterLabel}>
                      {totals.transaction_count} Txns
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell style={{ flex: 2.5 }}>
                    <Text style={styles.totalsFooterLabel} />
                  </DataTable.Cell>
                  <DataTable.Cell style={{ flex: 1.2 }}>
                    <Text style={styles.totalsFooterLabel} />
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={{ flex: 1.2 }}>
                    <Text style={[styles.totalsFooterValue, { color: colors.debit }]}>
                      {formatAmount(totals.total_debit)}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={{ flex: 1.2 }}>
                    <Text style={[styles.totalsFooterValue, { color: colors.credit }]}>
                      {formatAmount(totals.total_credit)}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={{ flex: 1.5 }}>
                    <Text style={[styles.totalsFooterValue, {
                      color: totals.closing_balance >= 0 ? colors.debit : colors.credit,
                    }]}>
                      {formatAmount(Math.abs(totals.closing_balance))} {totals.balance_type}
                    </Text>
                  </DataTable.Cell>
                </DataTable.Row>
              )}
            </DataTable>
          </ScrollView>
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

/* Small helper component for info rows */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={infoRowStyles.row}>
      <Text style={infoRowStyles.label}>{label}</Text>
      <Text style={infoRowStyles.value}>{value}</Text>
    </View>
  );
}

const infoRowStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  label: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  value: { fontSize: 12, fontWeight: '600', color: '#333', textAlign: 'right', flexShrink: 1, maxWidth: '60%' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.base },
  title: { fontWeight: '700' },
  filterCard: { padding: spacing.base, borderRadius: 14, backgroundColor: '#fff', elevation: 1, marginBottom: 12, zIndex: 100 },
  filterGrid: { gap: 12 },
  filterLabel: { marginBottom: 4, color: colors.textSecondary, fontWeight: '600' },
  dateInput: { backgroundColor: '#fff', fontSize: 13 },

  /* Info Cards */
  infoCardsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  infoCard: { padding: spacing.base, borderRadius: 14, backgroundColor: '#fff', elevation: 1 },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoCardTitle: { fontWeight: '700', flex: 1 },
  typeChip: { height: 24 },
  infoGrid: { gap: 4 },
  infoItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  infoLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  infoValue: { fontSize: 12, fontWeight: '600', color: '#333', textAlign: 'right', flexShrink: 1 },

  /* Table */
  tableCard: { borderRadius: 14, backgroundColor: '#fff', elevation: 1, overflow: 'hidden', marginBottom: 12 },
  tableHeader: { backgroundColor: '#F5F7FF' },
  thText: { fontWeight: '700', fontSize: 12, color: '#333' },
  cellText: { fontSize: 12 },
  boldText: { fontWeight: '700' },
  openingRow: { backgroundColor: '#F0F7FF' },
  closingRow: { backgroundColor: '#FFF8E1' },

  /* Totals Footer Row — inside table, aligned to columns */
  totalsFooterRow: {
    backgroundColor: '#F8F9FC',
    borderTopWidth: 2,
    borderTopColor: '#E0E0E0',
    minHeight: 48,
  },
  totalsFooterLabel: { fontSize: 12, fontWeight: '700', color: '#555' },
  totalsFooterValue: { fontSize: 13, fontWeight: '800' },

  centered: { padding: 40, alignItems: 'center' },
  emptyCard: { padding: 40, borderRadius: 14, alignItems: 'center', backgroundColor: '#fff', elevation: 1 },
});
