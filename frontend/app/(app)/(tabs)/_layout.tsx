import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/theme';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textHint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.divider,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === 'web' ? 64 : 60,
          paddingBottom: Platform.OS === 'web' ? 10 : 8,
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
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('dashboard.title'),
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-dashboard-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="parties"
        options={{
          title: t('party.title'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="daybook"
        options={{
          title: t('report.daybook'),
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="book-open-page-variant-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="dots-horizontal-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
