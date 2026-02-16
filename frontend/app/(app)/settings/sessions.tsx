import React from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Card, IconButton, Chip, Button } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

export default function SessionsSettingsScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const res = await api.get('/sessions');
      return res.data.data;
    },
  });

  const { data: currentSession } = useQuery({
    queryKey: ['current-session'],
    queryFn: async () => {
      const res = await api.get('/sessions/current');
      return res.data.data;
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => api.delete(`/sessions/${sessionId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  });

  const revokeAllMutation = useMutation({
    mutationFn: () => api.post('/sessions/revoke-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  });

  const handleRevokeAll = () => {
    Alert.alert(t('common.confirm'), t('session.revokeAllConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.confirm'), onPress: () => revokeAllMutation.mutate() },
    ]);
  };

  return (
    <View style={styles.container}>
      <Button mode="outlined" onPress={handleRevokeAll} style={styles.revokeAllBtn}
        textColor={colors.error} loading={revokeAllMutation.isPending}>
        {t('session.revokeAll')}
      </Button>

      <FlatList
        data={data}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={refetch}
        renderItem={({ item }: { item: any }) => (
          <Card style={styles.card} mode="outlined">
            <Card.Content style={styles.cardContent}>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                  {item.device_name || item.browser} {item.id === currentSession?.id && '(Current)'}
                </Text>
                <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                  {item.platform} • {item.ip_address}
                </Text>
                <Text variant="labelSmall" style={{ color: colors.textHint }}>
                  {t('session.lastActive')}: {item.last_active_at}
                </Text>
                {item.is_active && (
                  <Chip compact style={styles.activeChip} textStyle={{ fontSize: 10, color: '#4CAF50' }}>
                    {t('session.active')}
                  </Chip>
                )}
              </View>
              {item.id !== currentSession?.id && (
                <IconButton icon="close" size={18}
                  onPress={() => revokeMutation.mutate(item.id)} />
              )}
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('common.noData')}</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  revokeAllBtn: { margin: spacing.base, borderColor: colors.error, borderRadius: 8 },
  list: { paddingHorizontal: spacing.base, paddingBottom: 20 },
  card: { marginBottom: spacing.sm, borderRadius: 10 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  activeChip: { marginTop: 4, alignSelf: 'flex-start', backgroundColor: '#E8F5E9', borderRadius: 8 },
  emptyText: { textAlign: 'center', color: colors.textHint, marginTop: spacing.xxl },
});
