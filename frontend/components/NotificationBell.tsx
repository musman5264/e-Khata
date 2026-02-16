import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Badge, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { colors } from '@/theme';

export default function NotificationBell() {
  const router = useRouter();

  const { data: count } = useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => {
      const res = await api.get('/notifications/unread-count');
      return res.data.data?.count ?? 0;
    },
    refetchInterval: 30000, // Poll every 30s
  });

  return (
    <TouchableOpacity
      onPress={() => router.push('/(app)/notifications')}
      style={styles.container}
    >
      <IconButton icon="bell-outline" size={24} iconColor={colors.onPrimary} />
      {count > 0 && (
        <Badge style={styles.badge} size={16}>
          {count > 99 ? '99+' : count}
        </Badge>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative' },
  badge: {
    position: 'absolute', top: 6, right: 6,
    backgroundColor: colors.error,
  },
});
