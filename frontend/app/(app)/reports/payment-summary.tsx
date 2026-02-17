import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { Text, Surface, DataTable, ActivityIndicator, Chip, Modal, Portal, IconButton, Divider, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import { formatCurrency, formatCurrencyUrdu } from '@/utils/formatCurrency';
import { formatDate, formatDateTime } from '@/utils/formatDate';
import ReportActions from '@/components/ReportActions';
import DateInput from '@/components/DateInput';
import SortableHeader, { toggleSort, sortData, type SortOrder } from '@/components/SortableHeader';
import { useCurrentBusiness } from '@/hooks/useCurrentBusiness';

export default function PaymentSummaryScreen() {
  const { t } = useTranslation();
  const businessInfo = useCurrentBusiness();
  const { width } = useWindowDimensions();
  const isWide = width > 700;
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Filters
  const [filterType, setFilterType] = useState<'all' | 'collect' | 'send'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [filterGateway, setFilterGateway] = useState<string>('all');
  const [searchText, setSearchText] = useState('');

  // Sort
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (key: string) => {
    const result = toggleSort(sortBy, sortOrder, key);
    setSortBy(result.sortBy);
    setSortOrder(result.sortOrder);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['payment-summary', dateFrom, dateTo],
    queryFn: async () => {
      const params: any = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await api.get('/reports/payment-summary', { params });
      return res.data.data;
    },
  });

  // Available gateways from data
  const gateways = useMemo(() => {
    const set = new Set<string>();
    (data?.payments || []).forEach((p: any) => { if (p.gateway) set.add(p.gateway); });
    return Array.from(set);
  }, [data?.payments]);

  // Apply filters + sort
  const filteredPayments = useMemo(() => {
    let payments = data?.payments || [];
    if (filterType !== 'all') payments = payments.filter((p: any) => p.type === filterType);
    if (filterStatus !== 'all') payments = payments.filter((p: any) => p.status === filterStatus);
    if (filterGateway !== 'all') payments = payments.filter((p: any) => p.gateway === filterGateway);
    if (searchText) {
      const q = searchText.toLowerCase();
      payments = payments.filter((p: any) =>
        p.party_name?.toLowerCase().includes(q) || p.gateway?.toLowerCase().includes(q)
      );
    }
    return sortData(payments, sortBy, sortOrder);
  }, [data?.payments, filterType, filterStatus, filterGateway, searchText, sortBy, sortOrder]);

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

  const openDetail = (payment: any) => {
    setSelectedPayment(payment);
    setDetailVisible(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
        <Text variant="headlineSmall" style={{ fontWeight: '700' }}>{t('report.paymentReport')}</Text>
        {filteredPayments.length > 0 && <ReportActions reportTitle="Payment_Summary" businessInfo={businessInfo} />}
      </View>

      {/* Date Filters + Additional Filters */}
      <Surface style={styles.filterCard} nativeID="report-filter-card">
        <View style={styles.filterRow}>
          <View style={{ flex: 1, minWidth: 130 }}>
            <DateInput label="From Date" value={dateFrom} onChangeText={setDateFrom} />
          </View>
          <View style={{ flex: 1, minWidth: 130 }}>
            <DateInput label="To Date" value={dateTo} onChangeText={setDateTo} />
          </View>
          <View style={{ flex: 1.5, minWidth: 160 }}>
            <TextInput
              label="Search..."
              value={searchText}
              onChangeText={setSearchText}
              mode="outlined"
              dense
              left={<TextInput.Icon icon="magnify" />}
              style={{ backgroundColor: '#fff', fontSize: 13 }}
            />
          </View>
        </View>
        <View style={[styles.filterRow, { marginTop: 8, flexWrap: 'wrap' }]}>
          <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary }}>Type:</Text>
            {(['all', 'collect', 'send'] as const).map((v) => (
              <Chip key={v} selected={filterType === v} onPress={() => setFilterType(v)} compact
                style={{ backgroundColor: filterType === v ? '#E8F5E9' : '#f5f5f5' }}
                textStyle={{ fontSize: 10, fontWeight: '600' }}>
                {v === 'all' ? 'All' : v === 'collect' ? 'Collect' : 'Send'}
              </Chip>
            ))}
          </View>
          <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary }}>Status:</Text>
            {(['all', 'completed', 'pending', 'failed'] as const).map((v) => (
              <Chip key={v} selected={filterStatus === v} onPress={() => setFilterStatus(v)} compact
                style={{ backgroundColor: filterStatus === v ? '#E3F2FD' : '#f5f5f5' }}
                textStyle={{ fontSize: 10, fontWeight: '600' }}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </Chip>
            ))}
          </View>
          {gateways.length > 0 && (
            <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary }}>Gateway:</Text>
              <Chip selected={filterGateway === 'all'} onPress={() => setFilterGateway('all')} compact
                style={{ backgroundColor: filterGateway === 'all' ? '#FFF3E0' : '#f5f5f5' }}
                textStyle={{ fontSize: 10, fontWeight: '600' }}>All</Chip>
              {gateways.map((g) => (
                <Chip key={g} selected={filterGateway === g} onPress={() => setFilterGateway(g)} compact
                  style={{ backgroundColor: filterGateway === g ? '#FFF3E0' : '#f5f5f5' }}
                  textStyle={{ fontSize: 10, fontWeight: '600', textTransform: 'capitalize' }}>{g}</Chip>
              ))}
            </View>
          )}
        </View>
      </Surface>

      <View nativeID="printable-report">
      {/* Summary Cards */}
      <View style={[styles.statsRow, !isWide && { flexDirection: 'column' }]}>
        <Surface style={[styles.statCard, { borderLeftColor: colors.credit, borderLeftWidth: 4 }]}>
          <Text style={styles.statLabel}>{t('payment.collect')}</Text>
          <Text style={[styles.statValue, { color: colors.credit }]}>
            {formatCurrency(data?.summary?.total_collected ?? 0)}
          </Text>
          <Text style={styles.urduAmt}>{formatCurrencyUrdu(data?.summary?.total_collected ?? 0)}</Text>
        </Surface>
        <Surface style={[styles.statCard, { borderLeftColor: colors.debit, borderLeftWidth: 4 }]}>
          <Text style={styles.statLabel}>{t('payment.send')}</Text>
          <Text style={[styles.statValue, { color: colors.debit }]}>
            {formatCurrency(data?.summary?.total_sent ?? 0)}
          </Text>
          <Text style={styles.urduAmt}>{formatCurrencyUrdu(data?.summary?.total_sent ?? 0)}</Text>
        </Surface>
        <Surface style={[styles.statCard, { borderLeftColor: colors.warning, borderLeftWidth: 4 }]}>
          <Text style={styles.statLabel}>{t('payment.pending')}</Text>
          <Text style={[styles.statValue, { color: colors.warning }]}>
            {formatCurrency(data?.summary?.total_pending ?? 0)}
          </Text>
          <Text style={styles.urduAmt}>{formatCurrencyUrdu(data?.summary?.total_pending ?? 0)}</Text>
        </Surface>
      </View>

      {/* Payments Table */}
      <Surface style={styles.tableCard}>
        <ScrollView horizontal={!isWide} showsHorizontalScrollIndicator={false}>
          <DataTable style={{ minWidth: isWide ? undefined : 650 }}>
            <DataTable.Header style={styles.tableHeader}>
              <SortableHeader label={t('common.type')} sortKey="type" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} style={{ flex: 1.3 }} />
              <SortableHeader label={t('payment.gateway')} sortKey="gateway" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} style={{ flex: 1.2 }} />
              <SortableHeader label={t('common.amount')} sortKey="amount" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} numeric style={{ flex: 1.5 }} />
              <SortableHeader label={t('common.status')} sortKey="status" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} style={{ flex: 1 }} />
              <SortableHeader label={t('common.date')} sortKey="created_at" currentSort={sortBy} currentOrder={sortOrder} onSort={handleSort} style={{ flex: 1.2 }} />
            </DataTable.Header>

            {filteredPayments.map((p: any) => (
              <DataTable.Row key={p.id} onPress={() => openDetail(p)} style={styles.tableRow}>
                <DataTable.Cell style={{ flex: 1.3 }}>
                  <View style={[styles.typeBadge, {
                    backgroundColor: p.type === 'collect' ? '#E8F5E9' : '#FFF3E0',
                  }]}>
                    <Text style={{
                      fontSize: 11,
                      fontWeight: '700',
                      color: p.type === 'collect' ? colors.credit : colors.debit,
                    }}>
                      {p.type === 'collect' ? t('payment.collect') : t('payment.send')}
                    </Text>
                  </View>
                </DataTable.Cell>
                <DataTable.Cell style={{ flex: 1.2 }}>
                  <Text style={{ fontSize: 12, fontWeight: '500', textTransform: 'capitalize' }}>{p.gateway}</Text>
                </DataTable.Cell>
                <DataTable.Cell numeric style={{ flex: 1.5 }}>
                  <Text style={{ fontWeight: '700', fontSize: 13, color: colors.text }}>{formatCurrency(p.amount)}</Text>
                </DataTable.Cell>
                <DataTable.Cell style={{ flex: 1 }}>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor(p.status) + '18' }]}>
                    <Text style={{ color: statusColor(p.status), fontWeight: '700', fontSize: 11 }}>
                      {p.status}
                    </Text>
                  </View>
                </DataTable.Cell>
                <DataTable.Cell style={{ flex: 1.2 }}>
                  <Text style={{ fontSize: 12, color: colors.textSecondary }}>{formatDate(p.created_at)}</Text>
                </DataTable.Cell>
              </DataTable.Row>
            ))}

            {(!data?.payments || data.payments.length === 0) && (
              <DataTable.Row>
                <DataTable.Cell><Text style={{ color: colors.textHint }}>{t('common.noData')}</Text></DataTable.Cell>
              </DataTable.Row>
            )}
          </DataTable>
        </ScrollView>
      </Surface>
      </View>

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
                  {t('payment.details') || 'Payment Details'}
                </Text>
                <IconButton icon="close" size={20} onPress={() => setDetailVisible(false)} />
              </View>
              <Divider />

              <View style={styles.modalBody}>
                {/* Amount highlight */}
                <View style={styles.amountCard}>
                  <Text style={styles.amountLabel}>{t('common.amount')}</Text>
                  <Text style={[styles.amountValue, {
                    color: selectedPayment.type === 'collect' ? colors.credit : colors.debit,
                  }]}>
                    {formatCurrency(selectedPayment.amount)}
                  </Text>
                  <Text style={[styles.urduAmt, { fontSize: 13, marginTop: 4 }]}>
                    {formatCurrencyUrdu(selectedPayment.amount)}
                  </Text>
                </View>

                <DetailRow label={t('common.type')} value={
                  selectedPayment.type === 'collect' ? t('payment.collect') : t('payment.send')
                } />
                {selectedPayment.party_name && (
                  <DetailRow label={t('common.party')} value={selectedPayment.party_name} />
                )}
                <DetailRow label={t('payment.gateway')} value={selectedPayment.gateway?.toUpperCase()} />
                <DetailRow label={t('common.status')} value={
                  <View style={[styles.statusBadge, { backgroundColor: statusColor(selectedPayment.status) + '20' }]}>
                    <Text style={{ color: statusColor(selectedPayment.status), fontWeight: '600', fontSize: 12 }}>
                      {selectedPayment.status}
                    </Text>
                  </View>
                } />
                {selectedPayment.gateway_txn_ref && (
                  <DetailRow label="Transaction Ref" value={selectedPayment.gateway_txn_ref} />
                )}
                <DetailRow label={t('common.date')} value={formatDateTime(selectedPayment.created_at)} />
                {selectedPayment.completed_at && (
                  <DetailRow label="Completed At" value={formatDateTime(selectedPayment.completed_at)} />
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
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontWeight: '700', marginBottom: spacing.lg },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: spacing.base },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#fff',
    paddingLeft: spacing.base,
  },
  statLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  urduAmt: { fontSize: 11, color: '#8A8FA8', marginTop: 2, fontFamily: 'serif' },
  tableCard: { borderRadius: 14, elevation: 2, backgroundColor: '#fff', overflow: 'hidden' },
  tableHeader: { backgroundColor: '#F5F7FF' },
  thText: { fontWeight: '700', fontSize: 12, color: '#333' },
  tableRow: { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  modalContainer: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    maxHeight: '80%',
    maxWidth: 500,
    alignSelf: 'center',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalBody: {
    padding: 16,
    gap: 12,
  },
  amountCard: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 4,
  },
  amountLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  filterCard: { padding: spacing.base, borderRadius: 12, marginBottom: spacing.base, elevation: 1 },
  filterRow: { flexDirection: 'row', gap: spacing.md },
});
