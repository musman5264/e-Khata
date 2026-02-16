import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { colors, spacing } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';

interface BalanceCardProps {
  label: string;
  amount: number;
  type: 'debit' | 'credit' | 'net';
  subLabel?: string;
}

export default function BalanceCard({ label, amount, type, subLabel }: BalanceCardProps) {
  const bgColor = type === 'debit' ? '#FFEBEE' : type === 'credit' ? '#E0F2F1' : colors.surface;
  const textColor = type === 'debit' ? colors.debit : type === 'credit' ? colors.credit : colors.primary;

  return (
    <Surface style={[styles.card, { backgroundColor: bgColor }]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.amount, { color: textColor }]}>
        {formatCurrency(amount)}
      </Text>
      {subLabel && <Text style={styles.subLabel}>{subLabel}</Text>}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, borderRadius: 12, elevation: 2 },
  label: { fontSize: 11, color: colors.textSecondary },
  amount: { fontSize: 20, fontWeight: 'bold', marginTop: 4 },
  subLabel: { fontSize: 11, color: colors.textHint, marginTop: 2 },
});
