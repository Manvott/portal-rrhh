import type { UserRole } from "@/types";

// ============================================================
// SISTEMA DE ROLES Y PERMISOS - RBAC
// ============================================================

/**
 * Permisos por recurso y acción para cada rol.
 * Principio de mínimo privilegio (RGPD Art. 5.1.f).
 */
export const PERMISSIONS = {
  // EMPLEADOS
  "employees:read:all": ["admin"] as UserRole[],
  "employees:read:own": ["admin", "collaborator"] as UserRole[],
  "employees:create": ["admin"] as UserRole[],
  "employees:update:all": ["admin"] as UserRole[],
  "employees:update:own": ["admin", "collaborator"] as UserRole[],
  "employees:delete": ["admin"] as UserRole[],

  // DOCUMENTOS
  "documents:read:all": ["admin"] as UserRole[],
  "documents:read:own": ["admin", "collaborator"] as UserRole[],
  "documents:upload:all": ["admin"] as UserRole[],
  "documents:upload:own": ["admin", "collaborator"] as UserRole[],
  "documents:delete": ["admin"] as UserRole[],

  // VACACIONES
  "vacations:read:all": ["admin"] as UserRole[],
  "vacations:read:own": ["admin", "collaborator"] as UserRole[],
  "vacations:create": ["admin", "collaborator"] as UserRole[],
  "vacations:approve": ["admin"] as UserRole[],
  "vacations:delete": ["admin"] as UserRole[],

  // ONBOARDING / SELECCIÓN
  "candidates:read": ["admin"] as UserRole[],
  "candidates:create": ["admin"] as UserRole[],
  "candidates:update": ["admin"] as UserRole[],
  "candidates:delete": ["admin"] as UserRole[],

  // SOPORTE TÉCNICO
  "support:dashboard": ["support", "admin"] as UserRole[],
  "audit:read:anonymized": ["support", "admin"] as UserRole[],
  "audit:read:full": ["admin"] as UserRole[],

  // ADMINISTRACIÓN DE USUARIOS
  "users:manage": ["admin"] as UserRole[],
  "users:invite": ["admin"] as UserRole[],
} as const;

export type Permission = keyof typeof PERMISSIONS;

/**
 * Comprueba si un rol tiene un permiso específico.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly UserRole[]).includes(role);
}

/**
 * Comprueba si el usuario puede acceder a una ruta específica.
 */
export function canAccessRoute(role: UserRole, pathname: string): boolean {
  const routePermissions: Record<string, UserRole[]> = {
    "/dashboard": ["admin", "support", "collaborator"],
    "/dashboard/employees": ["admin"],
    "/dashboard/onboarding": ["admin"],
    "/dashboard/support": ["support", "admin"],
    "/dashboard/documents": ["admin", "collaborator"],
    "/dashboard/vacations": ["admin", "collaborator"],
    "/dashboard/profile": ["admin", "support", "collaborator"],
  };

  // Buscar la ruta más específica que coincida
  const matchedRoute = Object.keys(routePermissions)
    .filter((route) => pathname.startsWith(route))
    .sort((a, b) => b.length - a.length)[0];

  if (!matchedRoute) return false;
  return routePermissions[matchedRoute].includes(role);
}

/**
 * Etiqueta legible para cada rol.
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  support: "Soporte Técnico",
  collaborator: "Colaborador",
};

/**
 * Color badge para cada rol.
 */
export const ROLE_COLORS: Record<UserRole, string> = {
  admin: "bg-ava-yellow text-ava-charcoal",
  support: "bg-blue-100 text-blue-800",
  collaborator: "bg-green-100 text-green-800",
};
