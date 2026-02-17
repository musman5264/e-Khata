import React from 'react';
import { View, StyleSheet, FlatList, Alert, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { Text, IconButton, Menu, Divider, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import { usePermissions } from '@/hooks/usePermissions';

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string) {
  const palette = ['#3D5AF1', '#00B894', '#E17055', '#A29BFE', '#FDCB6E', '#E84393', '#00CEC9', '#6C5CE7'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export default function PartyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [menuVisible, setMenuVisible] = React.useState(false);
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web' && width > 768;
  const { canManageParties, canCreateTransactions } = usePermissions();

  const { data: party } = useQuery({
    queryKey: ['party', id],
    queryFn: async () => {
      const res = await api.get(`/parties/${id}`);
      return res.data.data;
    },
  });

  const { data: txnResponse } = useQuery({
    queryKey: ['party-transactions', id],
    queryFn: async () => {
      const res = await api.get(`/parties/${id}/transactions`);
      return res.data.data;
    },
  });
  const transactions = txnResponse?.transactions ?? txnResponse ?? [];

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/parties/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      router.back();
    },
  });

  const handleDelete = () => {
    if (Platform.OS === 'web') {
      if (confirm(t('party.deleteConfirm'))) deleteMutation.mutate();
    } else {
      Alert.alert(t('common.confirm'), t('party.deleteConfirm'), [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.delete'), style: 'destructive', onPress: () => deleteMutation.mutate() },
      ]);
    }
  };

  const balance = party?.current_balance ?? 0;
  const isDebit = balance > 0;
  const avatarColor = party ? getAvatarColor(party.name) : '#ccc';

  /* ─── Shared transaction renderer ─── */
  const renderTxn = ({ item }: { item: any }) => (
    <TouchableOpacity activeOpacity={0.7} onPress={() => router.push(`/(app)/transaction/${item.id}`)}>
      <Surface style={shared.txnCard}>
        <View style={shared.txnContent}>
          <View style={[shared.txnDot, { backgroundColor: item.type === 'debit' ? colors.debit : colors.credit }]} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={shared.txnDate}>{item.date}</Text>
            <Text style={shared.txnDesc}>{item.description || '—'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[shared.txnAmt, { color: item.type === 'debit' ? colors.debit : colors.credit }]}>
              {formatCurrency(item.amount)}
            </Text>
            <View style={[shared.txnBadge, { backgroundColor: item.type === 'debit' ? '#FFF0F0' : '#F0FFF4' }]}>
              <Text style={[shared.txnBadgeText, { color: item.type === 'debit' ? colors.debit : colors.credit }]}>
                {item.type === 'debit' ? 'NAAM' : 'JAMA'}
              </Text>
            </View>
            <Text style={shared.txnBal}>Bal: {formatCurrency(item.running_balance)}</Text>
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );

  const emptyList = (
    <View style={shared.emptyState}>
      <MaterialCommunityIcons name="clipboard-text-outline" size={48} color="#D1D5DB" />
      <Text style={shared.emptyTitle}>No transactions yet</Text>
      <Text style={shared.emptyDesc}>Add your first debit or credit entry</Text>
    </View>
  );

  // ═══════════════════════════════════
  // WEB VIEW
  // ═══════════════════════════════════
  if (isWeb) {
    return (
      <View style={wStyles.container}>
        {/* Header bar */}
        <View style={wStyles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={wStyles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={wStyles.headerTitle}>{party?.name || 'Party Details'}</Text>
          <View style={{ flex: 1 }} />
          {canManageParties && (
            <TouchableOpacity
              style={wStyles.editBtn}
              onPress={() => router.push(`/(app)/party/edit/${id}`)}
            >
              <MaterialCommunityIcons name="pencil-outline" size={16} color={colors.primary} />
              <Text style={wStyles.editText}>Edit</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={wStyles.shareBtn}
            onPress={() => router.push({ pathname: '/(app)/share/statement', params: { party_id: id } })}
          >
            <MaterialCommunityIcons name="share-variant-outline" size={16} color="#6C7293" />
            <Text style={wStyles.shareText}>Share</Text>
          </TouchableOpacity>
          {canManageParties && (
            <TouchableOpacity style={wStyles.deleteBtn} onPress={handleDelete}>
              <MaterialCommunityIcons name="delete-outline" size={16} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>

        <View style={wStyles.mainLayout}>
          {/* Left: Profile + Actions */}
          <View style={wStyles.leftCol}>
            <Surface style={wStyles.profileCard}>
              <View style={[wStyles.avatar, { backgroundColor: avatarColor }]}>
                <Text style={wStyles.avatarText}>{party ? getInitials(party.name) : '?'}</Text>
              </View>
              <Text style={wStyles.partyName}>{party?.name}</Text>
              <View style={wStyles.metaRow}>
                <MaterialCommunityIcons name="phone-outline" size={14} color="#8A8FA8" />
                <Text style={wStyles.metaText}>{party?.mobile || '—'}</Text>
              </View>
              {party?.city && (
                <View style={wStyles.metaRow}>
                  <MaterialCommunityIcons name="map-marker-outline" size={14} color="#8A8FA8" />
                  <Text style={wStyles.metaText}>{party.city}</Text>
                </View>
              )}
              {/* Balance */}
              <View style={wStyles.balanceSection}>
                <Text style={wStyles.balanceLabel}>{t('party.balance')}</Text>
                <Text style={[wStyles.balanceAmt, { color: isDebit ? colors.debit : balance < 0 ? colors.credit : '#6C7293' }]}>
                  {formatCurrency(Math.abs(balance))}
                </Text>
                <View style={[wStyles.balanceBadge, { backgroundColor: isDebit ? '#FFF0F0' : balance < 0 ? '#F0FFF4' : '#F5F5F5' }]}>
                  <Text style={[wStyles.balanceBadgeText, { color: isDebit ? colors.debit : balance < 0 ? colors.credit : '#999' }]}>
                    {balance > 0 ? 'NAAM — You receive' : balance < 0 ? 'JAMA — You owe' : 'SETTLED'}
                  </Text>
                </View>
              </View>
            </Surface>

            {/* Action buttons */}
            {canCreateTransactions && (
              <View style={wStyles.actionRow}>
                <TouchableOpacity
                  style={[wStyles.actionBtn, { backgroundColor: '#FFF0F0' }]}
                  onPress={() => router.push({ pathname: '/(app)/transaction/create', params: { party_id: id, type: 'debit' } })}
                >
                  <MaterialCommunityIcons name="arrow-bottom-left" size={20} color={colors.debit} />
                  <Text style={[wStyles.actionText, { color: colors.debit }]}>NAAM (Debit)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[wStyles.actionBtn, { backgroundColor: '#F0FFF4' }]}
                  onPress={() => router.push({ pathname: '/(app)/transaction/create', params: { party_id: id, type: 'credit' } })}
                >
                  <MaterialCommunityIcons name="arrow-top-right" size={20} color={colors.credit} />
                  <Text style={[wStyles.actionText, { color: colors.credit }]}>JAMA (Credit)</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Right: Transactions */}
          <View style={wStyles.rightCol}>
            <View style={wStyles.txnHeaderRow}>
              <Text style={wStyles.txnTitle}>Transactions</Text>
              <Text style={wStyles.txnCount}>{transactions?.length ?? 0} entries</Text>
            </View>
            <Surface style={wStyles.txnTable}>
              <FlatList
                data={transactions}
                keyExtractor={(item: any) => item.id.toString()}
                renderItem={renderTxn}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={emptyList}
              />
            </Surface>
          </View>
        </View>
      </View>
    );
  }

  // ═══════════════════════════════════
  // MOBILE VIEW
  // ═══════════════════════════════════
  return (
    <View style={mStyles.container}>
      {/* Mobile header */}
      <View style={mStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={mStyles.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={mStyles.headerTitle} numberOfLines={1}>{party?.name || 'Party'}</Text>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <TouchableOpacity onPress={() => setMenuVisible(true)} style={mStyles.headerBtn}>
              <MaterialCommunityIcons name="dots-vertical" size={24} color="#fff" />
            </TouchableOpacity>
          }
        >
          {canManageParties && <Menu.Item onPress={() => { setMenuVisible(false); router.push(`/(app)/party/edit/${id}`); }} title={t('common.edit')} leadingIcon="pencil" />}
          <Menu.Item onPress={() => { setMenuVisible(false); router.push({ pathname: '/(app)/share/statement', params: { party_id: id } }); }} title={t('share.share')} leadingIcon="share" />
          {canManageParties && <><Divider />
          <Menu.Item onPress={() => { setMenuVisible(false); handleDelete(); }} title={t('common.delete')} leadingIcon="delete" titleStyle={{ color: colors.error }} /></>}
        </Menu>
      </View>

      {/* Party info card */}
      <Surface style={mStyles.infoCard}>
        <View style={mStyles.infoRow}>
          <View style={[mStyles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={mStyles.avatarText}>{party ? getInitials(party.name) : '?'}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={mStyles.partyName}>{party?.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
              <MaterialCommunityIcons name="phone-outline" size={13} color="#8A8FA8" />
              <Text style={mStyles.partyMeta}> {party?.mobile || '—'}</Text>
              {party?.city && (
                <>
                  <Text style={mStyles.partyMeta}> • </Text>
                  <MaterialCommunityIcons name="map-marker-outline" size={13} color="#8A8FA8" />
                  <Text style={mStyles.partyMeta}> {party.city}</Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={mStyles.balanceCard}>
          <Text style={mStyles.balanceLabel}>{t('party.balance')}</Text>
          <Text style={[mStyles.balanceAmt, { color: isDebit ? colors.debit : balance < 0 ? colors.credit : '#999' }]}>
            {formatCurrency(Math.abs(balance))}
          </Text>
          <View style={[mStyles.balanceBadge, { backgroundColor: isDebit ? '#FFF0F0' : balance < 0 ? '#F0FFF4' : '#F5F5F5' }]}>
            <Text style={[mStyles.balanceBadgeText, { color: isDebit ? colors.debit : balance < 0 ? colors.credit : '#999' }]}>
              {balance > 0 ? 'NAAM — Aap ne lena hai' : balance < 0 ? 'JAMA — Aap ne dena hai' : 'SETTLED'}
            </Text>
          </View>
        </View>
      </Surface>

      {/* Action buttons */}
      {canCreateTransactions && (
        <View style={mStyles.actionsRow}>
          <TouchableOpacity
            style={[mStyles.actionBtn, { backgroundColor: '#FFF0F0' }]}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/(app)/transaction/create', params: { party_id: id, type: 'debit' } })}
          >
            <View style={[mStyles.actionIconWrap, { backgroundColor: colors.debit }]}>
              <MaterialCommunityIcons name="arrow-bottom-left" size={20} color="#fff" />
            </View>
            <Text style={[mStyles.actionLabel, { color: colors.debit }]}>{t('transaction.debit')}</Text>
            <Text style={mStyles.actionHint}>NAAM</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[mStyles.actionBtn, { backgroundColor: '#F0FFF4' }]}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/(app)/transaction/create', params: { party_id: id, type: 'credit' } })}
          >
            <View style={[mStyles.actionIconWrap, { backgroundColor: colors.credit }]}>
              <MaterialCommunityIcons name="arrow-top-right" size={20} color="#fff" />
            </View>
            <Text style={[mStyles.actionLabel, { color: colors.credit }]}>{t('transaction.credit')}</Text>
            <Text style={mStyles.actionHint}>JAMA</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Transactions */}
      <View style={mStyles.txnHeader}>
        <Text style={mStyles.txnHeaderTitle}>Transactions</Text>
        <Text style={mStyles.txnCount}>{transactions?.length ?? 0} entries</Text>
      </View>

      <FlatList
        data={transactions}
        keyExtractor={(item: any) => item.id.toString()}
        contentContainerStyle={mStyles.list}
        showsVerticalScrollIndicator={false}
        renderItem={renderTxn}
        ListEmptyComponent={emptyList}
      />

      {/* FAB */}
      <TouchableOpacity
        style={mStyles.fab}
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: '/(app)/transaction/create', params: { party_id: id } })}
      >
        <MaterialCommunityIcons name="plus" size={26} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

/* ─── Shared ─── */
const shared = StyleSheet.create({
  txnCard: { marginBottom: 8, borderRadius: 14, padding: 14, elevation: 1, backgroundColor: '#fff' },
  txnContent: { flexDirection: 'row', alignItems: 'center' },
  txnDot: { width: 10, height: 10, borderRadius: 5 },
  txnDate: { fontSize: 11, color: '#B0B5C8', fontWeight: '500' },
  txnDesc: { fontSize: 14, color: colors.text, marginTop: 2 },
  txnAmt: { fontSize: 15, fontWeight: '700' },
  txnBadge: { marginTop: 2, paddingHorizontal: 8, paddingVertical: 1, borderRadius: 6 },
  txnBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  txnBal: { fontSize: 10, color: '#B0B5C8', marginTop: 2 },
  emptyState: { alignItems: 'center', paddingVertical: 50, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  emptyDesc: { fontSize: 13, color: '#8A8FA8' },
});

/* ═══ WEB STYLES ═══ */
const wStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  headerBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ECEEF5', gap: 10,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F5F6FA', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.primary + '30', backgroundColor: colors.primary + '08' },
  editText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  shareBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ECEEF5' },
  shareText: { fontSize: 13, fontWeight: '600', color: '#6C7293' },
  deleteBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#FFF0F0', alignItems: 'center', justifyContent: 'center' },

  mainLayout: { flex: 1, flexDirection: 'row', padding: 24, gap: 24 },
  leftCol: { width: 320 },
  rightCol: { flex: 1 },

  profileCard: { borderRadius: 16, padding: 24, elevation: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ECEEF5', alignItems: 'center' },
  avatar: { width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 24 },
  partyName: { fontSize: 20, fontWeight: '700', color: colors.text, marginTop: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  metaText: { fontSize: 13, color: '#8A8FA8' },
  balanceSection: { marginTop: 20, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#ECEEF5', alignItems: 'center', width: '100%' },
  balanceLabel: { fontSize: 11, color: '#8A8FA8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  balanceAmt: { fontSize: 28, fontWeight: '800', marginTop: 4 },
  balanceBadge: { marginTop: 8, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 10 },
  balanceBadgeText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },

  actionRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  actionText: { fontSize: 13, fontWeight: '700' },

  txnHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  txnTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
  txnCount: { fontSize: 12, color: '#8A8FA8' },
  txnTable: { flex: 1, borderRadius: 14, padding: 8, elevation: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ECEEF5' },
});

/* ═══ MOBILE STYLES ═══ */
const mStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.primary, paddingTop: 48, paddingBottom: 14, paddingHorizontal: 12,
  },
  headerBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff', flex: 1, textAlign: 'center' },

  infoCard: { margin: spacing.base, borderRadius: 20, padding: 18, elevation: 2, backgroundColor: '#fff' },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  partyName: { fontSize: 18, fontWeight: '700', color: colors.text },
  partyMeta: { fontSize: 12, color: '#8A8FA8' },

  balanceCard: { marginTop: 16, alignItems: 'center', paddingVertical: 16, borderRadius: 14, backgroundColor: '#F8F9FC' },
  balanceLabel: { fontSize: 12, color: '#8A8FA8', fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  balanceAmt: { fontSize: 28, fontWeight: '800', marginTop: 4 },
  balanceBadge: { marginTop: 8, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 10 },
  balanceBadgeText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },

  actionsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: spacing.base, marginBottom: 4 },
  actionBtn: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center' },
  actionIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 14, fontWeight: '700', marginTop: 8 },
  actionHint: { fontSize: 10, color: '#B0B5C8', fontWeight: '600', marginTop: 2, letterSpacing: 0.5 },

  txnHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base + 4, paddingVertical: 12 },
  txnHeaderTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  txnCount: { fontSize: 12, color: '#8A8FA8' },

  list: { paddingHorizontal: spacing.base, paddingBottom: 80 },

  fab: {
    position: 'absolute', right: 20, bottom: 24,
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
});
