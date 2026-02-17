import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { Text, Surface, Button, ActivityIndicator, TextInput, Chip, Divider, Menu, DataTable, Portal, Modal, Switch, RadioButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import { formatDate } from '@/utils/formatDate';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface Tab { key: string; label: string; icon: IconName; }

const TABS: Tab[] = [
  { key: 'stats', label: 'Overview', icon: 'chart-bar' },
  { key: 'plans', label: 'Plans', icon: 'tag-outline' },
  { key: 'subscriptions', label: 'Subscriptions', icon: 'account-group-outline' },
  { key: 'payments', label: 'Payments', icon: 'credit-card-outline' },
];

export default function AdminSubscriptionsScreen() {
  const [activeTab, setActiveTab] = useState('stats');
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width > 900;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={18}
              color={activeTab === tab.key ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {activeTab === 'stats' && <StatsPanel />}
      {activeTab === 'plans' && <PlansPanel />}
      {activeTab === 'subscriptions' && <SubscriptionsPanel />}
      {activeTab === 'payments' && <PaymentsPanel />}
    </ScrollView>
  );
}

/* ── Stats Panel ───────────────────────────── */
function StatsPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-subscription-stats'],
    queryFn: async () => {
      const res = await api.get('/admin/subscription/stats');
      return res.data.data;
    },
  });

  if (isLoading) return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />;

  const stats = [
    { label: 'Total Plans', value: data?.plans?.total ?? 0, icon: 'tag-multiple', color: '#6366F1' },
    { label: 'Active Plans', value: data?.plans?.active ?? 0, icon: 'tag-check', color: '#10B981' },
    { label: 'Active Subscriptions', value: data?.subscriptions?.active ?? 0, icon: 'check-circle', color: '#22C55E' },
    { label: 'Trial Users', value: data?.subscriptions?.trial ?? 0, icon: 'clock-outline', color: '#F59E0B' },
    { label: 'Expired', value: data?.subscriptions?.expired ?? 0, icon: 'alert-circle', color: '#EF4444' },
    { label: 'Without Subscription', value: data?.tenants_without_subscription ?? 0, icon: 'shield-off', color: '#DC2626' },
  ];

  return (
    <View>
      <View style={styles.statsGrid}>
        {stats.map((stat) => (
          <Surface key={stat.label} style={styles.statCard}>
            <MaterialCommunityIcons name={stat.icon as IconName} size={28} color={stat.color} />
            <Text variant="headlineMedium" style={[styles.statValue, { color: stat.color }]}>
              {stat.value}
            </Text>
            <Text variant="bodySmall" style={styles.statLabel}>{stat.label}</Text>
          </Surface>
        ))}
      </View>

      {/* Revenue summary */}
      {data?.revenue && (
        <Surface style={styles.revenueCard}>
          <Text variant="titleMedium" style={styles.sectionTitle}>Revenue</Text>
          <Divider style={{ marginVertical: 12 }} />
          <View style={styles.revenueRow}>
            <View style={styles.revenueItem}>
              <Text style={styles.revenueAmount}>Rs. {(data.revenue.total ?? 0).toLocaleString('en-PK')}</Text>
              <Text style={styles.revenueLabel}>Total Revenue</Text>
            </View>
            <View style={styles.revenueItem}>
              <Text style={styles.revenueAmount}>Rs. {(data.revenue.this_month ?? 0).toLocaleString('en-PK')}</Text>
              <Text style={styles.revenueLabel}>This Month</Text>
            </View>
          </View>
        </Surface>
      )}
    </View>
  );
}

