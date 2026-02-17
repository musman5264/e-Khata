import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ScrollView, Platform, useWindowDimensions, Alert } from 'react-native';
import { Text, Surface, ActivityIndicator, Searchbar, Chip, Portal, Modal, TextInput, Button, IconButton, Switch } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { colors, spacing } from '@/theme';
import { formatDate } from '@/utils/formatDate';

interface User {
  id: number;
  name: string;
  mobile: string;
  email: string | null;
  is_active: boolean;
  roles: { id: number; name: string }[];
  tenants: { id: number; name: string }[];
  created_at: string;
}

export default function AdminUsersScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { startImpersonation, user: currentUser } = useAuthStore();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web' && width > 768;
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'password' | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', mobile: '', is_active: true });
  const [passwordForm, setPasswordForm] = useState({ password: '', password_confirmation: '' });
  const [formErrors, setFormErrors] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await api.get('/admin/users');
      return res.data.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data: userData }: { id: number; data: any }) => {
      const res = await api.put(`/admin/users/${id}`, userData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setModalMode(null);
      setSelectedUser(null);
      setFormErrors('');
    },
    onError: (error: any) => {
      setFormErrors(error.response?.data?.message || 'Update failed');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await api.put(`/admin/users/${userId}/toggle-active`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: number) => {
      await api.delete(`/admin/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setModalMode(null);
      setSelectedUser(null);
    },
    onError: (error: any) => {
      setFormErrors(error.response?.data?.message || 'Delete failed');
    },
  });

  const users: User[] = data?.data || [];
  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.mobile.includes(search) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
  );

  const openView = (user: User) => { setSelectedUser(user); setModalMode('view'); setFormErrors(''); };
  const openEdit = (user: User) => {
    setSelectedUser(user);
    setEditForm({ name: user.name, email: user.email || '', mobile: user.mobile, is_active: user.is_active });
    setModalMode('edit');
    setFormErrors('');
  };
  const openPassword = (user: User) => {
    setSelectedUser(user);
    setPasswordForm({ password: '', password_confirmation: '' });
    setModalMode('password');
    setFormErrors('');
  };
  const closeModal = () => { setModalMode(null); setSelectedUser(null); setFormErrors(''); };

  const handleSaveEdit = () => {
    if (!selectedUser) return;
    updateMutation.mutate({ id: selectedUser.id, data: editForm });
  };

  const handleChangePassword = () => {
    if (!selectedUser) return;
    if (passwordForm.password.length < 8) { setFormErrors('Password must be at least 8 characters'); return; }
    if (passwordForm.password !== passwordForm.password_confirmation) { setFormErrors('Passwords do not match'); return; }
    updateMutation.mutate({ id: selectedUser.id, data: { password: passwordForm.password } });
  };

  const handleDelete = () => {
    if (!selectedUser) return;
    if (Platform.OS === 'web') {
      if (confirm(`Delete ${selectedUser.name}? This cannot be undone.`)) {
        deleteMutation.mutate(selectedUser.id);
      }
    }
  };

  const handleImpersonate = async (user: User) => {
    if (user.id === currentUser?.id) return;
    try {
      await startImpersonation(user.id);
      closeModal();
      router.replace('/(app)/(tabs)');
    } catch (error: any) {
      setFormErrors(error.response?.data?.message || 'Impersonation failed');
    }
  };

  const roleColor = (role: string) => {
    switch (role) {
      case 'Super Admin': return '#E84393';
      case 'Owner': return '#1A237E';
      case 'Manager': return '#00897B';
      case 'Accountant': return '#FF9800';
      case 'Viewer': return '#9E9E9E';
      default: return colors.textHint;
    }
  };

  const renderModal = () => {
    if (!selectedUser || !modalMode) return null;

    return (
      <Portal>
        <Modal visible onDismiss={closeModal} contentContainerStyle={[mS.container, isWeb && mS.webContainer]}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={mS.header}>
              <Text style={mS.headerTitle}>
                {modalMode === 'view' ? 'User Details' : modalMode === 'edit' ? 'Edit User' : 'Change Password'}
              </Text>
              <IconButton icon="close" size={20} onPress={closeModal} />
            </View>

            {formErrors ? (
              <View style={mS.errorBanner}><Text style={mS.errorText}>{formErrors}</Text></View>
            ) : null}

            {modalMode === 'view' && (
              <View style={mS.body}>
                <View style={mS.avatarRow}>
                  <View style={[mS.avatar, { backgroundColor: roleColor(selectedUser.roles[0]?.name || 'Viewer') }]}>
                    <Text style={mS.avatarText}>{selectedUser.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={mS.userName}>{selectedUser.name}</Text>
                    <Text style={mS.userMobile}>{selectedUser.mobile}</Text>
                  </View>
                  <Chip compact style={{ backgroundColor: selectedUser.is_active ? '#e8f5e9' : '#ffebee' }} textStyle={{ color: selectedUser.is_active ? '#2e7d32' : '#c62828', fontSize: 11 }}>
                    {selectedUser.is_active ? 'Active' : 'Inactive'}
                  </Chip>
                </View>
                <View style={mS.detailGrid}>
                  <DetailItem icon="email-outline" label="Email" value={selectedUser.email || '—'} />
                  <DetailItem icon="calendar" label="Joined" value={formatDate(selectedUser.created_at)} />
                  <DetailItem icon="shield-star" label="Roles" value={selectedUser.roles.map(r => r.name).join(', ') || '—'} />
                  <DetailItem icon="domain" label="Businesses" value={selectedUser.tenants.map(t => t.name).join(', ') || 'None'} />
                </View>
                <View style={mS.actionRow}>
                  <TouchableOpacity style={[mS.actionBtn, { backgroundColor: '#EBF5FB' }]} onPress={() => openEdit(selectedUser)}>
                    <MaterialCommunityIcons name="pencil" size={18} color="#2E86C1" />
                    <Text style={[mS.actionBtnText, { color: '#2E86C1' }]}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[mS.actionBtn, { backgroundColor: '#FEF9E7' }]} onPress={() => openPassword(selectedUser)}>
                    <MaterialCommunityIcons name="lock-reset" size={18} color="#D4AC0D" />
                    <Text style={[mS.actionBtnText, { color: '#D4AC0D' }]}>Password</Text>
                  </TouchableOpacity>
                  {selectedUser.id !== currentUser?.id && (
                    <TouchableOpacity style={[mS.actionBtn, { backgroundColor: '#F3E5F5' }]} onPress={() => handleImpersonate(selectedUser)}>
                      <MaterialCommunityIcons name="incognito" size={18} color="#8E24AA" />
                      <Text style={[mS.actionBtnText, { color: '#8E24AA' }]}>Login As</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={[mS.actionBtn, { backgroundColor: selectedUser.is_active ? '#ffebee' : '#e8f5e9' }]} onPress={() => { toggleMutation.mutate(selectedUser.id); closeModal(); }}>
                    <MaterialCommunityIcons name={selectedUser.is_active ? 'account-off' : 'account-check'} size={18} color={selectedUser.is_active ? '#c62828' : '#2e7d32'} />
                    <Text style={[mS.actionBtnText, { color: selectedUser.is_active ? '#c62828' : '#2e7d32' }]}>{selectedUser.is_active ? 'Disable' : 'Enable'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[mS.actionBtn, { backgroundColor: '#ffebee' }]} onPress={handleDelete}>
                    <MaterialCommunityIcons name="delete" size={18} color="#c62828" />
                    <Text style={[mS.actionBtnText, { color: '#c62828' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {modalMode === 'edit' && (
              <View style={mS.body}>
                <TextInput label="Name" value={editForm.name} onChangeText={(v) => setEditForm(p => ({ ...p, name: v }))} mode="outlined" style={mS.input} outlineStyle={mS.inputOutline} />
                <TextInput label="Email" value={editForm.email} onChangeText={(v) => setEditForm(p => ({ ...p, email: v }))} mode="outlined" style={mS.input} outlineStyle={mS.inputOutline} keyboardType="email-address" />
                <TextInput label="Mobile" value={editForm.mobile} onChangeText={(v) => setEditForm(p => ({ ...p, mobile: v }))} mode="outlined" style={mS.input} outlineStyle={mS.inputOutline} keyboardType="phone-pad" />
                <View style={mS.switchRow}>
                  <Text style={mS.switchLabel}>Active</Text>
                  <Switch value={editForm.is_active} onValueChange={(v) => setEditForm(p => ({ ...p, is_active: v }))} color={colors.primary} />
                </View>
                <View style={mS.btnRow}>
                  <Button mode="outlined" onPress={closeModal} style={{ flex: 1, borderRadius: 10 }}>Cancel</Button>
                  <Button mode="contained" onPress={handleSaveEdit} loading={updateMutation.isPending} style={{ flex: 1, borderRadius: 10 }} buttonColor={colors.primary}>Save</Button>
                </View>
              </View>
            )}

            {modalMode === 'password' && (
              <View style={mS.body}>
                <Text style={mS.passwordHint}>Set new password for {selectedUser.name}</Text>
                <TextInput label="New Password" value={passwordForm.password} onChangeText={(v) => setPasswordForm(p => ({ ...p, password: v }))} mode="outlined" secureTextEntry style={mS.input} outlineStyle={mS.inputOutline} />
                <TextInput label="Confirm Password" value={passwordForm.password_confirmation} onChangeText={(v) => setPasswordForm(p => ({ ...p, password_confirmation: v }))} mode="outlined" secureTextEntry style={mS.input} outlineStyle={mS.inputOutline} />
                <View style={mS.btnRow}>
                  <Button mode="outlined" onPress={closeModal} style={{ flex: 1, borderRadius: 10 }}>Cancel</Button>
                  <Button mode="contained" onPress={handleChangePassword} loading={updateMutation.isPending} disabled={!passwordForm.password} style={{ flex: 1, borderRadius: 10 }} buttonColor={colors.primary}>Change Password</Button>
                </View>
              </View>
            )}
          </ScrollView>
        </Modal>
      </Portal>
    );
  };

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity activeOpacity={0.7} onPress={() => openView(item)}>
      <Surface style={s.card}>
        <View style={s.cardRow}>
          <View style={[s.avatar, { backgroundColor: roleColor(item.roles[0]?.name || 'Viewer') }]}>
            <Text style={s.avatarText}>{item.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.userName}>{item.name}</Text>
            <Text style={s.userMobile}>{item.mobile}</Text>
            {item.email && <Text style={s.userEmail}>{item.email}</Text>}
            <View style={s.chipRow}>
              {item.roles.map((r) => (
                <Chip key={r.id || r.name} compact style={[s.chip, { backgroundColor: roleColor(r.name) + '18' }]} textStyle={[s.chipText, { color: roleColor(r.name) }]}>{r.name}</Chip>
              ))}
              <Chip compact style={[s.chip, { backgroundColor: item.is_active ? '#e8f5e9' : '#ffebee' }]} textStyle={[s.chipText, { color: item.is_active ? '#2e7d32' : '#c62828' }]}>{item.is_active ? 'Active' : 'Inactive'}</Chip>
            </View>
          </View>
          <View style={s.actionCol}>
            <TouchableOpacity style={s.iconBtn} onPress={() => openEdit(item)}><MaterialCommunityIcons name="pencil-outline" size={18} color={colors.primary} /></TouchableOpacity>
            <TouchableOpacity style={s.iconBtn} onPress={() => toggleMutation.mutate(item.id)}><MaterialCommunityIcons name={item.is_active ? 'account-off-outline' : 'account-check-outline'} size={18} color={item.is_active ? colors.error : '#2e7d32'} /></TouchableOpacity>
          </View>
        </View>
        {item.tenants.length > 0 && (
          <Text style={s.tenantText}>{item.tenants.map(t => t.name).join(', ')}</Text>
        )}
      </Surface>
    </TouchableOpacity>
  );

  if (isLoading) return <View style={s.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <View style={s.container}>
      <View style={[s.headerBar, isWeb && { paddingHorizontal: 24 }]}>
        <Text style={s.headerTitle}>Manage Users</Text>
        <Chip compact icon="account-group" style={{ backgroundColor: colors.primary + '15' }} textStyle={{ color: colors.primary, fontSize: 12 }}>{users.length} total</Chip>
      </View>
      <Searchbar placeholder="Search by name, mobile, email..." value={search} onChangeText={setSearch} style={[s.searchbar, isWeb && { marginHorizontal: 24, maxWidth: 480 }]} />

      {isWeb ? (
        <View style={s.webTableWrap}>
          <Surface style={s.webTable}>
            <View style={s.tableHeader}>
              <Text style={[s.th, { flex: 2 }]}>User</Text>
              <Text style={[s.th, { flex: 1.5 }]}>Contact</Text>
              <Text style={[s.th, { flex: 1 }]}>Role</Text>
              <Text style={[s.th, { flex: 1 }]}>Status</Text>
              <Text style={[s.th, { width: 120, textAlign: 'center' }]}>Actions</Text>
            </View>
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.tableRow} activeOpacity={0.6} onPress={() => openView(item)}>
                  <View style={[s.td, { flex: 2, flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
                    <View style={[s.avatar, { backgroundColor: roleColor(item.roles[0]?.name || 'Viewer'), width: 32, height: 32 }]}>
                      <Text style={[s.avatarText, { fontSize: 12 }]}>{item.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}</Text>
                    </View>
                    <Text style={{ fontWeight: '600', color: colors.text, fontSize: 13 }}>{item.name}</Text>
                  </View>
                  <View style={[s.td, { flex: 1.5 }]}>
                    <Text style={{ fontSize: 12, color: colors.text }}>{item.mobile}</Text>
                    {item.email && <Text style={{ fontSize: 11, color: '#8A8FA8' }}>{item.email}</Text>}
                  </View>
                  <View style={[s.td, { flex: 1 }]}>
                    {item.roles.map((r) => (
                      <Chip key={r.id || r.name} compact style={[s.chip, { backgroundColor: roleColor(r.name) + '18' }]} textStyle={[s.chipText, { color: roleColor(r.name) }]}>{r.name}</Chip>
                    ))}
                  </View>
                  <View style={[s.td, { flex: 1 }]}>
                    <Chip compact style={[s.chip, { backgroundColor: item.is_active ? '#e8f5e9' : '#ffebee' }]} textStyle={[s.chipText, { color: item.is_active ? '#2e7d32' : '#c62828' }]}>{item.is_active ? 'Active' : 'Inactive'}</Chip>
                  </View>
                  <View style={[s.td, { width: 120, flexDirection: 'row', justifyContent: 'center', gap: 4 }]}>
                    <TouchableOpacity style={s.tblBtn} onPress={() => openEdit(item)}><MaterialCommunityIcons name="pencil-outline" size={16} color={colors.primary} /></TouchableOpacity>
                    <TouchableOpacity style={s.tblBtn} onPress={() => openPassword(item)}><MaterialCommunityIcons name="lock-reset" size={16} color="#D4AC0D" /></TouchableOpacity>
                    <TouchableOpacity style={s.tblBtn} onPress={() => toggleMutation.mutate(item.id)}><MaterialCommunityIcons name={item.is_active ? 'account-off-outline' : 'account-check-outline'} size={16} color={item.is_active ? colors.error : '#2e7d32'} /></TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={s.empty}>No users found</Text>}
            />
          </Surface>
        </View>
      ) : (
        <FlatList data={filtered} keyExtractor={(item) => item.id.toString()} renderItem={renderUser} contentContainerStyle={{ padding: spacing.base }} ListEmptyComponent={<Text style={s.empty}>No users found</Text>} />
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
  avatar: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  userName: { fontSize: 15, fontWeight: '600', color: colors.text },
  userMobile: { fontSize: 12, color: '#8A8FA8', marginTop: 1 },
  userEmail: { fontSize: 11, color: '#8A8FA8' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, gap: 4 },
  chip: { height: 22 },
  chipText: { fontSize: 10 },
  actionCol: { gap: 4 },
  iconBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F5F6FA', alignItems: 'center', justifyContent: 'center' },
  tenantText: { fontSize: 11, color: '#8A8FA8', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#ECEEF5' },
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
  avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  userName: { fontSize: 18, fontWeight: '700', color: colors.text },
  userMobile: { fontSize: 13, color: '#8A8FA8', marginTop: 2 },
  detailGrid: { gap: 12, marginBottom: 20 },
  detailItem: { flexDirection: 'row', alignItems: 'flex-start' },
  detailLabel: { fontSize: 11, color: '#8A8FA8', fontWeight: '600', textTransform: 'uppercase' as const, letterSpacing: 0.3 },
  detailValue: { fontSize: 14, color: colors.text, fontWeight: '500', marginTop: 2 },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: { flex: 1, minWidth: 100, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12 },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
  input: { marginBottom: 12, backgroundColor: 'transparent' },
  inputOutline: { borderRadius: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 4, marginBottom: 12 },
  switchLabel: { fontSize: 15, fontWeight: '500', color: colors.text },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  passwordHint: { fontSize: 14, color: '#8A8FA8', marginBottom: 16 },
});
