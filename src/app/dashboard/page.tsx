import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Users,
  FileText,
  CalendarDays,
  UserPlus,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Profile } from "@/types";

/**
 * Dashboard principal — muestra estadísticas según el rol del usuario.
 */
export default async function DashboardPage() {
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

  // Estadísticas según el rol
  let stats = {
    totalEmployees: 0,
    activeEmployees: 0,
    pendingVacations: 0,
    totalDocuments: 0,
    pendingCandidates: 0,
    recentActivity: [] as Array<{
      action: string;
      resource_type: string;
      created_at: string;
    }>,
  };

  if (profile.role === "admin") {
    const [employees, vacations, documents, candidates, logs] =
      await Promise.all([
        supabase.from("employees").select("id, is_active"),
        supabase
          .from("vacation_requests")
          .select("id")
          .eq("status", "pending"),
        supabase.from("documents").select("id"),
        supabase
          .from("candidates")
          .select("id")
          .in("status", ["new", "screening", "interview"]),
        supabase
          .from("audit_logs")
          .select("action, resource_type, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

    stats.totalEmployees = employees.data?.length ?? 0;
    stats.activeEmployees =
      employees.data?.filter((e) => e.is_active).length ?? 0;
    stats.pendingVacations = vacations.data?.length ?? 0;
    stats.totalDocuments = documents.data?.length ?? 0;
    stats.pendingCandidates = candidates.data?.length ?? 0;
    stats.recentActivity = logs.data ?? [];
  } else if (profile.role === "collaborator") {
    // Colaborador: solo sus propios datos
    const { data: employee } = await supabase
      .from("employees")
      .select("id")
      .eq("profile_id", user.id)
      .single();

    if (employee) {
      const [vacations, documents] = await Promise.all([
        supabase
          .from("vacation_requests")
          .select("id")
          .eq("employee_id", employee.id)
          .eq("status", "pending"),
        supabase
          .from("documents")
          .select("id")
          .eq("employee_id", employee.id),
      ]);
      stats.pendingVacations = vacations.data?.length ?? 0;
      stats.totalDocuments = documents.data?.length ?? 0;
    }
  }

  const isAdmin = profile.role === "admin";
  const isSupport = profile.role === "support";
  const isCollaborator = profile.role === "collaborator";

  return (
    <div className="space-y-6">
      {/* Saludo */}
      <div>
        <h1 className="text-2xl font-bold text-ava-charcoal">
          Bienvenido/a,{" "}
          {profile.full_name?.split(" ")[0] ?? profile.email.split("@")[0]} 👋
        </h1>
        <p className="text-ava-charcoal-light text-sm mt-1">
          {formatDate(new Date().toISOString(), "EEEE, d 'de' MMMM 'de' yyyy")}
        </p>
      </div>

      {/* Tarjetas de estadísticas */}
      {isAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Empleados Activos"
            value={stats.activeEmployees}
            total={stats.totalEmployees}
            icon={<Users className="w-5 h-5" />}
            color="bg-blue-50 text-blue-600"
            href="/dashboard/employees"
          />
          <StatCard
            title="Vacaciones Pendientes"
            value={stats.pendingVacations}
            icon={<CalendarDays className="w-5 h-5" />}
            color={
              stats.pendingVacations > 0
                ? "bg-amber-50 text-amber-600"
                : "bg-green-50 text-green-600"
            }
            href="/dashboard/vacations"
            alert={stats.pendingVacations > 0}
          />
          <StatCard
            title="Documentos"
            value={stats.totalDocuments}
            icon={<FileText className="w-5 h-5" />}
            color="bg-purple-50 text-purple-600"
            href="/dashboard/documents"
          />
          <StatCard
            title="Candidatos en Proceso"
            value={stats.pendingCandidates}
            icon={<UserPlus className="w-5 h-5" />}
            color="bg-ava-yellow-light text-amber-700"
            href="/dashboard/onboarding"
          />
        </div>
      )}

      {isCollaborator && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
          <StatCard
            title="Mis Solicitudes Pendientes"
            value={stats.pendingVacations}
            icon={<CalendarDays className="w-5 h-5" />}
            color="bg-amber-50 text-amber-600"
            href="/dashboard/vacations"
          />
          <StatCard
            title="Mis Documentos"
            value={stats.totalDocuments}
            icon={<FileText className="w-5 h-5" />}
            color="bg-purple-50 text-purple-600"
            href="/dashboard/documents"
          />
        </div>
      )}

      {isSupport && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-blue-900">Panel de Soporte</h2>
              <p className="text-sm text-blue-700">
                Acceso técnico al sistema
              </p>
            </div>
          </div>
          <p className="text-sm text-blue-700">
            Accede al{" "}
            <a
              href="/dashboard/support"
              className="font-semibold underline hover:no-underline"
            >
              Panel de Soporte Técnico
            </a>{" "}
            para ver los logs del sistema y gestionar la configuración.
          </p>
        </div>
      )}

      {/* Actividad reciente (solo admin) */}
      {isAdmin && stats.recentActivity.length > 0 && (
        <div className="bg-white rounded-lg border border-ava-gray-medium p-6">
          <h2 className="font-semibold text-ava-charcoal mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-ava-charcoal-light" />
            Actividad Reciente
          </h2>
          <div className="space-y-3">
            {stats.recentActivity.map((log, i) => (
              <div
                key={i}
                className="flex items-center gap-3 text-sm text-ava-charcoal-medium"
              >
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
          Este portal cumple con el RGPD (UE 2016/679) y la LOPDGDD. Los datos
          personales son tratados con las máximas medidas de seguridad.{" "}
          <a
            href="/privacy"
            target="_blank"
            className="underline hover:text-ava-charcoal"
          >
            Ver Política de Privacidad
          </a>
          .
        </div>
      </div>
    </div>
  );
}

// Componente StatCard
function StatCard({
  title,
  value,
  total,
  icon,
  color,
  href,
  alert,
}: {
  title: string;
  value: number;
  total?: number;
  icon: React.ReactNode;
  color: string;
  href: string;
  alert?: boolean;
}) {
  return (
    <a
      href={href}
      className="bg-white rounded-lg border border-ava-gray-medium p-5
                 hover:shadow-md transition-shadow duration-200 block"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-ava-charcoal-light font-medium">{title}</p>
          <p className="text-3xl font-bold text-ava-charcoal mt-1">{value}</p>
          {total !== undefined && (
            <p className="text-xs text-ava-charcoal-light mt-0.5">
              de {total} totales
            </p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${color}`}>
          {icon}
          {alert && (
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </div>
      </div>
    </a>
  );
}
