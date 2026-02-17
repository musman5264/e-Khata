import React, { useState } from 'react';
import { View, StyleSheet, FlatList, ScrollView, TouchableOpacity, Text as RNText, Platform, useWindowDimensions } from 'react-native';
import { Text, Surface, TextInput, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import { formatCurrency, formatCurrencyUrdu } from '@/utils/formatCurrency';
import { formatDate as fmtDate } from '@/utils/formatDate';
import ReportActions from '@/components/ReportActions';
import DateInput from '@/components/DateInput';

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
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [rangeMode, setRangeMode] = useState(false);
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web' && width > 768;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['daybook', rangeMode ? `${dateFrom}-${dateTo}` : date],
    queryFn: async () => {
      const params: any = {};
      if (rangeMode && dateFrom && dateTo) {
        params.date_from = dateFrom;
        params.date_to = dateTo;
      } else {
        params.date = date;
      }
      const res = await api.get('/reports/daybook', { params });
      return res.data.data;
    },
  });

  const changeDate = (days: number) => {
    if (rangeMode) return;
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().split('T')[0]);
  };

  const totalDebit = data?.totals?.total_debit ?? 0;
  const totalCredit = data?.totals?.total_credit ?? 0;
  const net = totalDebit - totalCredit;
  const hasData = (data?.transactions?.length ?? 0) > 0;

  // ═══════════════════════════════════
  // WEB VIEW
  // ═══════════════════════════════════
  if (isWeb) {
    return (
      <ScrollView style={wStyles.container} contentContainerStyle={{ padding: 32, paddingBottom: 60 }}>
        {/* Top bar */}
        <View style={wStyles.topBar}>
          <View>
            <Text style={wStyles.title}>Daybook</Text>
            <Text style={wStyles.subtitle}>Daily transaction ledger</Text>
          </View>
          {hasData && <ReportActions reportTitle="Daybook" />}
        </View>

        {/* Date Filter Card */}
        <Surface style={wStyles.filterCard} nativeID="report-filter-card">
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            {/* Single Day Navigator */}
            <Surface style={wStyles.dateCard}>
              <TouchableOpacity onPress={() => changeDate(-1)} style={wStyles.dateArrow} disabled={rangeMode}>
                <MaterialCommunityIcons name="chevron-left" size={24} color={rangeMode ? '#ccc' : colors.primary} />
              </TouchableOpacity>
              <View style={wStyles.dateCenter}>
                <Text style={wStyles.dateLabel}>{formatDateDisplay(date)}</Text>
                <Text style={wStyles.dateValue}>{fmtDate(date)}</Text>
              </View>
              <TouchableOpacity onPress={() => changeDate(1)} style={wStyles.dateArrow} disabled={rangeMode}>
                <MaterialCommunityIcons name="chevron-right" size={24} color={rangeMode ? '#ccc' : colors.primary} />
              </TouchableOpacity>
            </Surface>

            {/* Date Range Toggle */}
            <TouchableOpacity
              style={[wStyles.rangeToggle, rangeMode && wStyles.rangeToggleActive]}
              onPress={() => setRangeMode(!rangeMode)}
            >
              <MaterialCommunityIcons name="calendar-range" size={18} color={rangeMode ? '#fff' : colors.primary} />
              <Text style={{ fontSize: 12, fontWeight: '600', color: rangeMode ? '#fff' : colors.primary, marginLeft: 6 }}>
                Date Range
              </Text>
            </TouchableOpacity>

            {/* Date Range Inputs */}
            {rangeMode && (
              <>
                <View style={{ minWidth: 150 }}>
                  <DateInput
                    label="From"
                    value={dateFrom}
                    onChangeText={setDateFrom}
                  />
                </View>
                <View style={{ minWidth: 150 }}>
                  <DateInput
                    label="To"
                    value={dateTo}
                    onChangeText={setDateTo}
                  />
                </View>
                <Button
                  mode="contained"
                  onPress={() => refetch()}
                  disabled={!dateFrom || !dateTo}
                  style={{ borderRadius: 8, height: 40, justifyContent: 'center' }}
                  icon="magnify"
                  compact
                >
                  Filter
                </Button>
              </>
            )}
          </View>
        </Surface>

        {/* Printable report area */}
        <View nativeID="printable-report">
        {/* Stats row — 2-column layout to prevent number truncation */}
        <View style={wStyles.statsRow}>
          {/* Card 1: Debit + Credit stacked */}
          <Surface style={wStyles.statCardDouble}>
            <View style={wStyles.statDoubleRow}>
              <View style={[wStyles.statIcon, { backgroundColor: '#FFF0F0' }]}>
                <MaterialCommunityIcons name="arrow-bottom-left" size={18} color={colors.debit} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={wStyles.statLabel}>NAAM (Debit)</Text>
                <Text style={[wStyles.statValue, { color: colors.debit }]}>{formatCurrency(totalDebit)}</Text>
                <Text style={wStyles.urduAmt}>{formatCurrencyUrdu(totalDebit)}</Text>
              </View>
            </View>
            <View style={wStyles.statDivider} />
            <View style={wStyles.statDoubleRow}>
              <View style={[wStyles.statIcon, { backgroundColor: '#F0FFF4' }]}>
                <MaterialCommunityIcons name="arrow-top-right" size={18} color={colors.credit} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={wStyles.statLabel}>JAMA (Credit)</Text>
                <Text style={[wStyles.statValue, { color: colors.credit }]}>{formatCurrency(totalCredit)}</Text>
                <Text style={wStyles.urduAmt}>{formatCurrencyUrdu(totalCredit)}</Text>
              </View>
            </View>
          </Surface>

          {/* Card 2: Net Balance */}
          <Surface style={wStyles.statCardNet}>
            <View style={[wStyles.statIcon, { backgroundColor: '#EEF0FF', width: 44, height: 44, borderRadius: 12 }]}>
              <MaterialCommunityIcons name="scale-balance" size={22} color={colors.primary} />
            </View>
            <Text style={wStyles.statLabel}>Net Balance</Text>
            <Text style={[wStyles.statValueLarge, { color: net >= 0 ? colors.debit : colors.credit }]}>
              {formatCurrency(Math.abs(net))}
            </Text>
            <Text style={wStyles.urduAmt}>{formatCurrencyUrdu(Math.abs(net))}</Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: net >= 0 ? colors.debit : colors.credit }}>
              {net >= 0 ? 'Dr (نام)' : 'Cr (جمع)'}
            </Text>
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
      </ScrollView>
    );
  }

  // ═══════════════════════════════════
  // MOBILE VIEW
  // ═══════════════════════════════════
  return (
    <View style={mStyles.container}>
      {/* Header with ReportActions */}
      {hasData && (
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: spacing.base, paddingTop: 8 }}>
          <ReportActions reportTitle="Daybook" compact />
        </View>
      )}

      {/* Date Navigator */}
      <Surface style={mStyles.dateBar} nativeID="report-filter-card">
        <TouchableOpacity onPress={() => changeDate(-1)} style={mStyles.dateArrow} disabled={rangeMode}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={rangeMode ? '#ccc' : colors.primary} />
        </TouchableOpacity>
        <View style={mStyles.dateCenter}>
          <Text style={mStyles.dateLabel}>{formatDateDisplay(date)}</Text>
          <Text style={mStyles.dateValue}>{fmtDate(date)}</Text>
        </View>
        <TouchableOpacity onPress={() => changeDate(1)} style={mStyles.dateArrow} disabled={rangeMode}>
          <MaterialCommunityIcons name="chevron-right" size={28} color={rangeMode ? '#ccc' : colors.primary} />
        </TouchableOpacity>
      </Surface>

      {/* Date Range Toggle + Inputs */}
      <View style={{ paddingHorizontal: spacing.base, marginTop: 8 }}>
        <TouchableOpacity
          style={[mStyles.rangeToggle, rangeMode && mStyles.rangeToggleActive]}
          onPress={() => setRangeMode(!rangeMode)}
        >
          <MaterialCommunityIcons name="calendar-range" size={16} color={rangeMode ? '#fff' : colors.primary} />
          <Text style={{ fontSize: 12, fontWeight: '600', color: rangeMode ? '#fff' : colors.primary, marginLeft: 6 }}>
            Date Range Filter
          </Text>
        </TouchableOpacity>

        {rangeMode && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <DateInput
              label="From"
              value={dateFrom}
              onChangeText={setDateFrom}
              style={{ flex: 1 }}
            />
            <DateInput
              label="To"
              value={dateTo}
              onChangeText={setDateTo}
              style={{ flex: 1 }}
            />
            <Button
              mode="contained"
              onPress={() => refetch()}
              disabled={!dateFrom || !dateTo}
              compact
              style={{ borderRadius: 8, justifyContent: 'center' }}
            >
              Go
            </Button>
          </View>
        )}
      </View>

      {/* Printable area */}
      <View nativeID="printable-report">
      {/* Summary Cards — 2-column layout */}
      <View style={mStyles.summaryRow}>
        {/* Card 1: Debit + Credit */}
        <View style={[mStyles.summaryCardDouble, { backgroundColor: '#fff' }]}>
          <View style={mStyles.summaryDoubleRow}>
            <View style={[mStyles.summaryIcon, { backgroundColor: colors.debit }]}>
              <MaterialCommunityIcons name="arrow-bottom-left" size={14} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={mStyles.summaryLabel}>NAAM (نام)</Text>
              <Text style={[mStyles.summaryAmt, { color: colors.debit }]}>{formatCurrency(totalDebit)}</Text>
              <Text style={mStyles.urduAmt}>{formatCurrencyUrdu(totalDebit)}</Text>
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: '#F3F4F6', marginVertical: 8 }} />
          <View style={mStyles.summaryDoubleRow}>
            <View style={[mStyles.summaryIcon, { backgroundColor: colors.credit }]}>
              <MaterialCommunityIcons name="arrow-top-right" size={14} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={mStyles.summaryLabel}>JAMA (جمع)</Text>
              <Text style={[mStyles.summaryAmt, { color: colors.credit }]}>{formatCurrency(totalCredit)}</Text>
              <Text style={mStyles.urduAmt}>{formatCurrencyUrdu(totalCredit)}</Text>
            </View>
          </View>
        </View>
        {/* Card 2: Net Balance */}
        <View style={[mStyles.summaryCardNet, { backgroundColor: '#fff' }]}>
          <View style={[mStyles.summaryIcon, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name="scale-balance" size={14} color="#fff" />
          </View>
          <Text style={mStyles.summaryLabel}>Net Balance</Text>
          <Text style={[mStyles.summaryAmtLarge, { color: net >= 0 ? colors.debit : colors.credit }]}>
            {formatCurrency(Math.abs(net))}
          </Text>
          <Text style={mStyles.urduAmt}>{formatCurrencyUrdu(Math.abs(net))}</Text>
          <Text style={{ fontSize: 11, fontWeight: '600', color: net >= 0 ? colors.debit : colors.credit, marginTop: 2 }}>
            {net >= 0 ? 'Dr (نام)' : 'Cr (جمع)'}
          </Text>
        </View>
      </View>

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
    </View>
  );
}

