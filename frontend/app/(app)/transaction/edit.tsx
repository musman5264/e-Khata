import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, SegmentedButtons, Text, Surface } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

export default function EditTransactionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [form, setForm] = useState({
    type: 'debit',
    amount: '',
    description: '',
    date: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const params2 = useLocalSearchParams<{ party_id?: string }>();
  const { data: txn } = useQuery({
    queryKey: ['transaction', id],
    queryFn: async () => {
      const res = await api.get(`/transactions/${id}`);
      return res.data.data;
    },
  });

  useEffect(() => {
    if (txn) {
      setForm({
        type: txn.type,
        amount: String(txn.amount),
        description: txn.description || '',
        date: txn.date,
      });
    }
  }, [txn]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const partyId = txn?.party_id || params2.party_id;
      const res = await api.put(`/transactions/${id}`, {
        ...data,
        amount: parseFloat(data.amount),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction', id] });
      queryClient.invalidateQueries({ queryKey: ['party-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      router.back();
    },
    onError: (error: any) => {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    },
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <SegmentedButtons
        value={form.type}
        onValueChange={(v) => updateField('type', v)}
        buttons={[
          { value: 'debit', label: t('transaction.debit') },
          { value: 'credit', label: t('transaction.credit') },
        ]}
        style={styles.input}
      />

      <Surface style={[styles.amountCard, { backgroundColor: form.type === 'debit' ? '#FFEBEE' : '#E0F2F1' }]}>
        <Text style={styles.currencySymbol}>₨</Text>
        <TextInput
          value={form.amount}
          onChangeText={(v) => updateField('amount', v.replace(/[^0-9.]/g, ''))}
          keyboardType="numeric"
          placeholder="0"
          style={styles.amountInput}
          mode="flat"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
        />
      </Surface>

      <TextInput
        label={t('transaction.date')}
        value={form.date}
        onChangeText={(v) => updateField('date', v)}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label={t('transaction.description')}
        value={form.description}
        onChangeText={(v) => updateField('description', v)}
        multiline
        numberOfLines={3}
        mode="outlined"
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={() => mutation.mutate(form)}
        loading={mutation.isPending}
        disabled={mutation.isPending || !form.amount}
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
  amountCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12,
    padding: spacing.md, marginBottom: spacing.md, marginTop: spacing.sm,
  },
  currencySymbol: { fontSize: 28, fontWeight: 'bold', marginRight: 8 },
  amountInput: { flex: 1, fontSize: 32, backgroundColor: 'transparent', fontWeight: 'bold' },
  submitBtn: { marginTop: spacing.lg, borderRadius: 8 },
});
