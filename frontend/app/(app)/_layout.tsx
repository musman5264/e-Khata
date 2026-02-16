import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="party" />
      <Stack.Screen name="transaction" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="team" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="share" />
      <Stack.Screen name="notifications" options={{ headerShown: true, title: 'Notifications' }} />
      <Stack.Screen name="logs" />
      <Stack.Screen name="admin" />
    </Stack>
  );
}
