import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Surface, IconButton } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';

export default function DaybookScreen() {
  const { t } = useTranslation();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['daybook', date],
    queryFn: async () => {
      const res = await api.get('/reports/daybook', { params: { date } });
      return res.data.data;
    },
  });

  const changeDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  return (
    <View style={styles.container}>
      {/* Date Selector */}
      <Surface style={styles.dateBar}>
        <IconButton icon="chevron-left" onPress={() => changeDate(-1)} />
        <Text variant="titleMedium" style={{ fontWeight: '600' }}>{date}</Text>
        <IconButton icon="chevron-right" onPress={() => changeDate(1)} />
      </Surface>

      {/* Totals */}
      <View style={styles.totalsRow}>
        <Surface style={[styles.totalCard, { backgroundColor: '#FFEBEE' }]}>
          <Text style={styles.totalLabel}>{t('transaction.debit')}</Text>
          <Text style={[styles.totalValue, { color: colors.debit }]}>
            {formatCurrency(data?.totals?.total_debit ?? 0)}
          </Text>
        </Surface>
        <Surface style={[styles.totalCard, { backgroundColor: '#E0F2F1' }]}>
          <Text style={styles.totalLabel}>{t('transaction.credit')}</Text>
          <Text style={[styles.totalValue, { color: colors.credit }]}>
            {formatCurrency(data?.totals?.total_credit ?? 0)}
          </Text>
        </Surface>
      </View>

      {/* Transactions */}
      <FlatList
        data={data?.transactions}
        keyExtractor={(item: any) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={refetch}
        renderItem={({ item }: { item: any }) => (
          <Card style={styles.txnCard} mode="outlined">
            <Card.Content style={styles.txnContent}>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                  {item.party_name}
                </Text>
                <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                  {item.description || '—'}
                </Text>
              </View>
              <Text
                variant="bodyMedium"
                style={{
                  fontWeight: 'bold',
                  color: item.type === 'debit' ? colors.debit : colors.credit,
                }}
              >
                {formatCurrency(item.amount)} {item.type === 'debit' ? 'Dr' : 'Cr'}
              </Text>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('common.noData')}</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  dateBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    margin: spacing.base, borderRadius: 12, elevation: 2, paddingVertical: 4,
  },
  totalsRow: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.base },
  totalCard: { flex: 1, padding: spacing.md, borderRadius: 10, elevation: 1, alignItems: 'center' },
  totalLabel: { fontSize: 11, color: colors.textSecondary },
  totalValue: { fontSize: 18, fontWeight: 'bold', marginTop: 2 },
  list: { paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: 20 },
  txnCard: { marginBottom: spacing.sm, borderRadius: 8 },
  txnContent: { flexDirection: 'row', alignItems: 'center' },
  emptyText: { textAlign: 'center', color: colors.textHint, marginTop: spacing.xxl },
});
