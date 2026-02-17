import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text as RNText } from 'react-native';
import { TextInput, Button, SegmentedButtons, Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import WebContainer from '@/components/WebContainer';

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

  const typeOptions = [
    { key: 'customer', label: t('party.customer'), icon: 'account-outline' as const, color: '#2E86C1' },
    { key: 'supplier', label: t('party.supplier'), icon: 'factory' as const, color: '#D4AC0D' },
    { key: 'both', label: t('party.both'), icon: 'swap-horizontal' as const, color: '#8E44AD' },
  ];

  return (
    <WebContainer>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>

          {/* Party Type Selection */}
          <Text style={styles.sectionLabel}>PARTY TYPE</Text>
          <View style={styles.typeRow}>
            {typeOptions.map((opt) => {
              const active = form.type === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.typeCard, active && { borderColor: opt.color, backgroundColor: opt.color + '10' }]}
                  activeOpacity={0.7}
                  onPress={() => updateField('type', opt.key)}
                >
                  <View style={[styles.typeIconWrap, { backgroundColor: active ? opt.color : '#EEE' }]}>
                    <MaterialCommunityIcons name={opt.icon} size={20} color={active ? '#fff' : '#999'} />
                  </View>
                  <RNText style={[styles.typeLabel, active && { color: opt.color, fontWeight: '700' }]}>{opt.label}</RNText>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Basic Info */}
          <Text style={styles.sectionLabel}>BASIC INFORMATION</Text>
          <Surface style={styles.formCard}>
            <TextInput
              label={t('party.name')}
              value={form.name}
              onChangeText={(v) => updateField('name', v)}
              error={!!errors.name}
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="account" />}
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
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="phone" />}
            />
            {errors.mobile && <Text style={styles.error}>{errors.mobile}</Text>}

            <TextInput
              label={t('party.email')}
              value={form.email}
              onChangeText={(v) => updateField('email', v)}
              keyboardType="email-address"
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="email-outline" />}
            />
          </Surface>

          {/* Location */}
          <Text style={styles.sectionLabel}>LOCATION</Text>
          <Surface style={styles.formCard}>
            <TextInput
              label={t('party.city')}
              value={form.city}
              onChangeText={(v) => updateField('city', v)}
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="map-marker" />}
            />
            <TextInput
              label={t('party.address')}
              value={form.address}
              onChangeText={(v) => updateField('address', v)}
              multiline
              numberOfLines={2}
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="home-outline" />}
            />
          </Surface>

          {/* Opening Balance */}
          <Text style={styles.sectionLabel}>OPENING BALANCE</Text>
          <Surface style={styles.formCard}>
            <TextInput
              label={t('party.openingBalance')}
              value={form.opening_balance}
              onChangeText={(v) => updateField('opening_balance', v)}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="currency-inr" />}
            />

            {form.opening_balance ? (
              <View style={styles.balanceTypeRow}>
                <TouchableOpacity
                  style={[styles.balanceTypeBtn, form.opening_balance_type === 'dr' && styles.balanceTypeDr]}
                  onPress={() => updateField('opening_balance_type', 'dr')}
                >
                  <MaterialCommunityIcons name="arrow-down" size={18} color={form.opening_balance_type === 'dr' ? '#fff' : colors.debit} />
                  <RNText style={[styles.balanceTypeBtnText, form.opening_balance_type === 'dr' && { color: '#fff' }]}>
                    NAAM (Dr)
                  </RNText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.balanceTypeBtn, form.opening_balance_type === 'cr' && styles.balanceTypeCr]}
                  onPress={() => updateField('opening_balance_type', 'cr')}
                >
                  <MaterialCommunityIcons name="arrow-up" size={18} color={form.opening_balance_type === 'cr' ? '#fff' : colors.credit} />
                  <RNText style={[styles.balanceTypeBtnText, form.opening_balance_type === 'cr' && { color: '#fff' }]}>
                    JAMA (Cr)
                  </RNText>
                </TouchableOpacity>
              </View>
            ) : null}
          </Surface>

          {/* Notes */}
          <Text style={styles.sectionLabel}>NOTES</Text>
          <Surface style={styles.formCard}>
            <TextInput
              label={t('party.notes')}
              value={form.notes}
              onChangeText={(v) => updateField('notes', v)}
              multiline
              numberOfLines={3}
              mode="outlined"
              style={styles.input}
              outlineStyle={styles.inputOutline}
              left={<TextInput.Icon icon="note-text-outline" />}
            />
          </Surface>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, (!form.name || !form.mobile || mutation.isPending) && styles.submitBtnDisabled]}
            activeOpacity={0.8}
            onPress={handleSubmit}
            disabled={mutation.isPending || !form.name || !form.mobile}
          >
            <MaterialCommunityIcons name="check-circle" size={22} color="#fff" />
            <RNText style={styles.submitText}>
              {mutation.isPending ? 'Saving...' : t('common.save')}
            </RNText>
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </View>
      </ScrollView>
    </WebContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: 40 },

  // Sections
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textHint, letterSpacing: 1.2, marginTop: 18, marginBottom: 8, marginLeft: 4 },
  formCard: { borderRadius: 16, padding: 16, elevation: 1, backgroundColor: colors.surface },

  // Party type
  typeRow: { flexDirection: 'row', gap: 10 },
  typeCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
    padding: 14,
    alignItems: 'center',
  },
  typeIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  typeLabel: { fontSize: 12, fontWeight: '500', color: colors.textSecondary, marginTop: 8 },

  // Inputs
  input: { marginBottom: 12, backgroundColor: 'transparent' },
  inputOutline: { borderRadius: 12 },
  error: { color: colors.error, fontSize: 12, marginTop: -8, marginBottom: 8, marginLeft: 4 },

  // Balance type
  balanceTypeRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  balanceTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.divider,
    backgroundColor: colors.surface,
  },
  balanceTypeDr: { backgroundColor: colors.debit, borderColor: colors.debit },
  balanceTypeCr: { backgroundColor: colors.credit, borderColor: colors.credit },
  balanceTypeBtnText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },

  // Submit
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: colors.primary,
    elevation: 2,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
});
