import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import type { BusinessInfo } from '@/components/ReportActions';

/**
 * Fetch full business (tenant) details for the currently selected tenant.
 * Returns { name, address, city, phone, email, logo_url }.
 * Falls back to currentTenant.name from auth store if the API call fails.
 */
export function useCurrentBusiness() {
  const currentTenant = useAuthStore((s) => s.currentTenant);

  const { data } = useQuery<BusinessInfo | null>({
    queryKey: ['current-business', currentTenant?.id],
    queryFn: async () => {
      if (!currentTenant) return null;
      try {
        const res = await api.get('/tenants/current');
        const t = res.data.data;
        return {
          name: t.name || currentTenant.name,
          address: t.address || '',
          city: t.city || '',
          phone: t.phone || '',
          email: t.email || '',
          logo_url: t.logo_url || '',
        };
      } catch {
        return {
          name: currentTenant.name,
          address: '',
          city: '',
          phone: '',
          email: '',
          logo_url: currentTenant.logo_url || '',
        };
      }
    },
    enabled: !!currentTenant,
    staleTime: 5 * 60 * 1000, // cache 5 min
  });

  return data || (currentTenant ? { name: currentTenant.name } : null);
}
