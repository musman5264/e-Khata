import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, DataTable, ActivityIndicator } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

export default function AdminActivityReport() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports', 'activity'],
    queryFn: async () => {
      const res = await api.get('/admin/reports/activity');
      return res.data;
    },
  });

  if (isLoading) return <ActivityIndicator style={{ flex: 1, marginTop: 60 }} />;

  const sessions = data?.data?.sessions ?? [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.title}>{t('admin.activityReport')}</Text>
      <Text variant="bodySmall" style={styles.subtitle}>{t('session.activityLog')} — {t('common.refresh')}</Text>

      <Surface style={styles.tableWrap}>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>{t('common.name')}</DataTable.Title>
            <DataTable.Title>{t('session.device')}</DataTable.Title>
            <DataTable.Title>{t('session.ipAddress')}</DataTable.Title>
            <DataTable.Title>{t('session.loginAt')}</DataTable.Title>
            <DataTable.Title>{t('session.lastActive')}</DataTable.Title>
          </DataTable.Header>
          {sessions.map((s: any, idx: number) => (
            <DataTable.Row key={s.id ?? idx}>
              <DataTable.Cell>{s.user?.name ?? '-'}</DataTable.Cell>
              <DataTable.Cell>{[s.device, s.platform].filter(Boolean).join(' / ') || '-'}</DataTable.Cell>
              <DataTable.Cell>{s.ip_address ?? '-'}</DataTable.Cell>
              <DataTable.Cell>{s.login_at ? new Date(s.login_at).toLocaleString() : '-'}</DataTable.Cell>
              <DataTable.Cell>{s.last_active_at ? new Date(s.last_active_at).toLocaleString() : '-'}</DataTable.Cell>
            </DataTable.Row>
          ))}
          {sessions.length === 0 && (
            <DataTable.Row>
              <DataTable.Cell>{t('common.noResults')}</DataTable.Cell>
            </DataTable.Row>
          )}
        </DataTable>
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: 40 },
  title: { fontWeight: '700', marginBottom: 4 },
  subtitle: { color: colors.textSecondary, marginBottom: 16 },
  tableWrap: { borderRadius: 12, elevation: 1, backgroundColor: '#fff', overflow: 'hidden' },
});
