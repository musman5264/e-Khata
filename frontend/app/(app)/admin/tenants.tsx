import React from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { Text, Surface, ActivityIndicator, Searchbar, Chip } from 'react-native-paper';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

interface Tenant {
  id: number;
  name: string;
  slug: string;
  city: string | null;
  phone: string | null;
  is_active: boolean;
  users_count: number;
  created_at: string;
}

export default function AdminTenantsScreen() {
  const [search, setSearch] = React.useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-tenants'],
    queryFn: async () => {
      const res = await api.get('/admin/tenants');
      return res.data.data;
    },
  });

  const tenants: Tenant[] = data?.data || [];
  const filtered = tenants.filter(
    (t) => t.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderTenant = ({ item }: { item: Tenant }) => (
    <Surface style={styles.card}>
      <Text variant="titleSmall" style={{ fontWeight: '600' }}>{item.name}</Text>
      <Text variant="bodySmall" style={styles.secondary}>{item.slug}</Text>
      {item.city && <Text variant="bodySmall" style={styles.secondary}>📍 {item.city}</Text>}
      {item.phone && <Text variant="bodySmall" style={styles.secondary}>📞 {item.phone}</Text>}
      <View style={styles.chipRow}>
        <Chip compact style={styles.chip} textStyle={styles.chipText}>
          👥 {item.users_count} users
        </Chip>
        <Chip
          compact
          style={[styles.chip, { backgroundColor: item.is_active ? '#e8f5e9' : '#ffebee' }]}
          textStyle={[styles.chipText, { color: item.is_active ? '#2e7d32' : '#c62828' }]}
        >
          {item.is_active ? 'Active' : 'Inactive'}
        </Chip>
      </View>
      <Text variant="bodySmall" style={styles.secondary}>
        Created: {new Date(item.created_at).toLocaleDateString()}
      </Text>
    </Surface>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search businesses..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchbar}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTenant}
        contentContainerStyle={{ padding: spacing.base }}
        ListEmptyComponent={
          <Text style={styles.empty}>No businesses found</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchbar: { margin: spacing.base, marginBottom: 0 },
  card: {
    padding: spacing.base,
    borderRadius: 10,
    marginBottom: spacing.sm,
    elevation: 1,
  },
  secondary: { color: colors.textSecondary, marginTop: 2, fontSize: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 4 },
  chip: { height: 24 },
  chipText: { fontSize: 10 },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 40 },
});
