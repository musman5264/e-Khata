import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_BASE_URL = __DEV__
  ? Platform.select({
      android: 'http://10.0.2.2:8000/api/v1',
      ios: 'http://localhost:8000/api/v1',
      web: 'http://localhost:8000/api/v1',
      default: 'http://localhost:8000/api/v1',
    })
  : 'https://api.ekhata.pk/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor — attach auth token + tenant + device headers
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const tenantId = await getTenantId();
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
    }

    // Device headers will be set by the device service
    const deviceId = await getDeviceId();
    if (deviceId) {
      config.headers['X-Device-ID'] = deviceId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Track rehydration state - prevent 401 from clearing token during rehydrate
let isRehydrating = false;
export function setRehydrating(v: boolean) { isRehydrating = v; }

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !isRehydrating) {
      await removeToken();
      // The auth store will handle navigation
    }
    return Promise.reject(error);
  }
);

// Token management
async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem('auth_token');
    }
    return await SecureStore.getItemAsync('auth_token');
  } catch {
    return null;
  }
}

export async function getStoredToken(): Promise<string | null> {
  return getToken();
}

export async function setToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem('auth_token', token);
  } else {
    await SecureStore.setItemAsync('auth_token', token);
  }
}

export async function removeToken(): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem('auth_token');
  } else {
    await SecureStore.deleteItemAsync('auth_token');
  }
}

// Tenant ID management
async function getTenantId(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem('tenant_id');
    }
    return await SecureStore.getItemAsync('tenant_id');
  } catch {
    return null;
  }
}

export async function setTenantId(id: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem('tenant_id', id);
  } else {
    await SecureStore.setItemAsync('tenant_id', id.toString());
  }
}

export async function getStoredTenantId(): Promise<string | null> {
  return getTenantId();
}

// Device ID management
async function getDeviceId(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      let id = localStorage.getItem('device_id');
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem('device_id', id);
      }
      return id;
    }
    let id = await SecureStore.getItemAsync('device_id');
    if (!id) {
      id = `${Date.now()}-${Math.random().toString(36).substring(2)}`;
      await SecureStore.setItemAsync('device_id', id);
    }
    return id;
  } catch {
    return null;
  }
}

export default api;
