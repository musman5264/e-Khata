import React from 'react';
import { View, StyleSheet, ScrollView, Text } from 'react-native';
import { List, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth';
import { colors, spacing } from '@/theme';

export default function MoreScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);

  // Check if user has Super Admin role
  const isSuperAdmin = user?.roles?.some((r: any) => r.name === 'Super Admin') ?? false;

  const menuItems = [
    { title: t('report.title'), icon: '📊', route: '/(app)/reports/trial-balance' },
    { title: t('team.title'), icon: '👥', route: '/(app)/team/members' },
    { title: t('payment.history'), icon: '💳', route: '/(app)/payment/history' },
    { title: t('session.title'), icon: '📱', route: '/(app)/settings/sessions' },
    { title: t('notification.preferences'), icon: '🔔', route: '/(app)/settings/notification-prefs' },
    { title: t('settings.business'), icon: '🏢', route: '/(app)/settings/tenant' },
    { title: t('settings.profile'), icon: '👤', route: '/(app)/settings/profile' },
    { title: t('settings.language'), icon: '🌐', route: '/(app)/settings/language' },
  ];

  const adminMenuItems = [
    { title: 'Admin Dashboard', icon: '📈', route: '/(app)/admin/dashboard' },
    { title: 'System Settings', icon: '⚙️', route: '/(app)/admin/settings' },
    { title: 'Manage Users', icon: '👤', route: '/(app)/admin/users' },
    { title: 'Manage Businesses', icon: '🏪', route: '/(app)/admin/tenants' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Super Admin Section */}
      {isSuperAdmin && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔐 Super Admin</Text>
          </View>
          {adminMenuItems.map((item, index) => (
            <React.Fragment key={`admin-${item.title}`}>
              <List.Item
                title={item.title}
                left={() => <List.Icon icon={() => <View style={styles.iconWrap}><View><Text style={{ fontSize: 20 }}>{item.icon}</Text></View></View>} />}
                right={(props) => <List.Icon {...props} icon="chevron-right" />}
                onPress={() => router.push(item.route as any)}
                style={styles.menuItem}
              />
              {index < adminMenuItems.length - 1 && <Divider />}
            </React.Fragment>
          ))}
          <Divider style={{ marginVertical: spacing.md }} />
        </>
      )}

      {menuItems.map((item, index) => (
        <React.Fragment key={item.title}>
          <List.Item
            title={item.title}
            left={() => <List.Icon icon={() => <View style={styles.iconWrap}><View><Text style={{ fontSize: 20 }}>{item.icon}</Text></View></View>} />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => router.push(item.route as any)}
            style={styles.menuItem}
          />
          {index < menuItems.length - 1 && <Divider />}
        </React.Fragment>
      ))}

      <Divider style={{ marginVertical: spacing.md }} />

      <List.Item
        title={t('auth.logout')}
        titleStyle={{ color: colors.error }}
        left={() => <List.Icon icon="logout" color={colors.error} />}
        onPress={async () => {
          await logout();
          router.replace('/(auth)/login');
        }}
        style={styles.menuItem}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  menuItem: { paddingVertical: 4 },
  iconWrap: { justifyContent: 'center', alignItems: 'center', width: 40 },
  sectionHeader: { paddingHorizontal: spacing.base, paddingTop: spacing.md, paddingBottom: spacing.xs },
  sectionTitle: { fontWeight: '700', fontSize: 14, color: colors.primary },
});
