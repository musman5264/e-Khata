import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { TextInput, Button, Text, Switch, Surface, Divider, ActivityIndicator, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import SearchableDropdown, { DropdownItem } from '@/components/SearchableDropdown';
import LoadingOverlay from '@/components/LoadingOverlay';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/* ─── Dropdown options for setting keys ─── */
const SETTING_OPTIONS: Record<string, DropdownItem[]> = {
  sms_provider: [
    { label: 'None', value: 'none' },
    { label: 'Twilio', value: 'twilio' },
    { label: 'Local SMS Gateway', value: 'local' },
    { label: 'Vonage (Nexmo)', value: 'vonage' },
    { label: 'MessageBird', value: 'messagebird' },
  ],
  email_provider: [
    { label: 'SMTP', value: 'smtp' },
    { label: 'Mailgun', value: 'mailgun' },
    { label: 'Amazon SES', value: 'ses' },
    { label: 'SendGrid', value: 'sendgrid' },
    { label: 'Postmark', value: 'postmark' },
  ],
  push_provider: [
    { label: 'Firebase (FCM)', value: 'firebase' },
    { label: 'OneSignal', value: 'onesignal' },
    { label: 'Expo Push', value: 'expo' },
  ],
  whatsapp_provider: [
    { label: 'Meta (Official API)', value: 'meta' },
    { label: 'Twilio for WhatsApp', value: 'twilio' },
    { label: 'MessageBird', value: 'messagebird' },
    { label: 'WATI', value: 'wati' },
  ],
  default_language: [
    { label: 'English', value: 'en' },
    { label: 'Urdu (اردو)', value: 'ur' },
  ],
  default_currency: [
    { label: 'PKR — Pakistani Rupee', value: 'PKR' },
    { label: 'USD — US Dollar', value: 'USD' },
    { label: 'INR — Indian Rupee', value: 'INR' },
    { label: 'AED — UAE Dirham', value: 'AED' },
    { label: 'GBP — British Pound', value: 'GBP' },
    { label: 'EUR — Euro', value: 'EUR' },
  ],
};

interface Setting {
  key: string;
  value: string;
  type: string;
  label: string;
  description: string | null;
  is_mandatory: boolean;
}

type GroupedSettings = Record<string, Setting[]>;

interface Tab {
  key: string;
  label: string;
  icon: IconName;
  groups: string[];
  color: string;
}

const TABS: Tab[] = [
  { key: 'general', label: 'General', icon: 'cog-outline', groups: ['general', 'registration', 'localization', 'support', 'system'], color: '#6366F1' },
  { key: 'sms', label: 'SMS', icon: 'message-text-outline', groups: ['sms'], color: '#10B981' },
  { key: 'email', label: 'Email', icon: 'email-outline', groups: ['email'], color: '#3B82F6' },
  { key: 'notifications', label: 'Notifications', icon: 'bell-outline', groups: ['notifications'], color: '#F59E0B' },
  { key: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp', groups: ['whatsapp', 'whatsapp_direct'], color: '#25D366' },
  { key: 'firebase', label: 'Firebase', icon: 'firebase', groups: ['firebase'], color: '#FFCA28' },
  { key: 'googlecloud', label: 'Google Cloud', icon: 'google-cloud', groups: ['google_cloud'], color: '#4285F4' },
  { key: 'thirdparty', label: 'Third Party Logins', icon: 'shield-account-outline', groups: ['integrations_google', 'integrations_meta', 'integrations_apple', 'integrations_microsoft'], color: '#8B5CF6' },
];

const GROUP_META: Record<string, { label: string; icon: IconName; color: string; description?: string }> = {
  general: { label: 'General', icon: 'cog-outline', color: '#6366F1' },
  registration: { label: 'Registration', icon: 'account-plus-outline', color: '#8B5CF6' },
  localization: { label: 'Localization', icon: 'translate', color: '#06B6D4' },
  support: { label: 'Support', icon: 'headset', color: '#EC4899' },
  system: { label: 'System', icon: 'wrench-outline', color: '#EF4444' },
  sms: { label: 'SMS Gateway', icon: 'message-text-outline', color: '#10B981', description: 'Configure SMS gateway provider for sending OTP codes, transaction alerts, and notifications.' },
  email: { label: 'Email Service', icon: 'email-fast-outline', color: '#3B82F6', description: 'Set up email delivery for invoices, password resets, and system notifications.' },
  notifications: { label: 'Push Notifications', icon: 'bell-ring-outline', color: '#F59E0B', description: 'Configure push notification delivery for real-time transaction and payment alerts.' },
  whatsapp: { label: 'WhatsApp Business API', icon: 'whatsapp', color: '#25D366', description: 'Connect to WhatsApp Business API for automated messages, payment reminders, and ledger sharing.' },
  whatsapp_direct: { label: 'WhatsApp Direct (wa.me)', icon: 'chat-outline', color: '#128C7E', description: 'Enable click-to-chat links using wa.me deep links. No API key required — uses standard WhatsApp URLs.' },
  integrations_google: { label: 'Google', icon: 'google', color: '#4285F4', description: 'Google OAuth sign-in, Analytics, and Maps integration.' },
  integrations_meta: { label: 'Meta / Facebook', icon: 'facebook', color: '#1877F2', description: 'Meta OAuth sign-in, Facebook Pixel, and WhatsApp Business.' },
  integrations_apple: { label: 'Apple', icon: 'apple', color: '#000000', description: 'Sign in with Apple integration for iOS and web users.' },
  integrations_microsoft: { label: 'Microsoft', icon: 'microsoft', color: '#00A4EF', description: 'Microsoft / Azure AD sign-in for enterprise users.' },
  firebase: { label: 'Firebase Project', icon: 'firebase', color: '#FFCA28', description: 'Configure Firebase services: Cloud Messaging (FCM), Analytics, Crashlytics, Remote Config, and Dynamic Links.' },
  google_cloud: { label: 'Google Cloud Services', icon: 'google-cloud', color: '#4285F4', description: 'Configure Google Cloud Platform services: reCAPTCHA, Translation API, and service account.' },
};

export default function AdminSettingsScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width > 900;
  const isMedium = Platform.OS === 'web' && width > 600;

  const [activeTab, setActiveTab] = useState('general');
  const [form, setForm] = useState<Record<string, string>>({});

  const { data, isLoading, error } = useQuery<GroupedSettings>({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await api.get('/admin/settings');
      return res.data.data;
    },
  });

  useEffect(() => {
    if (data) {
      const flatMap: Record<string, string> = {};
      Object.values(data).forEach((group) => {
        group.forEach((s) => { flatMap[s.key] = s.value ?? ''; });
      });
      setForm(flatMap);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: async (settings: { key: string; value: string }[]) => {
      const res = await api.put('/admin/settings', { settings });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      Alert.alert('Success', 'Settings saved successfully.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save settings.');
    },
  });

  const handleSave = () => {
    const currentTab = TABS.find((t) => t.key === activeTab)!;
    // Only send settings for current tab groups
    const tabKeys = new Set<string>();
    currentTab.groups.forEach((g) => {
      data?.[g]?.forEach((s) => tabKeys.add(s.key));
    });
    const settings = Object.entries(form)
      .filter(([key]) => tabKeys.has(key))
      .map(([key, value]) => ({ key, value }));
    mutation.mutate(settings);
  };

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const currentTab = TABS.find((t) => t.key === activeTab)!;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, color: '#8A8FA8' }}>Loading settings...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.error} />
        <Text style={{ color: colors.error, marginTop: 12 }}>Failed to load settings</Text>
      </View>
    );
  }

  return (
    <View style={styles.outerContainer}>
      <LoadingOverlay visible={mutation.isPending} message="Saving settings..." />

      <View style={isWide ? styles.wideLayout : undefined}>
        {/* ─── Tab Navigation ─── */}
        {isWide ? (
          <View style={styles.sideNav}>
            <Text style={styles.sideNavTitle}>Settings</Text>
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.sideNavItem, active && { backgroundColor: tab.color + '12' }]}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.sideNavIcon, { backgroundColor: active ? tab.color + '20' : '#F3F4F6' }]}>
                    <MaterialCommunityIcons name={tab.icon} size={18} color={active ? tab.color : '#8A8FA8'} />
                  </View>
                  <Text style={[styles.sideNavLabel, active && { color: tab.color, fontWeight: '700' }]}>
                    {tab.label}
                  </Text>
                  {active && <View style={[styles.sideNavIndicator, { backgroundColor: tab.color }]} />}
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabBar}
            contentContainerStyle={styles.tabBarContent}
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabChip, active && { backgroundColor: tab.color + '15', borderColor: tab.color }]}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name={tab.icon}
                    size={16}
                    color={active ? tab.color : '#8A8FA8'}
                  />
                  <Text style={[styles.tabChipLabel, active && { color: tab.color, fontWeight: '600' }]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* ─── Content ─── */}
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={[styles.content, isMedium && { maxWidth: 720 }]}
        >
          {/* Tab Header */}
          <View style={styles.tabHeader}>
            <View style={[styles.tabHeaderIcon, { backgroundColor: currentTab.color + '15' }]}>
              <MaterialCommunityIcons name={currentTab.icon} size={24} color={currentTab.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tabTitle}>{currentTab.label} Configuration</Text>
              <Text style={styles.tabSubtitle}>
                {currentTab.groups.length} {currentTab.groups.length === 1 ? 'section' : 'sections'}
              </Text>
            </View>
          </View>

          {/* Settings Groups */}
          {data && currentTab.groups.map((group) => {
            const settings = data[group];
            if (!settings || settings.length === 0) return null;
            const meta = GROUP_META[group];
            return (
              <Surface key={group} style={styles.card}>
                {/* Group Header */}
                <View style={styles.groupHeader}>
                  <View style={[styles.groupIcon, { backgroundColor: (meta?.color || '#6366F1') + '15' }]}>
                    <MaterialCommunityIcons
                      name={meta?.icon || 'cog-outline'}
                      size={20}
                      color={meta?.color || '#6366F1'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.groupTitle}>{meta?.label || group}</Text>
                    {meta?.description && (
                      <Text style={styles.groupDesc}>{meta.description}</Text>
                    )}
                  </View>
                </View>

                <Divider style={{ marginBottom: 16 }} />

                {/* Google Service Account JSON Import for Firebase / Google Cloud tabs */}
                {(group === 'firebase' || group === 'google_cloud') && Platform.OS === 'web' && (
                  <ImportServiceAccountJSON
                    group={group}
                    onImport={(values) => {
                      Object.entries(values).forEach(([key, value]) => {
                        updateField(key, value);
                      });
                      Alert.alert('Imported!', 'Service account values have been auto-filled. Click Save to persist.');
                    }}
                  />
                )}

                {/* Fields */}
                {settings.map((setting) => (
                  <SettingField
                    key={setting.key}
                    setting={setting}
                    value={form[setting.key] || ''}
                    onChange={(v) => updateField(setting.key, v)}
                  />
                ))}
              </Surface>
            );
          })}

          {/* Save Button */}
          <View style={styles.saveRow}>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={mutation.isPending}
              style={styles.saveBtn}
              buttonColor={currentTab.color}
              icon="content-save"
            >
              Save {currentTab.label} Settings
            </Button>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </View>
  );
}

