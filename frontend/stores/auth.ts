import { create } from 'zustand';
import api, { setToken, removeToken, setTenantId } from '@/services/api';

interface User {
  id: number;
  name: string;
  email: string | null;
  mobile: string;
  avatar_url: string | null;
  language_pref: 'en' | 'ur';
  tenants: Tenant[];
}

interface Tenant {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  currentTenant: Tenant | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login: (credentials: { email?: string; mobile?: string; password: string }) => Promise<void>;
  register: (data: { name: string; email?: string; mobile: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  selectTenant: (tenant: Tenant) => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  currentTenant: null,
  isLoading: false,
  isAuthenticated: false,

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const { data } = await api.post('/auth/login', credentials);
      const token = data.data.token;
      const user = data.data.user;

      await setToken(token);
      set({ token, user, isAuthenticated: true, isLoading: false });

      // Auto-select first tenant if only one
      if (user.tenants?.length === 1) {
        await get().selectTenant(user.tenants[0]);
      }
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true });
    try {
      const response = await api.post('/auth/register', data);
      const token = response.data.data.token;
      const user = response.data.data.user;

      await setToken(token);
      set({ token, user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors during logout
    }
    await removeToken();
    set({ user: null, token: null, currentTenant: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    set({ isLoading: true });
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.data, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  selectTenant: async (tenant) => {
    await setTenantId(tenant.id.toString());
    set({ currentTenant: tenant });
  },

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
}));
