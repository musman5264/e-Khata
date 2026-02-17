import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/stores/auth';

export default function ImpersonationBanner() {
  const { isImpersonating, user, originalUser, stopImpersonation } = useAuthStore();

  if (!isImpersonating) return null;

  return (
    <View style={styles.banner}>
      <MaterialCommunityIcons name="incognito" size={18} color="#fff" />
      <Text style={styles.text} numberOfLines={1}>
        Viewing as <Text style={styles.bold}>{user?.name}</Text>
        {originalUser ? ` — logged in as ${originalUser.name}` : ''}
      </Text>
      <TouchableOpacity style={styles.stopBtn} onPress={stopImpersonation}>
        <MaterialCommunityIcons name="close-circle" size={16} color="#fff" />
        <Text style={styles.stopText}>Exit</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E84393',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    ...(Platform.OS === 'web' ? { position: 'sticky' as any, top: 0, zIndex: 99999 } : {}),
  },
  text: { flex: 1, color: '#fff', fontSize: 13 },
  bold: { fontWeight: '700' },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  stopText: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
