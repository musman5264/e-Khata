import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { Text, Surface, Button, ActivityIndicator, RadioButton, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

interface Plan {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  formatted_price: string;
  monthly_price: number;
  billing_cycle: 'monthly' | 'yearly';
  duration_days: number;
  trial_days: number;
  max_parties: number;
  max_users: number;
  max_transactions: number;
  has_reports: boolean;
  has_payment_links: boolean;
  has_sms: boolean;
  has_whatsapp: boolean;
}

export default function SubscriptionPlansScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width > 900;

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [gateway, setGateway] = useState<'jazzcash' | 'easypaisa'>('jazzcash');

  const { data: plans, isLoading } = useQuery<Plan[]>({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const res = await api.get('/subscription/plans');
      return res.data.data;
    },
  });

  const { data: currentSub } = useQuery({
    queryKey: ['subscription-current'],
    queryFn: async () => {
      const res = await api.get('/subscription/current');
      return res.data.data;
    },
  });

  const subscribeMutation = useMutation({
    mutationFn: async (data: { plan_id: number; gateway: string }) => {
      const res = await api.post('/subscription/subscribe', data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['subscription-current'] });
      if (data.data?.gateway_response?.redirect_url) {
        Alert.alert('Redirecting', 'You will be redirected to complete payment.');
      } else {
        Alert.alert('Success', data.message || 'Subscription initiated successfully!');
        router.push('/(app)/subscription/status' as any);
      }
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.message || 'Failed to subscribe.');
    },
  });

  const filteredPlans = plans?.filter(p => p.billing_cycle === billingCycle && p.slug !== 'free-trial') || [];
  const trialPlan = plans?.find(p => p.slug === 'free-trial');
  const hasSubscription = currentSub?.has_subscription;

  const handleSubscribe = () => {
    if (!selectedPlan) {
      Alert.alert('Select Plan', 'Please select a subscription plan.');
      return;
    }
    subscribeMutation.mutate({ plan_id: selectedPlan, gateway });
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={styles.title}>Subscription Plans</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Choose a plan that fits your business needs
        </Text>
      </View>

      {/* Current subscription banner */}
      {hasSubscription && (
        <Surface style={styles.currentBanner}>
          <MaterialCommunityIcons name="check-circle" size={24} color={colors.success} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text variant="labelLarge" style={{ fontWeight: '600' }}>
              Active: {currentSub.subscription?.plan?.name}
            </Text>
            <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
              {currentSub.subscription?.days_remaining} days remaining
            </Text>
          </View>
          <Button
            mode="text"
            compact
            onPress={() => router.push('/(app)/subscription/status' as any)}
          >
            Manage
          </Button>
        </Surface>
      )}

      {/* Billing cycle toggle */}
      <Surface style={styles.cycleToggle}>
        <TouchableOpacity
          style={[styles.cycleBtn, billingCycle === 'monthly' && styles.cycleBtnActive]}
          onPress={() => setBillingCycle('monthly')}
        >
          <Text style={[styles.cycleBtnText, billingCycle === 'monthly' && styles.cycleBtnTextActive]}>
            Monthly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cycleBtn, billingCycle === 'yearly' && styles.cycleBtnActive]}
          onPress={() => setBillingCycle('yearly')}
        >
          <Text style={[styles.cycleBtnText, billingCycle === 'yearly' && styles.cycleBtnTextActive]}>
            Yearly
          </Text>
          <Chip style={styles.saveBadge} textStyle={styles.saveBadgeText} compact>Save 17%</Chip>
        </TouchableOpacity>
      </Surface>

      {/* Plans grid */}
      <View style={[styles.plansGrid, isWide && styles.plansGridWide]}>
        {filteredPlans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          return (
            <TouchableOpacity
              key={plan.id}
              style={[styles.planCard, isSelected && styles.planCardSelected, isWide && styles.planCardWide]}
              activeOpacity={0.8}
              onPress={() => setSelectedPlan(plan.id)}
            >
              <Surface style={[styles.planSurface, isSelected && styles.planSurfaceSelected]}>
                {isSelected && (
                  <View style={styles.selectedBadge}>
                    <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                  </View>
                )}
                <Text variant="titleLarge" style={styles.planName}>{plan.name}</Text>
                <Text variant="bodySmall" style={styles.planDesc}>{plan.description}</Text>

                <View style={styles.priceRow}>
                  <Text style={styles.currency}>Rs.</Text>
                  <Text style={styles.priceAmount}>
                    {plan.price.toLocaleString('en-PK')}
                  </Text>
                  <Text style={styles.pricePeriod}>
                    /{plan.billing_cycle === 'monthly' ? 'mo' : 'yr'}
                  </Text>
                </View>

                {plan.billing_cycle === 'yearly' && (
                  <Text style={styles.monthlyEquiv}>
                    Rs. {plan.monthly_price.toLocaleString('en-PK')}/month
                  </Text>
                )}

                <View style={styles.featureList}>
                  <FeatureRow
                    label={plan.max_parties === 0 ? 'Unlimited Parties' : `Up to ${plan.max_parties} Parties`}
                    included
                  />
                  <FeatureRow
                    label={plan.max_users === 0 ? 'Unlimited Users' : `Up to ${plan.max_users} Users`}
                    included
                  />
                  <FeatureRow
                    label={plan.max_transactions === 0 ? 'Unlimited Transactions' : `Up to ${plan.max_transactions} Txns/mo`}
                    included
                  />
                  <FeatureRow label="Reports" included={plan.has_reports} />
                  <FeatureRow label="Payment Links" included={plan.has_payment_links} />
                  <FeatureRow label="SMS Notifications" included={plan.has_sms} />
                  <FeatureRow label="WhatsApp Notifications" included={plan.has_whatsapp} />
                </View>

                {plan.trial_days > 0 && (
                  <Text style={styles.trialNote}>
                    {plan.trial_days}-day free trial included
                  </Text>
                )}
              </Surface>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Payment Gateway Selection */}
      {selectedPlan && !hasSubscription && (
        <Surface style={styles.gatewayCard}>
          <Text variant="titleMedium" style={styles.gatewayTitle}>Payment Method</Text>
          <RadioButton.Group onValueChange={(v) => setGateway(v as any)} value={gateway}>
            <TouchableOpacity
              style={[styles.gatewayOption, gateway === 'jazzcash' && styles.gatewayOptionActive]}
              onPress={() => setGateway('jazzcash')}
            >
              <RadioButton value="jazzcash" color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text variant="labelLarge">JazzCash</Text>
                <Text variant="bodySmall" style={{ color: colors.textSecondary }}>Pay with JazzCash mobile wallet</Text>
              </View>
              <MaterialCommunityIcons name="cellphone" size={24} color="#E4002B" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.gatewayOption, gateway === 'easypaisa' && styles.gatewayOptionActive]}
              onPress={() => setGateway('easypaisa')}
            >
              <RadioButton value="easypaisa" color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text variant="labelLarge">EasyPaisa</Text>
                <Text variant="bodySmall" style={{ color: colors.textSecondary }}>Pay with EasyPaisa mobile wallet</Text>
              </View>
              <MaterialCommunityIcons name="cellphone" size={24} color="#36B37E" />
            </TouchableOpacity>
          </RadioButton.Group>

          <Button
            mode="contained"
            onPress={handleSubscribe}
            loading={subscribeMutation.isPending}
            disabled={subscribeMutation.isPending}
            style={styles.subscribeBtn}
            buttonColor={colors.primary}
            textColor="#fff"
            icon="credit-card-check-outline"
          >
            Subscribe Now
          </Button>
        </Surface>
      )}

      {/* Free trial card at bottom */}
      {trialPlan && !hasSubscription && (
        <Surface style={styles.trialCard}>
          <MaterialCommunityIcons name="gift-outline" size={32} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text variant="titleMedium" style={{ fontWeight: '600' }}>Start Free Trial</Text>
            <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
              Try e-Khata free for {trialPlan.trial_days} days. No payment required.
            </Text>
          </View>
          <Button
            mode="outlined"
            compact
            onPress={() => {
              setSelectedPlan(trialPlan.id);
              subscribeMutation.mutate({ plan_id: trialPlan.id, gateway: 'jazzcash' });
            }}
            loading={subscribeMutation.isPending}
          >
            Start Trial
          </Button>
        </Surface>
      )}
    </ScrollView>
  );
}

