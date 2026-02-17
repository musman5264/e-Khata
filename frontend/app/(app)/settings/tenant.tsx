import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { TextInput, Button, Text, Switch, Surface, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import LoadingOverlay from '@/components/LoadingOverlay';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface Tab { key: string; label: string; icon: IconName; color: string; }

const TABS: Tab[] = [
  { key: 'general', label: 'General', icon: 'domain', color: '#6366F1' },
  { key: 'preferences', label: 'Preferences', icon: 'cog-outline', color: '#10B981' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp', color: '#25D366' },
  { key: 'payments', label: 'Payments', icon: 'credit-card-outline', color: '#F59E0B' },
];

export default function TenantSettingsScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width > 900;

  const [activeTab, setActiveTab] = useState('general');
  const [form, setForm] = useState({ name: '', business_type: '', address: '', phone: '', city: '', email: '' });
  const [settings, setSettings] = useState<Record<string, any>>({});

  const { data: tenant } = useQuery({
    queryKey: ['current-tenant'],
    queryFn: async () => {
      const res = await api.get('/tenants/current');
      return res.data.data;
    },
  });

  useEffect(() => {
    if (tenant) {
      setForm({
        name: tenant.name || '', business_type: tenant.business_type || '',
        address: tenant.address || '', phone: tenant.phone || '',
        city: tenant.city || '', email: tenant.email || '',
      });
      setSettings(tenant.settings || {});
    }
  }, [tenant]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/tenants/${tenant?.id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-tenant'] });
      Alert.alert(t('common.success'), 'Business settings saved successfully.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save settings.');
    },
  });

  const handleSave = () => { mutation.mutate({ ...form, settings }); };
  const updateSetting = (key: string, value: any) => { setSettings((prev) => ({ ...prev, [key]: value })); };
  const currentTab = TABS.find((t) => t.key === activeTab)!;

  return (
    <View style={styles.outerContainer}>
      <LoadingOverlay visible={mutation.isPending} message="Saving settings..." />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity key={tab.key} style={[styles.tabChip, active && { backgroundColor: tab.color + '15', borderColor: tab.color }]}
              onPress={() => setActiveTab(tab.key)} activeOpacity={0.7}>
              <MaterialCommunityIcons name={tab.icon} size={16} color={active ? tab.color : '#8A8FA8'} />
              <Text style={[styles.tabLabel, active && { color: tab.color, fontWeight: '600' }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={[styles.content, isWide && { maxWidth: 720 }]}>
        <View style={styles.tabHeader}>
          <View style={[styles.tabHeaderIcon, { backgroundColor: currentTab.color + '15' }]}>
            <MaterialCommunityIcons name={currentTab.icon} size={24} color={currentTab.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tabTitle}>{currentTab.label} Settings</Text>
            <Text style={styles.tabSubtitle}>Configure your business {currentTab.label.toLowerCase()}</Text>
          </View>
        </View>

        {activeTab === 'general' && (
          <Surface style={styles.card}>
            <Text style={styles.groupTitle}>Business Information</Text>
            <Divider style={{ marginBottom: 16 }} />
            <TextInput label="Business Name" value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} mode="outlined" style={styles.input} left={<TextInput.Icon icon="domain" />} />
            <TextInput label="Business Type" value={form.business_type} onChangeText={(v) => setForm((p) => ({ ...p, business_type: v }))} mode="outlined" style={styles.input} left={<TextInput.Icon icon="briefcase-outline" />} placeholder="e.g. Retail, Wholesale" />
            <TextInput label="Email" value={form.email} onChangeText={(v) => setForm((p) => ({ ...p, email: v }))} mode="outlined" style={styles.input} left={<TextInput.Icon icon="email-outline" />} keyboardType="email-address" />
            <TextInput label="Phone" value={form.phone} onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))} mode="outlined" style={styles.input} left={<TextInput.Icon icon="phone" />} keyboardType="phone-pad" />
            <TextInput label="City" value={form.city} onChangeText={(v) => setForm((p) => ({ ...p, city: v }))} mode="outlined" style={styles.input} left={<TextInput.Icon icon="map-marker" />} />
            <TextInput label="Address" value={form.address} multiline numberOfLines={2} onChangeText={(v) => setForm((p) => ({ ...p, address: v }))} mode="outlined" style={styles.input} left={<TextInput.Icon icon="home-outline" />} />
          </Surface>
        )}

        {activeTab === 'preferences' && (
          <>
            <Surface style={styles.card}>
              <Text style={styles.groupTitle}>Accounting Preferences</Text>
              <Divider style={{ marginBottom: 16 }} />
              <SwitchRow label="Require Description" desc="Require description for every transaction" value={settings.require_description} onToggle={(v) => updateSetting('require_description', v)} />
              <SwitchRow label="Require Reference Number" desc="Require reference/invoice number" value={settings.require_reference_number} onToggle={(v) => updateSetting('require_reference_number', v)} />
              <SwitchRow label="Allow Future Dates" desc="Allow transactions dated in the future" value={settings.allow_future_dates} onToggle={(v) => updateSetting('allow_future_dates', v)} />
              <SwitchRow label="Allow Negative Balance" desc="Allow party balances to go negative" value={settings.allow_negative_balance} onToggle={(v) => updateSetting('allow_negative_balance', v)} />
              <SwitchRow label="Auto-Share on Transaction" desc="Auto share ledger via WhatsApp on new transaction" value={settings.auto_share_on_transaction} onToggle={(v) => updateSetting('auto_share_on_transaction', v)} />
            </Surface>
            <Surface style={styles.card}>
              <Text style={styles.groupTitle}>Regional Settings</Text>
              <Divider style={{ marginBottom: 16 }} />
              <TextInput label="Currency" value={settings.currency || 'PKR'} onChangeText={(v) => updateSetting('currency', v)} mode="outlined" style={styles.input} />
              <TextInput label="Currency Symbol" value={settings.currency_symbol || 'Rs.'} onChangeText={(v) => updateSetting('currency_symbol', v)} mode="outlined" style={styles.input} />
              <TextInput label="Balance Alert Threshold" value={String(settings.balance_alert_threshold || 50000)} onChangeText={(v) => updateSetting('balance_alert_threshold', parseInt(v) || 0)} mode="outlined" style={styles.input} keyboardType="numeric" />
            </Surface>
          </>
        )}

        {activeTab === 'whatsapp' && (
          <Surface style={styles.card}>
            <View style={styles.groupHeader}>
              <View style={[styles.groupIcon, { backgroundColor: '#25D36615' }]}>
                <MaterialCommunityIcons name="whatsapp" size={20} color="#25D366" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.groupTitle}>WhatsApp Direct (wa.me)</Text>
                <Text style={styles.groupDesc}>Enable click-to-chat links for your business. No API required — uses standard WhatsApp URLs for ledger sharing, payment reminders, etc.</Text>
              </View>
            </View>
            <Divider style={{ marginBottom: 16 }} />
            <SwitchRow label="Enable WhatsApp Direct" desc="Turn on click-to-chat WhatsApp links for this business" value={settings.whatsapp_direct_enabled} onToggle={(v) => updateSetting('whatsapp_direct_enabled', v)} />
            {settings.whatsapp_direct_enabled && (
              <>
                <TextInput label="WhatsApp Number" value={settings.whatsapp_direct_number || ''} onChangeText={(v) => updateSetting('whatsapp_direct_number', v)} mode="outlined" style={styles.input} left={<TextInput.Icon icon="phone" />} placeholder="923001234567" keyboardType="phone-pad" />
                <TextInput label="Default Message" value={settings.whatsapp_direct_message || ''} onChangeText={(v) => updateSetting('whatsapp_direct_message', v)} mode="outlined" style={styles.input} left={<TextInput.Icon icon="message-text" />} multiline numberOfLines={3} placeholder="Hello! This is regarding your account with us." />
                <TextInput label="Support WhatsApp Number" value={settings.whatsapp_direct_support_number || ''} onChangeText={(v) => updateSetting('whatsapp_direct_support_number', v)} mode="outlined" style={styles.input} left={<TextInput.Icon icon="headset" />} placeholder="Support contact number" keyboardType="phone-pad" />
                <SwitchRow label="Show on Ledger" desc="Show WhatsApp chat button on party ledger screens" value={settings.whatsapp_direct_show_on_ledger} onToggle={(v) => updateSetting('whatsapp_direct_show_on_ledger', v)} />
                <SwitchRow label="Share Ledger via WhatsApp" desc="Allow sharing ledger summary via WhatsApp direct link" value={settings.whatsapp_direct_share_ledger} onToggle={(v) => updateSetting('whatsapp_direct_share_ledger', v)} />
              </>
            )}
          </Surface>
        )}

        {activeTab === 'payments' && (
          <Surface style={styles.card}>
            <Text style={styles.groupTitle}>Payment Gateways</Text>
            <Divider style={{ marginBottom: 16 }} />
            <SwitchRow label="JazzCash" desc="Enable JazzCash payment collection" value={settings.payment_gateways?.jazzcash} onToggle={(v) => updateSetting('payment_gateways', { ...settings.payment_gateways, jazzcash: v })} />
            <SwitchRow label="EasyPaisa" desc="Enable EasyPaisa payment collection" value={settings.payment_gateways?.easypaisa} onToggle={(v) => updateSetting('payment_gateways', { ...settings.payment_gateways, easypaisa: v })} />
          </Surface>
        )}

        <View style={styles.saveRow}>
          <Button mode="contained" onPress={handleSave} loading={mutation.isPending} style={styles.saveBtn} buttonColor={currentTab.color} icon="content-save">
            Save {currentTab.label} Settings
          </Button>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function SwitchRow({ label, desc, value, onToggle }: { label: string; desc?: string; value: boolean; onToggle: (v: boolean) => void }) {
  return (
    <View style={styles.switchRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {desc && <Text style={styles.fieldDesc}>{desc}</Text>}
      </View>
      <Switch value={!!value} onValueChange={onToggle} color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#F5F6FA' },
  tabBar: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ECEEF5', maxHeight: 56 },
  tabBarContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tabChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff' },
  tabLabel: { fontSize: 12, fontWeight: '500', color: '#8A8FA8' },
  content: { padding: 20 },
  tabHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  tabHeaderIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  tabTitle: { fontSize: 20, fontWeight: '700', color: '#1B2B65' },
  tabSubtitle: { fontSize: 12, color: '#8A8FA8', marginTop: 2 },
  card: { padding: 20, borderRadius: 16, marginBottom: 16, elevation: 1, backgroundColor: '#fff' },
  groupHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  groupIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  groupTitle: { fontSize: 15, fontWeight: '700', color: '#1B2B65', marginBottom: 4 },
  groupDesc: { fontSize: 11, color: '#8A8FA8', marginTop: 3, lineHeight: 16 },
  input: { marginBottom: 12, backgroundColor: 'transparent' },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 4, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#1B2B65' },
  fieldDesc: { fontSize: 11, color: '#8A8FA8', marginTop: 3, lineHeight: 15 },
  saveRow: { paddingTop: 4 },
  saveBtn: { borderRadius: 12, paddingVertical: 4 },
});
