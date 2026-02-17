import React from 'react';
import { View, StyleSheet, ScrollView, Platform, useWindowDimensions, TouchableOpacity } from 'react-native';
import { Text, Card, FAB, Surface, Avatar, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { colors, spacing } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import WebContainer from '@/components/WebContainer';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width > 600;

  const { data, isLoading } = useQuery({
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

  return (
    <WebContainer>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* ── Greeting Header ── */}
          <View style={styles.greetingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>{greeting()} 👋</Text>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(app)/notifications' as any)}>
              <View style={styles.notifBadge}>
                <Text style={{ fontSize: 20 }}>🔔</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* ── Balance Overview Card ── */}
          <Surface style={styles.overviewCard}>
            <View style={styles.overviewHeader}>
              <Text style={styles.overviewTitle}>💰 Business Overview</Text>
            </View>

            <View style={styles.balanceGrid}>
              {/* Receivable */}
              <View style={[styles.balanceItem, styles.receivableBg]}>
                <View style={styles.balanceIconWrap}>
                  <Text style={{ fontSize: 22 }}>📥</Text>
                </View>
                <Text style={styles.balanceLabel}>{t('dashboard.receivable')}</Text>
                <Text style={[styles.balanceValue, { color: '#E74C3C' }]}>
                  {formatCurrency(data?.total_receivable ?? 0)}
                </Text>
                <Text style={styles.balanceHint}>Aap ne lena hai</Text>
              </View>

              {/* Payable */}
              <View style={[styles.balanceItem, styles.payableBg]}>
                <View style={styles.balanceIconWrap}>
                  <Text style={{ fontSize: 22 }}>📤</Text>
                </View>
                <Text style={styles.balanceLabel}>{t('dashboard.payable')}</Text>
                <Text style={[styles.balanceValue, { color: colors.credit }]}>
                  {formatCurrency(data?.total_payable ?? 0)}
                </Text>
                <Text style={styles.balanceHint}>Aap ne dena hai</Text>
              </View>
            </View>

            {/* Net balance bar */}
            <View style={styles.netRow}>
              <View style={styles.netInfo}>
                <Text style={styles.netLabel}>{t('dashboard.netBalance')}</Text>
                <Text style={styles.netValue}>
                  {formatCurrency(data?.net_balance ?? 0)}
                </Text>
              </View>
              <View style={styles.partyBadge}>
                <Text style={styles.partyBadgeText}>
                  {data?.party_count ?? 0} {t('dashboard.parties')}
                </Text>
              </View>
            </View>
          </Surface>

          {/* ── Quick Actions ── */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            {[
              { icon: '➕', label: 'Add Party', route: '/(app)/party/create' },
              { icon: '📊', label: t('report.title'), route: '/(app)/reports/trial-balance' },
              { icon: '👥', label: t('team.title'), route: '/(app)/team/members' },
              { icon: '💳', label: t('payment.title'), route: '/(app)/payment/history' },
            ].map((action) => (
              <TouchableOpacity
                key={action.label}
                style={styles.actionItem}
                onPress={() => router.push(action.route as any)}
              >
                <View style={styles.actionIcon}>
                  <Text style={{ fontSize: 22 }}>{action.icon}</Text>
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Recent Transactions ── */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('dashboard.recentTransactions')}</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/daybook' as any)}>
              <Text style={styles.seeAll}>See All →</Text>
            </TouchableOpacity>
          </View>

          {data?.recent_transactions?.map((txn: any, index: number) => (
            <Surface key={txn.id} style={styles.txnCard}>
              <View style={styles.txnContent}>
                <View style={[styles.txnAvatar, { backgroundColor: txn.type === 'debit' ? '#FFEBEE' : '#E8F5E9' }]}>
                  <Text style={{ fontSize: 16 }}>{txn.type === 'debit' ? '📥' : '📤'}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.txnName}>{txn.party_name}</Text>
                  <Text style={styles.txnDesc}>
                    {txn.description || txn.date}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.txnAmount, { color: txn.type === 'debit' ? colors.debit : colors.credit }]}>
                    {txn.type === 'debit' ? '+' : '-'} {formatCurrency(txn.amount)}
                  </Text>
                  <View style={[styles.txnTypeBadge, { backgroundColor: txn.type === 'debit' ? '#FFEBEE' : '#E8F5E9' }]}>
                    <Text style={[styles.txnTypeText, { color: txn.type === 'debit' ? colors.debit : colors.credit }]}>
                      {txn.type === 'debit' ? 'NAAM' : 'JAMA'}
                    </Text>
                  </View>
                </View>
              </View>
            </Surface>
          ))}

          {(!data?.recent_transactions || data.recent_transactions.length === 0) && (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 40 }}>📋</Text>
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptyDesc}>Add a party and start recording</Text>
            </View>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>

        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => router.push('/(app)/party/create')}
          color={colors.onPrimary}
          label={isWide ? 'Add Party' : ''}
        />
      </View>
    </WebContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.base },

  // Greeting
  greetingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingTop: 4 },
  greeting: { fontSize: 14, color: colors.textSecondary },
  userName: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 2 },
  notifBadge: {
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Overview card
  overviewCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    backgroundColor: colors.surface,
  },
  overviewHeader: { marginBottom: 16 },
  overviewTitle: { fontSize: 16, fontWeight: '700', color: colors.text },

  balanceGrid: { flexDirection: 'row', gap: 12 },
  balanceItem: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  receivableBg: { backgroundColor: '#FFF5F5' },
  payableBg: { backgroundColor: '#F0FFF4' },
  balanceIconWrap: { marginBottom: 8 },
  balanceLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  balanceValue: { fontSize: 20, fontWeight: '800', marginTop: 4 },
  balanceHint: { fontSize: 10, color: colors.textHint, marginTop: 4, fontStyle: 'italic' },

  netRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  netInfo: {},
  netLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  netValue: { fontSize: 22, fontWeight: '800', color: colors.primary, marginTop: 2 },
  partyBadge: {
    backgroundColor: colors.surfaceVariant,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  partyBadgeText: { fontSize: 12, color: colors.primary, fontWeight: '600' },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  actionItem: { alignItems: 'center', flex: 1 },
  actionIcon: {
    width: 52, height: 52,
    borderRadius: 16,
    backgroundColor: colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionLabel: { fontSize: 11, color: colors.textSecondary, textAlign: 'center', fontWeight: '500' },

  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
  seeAll: { fontSize: 13, color: colors.primaryLight, fontWeight: '600' },

  // Transactions
  txnCard: {
    marginBottom: 8,
    borderRadius: 14,
    padding: 14,
    elevation: 1,
    backgroundColor: colors.surface,
  },
  txnContent: { flexDirection: 'row', alignItems: 'center' },
  txnAvatar: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txnName: { fontSize: 14, fontWeight: '600', color: colors.text },
  txnDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  txnAmount: { fontSize: 14, fontWeight: '700' },
  txnTypeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, marginTop: 4 },
  txnTypeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 12 },
  emptyDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: colors.primary,
    borderRadius: 16,
    elevation: 4,
  },
});
