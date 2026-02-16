import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

export default function TenantSettingsScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({ name: '', business_type: '', address: '', phone: '' });

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
        name: tenant.name || '',
        business_type: tenant.business_type || '',
        address: tenant.address || '',
        phone: tenant.phone || '',
      });
    }
  }, [tenant]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/tenants/${tenant?.id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-tenant'] });
      Alert.alert(t('common.success'), t('settings.tenantUpdated'));
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TextInput label={t('settings.businessName')} value={form.name}
        onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} mode="outlined" style={styles.input} />
      <TextInput label={t('settings.businessType')} value={form.business_type}
        onChangeText={(v) => setForm((p) => ({ ...p, business_type: v }))} mode="outlined" style={styles.input} />
      <TextInput label={t('party.address')} value={form.address}
        onChangeText={(v) => setForm((p) => ({ ...p, address: v }))} multiline mode="outlined" style={styles.input} />
      <TextInput label={t('party.mobile')} value={form.phone}
        onChangeText={(v) => setForm((p) => ({ ...p, phone: v }))} keyboardType="phone-pad" mode="outlined" style={styles.input} />
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
