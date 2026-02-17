import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text as RNText, Platform, useWindowDimensions } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';

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
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web' && width > 768;

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

  // ═══════════════════════════════════
  // WEB VIEW
  // ═══════════════════════════════════
  if (isWeb) {
    return (
      <View style={wStyles.container}>
        {/* Top bar */}
        <View style={wStyles.topBar}>
          <View>
            <Text style={wStyles.title}>Daybook</Text>
            <Text style={wStyles.subtitle}>Daily transaction ledger</Text>
          </View>
        </View>

        {/* Date + Stats row */}
        <View style={wStyles.statsRow}>
          <Surface style={wStyles.dateCard}>
            <TouchableOpacity onPress={() => changeDate(-1)} style={wStyles.dateArrow}>
              <MaterialCommunityIcons name="chevron-left" size={24} color={colors.primary} />
            </TouchableOpacity>
            <View style={wStyles.dateCenter}>
              <Text style={wStyles.dateLabel}>{formatDateDisplay(date)}</Text>
              <Text style={wStyles.dateValue}>{date}</Text>
            </View>
            <TouchableOpacity onPress={() => changeDate(1)} style={wStyles.dateArrow}>
              <MaterialCommunityIcons name="chevron-right" size={24} color={colors.primary} />
            </TouchableOpacity>
          </Surface>

          <Surface style={wStyles.statCard}>
            <View style={[wStyles.statIcon, { backgroundColor: '#FFF0F0' }]}>
              <MaterialCommunityIcons name="arrow-bottom-left" size={18} color={colors.debit} />
            </View>
            <View>
              <Text style={wStyles.statLabel}>NAAM (Debit)</Text>
              <Text style={[wStyles.statValue, { color: colors.debit }]}>{formatCurrency(totalDebit)}</Text>
            </View>
          </Surface>

          <Surface style={wStyles.statCard}>
            <View style={[wStyles.statIcon, { backgroundColor: '#F0FFF4' }]}>
              <MaterialCommunityIcons name="arrow-top-right" size={18} color={colors.credit} />
            </View>
            <View>
              <Text style={wStyles.statLabel}>JAMA (Credit)</Text>
              <Text style={[wStyles.statValue, { color: colors.credit }]}>{formatCurrency(totalCredit)}</Text>
            </View>
          </Surface>

          <Surface style={wStyles.statCard}>
            <View style={[wStyles.statIcon, { backgroundColor: '#EEF0FF' }]}>
              <MaterialCommunityIcons name="scale-balance" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={wStyles.statLabel}>Net Balance</Text>
              <Text style={[wStyles.statValue, { color: net >= 0 ? colors.debit : colors.credit }]}>
                {formatCurrency(Math.abs(net))} {net >= 0 ? 'Dr' : 'Cr'}
              </Text>
            </View>
          </Surface>
        </View>

        {/* Table */}
        <Surface style={wStyles.table}>
          <View style={wStyles.tableHeader}>
            <Text style={[wStyles.th, { width: 50 }]}>#</Text>
            <Text style={[wStyles.th, { flex: 2 }]}>Party</Text>
            <Text style={[wStyles.th, { flex: 3 }]}>Description</Text>
            <Text style={[wStyles.th, { flex: 1.5, textAlign: 'right' }]}>Amount</Text>
            <Text style={[wStyles.th, { width: 80, textAlign: 'center' }]}>Type</Text>
          </View>
          <FlatList
            data={data?.transactions}
            keyExtractor={(item: any) => item.id.toString()}
            refreshing={isLoading}
            onRefresh={refetch}
            renderItem={({ item, index }: { item: any; index: number }) => (
              <View style={wStyles.tableRow}>
                <Text style={[wStyles.td, { width: 50, color: '#B0B5C8' }]}>{index + 1}</Text>
                <Text style={[wStyles.td, wStyles.tdBold, { flex: 2 }]}>{item.party_name}</Text>
                <Text style={[wStyles.td, { flex: 3 }]}>{item.description || '—'}</Text>
                <Text style={[wStyles.td, { flex: 1.5, textAlign: 'right', fontWeight: '700', color: item.type === 'debit' ? colors.debit : colors.credit }]}>
                  {formatCurrency(item.amount)}
                </Text>
                <View style={{ width: 80, alignItems: 'center' }}>
                  <View style={[wStyles.typeBadge, { backgroundColor: item.type === 'debit' ? '#FFF0F0' : '#F0FFF4' }]}>
                    <RNText style={[wStyles.typeText, { color: item.type === 'debit' ? colors.debit : colors.credit }]}>
                      {item.type === 'debit' ? 'NAAM' : 'JAMA'}
                    </RNText>
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={wStyles.empty}>
                <MaterialCommunityIcons name="book-open-page-variant-outline" size={48} color="#D1D5DB" />
                <Text style={wStyles.emptyTitle}>No entries for this day</Text>
                <Text style={wStyles.emptyDesc}>Navigate to another date</Text>
              </View>
            }
          />
        </Surface>
      </View>
    );
  }

  // ═══════════════════════════════════
  // MOBILE VIEW
  // ═══════════════════════════════════
  return (
    <View style={mStyles.container}>
      {/* Date Navigator */}
      <Surface style={mStyles.dateBar}>
        <TouchableOpacity onPress={() => changeDate(-1)} style={mStyles.dateArrow}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.primary} />
        </TouchableOpacity>
        <View style={mStyles.dateCenter}>
          <Text style={mStyles.dateLabel}>{formatDateDisplay(date)}</Text>
          <Text style={mStyles.dateValue}>{date}</Text>
        </View>
        <TouchableOpacity onPress={() => changeDate(1)} style={mStyles.dateArrow}>
          <MaterialCommunityIcons name="chevron-right" size={28} color={colors.primary} />
        </TouchableOpacity>
      </Surface>

      {/* Summary Cards */}
      <View style={mStyles.summaryRow}>
        <View style={[mStyles.summaryCard, { backgroundColor: '#FFF0F0' }]}>
          <View style={[mStyles.summaryIcon, { backgroundColor: colors.debit }]}>
            <MaterialCommunityIcons name="arrow-bottom-left" size={16} color="#fff" />
          </View>
          <Text style={mStyles.summaryLabel}>NAAM</Text>
          <Text style={[mStyles.summaryAmt, { color: colors.debit }]}>{formatCurrency(totalDebit)}</Text>
        </View>
        <View style={[mStyles.summaryCard, { backgroundColor: '#F0FFF4' }]}>
          <View style={[mStyles.summaryIcon, { backgroundColor: colors.credit }]}>
            <MaterialCommunityIcons name="arrow-top-right" size={16} color="#fff" />
          </View>
          <Text style={mStyles.summaryLabel}>JAMA</Text>
          <Text style={[mStyles.summaryAmt, { color: colors.credit }]}>{formatCurrency(totalCredit)}</Text>
        </View>
      </View>

      {(totalDebit > 0 || totalCredit > 0) && (
        <Surface style={mStyles.netBar}>
          <Text style={mStyles.netLabel}>Net Balance</Text>
          <Text style={[mStyles.netAmt, { color: net >= 0 ? colors.debit : colors.credit }]}>
            {formatCurrency(Math.abs(net))} {net >= 0 ? 'Dr' : 'Cr'}
          </Text>
        </Surface>
      )}

      <View style={mStyles.txnHeader}>
        <Text style={mStyles.txnHeaderTitle}>Entries</Text>
        <Text style={mStyles.txnCount}>{data?.transactions?.length ?? 0} transactions</Text>
      </View>

      <FlatList
        data={data?.transactions}
        keyExtractor={(item: any) => item.id.toString()}
        contentContainerStyle={mStyles.list}
        refreshing={isLoading}
        onRefresh={refetch}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }: { item: any }) => (
          <Surface style={mStyles.txnCard}>
            <View style={mStyles.txnContent}>
              <View style={[mStyles.txnStrip, { backgroundColor: item.type === 'debit' ? colors.debit : colors.credit }]} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={mStyles.txnParty}>{item.party_name}</Text>
                <Text style={mStyles.txnDesc}>{item.description || '—'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[mStyles.txnAmt, { color: item.type === 'debit' ? colors.debit : colors.credit }]}>
                  {formatCurrency(item.amount)}
                </Text>
                <View style={[mStyles.txnBadge, { backgroundColor: item.type === 'debit' ? '#FFF0F0' : '#F0FFF4' }]}>
                  <RNText style={[mStyles.txnBadgeText, { color: item.type === 'debit' ? colors.debit : colors.credit }]}>
                    {item.type === 'debit' ? 'NAAM' : 'JAMA'}
                  </RNText>
                </View>
              </View>
            </View>
          </Surface>
        )}
        ListEmptyComponent={
          <View style={mStyles.empty}>
            <MaterialCommunityIcons name="book-open-page-variant-outline" size={48} color="#D1D5DB" />
            <Text style={mStyles.emptyTitle}>No entries for this day</Text>
            <Text style={mStyles.emptyDesc}>Navigate to another date or add transactions</Text>
          </View>
        }
      />
    </View>
  );
}

