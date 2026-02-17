import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, SegmentedButtons, Text, Surface } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import SearchableDropdown from '@/components/SearchableDropdown';
import LoadingOverlay from '@/components/LoadingOverlay';
import DateInput from '@/components/DateInput';

export default function CreateTransactionScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ party_id?: string; type?: string }>();

  const [form, setForm] = useState({
    party_id: params.party_id || '',
    type: params.type || 'debit',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    attachment_url: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch parties for searchable dropdown
  const { data: partiesData } = useQuery({
    queryKey: ['parties'],
    queryFn: async () => {
      const res = await api.get('/parties');
      return res.data.data;
    },
    enabled: !params.party_id, // Only fetch if no pre-selected party
  });

  const partyItems = (partiesData || []).map((p: any) => ({
    label: p.name,
    value: String(p.id),
    subtitle: p.mobile || p.email || undefined,
  }));

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const { party_id, ...txnData } = data;
      const res = await api.post(`/parties/${party_id}/transactions`, {
        ...txnData,
        amount: parseFloat(txnData.amount),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['party-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['parties'] });
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

  const handleSubmit = () => {
    if (!form.party_id || !form.amount) return;
    mutation.mutate(form);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <LoadingOverlay visible={mutation.isPending} message="Saving transaction..." />
      {/* Transaction Type */}
      <Text variant="labelLarge" style={styles.label}>{t('transaction.type')}</Text>
      <SegmentedButtons
        value={form.type}
        onValueChange={(v) => updateField('type', v)}
        buttons={[
          {
            value: 'debit',
            label: t('transaction.debit'),
            style: form.type === 'debit' ? { backgroundColor: colors.debit + '20' } : {},
          },
          {
            value: 'credit',
            label: t('transaction.credit'),
            style: form.type === 'credit' ? { backgroundColor: colors.credit + '20' } : {},
          },
        ]}
        style={styles.input}
      />

      {/* Amount */}
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
      {errors.amount && <Text style={styles.error}>{errors.amount}</Text>}

      {/* Party Selection - searchable dropdown */}
      {!params.party_id && (
        <>
          <SearchableDropdown
            label={t('party.name')}
            items={partyItems}
            value={form.party_id}
            onSelect={(item) => updateField('party_id', String(item.value))}
            placeholder="Search party by name or mobile..."
            error={errors.party_id}
          />
        </>
      )}

      {/* Date */}
      <DateInput
        label={t('transaction.date')}
        value={form.date}
        onChangeText={(v) => updateField('date', v)}
        style={styles.input}
      />

      {/* Description */}
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
        onPress={handleSubmit}
        loading={mutation.isPending}
        disabled={mutation.isPending || !form.amount || !form.party_id}
        style={styles.submitBtn}
        buttonColor={form.type === 'debit' ? colors.debit : colors.credit}
        textColor="#fff"
      >
        {form.type === 'debit' ? t('transaction.addDebit') : t('transaction.addCredit')}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: 40 },
  label: { marginBottom: spacing.sm },
  input: { marginBottom: spacing.md },
  amountCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 12,
    padding: spacing.md, marginBottom: spacing.md, marginTop: spacing.sm,
  },
  currencySymbol: { fontSize: 28, fontWeight: 'bold', marginRight: 8, color: colors.textPrimary },
  amountInput: { flex: 1, fontSize: 32, backgroundColor: 'transparent', fontWeight: 'bold' },
  error: { color: colors.error, fontSize: 12, marginTop: -8, marginBottom: 8 },
  submitBtn: { marginTop: spacing.lg, borderRadius: 8 },
});