/* ── Plans Panel ───────────────────────────── */
function PlansPanel() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editPlan, setEditPlan] = useState<any>(null);
  const [form, setForm] = useState({
    name: '', slug: '', description: '', price: '', billing_cycle: 'monthly',
    duration_days: '30', max_parties: '0', max_users: '0', max_transactions: '0',
    has_reports: true, has_payment_links: true, has_sms: false, has_whatsapp: false,
    trial_days: '7', is_active: true, sort_order: '0',
  });

  const { data: plans, isLoading } = useQuery({
    queryKey: ['admin-subscription-plans'],
    queryFn: async () => {
      const res = await api.get('/admin/subscription/plans');
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editPlan) {
        return (await api.put(`/admin/subscription/plans/${editPlan.id}`, data)).data;
      }
      return (await api.post('/admin/subscription/plans', data)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-plans'] });
      resetForm();
      Alert.alert('Success', editPlan ? 'Plan updated.' : 'Plan created.');
    },
    onError: (e: any) => Alert.alert('Error', e.response?.data?.message || 'Failed.'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => (await api.delete(`/admin/subscription/plans/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-plans'] });
      Alert.alert('Success', 'Plan deleted.');
    },
    onError: (e: any) => Alert.alert('Error', e.response?.data?.message || 'Failed.'),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditPlan(null);
    setForm({
      name: '', slug: '', description: '', price: '', billing_cycle: 'monthly',
      duration_days: '30', max_parties: '0', max_users: '0', max_transactions: '0',
      has_reports: true, has_payment_links: true, has_sms: false, has_whatsapp: false,
      trial_days: '7', is_active: true, sort_order: '0',
    });
  };

  const openEdit = (plan: any) => {
    setEditPlan(plan);
    setForm({
      name: plan.name, slug: plan.slug, description: plan.description || '',
      price: String(plan.price), billing_cycle: plan.billing_cycle,
      duration_days: String(plan.duration_days), max_parties: String(plan.max_parties),
      max_users: String(plan.max_users), max_transactions: String(plan.max_transactions),
      has_reports: plan.has_reports, has_payment_links: plan.has_payment_links,
      has_sms: plan.has_sms, has_whatsapp: plan.has_whatsapp,
      trial_days: String(plan.trial_days), is_active: plan.is_active,
      sort_order: String(plan.sort_order),
    });
    setShowForm(true);
  };

  const handleSave = () => {
    createMutation.mutate({
      ...form,
      price: parseFloat(form.price) || 0,
      duration_days: parseInt(form.duration_days) || 30,
      max_parties: parseInt(form.max_parties) || 0,
      max_users: parseInt(form.max_users) || 0,
      max_transactions: parseInt(form.max_transactions) || 0,
      trial_days: parseInt(form.trial_days) || 0,
      sort_order: parseInt(form.sort_order) || 0,
    });
  };

  if (isLoading) return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />;

  return (
    <View>
      <View style={styles.sectionHeader}>
        <Text variant="titleMedium" style={styles.sectionTitle}>Plans ({plans?.length || 0})</Text>
        <Button mode="contained" compact icon="plus" onPress={() => { resetForm(); setShowForm(true); }}
          buttonColor={colors.primary} textColor="#fff">
          New Plan
        </Button>
      </View>

      {/* Plan form */}
      {showForm && (
        <Surface style={styles.formCard}>
          <Text variant="titleMedium" style={{ fontWeight: '700', marginBottom: 12 }}>
            {editPlan ? 'Edit Plan' : 'Create Plan'}
          </Text>
          <TextInput label="Name" value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} mode="outlined" style={styles.formInput} />
          <TextInput label="Slug" value={form.slug} onChangeText={v => setForm(p => ({ ...p, slug: v }))} mode="outlined" style={styles.formInput} />
          <TextInput label="Description" value={form.description} onChangeText={v => setForm(p => ({ ...p, description: v }))} mode="outlined" multiline style={styles.formInput} />
          <View style={styles.formRow}>
            <TextInput label="Price (Rs.)" value={form.price} onChangeText={v => setForm(p => ({ ...p, price: v }))} mode="outlined" keyboardType="numeric" style={[styles.formInput, { flex: 1 }]} />
            <TextInput label="Duration (days)" value={form.duration_days} onChangeText={v => setForm(p => ({ ...p, duration_days: v }))} mode="outlined" keyboardType="numeric" style={[styles.formInput, { flex: 1 }]} />
          </View>

          <Text variant="labelLarge" style={{ marginTop: 8 }}>Billing Cycle</Text>
          <RadioButton.Group onValueChange={v => setForm(p => ({ ...p, billing_cycle: v }))} value={form.billing_cycle}>
            <View style={styles.formRow}>
              <RadioButton.Item label="Monthly" value="monthly" style={{ flex: 1 }} />
              <RadioButton.Item label="Yearly" value="yearly" style={{ flex: 1 }} />
            </View>
          </RadioButton.Group>

          <View style={styles.formRow}>
            <TextInput label="Max Parties (0=∞)" value={form.max_parties} onChangeText={v => setForm(p => ({ ...p, max_parties: v }))} mode="outlined" keyboardType="numeric" style={[styles.formInput, { flex: 1 }]} />
            <TextInput label="Max Users (0=∞)" value={form.max_users} onChangeText={v => setForm(p => ({ ...p, max_users: v }))} mode="outlined" keyboardType="numeric" style={[styles.formInput, { flex: 1 }]} />
            <TextInput label="Max Txns (0=∞)" value={form.max_transactions} onChangeText={v => setForm(p => ({ ...p, max_transactions: v }))} mode="outlined" keyboardType="numeric" style={[styles.formInput, { flex: 1 }]} />
          </View>

          <TextInput label="Trial Days" value={form.trial_days} onChangeText={v => setForm(p => ({ ...p, trial_days: v }))} mode="outlined" keyboardType="numeric" style={styles.formInput} />
          <TextInput label="Sort Order" value={form.sort_order} onChangeText={v => setForm(p => ({ ...p, sort_order: v }))} mode="outlined" keyboardType="numeric" style={styles.formInput} />

          <View style={styles.switchesGrid}>
            <SwitchRow label="Reports" value={form.has_reports} onChange={v => setForm(p => ({ ...p, has_reports: v }))} />
            <SwitchRow label="Payment Links" value={form.has_payment_links} onChange={v => setForm(p => ({ ...p, has_payment_links: v }))} />
            <SwitchRow label="SMS" value={form.has_sms} onChange={v => setForm(p => ({ ...p, has_sms: v }))} />
            <SwitchRow label="WhatsApp" value={form.has_whatsapp} onChange={v => setForm(p => ({ ...p, has_whatsapp: v }))} />
            <SwitchRow label="Active" value={form.is_active} onChange={v => setForm(p => ({ ...p, is_active: v }))} />
          </View>

          <View style={styles.formActions}>
            <Button mode="text" onPress={resetForm}>Cancel</Button>
            <Button mode="contained" onPress={handleSave} loading={createMutation.isPending}
              buttonColor={colors.primary} textColor="#fff">
              {editPlan ? 'Update' : 'Create'}
            </Button>
          </View>
        </Surface>
      )}

      {/* Plans list */}
      {plans?.map((plan: any) => (
        <Surface key={plan.id} style={styles.planCard}>
          <View style={styles.planHeader}>
            <View style={{ flex: 1 }}>
              <Text variant="titleMedium" style={{ fontWeight: '700' }}>{plan.name}</Text>
              <Text variant="bodySmall" style={{ color: colors.textSecondary }}>{plan.slug}</Text>
            </View>
            <Chip compact style={{ backgroundColor: plan.is_active ? colors.success + '20' : colors.error + '20' }}
              textStyle={{ color: plan.is_active ? colors.success : colors.error, fontSize: 11 }}>
              {plan.is_active ? 'Active' : 'Inactive'}
            </Chip>
          </View>
          <View style={styles.planMeta}>
            <Text style={styles.planPrice}>Rs. {parseFloat(plan.price).toLocaleString('en-PK')}</Text>
            <Text style={styles.planCycle}>/{plan.billing_cycle}</Text>
            <Text style={{ color: colors.textSecondary, marginLeft: 8, fontSize: 12 }}>
              • {plan.subscriptions_count ?? 0} subscribers
            </Text>
          </View>
          <View style={styles.planActions}>
            <Button mode="text" compact onPress={() => openEdit(plan)} icon="pencil">Edit</Button>
            <Button mode="text" compact onPress={() => {
              Alert.alert('Delete Plan', `Are you sure you want to delete "${plan.name}"?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(plan.id) },
              ]);
            }} icon="delete" textColor={colors.error}>Delete</Button>
          </View>
        </Surface>
      ))}
    </View>
  );
}

