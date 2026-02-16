import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { TextInput, Button, Text, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth';
import { colors, spacing } from '@/theme';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');
    try {
      await register({ name, mobile, email: email || undefined, password });
      router.replace('/(app)/(tabs)/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text variant="headlineLarge" style={styles.appName}>e-Khata</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>Create your account</Text>
        </View>

        <Surface style={styles.card}>
          <Text variant="titleLarge" style={styles.cardTitle}>{t('auth.register')}</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TextInput
            label={t('auth.name')}
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
          />

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
            label={`${t('auth.email')} (optional)`}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            mode="outlined"
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
            onPress={handleRegister}
            loading={isLoading}
            disabled={isLoading || !name || !mobile || !password}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            {t('auth.register')}
          </Button>

          <Button
            mode="text"
            onPress={() => router.back()}
            style={styles.linkButton}
          >
            Already have an account? {t('auth.login')}
          </Button>
        </Surface>
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
  card: { padding: spacing.xl, borderRadius: 16, elevation: 4 },
  cardTitle: { fontWeight: '600', marginBottom: spacing.base, textAlign: 'center' },
  input: { marginBottom: spacing.md },
  button: { marginTop: spacing.base, borderRadius: 8, backgroundColor: colors.primary },
  buttonContent: { paddingVertical: 6 },
  linkButton: { marginTop: spacing.md },
  error: { color: colors.error, textAlign: 'center', marginBottom: spacing.md },
});
