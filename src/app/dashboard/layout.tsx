import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import type { Profile } from "@/types";

/**
 * Layout protegido del dashboard.
 * Verifica autenticación y carga el perfil del usuario.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Verificar sesión activa
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // Cargar perfil con rol del usuario
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*, custom_permissions")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    // Si no hay perfil, el usuario no está correctamente configurado
    redirect("/login?error=profile_not_found");
  }

  // Verificar que la cuenta está activa
  if (!profile.is_active) {
    await supabase.auth.signOut();
    redirect("/login?error=account_disabled");
  }

  // Verificar consentimiento RGPD
  if (!profile.gdpr_consent) {
    redirect("/onboarding/gdpr-consent");
  }

  return (
    <div className="flex h-screen bg-ava-gray overflow-hidden">
      {/* Sidebar navegación */}
      <Sidebar profile={profile as Profile} />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header profile={profile as Profile} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
