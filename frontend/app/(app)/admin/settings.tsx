import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { TextInput, Button, Text, Switch, Surface, Divider, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

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
}

const TABS: Tab[] = [
  { key: 'general', label: 'General', icon: 'cog-outline', groups: ['general', 'registration', 'localization', 'support', 'system'] },
  { key: 'sms', label: 'SMS Gateway', icon: 'message-text-outline', groups: ['sms'] },
  { key: 'email', label: 'Email', icon: 'email-outline', groups: ['email'] },
  { key: 'notifications', label: 'Notifications', icon: 'bell-outline', groups: ['notifications'] },
];

export default function AdminSettingsScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
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
        group.forEach((s) => {
          flatMap[s.key] = s.value ?? '';
        });
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
      Alert.alert('Success', 'System settings updated successfully.');
    },
    onError: (err: any) => {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update settings.');
    },
  });

  const handleSave = () => {
    const settings = Object.entries(form).map(([key, value]) => ({ key, value }));
    mutation.mutate(settings);
  };

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const groupLabels: Record<string, string> = {
    general: '⚙️ ' + t('settings.general'),
    registration: '📝 Registration',
    localization: '🌐 Localization',
    support: '📞 Support',
    system: '🔧 System',
    sms: '📱 ' + t('settings.smsGateway'),
    email: '✉️ ' + t('settings.emailSystem'),
    notifications: '🔔 ' + t('settings.notificationSystem'),
  };

  const currentTab = TABS.find((t) => t.key === activeTab)!;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={{ color: colors.error }}>Failed to load settings</Text>
      </View>
    );
  }

  return (
    <View style={styles.outerContainer}>
      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={18}
              color={activeTab === tab.key ? colors.primary : '#8A8FA8'}
            />
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text variant="headlineSmall" style={styles.title}>{currentTab.label} {t('settings.configuration')}</Text>

        {data && currentTab.groups.map((group) => {
          const settings = data[group];
          if (!settings || settings.length === 0) return null;
          return (
            <Surface key={group} style={styles.card}>
              <Text variant="titleMedium" style={styles.groupTitle}>
                {groupLabels[group] || group}
              </Text>
              <Divider style={{ marginBottom: spacing.md }} />

              {settings.map((setting) => (
                <View key={setting.key} style={styles.fieldContainer}>
                  {setting.type === 'boolean' ? (
                    <View style={styles.switchRow}>
                      <View style={{ flex: 1 }}>
                        <Text variant="bodyMedium">
                          {setting.label}{setting.is_mandatory ? ' *' : ''}
                        </Text>
                        {setting.description && (
                          <Text variant="bodySmall" style={styles.description}>
                            {setting.description}
                          </Text>
                        )}
                      </View>
                      <Switch
                        value={form[setting.key] === 'true' || form[setting.key] === '1'}
                        onValueChange={(v) => updateField(setting.key, v ? 'true' : 'false')}
                        color={colors.primary}
                      />
                    </View>
                  ) : (
                    <>
                      <TextInput
                        label={`${setting.label}${setting.is_mandatory ? ' *' : ''}`}
                        value={form[setting.key] || ''}
                        onChangeText={(v) => updateField(setting.key, v)}
                        keyboardType={setting.type === 'integer' ? 'numeric' : 'default'}
                        secureTextEntry={setting.key.includes('password') || setting.key.includes('secret')}
                        mode="outlined"
                        style={styles.input}
                      />
                      {setting.description && (
                        <Text variant="bodySmall" style={styles.description}>
                          {setting.description}
                        </Text>
                      )}
                    </>
                  )}
                </View>
              ))}
            </Surface>
          );
        })}

        <Button
          mode="contained"
          onPress={handleSave}
          loading={mutation.isPending}
          style={styles.saveBtn}
          buttonColor={colors.primary}
        >
          {t('common.submit')}
        </Button>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1, backgroundColor: colors.background },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF5',
    paddingHorizontal: spacing.sm,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.primary,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8A8FA8',
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  container: { flex: 1 },
  content: { padding: spacing.base },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontWeight: '700', marginBottom: spacing.lg },
  card: {
    padding: spacing.base,
    borderRadius: 12,
    marginBottom: spacing.base,
    elevation: 2,
  },
  groupTitle: { fontWeight: '600', marginBottom: spacing.sm },
  fieldContainer: { marginBottom: spacing.md },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  input: { backgroundColor: 'transparent' },
  description: { color: colors.textSecondary, marginTop: 2, paddingLeft: 4, fontSize: 11 },
  saveBtn: { marginTop: spacing.base, borderRadius: 8 },
});