/* ── Subscriptions Panel ───────────────────── */
function SubscriptionsPanel() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-subscriptions', statusFilter],
    queryFn: async () => {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/admin/subscription/list', { params });
      return res.data.data;
    },
  });

  const extendMutation = useMutation({
    mutationFn: async ({ id, days }: { id: number; days: number }) => {
      return (await api.put(`/admin/subscription/${id}/extend`, { days })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      Alert.alert('Success', 'Subscription extended.');
    },
    onError: (e: any) => Alert.alert('Error', e.response?.data?.message || 'Failed.'),
  });

  const suspendMutation = useMutation({
    mutationFn: async (id: number) => {
      return (await api.put(`/admin/subscription/${id}/suspend`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      Alert.alert('Success', 'Subscription suspended.');
    },
    onError: (e: any) => Alert.alert('Error', e.response?.data?.message || 'Failed.'),
  });

  const statusColors: Record<string, string> = {
    active: colors.success, trial: colors.warning, expired: colors.error,
    cancelled: colors.textSecondary, suspended: colors.error,
  };

  if (isLoading) return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />;

  return (
    <View>
      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.base }}>
        {['', 'active', 'trial', 'expired', 'cancelled', 'suspended'].map(status => (
          <Chip
            key={status}
            selected={statusFilter === status}
            onPress={() => setStatusFilter(status)}
            style={{ marginRight: 8 }}
            compact
          >
            {status || 'All'}
          </Chip>
        ))}
      </ScrollView>

      {/* List */}
      {data?.data?.map((sub: any) => (
        <Surface key={sub.id} style={styles.subCard}>
          <View style={styles.subHeader}>
            <View style={{ flex: 1 }}>
              <Text variant="titleSmall" style={{ fontWeight: '700' }}>
                {sub.tenant?.name || `Tenant #${sub.tenant_id}`}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                {sub.plan?.name} • {sub.plan?.billing_cycle}
              </Text>
            </View>
            <Chip compact style={{ backgroundColor: (statusColors[sub.status] || '#999') + '20' }}
              textStyle={{ color: statusColors[sub.status] || '#999', fontSize: 11, fontWeight: '600' }}>
              {sub.status.toUpperCase()}
            </Chip>
          </View>
          <View style={styles.subMeta}>
            <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
              {formatDate(sub.starts_at)} → {formatDate(sub.ends_at)}
            </Text>
          </View>
          <View style={styles.subActions}>
            <Button mode="text" compact icon="clock-plus-outline" onPress={() => {
              Alert.prompt ? Alert.prompt('Extend', 'Enter days to add:', (days) => {
                extendMutation.mutate({ id: sub.id, days: parseInt(days) || 30 });
              }) : extendMutation.mutate({ id: sub.id, days: 30 });
            }}>+30 Days</Button>
            {sub.status !== 'suspended' && (
              <Button mode="text" compact icon="pause-circle-outline" textColor={colors.warning}
                onPress={() => suspendMutation.mutate(sub.id)}>Suspend</Button>
            )}
          </View>
        </Surface>
      ))}

      {(!data?.data || data.data.length === 0) && (
        <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 40 }}>
          No subscriptions found
        </Text>
      )}
    </View>
  );
}

