import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';

export default function PaymentHistoryScreen() {
  const { t } = useTranslation();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['payments'],
    queryFn: async () => {
      const res = await api.get('/payments');
      return res.data.data;
    },
  });

  const statusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'failed': return '#F44336';
      default: return colors.textHint;
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item: any) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={refetch}
        renderItem={({ item }: { item: any }) => (
          <Card style={styles.card} mode="outlined">
            <Card.Content style={styles.cardContent}>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                  {item.party_name || `Party #${item.party_id}`}
                </Text>
                <View style={styles.metaRow}>
                  <Chip compact style={[styles.statusChip, { backgroundColor: statusColor(item.status) + '20' }]}
                    textStyle={{ fontSize: 10, color: statusColor(item.status) }}>
                    {item.status}
                  </Chip>
                  <Text variant="labelSmall" style={{ color: colors.textHint }}>
                    {item.gateway} • {item.direction}
                  </Text>
                </View>
                <Text variant="bodySmall" style={{ color: colors.textSecondary, marginTop: 2 }}>
                  {item.created_at}
                </Text>
              </View>
              <Text variant="titleSmall" style={{
                fontWeight: 'bold',
                color: item.direction === 'inbound' ? colors.credit : colors.debit,
              }}>
                {formatCurrency(item.amount)}
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
  list: { padding: spacing.base, paddingBottom: 20 },
  card: { marginBottom: spacing.sm, borderRadius: 10 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 4 },
  statusChip: { borderRadius: 10 },
  emptyText: { textAlign: 'center', color: colors.textHint, marginTop: spacing.xxl },
});
