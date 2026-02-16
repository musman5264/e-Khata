import React from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Card, FAB, IconButton, Menu, Divider, Surface, Button } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';

export default function PartyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [menuVisible, setMenuVisible] = React.useState(false);

  const { data: party, isLoading } = useQuery({
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

  return (
    <View style={styles.container}>
      {/* Party Header */}
      <Surface style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text variant="headlineSmall" style={{ fontWeight: 'bold' }}>{party?.name}</Text>
            <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
              {party?.mobile} {party?.city ? `• ${party.city}` : ''}
            </Text>
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
        <View style={styles.balanceRow}>
          <Text variant="bodySmall" style={{ color: colors.textSecondary }}>{t('party.balance')}</Text>
          <Text variant="headlineMedium" style={{
            fontWeight: 'bold',
            color: balance > 0 ? colors.debit : balance < 0 ? colors.credit : colors.neutral,
          }}>
            {formatCurrency(Math.abs(balance))} {balance > 0 ? 'Dr' : balance < 0 ? 'Cr' : ''}
          </Text>
        </View>
      </Surface>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <Button
          mode="contained"
          icon="plus"
          buttonColor={colors.debit}
          textColor="#fff"
          style={styles.actionBtn}
          onPress={() => router.push({ pathname: '/(app)/transaction/create', params: { party_id: id, type: 'debit' } })}
        >
          {t('transaction.debit')}
        </Button>
        <Button
          mode="contained"
          icon="minus"
          buttonColor={colors.credit}
          textColor="#fff"
          style={styles.actionBtn}
          onPress={() => router.push({ pathname: '/(app)/transaction/create', params: { party_id: id, type: 'credit' } })}
        >
          {t('transaction.credit')}
        </Button>
      </View>

      {/* Transactions List */}
      <FlatList
        data={transactions}
        keyExtractor={(item: any) => item.id.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }: { item: any }) => (
          <Card
            style={styles.txnCard}
            mode="outlined"
            onPress={() => router.push(`/(app)/transaction/${item.id}`)}
          >
            <Card.Content style={styles.txnContent}>
              <View style={{ flex: 1 }}>
                <Text variant="bodySmall" style={{ color: colors.textHint }}>{item.date}</Text>
                <Text variant="bodyMedium">{item.description || '—'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  variant="bodyMedium"
                  style={{ fontWeight: 'bold', color: item.type === 'debit' ? colors.debit : colors.credit }}
                >
                  {formatCurrency(item.amount)}
                </Text>
                <Text variant="labelSmall" style={{ color: colors.textHint }}>
                  Bal: {formatCurrency(item.running_balance)}
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('common.noData')}</Text>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push({ pathname: '/(app)/transaction/create', params: { party_id: id } })}
        color={colors.onPrimary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.base, elevation: 2 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start' },
  balanceRow: { marginTop: spacing.md, alignItems: 'center' },
  actionsRow: { flexDirection: 'row', gap: spacing.md, padding: spacing.base },
  actionBtn: { flex: 1, borderRadius: 8 },
  list: { paddingHorizontal: spacing.base, paddingBottom: 80 },
  txnCard: { marginBottom: spacing.sm, borderRadius: 8 },
  txnContent: { flexDirection: 'row', alignItems: 'center' },
  emptyText: { textAlign: 'center', color: colors.textHint, marginTop: spacing.xxl },
  fab: { position: 'absolute', right: spacing.base, bottom: spacing.base, backgroundColor: colors.primary },
});
