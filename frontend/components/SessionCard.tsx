import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Chip, IconButton } from 'react-native-paper';
import { colors, spacing } from '@/theme';

interface SessionCardProps {
  session: {
    id: string;
    device_name: string;
    browser: string;
    platform: string;
    ip_address: string;
    last_active_at: string;
    is_active: boolean;
  };
  isCurrent: boolean;
  onRevoke: () => void;
}

export default function SessionCard({ session, isCurrent, onRevoke }: SessionCardProps) {
  const deviceIcon = () => {
    const platform = session.platform?.toLowerCase() || '';
    if (platform.includes('ios') || platform.includes('iphone')) return '📱';
    if (platform.includes('android')) return '📱';
    if (platform.includes('mac')) return '💻';
    if (platform.includes('windows')) return '🖥️';
    if (platform.includes('linux')) return '🐧';
    return '📱';
  };

  return (
    <View style={[styles.container, isCurrent && styles.currentContainer]}>
      <Text style={styles.deviceIcon}>{deviceIcon()}</Text>
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
            {session.device_name || session.browser}
          </Text>
          {isCurrent && (
            <Chip compact style={styles.currentChip} textStyle={{ fontSize: 9, color: '#4CAF50' }}>
              Current
            </Chip>
          )}
        </View>
        <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
          {session.platform} • {session.ip_address}
        </Text>
        <Text variant="labelSmall" style={{ color: colors.textHint }}>
          Last active: {session.last_active_at}
        </Text>
      </View>
      {!isCurrent && (
        <IconButton icon="close" size={18} onPress={onRevoke} iconColor={colors.error} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    padding: spacing.md, borderRadius: 10, marginBottom: spacing.sm, elevation: 1,
  },
  currentContainer: { borderLeftWidth: 3, borderLeftColor: '#4CAF50' },
  deviceIcon: { fontSize: 28, marginRight: spacing.md },
  info: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  currentChip: { backgroundColor: '#E8F5E9', borderRadius: 6 },
});
