import { Stack } from 'expo-router';

export default function SubscriptionLayout() {
  return (
    <Stack>
      <Stack.Screen name="plans" options={{ title: 'Subscription Plans' }} />
      <Stack.Screen name="status" options={{ title: 'My Subscription' }} />
    </Stack>
  );
}