/* ═══ WEB STYLES ═══ */
const wStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA', padding: 32 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: '#8A8FA8', marginTop: 2 },

  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  dateCard: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 6,
    borderRadius: 12, elevation: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ECEEF5',
    minWidth: 220,
  },
  dateArrow: { padding: 8 },
  dateCenter: { flex: 1, alignItems: 'center' },
  dateLabel: { fontSize: 15, fontWeight: '700', color: colors.text },
  dateValue: { fontSize: 11, color: '#8A8FA8', marginTop: 1 },

  statCard: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, borderRadius: 12, elevation: 0, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#ECEEF5',
  },
  statIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 11, color: '#8A8FA8', fontWeight: '500' },
  statValue: { fontSize: 18, fontWeight: '800', marginTop: 2 },

  table: { flex: 1, borderRadius: 14, overflow: 'hidden', elevation: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ECEEF5' },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#F8F9FC', borderBottomWidth: 1, borderBottomColor: '#ECEEF5', alignItems: 'center' },
  th: { fontSize: 11, fontWeight: '700', color: '#8A8FA8', letterSpacing: 0.5, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },
  td: { fontSize: 13, color: '#6C7293' },
  tdBold: { fontWeight: '600', color: colors.text },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  typeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  empty: { paddingVertical: 60, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  emptyDesc: { fontSize: 13, color: '#8A8FA8' },
});

