import { Tabs } from 'expo-router';
import { Platform, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/theme';

export default function TabLayout() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const isWebWide = Platform.OS === 'web' && width > 768;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: '#B0B5C8',
        tabBarStyle: isWebWide
          ? { display: 'none' }
          : {
              backgroundColor: colors.surface,
              borderTopWidth: 0,
              elevation: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              height: 64,
              paddingBottom: 10,
              paddingTop: 6,
            },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
        headerStyle: {
          backgroundColor: colors.primary,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: colors.onPrimary,
        headerTitleStyle: { fontWeight: '700', fontSize: 18, letterSpacing: 0.3 },
        headerShown: !isWebWide,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('dashboard.title'),
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'view-dashboard' : 'view-dashboard-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="parties"
        options={{
          title: t('party.title'),
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'account-group' : 'account-group-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="daybook"
        options={{
          title: t('report.daybook'),
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'book-open-page-variant' : 'book-open-page-variant-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          // On web with sidebar, hide this tab completely
          href: isWebWide ? null : undefined,
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'dots-horizontal-circle' : 'dots-horizontal-circle-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
