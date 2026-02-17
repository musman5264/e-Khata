import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ScrollView, Platform, useWindowDimensions } from 'react-native';
import { Text, Surface, ActivityIndicator, Searchbar, Chip, Portal, Modal, TextInput, Button, IconButton, Switch } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

interface Tenant {
  id: number;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  users_count: number;
  users?: { id: number; name: string; mobile: string; role?: string }[];
  created_at: string;
}

export default function AdminTenantsScreen() {
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web' && width > 768;
  const [search, setSearch] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | null>(null);
  const [editForm, setEditForm] = useState({ name: '', address: '', city: '', phone: '', email: '', is_active: true });
  const [formErrors, setFormErrors] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-tenants'],
    queryFn: async () => {
      const res = await api.get('/admin/tenants');
      return res.data.data;
    },
  });

  const detailQuery = useQuery({
    queryKey: ['admin-tenant-detail', selectedTenant?.id],
    queryFn: async () => {
      if (!selectedTenant) return null;
      const res = await api.get(`/admin/tenants/${selectedTenant.id}`);
      return res.data.data;
    },
    enabled: !!selectedTenant && modalMode === 'view',
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data: tenantData }: { id: number; data: any }) => {
      const res = await api.put(`/admin/tenants/${id}`, tenantData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
      setModalMode(null);
      setSelectedTenant(null);
      setFormErrors('');
    },
    onError: (error: any) => {
      setFormErrors(error.response?.data?.message || 'Update failed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (tenantId: number) => {
      await api.delete(`/admin/tenants/${tenantId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
      setModalMode(null);
      setSelectedTenant(null);
    },
    onError: (error: any) => {
      setFormErrors(error.response?.data?.message || 'Delete failed');
    },
  });

  const tenants: Tenant[] = data?.data || [];
  const filtered = tenants.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()) || (t.city && t.city.toLowerCase().includes(search.toLowerCase())));

  const openView = (tenant: Tenant) => { setSelectedTenant(tenant); setModalMode('view'); setFormErrors(''); };
  const openEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setEditForm({ name: tenant.name, address: tenant.address || '', city: tenant.city || '', phone: tenant.phone || '', email: tenant.email || '', is_active: tenant.is_active });
    setModalMode('edit');
    setFormErrors('');
  };
  const closeModal = () => { setModalMode(null); setSelectedTenant(null); setFormErrors(''); };

  const handleSave = () => {
    if (!selectedTenant) return;
    updateMutation.mutate({ id: selectedTenant.id, data: editForm });
  };

  const handleDelete = (tenant?: Tenant) => {
    const target = tenant || selectedTenant;
    if (!target) return;
    if (Platform.OS === 'web') {
      if (confirm(`Deactivate "${target.name}"? This will disable the business.`)) {
        deleteMutation.mutate(target.id);
      }
    }
  };

  const renderModal = () => {
    if (!selectedTenant || !modalMode) return null;
    const detail = detailQuery.data;

    return (
      <Portal>
        <Modal visible onDismiss={closeModal} contentContainerStyle={[mS.container, isWeb && mS.webContainer]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={mS.header}>
              <Text style={mS.headerTitle}>{modalMode === 'view' ? 'Business Details' : 'Edit Business'}</Text>
              <IconButton icon="close" size={20} onPress={closeModal} />
            </View>

            {formErrors ? (
              <View style={mS.errorBanner}><Text style={mS.errorText}>{formErrors}</Text></View>
            ) : null}

            {modalMode === 'view' && (
              <View style={mS.body}>
                <View style={mS.titleRow}>
                  <View style={mS.bizIcon}>
                    <MaterialCommunityIcons name="domain" size={28} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={mS.bizName}>{selectedTenant.name}</Text>
                    <Text style={mS.bizSlug}>{selectedTenant.slug}</Text>
                  </View>
                  <Chip compact style={{ backgroundColor: selectedTenant.is_active ? '#e8f5e9' : '#ffebee' }} textStyle={{ color: selectedTenant.is_active ? '#2e7d32' : '#c62828', fontSize: 11 }}>
                    {selectedTenant.is_active ? 'Active' : 'Inactive'}
                  </Chip>
                </View>

                <View style={mS.detailGrid}>
                  <DetailItem icon="map-marker" label="City" value={selectedTenant.city || '—'} />
                  <DetailItem icon="map" label="Address" value={selectedTenant.address || '—'} />
                  <DetailItem icon="phone" label="Phone" value={selectedTenant.phone || '—'} />
                  <DetailItem icon="email-outline" label="Email" value={selectedTenant.email || '—'} />
                  <DetailItem icon="account-group" label="Users" value={`${selectedTenant.users_count} member(s)`} />
                  <DetailItem icon="calendar" label="Created" value={new Date(selectedTenant.created_at).toLocaleDateString()} />
                </View>

                {detail?.users && detail.users.length > 0 && (
                  <View style={mS.usersSection}>
                    <Text style={mS.usersSectionTitle}>Team Members</Text>
                    {detail.users.map((u: any) => (
                      <View key={u.id} style={mS.userItem}>
                        <View style={mS.userAvatar}>
                          <Text style={mS.userAvatarText}>{u.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)}</Text>
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={mS.userItemName}>{u.name}</Text>
                          <Text style={mS.userItemMobile}>{u.mobile}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                <View style={mS.actionRow}>
                  <TouchableOpacity style={[mS.actionBtn, { backgroundColor: '#EBF5FB' }]} onPress={() => openEdit(selectedTenant)}>
                    <MaterialCommunityIcons name="pencil" size={18} color="#2E86C1" />
                    <Text style={[mS.actionBtnText, { color: '#2E86C1' }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[mS.actionBtn, { backgroundColor: '#ffebee' }]} onPress={() => handleDelete()}>
                    <MaterialCommunityIcons name="delete" size={18} color="#c62828" />
                    <Text style={[mS.actionBtnText, { color: '#c62828' }]}>Deactivate</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {modalMode === 'edit' && (
              <View style={mS.body}>
                <TextInput label="Business Name" value={editForm.name} onChangeText={(v) => setEditForm(p => ({ ...p, name: v }))} mode="outlined" style={mS.input} outlineStyle={mS.inputOutline} />
                <TextInput label="Email" value={editForm.email} onChangeText={(v) => setEditForm(p => ({ ...p, email: v }))} mode="outlined" style={mS.input} outlineStyle={mS.inputOutline} keyboardType="email-address" />
                <TextInput label="Phone" value={editForm.phone} onChangeText={(v) => setEditForm(p => ({ ...p, phone: v }))} mode="outlined" style={mS.input} outlineStyle={mS.inputOutline} keyboardType="phone-pad" />
                <TextInput label="City" value={editForm.city} onChangeText={(v) => setEditForm(p => ({ ...p, city: v }))} mode="outlined" style={mS.input} outlineStyle={mS.inputOutline} />
                <TextInput label="Address" value={editForm.address} onChangeText={(v) => setEditForm(p => ({ ...p, address: v }))} mode="outlined" style={mS.input} outlineStyle={mS.inputOutline} multiline numberOfLines={2} />
                <View style={mS.switchRow}>
                  <Text style={mS.switchLabel}>Active</Text>
                  <Switch value={editForm.is_active} onValueChange={(v) => setEditForm(p => ({ ...p, is_active: v }))} color={colors.primary} />
                </View>
                <View style={mS.btnRow}>
                  <Button mode="outlined" onPress={closeModal} style={{ flex: 1, borderRadius: 10 }}>Cancel</Button>
                  <Button mode="contained" onPress={handleSave} loading={updateMutation.isPending} style={{ flex: 1, borderRadius: 10 }} buttonColor={colors.primary}>Save</Button>
                </View>
              </View>
            )}
          </ScrollView>
        </Modal>
      </Portal>
    );
  };

  const renderTenant = ({ item }: { item: Tenant }) => (
    <TouchableOpacity activeOpacity={0.7} onPress={() => openView(item)}>
      <Surface style={s.card}>
        <View style={s.cardRow}>
          <View style={s.bizIconSmall}>
            <MaterialCommunityIcons name="domain" size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.bizName}>{item.name}</Text>
            <Text style={s.bizSlug}>{item.slug}</Text>
            <View style={s.metaRow}>
              {item.city && <Text style={s.metaText}>📍 {item.city}</Text>}
              {item.phone && <Text style={s.metaText}>📞 {item.phone}</Text>}
            </View>
            <View style={s.chipRow}>
              <Chip compact style={s.chip} textStyle={s.chipText}>👥 {item.users_count} users</Chip>
              <Chip compact style={[s.chip, { backgroundColor: item.is_active ? '#e8f5e9' : '#ffebee' }]} textStyle={[s.chipText, { color: item.is_active ? '#2e7d32' : '#c62828' }]}>{item.is_active ? 'Active' : 'Inactive'}</Chip>
            </View>
          </View>
          <View style={s.actionCol}>
            <TouchableOpacity style={s.iconBtn} onPress={() => openEdit(item)}><MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} /></TouchableOpacity>
          </View>
        </View>
      </Surface>
    </TouchableOpacity>
  );

  if (isLoading) return <View style={s.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <View style={s.container}>
      <View style={[s.headerBar, isWeb && { paddingHorizontal: 24 }]}>
        <Text style={s.headerTitle}>Manage Businesses</Text>
        <Chip compact icon="domain" style={{ backgroundColor: colors.primary + '15' }} textStyle={{ color: colors.primary, fontSize: 12 }}>{tenants.length} total</Chip>
      </View>
      <Searchbar placeholder="Search by name or city..." value={search} onChangeText={setSearch} style={[s.searchbar, isWeb && { marginHorizontal: 24, maxWidth: 480 }]} />

      {isWeb ? (
        <View style={s.webTableWrap}>
          <Surface style={s.webTable}>
            <View style={s.tableHeader}>
              <Text style={[s.th, { flex: 2 }]}>Business</Text>
              <Text style={[s.th, { flex: 1.5 }]}>Contact</Text>
              <Text style={[s.th, { flex: 1 }]}>Users</Text>
              <Text style={[s.th, { flex: 1 }]}>Status</Text>
              <Text style={[s.th, { width: 80, textAlign: 'center' }]}>Actions</Text>
            </View>
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.tableRow} activeOpacity={0.6} onPress={() => openView(item)}>
                  <View style={[s.td, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
                    <View style={[s.bizIconSmall, { width: 32, height: 32 }]}>
                      <MaterialCommunityIcons name="domain" size={16} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={{ fontWeight: '600', color: colors.text, fontSize: 13 }}>{item.name}</Text>
                      <Text style={{ fontSize: 11, color: '#8A8FA8' }}>{item.slug}</Text>
                    </View>
                  </View>
                  <View style={[s.td, { flex: 1.5 }]}>
                    {item.phone && <Text style={{ fontSize: 12, color: colors.text }}>{item.phone}</Text>}
                    {item.city && <Text style={{ fontSize: 11, color: '#8A8FA8' }}>{item.city}</Text>}
                  </View>
                  <View style={[s.td, { flex: 1 }]}>
                    <Chip compact style={s.chip} textStyle={s.chipText}>👥 {item.users_count}</Chip>
                  </View>
                  <View style={[s.td, { flex: 1 }]}>
                    <Chip compact style={[s.chip, { backgroundColor: item.is_active ? '#e8f5e9' : '#ffebee' }]} textStyle={[s.chipText, { color: item.is_active ? '#2e7d32' : '#c62828' }]}>{item.is_active ? 'Active' : 'Inactive'}</Chip>
                  </View>
                  <View style={[s.td, { width: 80, flexDirection: 'row', justifyContent: 'center', gap: 4 }]}>
                    <TouchableOpacity style={s.tblBtn} onPress={() => openEdit(item)}><MaterialCommunityIcons name="pencil-outline" size={16} color={colors.primary} /></TouchableOpacity>
                    <TouchableOpacity style={s.tblBtn} onPress={() => handleDelete(item)}><MaterialCommunityIcons name="delete-outline" size={16} color="#c62828" /></TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={s.empty}>No businesses found</Text>}
            />
          </Surface>
        </View>
      ) : (
        <FlatList data={filtered} keyExtractor={(item) => item.id.toString()} renderItem={renderTenant} contentContainerStyle={{ padding: spacing.base }} ListEmptyComponent={<Text style={s.empty}>No businesses found</Text>} />
      )}
      {renderModal()}
    </View>
  );
}

function DetailItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={mS.detailItem}>
      <MaterialCommunityIcons name={icon as any} size={16} color="#8A8FA8" />
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={mS.detailLabel}>{label}</Text>
        <Text style={mS.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: 14 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  searchbar: { marginHorizontal: spacing.base, marginBottom: 12, borderRadius: 12, elevation: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ECEEF5' },
  card: { padding: 14, borderRadius: 14, marginBottom: 10, marginHorizontal: spacing.base, elevation: 1, backgroundColor: '#fff' },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  bizIconSmall: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  bizName: { fontSize: 15, fontWeight: '600', color: colors.text },
  bizSlug: { fontSize: 11, color: '#8A8FA8', marginTop: 1 },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 2 },
  metaText: { fontSize: 11, color: '#8A8FA8' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 4 },
  chip: { height: 22 },
  chipText: { fontSize: 10 },
  actionCol: { gap: 4 },
  iconBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F5F6FA', alignItems: 'center', justifyContent: 'center' },
  webTableWrap: { flex: 1, paddingHorizontal: 24 },
  webTable: { flex: 1, borderRadius: 14, elevation: 0, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ECEEF5', overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#F8F9FC', borderBottomWidth: 1, borderBottomColor: '#ECEEF5' },
  th: { fontSize: 11, fontWeight: '700', color: '#8A8FA8', textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F6FA', alignItems: 'center' },
  td: { justifyContent: 'center' as const },
  tblBtn: { width: 30, height: 30, borderRadius: 8, backgroundColor: '#F5F6FA', alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', color: colors.textSecondary, marginTop: 40, fontSize: 14 },
});

const mS = StyleSheet.create({
  container: { backgroundColor: '#fff', margin: 20, borderRadius: 20, maxHeight: '80%' as any, padding: 0 },
  webContainer: { maxWidth: 500, alignSelf: 'center' as const, width: '90%' as any },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#ECEEF5' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  body: { padding: 20 },
  errorBanner: { backgroundColor: '#FFF0F0', marginHorizontal: 20, marginTop: 12, padding: 12, borderRadius: 10, borderLeftWidth: 3, borderLeftColor: colors.error },
  errorText: { color: colors.error, fontSize: 13 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  bizIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' },
  bizName: { fontSize: 18, fontWeight: '700', color: colors.text },
  bizSlug: { fontSize: 13, color: '#8A8FA8', marginTop: 2 },
  detailGrid: { gap: 12, marginBottom: 20 },
  detailItem: { flexDirection: 'row', alignItems: 'flex-start' },
  detailLabel: { fontSize: 11, color: '#8A8FA8', fontWeight: '600', textTransform: 'uppercase' as const, letterSpacing: 0.3 },
  detailValue: { fontSize: 14, color: colors.text, fontWeight: '500', marginTop: 2 },
  usersSection: { marginBottom: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#ECEEF5' },
  usersSectionTitle: { fontSize: 12, fontWeight: '700', color: '#8A8FA8', textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 10 },
  userItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  userAvatar: { width: 32, height: 32, borderRadius: 8, backgroundColor: colors.primary + '20', alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { fontSize: 11, fontWeight: '700', color: colors.primary },
  userItemName: { fontSize: 13, fontWeight: '600', color: colors.text },
  userItemMobile: { fontSize: 11, color: '#8A8FA8' },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: { flex: 1, minWidth: 120, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
  input: { marginBottom: 12, backgroundColor: 'transparent' },
  inputOutline: { borderRadius: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 4, marginBottom: 12 },
  switchLabel: { fontSize: 15, fontWeight: '500', color: colors.text },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
});
