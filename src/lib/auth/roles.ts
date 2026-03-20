import type { UserRole, CustomPermissions } from "@/types";

// ============================================================
// SISTEMA DE ROLES Y PERMISOS - RBAC + Permisos Granulares
// ============================================================

export const PERMISSIONS = {
  "employees:read:all": ["admin"] as UserRole[],
  "employees:read:own": ["admin", "collaborator"] as UserRole[],
  "employees:create": ["admin"] as UserRole[],
  "employees:update:all": ["admin"] as UserRole[],
  "employees:update:own": ["admin", "collaborator"] as UserRole[],
  "employees:delete": ["admin"] as UserRole[],
  "documents:read:all": ["admin"] as UserRole[],
  "documents:read:own": ["admin", "collaborator"] as UserRole[],
  "documents:upload:all": ["admin"] as UserRole[],
  "documents:upload:own": ["admin", "collaborator"] as UserRole[],
  "documents:delete": ["admin"] as UserRole[],
  "vacations:read:all": ["admin"] as UserRole[],
  "vacations:read:own": ["admin", "collaborator"] as UserRole[],
  "vacations:create": ["admin", "collaborator"] as UserRole[],
  "vacations:approve": ["admin"] as UserRole[],
  "vacations:delete": ["admin"] as UserRole[],
  "candidates:read": ["admin"] as UserRole[],
  "candidates:create": ["admin"] as UserRole[],
  "candidates:update": ["admin"] as UserRole[],
  "candidates:delete": ["admin"] as UserRole[],
  "support:dashboard": ["support", "admin"] as UserRole[],
  "audit:read:anonymized": ["support", "admin"] as UserRole[],
  "audit:read:full": ["admin"] as UserRole[],
  "users:manage": ["admin"] as UserRole[],
  "users:invite": ["admin"] as UserRole[],
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly UserRole[]).includes(role);
}

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  const routePermissions: Record<string, UserRole[]> = {
    "/dashboard": ["admin", "support", "collaborator"],
    "/dashboard/employees": ["admin"],
    "/dashboard/onboarding": ["admin"],
    "/dashboard/support": ["support", "admin"],
    "/dashboard/documents": ["admin", "collaborator"],
    "/dashboard/vacations": ["admin", "collaborator"],
    "/dashboard/profile": ["admin", "support", "collaborator"],
    "/dashboard/users": ["admin"],
  };

  const matchedRoute = Object.keys(routePermissions)
    .filter((route) => pathname.startsWith(route))
    .sort((a, b) => b.length - a.length)[0];

  if (!matchedRoute) return false;
  return routePermissions[matchedRoute].includes(role);
}

// ============================================================
// PERMISOS GRANULARES
// Resuelve el permiso efectivo considerando custom_permissions
// ============================================================

/**
 * Devuelve los permisos efectivos de un usuario.
 * - Admin sin custom_permissions → todos los permisos activos
 * - Admin con custom_permissions → solo los marcados como true
 * - Otros roles → sin permisos de admin
 */
export function getEffectivePermissions(
  role: UserRole,
  customPermissions: CustomPermissions | null
): CustomPermissions {
  if (role !== "admin") {
    return {
      employees_read: false,
      employees_write: false,
      documents_read: false,
      documents_write: false,
      vacations_read: false,
      vacations_approve: false,
      candidates_manage: false,
      support_view: false,
      users_manage: false,
    };
  }

  // Admin sin restricciones = acceso total
  if (customPermissions === null) {
    return {
      employees_read: true,
      employees_write: true,
      documents_read: true,
      documents_write: true,
      vacations_read: true,
      vacations_approve: true,
      candidates_manage: true,
      support_view: true,
      users_manage: true,
    };
  }

  // Admin con restricciones personalizadas
  return {
    employees_read: customPermissions.employees_read ?? false,
    employees_write: customPermissions.employees_write ?? false,
    documents_read: customPermissions.documents_read ?? false,
    documents_write: customPermissions.documents_write ?? false,
    vacations_read: customPermissions.vacations_read ?? false,
    vacations_approve: customPermissions.vacations_approve ?? false,
    candidates_manage: customPermissions.candidates_manage ?? false,
    support_view: customPermissions.support_view ?? false,
    users_manage: customPermissions.users_manage ?? false,
  };
}

/**
 * Verifica si un usuario tiene un permiso granular específico.
 */
export function hasCustomPermission(
  role: UserRole,
  customPermissions: CustomPermissions | null,
  permission: keyof CustomPermissions
): boolean {
  const effective = getEffectivePermissions(role, customPermissions);
  return effective[permission] === true;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  support: "Soporte Técnico",
  collaborator: "Colaborador",
};

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: "bg-ava-yellow text-ava-charcoal",
  support: "bg-blue-100 text-blue-800",
  collaborator: "bg-green-100 text-green-800",
};

export const PERMISSION_LABELS: Record<keyof CustomPermissions, string> = {
  employees_read: "Ver empleados",
  employees_write: "Crear/editar empleados",
  documents_read: "Ver documentos",
  documents_write: "Subir/eliminar documentos",
  vacations_read: "Ver vacaciones",
  vacations_approve: "Aprobar/rechazar vacaciones",
  candidates_manage: "Gestión de selección",
  support_view: "Ver logs de soporte",
  users_manage: "Gestionar usuarios",
};

export const PERMISSION_GROUPS = [
  {
    label: "Empleados",
    permissions: ["employees_read", "employees_write"] as (keyof CustomPermissions)[],
  },
  {
    label: "Documentos",
    permissions: ["documents_read", "documents_write"] as (keyof CustomPermissions)[],
  },
  {
    label: "Vacaciones",
    permissions: ["vacations_read", "vacations_approve"] as (keyof CustomPermissions)[],
  },
  {
    label: "Otros",
    permissions: ["candidates_manage", "support_view", "users_manage"] as (keyof CustomPermissions)[],
  },
];
