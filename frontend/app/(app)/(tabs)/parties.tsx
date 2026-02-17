import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { Searchbar, Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import { formatCurrency } from '@/utils/formatCurrency';
import { usePermissions } from '@/hooks/usePermissions';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const TYPE_COLORS: Record<string, { bg: string; text: string; icon: IconName }> = {
  customer: { bg: '#EBF5FB', text: '#2E86C1', icon: 'account-outline' },
  supplier: { bg: '#FEF9E7', text: '#D4AC0D', icon: 'factory' },
  both: { bg: '#F5EEF8', text: '#8E44AD', icon: 'swap-horizontal' },
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
  const isWeb = Platform.OS === 'web' && width > 768;
  const { canManageParties } = usePermissions();

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

  const filterTypes = [
    { key: 'all', label: t('common.all'), icon: 'format-list-bulleted' as IconName },
    { key: 'customer', label: t('party.customer'), icon: 'account-outline' as IconName },
    { key: 'supplier', label: t('party.supplier'), icon: 'factory' as IconName },
    { key: 'both', label: t('party.both'), icon: 'swap-horizontal' as IconName },
  ];

  // ═══════════════════════════════════
  // WEB VIEW
  // ═══════════════════════════════════
  if (isWeb) {
    return (
      <View style={wStyles.container}>
        {/* Top bar */}
        <View style={wStyles.topBar}>
          <View>
            <Text style={wStyles.title}>Parties</Text>
            <Text style={wStyles.subtitle}>{data?.length ?? 0} total parties</Text>
          </View>
          {canManageParties && (
            <TouchableOpacity style={wStyles.addBtn} onPress={() => router.push('/(app)/party/create')}>
              <MaterialCommunityIcons name="plus" size={18} color="#fff" />
              <Text style={wStyles.addBtnText}>New Party</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Search + filters */}
        <View style={wStyles.toolbar}>
          <View style={wStyles.searchWrap}>
            <MaterialCommunityIcons name="magnify" size={20} color="#8A8FA8" />
            <Searchbar
              placeholder="Search parties..."
              value={search}
              onChangeText={setSearch}
              style={wStyles.search}
              inputStyle={wStyles.searchInput}
              elevation={0}
            />
          </View>
          <View style={wStyles.filterRow}>
            {filterTypes.map((f) => {
              const active = f.key === 'all' ? !typeFilter : typeFilter === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  onPress={() => setTypeFilter(f.key === 'all' ? null : f.key)}
                  style={[wStyles.filterChip, active && wStyles.filterChipActive]}
                >
                  <MaterialCommunityIcons name={f.icon} size={15} color={active ? '#fff' : '#6C7293'} />
                  <Text style={[wStyles.filterText, active && wStyles.filterTextActive]}>{f.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Table */}
        <Surface style={wStyles.table}>
          <View style={wStyles.tableHeader}>
            <Text style={[wStyles.th, { flex: 3 }]}>Party</Text>
            <Text style={[wStyles.th, { flex: 2 }]}>Contact</Text>
            <Text style={[wStyles.th, { flex: 1.5 }]}>City</Text>
            <Text style={[wStyles.th, { width: 90, textAlign: 'center' }]}>Type</Text>
            <Text style={[wStyles.th, { flex: 1.5, textAlign: 'right' }]}>Balance</Text>
            <Text style={[wStyles.th, { width: 70, textAlign: 'center' }]}>Status</Text>
          </View>
          <FlatList
            data={data}
            keyExtractor={(item) => item.id.toString()}
            refreshing={isLoading}
            onRefresh={refetch}
            renderItem={({ item }) => {
              const balance = item.current_balance ?? 0;
              const isDebit = balance > 0;
              const tc = TYPE_COLORS[item.type] || TYPE_COLORS.customer;
              return (
                <TouchableOpacity
                  onPress={() => router.push(`/(app)/party/${item.id}`)}
                  style={wStyles.tableRow}
                  activeOpacity={0.6}
                >
                  <View style={[wStyles.td, { flex: 3, flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
                    <View style={[wStyles.avatar, { backgroundColor: getAvatarColor(item.name) }]}>
                      <Text style={wStyles.avatarText}>{getInitials(item.name)}</Text>
                    </View>
                    <Text style={wStyles.partyName}>{item.name}</Text>
                  </View>
                  <Text style={[wStyles.td, wStyles.tdText, { flex: 2 }]}>{item.mobile || '—'}</Text>
                  <Text style={[wStyles.td, wStyles.tdText, { flex: 1.5 }]}>{item.city || '—'}</Text>
                  <View style={[wStyles.td, { width: 90, alignItems: 'center' }]}>
                    <View style={[wStyles.typeBadge, { backgroundColor: tc.bg }]}>
                      <Text style={[wStyles.typeText, { color: tc.text }]}>{t(`party.${item.type}`)}</Text>
                    </View>
                  </View>
                  <Text style={[wStyles.td, { flex: 1.5, textAlign: 'right', fontWeight: '700', color: isDebit ? colors.debit : balance < 0 ? colors.credit : '#6C7293' }]}>
                    {formatCurrency(Math.abs(balance))}
                  </Text>
                  <View style={[wStyles.td, { width: 70, alignItems: 'center' }]}>
                    <View style={[wStyles.statusBadge, { backgroundColor: isDebit ? '#FFF0F0' : balance < 0 ? '#F0FFF4' : '#F5F5F5' }]}>
                      <Text style={[wStyles.statusText, { color: isDebit ? colors.debit : balance < 0 ? colors.credit : '#999' }]}>
                        {balance > 0 ? 'NAAM' : balance < 0 ? 'JAMA' : '—'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={wStyles.empty}>
                <MaterialCommunityIcons name="account-group-outline" size={48} color="#D1D5DB" />
                <Text style={wStyles.emptyTitle}>No parties found</Text>
                <Text style={wStyles.emptyDesc}>Click "New Party" to add your first customer or supplier</Text>
              </View>
            }
          />
        </Surface>
      </View>
    );
  }

  // ═══════════════════════════════════
  // MOBILE VIEW
  // ═══════════════════════════════════
  return (
    <View style={mStyles.container}>
      {/* Search */}
      <View style={mStyles.searchWrap}>
        <Searchbar
          placeholder={`${t('common.search')} parties...`}
          value={search}
          onChangeText={setSearch}
          style={mStyles.searchbar}
          inputStyle={mStyles.searchInput}
          elevation={0}
        />
      </View>

      {/* Filters */}
      <View style={mStyles.filterRow}>
        {filterTypes.map((f) => {
          const active = f.key === 'all' ? !typeFilter : typeFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setTypeFilter(f.key === 'all' ? null : f.key)}
              style={[mStyles.filterChip, active && mStyles.filterChipActive]}
            >
              <MaterialCommunityIcons name={f.icon} size={14} color={active ? '#fff' : '#6C7293'} />
              <Text style={[mStyles.filterText, active && mStyles.filterTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={mStyles.list}
        refreshing={isLoading}
        onRefresh={refetch}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const balance = item.current_balance ?? 0;
          const isDebit = balance > 0;
          const tc = TYPE_COLORS[item.type] || TYPE_COLORS.customer;
          return (
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push(`/(app)/party/${item.id}`)}>
              <Surface style={mStyles.card}>
                <View style={mStyles.cardRow}>
                  <View style={[mStyles.avatar, { backgroundColor: getAvatarColor(item.name) }]}>
                    <Text style={mStyles.avatarText}>{getInitials(item.name)}</Text>
                  </View>
                  <View style={mStyles.info}>
                    <Text style={mStyles.name}>{item.name}</Text>
                    <View style={mStyles.metaRow}>
                      <Text style={mStyles.mobile}>{item.mobile || '—'}</Text>
                      {item.city ? <Text style={mStyles.sep}>•</Text> : null}
                      {item.city ? <Text style={mStyles.city}>{item.city}</Text> : null}
                    </View>
                    <View style={[mStyles.typeBadge, { backgroundColor: tc.bg }]}>
                      <Text style={[mStyles.typeText, { color: tc.text }]}>{t(`party.${item.type}`)}</Text>
                    </View>
                  </View>
                  <View style={mStyles.balCol}>
                    <Text style={[mStyles.balAmt, { color: isDebit ? colors.debit : balance < 0 ? colors.credit : '#999' }]}>
                      {formatCurrency(Math.abs(balance))}
                    </Text>
                    <View style={[mStyles.balBadge, { backgroundColor: isDebit ? '#FFF0F0' : balance < 0 ? '#F0FFF4' : '#F5F5F5' }]}>
                      <Text style={[mStyles.balText, { color: isDebit ? colors.debit : balance < 0 ? colors.credit : '#999' }]}>
                        {balance > 0 ? 'NAAM' : balance < 0 ? 'JAMA' : '—'}
                      </Text>
                    </View>
                  </View>
                </View>
              </Surface>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={mStyles.empty}>
            <MaterialCommunityIcons name="account-group-outline" size={48} color="#D1D5DB" />
            <Text style={mStyles.emptyTitle}>No parties yet</Text>
            <Text style={mStyles.emptyDesc}>Tap + to add your first customer or supplier</Text>
          </View>
        }
      />

      {/* FAB */}
      {canManageParties && (
        <TouchableOpacity
          style={mStyles.fab}
          activeOpacity={0.85}
          onPress={() => router.push('/(app)/party/create')}
        >
          <MaterialCommunityIcons name="plus" size={26} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ═══ WEB STYLES ═══ */
const wStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA', padding: 32 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', color: colors.text },
  subtitle: { fontSize: 13, color: '#8A8FA8', marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  toolbar: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 16 },
  searchWrap: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  search: { flex: 1, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ECEEF5', height: 42 },
  searchInput: { fontSize: 13 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ECEEF5' },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 12, color: '#6C7293', fontWeight: '500' },
  filterTextActive: { color: '#fff' },

  table: { flex: 1, borderRadius: 14, overflow: 'hidden', elevation: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ECEEF5' },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#F8F9FC', borderBottomWidth: 1, borderBottomColor: '#ECEEF5', alignItems: 'center' },
  th: { fontSize: 11, fontWeight: '700', color: '#8A8FA8', letterSpacing: 0.5, textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', alignItems: 'center' },
  td: { fontSize: 13 },
  tdText: { color: '#6C7293' },
  avatar: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  partyName: { fontSize: 14, fontWeight: '600', color: colors.text },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 },
  typeText: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.3 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },

  empty: { paddingVertical: 60, alignItems: 'center', gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  emptyDesc: { fontSize: 13, color: '#8A8FA8' },
});

/* ═══ MOBILE STYLES ═══ */
const mStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  searchWrap: { padding: spacing.base, paddingBottom: 0 },
  searchbar: { borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider },
  searchInput: { fontSize: 14 },
  filterRow: { flexDirection: 'row', paddingHorizontal: spacing.base, paddingVertical: 12, gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.divider },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 12, color: '#6C7293', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  list: { paddingHorizontal: spacing.base, paddingBottom: 80 },

  card: { marginBottom: 10, borderRadius: 16, padding: 14, elevation: 1, backgroundColor: colors.surface },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 15, fontWeight: '600', color: colors.text },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  mobile: { fontSize: 12, color: '#8A8FA8' },
  sep: { fontSize: 12, color: '#B0B5C8', marginHorizontal: 4 },
  city: { fontSize: 12, color: '#8A8FA8' },
  typeBadge: { marginTop: 4, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  typeText: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.3 },
  balCol: { alignItems: 'flex-end', marginLeft: 8 },
  balAmt: { fontSize: 15, fontWeight: '700' },
  balBadge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  balText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  emptyDesc: { fontSize: 13, color: '#8A8FA8' },

  fab: {
    position: 'absolute', right: 20, bottom: 24,
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    elevation: 6, shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
});
