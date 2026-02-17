import { Stack } from 'expo-router';
import { Platform, View, useWindowDimensions } from 'react-native';
import WebSidebar from '@/components/WebSidebar';
import ImpersonationBanner from '@/components/ImpersonationBanner';
import SubscriptionBanner from '@/components/SubscriptionBanner';
import { colors } from '@/theme';

export default function AppLayout() {
  const { width } = useWindowDimensions();
  const isWebWide = Platform.OS === 'web' && width > 768;

  const stack = (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: isWebWide ? '#F5F6FA' : colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="party" />
      <Stack.Screen name="transaction" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="team" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="share" />
      <Stack.Screen name="notifications" options={{ headerShown: !isWebWide, title: 'Notifications' }} />
      <Stack.Screen name="logs" />
      <Stack.Screen name="admin" />
      <Stack.Screen name="subscription" />
    </Stack>
  );

  if (isWebWide) {
    return (
      <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#F5F6FA' }}>
        <WebSidebar />
        <View style={{ flex: 1 }}>
          <ImpersonationBanner />
          <SubscriptionBanner />
          {stack}
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ImpersonationBanner />
      <SubscriptionBanner />
      {stack}
    </View>
  );
}
