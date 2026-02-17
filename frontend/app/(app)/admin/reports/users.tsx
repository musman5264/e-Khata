import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, DataTable, Chip, ActivityIndicator } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

export default function AdminUserReport() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'reports', 'users'],
    queryFn: async () => {
      const res = await api.get('/admin/reports/users');
      return res.data;
    },
  });

  if (isLoading) return <ActivityIndicator style={{ flex: 1, marginTop: 60 }} />;

  const users = data?.data?.users ?? [];
  const byRole = data?.data?.by_role ?? {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.title}>{t('admin.userReport')}</Text>

      {/* Role summary */}
      <View style={styles.chipRow}>
        {Object.entries(byRole).map(([role, count]) => (
          <Chip key={role} style={styles.chip} textStyle={styles.chipText}>
            {role}: {String(count)}
          </Chip>
        ))}
      </View>

      <Surface style={styles.tableWrap}>
        <DataTable>
          <DataTable.Header>
            <DataTable.Title>{t('common.name')}</DataTable.Title>
            <DataTable.Title>{t('common.email')}</DataTable.Title>
            <DataTable.Title>{t('auth.role')}</DataTable.Title>
            <DataTable.Title numeric>{t('admin.businesses')}</DataTable.Title>
            <DataTable.Title>{t('session.loginAt')}</DataTable.Title>
          </DataTable.Header>
          {users.map((u: any) => (
            <DataTable.Row key={u.id}>
              <DataTable.Cell>{u.name}</DataTable.Cell>
              <DataTable.Cell>{u.email ?? '-'}</DataTable.Cell>
              <DataTable.Cell>
                {(u.roles ?? []).map((r: any) => r.name).join(', ') || '-'}
              </DataTable.Cell>
              <DataTable.Cell numeric>{u.businesses_count ?? 0}</DataTable.Cell>
              <DataTable.Cell>{u.last_login ? new Date(u.last_login).toLocaleDateString() : '-'}</DataTable.Cell>
            </DataTable.Row>
          ))}
          {users.length === 0 && (
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
  title: { fontWeight: '700', marginBottom: spacing.base },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { backgroundColor: '#EEF0FF' },
  chipText: { fontSize: 12 },
  tableWrap: { borderRadius: 12, elevation: 1, backgroundColor: '#fff', overflow: 'hidden' },
});
