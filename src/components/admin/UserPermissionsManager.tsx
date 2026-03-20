"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ROLE_LABELS, ROLE_COLORS, PERMISSION_LABELS, PERMISSION_GROUPS,
  getEffectivePermissions,
} from "@/lib/auth/roles";
import type { CustomPermissions, UserRole } from "@/types";
import { toast } from "@/components/ui/use-toast";
import { UserCog, Shield, ChevronDown, ChevronUp, Save, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  custom_permissions: CustomPermissions | null;
  created_at: string;
}

interface Props {
  profiles: UserProfile[];
  currentUserId: string;
}

export function UserPermissionsManager({ profiles, currentUserId }: Props) {
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  // Local state of permissions per user (userId -> permissions)
  const [localPerms, setLocalPerms] = useState<Record<string, CustomPermissions | null>>(
    Object.fromEntries(profiles.map((p) => [p.id, p.custom_permissions]))
  );

  const toggleExpand = (userId: string) => {
    setExpandedUser(expandedUser === userId ? null : userId);
  };

  const handleTogglePermission = (
    userId: string,
    permission: keyof CustomPermissions,
    currentRole: UserRole
  ) => {
    if (currentRole !== "admin") return;

    const current = localPerms[userId];
    // Si no tiene custom_permissions, inicializamos con todos en true primero
    // (ya que era admin total), luego toggleamos el permiso
    const base = current ?? {
      employees_read: true, employees_write: true,
      documents_read: true, documents_write: true,
      vacations_read: true, vacations_approve: true,
      candidates_manage: true, support_view: true, users_manage: true,
    };

    setLocalPerms((prev) => ({
      ...prev,
      [userId]: { ...base, [permission]: !base[permission] },
    }));
  };

  const handleResetToFull = (userId: string) => {
    setLocalPerms((prev) => ({ ...prev, [userId]: null }));
  };

  const handleSave = async (userId: string) => {
    setSaving(userId);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ custom_permissions: localPerms[userId] })
        .eq("id", userId);

      if (error) throw error;
      toast({ title: "Permisos guardados correctamente" });
    } catch {
      toast({ title: "Error al guardar", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const admins = profiles.filter((p) => p.role === "admin");
  const others = profiles.filter((p) => p.role !== "admin");

  return (
    <div className="space-y-6">
      {/* ADMINISTRADORES */}
      <div className="bg-white rounded-lg border border-ava-gray-medium overflow-hidden">
        <div className="px-6 py-4 border-b border-ava-gray-medium bg-ava-gray/30">
          <h2 className="font-semibold text-ava-charcoal flex items-center gap-2">
            <Shield className="w-4 h-4 text-ava-yellow" />
            Administradores ({admins.length})
          </h2>
          <p className="text-xs text-ava-charcoal-light mt-0.5">
            Haz clic en un usuario para configurar sus permisos específicos
          </p>
        </div>

        {admins.length === 0 ? (
          <div className="p-8 text-center text-ava-charcoal-light text-sm">No hay administradores.</div>
        ) : (
          <div className="divide-y divide-ava-gray-medium">
            {admins.map((profile) => {
              const isExpanded = expandedUser === profile.id;
              const isCurrentUser = profile.id === currentUserId;
              const perms = localPerms[profile.id];
              const effective = getEffectivePermissions(profile.role, perms);
              const hasRestrictions = perms !== null;

              return (
                <div key={profile.id}>
                  {/* Fila del usuario */}
                  <div
                    className={cn(
                      "flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-ava-gray/20 transition-colors",
                      isExpanded && "bg-ava-gray/20"
                    )}
                    onClick={() => toggleExpand(profile.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-ava-yellow rounded-full flex items-center justify-center shrink-0">
                        <span className="text-ava-charcoal font-bold text-xs">
                          {(profile.full_name || profile.email).charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-ava-charcoal">
                            {profile.full_name || profile.email}
                          </p>
                          {isCurrentUser && (
                            <span className="px-1.5 py-0.5 bg-ava-yellow/20 text-ava-charcoal text-xs rounded">
                              Tú
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ava-charcoal-light">{profile.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {hasRestrictions ? (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                          Permisos personalizados
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                          Acceso total
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-ava-charcoal-light" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-ava-charcoal-light" />
                      )}
                    </div>
                  </div>

                  {/* Panel de permisos expandido */}
                  {isExpanded && (
                    <div className="px-6 py-5 bg-ava-gray/10 border-t border-ava-gray-medium space-y-5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-ava-charcoal flex items-center gap-2">
                          <UserCog className="w-4 h-4" />
                          Permisos de {profile.full_name || profile.email}
                        </p>
                        <button
                          onClick={() => handleResetToFull(profile.id)}
                          className="flex items-center gap-1.5 text-xs text-ava-charcoal-light hover:text-ava-charcoal transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Restablecer acceso total
                        </button>
                      </div>

                      {/* Grid de permisos por grupos */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {PERMISSION_GROUPS.map((group) => (
                          <div key={group.label} className="space-y-2">
                            <p className="text-xs font-semibold text-ava-charcoal-light uppercase tracking-wider">
                              {group.label}
                            </p>
                            <div className="space-y-1.5">
                              {group.permissions.map((perm) => (
                                <label
                                  key={perm}
                                  className="flex items-center gap-3 cursor-pointer group"
                                >
                                  <div className="relative">
                                    <input
                                      type="checkbox"
                                      checked={effective[perm] === true}
                                      onChange={() =>
                                        handleTogglePermission(profile.id, perm, profile.role)
                                      }
                                      className="sr-only"
                                    />
                                    <div
                                      className={cn(
                                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                                        effective[perm]
                                          ? "bg-ava-yellow border-ava-yellow"
                                          : "border-ava-gray-medium bg-white group-hover:border-ava-yellow/50"
                                      )}
                                    >
                                      {effective[perm] && (
                                        <svg className="w-3 h-3 text-ava-charcoal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-sm text-ava-charcoal">
                                    {PERMISSION_LABELS[perm]}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Botón guardar */}
                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => handleSave(profile.id)}
                          disabled={saving === profile.id}
                          className="flex items-center gap-2 px-4 py-2 bg-ava-yellow hover:bg-ava-yellow-dark
                                     text-ava-charcoal font-semibold text-sm rounded-lg transition-colors
                                     disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {saving === profile.id ? (
                            <div className="w-4 h-4 border-2 border-ava-charcoal/30 border-t-ava-charcoal rounded-full animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          Guardar permisos
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* OTROS USUARIOS */}
      {others.length > 0 && (
        <div className="bg-white rounded-lg border border-ava-gray-medium overflow-hidden">
          <div className="px-6 py-4 border-b border-ava-gray-medium bg-ava-gray/30">
            <h2 className="font-semibold text-ava-charcoal">
              Otros usuarios ({others.length})
            </h2>
            <p className="text-xs text-ava-charcoal-light mt-0.5">
              Colaboradores y soporte técnico — sus permisos están definidos por su rol
            </p>
          </div>
          <div className="divide-y divide-ava-gray-medium">
            {others.map((profile) => (
              <div key={profile.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-ava-gray-medium rounded-full flex items-center justify-center shrink-0">
                    <span className="text-ava-charcoal font-bold text-xs">
                      {(profile.full_name || profile.email).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-ava-charcoal">
                      {profile.full_name || profile.email}
                    </p>
                    <p className="text-xs text-ava-charcoal-light">{profile.email}</p>
                  </div>
                </div>
                <span className={cn("px-2 py-1 text-xs rounded-full font-medium", ROLE_COLORS[profile.role])}>
                  {ROLE_LABELS[profile.role]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
