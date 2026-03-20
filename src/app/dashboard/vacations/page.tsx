import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { VacationsManager } from "@/components/vacations/VacationsManager";
import { VacationCalendar } from "@/components/vacations/VacationCalendar";

export default async function VacationsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  let vacations = [];
  let employeeId: string | null = null;
  let employees = null;

  if (profile.role === "admin") {
    const { data } = await supabase
      .from("vacation_requests")
      .select(`*, employee:employees(first_name, last_name, department)`)
      .order("created_at", { ascending: false });
    vacations = data ?? [];

    const { data: emps } = await supabase
      .from("employees")
      .select("id, first_name, last_name, department")
      .eq("is_active", true)
      .order("last_name");
    employees = emps;
  } else {
    const { data: emp } = await supabase
      .from("employees")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    employeeId = emp?.id ?? null;

    if (employeeId) {
      const { data } = await supabase
        .from("vacation_requests")
        .select(`*, employee:employees(first_name, last_name, department)`)
        .eq("employee_id", employeeId)
        .order("created_at", { ascending: false });
      vacations = data ?? [];
    }
  }

  // Vacaciones aprobadas de TODOS → calendario compartido
  const { data: approvedVacations } = await supabase
    .from("vacation_requests")
    .select(`id, start_date, end_date, type, employee:employees(first_name, last_name, department)`)
    .eq("status", "approved")
    .order("start_date", { ascending: true });

  // Eventos del calendario (festivos, ferias, eventos empresa)
  const { data: calendarEvents } = await supabase
    .from("calendar_events")
    .select("id, title, description, start_date, end_date, type, color")
    .eq("is_public", true)
    .order("start_date", { ascending: true });

  return (
    <div className="space-y-6">
      <VacationsManager
        vacations={vacations}
        userRole={profile.role}
        currentEmployeeId={employeeId}
        employees={employees}
      />
      <VacationCalendar
        approvedVacations={approvedVacations ?? []}
        calendarEvents={calendarEvents ?? []}
        userRole={profile.role}
      />
    </div>
  );
}
