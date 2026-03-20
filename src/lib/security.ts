// ============================================================
// UTILIDADES DE SEGURIDAD — Portal RRHH AVA Selección
// ============================================================

/**
 * Sanitiza una ruta de redirección para evitar ataques de Open Redirect.
 *
 * Reglas:
 * - Debe comenzar con "/"
 * - NO puede comenzar con "//" (el navegador lo interpreta como URL externa: //evil.com)
 * - NO puede contener "://" (http://, https://, javascript://, etc.)
 *
 * @param path - Ruta a sanitizar (puede ser null/undefined)
 * @param fallback - Ruta por defecto si la ruta no es válida (por defecto "/dashboard")
 * @returns Ruta interna segura
 */
export function sanitizeRedirectPath(
  path: string | null | undefined,
  fallback = "/dashboard"
): string {
  if (!path) return fallback;
  if (
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.includes("://")
  ) {
    return path;
  }
  return fallback;
}

/**
 * Lista de rutas públicas que no requieren autenticación.
 */
export const PUBLIC_ROUTES = [
  "/login",
  "/privacy",
  "/api/auth/callback",
  "/onboarding/gdpr-consent",
] as const;

/**
 * Comprueba si una ruta es pública (no requiere autenticación).
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route)
  );
}
