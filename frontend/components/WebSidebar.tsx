import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useAuthStore } from '@/stores/auth';
import { colors } from '@/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface NavItem {
  label: string;
  icon: IconName;
  activeIcon: IconName;
  path: string;
  match: string; // pathname match
}

const MAIN_NAV: NavItem[] = [
  { label: 'Dashboard', icon: 'view-dashboard-outline', activeIcon: 'view-dashboard', path: '/(app)/(tabs)/dashboard', match: 'dashboard' },
  { label: 'Parties', icon: 'account-group-outline', activeIcon: 'account-group', path: '/(app)/(tabs)/parties', match: 'parties' },
  { label: 'Daybook', icon: 'book-open-page-variant-outline', activeIcon: 'book-open-page-variant', path: '/(app)/(tabs)/daybook', match: 'daybook' },
  { label: 'Reports', icon: 'chart-bar', activeIcon: 'chart-bar', path: '/(app)/reports/trial-balance', match: 'reports' },
  { label: 'Team', icon: 'account-multiple-outline', activeIcon: 'account-multiple', path: '/(app)/team/members', match: 'team' },
  { label: 'Payments', icon: 'credit-card-outline', activeIcon: 'credit-card', path: '/(app)/payment/history', match: 'payment' },
];

const SETTINGS_NAV: NavItem[] = [
  { label: 'Business', icon: 'domain', activeIcon: 'domain', path: '/(app)/settings/tenant', match: 'tenant' },
  { label: 'Profile', icon: 'account-circle-outline', activeIcon: 'account-circle', path: '/(app)/settings/profile', match: 'profile' },
  { label: 'Notifications', icon: 'bell-outline', activeIcon: 'bell', path: '/(app)/settings/notification-prefs', match: 'notification' },
  { label: 'Sessions', icon: 'cellphone-link', activeIcon: 'cellphone-link', path: '/(app)/settings/sessions', match: 'sessions' },
  { label: 'Language', icon: 'translate', activeIcon: 'translate', path: '/(app)/settings/language', match: 'language' },
];

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', icon: 'monitor-dashboard', activeIcon: 'monitor-dashboard', path: '/(app)/admin/dashboard', match: 'admin/dashboard' },
  { label: 'Settings', icon: 'cog-outline', activeIcon: 'cog', path: '/(app)/admin/settings', match: 'admin/settings' },
  { label: 'Users', icon: 'account-supervisor-outline', activeIcon: 'account-supervisor', path: '/(app)/admin/users', match: 'admin/users' },
  { label: 'Businesses', icon: 'store-outline', activeIcon: 'store', path: '/(app)/admin/tenants', match: 'admin/tenants' },
];

function SidebarItem({ item, isActive, onPress }: { item: NavItem; isActive: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.navItem, isActive && styles.navItemActive]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <MaterialCommunityIcons
        name={isActive ? item.activeIcon : item.icon}
        size={20}
        color={isActive ? colors.primary : '#8A8FA8'}
      />
      <Text style={[styles.navLabel, isActive && styles.navLabelActive]}>
        {item.label}
      </Text>
      {isActive && <View style={styles.activeIndicator} />}
    </TouchableOpacity>
  );
}

export default function WebSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const isSuperAdmin = user?.roles?.some((r: any) => r.name === 'Super Admin') ?? false;

  const isActive = (item: NavItem) => pathname.includes(item.match);
  const initials = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <View style={styles.sidebar}>
      {/* Logo */}
      <View style={styles.logoSection}>
        <View style={styles.logoIcon}>
          <MaterialCommunityIcons name="book-open-variant" size={22} color="#fff" />
        </View>
        <View>
          <Text style={styles.logoText}>e-Khata</Text>
          <Text style={styles.logoSub}>Digital Ledger</Text>
        </View>
      </View>

      <ScrollView style={styles.navScroll} showsVerticalScrollIndicator={false}>
        {/* Main Navigation */}
        <Text style={styles.sectionLabel}>MENU</Text>
        {MAIN_NAV.map((item) => (
          <SidebarItem
            key={item.path}
            item={item}
            isActive={isActive(item)}
            onPress={() => router.push(item.path as any)}
          />
        ))}

        {/* Admin */}
        {isSuperAdmin && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>ADMIN</Text>
            {ADMIN_NAV.map((item) => (
              <SidebarItem
                key={item.path}
                item={item}
                isActive={isActive(item)}
                onPress={() => router.push(item.path as any)}
              />
            ))}
          </>
        )}

        {/* Settings */}
        <Text style={[styles.sectionLabel, { marginTop: 24 }]}>SETTINGS</Text>
        {SETTINGS_NAV.map((item) => (
          <SidebarItem
            key={item.path}
            item={item}
            isActive={isActive(item)}
            onPress={() => router.push(item.path as any)}
          />
        ))}
      </ScrollView>

      {/* User Profile */}
      <View style={styles.userSection}>
        <View style={styles.userDivider} />
        <View style={styles.userRow}>
          <View style={styles.userAvatar}>
            <Text style={styles.userInitials}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName} numberOfLines={1}>{user?.name || 'User'}</Text>
            <Text style={styles.userMobile}>{user?.mobile || ''}</Text>
          </View>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={async () => { await logout(); router.replace('/(auth)/login'); }}
          >
            <MaterialCommunityIcons name="logout" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#ECEEF5',
    paddingTop: 0,
  },

  // Logo
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 20,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ECEEF5',
  },
  logoIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { fontSize: 18, fontWeight: '800', color: colors.primary, letterSpacing: 0.5 },
  logoSub: { fontSize: 10, color: '#8A8FA8', letterSpacing: 0.5, marginTop: -1 },

  // Nav
  navScroll: { flex: 1, paddingHorizontal: 12, paddingTop: 8 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B0B5C8',
    letterSpacing: 1.5,
    paddingHorizontal: 12,
    marginTop: 16,
    marginBottom: 6,
  },

  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 2,
    position: 'relative' as const,
  },
  navItemActive: {
    backgroundColor: colors.primary + '0D', // 5% opacity
  },
  navLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6C7293',
    marginLeft: 12,
  },
  navLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute' as const,
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },

  // User
  userSection: { paddingHorizontal: 12, paddingBottom: 16 },
  userDivider: { height: 1, backgroundColor: '#ECEEF5', marginBottom: 12 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 10,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInitials: { color: '#fff', fontWeight: '700', fontSize: 13 },
  userName: { fontSize: 13, fontWeight: '600', color: colors.text },
  userMobile: { fontSize: 11, color: '#8A8FA8' },
  logoutBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFF0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
