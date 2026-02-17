import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { Text, Surface, ActivityIndicator, Button, TextInput, DataTable, Divider, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import SearchableDropdown from '@/components/SearchableDropdown';
import ReportActions from '@/components/ReportActions';

export default function PartyStatementScreen() {
  const params = useLocalSearchParams<{ partyId?: string }>();
  const { width } = useWindowDimensions();
  const isWide = width > 700;

  const [selectedPartyId, setSelectedPartyId] = useState<number | null>(
    params.partyId ? parseInt(params.partyId) : null
  );
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={[styles.headerRow, { justifyContent: 'space-between' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <MaterialCommunityIcons name="file-document-outline" size={28} color="#E84393" />
          <Text variant="headlineSmall" style={styles.title}>Party Statement</Text>
        </View>
        {entries.length > 0 && <ReportActions />}
      </View>

      {/* Filters */}
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
            <Text variant="labelMedium" style={styles.filterLabel}>From</Text>
            <TextInput mode="outlined" value={dateFrom} onChangeText={setDateFrom} placeholder="YYYY-MM-DD" dense style={styles.dateInput} />
          </View>
          <View style={{ flex: 1, minWidth: 130 }}>
            <Text variant="labelMedium" style={styles.filterLabel}>To</Text>
            <TextInput mode="outlined" value={dateTo} onChangeText={setDateTo} placeholder="YYYY-MM-DD" dense style={styles.dateInput} />
          </View>
          <View style={{ justifyContent: 'flex-end' }}>
            <Button mode="contained" onPress={() => refetch()} disabled={!selectedPartyId} style={{ borderRadius: 8, marginTop: isWide ? 0 : 8 }} icon="file-eye">
              Generate
            </Button>
          </View>
        </View>
      </Surface>

      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Statement */}
      {statement && (
        <>
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
                  <DataTable.Title style={{ flex: 1.2 }}><Text style={styles.thText}>Date</Text></DataTable.Title>
                  <DataTable.Title style={{ flex: 2.5 }}><Text style={styles.thText}>Description</Text></DataTable.Title>
                  <DataTable.Title style={{ flex: 0.8 }}><Text style={styles.thText}>Ref</Text></DataTable.Title>
                  <DataTable.Title numeric style={{ flex: 1.2 }}><Text style={styles.thText}>Debit</Text></DataTable.Title>
                  <DataTable.Title numeric style={{ flex: 1.2 }}><Text style={styles.thText}>Credit</Text></DataTable.Title>
                  <DataTable.Title numeric style={{ flex: 1.5 }}><Text style={styles.thText}>Balance</Text></DataTable.Title>
                </DataTable.Header>

                {entries.map((e: any, i: number) => (
                  <DataTable.Row key={i}>
                    <DataTable.Cell style={{ flex: 1.2 }}><Text style={styles.cellText}>{e.date}</Text></DataTable.Cell>
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
        </>
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
  filterCard: { padding: spacing.base, borderRadius: 14, backgroundColor: '#fff', elevation: 1, marginBottom: 12 },
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
