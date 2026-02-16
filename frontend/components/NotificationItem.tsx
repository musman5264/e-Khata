import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Badge } from 'react-native-paper';
import { colors, spacing } from '@/theme';

interface NotificationItemProps {
  notification: {
    id: string;
    title: string;
    body: string;
    type: string;
    read_at: string | null;
    created_at: string;
  };
  onPress: () => void;
}

const typeIcons: Record<string, string> = {
  transaction: '💰',
  payment: '💳',
  login: '🔐',
  team: '👥',
  default: '🔔',
};

export default function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const icon = typeIcons[notification.type] || typeIcons.default;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.container, !notification.read_at && styles.unread]}
      activeOpacity={0.7}
    >
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.content}>
        <Text variant="bodyMedium" style={{ fontWeight: notification.read_at ? '400' : '600' }}>
          {notification.title}
        </Text>
        <Text variant="bodySmall" style={{ color: colors.textSecondary, marginTop: 2 }}>
          {notification.body}
        </Text>
        <Text variant="labelSmall" style={{ color: colors.textHint, marginTop: 4 }}>
          {notification.created_at}
        </Text>
      </View>
      {!notification.read_at && <Badge size={8} style={styles.dot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'flex-start', padding: spacing.md,
    backgroundColor: colors.surface, borderRadius: 10, marginBottom: spacing.sm,
  },
  unread: { backgroundColor: colors.primary + '08' },
  icon: { fontSize: 24, marginRight: spacing.md, marginTop: 2 },
  content: { flex: 1 },
  dot: { backgroundColor: colors.primary, position: 'absolute', top: spacing.md, right: spacing.md },
});
