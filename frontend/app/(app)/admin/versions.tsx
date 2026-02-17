import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, useWindowDimensions,
} from 'react-native';
import {
  Text, Surface, Searchbar, ActivityIndicator, Button, TextInput, Portal, Modal,
  Chip, Divider, IconButton,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import { formatDate } from '@/utils/formatDate';
import LoadingOverlay from '@/components/LoadingOverlay';
import SearchableDropdown from '@/components/SearchableDropdown';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const CHANNEL_COLORS: Record<string, { bg: string; text: string }> = {
  stable: { bg: '#E8F5E9', text: '#2E7D32' },
  beta: { bg: '#FFF3E0', text: '#E65100' },
  alpha: { bg: '#FCE4EC', text: '#C62828' },
};

const CHANNEL_OPTIONS = [
  { label: 'Stable', value: 'stable' },
  { label: 'Beta', value: 'beta' },
  { label: 'Alpha', value: 'alpha' },
];

const PLATFORM_OPTIONS = [
  { label: 'All Platforms', value: 'all' },
  { label: 'Web', value: 'web' },
  { label: 'iOS', value: 'ios' },
  { label: 'Android', value: 'android' },
];

interface Version {
  id: number;
  version: string;
  title: string;
  changelog: string;
  channel: string;
  platform: string;
  is_current: boolean;
  force_update: boolean;
  release_date: string;
  released_by: { id: number; name: string } | null;
  created_at: string;
}

export default function AdminVersionsScreen() {
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web' && width > 768;

  const [search, setSearch] = useState('');
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editVersion, setEditVersion] = useState<Version | null>(null);
  const [form, setForm] = useState({
    version: '',
    title: '',
    changelog: '',
    channel: 'stable',
    platform: 'all',
    is_current: false,
    force_update: false,
    release_date: new Date().toISOString().split('T')[0],
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-versions', search],
    queryFn: async () => {
      const params: any = {};
      if (search) params.search = search;
      const res = await api.get('/admin/versions', { params });
      return res.data.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editVersion) {
        return api.put(`/admin/versions/${editVersion.id}`, payload);
      }
      return api.post('/admin/versions', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-versions'] });
      setShowForm(false);
      setEditVersion(null);
      resetForm();
      Alert.alert('Success', editVersion ? 'Version updated.' : 'Version created.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save version.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/versions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-versions'] });
      setSelectedVersion(null);
      Alert.alert('Success', 'Version deleted.');
    },
  });

  const resetForm = () => {
    setForm({
      version: '',
      title: '',
      changelog: '',
      channel: 'stable',
      platform: 'all',
      is_current: false,
      force_update: false,
      release_date: new Date().toISOString().split('T')[0],
    });
  };

  const openEdit = (v: Version) => {
    setEditVersion(v);
    setForm({
      version: v.version,
      title: v.title,
      changelog: v.changelog,
      channel: v.channel,
      platform: v.platform,
      is_current: v.is_current,
      force_update: v.force_update,
      release_date: typeof v.release_date === 'string' ? v.release_date.split('T')[0] : v.release_date,
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.version.trim() || !form.title.trim() || !form.changelog.trim()) {
      Alert.alert('Validation', 'Version, title, and changelog are required.');
      return;
    }
    saveMutation.mutate(form);
  };

  const handleDelete = (v: Version) => {
    Alert.alert('Delete Version', `Delete v${v.version}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(v.id) },
    ]);
  };

  const versions: Version[] = data?.data || [];

  if (isLoading) {
    return <View style={s.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  /* ═══ Changelog Detail Modal ═══ */
  const renderChangelogModal = () => (
    <Portal>
      <Modal
        visible={!!selectedVersion}
        onDismiss={() => setSelectedVersion(null)}
        contentContainerStyle={s.modalContent}
      >
        <ScrollView>
          {selectedVersion && (
            <>
              <View style={s.modalHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={s.modalVersion}>v{selectedVersion.version}</Text>
                  <Text style={s.modalTitle}>{selectedVersion.title}</Text>
                </View>
                <IconButton icon="close" size={20} onPress={() => setSelectedVersion(null)} />
              </View>

              <View style={s.modalMeta}>
                <Chip
                  compact
                  style={{ backgroundColor: CHANNEL_COLORS[selectedVersion.channel]?.bg || '#F0F0F0' }}
                  textStyle={{ color: CHANNEL_COLORS[selectedVersion.channel]?.text || '#666', fontSize: 11, fontWeight: '700' }}
                >
                  {selectedVersion.channel.toUpperCase()}
                </Chip>
                <Chip compact style={{ backgroundColor: '#E3F2FD' }} textStyle={{ fontSize: 11, color: '#1565C0' }}>
                  {selectedVersion.platform}
                </Chip>
                {selectedVersion.is_current && (
                  <Chip compact style={{ backgroundColor: '#E8F5E9' }} textStyle={{ fontSize: 11, color: '#2E7D32', fontWeight: '700' }}>
                    CURRENT
                  </Chip>
                )}
                {selectedVersion.force_update && (
                  <Chip compact style={{ backgroundColor: '#FCE4EC' }} textStyle={{ fontSize: 11, color: '#C62828' }}>
                    FORCE UPDATE
                  </Chip>
                )}
              </View>

              <Text style={s.modalMetaText}>
                Released {formatDate(selectedVersion.release_date)}
                {selectedVersion.released_by ? ` by ${selectedVersion.released_by.name}` : ''}
              </Text>

              <Divider style={{ marginVertical: 16 }} />

              {/* Render changelog as formatted text */}
              <View style={s.changelogContainer}>
                {selectedVersion.changelog.split('\n').map((line, idx) => {
                  const trimmed = line.trim();
                  if (trimmed.startsWith('### ')) {
                    return <Text key={idx} style={s.clH3}>{trimmed.replace('### ', '')}</Text>;
                  }
                  if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                    return <Text key={idx} style={s.clBold}>{trimmed.replace(/\*\*/g, '')}</Text>;
                  }
                  if (trimmed.startsWith('- ')) {
                    return (
                      <View key={idx} style={s.clBullet}>
                        <Text style={s.clDot}>•</Text>
                        <Text style={s.clBulletText}>{trimmed.substring(2)}</Text>
                      </View>
                    );
                  }
                  if (trimmed === '') return <View key={idx} style={{ height: 8 }} />;
                  return <Text key={idx} style={s.clText}>{trimmed}</Text>;
                })}
              </View>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
                <Button mode="outlined" onPress={() => openEdit(selectedVersion)} icon="pencil" style={{ flex: 1 }}>
                  Edit
                </Button>
                <Button mode="outlined" textColor={colors.error} onPress={() => handleDelete(selectedVersion)} icon="delete" style={{ flex: 1 }}>
                  Delete
                </Button>
              </View>
            </>
          )}
        </ScrollView>
      </Modal>
    </Portal>
  );

  /* ═══ Create/Edit Form Modal ═══ */
  const renderFormModal = () => (
    <Portal>
      <Modal
        visible={showForm}
        onDismiss={() => { setShowForm(false); setEditVersion(null); resetForm(); }}
        contentContainerStyle={[s.modalContent, { maxHeight: '90%' }]}
      >
        <ScrollView>
          <LoadingOverlay visible={saveMutation.isPending} message="Saving version..." />
          <Text style={s.modalVersion}>{editVersion ? `Edit v${editVersion.version}` : 'New Version'}</Text>

          <TextInput
            label="Version *" value={form.version} placeholder="e.g. 1.3.0"
            onChangeText={(v) => setForm((p) => ({ ...p, version: v }))}
            mode="outlined" style={s.formInput}
          />
          <TextInput
            label="Title *" value={form.title} placeholder="e.g. Performance Improvements"
            onChangeText={(v) => setForm((p) => ({ ...p, title: v }))}
            mode="outlined" style={s.formInput}
          />
          <TextInput
            label="Release Date *" value={form.release_date} placeholder="YYYY-MM-DD"
            onChangeText={(v) => setForm((p) => ({ ...p, release_date: v }))}
            mode="outlined" style={s.formInput}
          />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <SearchableDropdown
                label="Channel"
                items={CHANNEL_OPTIONS}
                value={form.channel}
                onSelect={(item) => setForm((p) => ({ ...p, channel: String(item.value) }))}
              />
            </View>
            <View style={{ flex: 1 }}>
              <SearchableDropdown
                label="Platform"
                items={PLATFORM_OPTIONS}
                value={form.platform}
                onSelect={(item) => setForm((p) => ({ ...p, platform: String(item.value) }))}
              />
            </View>
          </View>

          <TextInput
            label="Changelog *" value={form.changelog}
            onChangeText={(v) => setForm((p) => ({ ...p, changelog: v }))}
            mode="outlined" style={[s.formInput, { minHeight: 150 }]}
            multiline numberOfLines={8}
            placeholder={"### What's New\n\n**Features:**\n- Feature 1\n- Feature 2\n\n**Bug Fixes:**\n- Fix 1"}
          />

          <View style={{ flexDirection: 'row', gap: 16, marginVertical: 8 }}>
            <TouchableOpacity
              style={[s.checkRow]}
              onPress={() => setForm((p) => ({ ...p, is_current: !p.is_current }))}
            >
              <MaterialCommunityIcons
                name={form.is_current ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={22} color={form.is_current ? colors.primary : '#8A8FA8'}
              />
              <Text style={s.checkLabel}>Mark as Current</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.checkRow]}
              onPress={() => setForm((p) => ({ ...p, force_update: !p.force_update }))}
            >
              <MaterialCommunityIcons
                name={form.force_update ? 'checkbox-marked' : 'checkbox-blank-outline'}
                size={22} color={form.force_update ? colors.error : '#8A8FA8'}
              />
              <Text style={s.checkLabel}>Force Update</Text>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <Button
              mode="outlined"
              onPress={() => { setShowForm(false); setEditVersion(null); resetForm(); }}
              style={{ flex: 1 }}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={saveMutation.isPending}
              buttonColor={colors.primary}
              style={{ flex: 1 }}
            >
              {editVersion ? 'Update' : 'Create'}
            </Button>
          </View>
        </ScrollView>
      </Modal>
    </Portal>
  );

  /* ═══ Timeline ═══ */
  return (
    <View style={s.container}>
      {renderChangelogModal()}
      {renderFormModal()}

      {/* Header */}
      <View style={s.headerBar}>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Version Management</Text>
          <Text style={s.headerSubtitle}>{versions.length} release{versions.length !== 1 ? 's' : ''}</Text>
        </View>
        <Button
          mode="contained"
          icon="plus"
          onPress={() => { resetForm(); setEditVersion(null); setShowForm(true); }}
          buttonColor={colors.primary}
          compact
        >
          New Release
        </Button>
      </View>

      <Searchbar
        placeholder="Search versions..."
        value={search}
        onChangeText={setSearch}
        style={s.searchbar}
      />

      {/* Timeline */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.base, paddingTop: 8 }}>
        {versions.length === 0 ? (
          <View style={s.emptyState}>
            <MaterialCommunityIcons name="tag-off-outline" size={48} color="#B0B5C8" />
            <Text style={s.emptyText}>No versions found</Text>
          </View>
        ) : (
          versions.map((v, idx) => {
            const isLast = idx === versions.length - 1;
            const channelColor = CHANNEL_COLORS[v.channel] || { bg: '#F0F0F0', text: '#666' };

            return (
              <View key={v.id} style={s.timelineItem}>
                {/* Timeline line */}
                <View style={s.timelineLineContainer}>
                  <View style={[
                    s.timelineDot,
                    v.is_current && s.timelineDotCurrent,
                  ]}>
                    <MaterialCommunityIcons
                      name={v.is_current ? 'star' : 'tag-outline'}
                      size={14}
                      color={v.is_current ? '#fff' : colors.primary}
                    />
                  </View>
                  {!isLast && <View style={s.timelineLine} />}
                </View>

                {/* Content */}
                <TouchableOpacity
                  style={[s.timelineCard, v.is_current && s.timelineCardCurrent]}
                  activeOpacity={0.7}
                  onPress={() => setSelectedVersion(v)}
                >
                  <View style={s.cardHeader}>
                    <Text style={s.cardVersion}>v{v.version}</Text>
                    <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
                      <Chip
                        compact
                        style={{ backgroundColor: channelColor.bg, height: 22 }}
                        textStyle={{ color: channelColor.text, fontSize: 9, fontWeight: '700' }}
                      >
                        {v.channel.toUpperCase()}
                      </Chip>
                      {v.is_current && (
                        <Chip compact style={{ backgroundColor: '#E8F5E9', height: 22 }} textStyle={{ fontSize: 9, color: '#2E7D32', fontWeight: '700' }}>
                          CURRENT
                        </Chip>
                      )}
                      {v.force_update && (
                        <Chip compact style={{ backgroundColor: '#FCE4EC', height: 22 }} textStyle={{ fontSize: 9, color: '#C62828' }}>
                          FORCE
                        </Chip>
                      )}
                    </View>
                  </View>

                  <Text style={s.cardTitle}>{v.title}</Text>

                  <View style={s.cardMeta}>
                    <MaterialCommunityIcons name="calendar-outline" size={13} color="#8A8FA8" />
                    <Text style={s.cardDate}>{formatDate(v.release_date)}</Text>
                    {v.released_by && (
                      <>
                        <MaterialCommunityIcons name="account-outline" size={13} color="#8A8FA8" style={{ marginLeft: 8 }} />
                        <Text style={s.cardDate}>{v.released_by.name}</Text>
                      </>
                    )}
                    <MaterialCommunityIcons name="cellphone" size={13} color="#8A8FA8" style={{ marginLeft: 8 }} />
                    <Text style={s.cardDate}>{v.platform}</Text>
                  </View>

                  {/* Preview first 2 lines of changelog */}
                  <Text style={s.cardPreview} numberOfLines={2}>
                    {v.changelog.replace(/[#*\-]/g, '').trim().substring(0, 120)}...
                  </Text>

                  <View style={s.cardActions}>
                    <TouchableOpacity onPress={() => setSelectedVersion(v)} style={s.cardActionBtn}>
                      <MaterialCommunityIcons name="text-box-outline" size={16} color={colors.primary} />
                      <Text style={s.cardActionText}>View Changelog</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openEdit(v)} style={s.cardActionBtn}>
                      <MaterialCommunityIcons name="pencil-outline" size={16} color="#6C7293" />
                      <Text style={[s.cardActionText, { color: '#6C7293' }]}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: 14,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ECEEF5',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  headerSubtitle: { fontSize: 12, color: '#8A8FA8', marginTop: 2 },

  searchbar: {
    marginHorizontal: spacing.base, marginVertical: 10,
    borderRadius: 12, elevation: 0, backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#ECEEF5',
  },

  // Timeline
  timelineItem: { flexDirection: 'row', marginBottom: 0 },
  timelineLineContainer: { width: 36, alignItems: 'center' },
  timelineDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#EEF0FF', borderWidth: 2, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', zIndex: 2,
  },
  timelineDotCurrent: {
    backgroundColor: colors.primary, borderColor: colors.primary,
  },
  timelineLine: {
    width: 2, flex: 1, backgroundColor: '#ECEEF5', marginTop: -2,
  },

  timelineCard: {
    flex: 1, marginLeft: 10, marginBottom: 16,
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: '#ECEEF5',
    ...Platform.select({
      web: { boxShadow: '0 1px 4px rgba(0,0,0,0.06)' },
      default: { elevation: 1 },
    }),
  },
  timelineCardCurrent: {
    borderColor: colors.primary + '40',
    backgroundColor: '#FAFBFF',
  },

  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardVersion: { fontSize: 18, fontWeight: '800', color: colors.primary },
  cardTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 6 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  cardDate: { fontSize: 11, color: '#8A8FA8' },
  cardPreview: { fontSize: 12, color: '#8A8FA8', lineHeight: 18, marginBottom: 8 },
  cardActions: { flexDirection: 'row', gap: 16, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  cardActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardActionText: { fontSize: 12, fontWeight: '600', color: colors.primary },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyText: { fontSize: 14, color: '#B0B5C8' },

  // Modal
  modalContent: {
    backgroundColor: '#fff', margin: 20, padding: 24, borderRadius: 16, maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  modalVersion: { fontSize: 22, fontWeight: '800', color: colors.primary, marginBottom: 4 },
  modalTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  modalMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginVertical: 8 },
  modalMetaText: { fontSize: 12, color: '#8A8FA8', marginBottom: 4 },

  // Changelog rendering
  changelogContainer: { paddingVertical: 4 },
  clH3: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 8, marginTop: 4 },
  clBold: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 4, marginTop: 8 },
  clBullet: { flexDirection: 'row', paddingLeft: 8, marginBottom: 4 },
  clDot: { fontSize: 14, color: colors.primary, marginRight: 8, lineHeight: 20 },
  clBulletText: { fontSize: 13, color: '#4A4E6A', lineHeight: 20, flex: 1 },
  clText: { fontSize: 13, color: '#4A4E6A', lineHeight: 20 },

  // Form
  formInput: { marginBottom: 12, backgroundColor: 'transparent' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  checkLabel: { fontSize: 13, color: colors.text, fontWeight: '500' },
});
