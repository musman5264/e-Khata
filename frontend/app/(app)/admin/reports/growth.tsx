import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, DataTable } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

export default function GrowthReportScreen() {
  const { data } = useQuery({
    queryKey: ['admin-report-growth'],
    queryFn: async () => { const res = await api.get('/admin/reports/growth'); return res.data.data; },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.title}>Growth Metrics</Text>

      {data && (
        <>
          <View style={styles.row}>
            <StatCard label="Total Users" value={data.totals?.users} color="#6366F1" icon="account-group" />
            <StatCard label="Total Businesses" value={data.totals?.businesses} color="#10B981" icon="store" />
          </View>
          <View style={styles.row}>
            <StatCard label="Total Parties" value={data.totals?.parties} color="#F59E0B" icon="account-multiple" />
            <StatCard label="Total Transactions" value={data.totals?.transactions} color="#EF4444" icon="swap-horizontal" />
          </View>

          <GrowthTable title="User Growth (Last 12 Months)" data={data.user_growth} />
          <GrowthTable title="Business Growth (Last 12 Months)" data={data.business_growth} />
          <GrowthTable title="Party Growth (Last 12 Months)" data={data.party_growth} />

          <Surface style={styles.card}>
            <Text style={styles.cardTitle}>Transaction Growth (Last 12 Months)</Text>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Month</DataTable.Title>
                <DataTable.Title numeric>Count</DataTable.Title>
                <DataTable.Title numeric>Amount</DataTable.Title>
              </DataTable.Header>
              {data.transaction_growth?.map((m: any) => (
                <DataTable.Row key={m.month}>
                  <DataTable.Cell>{m.month}</DataTable.Cell>
                  <DataTable.Cell numeric>{m.count}</DataTable.Cell>
                  <DataTable.Cell numeric>Rs. {Number(m.total_amount || 0).toLocaleString()}</DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Surface>
        </>
      )}
    </ScrollView>
  );
}

function GrowthTable({ title, data }: { title: string; data: any[] }) {
  return (
    <Surface style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <DataTable>
        <DataTable.Header>
          <DataTable.Title>Month</DataTable.Title>
          <DataTable.Title numeric>New</DataTable.Title>
        </DataTable.Header>
        {data?.map((m: any) => (
          <DataTable.Row key={m.month}>
            <DataTable.Cell>{m.month}</DataTable.Cell>
            <DataTable.Cell numeric>{m.count}</DataTable.Cell>
          </DataTable.Row>
        ))}
      </DataTable>
    </Surface>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <Surface style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <MaterialCommunityIcons name={icon as any} size={20} color={color} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value?.toLocaleString()}</Text>
    </Surface>
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
});
