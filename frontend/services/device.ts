import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { Platform } from 'react-native';

export interface DeviceData {
  device_name: string;
  device_type: string;
  platform: string;
  os_version: string;
  app_version: string;
  brand: string;
  model: string;
}

export async function getDeviceData(): Promise<DeviceData> {
  const deviceType = await Device.getDeviceTypeAsync();
  const typeMap: Record<number, string> = {
    0: 'Unknown', 1: 'Phone', 2: 'Tablet', 3: 'Desktop', 4: 'TV',
  };

  return {
    device_name: Device.deviceName || `${Device.brand} ${Device.modelName}`,
    device_type: typeMap[deviceType] || 'Unknown',
    platform: Platform.OS,
    os_version: `${Device.osName} ${Device.osVersion}`,
    app_version: Application.nativeApplicationVersion || '1.0.0',
    brand: Device.brand || 'Unknown',
    model: Device.modelName || 'Unknown',
  };
}
