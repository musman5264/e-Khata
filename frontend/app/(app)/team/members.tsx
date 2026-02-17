import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { Text, Card, Button, Chip, IconButton, Portal, Modal, RadioButton, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { colors, spacing } from '@/theme';

interface Member {
  id: number;
  name: string;
  mobile: string;
  email: string | null;
  role: string;
  joined_at: string;
}

const ROLES = ['Owner', 'Manager', 'Accountant', 'Viewer'];
const ROLE_COLORS: Record<string, string> = {
  Owner: '#1A237E',
  Manager: '#00897B',
  Accountant: '#FF9800',
  Viewer: '#9E9E9E',
};
const ROLE_DESCRIPTIONS: Record<string, string> = {
  Owner: 'Full access — manage team, parties, transactions, settings',
  Manager: 'Manage parties, transactions, and view reports',
  Accountant: 'Create and edit transactions, view parties',
  Viewer: 'View only — no create/edit/delete access',
};

export default function TeamMembersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web' && width > 768;
  const currentUser = useAuthStore((s) => s.user);

  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [modalMode, setModalMode] = useState<'role' | 'remove' | null>(null);
  const [newRole, setNewRole] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['team-members'],
    queryFn: async () => {
      const res = await api.get('/team/members');
      return res.data.data;
    },
  });

  const roleChangeMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const res = await api.put(`/team/members/${userId}/role`, { role });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      closeModal();
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: number) => api.delete(`/team/members/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      closeModal();
    },
  });

  const members: Member[] = data || [];

  const openRoleChange = (member: Member) => {
    setSelectedMember(member);
    setNewRole(member.role);
    setModalMode('role');
  };

  const openRemove = (member: Member) => {
    setSelectedMember(member);
    setModalMode('remove');
  };

  const closeModal = () => {
    setSelectedMember(null);
    setModalMode(null);
    setNewRole('');
  };

  const handleRoleChange = () => {
    if (!selectedMember || !newRole) return;
    roleChangeMutation.mutate({ userId: selectedMember.id, role: newRole });
  };

  const handleRemove = () => {
    if (!selectedMember) return;
    removeMutation.mutate(selectedMember.id);
  };

  const renderModal = () => {
    if (!selectedMember || !modalMode) return null;

    return (
      <Portal>
        <Modal visible onDismiss={closeModal} contentContainerStyle={[mS.container, isWeb && mS.webContainer]}>
          {modalMode === 'role' && (
            <View>
              <View style={mS.header}>
                <Text style={mS.headerTitle}>Change Role</Text>
                <IconButton icon="close" size={20} onPress={closeModal} />
              </View>
              <View style={mS.body}>
                <View style={mS.memberInfo}>
                  <View style={[mS.avatar, { backgroundColor: ROLE_COLORS[selectedMember.role] || '#9E9E9E' }]}>
                    <Text style={mS.avatarText}>{selectedMember.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}</Text>
                  </View>
                  <View style={{ marginLeft: 12 }}>
                    <Text style={mS.memberName}>{selectedMember.name}</Text>
                    <Text style={mS.memberMobile}>{selectedMember.mobile}</Text>
                  </View>
                </View>

                <Text style={mS.sectionLabel}>SELECT ROLE</Text>
                <RadioButton.Group onValueChange={setNewRole} value={newRole}>
                  {ROLES.map((role) => (
                    <TouchableOpacity
                      key={role}
                      style={[mS.roleOption, newRole === role && { borderColor: ROLE_COLORS[role], backgroundColor: ROLE_COLORS[role] + '08' }]}
                      onPress={() => setNewRole(role)}
                      activeOpacity={0.7}
                    >
                      <View style={mS.roleOptionLeft}>
                        <RadioButton.Android value={role} color={ROLE_COLORS[role]} />
                        <View>
                          <Text style={[mS.roleName, { color: ROLE_COLORS[role] }]}>{role}</Text>
                          <Text style={mS.roleDesc}>{ROLE_DESCRIPTIONS[role]}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </RadioButton.Group>

                <View style={mS.btnRow}>
                  <Button mode="outlined" onPress={closeModal} style={{ flex: 1, borderRadius: 10 }}>Cancel</Button>
                  <Button
                    mode="contained"
                    onPress={handleRoleChange}
                    loading={roleChangeMutation.isPending}
                    disabled={newRole === selectedMember.role}
                    style={{ flex: 1, borderRadius: 10 }}
                    buttonColor={colors.primary}
                  >
                    Update Role
                  </Button>
                </View>
              </View>
            </View>
          )}

          {modalMode === 'remove' && (
            <View>
              <View style={mS.header}>
                <Text style={mS.headerTitle}>Remove Member</Text>
                <IconButton icon="close" size={20} onPress={closeModal} />
              </View>
              <View style={mS.body}>
                <View style={mS.warningBox}>
                  <MaterialCommunityIcons name="alert-circle" size={40} color="#c62828" />
                  <Text style={mS.warningTitle}>Remove {selectedMember.name}?</Text>
                  <Text style={mS.warningText}>This member will lose access to this business. Their past transactions will remain.</Text>
                </View>
                <View style={mS.btnRow}>
                  <Button mode="outlined" onPress={closeModal} style={{ flex: 1, borderRadius: 10 }}>Cancel</Button>
                  <Button mode="contained" onPress={handleRemove} loading={removeMutation.isPending} style={{ flex: 1, borderRadius: 10 }} buttonColor="#c62828">Remove</Button>
                </View>
              </View>
            </View>
          )}
        </Modal>
      </Portal>
    );
  };

  const renderMember = ({ item }: { item: Member }) => {
    const isSelf = currentUser?.id === item.id;
    const rc = ROLE_COLORS[item.role] || '#9E9E9E';

    return (
      <Card style={s.card} mode="outlined">
        <Card.Content style={s.cardContent}>
          <View style={[s.avatar, { backgroundColor: rc }]}>
            <Text style={s.avatarText}>{item.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={s.memberName}>{item.name}</Text>
              {isSelf && <Chip compact style={{ backgroundColor: '#EBF5FB', height: 20 }} textStyle={{ fontSize: 9, color: colors.primary }}>You</Chip>}
            </View>
            <Text style={s.memberMobile}>{item.mobile}</Text>
            <TouchableOpacity
              style={[s.roleChip, { backgroundColor: rc + '15', borderColor: rc + '30' }]}
              onPress={() => !isSelf && openRoleChange(item)}
              disabled={isSelf}
              activeOpacity={0.6}
            >
              <MaterialCommunityIcons name="shield-star" size={12} color={rc} />
              <Text style={[s.roleChipText, { color: rc }]}>{item.role}</Text>
              {!isSelf && <MaterialCommunityIcons name="pencil" size={10} color={rc} style={{ marginLeft: 2 }} />}
            </TouchableOpacity>
          </View>
          {!isSelf && (
            <View style={s.actions}>
              <TouchableOpacity style={s.actionBtn} onPress={() => openRoleChange(item)}>
                <MaterialCommunityIcons name="account-cog" size={18} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={s.actionBtn} onPress={() => openRemove(item)}>
                <MaterialCommunityIcons name="account-remove" size={18} color="#c62828" />
              </TouchableOpacity>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  if (isLoading) return <View style={s.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <View style={s.container}>
      <View style={[s.headerBar, isWeb && { paddingHorizontal: 24 }]}>
        <Text style={s.headerTitle}>Team Members</Text>
        <Chip compact icon="account-group" style={{ backgroundColor: colors.primary + '15' }} textStyle={{ color: colors.primary, fontSize: 12 }}>{members.length} members</Chip>
      </View>

      {isWeb ? (
        <View style={{ flex: 1, paddingHorizontal: 24 }}>
          <FlatList
            data={members}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderMember}
            contentContainerStyle={{ paddingBottom: 80, maxWidth: 640 }}
            ListEmptyComponent={<Text style={s.emptyText}>{t('common.noData')}</Text>}
          />
        </View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={s.list}
          refreshing={isLoading}
          onRefresh={refetch}
          renderItem={renderMember}
          ListEmptyComponent={<Text style={s.emptyText}>{t('common.noData')}</Text>}
        />
      )}

      <Button
        mode="contained"
        icon="account-plus"
        style={[s.inviteBtn, isWeb && { left: 24, right: undefined, width: 200 }]}
        buttonColor={colors.primary}
        onPress={() => router.push('/(app)/team/invite')}
      >
        {t('team.invite')}
      </Button>

      {renderModal()}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: 14 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  list: { padding: spacing.base, paddingBottom: 80 },
  card: { marginBottom: 10, borderRadius: 14, borderColor: '#ECEEF5' },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  memberName: { fontSize: 15, fontWeight: '600', color: colors.text },
  memberMobile: { fontSize: 12, color: '#8A8FA8', marginTop: 1 },
  roleChip: {
    flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4,
    marginTop: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1,
  },
  roleChipText: { fontSize: 11, fontWeight: '600' },
  actions: { flexDirection: 'column', gap: 4 },
  actionBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F5F6FA', alignItems: 'center', justifyContent: 'center' },
  emptyText: { textAlign: 'center', color: colors.textHint, marginTop: spacing.xxl },
  inviteBtn: {
    position: 'absolute', bottom: spacing.base, left: spacing.base, right: spacing.base,
    borderRadius: 12,
  },
});

const mS = StyleSheet.create({
  container: { backgroundColor: '#fff', margin: 20, borderRadius: 20, maxHeight: '85%' as any },
  webContainer: { maxWidth: 480, alignSelf: 'center' as const, width: '90%' as any },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#ECEEF5' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  body: { padding: 20 },
  memberInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatar: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  memberName: { fontSize: 16, fontWeight: '700', color: colors.text },
  memberMobile: { fontSize: 12, color: '#8A8FA8', marginTop: 2 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#8A8FA8', letterSpacing: 1, marginBottom: 10 },
  roleOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8, paddingRight: 12, marginBottom: 8, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#ECEEF5',
  },
  roleOptionLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  roleName: { fontSize: 14, fontWeight: '700' },
  roleDesc: { fontSize: 11, color: '#8A8FA8', marginTop: 1, maxWidth: 280 },
  warningBox: { alignItems: 'center', paddingVertical: 20 },
  warningTitle: { fontSize: 16, fontWeight: '700', color: '#c62828', marginTop: 12 },
  warningText: { fontSize: 13, color: '#8A8FA8', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
});
