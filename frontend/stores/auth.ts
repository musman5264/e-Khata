import { create } from 'zustand';
import api, { setToken, removeToken, setTenantId, getStoredToken, getStoredTenantId } from '@/services/api';

interface User {
  id: number;
  name: string;
  email: string | null;
  mobile: string;
  avatar_url: string | null;
  language_pref: 'en' | 'ur';
  roles: { id: number; name: string }[];
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

  // Impersonation state
  isImpersonating: boolean;
  originalUser: User | null;
  originalToken: string | null;
  originalTenant: Tenant | null;

  login: (credentials: { mobile: string; password: string }) => Promise<void>;
  register: (data: { name: string; email?: string; mobile: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  rehydrate: () => Promise<void>;
  selectTenant: (tenant: Tenant) => Promise<void>;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  startImpersonation: (userId: number) => Promise<void>;
  stopImpersonation: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  currentTenant: null,
  isLoading: false,
  isAuthenticated: false,

  // Impersonation defaults
  isImpersonating: false,
  originalUser: null,
  originalToken: null,
  originalTenant: null,

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
      const userData = data.data?.user || data.data;
      const tenants = userData.tenants || data.data?.tenants || [];
      userData.tenants = tenants;
      set({ user: userData, isAuthenticated: true, isLoading: false });
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  rehydrate: async () => {
    const storedToken = await getStoredToken();
    if (!storedToken) {
      set({ isLoading: false });
      return;
    }
    set({ isLoading: true, token: storedToken });
    try {
      const { data } = await api.get('/auth/me');
      const userData = data.data?.user || data.data;
      const tenants = userData.tenants || data.data?.tenants || [];
      userData.tenants = tenants;

      // Restore tenant from storage
      const storedTenantId = await getStoredTenantId();
      let currentTenant: Tenant | null = null;
      if (storedTenantId && tenants.length > 0) {
        currentTenant = tenants.find((t: Tenant) => String(t.id) === storedTenantId) || null;
      }
      // If no stored tenant but only one available, auto-select it
      if (!currentTenant && tenants.length === 1) {
        currentTenant = tenants[0];
        await setTenantId(String(currentTenant.id));
      }

      set({
        user: userData,
        token: storedToken,
        currentTenant,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      await removeToken();
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  selectTenant: async (tenant) => {
    await setTenantId(tenant.id.toString());
    set({ currentTenant: tenant });
  },

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),

  startImpersonation: async (userId: number) => {
    const state = get();
    try {
      const { data } = await api.post(`/admin/users/${userId}/impersonate`);
      const impToken = data.data.token;
      const impUser = data.data.user;

      // Save original admin state
      const origUser = state.user;
      const origToken = state.token;
      const origTenant = state.currentTenant;

      // Switch to impersonated user's token
      await setToken(impToken);
      set({
        user: impUser,
        token: impToken,
        isImpersonating: true,
        originalUser: origUser,
        originalToken: origToken,
        originalTenant: origTenant,
        currentTenant: null,
      });

      // Auto-select first tenant of impersonated user
      if (impUser.tenants?.length === 1) {
        await get().selectTenant(impUser.tenants[0]);
      }
    } catch (error) {
      throw error;
    }
  },

  stopImpersonation: async () => {
    const state = get();
    if (!state.isImpersonating || !state.originalToken) return;

    // Restore original admin session
    await setToken(state.originalToken);
    set({
      user: state.originalUser,
      token: state.originalToken,
      currentTenant: state.originalTenant,
      isImpersonating: false,
      originalUser: null,
      originalToken: null,
      originalTenant: null,
    });
  },
}));
