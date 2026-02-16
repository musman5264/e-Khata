import { create } from 'zustand';

interface Tenant {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  settings: Record<string, any>;
}

interface TenantState {
  tenants: Tenant[];
  currentTenant: Tenant | null;
  setTenants: (tenants: Tenant[]) => void;
  setCurrentTenant: (tenant: Tenant | null) => void;
}

export const useTenantStore = create<TenantState>((set) => ({
  tenants: [],
  currentTenant: null,
  setTenants: (tenants) => set({ tenants }),
  setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
}));
