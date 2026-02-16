import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Searchbar, FAB, Text, Card, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';

export default function PartiesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['parties', search, typeFilter],
    queryFn: async () => {
      const params: any = { per_page: 50 };
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      const res = await api.get('/parties', { params });
      return res.data.data;
    },
  });

  const renderParty = ({ item }: { item: any }) => {
    const balance = item.current_balance ?? 0;
    const isDebit = balance > 0;

    return (
      <Card
        style={styles.partyCard}
        mode="outlined"
        onPress={() => router.push(`/(app)/party/${item.id}`)}
      >
        <Card.Content style={styles.cardContent}>
          <View style={{ flex: 1 }}>
            <Text variant="titleSmall" style={{ fontWeight: '600' }}>{item.name}</Text>
            <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
              {item.mobile} {item.city ? `• ${item.city}` : ''}
            </Text>
            <Chip
              compact
              style={[styles.typeChip, { backgroundColor: item.type === 'customer' ? '#E3F2FD' : item.type === 'supplier' ? '#FFF3E0' : '#F3E5F5' }]}
              textStyle={{ fontSize: 10 }}
            >
              {t(`party.${item.type}`)}
            </Chip>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text
              variant="titleSmall"
              style={{ fontWeight: 'bold', color: isDebit ? colors.debit : balance < 0 ? colors.credit : colors.neutral }}
            >
              {formatCurrency(Math.abs(balance))}
            </Text>
            <Text variant="labelSmall" style={{ color: isDebit ? colors.debit : colors.credit }}>
              {balance > 0 ? 'Dr' : balance < 0 ? 'Cr' : '—'}
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder={t('common.search')}
        value={search}
        onChangeText={setSearch}
        style={styles.searchbar}
      />

      {/* Type Filter Chips */}
      <View style={styles.filterRow}>
        {['all', 'customer', 'supplier', 'both'].map((type) => (
          <Chip
            key={type}
            selected={type === 'all' ? !typeFilter : typeFilter === type}
            onPress={() => setTypeFilter(type === 'all' ? null : type)}
            style={styles.filterChip}
            compact
          >
            {type === 'all' ? t('common.all') : t(`party.${type}`)}
          </Chip>
        ))}
      </View>

      <FlatList
        data={data}
        renderItem={renderParty}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshing={isLoading}
        onRefresh={refetch}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('common.noData')}</Text>
        }
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/(app)/party/create')}
        color={colors.onPrimary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchbar: { margin: spacing.base, elevation: 2 },
  filterRow: { flexDirection: 'row', paddingHorizontal: spacing.base, gap: spacing.sm, marginBottom: spacing.sm },
  filterChip: { borderRadius: 20 },
  list: { paddingHorizontal: spacing.base, paddingBottom: 80 },
  partyCard: { marginBottom: spacing.sm, borderRadius: 10 },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  typeChip: { marginTop: 4, alignSelf: 'flex-start' },
  emptyText: { textAlign: 'center', color: colors.textHint, marginTop: spacing.xxl },
  fab: {
    position: 'absolute', right: spacing.base, bottom: spacing.base,
    backgroundColor: colors.primary,
  },
});
