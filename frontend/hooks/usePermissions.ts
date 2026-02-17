import { useAuthStore } from '@/stores/auth';

/**
 * Permission-based access hook.
 * Uses the user's role from the auth store to determine access levels.
 *
 * Role hierarchy:
 * - Super Admin: Full system access
 * - Owner: Full business access (team, parties, transactions, settings)
 * - Manager: Manage parties, transactions, view reports
 * - Accountant: Create/edit transactions, view parties
 * - Viewer: Read-only access
 */

type Role = 'Super Admin' | 'Owner' | 'Manager' | 'Accountant' | 'Viewer';

const ROLE_HIERARCHY: Record<Role, number> = {
  'Super Admin': 100,
  Owner: 80,
  Manager: 60,
  Accountant: 40,
  Viewer: 20,
};

export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const roles = user?.roles?.map((r) => r.name as Role) ?? [];
  const highestRole = roles.reduce<Role>((best, role) => {
    const level = ROLE_HIERARCHY[role] ?? 0;
    const bestLevel = ROLE_HIERARCHY[best] ?? 0;
    return level > bestLevel ? role : best;
  }, 'Viewer');
  const level = ROLE_HIERARCHY[highestRole] ?? 0;

  return {
    role: highestRole,
    roles,

    // System-level
    isSuperAdmin: roles.includes('Super Admin'),
    isOwner: level >= ROLE_HIERARCHY.Owner,
    isManager: level >= ROLE_HIERARCHY.Manager,
    isAccountant: level >= ROLE_HIERARCHY.Accountant,
    isViewer: level >= ROLE_HIERARCHY.Viewer,

    // Feature-specific checks
    canManageTeam: level >= ROLE_HIERARCHY.Owner,
    canManageParties: level >= ROLE_HIERARCHY.Manager,
    canCreateTransactions: level >= ROLE_HIERARCHY.Accountant,
    canEditTransactions: level >= ROLE_HIERARCHY.Accountant,
    canDeleteTransactions: level >= ROLE_HIERARCHY.Manager,
    canViewReports: level >= ROLE_HIERARCHY.Accountant,
    canManageSettings: level >= ROLE_HIERARCHY.Owner,
    canManageAdmin: roles.includes('Super Admin'),

    // Generic check
    hasMinRole: (minRole: Role) => level >= (ROLE_HIERARCHY[minRole] ?? 0),
  };
}
