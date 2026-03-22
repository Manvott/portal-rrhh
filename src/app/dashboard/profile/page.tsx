import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { User } from "lucide-react";

export default async function ProfilePage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  let employee = null;
  let employeeSkills: { skill: { name: string; category: string } | null }[] = [];
  let employeeTrainings: {
    id: string; title: string; provider: string | null; category: string;
    start_date: string; end_date: string | null; hours: number | null; status: string;
  }[] = [];
  let vacationDaysUsed = 0;

  if (profile.role === "collaborator" || profile.role === "admin") {
    const { data: emp } = await supabase
      .from("employees")
      .select("*")
      .eq("profile_id", user.id)
      .single();
    employee = emp;

    if (emp) {
      // Habilidades asignadas
      const { data: skills } = await supabase
        .from("employee_skills")
        .select("skill:skills(name, category)")
        .eq("employee_id", emp.id);
      employeeSkills = (skills ?? []).map((s) => ({
        skill: s.skill && !Array.isArray(s.skill)
          ? { name: String((s.skill as { name: unknown; category: unknown }).name ?? ""), category: String((s.skill as { name: unknown; category: unknown }).category ?? "") }
          : Array.isArray(s.skill) && s.skill.length > 0
          ? { name: String(s.skill[0].name ?? ""), category: String(s.skill[0].category ?? "") }
          : null,
      }));

      // Formaciones
      const { data: trainings } = await supabase
        .from("trainings")
        .select("id, title, provider, category, start_date, end_date, hours, status")
        .eq("employee_id", emp.id)
        .order("start_date", { ascending: false });
      employeeTrainings = trainings ?? [];

      // Días de vacaciones usados este año
      const yearStart = `${new Date().getFullYear()}-01-01`;
      const yearEnd = `${new Date().getFullYear()}-12-31`;
      const { data: approvedVacs } = await supabase
        .from("vacation_requests")
        .select("days_count")
        .eq("employee_id", emp.id)
        .eq("status", "approved")
        .eq("type", "vacation")
        .gte("start_date", yearStart)
        .lte("start_date", yearEnd);
      vacationDaysUsed = (approvedVacs ?? []).reduce((sum, v) => sum + (v.days_count ?? 0), 0);
    }
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

      <ProfileForm
        profile={profile}
        employee={employee}
        employeeSkills={employeeSkills}
        employeeTrainings={employeeTrainings}
        vacationDaysUsed={vacationDaysUsed}
      />
    </div>
  );
}
