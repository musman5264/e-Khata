import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, Switch, Surface, Divider, ActivityIndicator } from 'react-native-paper';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

interface Setting {
  key: string;
  value: string;
  type: string;
  label: string;
  description: string | null;
  is_mandatory: boolean;
}

type GroupedSettings = Record<string, Setting[]>;

export default function AdminSettingsScreen() {
  const queryClient = useQueryClient();
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
    general: '⚙️ General',
    registration: '📝 Registration',
    localization: '🌐 Localization',
    support: '📞 Support',
    system: '🔧 System',
  };

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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.title}>System Settings</Text>
      <Text variant="bodySmall" style={styles.subtitle}>
        Mandatory fields are marked with *
      </Text>

      {data && Object.entries(data).map(([group, settings]) => (
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
      ))}

      <Button
        mode="contained"
        onPress={handleSave}
        loading={mutation.isPending}
        style={styles.saveBtn}
        buttonColor={colors.primary}
      >
        Save All Settings
      </Button>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontWeight: '700', marginBottom: 4 },
  subtitle: { color: colors.textSecondary, marginBottom: spacing.lg },
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
