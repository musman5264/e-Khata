import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, SegmentedButtons, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

export default function CreatePartyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: '',
    mobile: '',
    email: '',
    city: '',
    address: '',
    type: 'customer',
    opening_balance: '',
    opening_balance_type: 'dr',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/parties', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      router.back();
    },
    onError: (error: any) => {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    },
  });

  const handleSubmit = () => {
    const data: any = { ...form };
    if (form.opening_balance) {
      data.opening_balance = parseFloat(form.opening_balance);
    } else {
      delete data.opening_balance;
      delete data.opening_balance_type;
    }
    mutation.mutate(data);
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TextInput
        label={t('party.name')}
        value={form.name}
        onChangeText={(v) => updateField('name', v)}
        error={!!errors.name}
        mode="outlined"
        style={styles.input}
      />
      {errors.name && <Text style={styles.error}>{errors.name}</Text>}

      <TextInput
        label={t('party.mobile')}
        value={form.mobile}
        onChangeText={(v) => updateField('mobile', v)}
        keyboardType="phone-pad"
        error={!!errors.mobile}
        mode="outlined"
        style={styles.input}
      />
      {errors.mobile && <Text style={styles.error}>{errors.mobile}</Text>}

      <TextInput
        label={t('party.email')}
        value={form.email}
        onChangeText={(v) => updateField('email', v)}
        keyboardType="email-address"
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label={t('party.city')}
        value={form.city}
        onChangeText={(v) => updateField('city', v)}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label={t('party.address')}
        value={form.address}
        onChangeText={(v) => updateField('address', v)}
        multiline
        numberOfLines={2}
        mode="outlined"
        style={styles.input}
      />

      <Text variant="labelLarge" style={styles.label}>{t('party.type')}</Text>
      <SegmentedButtons
        value={form.type}
        onValueChange={(v) => updateField('type', v)}
        buttons={[
          { value: 'customer', label: t('party.customer') },
          { value: 'supplier', label: t('party.supplier') },
          { value: 'both', label: t('party.both') },
        ]}
        style={styles.input}
      />

      <TextInput
        label={t('party.openingBalance')}
        value={form.opening_balance}
        onChangeText={(v) => updateField('opening_balance', v)}
        keyboardType="numeric"
        mode="outlined"
        style={styles.input}
      />

      {form.opening_balance ? (
        <SegmentedButtons
          value={form.opening_balance_type}
          onValueChange={(v) => updateField('opening_balance_type', v)}
          buttons={[
            { value: 'dr', label: t('transaction.debit') },
            { value: 'cr', label: t('transaction.credit') },
          ]}
          style={styles.input}
        />
      ) : null}

      <TextInput
        label={t('party.notes')}
        value={form.notes}
        onChangeText={(v) => updateField('notes', v)}
        multiline
        numberOfLines={3}
        mode="outlined"
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={handleSubmit}
        loading={mutation.isPending}
        disabled={mutation.isPending || !form.name || !form.mobile}
        style={styles.submitBtn}
        buttonColor={colors.primary}
      >
        {t('common.save')}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: 40 },
  input: { marginBottom: spacing.md },
  label: { marginBottom: spacing.sm, marginTop: spacing.sm },
  error: { color: colors.error, fontSize: 12, marginTop: -8, marginBottom: 8 },
  submitBtn: { marginTop: spacing.lg, borderRadius: 8 },
});
