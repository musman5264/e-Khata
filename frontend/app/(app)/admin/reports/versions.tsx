import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, Chip, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

export default function VersionHistoryScreen() {
  const { data } = useQuery({
    queryKey: ['admin-version-history'],
    queryFn: async () => { const res = await api.get('/admin/versions/history'); return res.data.data; },
  });

  const channelColor = (ch: string) => ch === 'stable' ? '#10B981' : ch === 'beta' ? '#F59E0B' : '#EF4444';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.title}>Version History</Text>

      {data && (
        <>
          {/* Current Version */}
          {data.current && (
            <Surface style={[styles.card, { borderLeftColor: '#10B981', borderLeftWidth: 4 }]}>
              <View style={styles.currentRow}>
                <MaterialCommunityIcons name="check-decagram" size={24} color="#10B981" />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.currentVersion}>v{data.current.version}</Text>
                  <Text style={styles.currentTitle}>{data.current.title}</Text>
                </View>
                <Chip style={{ backgroundColor: '#10B98120' }} textStyle={{ color: '#10B981', fontSize: 11, fontWeight: '600' }}>CURRENT</Chip>
              </View>
            </Surface>
          )}

          {/* Stats */}
          <View style={styles.row}>
            <Surface style={styles.statCard}>
              <Text style={styles.statValue}>{data.stats?.total_releases || 0}</Text>
              <Text style={styles.statLabel}>Total Releases</Text>
            </Surface>
            <Surface style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#10B981' }]}>{data.stats?.stable || 0}</Text>
              <Text style={styles.statLabel}>Stable</Text>
            </Surface>
            <Surface style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>{data.stats?.beta || 0}</Text>
              <Text style={styles.statLabel}>Beta</Text>
            </Surface>
          </View>

          {/* Timeline */}
          <Text style={styles.sectionTitle}>Release Timeline</Text>
          {data.timeline?.map((v: any, idx: number) => (
            <Surface key={v.id} style={styles.versionCard}>
              <View style={styles.versionHeader}>
                <View style={[styles.versionDot, { backgroundColor: channelColor(v.channel) }]} />
                <Text style={styles.versionNum}>v{v.version}</Text>
                <Chip compact style={{ backgroundColor: channelColor(v.channel) + '20' }}
                  textStyle={{ fontSize: 10, color: channelColor(v.channel), fontWeight: '600' }}>
                  {v.channel}
                </Chip>
                {v.force_update && (
                  <Chip compact style={{ backgroundColor: '#EF444420', marginLeft: 4 }}
                    textStyle={{ fontSize: 10, color: '#EF4444' }}>FORCE</Chip>
                )}
                <View style={{ flex: 1 }} />
                <Text style={styles.versionDate}>{v.release_date}</Text>
              </View>
              <Text style={styles.versionTitle}>{v.title}</Text>
              {v.changelog && <Text style={styles.versionChangelog}>{v.changelog}</Text>}
              {v.released_by && (
                <Text style={styles.versionBy}>Released by {v.released_by.name}</Text>
              )}
            </Surface>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: 40 },
  title: { fontWeight: '700', marginBottom: spacing.lg },
  row: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: { flex: 1, padding: 14, borderRadius: 12, elevation: 1, backgroundColor: '#fff', alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#1B2B65' },
  statLabel: { fontSize: 11, color: '#8A8FA8', marginTop: 4 },
  card: { padding: 16, borderRadius: 14, elevation: 1, backgroundColor: '#fff', marginBottom: 16 },
  currentRow: { flexDirection: 'row', alignItems: 'center' },
  currentVersion: { fontSize: 18, fontWeight: '700', color: '#1B2B65' },
  currentTitle: { fontSize: 12, color: '#8A8FA8', marginTop: 2 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#B0B5C8', letterSpacing: 1, marginBottom: 12, marginTop: 8 },
  versionCard: { padding: 14, borderRadius: 12, elevation: 1, backgroundColor: '#fff', marginBottom: 10 },
  versionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  versionDot: { width: 8, height: 8, borderRadius: 4 },
  versionNum: { fontSize: 14, fontWeight: '700', color: '#1B2B65' },
  versionDate: { fontSize: 11, color: '#8A8FA8' },
  versionTitle: { fontSize: 13, fontWeight: '600', color: '#4A4E6A', marginBottom: 4 },
  versionChangelog: { fontSize: 12, color: '#6C7293', lineHeight: 18 },
  versionBy: { fontSize: 10, color: '#B0B5C8', marginTop: 6 },
});
