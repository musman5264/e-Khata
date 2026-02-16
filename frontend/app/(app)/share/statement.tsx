import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import api from '@/services/api';
import { colors, spacing } from '@/theme';

export default function ShareStatementScreen() {
  const { t } = useTranslation();
  const { party_id } = useLocalSearchParams<{ party_id: string }>();

  const pdfMutation = useMutation({
    mutationFn: async () => {
      const res = await api.get(`/share/pdf/${party_id}`, { responseType: 'blob' });
      return res.data;
    },
    onSuccess: () => Alert.alert(t('common.success'), t('share.pdfGenerated')),
  });

  const whatsappMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/share/whatsapp/${party_id}`);
      return res.data;
    },
    onSuccess: (data) => {
      if (data.data?.whatsapp_url) {
        // Open WhatsApp link
        Alert.alert(t('common.success'), t('share.whatsappSent'));
      }
    },
  });

  const emailMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/share/email/${party_id}`);
      return res.data;
    },
    onSuccess: () => Alert.alert(t('common.success'), t('share.emailSent')),
  });

  const linkMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/share/link/${party_id}`);
      return res.data;
    },
    onSuccess: (data) => {
      Alert.alert(t('common.success'), `${t('share.linkGenerated')}\n${data.data?.url || ''}`);
    },
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.title}>{t('share.share')}</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>{t('share.chooseMethod')}</Text>

      <Button mode="contained" icon="file-pdf-box" onPress={() => pdfMutation.mutate()}
        loading={pdfMutation.isPending} style={styles.btn} buttonColor="#D32F2F" textColor="#fff">
        {t('share.downloadPdf')}
      </Button>

      <Button mode="contained" icon="whatsapp" onPress={() => whatsappMutation.mutate()}
        loading={whatsappMutation.isPending} style={styles.btn} buttonColor="#25D366" textColor="#fff">
        {t('share.whatsapp')}
      </Button>

      <Button mode="contained" icon="email" onPress={() => emailMutation.mutate()}
        loading={emailMutation.isPending} style={styles.btn} buttonColor="#1976D2" textColor="#fff">
        {t('share.email')}
      </Button>

      <Button mode="outlined" icon="link" onPress={() => linkMutation.mutate()}
        loading={linkMutation.isPending} style={styles.btn}>
        {t('share.copyLink')}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.base, paddingBottom: 40 },
  title: { fontWeight: 'bold', marginBottom: spacing.sm },
  subtitle: { color: colors.textSecondary, marginBottom: spacing.xl },
  btn: { marginBottom: spacing.md, borderRadius: 8 },
});
