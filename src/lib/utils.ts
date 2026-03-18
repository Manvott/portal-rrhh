import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import type { UserRole } from "@/types";

/**
 * Combina clases de Tailwind de forma segura.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea una fecha en español.
 */
export function formatDate(
  date: string | Date | null | undefined,
  formatStr = "dd/MM/yyyy"
): string {
  if (!date) return "—";
  try {
    const d = typeof date === "string" ? parseISO(date) : date;
    return format(d, formatStr, { locale: es });
  } catch {
    return "—";
  }
}

/**
 * Formatea un tamaño de archivo en bytes a unidad legible.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Genera iniciales de un nombre completo.
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

/**
 * Capitaliza la primera letra de cada palabra.
 */
export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Valida formato NIF/NIE español.
 */
export function isValidNIF(nif: string): boolean {
  const nifRegex = /^[0-9]{8}[A-Z]$/;
  const nieRegex = /^[XYZ][0-9]{7}[A-Z]$/;
  return nifRegex.test(nif) || nieRegex.test(nif);
}

/**
 * Valida formato IBAN español.
 */
export function isValidIBAN(iban: string): boolean {
  const cleaned = iban.replace(/\s/g, "").toUpperCase();
  return /^ES[0-9]{22}$/.test(cleaned);
}

/**
 * Anonimiza un email para logs (RGPD).
 * Ejemplo: manfred@ava.es → m****d@ava.es
 */
export function anonymizeEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "***@***.***";
  if (user.length <= 2) return "**@" + domain;
  return user[0] + "*".repeat(user.length - 2) + user[user.length - 1] + "@" + domain;
}

/**
 * Anonimiza un nombre completo para logs (RGPD).
 * Ejemplo: Manfred Votteler → M. V.
 */
export function anonymizeName(name: string): string {
  if (!name) return "***";
  return name
    .split(" ")
    .map((part) => part[0] + ".")
    .join(" ");
}

/**
 * Etiqueta de categoría de documento en español.
 */
export const DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  contract: "Contrato",
  payslip: "Nómina",
  certificate: "Certificado",
  medical: "Médico",
  id: "Identificación",
  other: "Otro",
};

/**
 * Tipos de ausencia en español.
 */
export const VACATION_TYPE_LABELS: Record<string, string> = {
  vacation: "Vacaciones",
  sick: "Baja por enfermedad",
  personal: "Asunto personal",
  other: "Otro",
};

/**
 * Estados de solicitud de vacaciones.
 */
export const VACATION_STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  approved: "Aprobada",
  rejected: "Denegada",
  cancelled: "Cancelada",
};

export const VACATION_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

/**
 * Etiquetas de roles en español.
 */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  support: "Soporte Técnico",
  collaborator: "Colaborador",
};
