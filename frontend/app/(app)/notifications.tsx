import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, IconButton, Badge } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data.data;
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.post(`/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.post('/notifications/read-all'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const typeIcon = (type: string) => {
    switch (type) {
      case 'transaction': return '💰';
      case 'payment': return '💳';
      case 'login': return '🔐';
      case 'team': return '👥';
      default: return '🔔';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerActions}>
        <Text variant="bodySmall" style={{ color: colors.textHint }}>
          {data?.filter((n: any) => !n.read_at).length ?? 0} {t('notification.unread')}
        </Text>
        <IconButton icon="check-all" size={20} onPress={() => markAllReadMutation.mutate()} />
      </View>

      <FlatList
        data={data}
        keyExtractor={(item: any) => item.id}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={refetch}
        renderItem={({ item }: { item: any }) => (
          <Card
            style={[styles.card, !item.read_at && styles.unreadCard]}
            mode="outlined"
            onPress={() => !item.read_at && markReadMutation.mutate(item.id)}
          >
            <Card.Content style={styles.cardContent}>
              <Text style={styles.typeIcon}>{typeIcon(item.type)}</Text>
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text variant="bodyMedium" style={{ fontWeight: item.read_at ? '400' : '600' }}>
                  {item.title}
                </Text>
                <Text variant="bodySmall" style={{ color: colors.textSecondary, marginTop: 2 }}>
                  {item.body}
                </Text>
                <Text variant="labelSmall" style={{ color: colors.textHint, marginTop: 4 }}>
                  {item.created_at}
                </Text>
              </View>
              {!item.read_at && <Badge size={8} style={styles.unreadDot} />}
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
  headerActions: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.base, paddingTop: spacing.sm,
  },
  list: { padding: spacing.base, paddingBottom: 20 },
  card: { marginBottom: spacing.sm, borderRadius: 10 },
  unreadCard: { backgroundColor: colors.primary + '08' },
  cardContent: { flexDirection: 'row', alignItems: 'flex-start' },
  typeIcon: { fontSize: 24, marginTop: 2 },
  unreadDot: { backgroundColor: colors.primary, position: 'absolute', top: 8, right: 8 },
  emptyText: { textAlign: 'center', color: colors.textHint, marginTop: spacing.xxl },
});