/* ═══ MOBILE STYLES ═══ */
const mStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  dateBar: { flexDirection: 'row', alignItems: 'center', margin: spacing.base, borderRadius: 16, elevation: 1, backgroundColor: colors.surface, overflow: 'hidden' },
  dateArrow: { padding: 12 },
  dateCenter: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  dateLabel: { fontSize: 16, fontWeight: '700', color: colors.text },
  dateValue: { fontSize: 11, color: '#8A8FA8', marginTop: 2 },

  summaryRow: { flexDirection: 'row', gap: 12, paddingHorizontal: spacing.base },
  summaryCard: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center' },
  summaryIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  summaryLabel: { fontSize: 10, fontWeight: '700', color: '#B0B5C8', letterSpacing: 0.5, marginTop: 8 },
  summaryAmt: { fontSize: 18, fontWeight: '800', marginTop: 4 },

  netBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: spacing.base, marginTop: 10, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, elevation: 1, backgroundColor: colors.surface },
  netLabel: { fontSize: 13, fontWeight: '600', color: '#8A8FA8' },
  netAmt: { fontSize: 16, fontWeight: '700' },

  txnHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base + 4, paddingTop: 16, paddingBottom: 8 },
  txnHeaderTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  txnCount: { fontSize: 12, color: '#8A8FA8' },

  list: { paddingHorizontal: spacing.base, paddingBottom: 20 },
  txnCard: { marginBottom: 8, borderRadius: 14, padding: 14, elevation: 1, backgroundColor: colors.surface },
  txnContent: { flexDirection: 'row', alignItems: 'center' },
  txnStrip: { width: 4, height: 36, borderRadius: 2 },
  txnParty: { fontSize: 14, fontWeight: '600', color: colors.text },
  txnDesc: { fontSize: 12, color: '#8A8FA8', marginTop: 2 },
  txnAmt: { fontSize: 15, fontWeight: '700' },
  txnBadge: { marginTop: 2, paddingHorizontal: 8, paddingVertical: 1, borderRadius: 6 },
  txnBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

  empty: { alignItems: 'center', paddingVertical: 50, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  emptyDesc: { fontSize: 13, color: '#8A8FA8' },
});
