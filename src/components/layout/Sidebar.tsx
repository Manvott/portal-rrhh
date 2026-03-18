"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileText,
  CalendarDays,
  UserPlus,
  Settings,
  User,
  Shield,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Profile } from "@/types";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { getInitials } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Array<"admin" | "support" | "collaborator">;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Inicio",
    icon: LayoutDashboard,
    roles: ["admin", "support", "collaborator"],
  },
  {
    href: "/dashboard/profile",
    label: "Mi Perfil",
    icon: User,
    roles: ["admin", "support", "collaborator"],
  },
  {
    href: "/dashboard/employees",
    label: "Empleados",
    icon: Users,
    roles: ["admin"],
  },
  {
    href: "/dashboard/documents",
    label: "Documentos",
    icon: FileText,
    roles: ["admin", "collaborator"],
  },
  {
    href: "/dashboard/vacations",
    label: "Vacaciones",
    icon: CalendarDays,
    roles: ["admin", "collaborator"],
  },
  {
    href: "/dashboard/onboarding",
    label: "Selección",
    icon: UserPlus,
    roles: ["admin"],
  },
  {
    href: "/dashboard/support",
    label: "Soporte Técnico",
    icon: Shield,
    roles: ["support", "admin"],
  },
];

interface SidebarProps {
  profile: Profile;
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const visibleItems = NAV_ITEMS.filter((item) =>
    item.roles.includes(profile.role)
  );

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="w-64 bg-ava-charcoal flex flex-col h-full shrink-0">
      {/* Logo / Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-ava-yellow rounded-full flex items-center justify-center shrink-0">
            <span className="text-ava-charcoal font-bold text-xs">AVA</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">
              AVA Selección
            </p>
            <p className="text-white/50 text-xs">Portal RRHH</p>
          </div>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150",
                isActive
                  ? "bg-ava-yellow text-ava-charcoal"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
              {isActive && (
                <ChevronRight className="w-3 h-3 ml-auto shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Usuario / Cerrar sesión */}
      <div className="p-4 border-t border-white/10 space-y-2">
        {/* Info del usuario */}
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
            <p className="text-white/40 text-xs">
              {ROLE_LABELS[profile.role]}
            </p>
          </div>
        </div>

        {/* Cerrar sesión */}
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
