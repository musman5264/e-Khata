import React from 'react';
import { View, StyleSheet, ScrollView, Platform, useWindowDimensions, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { colors, spacing } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export default function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web' && width > 768;

  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const res = await api.get('/reports/dashboard');
      return res.data.data;
    },
  });

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // ═══════════════════════════════════
  // WEB DASHBOARD
  // ═══════════════════════════════════
  if (isWeb) {
    return (
      <ScrollView style={webStyles.container} contentContainerStyle={webStyles.scroll} showsVerticalScrollIndicator={false}>
        {/* Top bar */}
        <View style={webStyles.topBar}>
          <View>
            <Text style={webStyles.greeting}>{greeting()}, {user?.name || 'User'} 👋</Text>
            <Text style={webStyles.subtitle}>Here's your business summary</Text>
          </View>
          <TouchableOpacity
            style={webStyles.addBtn}
            onPress={() => router.push('/(app)/party/create')}
          >
            <MaterialCommunityIcons name="plus" size={18} color="#fff" />
            <Text style={webStyles.addBtnText}>New Party</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid - 4 columns */}
        <View style={webStyles.statsGrid}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push('/(app)/reports/receivable-aging' as any)} activeOpacity={0.7}>
            <StatCard
              icon="arrow-bottom-left" iconBg="#FFF0F0" iconColor={colors.debit}
              label={t('dashboard.receivable')} hint="Aap ne lena hai"
              value={formatCurrency(data?.total_receivable ?? 0)} valueColor={colors.debit}
            />
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push('/(app)/reports/payable-aging' as any)} activeOpacity={0.7}>
            <StatCard
              icon="arrow-top-right" iconBg="#F0FFF4" iconColor={colors.credit}
              label={t('dashboard.payable')} hint="Aap ne dena hai"
              value={formatCurrency(data?.total_payable ?? 0)} valueColor={colors.credit}
            />
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push('/(app)/reports' as any)} activeOpacity={0.7}>
            <StatCard
              icon="scale-balance" iconBg="#EEF0FF" iconColor={colors.primary}
              label={t('dashboard.netBalance')} hint=""
              value={formatCurrency(data?.net_balance ?? 0)} valueColor={colors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push('/(app)/(tabs)/parties' as any)} activeOpacity={0.7}>
            <StatCard
              icon="account-group" iconBg="#FFF8E1" iconColor="#F59E0B"
              label={t('dashboard.parties')} hint="Total parties"
              value={String(data?.party_count ?? 0)} valueColor="#F59E0B"
            />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={webStyles.section}>
          <Text style={webStyles.sectionTitle}>Quick Actions</Text>
          <View style={webStyles.quickGrid}>
            {([
              { icon: 'account-plus-outline' as IconName, label: 'Add Party', route: '/(app)/party/create', bg: '#EEF0FF', color: colors.primary },
              { icon: 'chart-bar' as IconName, label: 'Reports', route: '/(app)/reports/trial-balance', bg: '#F0FFF4', color: '#10B981' },
              { icon: 'account-multiple-outline' as IconName, label: 'Team', route: '/(app)/team/members', bg: '#FFF8E1', color: '#F59E0B' },
              { icon: 'credit-card-outline' as IconName, label: 'Payments', route: '/(app)/payment/history', bg: '#FFF0F0', color: colors.debit },
              { icon: 'book-open-variant' as IconName, label: 'Daybook', route: '/(app)/(tabs)/daybook', bg: '#F3E8FF', color: '#8B5CF6' },
              { icon: 'cog-outline' as IconName, label: 'Settings', route: '/(app)/settings/tenant', bg: '#E0F7FA', color: '#0891B2' },
            ]).map((a) => (
              <TouchableOpacity key={a.label} style={webStyles.quickCard} onPress={() => router.push(a.route as any)}>
                <View style={[webStyles.quickIcon, { backgroundColor: a.bg }]}>
                  <MaterialCommunityIcons name={a.icon} size={22} color={a.color} />
                </View>
                <Text style={webStyles.quickLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={webStyles.section}>
          <View style={webStyles.sectionHeader}>
            <Text style={webStyles.sectionTitle}>{t('dashboard.recentTransactions')}</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/daybook' as any)}>
              <Text style={webStyles.seeAll}>View All →</Text>
            </TouchableOpacity>
          </View>

          <Surface style={webStyles.table}>
            {/* Table Header */}
            <View style={webStyles.tableHeader}>
              <Text style={[webStyles.th, { flex: 2 }]}>Party</Text>
              <Text style={[webStyles.th, { flex: 2 }]}>Description</Text>
              <Text style={[webStyles.th, { flex: 1 }]}>Date</Text>
              <Text style={[webStyles.th, { flex: 1, textAlign: 'right' }]}>Amount</Text>
              <Text style={[webStyles.th, { width: 70, textAlign: 'center' }]}>Type</Text>
            </View>
            {data?.recent_transactions?.map((txn: any) => (
              <View key={txn.id} style={webStyles.tableRow}>
                <Text style={[webStyles.td, webStyles.tdBold, { flex: 2 }]}>{txn.party_name}</Text>
                <Text style={[webStyles.td, { flex: 2 }]}>{txn.description || '—'}</Text>
                <Text style={[webStyles.td, { flex: 1 }]}>{txn.date}</Text>
                <Text style={[webStyles.td, { flex: 1, textAlign: 'right', fontWeight: '700', color: txn.type === 'debit' ? colors.debit : colors.credit }]}>
                  {formatCurrency(txn.amount)}
                </Text>
                <View style={{ width: 70, alignItems: 'center' }}>
                  <View style={[webStyles.typeBadge, { backgroundColor: txn.type === 'debit' ? '#FFF0F0' : '#F0FFF4' }]}>
                    <Text style={[webStyles.typeBadgeText, { color: txn.type === 'debit' ? colors.debit : colors.credit }]}>
                      {txn.type === 'debit' ? 'NAAM' : 'JAMA'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
            {(!data?.recent_transactions || data.recent_transactions.length === 0) && (
              <View style={webStyles.emptyRow}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={40} color="#D1D5DB" />
                <Text style={webStyles.emptyText}>No transactions yet</Text>
              </View>
            )}
          </Surface>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  // ═══════════════════════════════════
  // MOBILE DASHBOARD
  // ═══════════════════════════════════
  return (
    <View style={mStyles.container}>
      <ScrollView contentContainerStyle={mStyles.scroll} showsVerticalScrollIndicator={false}>
        {/* Gradient Header */}
        <View style={mStyles.headerBg}>
          <View style={mStyles.headerContent}>
            <View style={{ flex: 1 }}>
              <Text style={mStyles.greeting}>{greeting()} 👋</Text>
              <Text style={mStyles.userName}>{user?.name || 'User'}</Text>
            </View>
            <TouchableOpacity
              style={mStyles.notifBtn}
              onPress={() => router.push('/(app)/notifications' as any)}
            >
              <MaterialCommunityIcons name="bell-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Balance Cards */}
          <View style={mStyles.balanceRow}>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push('/(app)/reports/receivable-aging' as any)} activeOpacity={0.7}>
              <View style={mStyles.balCardRed}>
                <MaterialCommunityIcons name="arrow-bottom-left" size={20} color={colors.debit} />
                <Text style={mStyles.balLabel}>{t('dashboard.receivable')}</Text>
                <Text style={[mStyles.balValue, { color: colors.debit }]}>
                  {formatCurrency(data?.total_receivable ?? 0)}
                </Text>
                <Text style={mStyles.balHint}>Aap ne lena hai</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={{ flex: 1 }} onPress={() => router.push('/(app)/reports/payable-aging' as any)} activeOpacity={0.7}>
              <View style={mStyles.balCardGreen}>
                <MaterialCommunityIcons name="arrow-top-right" size={20} color={colors.credit} />
                <Text style={mStyles.balLabel}>{t('dashboard.payable')}</Text>
                <Text style={[mStyles.balValue, { color: colors.credit }]}>
                  {formatCurrency(data?.total_payable ?? 0)}
                </Text>
                <Text style={mStyles.balHint}>Aap ne dena hai</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Net Balance */}
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(app)/reports' as any)}>
          <Surface style={mStyles.netCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={mStyles.netIcon}>
                <MaterialCommunityIcons name="scale-balance" size={18} color={colors.primary} />
              </View>
            <View>
              <Text style={mStyles.netLabel}>{t('dashboard.netBalance')}</Text>
              <Text style={mStyles.netValue}>{formatCurrency(data?.net_balance ?? 0)}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/parties' as any)} activeOpacity={0.7}>
            <View style={mStyles.partyBadge}>
              <Text style={mStyles.partyBadgeText}>{data?.party_count ?? 0} parties</Text>
            </View>
          </TouchableOpacity>
          </Surface>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={mStyles.quickRow}>
          {([
            { icon: 'account-plus-outline' as IconName, label: 'Add Party', route: '/(app)/party/create', color: colors.primary },
            { icon: 'chart-bar' as IconName, label: 'Reports', route: '/(app)/reports/trial-balance', color: '#10B981' },
            { icon: 'account-multiple-outline' as IconName, label: 'Team', route: '/(app)/team/members', color: '#F59E0B' },
            { icon: 'credit-card-outline' as IconName, label: 'Payments', route: '/(app)/payment/history', color: '#E84393' },
          ]).map((a) => (
            <TouchableOpacity key={a.label} style={mStyles.quickItem} onPress={() => router.push(a.route as any)}>
              <View style={[mStyles.quickIcon, { backgroundColor: a.color + '15' }]}>
                <MaterialCommunityIcons name={a.icon} size={22} color={a.color} />
              </View>
              <Text style={mStyles.quickLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Transactions */}
        <View style={mStyles.sectionHeader}>
          <Text style={mStyles.sectionTitle}>{t('dashboard.recentTransactions')}</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/daybook' as any)}>
            <Text style={mStyles.seeAll}>See All →</Text>
          </TouchableOpacity>
        </View>

        {data?.recent_transactions?.map((txn: any) => (
          <Surface key={txn.id} style={mStyles.txnCard}>
            <View style={mStyles.txnRow}>
              <View style={[mStyles.txnIcon, { backgroundColor: txn.type === 'debit' ? '#FFF0F0' : '#F0FFF4' }]}>
                <MaterialCommunityIcons
                  name={txn.type === 'debit' ? 'arrow-bottom-left' : 'arrow-top-right'}
                  size={18}
                  color={txn.type === 'debit' ? colors.debit : colors.credit}
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={mStyles.txnName}>{txn.party_name}</Text>
                <Text style={mStyles.txnDesc}>{txn.description || txn.date}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[mStyles.txnAmt, { color: txn.type === 'debit' ? colors.debit : colors.credit }]}>
                  {formatCurrency(txn.amount)}
                </Text>
                <View style={[mStyles.txnBadge, { backgroundColor: txn.type === 'debit' ? '#FFF0F0' : '#F0FFF4' }]}>
                  <Text style={[mStyles.txnBadgeText, { color: txn.type === 'debit' ? colors.debit : colors.credit }]}>
                    {txn.type === 'debit' ? 'NAAM' : 'JAMA'}
                  </Text>
                </View>
              </View>
            </View>
          </Surface>
        ))}

        {(!data?.recent_transactions || data.recent_transactions.length === 0) && (
          <View style={mStyles.emptyState}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="#D1D5DB" />
            <Text style={mStyles.emptyTitle}>No transactions yet</Text>
            <Text style={mStyles.emptyDesc}>Add a party and start recording</Text>
          </View>
        )}

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Mobile FAB */}
      <TouchableOpacity
        style={mStyles.fab}
        activeOpacity={0.85}
        onPress={() => router.push('/(app)/party/create')}
      >
        <MaterialCommunityIcons name="plus" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

/* ─── Stat Card (Web) ─── */
function StatCard({ icon, iconBg, iconColor, label, hint, value, valueColor }: {
  icon: IconName; iconBg: string; iconColor: string;
  label: string; hint: string; value: string; valueColor: string;
}) {
  return (
    <Surface style={webStyles.statCard}>
      <View style={[webStyles.statIcon, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
      </View>
      <Text style={webStyles.statLabel}>{label}</Text>
      <Text style={[webStyles.statValue, { color: valueColor }]}>{value}</Text>
      {hint ? <Text style={webStyles.statHint}>{hint}</Text> : null}
    </Surface>
  );
}

/* ═══════════════════════════════════
   WEB STYLES
   ═══════════════════════════════════ */
const webStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  scroll: { padding: 32 },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  greeting: { fontSize: 24, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 14, color: '#8A8FA8', marginTop: 4 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10,
    borderRadius: 10,
  },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  // Stats
  statsGrid: { flexDirection: 'row', gap: 16, marginBottom: 28 },
  statCard: {
    flex: 1, padding: 20, borderRadius: 16,
    backgroundColor: '#fff', elevation: 0,
    borderWidth: 1, borderColor: '#ECEEF5',
  },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statLabel: { fontSize: 12, color: '#8A8FA8', fontWeight: '500' },
  statValue: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  statHint: { fontSize: 11, color: '#B0B5C8', marginTop: 2, fontStyle: 'italic' },

  // Section
  section: { marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 16 },
  seeAll: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  // Quick Actions
  quickGrid: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  quickCard: {
    width: 120, padding: 16, borderRadius: 14,
    backgroundColor: '#fff', alignItems: 'center',
    borderWidth: 1, borderColor: '#ECEEF5',
  },
  quickIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickLabel: { fontSize: 12, fontWeight: '600', color: colors.text },

  // Table
  table: { borderRadius: 14, overflow: 'hidden', elevation: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ECEEF5' },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#F8F9FC', borderBottomWidth: 1, borderBottomColor: '#ECEEF5' },
  th: { fontSize: 11, fontWeight: '700', color: '#8A8FA8', letterSpacing: 0.5, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },
  td: { fontSize: 13, color: '#6C7293' },
  tdBold: { fontWeight: '600', color: colors.text },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  typeBadgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  emptyRow: { paddingVertical: 48, alignItems: 'center', gap: 8 },
  emptyText: { fontSize: 14, color: '#B0B5C8' },
});

/* ═══════════════════════════════════
   MOBILE STYLES
   ═══════════════════════════════════ */
const mStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 20 },

  // Header
  headerBg: {
    backgroundColor: colors.primary,
    paddingTop: 52,
    paddingHorizontal: spacing.base,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerContent: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  userName: { fontSize: 22, fontWeight: '700', color: '#fff', marginTop: 2 },
  notifBtn: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Balance
  balanceRow: { flexDirection: 'row', gap: 12 },
  balCardRed: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 4,
  },
  balCardGreen: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 4,
  },
  balLabel: { fontSize: 11, color: '#8A8FA8', fontWeight: '500' },
  balValue: { fontSize: 18, fontWeight: '800' },
  balHint: { fontSize: 10, color: '#B0B5C8', fontStyle: 'italic' },

  // Net
  netCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: spacing.base, marginTop: -1, paddingHorizontal: 16, paddingVertical: 14,
    borderRadius: 14, elevation: 2, backgroundColor: '#fff',
  },
  netIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.primary + '12', alignItems: 'center', justifyContent: 'center',
  },
  netLabel: { fontSize: 11, color: '#8A8FA8' },
  netValue: { fontSize: 18, fontWeight: '800', color: colors.primary },
  partyBadge: { backgroundColor: '#F1F3F9', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16 },
  partyBadgeText: { fontSize: 11, color: colors.primary, fontWeight: '600' },

  // Quick Actions
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.base, marginTop: 20, marginBottom: 20 },
  quickItem: { alignItems: 'center', width: 72 },
  quickIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  quickLabel: { fontSize: 11, color: '#6C7293', textAlign: 'center', fontWeight: '500' },

  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base, marginBottom: 10 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  seeAll: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  // Transactions
  txnCard: { marginHorizontal: spacing.base, marginBottom: 8, borderRadius: 14, padding: 14, elevation: 1, backgroundColor: '#fff' },
  txnRow: { flexDirection: 'row', alignItems: 'center' },
  txnIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  txnName: { fontSize: 14, fontWeight: '600', color: colors.text },
  txnDesc: { fontSize: 12, color: '#8A8FA8', marginTop: 2 },
  txnAmt: { fontSize: 14, fontWeight: '700' },
  txnBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 3 },
  txnBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 12 },
  emptyDesc: { fontSize: 13, color: '#8A8FA8', marginTop: 4 },

  // FAB
  fab: {
    position: 'absolute', right: 20, bottom: 24,
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
});
