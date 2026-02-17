import React from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { Text, Surface, Button, ActivityIndicator, Chip, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import { formatDate } from '@/utils/formatDate';

export default function SubscriptionStatusScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width > 900;

  const { data, isLoading } = useQuery({
    queryKey: ['subscription-current'],
    queryFn: async () => {
      const res = await api.get('/subscription/current');
      return res.data.data;
    },
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ['subscription-payments'],
    queryFn: async () => {
      const res = await api.get('/subscription/payments');
      return res.data.data;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/subscription/cancel');
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscription-current'] });
      Alert.alert('Cancelled', data.message || 'Subscription cancelled.');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to cancel subscription.');
    },
  });

  const handleCancel = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel? Your subscription will remain active until the end of the current billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        { text: 'Cancel', style: 'destructive', onPress: () => cancelMutation.mutate() },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const sub = data?.subscription;
  const hasSub = data?.has_subscription;

  if (!hasSub || !sub) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Surface style={styles.noSubCard}>
          <MaterialCommunityIcons name="shield-off-outline" size={64} color={colors.textSecondary} />
          <Text variant="headlineSmall" style={styles.noSubTitle}>No Active Subscription</Text>
          <Text variant="bodyMedium" style={styles.noSubDesc}>
            Subscribe to a plan to unlock all features and grow your business.
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push('/(app)/subscription/plans' as any)}
            style={styles.selectPlanBtn}
            buttonColor={colors.primary}
            textColor="#fff"
            icon="crown-outline"
          >
            View Plans
          </Button>
        </Surface>
      </ScrollView>
    );
  }

  const statusColorMap: Record<string, string> = {
    active: colors.success,
    trial: colors.warning,
    expired: colors.error,
    cancelled: colors.textSecondary,
    suspended: colors.error,
  };
  const statusColor = statusColorMap[sub.status] || colors.textSecondary;

  const statusIconMap: Record<string, string> = {
    active: 'check-circle',
    trial: 'clock-outline',
    expired: 'alert-circle',
    cancelled: 'close-circle',
    suspended: 'pause-circle',
  };
  const statusIcon = (statusIconMap[sub.status] || 'help-circle') as React.ComponentProps<typeof MaterialCommunityIcons>['name'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status Card */}
      <Surface style={styles.statusCard}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <MaterialCommunityIcons name={statusIcon} size={40} color={statusColor} />
        </View>
        <Text variant="headlineSmall" style={styles.planName}>{sub.plan?.name}</Text>
        <Chip
          style={[styles.statusChip, { backgroundColor: statusColor + '20' }]}
          textStyle={{ color: statusColor, fontWeight: '700', fontSize: 12 }}
          compact
        >
          {sub.status.toUpperCase()}
        </Chip>

        {sub.is_trial && (
          <Text style={styles.trialNotice}>
            Trial period — {sub.days_remaining} days left
          </Text>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{sub.days_remaining}</Text>
            <Text style={styles.statLabel}>Days Left</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{sub.plan?.formatted_price}</Text>
            <Text style={styles.statLabel}>{sub.plan?.billing_cycle === 'monthly' ? '/month' : '/year'}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{sub.auto_renew ? 'On' : 'Off'}</Text>
            <Text style={styles.statLabel}>Auto-Renew</Text>
          </View>
        </View>
      </Surface>

      {/* Details */}
      <Surface style={styles.detailCard}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Subscription Details</Text>
        <Divider style={{ marginVertical: 12 }} />

        <DetailRow label="Plan" value={sub.plan?.name} />
        <DetailRow label="Status" value={sub.status.charAt(0).toUpperCase() + sub.status.slice(1)} />
        <DetailRow label="Price" value={sub.plan?.formatted_price} />
        <DetailRow label="Billing Cycle" value={sub.plan?.billing_cycle === 'monthly' ? 'Monthly' : 'Yearly'} />
        <DetailRow label="Started" value={formatDate(sub.starts_at)} />
        <DetailRow label="Expires" value={formatDate(sub.ends_at)} />
        {sub.trial_ends_at && (
          <DetailRow label="Trial Ends" value={formatDate(sub.trial_ends_at)} />
        )}
        <DetailRow label="Auto Renew" value={sub.auto_renew ? 'Yes' : 'No'} />
      </Surface>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          mode="contained"
          onPress={() => router.push('/(app)/subscription/plans' as any)}
          style={styles.actionBtn}
          buttonColor={colors.primary}
          textColor="#fff"
          icon="swap-horizontal"
        >
          Change Plan
        </Button>
        {sub.status !== 'cancelled' && (
          <Button
            mode="outlined"
            onPress={handleCancel}
            style={styles.actionBtn}
            textColor={colors.error}
            loading={cancelMutation.isPending}
            icon="close-circle-outline"
          >
            Cancel Subscription
          </Button>
        )}
      </View>

      {/* Payment History */}
      <Surface style={styles.detailCard}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Payment History</Text>
        <Divider style={{ marginVertical: 12 }} />

        {paymentsLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : payments?.data?.length > 0 ? (
          payments.data.map((p: any) => (
            <View key={p.id} style={styles.paymentRow}>
              <View style={{ flex: 1 }}>
                <Text variant="labelLarge">{p.plan?.name || 'Subscription'}</Text>
                <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                  {p.gateway?.toUpperCase()} • {formatDate(p.created_at)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text variant="labelLarge" style={{ fontWeight: '700' }}>
                  Rs. {parseFloat(p.amount).toLocaleString('en-PK')}
                </Text>
                <Chip
                  compact
                  style={{
                    backgroundColor: p.status === 'completed' ? colors.success + '20' :
                      p.status === 'pending' ? colors.warning + '20' : colors.error + '20',
                    height: 22,
                  }}
                  textStyle={{
                    fontSize: 10,
                    color: p.status === 'completed' ? colors.success :
                      p.status === 'pending' ? colors.warning : colors.error,
                  }}
                >
                  {p.status.toUpperCase()}
                </Chip>
              </View>
            </View>
          ))
        ) : (
          <Text style={{ color: colors.textSecondary, textAlign: 'center', paddingVertical: 16 }}>
            No payments yet
          </Text>
        )}
      </Surface>
    </ScrollView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  noSubCard: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 2,
    marginTop: 40,
  },
  noSubTitle: { fontWeight: '700', marginTop: 16, color: colors.text },
  noSubDesc: { color: colors.textSecondary, textAlign: 'center', marginTop: 8, maxWidth: 300 },
  selectPlanBtn: { marginTop: 24, borderRadius: 12, paddingVertical: 4 },

  statusCard: {
    padding: spacing.lg,
    borderRadius: 16,
    elevation: 2,
    alignItems: 'center',
    marginBottom: spacing.base,
  },
  statusBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: { fontWeight: '700', color: colors.text },
  statusChip: { marginTop: 8, marginBottom: 12 },
  trialNotice: {
    fontSize: 13,
    color: colors.warning,
    fontWeight: '600',
    backgroundColor: colors.warning + '15',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginVertical: 8,
  },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.base,
    width: '100%',
    justifyContent: 'center',
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: '#E5E7EB' },

  detailCard: {
    padding: spacing.lg,
    borderRadius: 16,
    elevation: 2,
    marginBottom: spacing.base,
  },
  sectionTitle: { fontWeight: '700', color: colors.text },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: { fontSize: 14, color: colors.textSecondary },
  detailValue: { fontSize: 14, fontWeight: '600', color: colors.text },

  actions: { gap: 8, marginBottom: spacing.base },
  actionBtn: { borderRadius: 12 },

  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
});