/* ═══ WEB STYLES ═══ */
const wStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: '#8A8FA8', marginTop: 2 },

  filterCard: {
    padding: 16, borderRadius: 14, backgroundColor: '#fff', elevation: 1, marginBottom: 24,
    borderWidth: 1, borderColor: '#ECEEF5',
  },

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

  rangeToggle: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1, borderColor: colors.primary, backgroundColor: '#fff',
  },
  rangeToggleActive: {
    backgroundColor: colors.primary, borderColor: colors.primary,
  },

  /* 2-card layout for stats */
  statCardDouble: {
    flex: 1, padding: 16, borderRadius: 14, elevation: 0, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#ECEEF5',
  },
  statDoubleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statDivider: { height: 1, backgroundColor: '#F3F4F6', marginVertical: 10 },
  statCardNet: {
    flex: 1, padding: 20, borderRadius: 14, elevation: 0, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#ECEEF5', alignItems: 'center', justifyContent: 'center',
  },
  statIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: 11, color: '#8A8FA8', fontWeight: '500' },
  statValue: { fontSize: 17, fontWeight: '800', marginTop: 2 },
  statValueLarge: { fontSize: 22, fontWeight: '800', marginTop: 6 },
  urduAmt: { fontSize: 10, color: '#8A8FA8', marginTop: 1 },

  table: { borderRadius: 14, overflow: 'hidden', elevation: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ECEEF5' },
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

  rangeToggle: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: colors.primary, backgroundColor: '#fff',
  },
  rangeToggleActive: {
    backgroundColor: colors.primary, borderColor: colors.primary,
  },

  summaryRow: { flexDirection: 'row', gap: 10, paddingHorizontal: spacing.base, marginTop: 8 },
  summaryCardDouble: {
    flex: 1, borderRadius: 14, padding: 14, elevation: 1, backgroundColor: colors.surface,
  },
  summaryDoubleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryCardNet: {
    flex: 1, borderRadius: 14, padding: 14, elevation: 1, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  summaryIcon: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  summaryLabel: { fontSize: 10, fontWeight: '700', color: '#B0B5C8', letterSpacing: 0.5, marginTop: 4 },
  summaryAmt: { fontSize: 15, fontWeight: '800', marginTop: 2 },
  summaryAmtLarge: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  urduAmt: { fontSize: 9, color: '#8A8FA8', marginTop: 1 },

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
