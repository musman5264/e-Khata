import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, FlatList, TouchableOpacity, useWindowDimensions, Linking, Share, Platform } from 'react-native';
import { Text, Surface, ActivityIndicator, Button, TextInput, Chip, Portal, Modal, Divider, IconButton, RadioButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import { formatDateTime, timeAgo } from '@/utils/formatDate';
import SearchableDropdown from '@/components/SearchableDropdown';
import LoadingOverlay from '@/components/LoadingOverlay';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export default function PaymentLinksScreen() {
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isWide = width > 700;

  const [showCreate, setShowCreate] = useState(false);
  const [selectedLink, setSelectedLink] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Form state
  const [selectedPartyId, setSelectedPartyId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [gateway, setGateway] = useState<'jazzcash' | 'easypaisa'>('jazzcash');
  const [description, setDescription] = useState('');
  const [expiresHours, setExpiresHours] = useState('168'); // 7 days

  // Fetch parties
  const { data: partiesData } = useQuery({
    queryKey: ['parties-list'],
    queryFn: async () => {
      const res = await api.get('/parties?per_page=200');
      return (res.data.data || []).map((p: any) => ({
        label: `${p.name}${p.mobile ? ' (' + p.mobile + ')' : ''}`,
        value: p.id,
      }));
    },
  });

  // Fetch payment links
  const { data: linksData, isLoading } = useQuery({
    queryKey: ['payment-links', statusFilter],
    queryFn: async () => {
      const params: any = { per_page: 50 };
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/payment-links', { params });
      return res.data.data || [];
    },
  });

  // Create payment link
  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/parties/${selectedPartyId}/payment-links`, {
        amount: parseFloat(amount),
        gateway,
        description: description || undefined,
        expires_in_hours: parseInt(expiresHours) || 168,
      });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payment-links'] });
      setShowCreate(false);
      setAmount('');
      setDescription('');
      setSelectedPartyId(null);
      // Show the created link with share options
      if (data?.data?.payment_link) {
        setSelectedLink({
          ...data.data.payment_link,
          shareable_url: data.data.shareable_url,
          whatsapp_url: data.data.whatsapp_url,
        });
      }
    },
  });

  // Cancel payment link
  const cancelMutation = useMutation({
    mutationFn: (id: number) => api.put(`/payment-links/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-links'] });
      setSelectedLink(null);
    },
  });

  // Share via WhatsApp
  const shareMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.get(`/payment-links/${id}/share`);
      return res.data.data;
    },
    onSuccess: async (data) => {
      if (data.whatsapp_direct_url) {
        await Linking.openURL(data.whatsapp_direct_url);
      } else if (data.whatsapp_share_url) {
        await Linking.openURL(data.whatsapp_share_url);
      }
    },
  });

  // Copy link
  const handleCopyLink = useCallback(async (url: string) => {
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(url);
        alert('Link copied to clipboard!');
      } catch { /* fallback */ }
    } else {
      await Share.share({ message: url });
    }
  }, []);

  // Share native
  const handleNativeShare = useCallback(async (link: any) => {
    try {
      await Share.share({
        message: `Pay Rs ${link.amount} via ${link.gateway}: ${link.shareable_url}`,
        title: 'Payment Link',
      });
    } catch { /* cancelled */ }
  }, []);

  const getGatewayColor = (gw: string) => gw === 'jazzcash' ? '#4CAF50' : '#2196F3';
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#4CAF50';
      case 'paid': return '#2196F3';
      case 'expired': return '#FF9800';
      case 'cancelled': return '#9E9E9E';
      default: return '#666';
    }
  };

  const links = linksData || [];

  return (
    <View style={styles.container}>
      <LoadingOverlay visible={createMutation.isPending || cancelMutation.isPending} message={createMutation.isPending ? "Creating..." : "Cancelling..."} />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <MaterialCommunityIcons name="link-variant" size={24} color={colors.primary} />
            <Text variant="titleLarge" style={{ fontWeight: '700' }}>Payment Links</Text>
          </View>
          <Button mode="contained" icon="plus" onPress={() => setShowCreate(true)} style={{ borderRadius: 8 }}>
            Create Link
          </Button>
        </View>

        {/* Status Filter */}
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {['', 'active', 'paid', 'expired', 'cancelled'].map((s) => (
            <Chip
              key={s || 'all'}
              selected={statusFilter === s}
              onPress={() => setStatusFilter(s)}
              style={statusFilter === s ? { backgroundColor: colors.primary } : { backgroundColor: '#F0F0F0' }}
              textStyle={{ color: statusFilter === s ? '#fff' : colors.text, fontSize: 12 }}
            >
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
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
          data={links}
          keyExtractor={(item: any) => String(item.id)}
          contentContainerStyle={{ padding: spacing.base, paddingTop: 0, paddingBottom: 40 }}
          renderItem={({ item }: { item: any }) => (
            <TouchableOpacity activeOpacity={0.7} onPress={() => setSelectedLink(item)}>
              <Surface style={styles.linkCard}>
                <View style={styles.linkRow}>
                  <View style={[styles.gwBadge, { backgroundColor: getGatewayColor(item.gateway) + '15' }]}>
                    <MaterialCommunityIcons
                      name={item.gateway === 'jazzcash' ? 'cellphone' : 'wallet-outline'}
                      size={20}
                      color={getGatewayColor(item.gateway)}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontWeight: '600', fontSize: 14 }}>{item.party?.name || 'Unknown Party'}</Text>
                      <Text style={{ fontWeight: '700', fontSize: 16, color: colors.primary }}>
                        Rs {parseFloat(item.amount).toLocaleString('en-PK')}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <Chip
                        mode="flat"
                        style={{ backgroundColor: getStatusColor(item.status) + '15', height: 24 }}
                        textStyle={{ fontSize: 10, color: getStatusColor(item.status), fontWeight: '600' }}
                      >
                        {item.status.toUpperCase()}
                      </Chip>
                      <Text style={{ fontSize: 11, color: colors.textSecondary }}>
                        {item.gateway.toUpperCase()} · {timeAgo(item.created_at)}
                      </Text>
                    </View>
                    {item.description && (
                      <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
                        {item.description}
                      </Text>
                    )}
                  </View>
                  {/* Quick Actions */}
                  {item.status === 'active' && (
                    <View style={{ flexDirection: 'row', marginLeft: 8 }}>
                      <IconButton
                        icon="whatsapp"
                        iconColor="#25D366"
                        size={20}
                        onPress={() => shareMutation.mutate(item.id)}
                      />
                      <IconButton
                        icon="content-copy"
                        iconColor={colors.textSecondary}
                        size={18}
                        onPress={() => handleCopyLink(item.shareable_url)}
                      />
                    </View>
                  )}
                </View>
              </Surface>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Surface style={styles.emptyCard}>
              <MaterialCommunityIcons name="link-off" size={48} color="#ccc" />
              <Text style={{ color: colors.textSecondary, marginTop: 8 }}>No payment links yet.</Text>
              <Button mode="contained" icon="plus" onPress={() => setShowCreate(true)} style={{ marginTop: 16, borderRadius: 8 }}>
                Create First Link
              </Button>
            </Surface>
          }
        />
      )}

      {/* Create Modal */}
      <Portal>
        <Modal visible={showCreate} onDismiss={() => setShowCreate(false)} contentContainerStyle={[styles.modal, { maxWidth: isWide ? 500 : '95%' }]}>
          <Text variant="titleMedium" style={{ fontWeight: '700', marginBottom: 16 }}>Create Payment Link</Text>

          <Text variant="labelMedium" style={styles.label}>Party</Text>
          <SearchableDropdown
            options={partiesData || []}
            selectedValue={selectedPartyId}
            onSelect={(v) => setSelectedPartyId(v)}
            placeholder="Select party..."
          />

          <Text variant="labelMedium" style={[styles.label, { marginTop: 12 }]}>Amount (Rs)</Text>
          <TextInput
            mode="outlined"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="Enter amount"
            dense
            style={styles.input}
          />

          <Text variant="labelMedium" style={[styles.label, { marginTop: 12 }]}>Gateway</Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={() => setGateway('jazzcash')}
              style={[styles.gwOption, gateway === 'jazzcash' && { borderColor: '#4CAF50', backgroundColor: '#E8F5E9' }]}
            >
              <MaterialCommunityIcons name="cellphone" size={20} color={gateway === 'jazzcash' ? '#4CAF50' : '#999'} />
              <Text style={[styles.gwText, gateway === 'jazzcash' && { color: '#4CAF50', fontWeight: '700' }]}>JazzCash</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setGateway('easypaisa')}
              style={[styles.gwOption, gateway === 'easypaisa' && { borderColor: '#2196F3', backgroundColor: '#E3F2FD' }]}
            >
              <MaterialCommunityIcons name="wallet-outline" size={20} color={gateway === 'easypaisa' ? '#2196F3' : '#999'} />
              <Text style={[styles.gwText, gateway === 'easypaisa' && { color: '#2196F3', fontWeight: '700' }]}>EasyPaisa</Text>
            </TouchableOpacity>
          </View>

          <Text variant="labelMedium" style={[styles.label, { marginTop: 12 }]}>Description (optional)</Text>
          <TextInput
            mode="outlined"
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. Invoice #123 payment"
            dense
            style={styles.input}
          />

          <Text variant="labelMedium" style={[styles.label, { marginTop: 12 }]}>Expires In (hours)</Text>
          <TextInput
            mode="outlined"
            value={expiresHours}
            onChangeText={setExpiresHours}
            keyboardType="number-pad"
            placeholder="168 (7 days)"
            dense
            style={styles.input}
          />

          {createMutation.isError && (
            <Text style={{ color: 'red', fontSize: 12, marginTop: 8 }}>
              {(createMutation.error as any)?.response?.data?.message || 'Failed to create link.'}
            </Text>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <Button mode="outlined" onPress={() => setShowCreate(false)} style={{ borderRadius: 8 }}>Cancel</Button>
            <Button
              mode="contained"
              onPress={() => createMutation.mutate()}
              disabled={!selectedPartyId || !amount || parseFloat(amount) < 1}
              style={{ borderRadius: 8 }}
              icon="link-plus"
            >
              Create & Share
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Detail Modal */}
      <Portal>
        <Modal visible={!!selectedLink} onDismiss={() => setSelectedLink(null)} contentContainerStyle={[styles.modal, { maxWidth: isWide ? 500 : '95%' }]}>
          {selectedLink && (
            <ScrollView>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={[styles.gwBadgeLg, { backgroundColor: getGatewayColor(selectedLink.gateway) + '20' }]}>
                  <MaterialCommunityIcons
                    name={selectedLink.gateway === 'jazzcash' ? 'cellphone' : 'wallet-outline'}
                    size={32}
                    color={getGatewayColor(selectedLink.gateway)}
                  />
                </View>
                <Text variant="headlineSmall" style={{ fontWeight: '700', marginTop: 8 }}>
                  Rs {parseFloat(selectedLink.amount).toLocaleString('en-PK')}
                </Text>
                <Chip
                  mode="flat"
                  style={{ backgroundColor: getStatusColor(selectedLink.status) + '15', marginTop: 4 }}
                  textStyle={{ color: getStatusColor(selectedLink.status), fontWeight: '600' }}
                >
                  {selectedLink.status.toUpperCase()}
                </Chip>
              </View>

              <Divider />

              <View style={{ paddingVertical: 12 }}>
                <DetailRow label="Party" value={selectedLink.party?.name || 'N/A'} />
                <DetailRow label="Gateway" value={selectedLink.gateway?.toUpperCase()} />
                <DetailRow label="Description" value={selectedLink.description || '-'} />
                <DetailRow label="Created" value={formatDateTime(selectedLink.created_at)} />
                <DetailRow label="Expires" value={selectedLink.expires_at ? formatDateTime(selectedLink.expires_at) : 'Never'} />
                {selectedLink.paid_at && <DetailRow label="Paid At" value={formatDateTime(selectedLink.paid_at)} />}
              </View>

              {/* Share Buttons */}
              {selectedLink.status === 'active' && (
                <>
                  <Divider />
                  <View style={{ paddingVertical: 12 }}>
                    <Text variant="labelLarge" style={{ fontWeight: '600', marginBottom: 8 }}>Share Payment Link</Text>

                    {/* Shareable URL */}
                    <Surface style={styles.urlBox}>
                      <Text style={{ flex: 1, fontSize: 12, color: colors.primary }} numberOfLines={1}>
                        {selectedLink.shareable_url}
                      </Text>
                      <IconButton icon="content-copy" size={18} onPress={() => handleCopyLink(selectedLink.shareable_url)} />
                    </Surface>

                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <Button
                        mode="contained"
                        icon="whatsapp"
                        onPress={() => shareMutation.mutate(selectedLink.id)}
                        style={{ flex: 1, borderRadius: 8, backgroundColor: '#25D366' }}
                      >
                        WhatsApp
                      </Button>
                      <Button
                        mode="outlined"
                        icon="share-variant"
                        onPress={() => handleNativeShare(selectedLink)}
                        style={{ flex: 1, borderRadius: 8 }}
                      >
                        Share
                      </Button>
                    </View>

                    <Button
                      mode="outlined"
                      icon="close-circle-outline"
                      onPress={() => cancelMutation.mutate(selectedLink.id)}
                      style={{ marginTop: 12, borderRadius: 8, borderColor: '#F44336' }}
                      textColor="#F44336"
                    >
                      Cancel Link
                    </Button>
                  </View>
                </>
              )}
            </ScrollView>
          )}
        </Modal>
      </Portal>
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ color: colors.textSecondary, fontSize: 13 }}>{label}</Text>
      <Text style={{ fontWeight: '600', fontSize: 13 }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.base, paddingBottom: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  linkCard: { padding: 14, borderRadius: 12, backgroundColor: '#fff', elevation: 1, marginBottom: 8 },
  linkRow: { flexDirection: 'row', alignItems: 'center' },
  gwBadge: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  gwBadgeLg: { width: 60, height: 60, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  emptyCard: { padding: 40, borderRadius: 14, alignItems: 'center', backgroundColor: '#fff', elevation: 1 },
  modal: {
    backgroundColor: '#fff', borderRadius: 16, padding: 24,
    alignSelf: 'center', width: '95%',
    maxHeight: '90%',
  },
  label: { fontWeight: '600', color: colors.textSecondary, marginBottom: 4 },
  input: { backgroundColor: '#fff', fontSize: 14 },
  gwOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: 12, borderRadius: 10, borderWidth: 2, borderColor: '#E0E0E0',
  },
  gwText: { fontSize: 14, color: '#666' },
  urlBox: {
    flexDirection: 'row', alignItems: 'center', padding: 8,
    borderRadius: 8, backgroundColor: '#F5F7FF', elevation: 0,
  },
});
