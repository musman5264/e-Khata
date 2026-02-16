import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text, Surface, RadioButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

export default function SendPaymentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    party_id: '',
    amount: '',
    gateway: 'jazzcash',
    description: '',
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/payments/send', {
        ...data,
        amount: parseFloat(data.amount),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      router.back();
    },
    onError: (error: any) => {
      Alert.alert(t('common.error'), error.response?.data?.message || t('common.genericError'));
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Surface style={styles.amountCard}>
        <Text style={styles.currencySymbol}>₨</Text>
        <TextInput
          value={form.amount}
          onChangeText={(v) => setForm((p) => ({ ...p, amount: v.replace(/[^0-9.]/g, '') }))}
          keyboardType="numeric"
          placeholder="0"
          style={styles.amountInput}
          mode="flat"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
        />
      </Surface>

      <TextInput
        label={t('transaction.partyId')}
        value={form.party_id}
        onChangeText={(v) => setForm((p) => ({ ...p, party_id: v }))}
        keyboardType="numeric"
        mode="outlined"
        style={styles.input}
      />

      <Text variant="labelLarge" style={styles.label}>{t('payment.gateway')}</Text>
      <RadioButton.Group onValueChange={(v) => setForm((p) => ({ ...p, gateway: v }))} value={form.gateway}>
        <RadioButton.Item label="JazzCash" value="jazzcash" />
        <RadioButton.Item label="EasyPaisa" value="easypaisa" />
      </RadioButton.Group>

      <TextInput
        label={t('transaction.description')}
        value={form.description}
        onChangeText={(v) => setForm((p) => ({ ...p, description: v }))}
        multiline
        mode="outlined"
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={() => mutation.mutate(form)}
        loading={mutation.isPending}
        disabled={mutation.isPending || !form.amount || !form.party_id}
        style={styles.submitBtn}
        buttonColor={colors.debit}
        textColor="#fff"
      >
        {t('payment.send')}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: 40 },
  amountCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12,
    padding: spacing.md, marginBottom: spacing.md, backgroundColor: '#FFEBEE',
  },
  currencySymbol: { fontSize: 28, fontWeight: 'bold', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 32, backgroundColor: 'transparent', fontWeight: 'bold' },
  input: { marginBottom: spacing.md },
  label: { marginBottom: spacing.sm },
  submitBtn: { marginTop: spacing.lg, borderRadius: 8 },
});
