import React from 'react';
import { View, StyleSheet, FlatList, Alert } from 'react-native';
import { Text, Surface, ActivityIndicator, IconButton, Chip, Searchbar } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

interface User {
  id: number;
  name: string;
  mobile: string;
  email: string | null;
  is_active: boolean;
  roles: { name: string }[];
  tenants: { name: string }[];
  created_at: string;
}

export default function AdminUsersScreen() {
  const queryClient = useQueryClient();
  const [search, setSearch] = React.useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get('/admin/users');
      return res.data.data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await api.put(`/admin/users/${userId}/toggle-active`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      Alert.alert('Success', data.message);
    },
  });

  const users: User[] = data?.data || [];
  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.mobile.includes(search)
  );

  const renderUser = ({ item }: { item: User }) => (
    <Surface style={styles.card}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text variant="titleSmall" style={{ fontWeight: '600' }}>{item.name}</Text>
          <Text variant="bodySmall" style={styles.secondary}>{item.mobile}</Text>
          {item.email && <Text variant="bodySmall" style={styles.secondary}>{item.email}</Text>}
          <View style={styles.chipRow}>
            {item.roles.map((r) => (
              <Chip key={r.name} compact style={styles.chip} textStyle={styles.chipText}>
                {r.name}
              </Chip>
            ))}
            <Chip
              compact
              style={[styles.chip, { backgroundColor: item.is_active ? '#e8f5e9' : '#ffebee' }]}
              textStyle={[styles.chipText, { color: item.is_active ? '#2e7d32' : '#c62828' }]}
            >
              {item.is_active ? 'Active' : 'Inactive'}
            </Chip>
          </View>
          {item.tenants.length > 0 && (
            <Text variant="bodySmall" style={styles.secondary}>
              Businesses: {item.tenants.map((t) => t.name).join(', ')}
            </Text>
          )}
        </View>
        <IconButton
          icon={item.is_active ? 'account-off' : 'account-check'}
          iconColor={item.is_active ? colors.error : colors.success}
          onPress={() => {
            Alert.alert(
              'Confirm',
              `${item.is_active ? 'Deactivate' : 'Activate'} ${item.name}?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Yes', onPress: () => toggleMutation.mutate(item.id) },
              ]
            );
          }}
        />
      </View>
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
        placeholder="Search users..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchbar}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderUser}
        contentContainerStyle={{ padding: spacing.base }}
        ListEmptyComponent={
          <Text style={styles.empty}>No users found</Text>
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
  row: { flexDirection: 'row', alignItems: 'center' },
  secondary: { color: colors.textSecondary, marginTop: 2, fontSize: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 4 },
  chip: { height: 24 },
  chipText: { fontSize: 10 },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 40 },
});
