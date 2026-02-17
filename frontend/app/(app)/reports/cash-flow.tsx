import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { Text, Surface, ActivityIndicator, Button, TextInput, Chip, DataTable, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import ReportActions from '@/components/ReportActions';

type PeriodType = 'daily' | 'weekly' | 'monthly';

export default function CashFlowScreen() {
  const { width } = useWindowDimensions();
  const isWide = width > 700;

  const [period, setPeriod] = useState<PeriodType>('daily');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['cash-flow', period, dateFrom, dateTo],
    queryFn: async () => {
      const params: any = { period };
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const res = await api.get('/reports/cash-flow', { params });
      return res.data.data;
    },
  });

  const periods = data?.periods || [];
  const totals = data?.totals;

  const formatAmount = (val: number) =>
    `Rs ${Math.abs(val).toLocaleString('en-PK', { minimumFractionDigits: 2 })}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={[styles.headerRow, { justifyContent: 'space-between' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <MaterialCommunityIcons name="chart-line" size={28} color="#8B5CF6" />
          <Text variant="headlineSmall" style={styles.title}>Cash Flow Summary</Text>
        </View>
        {periods.length > 0 && <ReportActions />}
      </View>

      {/* Filters */}
      <Surface style={styles.filterCard}>
        <View style={[styles.filterGrid, isWide && { flexDirection: 'row' }]}>
          <View style={{ flex: 1 }}>
            <Text variant="labelMedium" style={styles.filterLabel}>Period</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['daily', 'weekly', 'monthly'] as PeriodType[]).map((p) => (
                <Chip
                  key={p}
                  selected={period === p}
                  onPress={() => setPeriod(p)}
                  style={period === p ? styles.chipActive : styles.chip}
                  textStyle={{ color: period === p ? '#fff' : colors.text, fontSize: 12 }}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </Chip>
              ))}
            </View>
          </View>
          <View style={{ flex: 1, minWidth: 130 }}>
            <Text variant="labelMedium" style={styles.filterLabel}>From Date</Text>
            <TextInput
              mode="outlined"
              value={dateFrom}
              onChangeText={setDateFrom}
              placeholder="YYYY-MM-DD"
              dense
              style={styles.dateInput}
            />
          </View>
          <View style={{ flex: 1, minWidth: 130 }}>
            <Text variant="labelMedium" style={styles.filterLabel}>To Date</Text>
            <TextInput
              mode="outlined"
              value={dateTo}
              onChangeText={setDateTo}
              placeholder="YYYY-MM-DD"
              dense
              style={styles.dateInput}
            />
          </View>
          <View style={{ justifyContent: 'flex-end' }}>
            <Button mode="contained" onPress={() => refetch()} style={{ borderRadius: 8, marginTop: isWide ? 0 : 8 }} icon="refresh">
              Refresh
            </Button>
          </View>
        </View>
      </Surface>

      {/* Summary Cards */}
      {totals && (
        <View style={styles.summaryGrid}>
          <Surface style={[styles.summaryCard, { borderLeftColor: colors.debit }]}>
            <Text style={styles.summaryLabel}>Total Inflow (Dr)</Text>
            <Text style={[styles.summaryValue, { color: colors.debit }]}>{formatAmount(totals.total_debit)}</Text>
          </Surface>
          <Surface style={[styles.summaryCard, { borderLeftColor: colors.credit }]}>
            <Text style={styles.summaryLabel}>Total Outflow (Cr)</Text>
            <Text style={[styles.summaryValue, { color: colors.credit }]}>{formatAmount(totals.total_credit)}</Text>
          </Surface>
          <Surface style={[styles.summaryCard, { borderLeftColor: totals.net >= 0 ? colors.debit : colors.credit }]}>
            <Text style={styles.summaryLabel}>Net Cash Flow</Text>
            <Text style={[styles.summaryValue, { color: totals.net >= 0 ? colors.debit : colors.credit }]}>
              {totals.net >= 0 ? '+' : '-'}{formatAmount(totals.net)}
            </Text>
          </Surface>
          <Surface style={[styles.summaryCard, { borderLeftColor: '#8B5CF6' }]}>
            <Text style={styles.summaryLabel}>Total Transactions</Text>
            <Text style={[styles.summaryValue, { color: '#8B5CF6' }]}>{totals.total_transactions}</Text>
          </Surface>
        </View>
      )}

      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* Cash Flow Table */}
      {periods.length > 0 && (
        <Surface style={styles.tableCard}>
          <ScrollView horizontal={!isWide}>
            <DataTable style={{ minWidth: isWide ? undefined : 550 }}>
              <DataTable.Header style={styles.tableHeader}>
                <DataTable.Title style={{ flex: 2 }}>
                  <Text style={styles.thText}>Period</Text>
                </DataTable.Title>
                <DataTable.Title numeric style={{ flex: 1.2 }}>
                  <Text style={styles.thText}>Inflow (Dr)</Text>
                </DataTable.Title>
                <DataTable.Title numeric style={{ flex: 1.2 }}>
                  <Text style={styles.thText}>Outflow (Cr)</Text>
                </DataTable.Title>
                <DataTable.Title numeric style={{ flex: 1.2 }}>
                  <Text style={styles.thText}>Net</Text>
                </DataTable.Title>
                <DataTable.Title numeric style={{ flex: 0.8 }}>
                  <Text style={styles.thText}>Txns</Text>
                </DataTable.Title>
              </DataTable.Header>

              {periods.map((row: any, idx: number) => (
                <DataTable.Row key={idx}>
                  <DataTable.Cell style={{ flex: 2 }}>
                    <Text style={styles.cellText}>{row.period}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={{ flex: 1.2 }}>
                    <Text style={[styles.cellText, { color: colors.debit }]}>{formatAmount(row.total_debit)}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={{ flex: 1.2 }}>
                    <Text style={[styles.cellText, { color: colors.credit }]}>{formatAmount(row.total_credit)}</Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={{ flex: 1.2 }}>
                    <Text style={[styles.cellText, {
                      fontWeight: '600',
                      color: row.net >= 0 ? colors.debit : colors.credit,
                    }]}>
                      {row.net >= 0 ? '+' : ''}{formatAmount(row.net)}
                    </Text>
                  </DataTable.Cell>
                  <DataTable.Cell numeric style={{ flex: 0.8 }}>
                    <Text style={styles.cellText}>{row.txn_count}</Text>
                  </DataTable.Cell>
                </DataTable.Row>
              ))}
            </DataTable>
          </ScrollView>
        </Surface>
      )}

      {!isLoading && periods.length === 0 && (
        <Surface style={styles.emptyCard}>
          <MaterialCommunityIcons name="chart-bar-stacked" size={48} color="#ccc" />
          <Text style={{ color: colors.textSecondary, marginTop: 8 }}>No cash flow data for the selected period.</Text>
        </Surface>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: spacing.base },
  title: { fontWeight: '700' },
  filterCard: { padding: spacing.base, borderRadius: 14, backgroundColor: '#fff', elevation: 1, marginBottom: 12 },
  filterGrid: { gap: 12 },
  filterLabel: { marginBottom: 4, color: colors.textSecondary, fontWeight: '600' },
  dateInput: { backgroundColor: '#fff', fontSize: 13 },
  chip: { backgroundColor: '#F0F0F0' },
  chipActive: { backgroundColor: colors.primary },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  summaryCard: {
    flex: 1, minWidth: 160, padding: spacing.base, borderRadius: 12,
    backgroundColor: '#fff', elevation: 1, borderLeftWidth: 4,
  },
  summaryLabel: { fontSize: 11, color: colors.textSecondary, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: '700' },
  tableCard: { borderRadius: 14, backgroundColor: '#fff', elevation: 1, overflow: 'hidden' },
  tableHeader: { backgroundColor: '#F5F0FF' },
  thText: { fontWeight: '700', fontSize: 12, color: '#333' },
  cellText: { fontSize: 12 },
  centered: { padding: 40, alignItems: 'center' },
  emptyCard: { padding: 40, borderRadius: 14, alignItems: 'center', backgroundColor: '#fff', elevation: 1 },
});
