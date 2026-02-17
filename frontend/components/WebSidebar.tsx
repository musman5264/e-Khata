import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth';
import { usePermissions } from '@/hooks/usePermissions';
import { colors } from '@/theme';
import api from '@/services/api';

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
  { label: 'Reports', icon: 'chart-bar', activeIcon: 'chart-bar', path: '/(app)/reports', match: 'reports' },
  { label: 'Team', icon: 'account-multiple-outline', activeIcon: 'account-multiple', path: '/(app)/team/members', match: 'team' },
  { label: 'Payments', icon: 'credit-card-outline', activeIcon: 'credit-card', path: '/(app)/payment/history', match: 'payment/history' },
  { label: 'Payment Links', icon: 'link-variant', activeIcon: 'link-variant', path: '/(app)/payment/payment-links', match: 'payment-links' },
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
  { label: 'Reports', icon: 'chart-box-outline', activeIcon: 'chart-box', path: '/(app)/admin/reports', match: 'admin/reports' },
  { label: 'Settings', icon: 'cog-outline', activeIcon: 'cog', path: '/(app)/admin/settings', match: 'admin/settings' },
  { label: 'Users', icon: 'account-supervisor-outline', activeIcon: 'account-supervisor', path: '/(app)/admin/users', match: 'admin/users' },
  { label: 'Businesses', icon: 'store-outline', activeIcon: 'store', path: '/(app)/admin/tenants', match: 'admin/tenants' },
  { label: 'Sessions', icon: 'shield-lock-outline', activeIcon: 'shield-lock', path: '/(app)/admin/sessions', match: 'admin/sessions' },
  { label: 'Versions', icon: 'tag-outline', activeIcon: 'tag', path: '/(app)/admin/versions', match: 'admin/versions' },
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
  const currentTenant = useAuthStore((s) => s.currentTenant);
  const selectTenant = useAuthStore((s) => s.selectTenant);
  const logout = useAuthStore((s) => s.logout);
  const { isSuperAdmin, canManageTeam } = usePermissions();

  const { data: versionData } = useQuery({
    queryKey: ['current-version'],
    queryFn: async () => {
      const res = await api.get('/version/current');
      return res.data.data;
    },
    staleTime: 1000 * 60 * 60, // cache for 1 hour
  });

  const hasTenant = !!currentTenant;
  const tenants = user?.tenants ?? [];

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
        {/* Business Navigation (only if tenant selected OR non-admin user) */}
        {(hasTenant || !isSuperAdmin) && (
          <>
            <Text style={styles.sectionLabel}>MENU</Text>
            {MAIN_NAV.filter(item => {
              if (item.match === 'team') return canManageTeam;
              return true;
            }).map((item) => (
              <SidebarItem
                key={item.path}
                item={item}
                isActive={isActive(item)}
                onPress={() => router.push(item.path as any)}
              />
            ))}
          </>
        )}

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

        {/* Tenant selector for SuperAdmin */}
        {isSuperAdmin && tenants.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 24 }]}>BUSINESS</Text>
            {tenants.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.tenantItem, currentTenant?.id === t.id && styles.tenantItemActive]}
                onPress={() => selectTenant(t)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={currentTenant?.id === t.id ? 'store' : 'store-outline'}
                  size={18}
                  color={currentTenant?.id === t.id ? colors.primary : '#8A8FA8'}
                />
                <Text style={[styles.tenantLabel, currentTenant?.id === t.id && styles.tenantLabelActive]} numberOfLines={1}>
                  {t.name}
                </Text>
                {currentTenant?.id === t.id && (
                  <View style={styles.tenantBadge}>
                    <Text style={styles.tenantBadgeText}>Active</Text>
                  </View>
                )}
              </TouchableOpacity>
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
        <View style={styles.versionRow}>
          <Text style={styles.versionText}>e-Khata v{versionData?.version || '1.0.0'}</Text>
        </View>
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
  versionRow: { alignItems: 'center', paddingBottom: 8 },
  versionText: { fontSize: 10, color: '#B0B5C8', fontWeight: '500' },
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

  // Tenant selector
  tenantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 2,
    gap: 10,
  },
  tenantItemActive: {
    backgroundColor: colors.primary + '0D',
  },
  tenantLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#6C7293',
  },
  tenantLabelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  tenantBadge: {
    backgroundColor: '#F0FFF4',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tenantBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10B981',
  },
});