function FeatureRow({ label, included }: { label: string; included: boolean }) {
  return (
    <View style={styles.featureRow}>
      <MaterialCommunityIcons
        name={included ? 'check-circle' : 'close-circle'}
        size={18}
        color={included ? colors.success : colors.textDisabled}
      />
      <Text style={[styles.featureLabel, !included && styles.featureLabelDisabled]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: { marginBottom: spacing.lg, alignItems: 'center' },
  title: { fontWeight: '700', color: colors.text },
  subtitle: { color: colors.textSecondary, marginTop: 4 },

  currentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    borderRadius: 12,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    elevation: 2,
  },

  cycleToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: spacing.lg,
    alignSelf: 'center',
    elevation: 2,
  },
  cycleBtn: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cycleBtnActive: {
    backgroundColor: colors.primary,
  },
  cycleBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  cycleBtnTextActive: {
    color: '#fff',
  },
  saveBadge: {
    backgroundColor: colors.success,
    height: 22,
  },
  saveBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
  },

  plansGrid: { gap: spacing.base, marginBottom: spacing.lg },
  plansGridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  planCard: { flex: 1 },
  planCardWide: { minWidth: 300, maxWidth: '48%' as any },
  planCardSelected: {},
  planSurface: {
    padding: spacing.lg,
    borderRadius: 16,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  planSurfaceSelected: {
    borderColor: colors.primary,
    elevation: 4,
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planName: { fontWeight: '700', color: colors.text, marginBottom: 4 },
  planDesc: { color: colors.textSecondary, marginBottom: spacing.base, lineHeight: 18 },

  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  currency: { fontSize: 16, fontWeight: '600', color: colors.primary, marginRight: 2 },
  priceAmount: { fontSize: 36, fontWeight: '800', color: colors.primary },
  pricePeriod: { fontSize: 14, color: colors.textSecondary, marginLeft: 2 },
  monthlyEquiv: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.base },

  featureList: { marginTop: spacing.sm, gap: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureLabel: { fontSize: 13, color: colors.text },
  featureLabelDisabled: { color: colors.textDisabled, textDecorationLine: 'line-through' },

  trialNote: {
    marginTop: spacing.base,
    fontSize: 12,
    color: colors.success,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: '#E8F8F5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },

  gatewayCard: {
    padding: spacing.lg,
    borderRadius: 16,
    elevation: 2,
    marginBottom: spacing.lg,
  },
  gatewayTitle: { fontWeight: '700', marginBottom: spacing.sm },
  gatewayOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  gatewayOptionActive: {
    borderColor: colors.primary,
    backgroundColor: '#F0F1FF',
  },

  subscribeBtn: {
    marginTop: spacing.base,
    borderRadius: 12,
    paddingVertical: 4,
  },

  trialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
});
