import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import {
  Text, Surface, Chip, TextInput, ActivityIndicator,
  Modal, Portal, IconButton, Divider, DataTable,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatDateTime } from '@/utils/formatDate';
import ReportActions from '@/components/ReportActions';
import DateInput from '@/components/DateInput';

export default function PaymentHistoryScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isWide = width > 700;

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Detail modal
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const res = await api.get('/payments');
      return res.data.data;
    },
  });

  // Filter payments client-side
  const filteredPayments = useMemo(() => {
    if (!data) return [];
    let list = [...data];

    if (dateFrom) {
      list = list.filter((p: any) => (p.created_at || '').slice(0, 10) >= dateFrom);
    }
    if (dateTo) {
      list = list.filter((p: any) => (p.created_at || '').slice(0, 10) <= dateTo);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p: any) =>
        (p.party?.name || p.party_name || '').toLowerCase().includes(q) ||
        (p.gateway || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter) {
      list = list.filter((p: any) => p.status === statusFilter);
    }
    return list;
  }, [data, dateFrom, dateTo, search, statusFilter]);

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.credit;
      case 'pending': return '#FF9800';
      case 'failed': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const openDetail = (payment: any) => {
    setSelectedPayment(payment);
    setDetailVisible(true);
  };

  // Stats
  const totalCollected = filteredPayments
    .filter((p: any) => p.direction === 'inbound' && p.status === 'completed')
    .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);
  const totalSent = filteredPayments
    .filter((p: any) => p.direction === 'outbound' && p.status === 'completed')
    .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);
  const totalPending = filteredPayments
    .filter((p: any) => p.status === 'pending')
    .reduce((sum: number, p: any) => sum + (parseFloat(p.amount) || 0), 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <MaterialCommunityIcons name="credit-card-outline" size={28} color={colors.primary} />
          <Text variant="headlineSmall" style={styles.title}>Payment History</Text>
        </View>
        {filteredPayments.length > 0 && <ReportActions reportTitle="Payment_History" />}
      </View>

      {/* Filters */}
      <Surface style={styles.filterCard} nativeID="report-filter-card">
        <View style={[styles.filterGrid, isWide && { flexDirection: 'row' }]}>
          <View style={{ flex: isWide ? 2 : 1, minWidth: 180 }}>
            <Text variant="labelMedium" style={styles.filterLabel}>Search</Text>
            <TextInput
              mode="outlined"
              value={search}
              onChangeText={setSearch}
              placeholder="Party name, gateway..."
              dense
              style={styles.dateInput}
              left={<TextInput.Icon icon="magnify" size={18} />}
            />
          </View>
          <View style={{ flex: 1, minWidth: 130 }}>
            <DateInput
              label="From Date"
              value={dateFrom}
              onChangeText={setDateFrom}
            />
          </View>
          <View style={{ flex: 1, minWidth: 130 }}>
            <DateInput
              label="To Date"
              value={dateTo}
              onChangeText={setDateTo}
            />
          </View>
        </View>

        {/* Status filter chips */}
        <View style={styles.chipRow}>
          <Text variant="labelSmall" style={{ color: colors.textSecondary, marginRight: 8 }}>Status:</Text>
          {[null, 'completed', 'pending', 'failed'].map((s) => (
            <Chip
              key={s || 'all'}
              mode="flat"
              compact
              selected={statusFilter === s}
              onPress={() => setStatusFilter(s)}
              style={[styles.filterChip, statusFilter === s && styles.filterChipActive]}
              textStyle={{ fontSize: 11, fontWeight: statusFilter === s ? '700' : '500' }}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            </Chip>
          ))}
        </View>
      </Surface>

      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Stats + Table wrapped in printable-report */}
      {filteredPayments.length > 0 && (
        <View nativeID="printable-report">
          <View style={styles.statsRow}>
            <Surface style={styles.statCard}>
              <Text style={styles.statLabel}>Collected</Text>
              <Text style={[styles.statValue, { color: colors.credit }]}>{formatCurrency(totalCollected)}</Text>
            </Surface>
            <Surface style={styles.statCard}>
              <Text style={styles.statLabel}>Sent</Text>
              <Text style={[styles.statValue, { color: colors.debit }]}>{formatCurrency(totalSent)}</Text>
            </Surface>
            <Surface style={styles.statCard}>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={[styles.statValue, { color: '#FF9800' }]}>{formatCurrency(totalPending)}</Text>
            </Surface>
          </View>

          {/* Payments Table */}
          <Surface style={styles.tableCard}>
            <ScrollView horizontal={!isWide} showsHorizontalScrollIndicator={false}>
              <DataTable style={{ minWidth: isWide ? undefined : 700 }}>
                <DataTable.Header style={styles.tableHeader}>
                  <DataTable.Title style={{ flex: 1.8 }}><Text style={styles.thText}>Party</Text></DataTable.Title>
                  <DataTable.Title style={{ flex: 1 }}><Text style={styles.thText}>Gateway</Text></DataTable.Title>
                  <DataTable.Title numeric style={{ flex: 1.3 }}><Text style={styles.thText}>Amount</Text></DataTable.Title>
                  <DataTable.Title style={{ flex: 0.7 }}><Text style={styles.thText}>Direction</Text></DataTable.Title>
                  <DataTable.Title style={{ flex: 0.8 }}><Text style={styles.thText}>Status</Text></DataTable.Title>
                  <DataTable.Title style={{ flex: 1.2 }}><Text style={styles.thText}>Date</Text></DataTable.Title>
                </DataTable.Header>

                {filteredPayments.map((p: any) => (
                  <DataTable.Row key={p.id} onPress={() => openDetail(p)} style={{ cursor: 'pointer' } as any}>
                    <DataTable.Cell style={{ flex: 1.8 }}>
                      <Text style={[styles.cellText, { fontWeight: '600' }]}>{p.party?.name || p.party_name || `Party #${p.party_id}`}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={{ flex: 1 }}>
                      <Text style={[styles.cellText, { textTransform: 'capitalize' }]}>{p.gateway}</Text>
                    </DataTable.Cell>
                    <DataTable.Cell numeric style={{ flex: 1.3 }}>
                      <Text style={[styles.cellText, {
                        fontWeight: '700',
                        color: p.direction === 'inbound' ? colors.credit : colors.debit,
                      }]}>
                        {formatCurrency(p.amount)}
                      </Text>
                    </DataTable.Cell>
                    <DataTable.Cell style={{ flex: 0.7 }}>
                      <View style={[styles.dirBadge, {
                        backgroundColor: p.direction === 'inbound' ? '#E8F5E9' : '#FFF0F0',
                      }]}>
                        <Text style={{
                          fontSize: 10, fontWeight: '700',
                          color: p.direction === 'inbound' ? colors.credit : colors.debit,
                        }}>
                          {p.direction === 'inbound' ? 'IN' : 'OUT'}
                        </Text>
                      </View>
                    </DataTable.Cell>
                    <DataTable.Cell style={{ flex: 0.8 }}>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor(p.status) + '20' }]}>
                        <Text style={{ color: statusColor(p.status), fontWeight: '600', fontSize: 10 }}>
                          {p.status}
                        </Text>
                      </View>
                    </DataTable.Cell>
                    <DataTable.Cell style={{ flex: 1.2 }}>
                      <Text style={styles.cellText}>{formatDate(p.created_at)}</Text>
                    </DataTable.Cell>
                  </DataTable.Row>
                ))}
              </DataTable>
            </ScrollView>
          </Surface>
        </View>
      )}

      {!isLoading && filteredPayments.length === 0 && (
        <Surface style={styles.emptyCard}>
          <MaterialCommunityIcons name="credit-card-off-outline" size={48} color="#ccc" />
          <Text style={{ color: colors.textSecondary, marginTop: 8 }}>No payments found.</Text>
        </Surface>
      )}

      {/* Payment Detail Modal */}
      <Portal>
        <Modal
          visible={detailVisible}
          onDismiss={() => setDetailVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          {selectedPayment && (
            <ScrollView>
              <View style={styles.modalHeader}>
                <Text variant="titleMedium" style={{ fontWeight: '700', flex: 1 }}>
                  Payment Details
                </Text>
                <IconButton icon="close" size={20} onPress={() => setDetailVisible(false)} />
              </View>
              <Divider />

              <View style={styles.modalBody}>
                {/* Amount highlight */}
                <View style={styles.amountCard}>
                  <Text style={styles.amountLabel}>Amount</Text>
                  <Text style={[styles.amountValue, {
                    color: selectedPayment.direction === 'inbound' ? colors.credit : colors.debit,
                  }]}>
                    {formatCurrency(selectedPayment.amount)}
                  </Text>
                </View>

                <DetailRow label="Party" value={selectedPayment.party?.name || selectedPayment.party_name || `Party #${selectedPayment.party_id}`} />
                <DetailRow label="Direction" value={
                  <Chip compact mode="flat" style={{
                    backgroundColor: selectedPayment.direction === 'inbound' ? '#E8F5E9' : '#FFF0F0',
                  }} textStyle={{
                    fontSize: 11, fontWeight: '600',
                    color: selectedPayment.direction === 'inbound' ? colors.credit : colors.debit,
                  }}>
                    {selectedPayment.direction === 'inbound' ? 'Inbound (Received)' : 'Outbound (Sent)'}
                  </Chip>
                } />
                <DetailRow label="Gateway" value={selectedPayment.gateway?.toUpperCase()} />
                <DetailRow label="Status" value={
                  <View style={[styles.statusBadge, { backgroundColor: statusColor(selectedPayment.status) + '20' }]}>
                    <Text style={{ color: statusColor(selectedPayment.status), fontWeight: '600', fontSize: 12 }}>
                      {selectedPayment.status}
                    </Text>
                  </View>
                } />
                {selectedPayment.description && (
                  <DetailRow label="Description" value={selectedPayment.description} />
                )}
                {selectedPayment.gateway_txn_ref && (
                  <DetailRow label="Transaction Ref" value={selectedPayment.gateway_txn_ref} />
                )}
                {selectedPayment.reference_number && (
                  <DetailRow label="Reference #" value={selectedPayment.reference_number} />
                )}
                <DetailRow label="Created" value={formatDateTime(selectedPayment.created_at)} />
                {selectedPayment.completed_at && (
                  <DetailRow label="Completed At" value={formatDateTime(selectedPayment.completed_at)} />
                )}
                {selectedPayment.updated_at && selectedPayment.updated_at !== selectedPayment.created_at && (
                  <DetailRow label="Last Updated" value={formatDateTime(selectedPayment.updated_at)} />
                )}
              </View>
            </ScrollView>
          )}
        </Modal>
      </Portal>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: any }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      {typeof value === 'string' ? (
        <Text style={styles.detailValue}>{value}</Text>
      ) : (
        value
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.base },
  title: { fontWeight: '700' },
  filterCard: { padding: spacing.base, borderRadius: 14, backgroundColor: '#fff', elevation: 1, marginBottom: 12, zIndex: 100 },
  filterGrid: { gap: 12 },
  filterLabel: { marginBottom: 4, color: colors.textSecondary, fontWeight: '600' },
  dateInput: { backgroundColor: '#fff', fontSize: 13 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 12 },
  filterChip: { borderRadius: 8, backgroundColor: '#F3F4F6' },
  filterChipActive: { backgroundColor: colors.primary + '20' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: spacing.base },
  statCard: { flex: 1, padding: spacing.md, borderRadius: 12, elevation: 1, alignItems: 'center', backgroundColor: '#fff' },
  statLabel: { fontSize: 11, color: colors.textSecondary },
  statValue: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  tableCard: { borderRadius: 14, backgroundColor: '#fff', elevation: 1, overflow: 'hidden', marginBottom: 12 },
  tableHeader: { backgroundColor: '#F5F7FF' },
  thText: { fontWeight: '700', fontSize: 12, color: '#333' },
  cellText: { fontSize: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 },
  dirBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  centered: { padding: 40, alignItems: 'center' },
  emptyCard: { padding: 40, borderRadius: 14, alignItems: 'center', backgroundColor: '#fff', elevation: 1 },
  modalContainer: {
    backgroundColor: '#fff', margin: 20, borderRadius: 16,
    maxHeight: '80%', maxWidth: 500, alignSelf: 'center', width: '90%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8 },
  modalBody: { padding: 16, gap: 12 },
  amountCard: { backgroundColor: colors.background, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 4 },
  amountLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  amountValue: { fontSize: 28, fontWeight: 'bold' },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#eee',
  },
  detailLabel: { fontSize: 13, color: colors.textSecondary, flex: 1 },
  detailValue: { fontSize: 13, fontWeight: '600', color: colors.text, flex: 1, textAlign: 'right' },
});
