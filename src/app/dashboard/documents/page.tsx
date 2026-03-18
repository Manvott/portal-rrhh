import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DocumentsManager } from "@/components/documents/DocumentsManager";

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ employee?: string }>;
}) {
  const { employee: employeeFilter } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Obtener documentos según el rol
  let documents;
  let employeeId: string | null = null;

  if (profile.role === "admin") {
    // Admin ve todos los documentos
    let query = supabase
      .from("documents")
      .select(`*, employee:employees(first_name, last_name, email)`)
      .order("created_at", { ascending: false });

    if (employeeFilter) {
      query = query.eq("employee_id", employeeFilter);
    }

    const { data } = await query;
    documents = data;
  } else {
    // Colaborador solo ve sus propios documentos
    const { data: emp } = await supabase
      .from("employees")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    employeeId = emp?.id ?? null;

    if (employeeId) {
      const { data } = await supabase
        .from("documents")
        .select(`*, employee:employees(first_name, last_name, email)`)
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false });
      documents = data;
    }
  }

  // Lista de empleados para el selector (solo admin)
  let employees = null;
  if (profile.role === "admin") {
    const { data } = await supabase
      .from("employees")
      .select("id, first_name, last_name")
      .eq("is_active", true)
      .order("last_name");
    employees = data;
  }

  return (
    <DocumentsManager
      documents={documents ?? []}
      userRole={profile.role}
      currentEmployeeId={employeeId}
      employees={employees}
    />
  );
}
