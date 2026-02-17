import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { Searchbar, FAB, Text, Chip, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import WebContainer from '@/components/WebContainer';

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  customer: { bg: '#EBF5FB', text: '#2E86C1' },
  supplier: { bg: '#FEF9E7', text: '#D4AC0D' },
  both: { bg: '#F5EEF8', text: '#8E44AD' },
};

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string) {
  const palette = ['#3D5AF1', '#00B894', '#E17055', '#A29BFE', '#FDCB6E', '#E84393', '#00CEC9', '#6C5CE7'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export default function PartiesScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width > 600;

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
    const tc = TYPE_COLORS[item.type] || TYPE_COLORS.customer;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push(`/(app)/party/${item.id}`)}
      >
        <Surface style={styles.partyCard}>
          <View style={styles.cardContent}>
            {/* Avatar */}
            <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.name) }]}>
              <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
            </View>

            {/* Info */}
            <View style={styles.partyInfo}>
              <Text style={styles.partyName}>{item.name}</Text>
              <View style={styles.partyMeta}>
                <Text style={styles.partyMobile}>{item.mobile || '—'}</Text>
                {item.city ? <Text style={styles.partySep}>•</Text> : null}
                {item.city ? <Text style={styles.partyCity}>{item.city}</Text> : null}
              </View>
              <View style={[styles.typeBadge, { backgroundColor: tc.bg }]}>
                <Text style={[styles.typeText, { color: tc.text }]}>
                  {t(`party.${item.type}`)}
                </Text>
              </View>
            </View>

            {/* Balance */}
            <View style={styles.balanceCol}>
              <Text style={[styles.balanceAmt, { color: isDebit ? colors.debit : balance < 0 ? colors.credit : colors.neutral }]}>
                {formatCurrency(Math.abs(balance))}
              </Text>
              <View style={[styles.balanceBadge, { backgroundColor: isDebit ? '#FFEBEE' : balance < 0 ? '#E8F5E9' : '#F5F5F5' }]}>
                <Text style={[styles.balanceBadgeText, { color: isDebit ? colors.debit : balance < 0 ? colors.credit : colors.neutral }]}>
                  {balance > 0 ? 'NAAM' : balance < 0 ? 'JAMA' : '—'}
                </Text>
              </View>
            </View>
          </View>
        </Surface>
      </TouchableOpacity>
    );
  };

  const filterTypes = [
    { key: 'all', label: t('common.all'), icon: '📋' },
    { key: 'customer', label: t('party.customer'), icon: '👤' },
    { key: 'supplier', label: t('party.supplier'), icon: '🏭' },
    { key: 'both', label: t('party.both'), icon: '🔄' },
  ];

  return (
    <WebContainer>
      <View style={styles.container}>
        {/* Search bar */}
        <View style={styles.searchWrap}>
          <Searchbar
            placeholder={`${t('common.search')} parties...`}
            value={search}
            onChangeText={setSearch}
            style={styles.searchbar}
            inputStyle={styles.searchInput}
            elevation={0}
          />
        </View>

        {/* Filter chips */}
        <View style={styles.filterRow}>
          {filterTypes.map((f) => {
            const active = f.key === 'all' ? !typeFilter : typeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setTypeFilter(f.key === 'all' ? null : f.key)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={{ fontSize: 14 }}>{f.icon}</Text>
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <FlatList
          data={data}
          renderItem={renderParty}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
          refreshing={isLoading}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 48 }}>🤝</Text>
              <Text style={styles.emptyTitle}>No parties yet</Text>
              <Text style={styles.emptyDesc}>Tap + to add your first customer or supplier</Text>
            </View>
          }
        />

        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => router.push('/(app)/party/create')}
          color={colors.onPrimary}
          label={isWide ? 'Add Party' : ''}
        />
      </View>
    </WebContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Search
  searchWrap: { padding: spacing.base, paddingBottom: 0 },
  searchbar: {
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  searchInput: { fontSize: 14 },

  // Filters
  filterRow: { flexDirection: 'row', paddingHorizontal: spacing.base, paddingVertical: 12, gap: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  filterTextActive: { color: '#fff' },

  // List
  list: { paddingHorizontal: spacing.base, paddingBottom: 80 },

  // Party card
  partyCard: {
    marginBottom: 10,
    borderRadius: 16,
    padding: 14,
    elevation: 1,
    backgroundColor: colors.surface,
  },
  cardContent: { flexDirection: 'row', alignItems: 'center' },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  partyInfo: { flex: 1, marginLeft: 12 },
  partyName: { fontSize: 15, fontWeight: '600', color: colors.text },
  partyMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  partyMobile: { fontSize: 12, color: colors.textSecondary },
  partySep: { fontSize: 12, color: colors.textHint, marginHorizontal: 4 },
  partyCity: { fontSize: 12, color: colors.textSecondary },
  typeBadge: { marginTop: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  typeText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },

  balanceCol: { alignItems: 'flex-end', marginLeft: 8 },
  balanceAmt: { fontSize: 15, fontWeight: '700' },
  balanceBadge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  balanceBadgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginTop: 12 },
  emptyDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: colors.primary,
    borderRadius: 16,
    elevation: 4,
  },
});
