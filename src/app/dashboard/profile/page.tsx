import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { User } from "lucide-react";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Si es colaborador, cargar su ficha de empleado
  let employee = null;
  if (profile.role === "collaborator" || profile.role === "admin") {
    const { data: emp } = await supabase
      .from("employees")
      .select("*")
      .eq("profile_id", user.id)
      .single();
    employee = emp;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-ava-charcoal flex items-center gap-2">
          <User className="w-6 h-6" />
          Mi Perfil
        </h1>
        <p className="text-ava-charcoal-light text-sm mt-1">
          Gestiona tu información personal y de acceso.
        </p>
      </div>

      <ProfileForm profile={profile} employee={employee} />
    </div>
  );
}
