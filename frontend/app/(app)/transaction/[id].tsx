import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, IconButton, Surface, Divider, Menu } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [menuVisible, setMenuVisible] = useState(false);

  const { data: txn, isLoading } = useQuery({
    queryKey: ['transaction', id],
    queryFn: async () => {
      const res = await api.get(`/transactions/${id}`);
      return res.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/transactions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['party-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      router.back();
    },
  });

  const handleDelete = () => {
    Alert.alert(t('common.confirm'), t('transaction.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  };

  if (!txn) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Surface style={[styles.typeCard, { backgroundColor: txn.type === 'debit' ? '#FFEBEE' : '#E0F2F1' }]}>
        <Text variant="headlineLarge" style={{
          fontWeight: 'bold',
          color: txn.type === 'debit' ? colors.debit : colors.credit,
          textAlign: 'center',
        }}>
          {formatCurrency(txn.amount)}
        </Text>
        <Text variant="titleMedium" style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 4 }}>
          {txn.type === 'debit' ? t('transaction.debit') : t('transaction.credit')}
        </Text>
      </Surface>

      <Card style={styles.detailCard} mode="outlined">
        <Card.Content>
          <DetailRow label={t('party.name')} value={txn.party_name || `Party #${txn.party_id}`} />
          <Divider style={{ marginVertical: spacing.sm }} />
          <DetailRow label={t('transaction.date')} value={txn.date} />
          <Divider style={{ marginVertical: spacing.sm }} />
          <DetailRow label={t('transaction.description')} value={txn.description || '—'} />
          <Divider style={{ marginVertical: spacing.sm }} />
          <DetailRow label={t('transaction.runningBalance')} value={formatCurrency(txn.running_balance)} />
          <Divider style={{ marginVertical: spacing.sm }} />
          <DetailRow label={t('common.createdAt')} value={txn.created_at} />
        </Card.Content>
      </Card>

      <View style={styles.actionsRow}>
        <Button
          mode="outlined"
          icon="pencil"
          onPress={() => router.push({ pathname: '/(app)/transaction/edit', params: { id: txn.id } })}
          style={styles.actionBtn}
        >
          {t('common.edit')}
        </Button>
        <Button
          mode="outlined"
          icon="delete"
          textColor={colors.error}
          onPress={handleDelete}
          style={styles.actionBtn}
          loading={deleteMutation.isPending}
        >
          {t('common.delete')}
        </Button>
      </View>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text variant="bodySmall" style={{ color: colors.textSecondary }}>{label}</Text>
      <Text variant="bodyMedium" style={{ fontWeight: '500' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: 40 },
  typeCard: { padding: spacing.xl, borderRadius: 16, marginBottom: spacing.base, elevation: 2 },
  detailCard: { borderRadius: 12, marginBottom: spacing.base },
  actionsRow: { flexDirection: 'row', gap: spacing.md },
  actionBtn: { flex: 1, borderRadius: 8 },
});
