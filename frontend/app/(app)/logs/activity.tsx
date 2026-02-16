import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Card, Chip } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

export default function ActivityLogScreen() {
  const { t } = useTranslation();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: async () => {
      const res = await api.get('/logs/activity');
      return res.data.data;
    },
  });

  const actionColor = (action: string) => {
    switch (action) {
      case 'created': return '#4CAF50';
      case 'updated': return '#2196F3';
      case 'deleted': return '#F44336';
      default: return colors.textHint;
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        keyExtractor={(item: any, index: number) => item.id?.toString() || index.toString()}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={refetch}
        renderItem={({ item }: { item: any }) => (
          <Card style={styles.card} mode="outlined">
            <Card.Content>
              <View style={styles.headerRow}>
                <Text variant="bodyMedium" style={{ fontWeight: '600', flex: 1 }}>
                  {item.description || item.action}
                </Text>
                <Chip compact style={{ backgroundColor: actionColor(item.action) + '20' }}
                  textStyle={{ fontSize: 10, color: actionColor(item.action) }}>
                  {item.action}
                </Chip>
              </View>
              <Text variant="bodySmall" style={{ color: colors.textSecondary, marginTop: 4 }}>
                {item.model_type?.split('\\').pop()} #{item.model_id}
              </Text>
              <Text variant="labelSmall" style={{ color: colors.textHint, marginTop: 4 }}>
                {item.user_name || 'System'} • {item.created_at}
              </Text>
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
  list: { padding: spacing.base, paddingBottom: 20 },
  card: { marginBottom: spacing.sm, borderRadius: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  emptyText: { textAlign: 'center', color: colors.textHint, marginTop: spacing.xxl },
});
