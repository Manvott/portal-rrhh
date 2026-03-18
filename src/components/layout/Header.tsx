"use client";

import { Bell, Search } from "lucide-react";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/auth/roles";
import type { Profile } from "@/types";
import { cn } from "@/lib/utils";

interface HeaderProps {
  profile: Profile;
}

export function Header({ profile }: HeaderProps) {
  return (
    <header className="bg-white border-b border-ava-gray-medium px-6 py-3 flex items-center justify-between shrink-0">
      {/* Búsqueda (solo admin) */}
      <div className="flex-1 max-w-md">
        {profile.role === "admin" && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ava-charcoal-light" />
            <input
              type="search"
              placeholder="Buscar empleados, documentos..."
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-ava-gray-medium
                         focus:outline-none focus:ring-2 focus:ring-ava-yellow focus:border-transparent
                         bg-ava-gray placeholder:text-ava-charcoal-light"
            />
          </div>
        )}
      </div>

      {/* Acciones del usuario */}
      <div className="flex items-center gap-4">
        {/* Badge de rol */}
        <span
          className={cn(
            "px-2.5 py-1 rounded-full text-xs font-semibold",
            ROLE_COLORS[profile.role]
          )}
        >
          {ROLE_LABELS[profile.role]}
        </span>

        {/* Notificaciones (solo admin y colaboradores) */}
        {profile.role !== "support" && (
          <button
            className="relative p-2 text-ava-charcoal-light hover:text-ava-charcoal
                       hover:bg-ava-gray rounded-lg transition-colors"
            aria-label="Notificaciones"
          >
            <Bell className="w-5 h-5" />
          </button>
        )}
      </div>
    </header>
  );
}
