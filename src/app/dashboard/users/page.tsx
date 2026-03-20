import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { UserPermissionsManager } from "@/components/admin/UserPermissionsManager";
import { hasCustomPermission } from "@/lib/auth/roles";
import { Users } from "lucide-react";

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, custom_permissions")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");
  if (!hasCustomPermission(profile.role, profile.custom_permissions, "users_manage")) {
    redirect("/dashboard");
  }

  // Obtener todos los usuarios (profiles)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, is_active, custom_permissions, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-ava-charcoal flex items-center gap-2">
          <Users className="w-6 h-6" />
          Gestión de Usuarios
        </h1>
        <p className="text-ava-charcoal-light text-sm mt-1">
          Administra accesos y permisos de los usuarios del portal
        </p>
      </div>
      <UserPermissionsManager profiles={profiles ?? []} currentUserId={user.id} />
    </div>
  );
}