/* ── Payments Panel ────────────────────────── */
function PaymentsPanel() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-subscription-payments'],
    queryFn: async () => {
      const res = await api.get('/admin/subscription/payments');
      return res.data.data;
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async (id: number) => {
      return (await api.post(`/admin/subscription/payments/${id}/mark-paid`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-subscription-payments'] });
      Alert.alert('Success', 'Payment marked as completed.');
    },
    onError: (e: any) => Alert.alert('Error', e.response?.data?.message || 'Failed.'),
  });

  const statusColors: Record<string, string> = {
    completed: colors.success, pending: colors.warning, failed: colors.error, refunded: colors.textSecondary,
  };

  if (isLoading) return <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />;

  return (
    <View>
      {/* Revenue Summary */}
      {data?.revenue_summary && (
        <Surface style={styles.revenueCard}>
          <View style={styles.revenueRow}>
            <View style={styles.revenueItem}>
              <Text style={styles.revenueAmount}>
                Rs. {(data.revenue_summary.total ?? 0).toLocaleString('en-PK')}
              </Text>
              <Text style={styles.revenueLabel}>Total</Text>
            </View>
            <View style={styles.revenueItem}>
              <Text style={styles.revenueAmount}>
                Rs. {(data.revenue_summary.this_month ?? 0).toLocaleString('en-PK')}
              </Text>
              <Text style={styles.revenueLabel}>This Month</Text>
            </View>
          </View>
        </Surface>
      )}

      {/* Payments list */}
      {data?.payments?.data?.map((p: any) => (
        <Surface key={p.id} style={styles.paymentCard}>
          <View style={styles.paymentHeader}>
            <View style={{ flex: 1 }}>
              <Text variant="labelLarge" style={{ fontWeight: '600' }}>
                {p.tenant?.name || `Tenant #${p.tenant_id}`}
              </Text>
              <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                {p.plan?.name} • {p.gateway?.toUpperCase()} • {formatDate(p.created_at)}
              </Text>
              {p.user && <Text variant="bodySmall" style={{ color: colors.textSecondary }}>Paid by: {p.user.name}</Text>}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text variant="titleMedium" style={{ fontWeight: '700', color: colors.primary }}>
                Rs. {parseFloat(p.amount).toLocaleString('en-PK')}
              </Text>
              <Chip compact style={{ backgroundColor: (statusColors[p.status] || '#999') + '20', marginTop: 4 }}
                textStyle={{ color: statusColors[p.status] || '#999', fontSize: 10, fontWeight: '600' }}>
                {p.status.toUpperCase()}
              </Chip>
            </View>
          </View>
          {p.status === 'pending' && (
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 }}>
              <Button mode="text" compact icon="check-circle" onPress={() => markPaidMutation.mutate(p.id)}
                loading={markPaidMutation.isPending}>Mark Paid</Button>
            </View>
          )}
        </Surface>
      ))}

      {(!data?.payments?.data || data.payments.data.length === 0) && (
        <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 40 }}>
          No payments found
        </Text>
      )}
    </View>
  );
}

