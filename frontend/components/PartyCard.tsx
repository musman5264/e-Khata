import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { colors, spacing } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';

interface PartyCardProps {
  party: {
    id: number;
    name: string;
    mobile: string;
    city?: string;
    type: string;
    current_balance: number;
  };
  onPress: () => void;
}

export default function PartyCard({ party, onPress }: PartyCardProps) {
  const balance = party.current_balance ?? 0;
  const isDebit = balance > 0;

  return (
    <TouchableOpacity onPress={onPress} style={styles.container} activeOpacity={0.7}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{party.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text variant="titleSmall" style={{ fontWeight: '600' }}>{party.name}</Text>
        <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
          {party.mobile} {party.city ? `• ${party.city}` : ''}
        </Text>
        <Chip
          compact
          style={[styles.typeChip, {
            backgroundColor: party.type === 'customer' ? '#E3F2FD' : party.type === 'supplier' ? '#FFF3E0' : '#F3E5F5',
          }]}
          textStyle={{ fontSize: 9 }}
        >
          {party.type}
        </Chip>
      </View>
      <View style={styles.balanceCol}>
        <Text variant="titleSmall" style={{
          fontWeight: 'bold',
          color: isDebit ? colors.debit : balance < 0 ? colors.credit : colors.neutral,
        }}>
          {formatCurrency(Math.abs(balance))}
        </Text>
        <Text variant="labelSmall" style={{
          color: isDebit ? colors.debit : colors.credit,
        }}>
          {balance > 0 ? 'Dr' : balance < 0 ? 'Cr' : '—'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    padding: spacing.md, borderRadius: 10, marginBottom: spacing.sm,
    elevation: 1,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary + '20',
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.md,
  },
  avatarText: { fontSize: 16, fontWeight: 'bold', color: colors.primary },
  info: { flex: 1 },
  typeChip: { marginTop: 4, alignSelf: 'flex-start', borderRadius: 6 },
  balanceCol: { alignItems: 'flex-end' },
});
