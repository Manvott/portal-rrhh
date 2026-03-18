import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Página raíz: redirige a /dashboard si autenticado, o a /login si no.
 */
export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  } else {
    redirect("/login");
  }
}
