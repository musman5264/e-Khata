import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Switch, List, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

export default function NotificationPrefsScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: prefs } = useQuery({
    queryKey: ['notification-prefs'],
    queryFn: async () => {
      const res = await api.get('/notifications/preferences');
      return res.data.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put('/notifications/preferences', data);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notification-prefs'] }),
  });

  const toggle = (key: string) => {
    const updated = { ...prefs, [key]: !prefs?.[key] };
    mutation.mutate(updated);
  };

  const prefItems = [
    { key: 'transaction_alerts', label: t('notification.transactionAlerts') },
    { key: 'payment_alerts', label: t('notification.paymentAlerts') },
    { key: 'login_alerts', label: t('notification.loginAlerts') },
    { key: 'team_alerts', label: t('notification.teamAlerts') },
    { key: 'push_enabled', label: t('notification.pushEnabled') },
    { key: 'sms_enabled', label: t('notification.smsEnabled') },
  ];

  return (
    <ScrollView style={styles.container}>
      <Text variant="titleMedium" style={styles.sectionTitle}>{t('notification.preferences')}</Text>

      {prefItems.map((item, index) => (
        <React.Fragment key={item.key}>
          <List.Item
            title={item.label}
            right={() => (
              <Switch
                value={prefs?.[item.key] ?? true}
                onValueChange={() => toggle(item.key)}
                color={colors.primary}
              />
            )}
          />
          {index < prefItems.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  sectionTitle: { padding: spacing.base, fontWeight: '600' },
});
