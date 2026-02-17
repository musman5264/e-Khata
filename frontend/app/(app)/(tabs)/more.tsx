import React from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity, Platform } from 'react-native';
import { Surface } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/stores/auth';
import { colors, spacing } from '@/theme';
import WebContainer from '@/components/WebContainer';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface MenuItem {
  title: string;
  icon: IconName;
  iconBg: string;
  iconColor: string;
  route: string;
}

function MenuRow({ item, onPress }: { item: MenuItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuRow} activeOpacity={0.6} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: item.iconBg }]}>
        <MaterialCommunityIcons name={item.icon} size={20} color={item.iconColor} />
      </View>
      <Text style={styles.menuLabel}>{item.title}</Text>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textHint} />
    </TouchableOpacity>
  );
}

export default function MoreScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const isSuperAdmin = user?.roles?.some((r: any) => r.name === 'Super Admin') ?? false;

  const generalItems: MenuItem[] = [
    { title: t('report.title'), icon: 'chart-bar', iconBg: '#EBF5FB', iconColor: '#2E86C1', route: '/(app)/reports/trial-balance' },
    { title: t('team.title'), icon: 'account-multiple-outline', iconBg: '#E8F8F5', iconColor: '#00B894', route: '/(app)/team/members' },
    { title: t('payment.history'), icon: 'credit-card-outline', iconBg: '#FEF9E7', iconColor: '#D4AC0D', route: '/(app)/payment/history' },
  ];

  const settingsItems: MenuItem[] = [
    { title: t('session.title'), icon: 'cellphone-link', iconBg: '#F5EEF8', iconColor: '#8E44AD', route: '/(app)/settings/sessions' },
    { title: t('notification.preferences'), icon: 'bell-outline', iconBg: '#FFF3E0', iconColor: '#E67E22', route: '/(app)/settings/notification-prefs' },
    { title: t('settings.business'), icon: 'domain', iconBg: '#E3F2FD', iconColor: '#1565C0', route: '/(app)/settings/tenant' },
    { title: t('settings.profile'), icon: 'account-circle-outline', iconBg: '#E8F5E9', iconColor: '#2E7D32', route: '/(app)/settings/profile' },
    { title: t('settings.language'), icon: 'translate', iconBg: '#FCE4EC', iconColor: '#C62828', route: '/(app)/settings/language' },
  ];

  const adminItems: MenuItem[] = [
    { title: 'Admin Dashboard', icon: 'monitor-dashboard', iconBg: '#EDE7F6', iconColor: '#5E35B1', route: '/(app)/admin/dashboard' },
    { title: 'System Settings', icon: 'cog-outline', iconBg: '#E0F2F1', iconColor: '#00897B', route: '/(app)/admin/settings' },
    { title: 'Manage Users', icon: 'account-supervisor-outline', iconBg: '#E3F2FD', iconColor: '#1976D2', route: '/(app)/admin/users' },
    { title: 'Manage Businesses', icon: 'store-outline', iconBg: '#FFF3E0', iconColor: '#EF6C00', route: '/(app)/admin/tenants' },
  ];

  const initials = user?.name ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) : 'U';

  return (
    <WebContainer>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <Surface style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitials}>{initials}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.profileName}>{user?.name || 'User'}</Text>
            <Text style={styles.profileMobile}>{user?.mobile || ''}</Text>
            {isSuperAdmin && (
              <View style={styles.adminBadge}>
                <MaterialCommunityIcons name="shield-star" size={12} color="#fff" />
                <Text style={styles.adminBadgeText}>Super Admin</Text>
              </View>
            )}
          </View>
        </Surface>

        {/* Super Admin Section */}
        {isSuperAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ADMIN PANEL</Text>
            <Surface style={styles.sectionCard}>
              {adminItems.map((item, i) => (
                <React.Fragment key={item.route}>
                  <MenuRow item={item} onPress={() => router.push(item.route as any)} />
                  {i < adminItems.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              ))}
            </Surface>
          </View>
        )}

        {/* General */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>GENERAL</Text>
          <Surface style={styles.sectionCard}>
            {generalItems.map((item, i) => (
              <React.Fragment key={item.route}>
                <MenuRow item={item} onPress={() => router.push(item.route as any)} />
                {i < generalItems.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </Surface>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SETTINGS</Text>
          <Surface style={styles.sectionCard}>
            {settingsItems.map((item, i) => (
              <React.Fragment key={item.route}>
                <MenuRow item={item} onPress={() => router.push(item.route as any)} />
                {i < settingsItems.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </Surface>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.7}
          onPress={async () => { await logout(); router.replace('/(auth)/login'); }}
        >
          <MaterialCommunityIcons name="logout" size={20} color={colors.error} />
          <Text style={styles.logoutText}>{t('auth.logout')}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </WebContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  // Profile
  profileCard: {
    margin: spacing.base,
    marginBottom: 4,
    padding: 18,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1,
    backgroundColor: colors.surface,
  },
  profileAvatar: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitials: { color: '#fff', fontWeight: '700', fontSize: 20 },
  profileName: { fontSize: 17, fontWeight: '700', color: colors.text },
  profileMobile: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#E84393',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  adminBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },

  // Sections
  section: { marginTop: 16, paddingHorizontal: spacing.base },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textHint, letterSpacing: 1.2, marginBottom: 8, marginLeft: 4 },
  sectionCard: { borderRadius: 16, overflow: 'hidden', elevation: 1, backgroundColor: colors.surface },

  // Menu rows
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { flex: 1, marginLeft: 14, fontSize: 14, fontWeight: '500', color: colors.text },
  divider: { height: 1, backgroundColor: colors.divider, marginLeft: 66 },

  // Logout
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    marginHorizontal: spacing.base,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFD4D4',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: colors.error },
});
