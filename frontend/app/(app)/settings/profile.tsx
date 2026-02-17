import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { TextInput, Button, Text, Surface, Divider, Chip, Portal, Modal } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import { formatDate } from '@/utils/formatDate';
import LoadingOverlay from '@/components/LoadingOverlay';
import SearchableDropdown from '@/components/SearchableDropdown';

const LANGUAGE_OPTIONS = [
  { label: 'English', value: 'en' },
  { label: 'Urdu (اردو)', value: 'ur' },
];

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(name: string) {
  const colors_arr = ['#1B2B65', '#3D5AF1', '#00B894', '#E84393', '#6C5CE7', '#00CEC9', '#FF6B6B', '#FDCB6E'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors_arr[Math.abs(hash) % colors_arr.length];
}

export default function ProfileSettingsScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web' && width > 768;

  const [form, setForm] = useState({ name: '', email: '', mobile: '', language_pref: 'en' });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [showPasswords, setShowPasswords] = useState({ current: false, new_: false, confirm: false });

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data.data?.user || res.data.data;
    },
  });

  const { data: versionData } = useQuery({
    queryKey: ['current-version'],
    queryFn: async () => {
      const res = await api.get('/version/current');
      return res.data.data;
    },
  });

  const { data: versionDetail } = useQuery({
    queryKey: ['version-detail', versionData?.version],
    queryFn: async () => {
      const res = await api.get('/admin/versions', { params: { search: versionData?.version } });
      const versions = res.data.data?.data || [];
      return versions.find((v: any) => v.version === versionData?.version) || versions[0] || null;
    },
    enabled: !!versionData?.version && showVersionModal,
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        mobile: user.mobile || '',
        language_pref: user.language_pref || 'en',
      });
    }
  }, [user]);

  const profileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put('/auth/profile', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      Alert.alert(t('common.success'), t('settings.profileUpdated'));
    },
    onError: (err: any) => {
      Alert.alert(t('common.error'), err.response?.data?.message || 'Failed to update profile.');
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put('/auth/password', data);
      return res.data;
    },
    onSuccess: () => {
      setShowPasswordModal(false);
      setPasswordForm({ current_password: '', password: '', password_confirmation: '' });
      Alert.alert(t('common.success'), 'Password changed successfully.');
    },
    onError: (err: any) => {
      Alert.alert(t('common.error'), err.response?.data?.message || 'Failed to change password.');
    },
  });

  const handleSaveProfile = () => {
    if (!form.name.trim()) {
      Alert.alert(t('common.error'), 'Name is required.');
      return;
    }
    profileMutation.mutate({
      name: form.name,
      email: form.email || null,
      language_pref: form.language_pref,
    });
  };

  const handleChangePassword = () => {
    if (!passwordForm.current_password || !passwordForm.password || !passwordForm.password_confirmation) {
      Alert.alert(t('common.error'), 'All password fields are required.');
      return;
    }
    if (passwordForm.password.length < 8) {
      Alert.alert(t('common.error'), 'New password must be at least 8 characters.');
      return;
    }
    if (passwordForm.password !== passwordForm.password_confirmation) {
      Alert.alert(t('common.error'), 'Passwords do not match.');
      return;
    }
    passwordMutation.mutate(passwordForm);
  };

  const initials = user?.name ? getInitials(user.name) : 'U';
  const avatarColor = user?.name ? getAvatarColor(user.name) : colors.primary;
  const roles = user?.roles?.map((r: any) => r.name).join(', ') || 'User';
  const businesses = user?.tenants?.length || 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LoadingOverlay visible={profileMutation.isPending} message="Saving profile..." />

      {/* ─── Profile Header ─── */}
      <Surface style={styles.profileHeader}>
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.profileName}>{user?.name || 'User'}</Text>
        <Text style={styles.profileMobile}>{user?.mobile || ''}</Text>
        <View style={styles.chipRow}>
          {user?.roles?.map((r: any) => (
            <Chip key={r.id} compact style={styles.roleChip} textStyle={styles.roleChipText}>
              {r.name}
            </Chip>
          ))}
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{businesses}</Text>
            <Text style={styles.statLabel}>Businesses</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatDate(user?.created_at)}</Text>
            <Text style={styles.statLabel}>Joined</Text>
          </View>
        </View>
      </Surface>

      {/* ─── Personal Information ─── */}
      <Surface style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="account-outline" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Personal Information</Text>
        </View>
        <Divider style={{ marginBottom: 16 }} />

        <TextInput
          label={t('auth.name')} value={form.name}
          onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
          mode="outlined" style={styles.input}
          left={<TextInput.Icon icon="account" />}
        />
        <TextInput
          label={t('auth.email') + ' (optional)'} value={form.email}
          onChangeText={(v) => setForm((p) => ({ ...p, email: v }))}
          keyboardType="email-address" mode="outlined" style={styles.input}
          left={<TextInput.Icon icon="email-outline" />}
        />
        <TextInput
          label={t('auth.mobile')} value={form.mobile}
          mode="outlined" style={styles.input} disabled
          left={<TextInput.Icon icon="phone" />}
        />

        <SearchableDropdown
          label="Language"
          items={LANGUAGE_OPTIONS}
          value={form.language_pref}
          onSelect={(item) => setForm((p) => ({ ...p, language_pref: String(item.value) }))}
          placeholder="Select language..."
        />

        <Button
          mode="contained" onPress={handleSaveProfile}
          loading={profileMutation.isPending}
          style={styles.saveBtn} buttonColor={colors.primary}
          icon="content-save"
        >
          {t('common.save')}
        </Button>
      </Surface>

      {/* ─── Security ─── */}
      <Surface style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="shield-lock-outline" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>Security</Text>
        </View>
        <Divider style={{ marginBottom: 16 }} />

        <TouchableOpacity style={styles.actionRow} onPress={() => setShowPasswordModal(true)}>
          <View style={[styles.actionIcon, { backgroundColor: '#FFF3E0' }]}>
            <MaterialCommunityIcons name="lock-reset" size={20} color="#E65100" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Change Password</Text>
            <Text style={styles.actionDesc}>Update your account password</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#B0B5C8" />
        </TouchableOpacity>
      </Surface>

      {/* ─── App Info ─── */}
      <Surface style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="information-outline" size={20} color={colors.primary} />
          <Text style={styles.sectionTitle}>App Information</Text>
        </View>
        <Divider style={{ marginBottom: 16 }} />

        <TouchableOpacity style={styles.actionRow} onPress={() => setShowVersionModal(true)}>
          <View style={[styles.actionIcon, { backgroundColor: '#E3F2FD' }]}>
            <MaterialCommunityIcons name="tag-outline" size={20} color="#1565C0" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Version</Text>
            <Text style={styles.actionDesc}>
              v{versionData?.version || '1.0.0'} — {versionData?.title || 'e-Khata'}
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#B0B5C8" />
        </TouchableOpacity>

        <InfoRow icon="shield-star" label="Role" value={roles} />
        <InfoRow icon="domain" label="Businesses" value={String(businesses)} />
        <InfoRow icon="translate" label="Language" value={form.language_pref === 'ur' ? 'Urdu' : 'English'} />
      </Surface>

      {/* ─── Password Change Modal ─── */}
      <Portal>
        <Modal visible={showPasswordModal} onDismiss={() => setShowPasswordModal(false)}
          contentContainerStyle={styles.modalContent}>
          <LoadingOverlay visible={passwordMutation.isPending} message="Changing password..." />
          <Text style={styles.modalTitle}>Change Password</Text>

          <TextInput
            label="Current Password" value={passwordForm.current_password}
            onChangeText={(v) => setPasswordForm((p) => ({ ...p, current_password: v }))}
            secureTextEntry={!showPasswords.current} mode="outlined" style={styles.input}
            left={<TextInput.Icon icon="lock" />}
            right={<TextInput.Icon icon={showPasswords.current ? 'eye-off' : 'eye'}
              onPress={() => setShowPasswords((p) => ({ ...p, current: !p.current }))} />}
          />
          <TextInput
            label="New Password" value={passwordForm.password}
            onChangeText={(v) => setPasswordForm((p) => ({ ...p, password: v }))}
            secureTextEntry={!showPasswords.new_} mode="outlined" style={styles.input}
            left={<TextInput.Icon icon="lock-plus" />}
            right={<TextInput.Icon icon={showPasswords.new_ ? 'eye-off' : 'eye'}
              onPress={() => setShowPasswords((p) => ({ ...p, new_: !p.new_ }))} />}
          />
          <TextInput
            label="Confirm Password" value={passwordForm.password_confirmation}
            onChangeText={(v) => setPasswordForm((p) => ({ ...p, password_confirmation: v }))}
            secureTextEntry={!showPasswords.confirm} mode="outlined" style={styles.input}
            left={<TextInput.Icon icon="lock-check" />}
            right={<TextInput.Icon icon={showPasswords.confirm ? 'eye-off' : 'eye'}
              onPress={() => setShowPasswords((p) => ({ ...p, confirm: !p.confirm }))} />}
          />

          {passwordForm.password && passwordForm.password.length < 8 && (
            <Text style={styles.hint}>Password must be at least 8 characters</Text>
          )}

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <Button mode="outlined" onPress={() => setShowPasswordModal(false)} style={{ flex: 1 }}>
              Cancel
            </Button>
            <Button mode="contained" onPress={handleChangePassword}
              loading={passwordMutation.isPending} buttonColor={colors.primary} style={{ flex: 1 }}>
              Change
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* ─── Version Changelog Modal ─── */}
      <Portal>
        <Modal visible={showVersionModal} onDismiss={() => setShowVersionModal(false)}
          contentContainerStyle={styles.modalContent}>
          <ScrollView>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
              <View style={[styles.versionBadge]}>
                <MaterialCommunityIcons name="tag" size={16} color="#fff" />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.modalTitle}>v{versionData?.version || '1.0.0'}</Text>
                <Text style={{ fontSize: 13, color: '#8A8FA8' }}>{versionData?.title || 'e-Khata'}</Text>
              </View>
            </View>

            {versionData && (
              <View style={styles.versionMeta}>
                <Chip compact style={{ backgroundColor: '#E8F5E9' }} textStyle={{ fontSize: 10, color: '#2E7D32' }}>
                  {(versionData.channel || 'stable').toUpperCase()}
                </Chip>
                <Text style={{ fontSize: 12, color: '#8A8FA8' }}>
                  Released {formatDate(versionData.release_date)}
                </Text>
              </View>
            )}

            <Divider style={{ marginVertical: 12 }} />

            {versionDetail?.changelog ? (
              <View>
                {versionDetail.changelog.split('\n').map((line: string, idx: number) => {
                  const trimmed = line.trim();
                  if (trimmed.startsWith('### ')) {
                    return <Text key={idx} style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 6, marginTop: 4 }}>{trimmed.replace('### ', '')}</Text>;
                  }
                  if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                    return <Text key={idx} style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 3, marginTop: 6 }}>{trimmed.replace(/\*\*/g, '')}</Text>;
                  }
                  if (trimmed.startsWith('- ')) {
                    return (
                      <View key={idx} style={{ flexDirection: 'row', paddingLeft: 6, marginBottom: 3 }}>
                        <Text style={{ fontSize: 13, color: colors.primary, marginRight: 6 }}>•</Text>
                        <Text style={{ fontSize: 12, color: '#4A4E6A', lineHeight: 18, flex: 1 }}>{trimmed.substring(2)}</Text>
                      </View>
                    );
                  }
                  if (trimmed === '') return <View key={idx} style={{ height: 6 }} />;
                  return <Text key={idx} style={{ fontSize: 12, color: '#4A4E6A', lineHeight: 18 }}>{trimmed}</Text>;
                })}
              </View>
            ) : (
              <Text style={{ color: '#8A8FA8', textAlign: 'center', paddingVertical: 20 }}>
                {versionData ? 'Loading changelog...' : 'No version information available.'}
              </Text>
            )}

            <Button mode="text" onPress={() => setShowVersionModal(false)} style={{ marginTop: 12 }}>
              Close
            </Button>
          </ScrollView>
        </Modal>
      </Portal>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon as any} size={18} color="#8A8FA8" />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  content: { padding: spacing.base, paddingBottom: 40, maxWidth: 640 },

  // Profile Header
  profileHeader: {
    alignItems: 'center', padding: 24, borderRadius: 18,
    marginBottom: 16, elevation: 1, backgroundColor: '#fff',
  },
  avatar: {
    width: 72, height: 72, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 26 },
  profileName: { fontSize: 20, fontWeight: '700', color: colors.text },
  profileMobile: { fontSize: 13, color: '#8A8FA8', marginTop: 2 },
  chipRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  roleChip: { backgroundColor: '#EEF0FF' },
  roleChipText: { fontSize: 10, fontWeight: '600', color: colors.primary },
  statsRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 16,
    paddingTop: 16, borderTopWidth: 1, borderTopColor: '#ECEEF5', width: '100%',
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 14, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 11, color: '#8A8FA8', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: '#ECEEF5' },

  // Sections
  section: {
    padding: 20, borderRadius: 16, marginBottom: 16,
    elevation: 1, backgroundColor: '#fff',
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },

  input: { marginBottom: 12, backgroundColor: 'transparent' },

  saveBtn: { marginTop: 4, borderRadius: 10 },

  // Action rows
  actionRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 12,
  },
  actionIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  actionTitle: { fontSize: 14, fontWeight: '600', color: colors.text },
  actionDesc: { fontSize: 12, color: '#8A8FA8', marginTop: 1 },

  // Info rows
  infoRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 10,
  },
  infoLabel: { fontSize: 13, color: '#8A8FA8', width: 90 },
  infoValue: { fontSize: 13, fontWeight: '500', color: colors.text, flex: 1 },

  // Modal
  modalContent: {
    backgroundColor: '#fff', margin: 20, padding: 24, borderRadius: 16, maxHeight: '85%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 16 },
  hint: { fontSize: 11, color: colors.warning, marginTop: -8, marginBottom: 8 },

  // Version badge
  versionBadge: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  versionMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
