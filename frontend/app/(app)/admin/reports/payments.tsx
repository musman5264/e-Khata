import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Surface, DataTable } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

export default function PaymentReportScreen() {
  const { data } = useQuery({
    queryKey: ['admin-report-payments'],
    queryFn: async () => { const res = await api.get('/admin/reports/payment-summary'); return res.data.data; },
  });

  const fmt = (n: number) => `Rs. ${(n || 0).toLocaleString('en-PK')}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.title}>Payment Summary</Text>

      {data && (
        <>
          <View style={styles.row}>
            <Surface style={[styles.statCard, { borderLeftColor: '#10B981', borderLeftWidth: 3 }]}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#10B981" />
              <Text style={styles.statLabel}>Total Collected</Text>
              <Text style={[styles.statValue, { color: '#10B981' }]}>{fmt(data.total_collected)}</Text>
            </Surface>
            <Surface style={[styles.statCard, { borderLeftColor: '#F59E0B', borderLeftWidth: 3 }]}>
              <MaterialCommunityIcons name="clock-outline" size={20} color="#F59E0B" />
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={[styles.statValue, { color: '#F59E0B' }]}>{fmt(data.total_pending)}</Text>
            </Surface>
          </View>

          <Surface style={styles.card}>
            <Text style={styles.cardTitle}>By Payment Method</Text>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Method</DataTable.Title>
                <DataTable.Title numeric>Count</DataTable.Title>
                <DataTable.Title numeric>Total</DataTable.Title>
                <DataTable.Title numeric>Completed</DataTable.Title>
              </DataTable.Header>
              {data.by_method?.map((m: any) => (
                <DataTable.Row key={m.payment_method}>
                  <DataTable.Cell>{m.payment_method}</DataTable.Cell>
                  <DataTable.Cell numeric>{m.count}</DataTable.Cell>
                  <DataTable.Cell numeric>{fmt(m.total_amount)}</DataTable.Cell>
                  <DataTable.Cell numeric>{fmt(m.completed_amount)}</DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </Surface>

          <Surface style={styles.card}>
            <Text style={styles.cardTitle}>Monthly Collections</Text>
            <DataTable>
              <DataTable.Header>
                <DataTable.Title>Month</DataTable.Title>
                <DataTable.Title numeric>Count</DataTable.Title>
                <DataTable.Title numeric>Amount</DataTable.Title>
              </DataTable.Header>
              {data.monthly?.map((m: any) => (
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
