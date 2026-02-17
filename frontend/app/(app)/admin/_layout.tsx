import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen name="settings" options={{ title: 'System Settings' }} />
      <Stack.Screen name="users" options={{ title: 'Manage Users' }} />
      <Stack.Screen name="tenants" options={{ title: 'Manage Businesses' }} />
      <Stack.Screen name="dashboard" options={{ title: 'Admin Dashboard' }} />
      <Stack.Screen name="subscriptions" options={{ title: 'Manage Subscriptions' }} />
    </Stack>
  );
}
