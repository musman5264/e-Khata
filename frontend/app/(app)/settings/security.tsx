import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, Divider } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

export default function SecuritySettingsScreen() {
  const { t } = useTranslation();

  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put('/me/password', data);
      return res.data;
    },
    onSuccess: () => {
      Alert.alert(t('common.success'), t('settings.passwordUpdated'));
      setForm({ current_password: '', new_password: '', new_password_confirmation: '' });
    },
    onError: (error: any) => {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        Alert.alert(t('common.error'), error.response?.data?.message || t('common.genericError'));
      }
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="titleMedium" style={styles.sectionTitle}>{t('settings.changePassword')}</Text>

      <TextInput
        label={t('settings.currentPassword')} value={form.current_password}
        onChangeText={(v) => setForm((p) => ({ ...p, current_password: v }))}
        secureTextEntry mode="outlined" style={styles.input} error={!!errors.current_password}
      />
      {errors.current_password && <Text style={styles.error}>{errors.current_password}</Text>}

      <TextInput
        label={t('settings.newPassword')} value={form.new_password}
        onChangeText={(v) => setForm((p) => ({ ...p, new_password: v }))}
        secureTextEntry mode="outlined" style={styles.input} error={!!errors.new_password}
      />
      {errors.new_password && <Text style={styles.error}>{errors.new_password}</Text>}

      <TextInput
        label={t('settings.confirmPassword')} value={form.new_password_confirmation}
        onChangeText={(v) => setForm((p) => ({ ...p, new_password_confirmation: v }))}
        secureTextEntry mode="outlined" style={styles.input}
      />

      <Button
        mode="contained" onPress={() => mutation.mutate(form)}
        loading={mutation.isPending}
        disabled={mutation.isPending || !form.current_password || !form.new_password}
        style={styles.submitBtn} buttonColor={colors.primary}
      >
        {t('settings.changePassword')}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: 40 },
  sectionTitle: { fontWeight: '600', marginBottom: spacing.base },
  input: { marginBottom: spacing.md },
  error: { color: colors.error, fontSize: 12, marginTop: -8, marginBottom: 8 },
  submitBtn: { marginTop: spacing.lg, borderRadius: 8 },
});
