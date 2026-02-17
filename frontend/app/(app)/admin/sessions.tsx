import React, { useState } from 'react';
import { View, StyleSheet, FlatList, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Surface, ActivityIndicator, Searchbar, Chip, Portal, Modal, Button, Divider, DataTable, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import { formatDateTime, timeAgo } from '@/utils/formatDate';
import LoadingOverlay from '@/components/LoadingOverlay';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export default function AdminSessionsScreen() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [showActivities, setShowActivities] = useState(false);
  const [activitySearch, setActivitySearch] = useState('');

  // Fetch all sessions
  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['admin-sessions', search, filter],
    queryFn: async () => {
      const params: any = { per_page: 50 };
      if (search) params.search = search;
      if (filter !== 'all') params.is_active = filter === 'active';
      const res = await api.get('/admin/sessions', { params });
      return res.data.data;
    },
  });

  // Fetch session detail
  const { data: sessionDetail } = useQuery({
    queryKey: ['admin-session-detail', selectedSession?.id],
    queryFn: async () => {
      const res = await api.get(`/admin/sessions/${selectedSession.id}`);
      return res.data.data;
    },
    enabled: !!selectedSession?.id,
  });

  // Fetch session activities
  const { data: activitiesData, isLoading: activitiesLoading } = useQuery({
    queryKey: ['admin-session-activities', selectedSession?.id, activitySearch],
    queryFn: async () => {
      const params: any = { per_page: 50 };
      if (activitySearch) params.search = activitySearch;
      const res = await api.get(`/admin/sessions/${selectedSession.id}/activities`, { params });
      return res.data.data;
    },
    enabled: !!selectedSession?.id && showActivities,
  });

  // Revoke session
  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => api.delete(`/admin/sessions/${sessionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
      setSelectedSession(null);
    },
  });

  // Cleanup duplicate sessions
  const cleanupMutation = useMutation({
    mutationFn: () => api.post('/admin/sessions/cleanup'),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-sessions'] });
      alert(res.data?.message || 'Duplicate sessions cleaned up.');
    },
  });

  const sessions = sessionsData?.data || sessionsData || [];

  const getDeviceIcon = (session: any): IconName => {
    const os = (session.os_name || '').toLowerCase();
    if (os.includes('ios') || os.includes('mac')) return 'apple';
    if (os.includes('android')) return 'android';
    if (os.includes('windows')) return 'microsoft-windows';
    if (os.includes('linux')) return 'linux';
    if (session.browser_name) return 'web';
    return 'cellphone';
  };

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={revokeMutation.isPending || cleanupMutation.isPending} message={cleanupMutation.isPending ? "Cleaning up..." : "Revoking session..."} />

      {/* Search + Filters */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Searchbar
            placeholder="Search by name, device, IP, location..."
            value={search}
            onChangeText={setSearch}
            style={[styles.searchbar, { flex: 1 }]}
            inputStyle={{ fontSize: 13 }}
          />
          <Button
            mode="outlined"
            compact
            icon="broom"
            onPress={() => cleanupMutation.mutate()}
            style={{ borderColor: '#FF9800', borderRadius: 8 }}
            labelStyle={{ fontSize: 11, color: '#FF9800' }}
          >
            Cleanup
          </Button>
        </View>
        <View style={styles.filterRow}>
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <Chip
              key={f}
              selected={filter === f}
              onPress={() => setFilter(f)}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              textStyle={{ fontSize: 12, color: filter === f ? '#fff' : colors.text }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Chip>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }: { item: any }) => (
            <TouchableOpacity activeOpacity={0.7} onPress={() => { setSelectedSession(item); setShowActivities(false); }}>
              <Surface style={styles.sessionCard}>
                <View style={styles.sessionRow}>
                  <View style={[styles.deviceIconWrap, { backgroundColor: item.is_active ? '#E8F5E9' : '#F5F5F5' }]}>
                    <MaterialCommunityIcons name={getDeviceIcon(item)} size={20} color={item.is_active ? '#4CAF50' : '#9E9E9E'} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.deviceName}>
                        {item.device_name || item.display_name || item.browser_name || 'Unknown Device'}
                      </Text>
                      {item.is_active && (
                        <View style={styles.activeDot} />
                      )}
                    </View>
                    <Text style={styles.sessionMeta}>
                      {item.user?.name || 'Unknown'} • {item.user?.mobile || ''}
                    </Text>
                    <Text style={styles.sessionMeta}>
                      {[item.os_name, item.os_version].filter(Boolean).join(' ')} • {item.browser_name || item.app_version || ''} • {item.ip_address}
                    </Text>
                    <Text style={styles.sessionTime}>
                      {item.geo_city ? `${item.geo_city}, ${item.geo_country}` : ''} • {timeAgo(item.last_active_at)}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textHint} />
                </View>
              </Surface>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.centered}>
              <MaterialCommunityIcons name="devices" size={48} color="#D1D5DB" />
              <Text style={{ color: colors.textHint, marginTop: 8 }}>No sessions found</Text>
            </View>
          }
        />
      )}

      {/* Session Detail + Activities Modal */}
      <Portal>
        <Modal
          visible={!!selectedSession}
          onDismiss={() => { setSelectedSession(null); setShowActivities(false); }}
          contentContainerStyle={styles.modal}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Session Details</Text>
              <IconButton icon="close" size={20} onPress={() => { setSelectedSession(null); setShowActivities(false); }} />
            </View>

            {sessionDetail ? (
              <>
                {/* User Info */}
                <Surface style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>👤 User</Text>
                  <InfoRow icon="account" label="Name" value={sessionDetail.user?.name || '—'} />
                  <InfoRow icon="phone" label="Mobile" value={sessionDetail.user?.mobile || '—'} />
                  <InfoRow icon="email-outline" label="Email" value={sessionDetail.user?.email || '—'} />
                </Surface>

                {/* Device Info */}
                <Surface style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>📱 Device</Text>
                  <InfoRow icon="cellphone" label="Device" value={sessionDetail.device_name || '—'} />
                  <InfoRow icon="tag" label="Model" value={sessionDetail.device_model || '—'} />
                  <InfoRow icon="factory" label="Brand" value={sessionDetail.device_brand || '—'} />
                  <InfoRow icon="identifier" label="Device ID" value={sessionDetail.device_id || '—'} />
                </Surface>

                {/* Software Info */}
                <Surface style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>💻 Software</Text>
                  <InfoRow icon="monitor" label="OS" value={[sessionDetail.os_name, sessionDetail.os_version].filter(Boolean).join(' ') || '—'} />
                  <InfoRow icon="web" label="Browser" value={[sessionDetail.browser_name, sessionDetail.browser_version].filter(Boolean).join(' ') || '—'} />
                  <InfoRow icon="application" label="App Version" value={sessionDetail.app_version || '—'} />
                </Surface>

                {/* Network Info */}
                <Surface style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>🌐 Network & Location</Text>
                  <InfoRow icon="ip-network" label="Login IP" value={sessionDetail.ip_address || '—'} />
                  <InfoRow icon="ip" label="Last IP" value={sessionDetail.last_ip_address || '—'} />
                  <InfoRow icon="map-marker" label="Location" value={sessionDetail.location || '—'} />
                  <InfoRow icon="earth" label="Country" value={sessionDetail.geo_country || '—'} />
                  <InfoRow icon="city" label="City" value={sessionDetail.geo_city || '—'} />
                  {sessionDetail.geo_lat && (
                    <InfoRow icon="crosshairs-gps" label="Coordinates" value={`${sessionDetail.geo_lat}, ${sessionDetail.geo_lng}`} />
                  )}
                </Surface>

                {/* Session Timing */}
                <Surface style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>⏰ Timing</Text>
                  <InfoRow icon="login" label="Login At" value={formatDateTime(sessionDetail.login_at)} />
                  <InfoRow icon="clock-outline" label="Last Active" value={formatDateTime(sessionDetail.last_active_at)} />
                  {sessionDetail.logout_at && (
                    <InfoRow icon="logout" label="Logout At" value={formatDateTime(sessionDetail.logout_at)} />
                  )}
                  <InfoRow icon="bell-ring-outline" label="Push Notifications" value={sessionDetail.fcm_token || 'Not set'} />
                  <InfoRow icon="circle" label="Status" value={sessionDetail.is_active ? '🟢 Active' : '🔴 Inactive'} />
                  <InfoRow icon="counter" label="Activities" value={String(sessionDetail.activity_count || 0)} />
                </Surface>

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  <Button
                    mode="outlined"
                    icon="format-list-bulleted"
                    onPress={() => setShowActivities(!showActivities)}
                    style={{ flex: 1, borderRadius: 8 }}
                    textColor={colors.primary}
                  >
                    {showActivities ? 'Hide Activities' : `View Activities (${sessionDetail.activity_count || 0})`}
                  </Button>
                  {sessionDetail.is_active && (
                    <Button
                      mode="contained"
                      icon="close-circle"
                      onPress={() => revokeMutation.mutate(selectedSession.id)}
                      buttonColor={colors.error}
                      style={{ flex: 1, borderRadius: 8 }}
                      loading={revokeMutation.isPending}
                    >
                      Revoke Session
                    </Button>
                  )}
                </View>

                {/* Activity Log Section */}
                {showActivities && (
                  <View style={styles.activitiesSection}>
                    <Divider style={{ marginBottom: 12 }} />
                    <Text style={styles.activitiesTitle}>📋 Activity Log</Text>
                    <Searchbar
                      placeholder="Search activities..."
                      value={activitySearch}
                      onChangeText={setActivitySearch}
                      style={styles.activitySearch}
                      inputStyle={{ fontSize: 12 }}
                    />

                    {activitiesLoading ? (
                      <ActivityIndicator style={{ marginVertical: 20 }} color={colors.primary} />
                    ) : (
                      <View>
                        {(activitiesData?.data || activitiesData || []).map((activity: any, idx: number) => (
                          <Surface key={activity.id || idx} style={styles.activityCard}>
                            <View style={styles.activityRow}>
                              <View style={[styles.activityDot, {
                                backgroundColor: activity.action?.includes('create') ? '#4CAF50'
                                  : activity.action?.includes('delete') ? '#F44336'
                                  : activity.action?.includes('update') ? '#FF9800'
                                  : colors.primary,
                              }]} />
                              <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={styles.activityAction}>{activity.action}</Text>
                                <Text style={styles.activityDesc}>{activity.description || '—'}</Text>
                                <Text style={styles.activityTime}>{formatDateTime(activity.created_at)}</Text>
                                {activity.model_type && (
                                  <Text style={styles.activityModel}>
                                    {activity.model_type.split('\\').pop()} #{activity.model_id}
                                  </Text>
                                )}
                              </View>
                            </View>
                          </Surface>
                        ))}

                        {(!activitiesData?.data?.length && !activitiesData?.length) && (
                          <Text style={{ textAlign: 'center', color: colors.textHint, marginVertical: 20 }}>
                            No activities recorded for this session
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </>
            ) : (
              <ActivityIndicator style={{ marginVertical: 40 }} color={colors.primary} />
            )}
          </ScrollView>
        </Modal>
      </Portal>
    </View>
  );
}

/* ─── Info Row Component ─── */
function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <MaterialCommunityIcons name={icon as IconName} size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.base, paddingBottom: 0 },
  searchbar: { borderRadius: 10, elevation: 1, backgroundColor: '#fff' },
  filterRow: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 4 },
  filterChip: { backgroundColor: '#F0F0F0' },
  filterChipActive: { backgroundColor: colors.primary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  list: { padding: spacing.base, paddingTop: 8 },
  sessionCard: { borderRadius: 12, padding: 14, marginBottom: 10, elevation: 1, backgroundColor: '#fff' },
  sessionRow: { flexDirection: 'row', alignItems: 'center' },
  deviceIconWrap: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  deviceName: { fontSize: 14, fontWeight: '600', color: colors.text },
  activeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4CAF50' },
  sessionMeta: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  sessionTime: { fontSize: 10, color: colors.textHint, marginTop: 2 },

  // Modal
  modal: { backgroundColor: '#fff', margin: 16, padding: 20, borderRadius: 16, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.text },

  // Info Cards
  infoCard: { borderRadius: 10, padding: 12, marginBottom: 10, elevation: 1, backgroundColor: '#FAFAFA' },
  infoCardTitle: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5 },
  infoLabel: { fontSize: 12, color: colors.textSecondary, width: 100 },
  infoValue: { fontSize: 13, fontWeight: '500', color: colors.text, flex: 1 },

  // Action Buttons
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12, marginBottom: 8 },

  // Activities
  activitiesSection: { marginTop: 8 },
  activitiesTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8, color: colors.text },
  activitySearch: { borderRadius: 8, height: 38, marginBottom: 10, backgroundColor: '#F5F5F5', elevation: 0 },
  activityCard: { borderRadius: 8, padding: 10, marginBottom: 6, backgroundColor: '#FAFAFA', elevation: 0 },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start' },
  activityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  activityAction: { fontSize: 13, fontWeight: '600', color: colors.text },
  activityDesc: { fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  activityTime: { fontSize: 10, color: colors.textHint, marginTop: 2 },
  activityModel: { fontSize: 10, color: colors.primary, marginTop: 1 },
});
