import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text as RNText, Platform, useWindowDimensions } from 'react-native';
import { TextInput, Text, Surface, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';
import LoadingOverlay from '@/components/LoadingOverlay';

export default function CreatePartyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web' && width > 768;

  const nameRef = useRef<any>(null);
  const mobileRef = useRef<any>(null);
  const [showOptional, setShowOptional] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  const emptyForm = {
    name: '',
    mobile: '',
    email: '',
    city: '',
    address: '',
    type: 'customer',
    opening_balance: '',
    opening_balance_type: 'dr',
    notes: '',
  };
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Auto-focus name field on mount
    const timer = setTimeout(() => nameRef.current?.focus(), 400);
    return () => clearTimeout(timer);
  }, []);

  const [addAnother, setAddAnother] = useState(false);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/parties', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      if (addAnother) {
        setForm(emptyForm);
        setErrors({});
        setShowOptional(false);
        setSnackbar('Party saved! Add another.');
        setAddAnother(false);
        setTimeout(() => nameRef.current?.focus(), 300);
      } else {
        router.back();
      }
    },
    onError: (error: any) => {
      if (error.response?.data?.errors) {
        const errs = error.response.data.errors;
        const flat: Record<string, string> = {};
        Object.entries(errs).forEach(([k, v]) => { flat[k] = Array.isArray(v) ? v[0] : String(v); });
        setErrors(flat);
      } else {
        setSnackbar(error.response?.data?.message || 'Failed to save party');
      }
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = t('party.nameRequired');
    if (form.mobile.trim()) {
      const digits = form.mobile.trim().replace(/[^0-9]/g, '');
      if (digits.length !== 11 || !digits.startsWith('0')) {
        newErrors.mobile = t('party.invalidMobile') + ' (e.g. 03345266444)';
      }
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = t('party.invalidEmail');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (saveAndAdd = false) => {
    if (!validate()) return;
    setAddAnother(saveAndAdd);
    const data: any = {
      name: form.name.trim(),
      type: form.type,
    };
    // Only include non-empty optional fields
    if (form.mobile.trim()) data.mobile = form.mobile.trim();
    if (form.email.trim()) data.email = form.email.trim();
    if (form.city.trim()) data.city = form.city.trim();
    if (form.address.trim()) data.address = form.address.trim();
    if (form.notes.trim()) data.notes = form.notes.trim();
    if (form.opening_balance && parseFloat(form.opening_balance) > 0) {
      data.opening_balance = parseFloat(form.opening_balance);
      data.opening_balance_type = form.opening_balance_type;
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

  /* ─── Shared form content ─── */
  const formContent = (
    <>
      {/* Party Type */}
      <Text style={s.sectionLabel}>PARTY TYPE</Text>
      <View style={s.typeRow}>
        {typeOptions.map((opt) => {
          const active = form.type === opt.key;
          return (
            <TouchableOpacity
              key={opt.key}
              style={[s.typeCard, active && { borderColor: opt.color, backgroundColor: opt.color + '10' }]}
              activeOpacity={0.7}
              onPress={() => updateField('type', opt.key)}
            >
              <View style={[s.typeIconWrap, { backgroundColor: active ? opt.color : '#EEE' }]}>
                <MaterialCommunityIcons name={opt.icon} size={20} color={active ? '#fff' : '#999'} />
              </View>
              <RNText style={[s.typeLabel, active && { color: opt.color, fontWeight: '700' }]}>{opt.label}</RNText>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Basic Info */}
      <Text style={s.sectionLabel}>BASIC INFORMATION</Text>
      <Surface style={s.formCard}>
        <TextInput ref={nameRef} label={t('party.name')} value={form.name} onChangeText={(v) => updateField('name', v)} error={!!errors.name} mode="outlined" style={s.input} outlineStyle={s.inputOutline} left={<TextInput.Icon icon="account" />} returnKeyType="next" onSubmitEditing={() => mobileRef.current?.focus()} autoFocus={false} />
        {errors.name && <Text style={s.error}>{errors.name}</Text>}
        <TextInput ref={mobileRef} label={t('party.mobile')} value={form.mobile} onChangeText={(v) => updateField('mobile', v.replace(/[^0-9]/g, '').slice(0, 11))} keyboardType="phone-pad" error={!!errors.mobile} mode="outlined" style={s.input} outlineStyle={s.inputOutline} left={<TextInput.Icon icon="phone" />} returnKeyType="done" placeholder="03345266444" />
        {errors.mobile && <Text style={s.error}>{errors.mobile}</Text>}
        <TextInput label={t('party.email') + ' (optional)'} value={form.email} onChangeText={(v) => updateField('email', v)} keyboardType="email-address" error={!!errors.email} mode="outlined" style={s.input} outlineStyle={s.inputOutline} left={<TextInput.Icon icon="email-outline" />} />
        {errors.email && <Text style={s.error}>{errors.email}</Text>}
      </Surface>

      {/* Collapsible Optional Sections */}
      <TouchableOpacity style={s.optionalToggle} onPress={() => setShowOptional(!showOptional)} activeOpacity={0.7}>
        <MaterialCommunityIcons name={showOptional ? 'chevron-up' : 'chevron-down'} size={18} color="#8A8FA8" />
        <RNText style={s.optionalToggleText}>{showOptional ? 'Hide' : 'Show'} optional fields (location, balance, notes)</RNText>
      </TouchableOpacity>

      {showOptional && (
        <>
          {/* Location */}
          <Text style={s.sectionLabel}>LOCATION</Text>
          <Surface style={s.formCard}>
            <TextInput label={t('party.city')} value={form.city} onChangeText={(v) => updateField('city', v)} mode="outlined" style={s.input} outlineStyle={s.inputOutline} left={<TextInput.Icon icon="map-marker" />} />
            <TextInput label={t('party.address')} value={form.address} onChangeText={(v) => updateField('address', v)} multiline numberOfLines={2} mode="outlined" style={s.input} outlineStyle={s.inputOutline} left={<TextInput.Icon icon="home-outline" />} />
          </Surface>

          {/* Opening Balance */}
          <Text style={s.sectionLabel}>OPENING BALANCE</Text>
          <Surface style={s.formCard}>
            <TextInput label={t('party.openingBalance')} value={form.opening_balance} onChangeText={(v) => updateField('opening_balance', v)} keyboardType="numeric" mode="outlined" style={s.input} outlineStyle={s.inputOutline} left={<TextInput.Icon icon="currency-inr" />} />
            {form.opening_balance ? (
              <View style={s.balanceTypeRow}>
                <TouchableOpacity style={[s.balanceTypeBtn, form.opening_balance_type === 'dr' && s.balanceTypeDr]} onPress={() => updateField('opening_balance_type', 'dr')}>
                  <MaterialCommunityIcons name="arrow-bottom-left" size={18} color={form.opening_balance_type === 'dr' ? '#fff' : colors.debit} />
                  <RNText style={[s.balanceTypeBtnText, form.opening_balance_type === 'dr' && { color: '#fff' }]}>NAAM (Dr)</RNText>
                </TouchableOpacity>
                <TouchableOpacity style={[s.balanceTypeBtn, form.opening_balance_type === 'cr' && s.balanceTypeCr]} onPress={() => updateField('opening_balance_type', 'cr')}>
                  <MaterialCommunityIcons name="arrow-top-right" size={18} color={form.opening_balance_type === 'cr' ? '#fff' : colors.credit} />
                  <RNText style={[s.balanceTypeBtnText, form.opening_balance_type === 'cr' && { color: '#fff' }]}>JAMA (Cr)</RNText>
                </TouchableOpacity>
              </View>
            ) : null}
          </Surface>

          {/* Notes */}
          <Text style={s.sectionLabel}>NOTES</Text>
          <Surface style={s.formCard}>
            <TextInput label={t('party.notes')} value={form.notes} onChangeText={(v) => updateField('notes', v)} multiline numberOfLines={3} mode="outlined" style={s.input} outlineStyle={s.inputOutline} left={<TextInput.Icon icon="note-text-outline" />} />
          </Surface>
        </>
      )}
    </>
  );

  // ═══════════════════════════════════
  // WEB VIEW
  // ═══════════════════════════════════
  if (isWeb) {
    return (
      <View style={wStyles.container}>
        <LoadingOverlay visible={mutation.isPending} message="Saving party..." />
        {/* Web Header Bar */}
        <View style={wStyles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={wStyles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={wStyles.headerTitle}>Add New Party</Text>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => router.back()} style={wStyles.cancelBtn}>
            <RNText style={wStyles.cancelText}>Cancel</RNText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[wStyles.saveAndAddBtn, mutation.isPending && { opacity: 0.5 }]}
            onPress={() => handleSubmit(true)}
            disabled={mutation.isPending}
          >
            <MaterialCommunityIcons name="plus" size={18} color={colors.primary} />
            <RNText style={wStyles.saveAndAddText}>Save & Add Another</RNText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[wStyles.saveBtn, mutation.isPending && { opacity: 0.5 }]}
            onPress={() => handleSubmit(false)}
            disabled={mutation.isPending}
          >
            <MaterialCommunityIcons name="check" size={18} color="#fff" />
            <RNText style={wStyles.saveBtnText}>{mutation.isPending ? 'Saving...' : 'Save Party'}</RNText>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={wStyles.scroll} showsVerticalScrollIndicator={false}>
          <View style={wStyles.formWrap}>
            {formContent}
          </View>
        </ScrollView>
        <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={3000} style={{ backgroundColor: '#2e7d32' }}>{snackbar}</Snackbar>
      </View>
    );
  }

  // ═══════════════════════════════════
  // MOBILE VIEW
  // ═══════════════════════════════════
  return (
    <View style={mStyles.container}>
      <LoadingOverlay visible={mutation.isPending} message="Saving party..." />
      {/* Mobile Header */}
      <View style={mStyles.header}>
        <TouchableOpacity onPress={() => router.back()} style={mStyles.headerBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={mStyles.headerTitle}>Add Party</Text>
        <TouchableOpacity onPress={() => router.back()} style={mStyles.headerBtn}>
          <MaterialCommunityIcons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={mStyles.scroll} showsVerticalScrollIndicator={false}>
        {formContent}

        {/* Submit buttons */}
        <TouchableOpacity
          style={[s.submitBtn, mutation.isPending && s.submitBtnDisabled]}
          activeOpacity={0.8}
          onPress={() => handleSubmit(false)}
          disabled={mutation.isPending}
        >
          <MaterialCommunityIcons name="check-circle" size={22} color="#fff" />
          <RNText style={s.submitText}>{mutation.isPending ? 'Saving...' : t('common.save')}</RNText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.saveAddBtn, mutation.isPending && s.submitBtnDisabled]}
          activeOpacity={0.8}
          onPress={() => handleSubmit(true)}
          disabled={mutation.isPending}
        >
          <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.primary} />
          <RNText style={s.saveAddText}>Save & Add Another</RNText>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={3000} style={{ backgroundColor: '#2e7d32' }}>{snackbar}</Snackbar>
    </View>
  );
}

/* ─── Shared Styles ─── */
const s = StyleSheet.create({
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#B0B5C8', letterSpacing: 1.2, marginTop: 18, marginBottom: 8, marginLeft: 4 },
  formCard: { borderRadius: 16, padding: 16, elevation: 1, backgroundColor: '#fff' },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeCard: { flex: 1, borderRadius: 14, borderWidth: 2, borderColor: '#ECEEF5', backgroundColor: '#fff', padding: 14, alignItems: 'center' },
  typeIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  typeLabel: { fontSize: 12, fontWeight: '500', color: '#6C7293', marginTop: 8 },
  input: { marginBottom: 12, backgroundColor: 'transparent' },
  inputOutline: { borderRadius: 12 },
  error: { color: colors.error, fontSize: 12, marginTop: -8, marginBottom: 8, marginLeft: 4 },
  balanceTypeRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  balanceTypeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 2, borderColor: '#ECEEF5', backgroundColor: '#fff' },
  balanceTypeDr: { backgroundColor: colors.debit, borderColor: colors.debit },
  balanceTypeCr: { backgroundColor: colors.credit, borderColor: colors.credit },
  balanceTypeBtnText: { fontSize: 13, fontWeight: '600', color: '#6C7293' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, paddingVertical: 16, borderRadius: 16, backgroundColor: colors.primary, elevation: 2 },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  saveAddBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 10, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: colors.primary, backgroundColor: '#fff' },
  saveAddText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  optionalToggle: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18, paddingVertical: 10, paddingHorizontal: 4 },
  optionalToggleText: { fontSize: 13, color: '#8A8FA8', fontWeight: '500' },
});

/* ─── Web Styles ─── */
const wStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  headerBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#ECEEF5', gap: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#F5F6FA',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#ECEEF5' },
  cancelText: { fontSize: 13, fontWeight: '600', color: '#6C7293' },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10,
  },
  saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  saveAndAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: colors.primary,
  },
  saveAndAddText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  scroll: { padding: 32, paddingBottom: 60 },
  formWrap: { maxWidth: 640 },
});

/* ─── Mobile Styles ─── */
const mStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.primary, paddingTop: 48, paddingBottom: 14, paddingHorizontal: 12,
  },
  headerBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  scroll: { padding: spacing.base, paddingBottom: 40 },
});
