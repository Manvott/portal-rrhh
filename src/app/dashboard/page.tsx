import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Users, FileText, CalendarDays, UserPlus,
  TrendingUp, Clock, CheckCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/types";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!profile) redirect("/login");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let stats = {
    totalEmployees: 0, activeEmployees: 0, pendingVacations: 0,
    totalDocuments: 0, pendingCandidates: 0,
    recentActivity: [] as Array<{ action: string; resource_type: string; created_at: string }>,
  };

  type BirthdayEmp = { id: string; first_name: string; last_name: string; birth_date: string | null; department: string | null };
  type AnnivEmp = { id: string; first_name: string; last_name: string; hire_date: string | null; department: string | null };
  type UpcomingEvent = { id: string; title: string; start_date: string; type: string };
  type ExpiringEmp = { id: string; first_name: string; last_name: string; contract_end_date: string | null; department: string | null };

  let birthdaysNext30: BirthdayEmp[] = [];
  let anniversariesNext30: AnnivEmp[] = [];
  let upcomingEvents: UpcomingEvent[] = [];
  let expiringContracts: ExpiringEmp[] = [];
  let departments: [string, number][] = [];

  const getNextOccurrence = (dateStr: string): Date => {
    const d = new Date(dateStr + "T12:00:00");
    const thisYear = new Date(today.getFullYear(), d.getMonth(), d.getDate());
    return thisYear >= today ? thisYear : new Date(today.getFullYear() + 1, d.getMonth(), d.getDate());
  };

  const diffDaysFromToday = (date: Date): number =>
    Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (profile.role === "admin") {
    const in30 = new Date(today); in30.setDate(today.getDate() + 30);
    const in60 = new Date(today); in60.setDate(today.getDate() + 60);

    const [employees, vacations, documents, candidates, logs, allEmpsRaw, eventsRaw, contractsRaw] =
      await Promise.all([
        supabase.from("employees").select("id, is_active, department"),
        supabase.from("vacation_requests").select("id").eq("status", "pending"),
        supabase.from("documents").select("id"),
        supabase.from("candidates").select("id").in("status", ["new", "screening", "interview"]),
        supabase.from("audit_logs").select("action, resource_type, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("employees").select("id, first_name, last_name, birth_date, hire_date, department").eq("is_active", true),
        supabase.from("calendar_events").select("id, title, start_date, type")
          .gte("start_date", today.toISOString().split("T")[0])
          .lte("start_date", in30.toISOString().split("T")[0])
          .order("start_date", { ascending: true }).limit(5),
        supabase.from("employees").select("id, first_name, last_name, contract_end_date, department")
          .not("contract_end_date", "is", null)
          .gte("contract_end_date", today.toISOString().split("T")[0])
          .lte("contract_end_date", in60.toISOString().split("T")[0])
          .eq("is_active", true).order("contract_end_date", { ascending: true }).limit(5),
      ]);

    stats.totalEmployees = employees.data?.length ?? 0;
    stats.activeEmployees = employees.data?.filter((e) => e.is_active).length ?? 0;
    stats.pendingVacations = vacations.data?.length ?? 0;
    stats.totalDocuments = documents.data?.length ?? 0;
    stats.pendingCandidates = candidates.data?.length ?? 0;
    stats.recentActivity = logs.data ?? [];

    const allEmps = allEmpsRaw.data ?? [];

    birthdaysNext30 = allEmps
      .filter((e) => e.birth_date && diffDaysFromToday(getNextOccurrence(e.birth_date)) <= 30)
      .sort((a, b) => getNextOccurrence(a.birth_date!).getTime() - getNextOccurrence(b.birth_date!).getTime())
      .slice(0, 5) as BirthdayEmp[];

    anniversariesNext30 = allEmps
      .filter((e) => {
        if (!e.hire_date) return false;
        const next = getNextOccurrence(e.hire_date);
        const years = next.getFullYear() - new Date(e.hire_date).getFullYear();
        return diffDaysFromToday(next) <= 30 && years > 0;
      })
      .sort((a, b) => getNextOccurrence(a.hire_date!).getTime() - getNextOccurrence(b.hire_date!).getTime())
      .slice(0, 5) as AnnivEmp[];

    upcomingEvents = (eventsRaw.data ?? []) as UpcomingEvent[];
    expiringContracts = (contractsRaw.data ?? []) as ExpiringEmp[];

    const deptCounts: Record<string, number> = {};
    (employees.data ?? []).filter((e) => e.is_active).forEach((e) => {
      const dept = (e.department as string | null) ?? "Sin departamento";
      deptCounts[dept] = (deptCounts[dept] ?? 0) + 1;
    });
    departments = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

  } else if (profile.role === "collaborator") {
    const { data: employee } = await supabase.from("employees").select("id").eq("profile_id", user.id).single();
    if (employee) {
      const [vacations, documents] = await Promise.all([
        supabase.from("vacation_requests").select("id").eq("employee_id", employee.id).eq("status", "pending"),
        supabase.from("documents").select("id").eq("employee_id", employee.id),
      ]);
      stats.pendingVacations = vacations.data?.length ?? 0;
      stats.totalDocuments = documents.data?.length ?? 0;
    }
  }

  const isAdmin = profile.role === "admin";
  const isSupport = profile.role === "support";
  const isCollaborator = profile.role === "collaborator";

  const TYPE_ICON: Record<string, string> = { holiday: "🏖️", fair: "🎪", event: "📅", other: "📌" };
  const TYPE_COLOR: Record<string, string> = {
    holiday: "bg-red-50 text-red-600",
    fair: "bg-purple-50 text-purple-600",
    event: "bg-yellow-50 text-yellow-700",
    other: "bg-gray-50 text-gray-600",
  };

  return (
    <div className="space-y-6">
      {/* Saludo */}
      <div>
        <h1 className="text-2xl font-bold text-ava-charcoal">
          Bienvenido/a, {profile.full_name?.split(" ")[0] ?? profile.email.split("@")[0]} 👋
        </h1>
        <p className="text-ava-charcoal-light text-sm mt-1">
          {formatDate(new Date().toISOString(), "EEEE, d 'de' MMMM 'de' yyyy")}
        </p>
      </div>

      {/* Stats admin */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Empleados Activos" value={stats.activeEmployees} total={stats.totalEmployees}
            icon={<Users className="w-5 h-5" />} color="bg-blue-50 text-blue-600" href="/dashboard/employees" />
          <StatCard title="Vacaciones Pendientes" value={stats.pendingVacations}
            icon={<CalendarDays className="w-5 h-5" />}
            color={stats.pendingVacations > 0 ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"}
            href="/dashboard/vacations" alert={stats.pendingVacations > 0} />
          <StatCard title="Documentos" value={stats.totalDocuments}
            icon={<FileText className="w-5 h-5" />} color="bg-purple-50 text-purple-600" href="/dashboard/documents" />
          <StatCard title="Candidatos en Proceso" value={stats.pendingCandidates}
            icon={<UserPlus className="w-5 h-5" />} color="bg-ava-yellow-light text-amber-700" href="/dashboard/onboarding" />
        </div>
      )}

      {/* Stats colaborador */}
      {isCollaborator && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          <StatCard title="Mis Solicitudes Pendientes" value={stats.pendingVacations}
            icon={<CalendarDays className="w-5 h-5" />} color="bg-amber-50 text-amber-600" href="/dashboard/vacations" />
          <StatCard title="Mis Documentos" value={stats.totalDocuments}
            icon={<FileText className="w-5 h-5" />} color="bg-purple-50 text-purple-600" href="/dashboard/documents" />
        </div>
      )}

      {/* Soporte */}
      {isSupport && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-blue-900">Panel de Soporte</h2>
              <p className="text-sm text-blue-700">Acceso técnico al sistema</p>
            </div>
          </div>
          <p className="text-sm text-blue-700">
            Accede al{" "}
            <a href="/dashboard/support" className="font-semibold underline hover:no-underline">
              Panel de Soporte Técnico
            </a>{" "}
            para ver los logs del sistema y gestionar la configuración.
          </p>
        </div>
      )}

      {/* Alertas próximas — 2 columnas */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Cumpleaños */}
          <div className="bg-white rounded-lg border border-ava-gray-medium p-5">
            <h2 className="font-semibold text-ava-charcoal mb-3 flex items-center gap-2">
              <span className="text-lg">🎂</span> Cumpleaños próximos
            </h2>
            {birthdaysNext30.length === 0 ? (
              <p className="text-sm text-ava-charcoal-light">Sin cumpleaños en los próximos 30 días.</p>
            ) : (
              <div className="space-y-2">
                {birthdaysNext30.map((emp) => {
                  const next = getNextOccurrence(emp.birth_date!);
                  const diff = diffDaysFromToday(next);
                  const age = next.getFullYear() - new Date(emp.birth_date!).getFullYear();
                  return (
                    <div key={emp.id} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium text-ava-charcoal">{emp.first_name} {emp.last_name}</span>
                        {emp.department && <span className="text-ava-charcoal-light ml-1">· {emp.department}</span>}
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${diff === 0 ? "bg-ava-yellow text-ava-charcoal" : diff <= 7 ? "bg-orange-100 text-orange-700" : "bg-blue-50 text-blue-600"}`}>
                          {diff === 0 ? "¡Hoy!" : diff === 1 ? "Mañana" : `En ${diff}d`}
                        </span>
                        <span className="block text-xs text-ava-charcoal-light mt-0.5">{age} años · {next.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Aniversarios */}
          <div className="bg-white rounded-lg border border-ava-gray-medium p-5">
            <h2 className="font-semibold text-ava-charcoal mb-3 flex items-center gap-2">
              <span className="text-lg">🏆</span> Aniversarios laborales
            </h2>
            {anniversariesNext30.length === 0 ? (
              <p className="text-sm text-ava-charcoal-light">Sin aniversarios en los próximos 30 días.</p>
            ) : (
              <div className="space-y-2">
                {anniversariesNext30.map((emp) => {
                  const next = getNextOccurrence(emp.hire_date!);
                  const diff = diffDaysFromToday(next);
                  const years = next.getFullYear() - new Date(emp.hire_date!).getFullYear();
                  return (
                    <div key={emp.id} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="font-medium text-ava-charcoal">{emp.first_name} {emp.last_name}</span>
                        {emp.department && <span className="text-ava-charcoal-light ml-1">· {emp.department}</span>}
                      </div>
                      <div className="text-right shrink-0 ml-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${diff === 0 ? "bg-ava-yellow text-ava-charcoal" : "bg-green-50 text-green-700"}`}>
                          {diff === 0 ? "¡Hoy!" : `En ${diff}d`}
                        </span>
                        <span className="block text-xs text-ava-charcoal-light mt-0.5">{years} {years === 1 ? "año" : "años"} en AVA</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Próximos eventos */}
          <div className="bg-white rounded-lg border border-ava-gray-medium p-5">
            <h2 className="font-semibold text-ava-charcoal mb-3 flex items-center gap-2">
              <span className="text-lg">📅</span> Próximos eventos
            </h2>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-ava-charcoal-light">Sin eventos en los próximos 30 días.</p>
            ) : (
              <div className="space-y-2">
                {upcomingEvents.map((ev) => {
                  const evDate = new Date(ev.start_date + "T12:00:00");
                  const diff = diffDaysFromToday(evDate);
                  return (
                    <div key={ev.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span>{TYPE_ICON[ev.type] ?? "📌"}</span>
                        <span className="font-medium text-ava-charcoal">{ev.title}</span>
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ml-2 ${TYPE_COLOR[ev.type] ?? "bg-gray-50 text-gray-600"}`}>
                        {diff === 0 ? "Hoy" : diff === 1 ? "Mañana" : evDate.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Contratos por vencer */}
          <div className="bg-white rounded-lg border border-ava-gray-medium p-5">
            <h2 className="font-semibold text-ava-charcoal mb-3 flex items-center gap-2">
              <span className="text-lg">⚠️</span> Contratos por vencer
              {expiringContracts.length > 0 && (
                <span className="ml-auto text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                  {expiringContracts.length} alerta{expiringContracts.length !== 1 ? "s" : ""}
                </span>
              )}
            </h2>
            {expiringContracts.length === 0 ? (
              <p className="text-sm text-ava-charcoal-light">Sin contratos venciendo en los próximos 60 días.</p>
            ) : (
              <div className="space-y-2">
                {expiringContracts.map((emp) => {
                  const end = new Date(emp.contract_end_date! + "T12:00:00");
                  const diff = diffDaysFromToday(end);
                  return (
                    <Link key={emp.id} href={`/dashboard/employees/${emp.id}`}
                      className="flex items-center justify-between text-sm hover:bg-ava-gray/30 rounded px-1 -mx-1 transition-colors">
                      <div>
                        <span className="font-medium text-ava-charcoal">{emp.first_name} {emp.last_name}</span>
                        {emp.department && <span className="text-ava-charcoal-light ml-1">· {emp.department}</span>}
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ml-2 ${diff <= 15 ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}>
                        {end.toLocaleDateString("es-ES", { day: "numeric", month: "short" })} · {diff}d
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Distribución por departamento */}
      {isAdmin && departments.length > 0 && (
        <div className="bg-white rounded-lg border border-ava-gray-medium p-5">
          <h2 className="font-semibold text-ava-charcoal mb-4 flex items-center gap-2">
            <Users className="w-4 h-4" /> Distribución por departamento
          </h2>
          <div className="space-y-2.5">
            {departments.map(([dept, count]) => (
              <div key={dept} className="flex items-center gap-3">
                <span className="text-sm text-ava-charcoal w-44 truncate">{dept}</span>
                <div className="flex-1 bg-ava-gray rounded-full h-2">
                  <div
                    className="bg-ava-yellow rounded-full h-2 transition-all duration-500"
                    style={{ width: `${Math.round((count / Math.max(stats.activeEmployees, 1)) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-ava-charcoal w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actividad reciente */}
      {isAdmin && stats.recentActivity.length > 0 && (
        <div className="bg-white rounded-lg border border-ava-gray-medium p-6">
          <h2 className="font-semibold text-ava-charcoal mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-ava-charcoal-light" /> Actividad Reciente
          </h2>
          <div className="space-y-3">
            {stats.recentActivity.map((log, i) => (
              <div key={i} className="flex items-center gap-3 text-sm text-ava-charcoal-medium">
                <div className="w-2 h-2 bg-ava-yellow rounded-full shrink-0" />
                <span className="capitalize">{log.action}</span>
                <span className="text-ava-charcoal-light">—</span>
                <span className="capitalize">{log.resource_type}</span>
                <span className="ml-auto text-xs text-ava-charcoal-light">
                  {formatDate(log.created_at, "dd/MM HH:mm")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Aviso RGPD */}
      <div className="bg-ava-gray border border-ava-gray-medium rounded-lg p-4 flex items-start gap-3">
        <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
        <div className="text-sm text-ava-charcoal-medium">
          <strong className="text-ava-charcoal">Protección de datos:</strong>{" "}
          Este portal cumple con el RGPD (UE 2016/679) y la LOPDGDD. Los datos personales son tratados con las máximas medidas de seguridad.{" "}
          <a href="/privacy" target="_blank" className="underline hover:text-ava-charcoal">
            Ver Política de Privacidad
          </a>.
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, total, icon, color, href, alert }: {
  title: string; value: number; total?: number; icon: React.ReactNode;
  color: string; href: string; alert?: boolean;
}) {
  return (
    <a href={href} className="bg-white rounded-lg border border-ava-gray-medium p-5 hover:shadow-md transition-shadow duration-200 block">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ava-charcoal-light font-medium">{title}</p>
          <p className="text-3xl font-bold text-ava-charcoal mt-1">{value}</p>
          {total !== undefined && (
            <p className="text-xs text-ava-charcoal-light mt-0.5">de {total} totales</p>
          )}
        </div>
        <div className={`relative p-2.5 rounded-lg ${color}`}>
          {icon}
          {alert && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
          )}
        </div>
      </div>
    </a>
  );
}
