import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Surface, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

export default function SharedLedgerScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { t } = useTranslation();

  const { data, isLoading, error } = useQuery({
    queryKey: ['shared-ledger', token],
    queryFn: async () => {
      const res = await api.get(`/shared/${token}`);
      return res.data;
    },
    retry: false,
  });

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.centered}>
        <Text variant="titleMedium" style={{ color: colors.error }}>
          {t('share.invalidLink')}
        </Text>
      </View>
    );
  }

  const ledger = data.data;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Surface style={styles.header}>
        <Text variant="headlineSmall" style={{ fontWeight: 'bold', textAlign: 'center' }}>
          {ledger.tenant_name}
        </Text>
        <Text variant="titleMedium" style={{ textAlign: 'center', marginTop: 4 }}>
          {ledger.party_name}
        </Text>
        <Text variant="headlineMedium" style={{
          fontWeight: 'bold', textAlign: 'center', marginTop: spacing.md,
          color: ledger.balance > 0 ? colors.debit : colors.credit,
        }}>
          {formatCurrency(Math.abs(ledger.balance))} {ledger.balance > 0 ? 'Dr' : 'Cr'}
        </Text>
      </Surface>

      {/* Transactions */}
      {ledger.transactions?.map((txn: any) => (
        <Card key={txn.id} style={styles.txnCard} mode="outlined">
          <Card.Content style={styles.txnContent}>
            <View style={{ flex: 1 }}>
              <Text variant="bodySmall" style={{ color: colors.textHint }}>{formatDate(txn.date)}</Text>
              <Text variant="bodyMedium">{txn.description || '—'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text variant="bodyMedium" style={{
                fontWeight: 'bold',
                color: txn.type === 'debit' ? colors.debit : colors.credit,
              }}>
                {formatCurrency(txn.amount)} {txn.type === 'debit' ? 'Dr' : 'Cr'}
              </Text>
              <Text variant="labelSmall" style={{ color: colors.textHint }}>
                Bal: {formatCurrency(txn.running_balance)}
              </Text>
            </View>
          </Card.Content>
        </Card>
      ))}

      <Text variant="labelSmall" style={styles.footer}>
        Powered by e-Khata • Esystematics
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: spacing.xl, borderRadius: 16, elevation: 2, marginBottom: spacing.base },
  txnCard: { marginBottom: spacing.sm, borderRadius: 8 },
  txnContent: { flexDirection: 'row', alignItems: 'center' },
  footer: { textAlign: 'center', color: colors.textHint, marginTop: spacing.xl },
});
