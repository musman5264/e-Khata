import React from 'react';
import { View, StyleSheet, FlatList, Alert, TouchableOpacity, Platform } from 'react-native';
import { Text, FAB, IconButton, Menu, Divider, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import WebContainer from '@/components/WebContainer';

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function PartyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [menuVisible, setMenuVisible] = React.useState(false);

  const { data: party } = useQuery({
    queryKey: ['party', id],
    queryFn: async () => {
      const res = await api.get(`/parties/${id}`);
      return res.data.data;
    },
  });

  const { data: transactions } = useQuery({
    queryKey: ['party-transactions', id],
    queryFn: async () => {
      const res = await api.get(`/transactions`, { params: { party_id: id, per_page: 100 } });
      return res.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/parties/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      router.back();
    },
  });

  const handleDelete = () => {
    Alert.alert(t('common.confirm'), t('party.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  };

  const balance = party?.current_balance ?? 0;
  const isDebit = balance > 0;

  return (
    <WebContainer>
      <View style={styles.container}>
        {/* Party Header Card */}
        <Surface style={styles.header}>
          <View style={styles.headerTop}>
            <View style={[styles.avatar, { backgroundColor: party ? '#3D5AF1' : '#ccc' }]}>
              <Text style={styles.avatarText}>{party ? getInitials(party.name) : '?'}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.partyName}>{party?.name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <MaterialCommunityIcons name="phone-outline" size={13} color={colors.textSecondary} />
                <Text style={styles.partyMeta}> {party?.mobile || '—'}</Text>
                {party?.city ? (
                  <>
                    <Text style={styles.partyMeta}> • </Text>
                    <MaterialCommunityIcons name="map-marker-outline" size={13} color={colors.textSecondary} />
                    <Text style={styles.partyMeta}> {party.city}</Text>
                  </>
                ) : null}
              </View>
            </View>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={<IconButton icon="dots-vertical" onPress={() => setMenuVisible(true)} />}
            >
              <Menu.Item onPress={() => { setMenuVisible(false); router.push(`/(app)/party/edit/${id}`); }} title={t('common.edit')} leadingIcon="pencil" />
              <Menu.Item onPress={() => { setMenuVisible(false); router.push({ pathname: '/(app)/share/statement', params: { party_id: id } }); }} title={t('share.share')} leadingIcon="share" />
              <Divider />
              <Menu.Item onPress={() => { setMenuVisible(false); handleDelete(); }} title={t('common.delete')} leadingIcon="delete" titleStyle={{ color: colors.error }} />
            </Menu>
          </View>

          {/* Balance Display */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>{t('party.balance')}</Text>
            <Text style={[styles.balanceAmt, { color: isDebit ? colors.debit : balance < 0 ? colors.credit : colors.neutral }]}>
              {formatCurrency(Math.abs(balance))}
            </Text>
            <View style={[styles.balanceBadge, { backgroundColor: isDebit ? '#FFEBEE' : balance < 0 ? '#E8F5E9' : '#F5F5F5' }]}>
              <Text style={[styles.balanceBadgeText, { color: isDebit ? colors.debit : balance < 0 ? colors.credit : colors.neutral }]}>
                {balance > 0 ? 'NAAM — Aap ne lena hai' : balance < 0 ? 'JAMA — Aap ne dena hai' : 'SETTLED'}
              </Text>
            </View>
          </View>
        </Surface>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#FFEBEE' }]}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/(app)/transaction/create', params: { party_id: id, type: 'debit' } })}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: colors.debit }]}>
              <MaterialCommunityIcons name="arrow-down" size={20} color="#fff" />
            </View>
            <Text style={[styles.actionLabel, { color: colors.debit }]}>{t('transaction.debit')}</Text>
            <Text style={styles.actionHint}>NAAM</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#E8F5E9' }]}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/(app)/transaction/create', params: { party_id: id, type: 'credit' } })}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: colors.credit }]}>
              <MaterialCommunityIcons name="arrow-up" size={20} color="#fff" />
            </View>
            <Text style={[styles.actionLabel, { color: colors.credit }]}>{t('transaction.credit')}</Text>
            <Text style={styles.actionHint}>JAMA</Text>
          </TouchableOpacity>
        </View>

        {/* Transactions List */}
        <View style={styles.txnHeader}>
          <Text style={styles.txnHeaderTitle}>Transactions</Text>
          <Text style={styles.txnCount}>{transactions?.length ?? 0} entries</Text>
        </View>

        <FlatList
          data={transactions}
          keyExtractor={(item: any) => item.id.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }: { item: any }) => (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push(`/(app)/transaction/${item.id}`)}
            >
              <Surface style={styles.txnCard}>
                <View style={styles.txnContent}>
                  <View style={[styles.txnDot, { backgroundColor: item.type === 'debit' ? colors.debit : colors.credit }]} />
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.txnDate}>{item.date}</Text>
                    <Text style={styles.txnDesc}>{item.description || '—'}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.txnAmt, { color: item.type === 'debit' ? colors.debit : colors.credit }]}>
                      {formatCurrency(item.amount)}
                    </Text>
                    <View style={[styles.txnBadge, { backgroundColor: item.type === 'debit' ? '#FFEBEE' : '#E8F5E9' }]}>
                      <Text style={[styles.txnBadgeText, { color: item.type === 'debit' ? colors.debit : colors.credit }]}>
                        {item.type === 'debit' ? 'NAAM' : 'JAMA'}
                      </Text>
                    </View>
                    <Text style={styles.txnBal}>Bal: {formatCurrency(item.running_balance)}</Text>
                  </View>
                </View>
              </Surface>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 40 }}>📝</Text>
              <Text style={styles.emptyTitle}>No transactions yet</Text>
              <Text style={styles.emptyDesc}>Add your first debit or credit entry</Text>
            </View>
          }
        />

        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => router.push({ pathname: '/(app)/transaction/create', params: { party_id: id } })}
          color={colors.onPrimary}
        />
      </View>
    </WebContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Header
  header: { margin: spacing.base, borderRadius: 20, padding: 18, elevation: 2, backgroundColor: colors.surface },
  headerTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  partyName: { fontSize: 18, fontWeight: '700', color: colors.text },
  partyMeta: { fontSize: 12, color: colors.textSecondary },

  balanceCard: { marginTop: 16, alignItems: 'center', paddingVertical: 16, borderRadius: 14, backgroundColor: colors.surfaceVariant },
  balanceLabel: { fontSize: 12, color: colors.textSecondary, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 0.5 },
  balanceAmt: { fontSize: 28, fontWeight: '800', marginTop: 4 },
  balanceBadge: { marginTop: 8, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 10 },
  balanceBadgeText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },

  // Actions
  actionsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: spacing.base, marginBottom: 4 },
  actionBtn: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  actionIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 14, fontWeight: '700', marginTop: 8 },
  actionHint: { fontSize: 10, color: colors.textHint, fontWeight: '600', marginTop: 2, letterSpacing: 0.5 },

  // Transactions
  txnHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.base + 4, paddingVertical: 12 },
  txnHeaderTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  txnCount: { fontSize: 12, color: colors.textSecondary },

  list: { paddingHorizontal: spacing.base, paddingBottom: 80 },
  txnCard: { marginBottom: 8, borderRadius: 14, padding: 14, elevation: 1, backgroundColor: colors.surface },
  txnContent: { flexDirection: 'row', alignItems: 'center' },
  txnDot: { width: 10, height: 10, borderRadius: 5 },
  txnDate: { fontSize: 11, color: colors.textHint, fontWeight: '500' },
  txnDesc: { fontSize: 14, color: colors.text, marginTop: 2 },
  txnAmt: { fontSize: 15, fontWeight: '700' },
  txnBadge: { marginTop: 2, paddingHorizontal: 8, paddingVertical: 1, borderRadius: 6 },
  txnBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  txnBal: { fontSize: 10, color: colors.textHint, marginTop: 2 },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 50 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 10 },
  emptyDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },

  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: colors.primary, borderRadius: 16 },
});
