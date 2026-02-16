import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card, FAB, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get('/reports/dashboard');
      return res.data.data;
    },
  });

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Balance Cards */}
        <View style={styles.cardsRow}>
          <Surface style={[styles.balanceCard, styles.receivableCard]}>
            <Text style={styles.cardLabel}>{t('dashboard.receivable')}</Text>
            <Text style={[styles.cardValue, { color: colors.debit }]}>
              {formatCurrency(data?.total_receivable ?? 0)}
            </Text>
          </Surface>
          <Surface style={[styles.balanceCard, styles.payableCard]}>
            <Text style={styles.cardLabel}>{t('dashboard.payable')}</Text>
            <Text style={[styles.cardValue, { color: colors.credit }]}>
              {formatCurrency(data?.total_payable ?? 0)}
            </Text>
          </Surface>
        </View>

        {/* Net Balance */}
        <Surface style={styles.netCard}>
          <Text style={styles.cardLabel}>{t('dashboard.netBalance')}</Text>
          <Text style={[styles.netValue, { color: colors.primary }]}>
            {formatCurrency(data?.net_balance ?? 0)}
          </Text>
          <Text style={styles.partyCount}>
            {data?.party_count ?? 0} {t('dashboard.parties')}
          </Text>
        </Surface>

        {/* Recent Transactions */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {t('dashboard.recentTransactions')}
        </Text>
        {data?.recent_transactions?.map((txn: any) => (
          <Card key={txn.id} style={styles.txnCard} mode="outlined">
            <Card.Content style={styles.txnContent}>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                  {txn.party_name}
                </Text>
                <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                  {txn.description || txn.date}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  variant="bodyMedium"
                  style={{
                    fontWeight: 'bold',
                    color: txn.type === 'debit' ? colors.debit : colors.credit,
                  }}
                >
                  {txn.type === 'debit' ? '+' : '-'} {formatCurrency(txn.amount)}
                </Text>
                <Text variant="labelSmall" style={{ color: colors.textHint }}>
                  {txn.type === 'debit' ? 'Dr' : 'Cr'}
                </Text>
              </View>
            </Card.Content>
          </Card>
        ))}

        {(!data?.recent_transactions || data.recent_transactions.length === 0) && (
          <Text style={styles.emptyText}>{t('common.noData')}</Text>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/(app)/party/create')}
        color={colors.onPrimary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.base },
  cardsRow: { flexDirection: 'row', gap: spacing.md },
  balanceCard: {
    flex: 1, padding: spacing.base, borderRadius: 12, elevation: 2,
  },
  receivableCard: { backgroundColor: '#FFEBEE' },
  payableCard: { backgroundColor: '#E0F2F1' },
  cardLabel: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  cardValue: { fontSize: 20, fontWeight: 'bold' },
  netCard: {
    marginTop: spacing.md, padding: spacing.base, borderRadius: 12,
    elevation: 2, alignItems: 'center',
  },
  netValue: { fontSize: 28, fontWeight: 'bold', marginTop: 4 },
  partyCount: { fontSize: 12, color: colors.textHint, marginTop: 4 },
  sectionTitle: { marginTop: spacing.xl, marginBottom: spacing.md, fontWeight: '600' },
  txnCard: { marginBottom: spacing.sm, borderRadius: 8 },
  txnContent: { flexDirection: 'row', alignItems: 'center' },
  emptyText: { textAlign: 'center', color: colors.textHint, marginTop: spacing.xl },
  fab: {
    position: 'absolute', right: spacing.base, bottom: spacing.base,
    backgroundColor: colors.primary,
  },
});
