import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { colors, spacing } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';

interface TransactionRowProps {
  transaction: {
    id: number;
    date: string;
    type: 'debit' | 'credit';
    amount: number;
    running_balance: number;
    description?: string;
    party_name?: string;
  };
  onPress?: () => void;
  showParty?: boolean;
}

export default function TransactionRow({ transaction, onPress, showParty = false }: TransactionRowProps) {
  const txn = transaction;

  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.7} disabled={!onPress}>
      <View style={[styles.typeIndicator, { backgroundColor: txn.type === 'debit' ? colors.debit : colors.credit }]} />
      <View style={styles.info}>
        <Text variant="bodySmall" style={{ color: colors.textHint }}>{txn.date}</Text>
        {showParty && txn.party_name && (
          <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{txn.party_name}</Text>
        )}
        <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
          {txn.description || '—'}
        </Text>
      </View>
      <View style={styles.amountCol}>
        <Text variant="bodyMedium" style={{
          fontWeight: 'bold',
          color: txn.type === 'debit' ? colors.debit : colors.credit,
        }}>
          {formatCurrency(txn.amount)}
        </Text>
        <Text variant="labelSmall" style={{ color: colors.textHint }}>
          Bal: {formatCurrency(txn.running_balance)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    paddingVertical: spacing.md, paddingRight: spacing.md,
    borderRadius: 8, marginBottom: spacing.sm, elevation: 1,
  },
  typeIndicator: { width: 4, height: '100%', borderTopLeftRadius: 8, borderBottomLeftRadius: 8, marginRight: spacing.md },
  info: { flex: 1 },
  amountCol: { alignItems: 'flex-end' },
});
