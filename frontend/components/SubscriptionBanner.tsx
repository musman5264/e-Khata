import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { usePermissions } from '@/hooks/usePermissions';
import { colors, spacing } from '@/theme';

/**
 * Shows a warning banner when the current business has no active subscription.
 * Place this in the main layout so it's visible on all screens.
 */
export default function SubscriptionBanner() {
  const router = useRouter();
  const currentTenant = useAuthStore((s) => s.currentTenant);
  const { isSuperAdmin } = usePermissions();

  const { data } = useQuery({
    queryKey: ['subscription-current', currentTenant?.id],
    queryFn: async () => {
      const res = await api.get('/subscription/current');
      return res.data.data;
    },
    enabled: !!currentTenant && !isSuperAdmin,
    staleTime: 1000 * 60 * 5,
  });

  // Don't show for super admin or if no tenant selected
  if (isSuperAdmin || !currentTenant) return null;

  // Don't show if subscription data hasn't loaded yet
  if (!data) return null;

  const sub = data?.subscription;
  const hasSub = data?.has_subscription;

  // Active subscription with plenty of time — no banner needed
  if (hasSub && sub?.days_remaining > 7) return null;

  // Trial or expiring soon
  if (hasSub && sub?.days_remaining <= 7) {
    const isTrial = sub?.is_trial;
    return (
      <TouchableOpacity
        style={[styles.banner, styles.warningBanner]}
        onPress={() => router.push('/(app)/subscription/plans' as any)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="clock-alert-outline" size={20} color="#B45309" />
        <Text style={styles.warningText}>
          {isTrial
            ? `Trial expires in ${sub.days_remaining} day${sub.days_remaining !== 1 ? 's' : ''}. Upgrade now!`
            : `Subscription expires in ${sub.days_remaining} day${sub.days_remaining !== 1 ? 's' : ''}. Renew now!`
          }
        </Text>
        <MaterialCommunityIcons name="chevron-right" size={18} color="#B45309" />
      </TouchableOpacity>
    );
  }

  // No subscription at all
  if (!hasSub) {
    return (
      <TouchableOpacity
        style={[styles.banner, styles.errorBanner]}
        onPress={() => router.push('/(app)/subscription/plans' as any)}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="shield-off-outline" size={20} color="#DC2626" />
        <Text style={styles.errorText}>
          No active subscription. Subscribe to unlock all features.
        </Text>
        <MaterialCommunityIcons name="chevron-right" size={18} color="#DC2626" />
      </TouchableOpacity>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: spacing.base,
    gap: 8,
  },
  warningBanner: {
    backgroundColor: '#FEF3C7',
    borderBottomWidth: 1,
    borderBottomColor: '#FCD34D',
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderBottomWidth: 1,
    borderBottomColor: '#FCA5A5',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#B45309',
    fontWeight: '600',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
  },
});
