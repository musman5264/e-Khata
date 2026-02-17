import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Switch, List, Divider, Surface, ActivityIndicator } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

export default function NotificationPrefsScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: prefs, isLoading } = useQuery({
    queryKey: ['notification-prefs'],
    queryFn: async () => {
      const res = await api.get('/notifications/preferences');
      return res.data.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put('/notifications/preferences', { preferences: data });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notification-prefs'] }),
  });

  const toggle = (type: string, channel: string) => {
    if (!prefs) return;
    const updated = { ...prefs };
    const current = updated[type] || { push_enabled: true, in_app_enabled: true, email_enabled: false };
    updated[type] = { ...current, [channel]: !current[channel] };
    mutation.mutate(updated);
  };

  const alertTypes = [
    { key: 'transaction_created', label: t('notification.transactionAlerts') },
    { key: 'payment_received', label: t('notification.paymentAlerts') },
    { key: 'new_device_login', label: t('notification.loginAlerts') },
    { key: 'team_member_joined', label: t('notification.teamAlerts') },
  ];

  const channels = [
    { key: 'push_enabled', label: t('notification.pushEnabled') },
    { key: 'in_app_enabled', label: t('notification.inAppEnabled') },
    { key: 'email_enabled', label: t('notification.emailEnabled') },
  ];

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="titleMedium" style={styles.sectionTitle}>{t('notification.preferences')}</Text>
      <Surface style={styles.card}>
        {alertTypes.map((item, index) => (
          <React.Fragment key={item.key}>
            <Text variant="bodyMedium" style={styles.typeLabel}>{item.label}</Text>
            {channels.map((ch) => (
              <List.Item
                key={`${item.key}-${ch.key}`}
                title={ch.label}
                titleStyle={styles.channelLabel}
                right={() => (
                  <Switch
                    value={prefs?.[item.key]?.[ch.key] ?? (ch.key === 'email_enabled' ? false : true)}
                    onValueChange={() => toggle(item.key, ch.key)}
                    color={colors.primary}
                  />
                )}
                style={styles.channelItem}
              />
            ))}
            {index < alertTypes.length - 1 && <Divider style={{ marginVertical: 8 }} />}
          </React.Fragment>
        ))}
      </Surface>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: { fontWeight: '600', marginBottom: spacing.sm },
  card: { padding: spacing.base, borderRadius: 12, marginBottom: spacing.base, elevation: 2, backgroundColor: '#fff' },
  typeLabel: { fontWeight: '600', marginTop: 8, marginBottom: 4, color: colors.text },
  channelLabel: { fontSize: 13 },
  channelItem: { paddingVertical: 2, paddingLeft: 12 },
});
