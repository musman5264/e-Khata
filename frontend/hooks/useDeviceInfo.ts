import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Application from 'expo-application';

interface DeviceInfo {
  deviceName: string;
  deviceType: string;
  brand: string;
  modelName: string;
  osName: string;
  osVersion: string;
  appVersion: string;
  isDevice: boolean;
  platform: string;
}

export function useDeviceInfo(): DeviceInfo {
  const [info, setInfo] = useState<DeviceInfo>({
    deviceName: '',
    deviceType: '',
    brand: '',
    modelName: '',
    osName: '',
    osVersion: '',
    appVersion: '',
    isDevice: false,
    platform: Platform.OS,
  });

  useEffect(() => {
    const gather = async () => {
      const deviceType = await Device.getDeviceTypeAsync();
      const typeMap: Record<number, string> = {
        0: 'Unknown',
        1: 'Phone',
        2: 'Tablet',
        3: 'Desktop',
        4: 'TV',
      };

      setInfo({
        deviceName: Device.deviceName || 'Unknown',
        deviceType: typeMap[deviceType] || 'Unknown',
        brand: Device.brand || 'Unknown',
        modelName: Device.modelName || 'Unknown',
        osName: Device.osName || Platform.OS,
        osVersion: Device.osVersion || '',
        appVersion: Application.nativeApplicationVersion || '1.0.0',
        isDevice: Device.isDevice,
        platform: Platform.OS,
      });
    };

    gather();
  }, []);

  return info;
}