/* ── Helpers ───────────────────────────────── */
function SwitchRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.switchRow}>
      <Text variant="bodyMedium">{label}</Text>
      <Switch value={value} onValueChange={onChange} color={colors.primary} />
    </View>
  );
}

/* ── Styles ────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: 40 },

  tabBar: { marginBottom: spacing.lg, maxHeight: 50 },
  tab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 16,
    borderRadius: 20, marginRight: 8,
    backgroundColor: colors.surface,
  },
  tabActive: { backgroundColor: colors.primary + '15' },
  tabText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: colors.primary },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  statCard: {
    padding: spacing.base, borderRadius: 12, alignItems: 'center',
    elevation: 2, width: '47%' as any, minWidth: 140,
  },
  statValue: { fontSize: 28, fontWeight: '800', marginVertical: 4 },
  statLabel: { color: colors.textSecondary, textAlign: 'center', fontSize: 12 },

  revenueCard: { padding: spacing.lg, borderRadius: 16, elevation: 2, marginBottom: spacing.lg },
  revenueRow: { flexDirection: 'row', justifyContent: 'space-around' },
  revenueItem: { alignItems: 'center' },
  revenueAmount: { fontSize: 22, fontWeight: '700', color: colors.primary },
  revenueLabel: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.base },
  sectionTitle: { fontWeight: '700', color: colors.text },

  formCard: { padding: spacing.lg, borderRadius: 16, elevation: 2, marginBottom: spacing.lg },
  formInput: { marginBottom: 8, backgroundColor: '#fff' },
  formRow: { flexDirection: 'row', gap: 8 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
  switchesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12, marginBottom: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 140 },

  planCard: { padding: spacing.base, borderRadius: 12, elevation: 2, marginBottom: spacing.sm },
  planHeader: { flexDirection: 'row', alignItems: 'center' },
  planMeta: { flexDirection: 'row', alignItems: 'baseline', marginTop: 4 },
  planPrice: { fontSize: 18, fontWeight: '700', color: colors.primary },
  planCycle: { fontSize: 13, color: colors.textSecondary },
  planActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },

  subCard: { padding: spacing.base, borderRadius: 12, elevation: 2, marginBottom: spacing.sm },
  subHeader: { flexDirection: 'row', alignItems: 'center' },
  subMeta: { marginTop: 4 },
  subActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },

  paymentCard: { padding: spacing.base, borderRadius: 12, elevation: 2, marginBottom: spacing.sm },
  paymentHeader: { flexDirection: 'row', alignItems: 'flex-start' },
});
