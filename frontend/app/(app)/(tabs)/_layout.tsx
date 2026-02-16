import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors } from '@/theme';

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.divider,
          elevation: 8,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.onPrimary,
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t('dashboard.title'),
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="parties"
        options={{
          title: t('party.title'),
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="account-group" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="daybook"
        options={{
          title: t('report.daybook'),
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="book-open-variant" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="dots-horizontal" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

// Simple text-based icon fallback (replace with vector icons in production)
function TabIcon({ name, color, size }: { name: string; color: string; size: number }) {
  const iconMap: Record<string, string> = {
    'view-dashboard': '📊',
    'account-group': '👥',
    'book-open-variant': '📖',
    'dots-horizontal': '⋯',
  };
  const { Text } = require('react-native');
  return <Text style={{ fontSize: size - 4, color }}>{iconMap[name] || '•'}</Text>;
}
