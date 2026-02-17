import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text as RNText } from 'react-native';
import { Text, Surface, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import WebContainer from '@/components/WebContainer';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDateDisplay(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (dateStr === today.toISOString().split('T')[0]) return 'Today';
  if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';
  return `${WEEKDAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

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

  const totalDebit = data?.totals?.total_debit ?? 0;
  const totalCredit = data?.totals?.total_credit ?? 0;
  const net = totalDebit - totalCredit;

  return (
    <WebContainer>
      <View style={styles.container}>
        {/* Date Navigator */}
        <Surface style={styles.dateBar}>
          <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateArrow}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.dateCenter}>
            <Text style={styles.dateLabel}>{formatDateDisplay(date)}</Text>
            <Text style={styles.dateValue}>{date}</Text>
          </View>
          <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateArrow}>
            <MaterialCommunityIcons name="chevron-right" size={28} color={colors.primary} />
          </TouchableOpacity>
        </Surface>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#FFEBEE' }]}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.debit }]}>
              <MaterialCommunityIcons name="arrow-down" size={16} color="#fff" />
            </View>
            <Text style={styles.summaryLabel}>NAAM</Text>
            <Text style={[styles.summaryAmt, { color: colors.debit }]}>
              {formatCurrency(totalDebit)}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#E8F5E9' }]}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.credit }]}>
              <MaterialCommunityIcons name="arrow-up" size={16} color="#fff" />
            </View>
            <Text style={styles.summaryLabel}>JAMA</Text>
            <Text style={[styles.summaryAmt, { color: colors.credit }]}>
              {formatCurrency(totalCredit)}
            </Text>
          </View>
        </View>

        {/* Net */}
        {(totalDebit > 0 || totalCredit > 0) && (
          <Surface style={styles.netBar}>
            <Text style={styles.netLabel}>Net Balance</Text>
            <Text style={[styles.netAmt, { color: net >= 0 ? colors.debit : colors.credit }]}>
              {formatCurrency(Math.abs(net))} {net >= 0 ? 'Dr' : 'Cr'}
            </Text>
          </Surface>
        )}

        {/* Transaction Header */}
        <View style={styles.txnHeader}>
          <Text style={styles.txnHeaderTitle}>Entries</Text>
          <Text style={styles.txnCount}>{data?.transactions?.length ?? 0} transactions</Text>
        </View>

        {/* Transactions */}
        <FlatList
          data={data?.transactions}
          keyExtractor={(item: any) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshing={isLoading}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: { item: any }) => (
            <Surface style={styles.txnCard}>
              <View style={styles.txnContent}>
                <View style={[styles.txnStrip, { backgroundColor: item.type === 'debit' ? colors.debit : colors.credit }]} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.txnParty}>{item.party_name}</Text>
                  <Text style={styles.txnDesc}>{item.description || '—'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.txnAmt, { color: item.type === 'debit' ? colors.debit : colors.credit }]}>
                    {formatCurrency(item.amount)}
                  </Text>
                  <View style={[styles.txnBadge, { backgroundColor: item.type === 'debit' ? '#FFEBEE' : '#E8F5E9' }]}>
                    <RNText style={[styles.txnBadgeText, { color: item.type === 'debit' ? colors.debit : colors.credit }]}>
                      {item.type === 'debit' ? 'NAAM' : 'JAMA'}
                    </RNText>
                  </View>
                </View>
              </View>
            </Surface>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 44 }}>📖</Text>
              <Text style={styles.emptyTitle}>No entries for this day</Text>
              <Text style={styles.emptyDesc}>Navigate to another date or add transactions</Text>
            </View>
          }
        />
      </View>
    </WebContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Date bar
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.base,
    borderRadius: 16,
    elevation: 1,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  dateArrow: { padding: 12 },
  dateCenter: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  dateLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  dateValue: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },

  // Summary
  summaryRow: { flexDirection: 'row', gap: 12, paddingHorizontal: spacing.base },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  summaryIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  summaryLabel: { fontSize: 10, fontWeight: '700', color: colors.textHint, letterSpacing: 0.5, marginTop: 8 },
  summaryAmt: { fontSize: 18, fontWeight: '800', marginTop: 4 },

  // Net
  netBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.base,
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 1,
    backgroundColor: colors.surface,
  },
  netLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  netAmt: { fontSize: 16, fontWeight: '700' },

  // Transaction header
  txnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base + 4,
    paddingTop: 16,
    paddingBottom: 8,
  },
  txnHeaderTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  txnCount: { fontSize: 12, color: colors.textSecondary },

  // List
  list: { paddingHorizontal: spacing.base, paddingBottom: 20 },
  txnCard: { marginBottom: 8, borderRadius: 14, padding: 14, elevation: 1, backgroundColor: colors.surface },
  txnContent: { flexDirection: 'row', alignItems: 'center' },
  txnStrip: { width: 4, height: 36, borderRadius: 2 },
  txnParty: { fontSize: 14, fontWeight: '600', color: colors.text },
  txnDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  txnAmt: { fontSize: 15, fontWeight: '700' },
  txnBadge: { marginTop: 2, paddingHorizontal: 8, paddingVertical: 1, borderRadius: 6 },
  txnBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 10 },
  emptyDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
});
