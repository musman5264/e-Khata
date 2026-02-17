import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, useWindowDimensions } from 'react-native';
import { TextInput, Button, SegmentedButtons, Text, Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

export default function EditPartyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
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
    notes: '',
    bill_book_name: '',
    bill_book_number: '',
    page_number: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const { data: party } = useQuery({
    queryKey: ['party', id],
    queryFn: async () => {
      const res = await api.get(`/parties/${id}`);
      return res.data.data;
    },
  });

  useEffect(() => {
    if (party) {
      setForm({
        name: party.name || '',
        mobile: party.mobile || '',
        email: party.email || '',
        city: party.city || '',
        address: party.address || '',
        type: party.type || 'customer',
        notes: party.notes || '',
        bill_book_name: party.bill_book_name || '',
        bill_book_number: party.bill_book_number || '',
        page_number: party.page_number || '',
      });
      if (party.photo_url) setPhotoUri(party.photo_url);
    }
  }, [party]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/parties/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['parties'] });
      queryClient.invalidateQueries({ queryKey: ['party', id] });
      router.back();
    },
    onError: (error: any) => {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    },
  });

  const photoMutation = useMutation({
    mutationFn: async (uri: string) => {
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('photo', blob, 'photo.jpg');
      } else {
        formData.append('photo', { uri, type: 'image/jpeg', name: 'photo.jpg' } as any);
      }
      const res = await api.post(`/parties/${id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: (data) => {
      setPhotoUri(data.data.photo_url);
      queryClient.invalidateQueries({ queryKey: ['party', id] });
    },
  });

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      photoMutation.mutate(uri);
    }
  };

  const handleSubmit = () => {
    mutation.mutate(form);
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Party Photo */}
      <View style={styles.photoSection}>
        <TouchableOpacity onPress={pickPhoto} activeOpacity={0.7} style={styles.photoWrap}>
          {photoUri ? (
            <Image source={{ uri: photoUri.startsWith('http') || photoUri.startsWith('/') ? photoUri : photoUri }} style={styles.photoImg} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <MaterialCommunityIcons name="camera-plus-outline" size={28} color="#B0B5C8" />
            </View>
          )}
          <View style={styles.photoBadge}>
            <MaterialCommunityIcons name="pencil" size={12} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>

      <TextInput
        label={t('party.name')}
        value={form.name}
        onChangeText={(v) => updateField('name', v)}
        error={!!errors.name}
        mode="outlined"
        style={styles.input}
      />

      <TextInput
        label={t('party.mobile')}
        value={form.mobile}
        onChangeText={(v) => updateField('mobile', v)}
        keyboardType="phone-pad"
        error={!!errors.mobile}
        mode="outlined"
        style={styles.input}
      />

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

      {/* Bill Book Section */}
      <Text variant="labelLarge" style={styles.label}>Bill Book (Optional)</Text>
      <Surface style={styles.billBookCard}>
        <TextInput
          label="Bill Book Name"
          value={form.bill_book_name}
          onChangeText={(v) => updateField('bill_book_name', v)}
          mode="outlined"
          style={styles.input}
          left={<TextInput.Icon icon="book-open-outline" />}
          placeholder="e.g. Sales Book"
        />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <TextInput
              label="Bill Book #"
              value={form.bill_book_number}
              onChangeText={(v) => updateField('bill_book_number', v)}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="numeric" />}
            />
          </View>
          <View style={{ flex: 1 }}>
            <TextInput
              label="Page #"
              value={form.page_number}
              onChangeText={(v) => updateField('page_number', v)}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="file-document-outline" />}
            />
          </View>
        </View>
      </Surface>

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
  submitBtn: { marginTop: spacing.lg, borderRadius: 8 },
  billBookCard: { borderRadius: 12, padding: 14, elevation: 1, backgroundColor: '#fff', marginBottom: spacing.md },
  photoSection: { alignItems: 'center', paddingVertical: 16 },
  photoWrap: { position: 'relative' },
  photoImg: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#ECEEF5' },
  photoPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3F4F6', borderWidth: 2, borderColor: '#ECEEF5', alignItems: 'center', justifyContent: 'center' },
  photoBadge: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
});
