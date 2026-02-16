import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, RadioButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

export default function InviteTeamScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({ mobile: '', role: 'viewer' });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/team/invite', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      Alert.alert(t('common.success'), t('team.inviteSent'));
      router.back();
    },
    onError: (error: any) => {
      Alert.alert(t('common.error'), error.response?.data?.message || t('common.genericError'));
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TextInput
        label={t('party.mobile')}
        value={form.mobile}
        onChangeText={(v) => setForm((p) => ({ ...p, mobile: v }))}
        keyboardType="phone-pad"
        mode="outlined"
        style={styles.input}
      />

      <Text variant="labelLarge" style={styles.label}>{t('team.role')}</Text>
      <RadioButton.Group onValueChange={(v) => setForm((p) => ({ ...p, role: v }))} value={form.role}>
        <RadioButton.Item label={t('team.manager')} value="manager" />
        <RadioButton.Item label={t('team.accountant')} value="accountant" />
        <RadioButton.Item label={t('team.viewer')} value="viewer" />
      </RadioButton.Group>

      <Button
        mode="contained"
        onPress={() => mutation.mutate(form)}
        loading={mutation.isPending}
        disabled={mutation.isPending || !form.mobile}
        style={styles.submitBtn}
        buttonColor={colors.primary}
      >
        {t('team.sendInvite')}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: 40 },
  input: { marginBottom: spacing.md },
  label: { marginBottom: spacing.sm },
  submitBtn: { marginTop: spacing.lg, borderRadius: 8 },
});
