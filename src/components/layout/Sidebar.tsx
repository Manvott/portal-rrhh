"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, FileText, CalendarDays,
  UserPlus, User, Shield, LogOut, ChevronRight, UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types";
import { ROLE_LABELS, hasCustomPermission } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { getInitials } from "@/lib/utils";

interface SidebarProps {
  profile: Profile;
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const cp = profile.custom_permissions;
  const role = profile.role;

  const canSee = (permission: Parameters<typeof hasCustomPermission>[2]) =>
    hasCustomPermission(role, cp, permission);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="w-64 bg-ava-charcoal flex flex-col h-full shrink-0">
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ava-yellow rounded-full flex items-center justify-center shrink-0">
            <span className="text-ava-charcoal font-bold text-xs">AVA</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">AVA Selección</p>
            <p className="text-white/50 text-xs">Portal RRHH</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {/* Inicio - visible para todos */}
        <NavLink href="/dashboard" label="Inicio" icon={LayoutDashboard} pathname={pathname} exact />

        {/* Mi Perfil - visible para todos */}
        <NavLink href="/dashboard/profile" label="Mi Perfil" icon={User} pathname={pathname} />

        {/* Empleados */}
        {(role === "collaborator" || canSee("employees_read")) && (
          <NavLink href="/dashboard/employees" label="Empleados" icon={Users} pathname={pathname} />
        )}

        {/* Documentos */}
        {(role === "collaborator" || canSee("documents_read") || canSee("documents_write")) && (
          <NavLink href="/dashboard/documents" label="Documentos" icon={FileText} pathname={pathname} />
        )}

        {/* Vacaciones */}
        {(role === "collaborator" || canSee("vacations_read") || canSee("vacations_approve")) && (
          <NavLink href="/dashboard/vacations" label="Vacaciones" icon={CalendarDays} pathname={pathname} />
        )}

        {/* Selección */}
        {canSee("candidates_manage") && (
          <NavLink href="/dashboard/onboarding" label="Selección" icon={UserPlus} pathname={pathname} />
        )}

        {/* Soporte Técnico */}
        {(role === "support" || canSee("support_view")) && (
          <NavLink href="/dashboard/support" label="Soporte Técnico" icon={Shield} pathname={pathname} />
        )}

        {/* Gestión de Usuarios */}
        {canSee("users_manage") && (
          <NavLink href="/dashboard/users" label="Usuarios" icon={UserCog} pathname={pathname} />
        )}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 bg-ava-yellow/20 rounded-full flex items-center justify-center shrink-0">
            <span className="text-ava-yellow text-xs font-bold">
              {getInitials(profile.full_name || profile.email)}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-medium truncate">
              {profile.full_name || profile.email}
            </p>
            <p className="text-white/40 text-xs">{ROLE_LABELS[profile.role]}</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm
                     text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}

// Componente auxiliar para cada ítem de navegación
function NavLink({
  href, label, icon: Icon, pathname, exact = false,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  pathname: string;
  exact?: boolean;
}) {
  const isActive = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
        isActive
          ? "bg-ava-yellow text-ava-charcoal"
          : "text-white/70 hover:text-white hover:bg-white/10"
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span>{label}</span>
      {isActive && <ChevronRight className="w-3 h-3 ml-auto shrink-0" />}
    </Link>
  );
}
