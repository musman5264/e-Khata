import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth';
import { colors, spacing } from '@/theme';

export default function LoginScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);

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
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Logo / Header */}
        <View style={styles.header}>
          <Text variant="headlineLarge" style={styles.appName}>e-Khata</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Digital Ledger for Pakistani Businesses
          </Text>
        </View>

        {/* Login Form */}
        <Surface style={styles.card}>
          <Text variant="titleLarge" style={styles.cardTitle}>{t('auth.login')}</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TextInput
            label={t('auth.mobile')}
            value={mobile}
            onChangeText={setMobile}
            keyboardType="phone-pad"
            mode="outlined"
            left={<TextInput.Affix text="+92 " />}
            style={styles.input}
          />

          <TextInput
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            mode="outlined"
            right={
              <TextInput.Icon
                icon={showPassword ? 'eye-off' : 'eye'}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            style={styles.input}
          />

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading || !mobile || !password}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            {t('auth.login')}
          </Button>

          <Button
            mode="text"
            onPress={() => router.push('/(auth)/register')}
            style={styles.linkButton}
          >
            Don't have an account? {t('auth.register')}
          </Button>
        </Surface>

        {/* Footer */}
        <Text style={styles.footer}>
          Powered by Esystematic Technologies
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  appName: { color: '#fff', fontWeight: 'bold', fontSize: 36 },
  subtitle: { color: 'rgba(255,255,255,0.8)', marginTop: spacing.xs },
  card: {
    padding: spacing.xl,
    borderRadius: 16,
    elevation: 4,
  },
  cardTitle: { fontWeight: '600', marginBottom: spacing.base, textAlign: 'center' },
  input: { marginBottom: spacing.md },
  button: {
    marginTop: spacing.base,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  buttonContent: { paddingVertical: 6 },
  linkButton: { marginTop: spacing.md },
  error: { color: colors.error, textAlign: 'center', marginBottom: spacing.md },
  footer: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.5)',
    marginTop: spacing.xxl,
    fontSize: 11,
  },
});
