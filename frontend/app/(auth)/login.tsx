import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, useWindowDimensions } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth';
import { colors, spacing } from '@/theme';
import LoadingOverlay from '@/components/LoadingOverlay';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const { width } = useWindowDimensions();
  const isWide = Platform.OS === 'web' && width > 600;

  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    try {
      await login({ mobile, password });
      router.replace('/(app)/(tabs)/dashboard');
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK' || !err.response) {
        setError('Cannot connect to server. Please make sure the backend is running.');
      } else {
        setError(err.response?.data?.message || 'Login failed. Please try again.');
      }
    }
  };

  const formContent = (
    <>
      <Text variant="titleLarge" style={styles.cardTitle}>{t('auth.login')}</Text>
      <Text style={styles.cardSubtitle}>Enter your credentials to continue</Text>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <TextInput
        label={t('auth.mobile')}
        value={mobile}
        onChangeText={setMobile}
        keyboardType="phone-pad"
        mode="outlined"
        left={<TextInput.Icon icon="phone" />}
        outlineStyle={styles.inputOutline}
        style={styles.input}
      />

      <TextInput
        label={t('auth.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        mode="outlined"
        left={<TextInput.Icon icon="lock" />}
        right={
          <TextInput.Icon
            icon={showPassword ? 'eye-off' : 'eye'}
            onPress={() => setShowPassword(!showPassword)}
          />
        }
        outlineStyle={styles.inputOutline}
        style={styles.input}
      />

      <Button
        mode="contained"
        onPress={handleLogin}
        loading={isLoading}
        disabled={isLoading || !mobile || !password}
        style={styles.button}
        contentStyle={styles.buttonContent}
        labelStyle={styles.buttonLabel}
      >
        {t('auth.login')}
      </Button>

      <Button
        mode="text"
        onPress={() => router.push('/(auth)/register')}
        style={styles.linkButton}
        labelStyle={{ fontSize: 13 }}
      >
        Don't have an account? {t('auth.register')}
      </Button>
    </>
  );

  // ── Web: Split layout with branding panel + form ──
  if (isWide) {
    return (
      <View style={styles.webContainer}>
        <LoadingOverlay visible={isLoading} message="Signing in..." />
        {/* Left branding panel */}
        <View style={styles.webBranding}>
          <View style={styles.brandContent}>
            <Text style={styles.webLogo}>📒</Text>
            <Text style={styles.webAppName}>e-Khata</Text>
            <Text style={styles.webTagline}>
              Your digital ledger for{'\n'}Pakistani businesses
            </Text>
            <View style={styles.webFeatures}>
              {['Track Udhar & Jama', 'Share statements on WhatsApp', 'Team access with roles', 'PKR payments via JazzCash'].map((f) => (
                <View key={f} style={styles.featureRow}>
                  <Text style={styles.featureCheck}>✓</Text>
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
          <Text style={styles.webFooterBrand}>Powered by Esystematic Technologies</Text>
        </View>

        {/* Right form panel */}
        <View style={styles.webFormPanel}>
          <View style={styles.webFormInner}>
            {formContent}
          </View>
        </View>
      </View>
    );
  }

  // ── Mobile: Full-screen gradient with card ──
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LoadingOverlay visible={isLoading} message="Signing in..." />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logoEmoji}>📒</Text>
          <Text style={styles.appName}>e-Khata</Text>
          <Text style={styles.subtitle}>Digital Ledger for Pakistani Businesses</Text>
        </View>

        <Surface style={styles.card}>
          {formContent}
        </Surface>

        <Text style={styles.footer}>Powered by Esystematic Technologies</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // ── Mobile styles ──
  container: { flex: 1, backgroundColor: colors.primary },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  header: { alignItems: 'center', marginBottom: 32 },
  logoEmoji: { fontSize: 52, marginBottom: 8 },
  appName: { color: '#fff', fontWeight: '800', fontSize: 34, letterSpacing: 1 },
  subtitle: { color: 'rgba(255,255,255,0.7)', marginTop: 6, fontSize: 14 },
  card: {
    padding: 28,
    borderRadius: 20,
    elevation: 6,
    backgroundColor: colors.surface,
  },
  cardTitle: { fontWeight: '700', textAlign: 'center', color: colors.text, fontSize: 22 },
  cardSubtitle: { textAlign: 'center', color: colors.textSecondary, marginBottom: 20, fontSize: 13 },
  errorBanner: {
    backgroundColor: '#FFF0F0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
  },
  errorText: { color: colors.error, fontSize: 13 },
  input: { marginBottom: 14, backgroundColor: 'transparent' },
  inputOutline: { borderRadius: 12, borderColor: colors.outline },
  button: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: colors.primary,
    elevation: 2,
  },
  buttonContent: { paddingVertical: 8 },
  buttonLabel: { fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  linkButton: { marginTop: 12 },
  footer: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.4)',
    marginTop: 32,
    fontSize: 11,
  },

  // ── Web split layout ──
  webContainer: { flex: 1, flexDirection: 'row' },
  webBranding: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  brandContent: { maxWidth: 400 },
  webLogo: { fontSize: 64, marginBottom: 16 },
  webAppName: { color: '#fff', fontWeight: '800', fontSize: 42, letterSpacing: 1.5 },
  webTagline: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
    marginTop: 12,
    lineHeight: 28,
  },
  webFeatures: { marginTop: 36 },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  featureCheck: { color: colors.secondary, fontSize: 18, fontWeight: 'bold', marginRight: 12 },
  featureText: { color: 'rgba(255,255,255,0.85)', fontSize: 15 },
  webFooterBrand: {
    position: 'absolute',
    bottom: 24,
    color: 'rgba(255,255,255,0.35)',
    fontSize: 12,
  },
  webFormPanel: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 48,
  },
  webFormInner: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    padding: 40,
    borderRadius: 24,
    // @ts-ignore web shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 4,
  },
});
