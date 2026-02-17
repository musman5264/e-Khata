import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Alert, ScrollView } from 'react-native';
import { Text, Card, IconButton, Chip, Button, Modal, Portal, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

export default function SessionsSettingsScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [selectedSession, setSelectedSession] = useState<any>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const res = await api.get('/sessions');
      return res.data.data;
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => api.delete(`/sessions/${sessionId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  });

  const revokeAllMutation = useMutation({
    mutationFn: () => api.delete('/sessions/all-except-current'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  });

  const handleRevokeAll = () => {
    Alert.alert(t('common.confirm'), t('session.revokeAllConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.confirm'), onPress: () => revokeAllMutation.mutate() },
    ]);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleString();
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
          <Card style={styles.card} mode="outlined" onPress={() => setSelectedSession(item)}>
            <Card.Content style={styles.cardContent}>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                  {item.device_name || item.browser_name || t('session.device')}
                  {item.is_current ? ` (${t('session.currentDevice')})` : ''}
                </Text>
                <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                  {item.os_name || item.platform || ''} {item.os_version || ''} • {item.ip_address}
                </Text>
                <Text variant="labelSmall" style={{ color: colors.textHint }}>
                  {t('session.lastActive')}: {formatDate(item.last_active_at)}
                </Text>
                {item.is_current && (
                  <Chip compact style={styles.activeChip} textStyle={{ fontSize: 10, color: '#4CAF50' }}>
                    {t('session.active')}
                  </Chip>
                )}
              </View>
              {!item.is_current && (
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

      {/* Session Detail Modal */}
      <Portal>
        <Modal visible={!!selectedSession} onDismiss={() => setSelectedSession(null)}
          contentContainerStyle={styles.modalContent}>
          <ScrollView>
            <Text variant="titleMedium" style={{ fontWeight: '700', marginBottom: 16 }}>
              {t('session.sessionDetails')}
            </Text>
            {selectedSession && (
              <>
                <DetailRow label={t('session.device')} value={selectedSession.device_name || selectedSession.browser_name || '—'} />
                <DetailRow label={t('session.platform')} value={`${selectedSession.os_name || ''} ${selectedSession.os_version || ''}`} />
                <DetailRow label={t('session.browser')} value={selectedSession.browser_name || '—'} />
                <DetailRow label={t('session.ipAddress')} value={selectedSession.ip_address || '—'} />
                <DetailRow label={t('session.location')} value={
                  [selectedSession.geo_city, selectedSession.geo_country].filter(Boolean).join(', ') || selectedSession.location || '—'
                } />
                <DetailRow label={t('session.loginAt')} value={formatDate(selectedSession.login_at)} />
                <DetailRow label={t('session.lastActive')} value={formatDate(selectedSession.last_active_at)} />
                <DetailRow label={t('common.status')} value={selectedSession.is_current ? t('session.currentDevice') : t('session.active')} />
                <Divider style={{ marginVertical: 12 }} />
                {!selectedSession.is_current && (
                  <Button mode="contained" onPress={() => {
                    revokeMutation.mutate(selectedSession.id);
                    setSelectedSession(null);
                  }} buttonColor={colors.error} style={{ borderRadius: 8 }}>
                    {t('session.revokeSession')}
                  </Button>
                )}
              </>
            )}
            <Button mode="text" onPress={() => setSelectedSession(null)} style={{ marginTop: 8 }}>
              {t('common.close')}
            </Button>
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text variant="bodySmall" style={{ color: colors.textSecondary, width: 120 }}>{label}</Text>
      <Text variant="bodyMedium" style={{ flex: 1, fontWeight: '500' }}>{value}</Text>
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
  modalContent: {
    backgroundColor: '#fff', margin: 20, padding: 24, borderRadius: 16,
    maxHeight: '80%',
  },
  detailRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
});
