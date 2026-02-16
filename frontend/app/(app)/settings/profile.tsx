import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

export default function ProfileSettingsScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({ name: '', email: '', mobile: '' });

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await api.get('/me');
      return res.data.data;
    },
  });

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || '', email: user.email || '', mobile: user.mobile || '' });
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put('/me', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      Alert.alert(t('common.success'), t('settings.profileUpdated'));
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TextInput
        label={t('auth.name')} value={form.name}
        onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
        mode="outlined" style={styles.input}
      />
      <TextInput
        label={t('auth.email')} value={form.email}
        onChangeText={(v) => setForm((p) => ({ ...p, email: v }))}
        keyboardType="email-address" mode="outlined" style={styles.input}
      />
      <TextInput
        label={t('auth.mobile')} value={form.mobile}
        onChangeText={(v) => setForm((p) => ({ ...p, mobile: v }))}
        keyboardType="phone-pad" mode="outlined" style={styles.input} disabled
      />
      <Button mode="contained" onPress={() => mutation.mutate(form)}
        loading={mutation.isPending} style={styles.submitBtn} buttonColor={colors.primary}>
        {t('common.save')}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: 40 },
  input: { marginBottom: spacing.md },
  submitBtn: { marginTop: spacing.lg, borderRadius: 8 },
});
