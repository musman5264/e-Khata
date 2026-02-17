import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, DataTable, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

export default function SessionReportScreen() {
  const { data } = useQuery({
    queryKey: ['admin-report-sessions'],
    queryFn: async () => { const res = await api.get('/admin/reports/sessions'); return res.data.data; },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.title}>Session Analytics</Text>

      {data && (
        <>
          <View style={styles.row}>
            <Surface style={[styles.statCard, { borderLeftColor: '#10B981', borderLeftWidth: 3 }]}>
              <MaterialCommunityIcons name="access-point" size={20} color="#10B981" />
              <Text style={styles.statLabel}>Active Sessions</Text>
              <Text style={[styles.statValue, { color: '#10B981' }]}>{data.active_sessions}</Text>
            </Surface>
            <Surface style={[styles.statCard, { borderLeftColor: '#6366F1', borderLeftWidth: 3 }]}>
              <MaterialCommunityIcons name="counter" size={20} color="#6366F1" />
              <Text style={styles.statLabel}>Total Sessions</Text>
              <Text style={[styles.statValue, { color: '#6366F1' }]}>{data.total_sessions}</Text>
            </Surface>
          </View>

          <Surface style={styles.card}>
            <Text style={styles.cardTitle}>By Browser</Text>
            <View style={styles.chipRow}>
              {data.by_browser?.map((b: any) => (
                <Chip key={b.browser} style={styles.chip} textStyle={styles.chipText}>
                  {b.browser || 'Unknown'}: {b.count}
                </Chip>
              ))}
            </View>
          </Surface>

          <Surface style={styles.card}>
            <Text style={styles.cardTitle}>By Operating System</Text>
            <View style={styles.chipRow}>
              {data.by_os?.map((o: any) => (
                <Chip key={o.os} style={styles.chip} textStyle={styles.chipText}>
                  {o.os || 'Unknown'}: {o.count}
                </Chip>
              ))}
            </View>
          </Surface>

          <Surface style={styles.card}>
            <Text style={styles.cardTitle}>By Device Type</Text>
            <View style={styles.chipRow}>
              {data.by_device?.map((d: any) => (
                <Chip key={d.device_type} style={styles.chip} textStyle={styles.chipText}>
                  {d.device_type || 'Unknown'}: {d.count}
                </Chip>
              ))}
            </View>
          </Surface>

          <Surface style={styles.card}>
            <Text style={styles.cardTitle}>Daily Logins (Last 30 Days)</Text>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Date</DataTable.Title>
                <DataTable.Title numeric>Logins</DataTable.Title>
              </DataTable.Header>
              {data.daily_logins?.slice(-15).map((d: any) => (
                <DataTable.Row key={d.date}>
                  <DataTable.Cell>{d.date}</DataTable.Cell>
                  <DataTable.Cell numeric>{d.count}</DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Surface>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: 40 },
  title: { fontWeight: '700', marginBottom: spacing.lg },
  row: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, padding: 16, borderRadius: 12, elevation: 1, backgroundColor: '#fff' },
  statLabel: { fontSize: 11, color: '#8A8FA8', marginTop: 8 },
  statValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  card: { padding: 16, borderRadius: 14, elevation: 1, backgroundColor: '#fff', marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1B2B65', marginBottom: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: '#F3F4F6' },
  chipText: { fontSize: 12 },
});
