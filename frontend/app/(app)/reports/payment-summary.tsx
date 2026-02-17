import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, Surface, DataTable, ActivityIndicator, Chip, Modal, Portal, IconButton, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate, formatDateTime } from '@/utils/formatDate';
import ReportActions from '@/components/ReportActions';

export default function PaymentSummaryScreen() {
  const { t } = useTranslation();
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['payment-summary'],
    queryFn: async () => {
      const res = await api.get('/reports/payment-summary');
      return res.data.data;
    },
  });

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
        {data?.payments?.length > 0 && <ReportActions />}
      </View>

      <View style={styles.statsRow}>
        <Surface style={styles.statCard}>
          <Text style={styles.statLabel}>{t('payment.collect')}</Text>
          <Text style={[styles.statValue, { color: colors.credit }]}>
            {formatCurrency(data?.summary?.total_collected ?? 0)}
          </Text>
        </Surface>
        <Surface style={styles.statCard}>
          <Text style={styles.statLabel}>{t('payment.send')}</Text>
          <Text style={[styles.statValue, { color: colors.debit }]}>
            {formatCurrency(data?.summary?.total_sent ?? 0)}
          </Text>
        </Surface>
        <Surface style={styles.statCard}>
          <Text style={styles.statLabel}>{t('payment.pending')}</Text>
          <Text style={[styles.statValue, { color: colors.warning }]}>
            {formatCurrency(data?.summary?.total_pending ?? 0)}
          </Text>
        </Surface>
      </View>

      <Surface style={styles.tableCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <DataTable style={{ minWidth: 600 }}>
            <DataTable.Header>
              <DataTable.Title style={{ flex: 1, minWidth: 80 }}>{t('common.type')}</DataTable.Title>
              <DataTable.Title style={{ flex: 1.2, minWidth: 100 }}>{t('payment.gateway')}</DataTable.Title>
              <DataTable.Title numeric style={{ flex: 1.2, minWidth: 110 }}>{t('common.amount')}</DataTable.Title>
              <DataTable.Title style={{ flex: 1, minWidth: 90 }}>{t('common.status')}</DataTable.Title>
              <DataTable.Title style={{ flex: 1.2, minWidth: 100 }}>{t('common.date')}</DataTable.Title>
            </DataTable.Header>

            {data?.payments?.map((p: any) => (
              <DataTable.Row key={p.id} onPress={() => openDetail(p)} style={{ cursor: 'pointer' }}>
                <DataTable.Cell style={{ flex: 1, minWidth: 80 }}>
                  <Text style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: p.type === 'collect' ? colors.credit : colors.debit,
                  }}>
                    {p.type === 'collect' ? t('payment.collect') : t('payment.send')}
                  </Text>
                </DataTable.Cell>
                <DataTable.Cell style={{ flex: 1.2, minWidth: 100 }}>
                  <Text style={{ fontSize: 12, textTransform: 'capitalize' }}>{p.gateway}</Text>
                </DataTable.Cell>
                <DataTable.Cell numeric style={{ flex: 1.2, minWidth: 110 }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 13 }}>{formatCurrency(p.amount)}</Text>
                </DataTable.Cell>
                <DataTable.Cell style={{ flex: 1, minWidth: 90 }}>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor(p.status) + '20' }]}>
                    <Text style={{ color: statusColor(p.status), fontWeight: '600', fontSize: 11 }}>
                      {p.status}
                    </Text>
                  </View>
                </DataTable.Cell>
                <DataTable.Cell style={{ flex: 1.2, minWidth: 100 }}>
                  <Text style={{ fontSize: 12 }}>{formatDate(p.created_at)}</Text>
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
  statCard: { flex: 1, padding: spacing.md, borderRadius: 12, elevation: 1, alignItems: 'center', backgroundColor: '#fff' },
  statLabel: { fontSize: 11, color: colors.textSecondary },
  statValue: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  tableCard: { borderRadius: 12, elevation: 1 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
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
});