/* ─── Import Service Account JSON Component ─── */
function ImportServiceAccountJSON({
  group,
  onImport,
}: {
  group: string;
  onImport: (values: Record<string, string>) => void;
}) {
  const handleImport = () => {
    if (typeof document === 'undefined') return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          const values: Record<string, string> = {};

          if (group === 'firebase') {
            // Map Firebase service account JSON fields to system settings keys
            if (json.project_id) values['firebase_project_id'] = json.project_id;
            if (json.client_email) values['firebase_client_email'] = json.client_email;
            if (json.private_key) values['firebase_private_key'] = json.private_key;
            if (json.private_key_id) values['firebase_private_key_id'] = json.private_key_id;
            if (json.client_id) values['firebase_client_id'] = json.client_id;
            if (json.token_uri) values['firebase_token_uri'] = json.token_uri;
            // For web API key — user still needs to add from Firebase Console > Project Settings
          } else if (group === 'google_cloud') {
            if (json.project_id) values['google_cloud_project_id'] = json.project_id;
            if (json.client_email) values['google_cloud_service_account_email'] = json.client_email;
            if (json.private_key) values['google_cloud_service_account_key'] = json.private_key;
          }

          if (Object.keys(values).length > 0) {
            onImport(values);
          } else {
            Alert.alert('Invalid File', 'The selected JSON file does not contain recognized service account fields.');
          }
        } catch {
          Alert.alert('Error', 'Failed to parse JSON file. Please select a valid service account JSON.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <Surface style={importStyles.container}>
      <View style={importStyles.row}>
        <View style={importStyles.iconBox}>
          <MaterialCommunityIcons name="cloud-upload-outline" size={24} color="#4285F4" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={importStyles.title}>Import Service Account JSON</Text>
          <Text style={importStyles.desc}>
            Upload the JSON key file from {group === 'firebase' ? 'Firebase Console > Project Settings > Service Accounts' : 'Google Cloud Console > IAM > Service Accounts'} to auto-fill all fields below.
          </Text>
        </View>
        <Button mode="contained" onPress={handleImport} icon="file-upload" buttonColor="#4285F4" style={{ borderRadius: 8 }} compact>
          Import
        </Button>
      </View>
    </Surface>
  );
}

const importStyles = StyleSheet.create({
  container: {
    padding: 16, borderRadius: 12, marginBottom: 16,
    backgroundColor: '#EEF4FF', elevation: 0, borderWidth: 1, borderColor: '#D6E4FF',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 13, fontWeight: '700', color: '#1B2B65' },
  desc: { fontSize: 11, color: '#5B6B8A', marginTop: 2, lineHeight: 15 },
});

/* ─── Setting Field Component ─── */
function SettingField({
  setting,
  value,
  onChange,
}: {
  setting: Setting;
  value: string;
  onChange: (v: string) => void;
}) {
  if (setting.type === 'boolean') {
    return (
      <View style={styles.switchRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>
            {setting.label}{setting.is_mandatory ? ' *' : ''}
          </Text>
          {setting.description && (
            <Text style={styles.fieldDesc}>{setting.description}</Text>
          )}
        </View>
        <Switch
          value={value === 'true' || value === '1'}
          onValueChange={(v) => onChange(v ? 'true' : 'false')}
          color={colors.primary}
        />
      </View>
    );
  }

  if (SETTING_OPTIONS[setting.key]) {
    return (
      <View style={styles.fieldContainer}>
        <SearchableDropdown
          label={`${setting.label}${setting.is_mandatory ? ' *' : ''}`}
          items={SETTING_OPTIONS[setting.key]}
          value={value}
          onSelect={(item) => onChange(String(item.value))}
          placeholder={`Select ${setting.label}...`}
        />
        {setting.description && (
          <Text style={styles.fieldDesc}>{setting.description}</Text>
        )}
      </View>
    );
  }

  const isSecret = setting.key.includes('password') || setting.key.includes('secret')
    || setting.key.includes('private_key') || setting.key.includes('token') || setting.key.includes('api_key');

  return (
    <View style={styles.fieldContainer}>
      <TextInput
        label={`${setting.label}${setting.is_mandatory ? ' *' : ''}`}
        value={value}
        onChangeText={onChange}
        keyboardType={setting.type === 'integer' ? 'numeric' : 'default'}
        secureTextEntry={isSecret}
        mode="outlined"
        style={styles.input}
        outlineStyle={{ borderRadius: 10 }}
        multiline={setting.key.includes('private_key') || setting.key.includes('message')}
        numberOfLines={setting.key.includes('private_key') ? 4 : setting.key.includes('message') ? 3 : 1}
      />
      {setting.description && (
        <Text style={styles.fieldDesc}>{setting.description}</Text>
      )}
    </View>
  );
}

/* ─── Styles ─── */
const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: '#F5F6FA' },

  // Wide layout (desktop sidebar)
  wideLayout: { flex: 1, flexDirection: 'row' },
  sideNav: {
    width: 240, backgroundColor: '#fff', borderRightWidth: 1, borderRightColor: '#ECEEF5',
    paddingTop: 20, paddingHorizontal: 12,
  },
  sideNavTitle: {
    fontSize: 11, fontWeight: '700', color: '#B0B5C8', letterSpacing: 1.2,
    textTransform: 'uppercase', marginBottom: 16, paddingLeft: 12,
  },
  sideNavItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, marginBottom: 4,
    position: 'relative',
  },
  sideNavIcon: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  sideNavLabel: { fontSize: 13, fontWeight: '500', color: '#4A4E6A', flex: 1 },
  sideNavIndicator: {
    position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderRadius: 2,
  },

  // Tab bar (mobile/tablet horizontal chips)
  tabBar: {
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ECEEF5',
    maxHeight: 56,
  },
  tabBarContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  tabChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#fff',
  },
  tabChipLabel: { fontSize: 12, fontWeight: '500', color: '#8A8FA8' },

  // Content
  contentScroll: { flex: 1 },
  content: { padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Tab Header
  tabHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20,
  },
  tabHeaderIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  tabTitle: { fontSize: 20, fontWeight: '700', color: '#1B2B65' },
  tabSubtitle: { fontSize: 12, color: '#8A8FA8', marginTop: 2 },

  // Cards
  card: {
    padding: 20, borderRadius: 16, marginBottom: 16,
    elevation: 1, backgroundColor: '#fff',
  },
  groupHeader: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14,
  },
  groupIcon: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  groupTitle: { fontSize: 15, fontWeight: '700', color: '#1B2B65' },
  groupDesc: { fontSize: 11, color: '#8A8FA8', marginTop: 3, lineHeight: 16 },

  // Fields
  fieldContainer: { marginBottom: 16 },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, paddingHorizontal: 4, marginBottom: 8,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  fieldLabel: { fontSize: 14, fontWeight: '600', color: '#1B2B65' },
  fieldDesc: { fontSize: 11, color: '#8A8FA8', marginTop: 3, paddingLeft: 2, lineHeight: 15 },
  input: { backgroundColor: 'transparent' },

  // Save
  saveRow: { paddingTop: 4 },
  saveBtn: { borderRadius: 12, paddingVertical: 4 },
});

