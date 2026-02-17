import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, DataTable } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

export default function FinancialReportScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-report-financial'],
    queryFn: async () => { const res = await api.get('/admin/reports/financial'); return res.data.data; },
  });

  const fmt = (n: number) => `Rs. ${(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0 })}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.title}>Financial Overview</Text>

      {data && (
        <>
          {/* Summary Cards */}
          <View style={styles.row}>
            <StatCard label="Total Debit" value={fmt(data.total_debit)} color="#EF4444" icon="arrow-bottom-left" />
            <StatCard label="Total Credit" value={fmt(data.total_credit)} color="#10B981" icon="arrow-top-right" />
          </View>
          <View style={styles.row}>
            <StatCard label="Net Balance" value={fmt(data.net_balance)} color="#6366F1" icon="scale-balance" />
            <StatCard label="Total Payments" value={fmt(data.total_payments)} color="#F59E0B" icon="cash-multiple" />
          </View>

          {/* Top Businesses */}
          <Surface style={styles.card}>
            <Text style={styles.cardTitle}>Top Businesses by Volume</Text>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Business</DataTable.Title>
                <DataTable.Title numeric>Transactions</DataTable.Title>
                <DataTable.Title numeric>Amount</DataTable.Title>
              </DataTable.Header>
              {data.top_businesses?.map((b: any) => (
                <DataTable.Row key={b.id}>
                  <DataTable.Cell>{b.name}</DataTable.Cell>
                  <DataTable.Cell numeric>{b.transaction_count}</DataTable.Cell>
                  <DataTable.Cell numeric>{fmt(b.total_amount)}</DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Surface>

          {/* Monthly Volume */}
          <Surface style={styles.card}>
            <Text style={styles.cardTitle}>Monthly Transaction Volume</Text>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Month</DataTable.Title>
                <DataTable.Title numeric>Count</DataTable.Title>
                <DataTable.Title numeric>Total</DataTable.Title>
              </DataTable.Header>
              {data.monthly_volume?.map((m: any) => (
                <DataTable.Row key={m.month}>
                  <DataTable.Cell>{m.month}</DataTable.Cell>
                  <DataTable.Cell numeric>{m.count}</DataTable.Cell>
                  <DataTable.Cell numeric>{fmt(m.total)}</DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Surface>
        </>
      )}
    </ScrollView>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  return (
    <Surface style={[styles.statCard, { borderLeftColor: color, borderLeftWidth: 3 }]}>
      <MaterialCommunityIcons name={icon as any} size={20} color={color} />
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
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
  statValue: { fontSize: 16, fontWeight: '700', marginTop: 4 },
  card: { padding: 16, borderRadius: 14, elevation: 1, backgroundColor: '#fff', marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1B2B65', marginBottom: 12 },
});
