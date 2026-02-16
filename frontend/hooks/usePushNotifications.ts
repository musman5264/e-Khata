import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import api from '@/services/api';

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    registerForPushNotifications();
  }, []);

  async function registerForPushNotifications() {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return;
    }

    try {
      // Dynamic import to avoid crash on web
      const Notifications = await import('expo-notifications').catch(() => null);
      if (!Notifications) return;

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission not granted');
        return;
      }

      setPermissionGranted(true);

      // Get FCM token and send to backend
      const tokenData = await Notifications.getExpoPushTokenAsync();
      const token = tokenData.data;
      setExpoPushToken(token);

      // Send token to backend
      await api.post('/sessions/fcm-token', { fcm_token: token }).catch(() => {});

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
        });
      }
    } catch (error) {
      console.error('Error registering push notifications:', error);
    }
  }

  return { expoPushToken, permissionGranted };
}
