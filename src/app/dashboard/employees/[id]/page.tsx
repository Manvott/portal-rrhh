import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Edit, User, Phone, MapPin, Briefcase, FileText, CalendarDays } from "lucide-react";
import type { Employee } from "@/types";
import { SkillsManager } from "@/components/employees/SkillsManager";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Solo admin puede ver fichas de otros empleados
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single();

  if (!employee) notFound();

  // Documentos del empleado
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("employee_id", id)
    .order("created_at", { ascending: false })
    .limit(10);

  // Solicitudes de vacaciones
  const { data: vacations } = await supabase
    .from("vacation_requests")
    .select("*")
    .eq("employee_id", id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Habilidades
  const { data: allSkills } = await supabase
    .from("skills")
    .select("id, name, category, area, sort_order")
    .eq("is_active", true)
    .order("category")
    .order("sort_order");

  const { data: employeeSkills } = await supabase
    .from("employee_skills")
    .select("id, skill_id, level, notes")
    .eq("employee_id", id);

  const emp = employee as Employee;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/employees"
          className="flex items-center gap-1 text-sm text-ava-charcoal-light
                     hover:text-ava-charcoal transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a empleados
        </Link>
      </div>

      {/* Header del empleado */}
      <div className="bg-white rounded-lg border border-ava-gray-medium p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-ava-yellow-light rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-amber-700">
                {emp.first_name[0]}{emp.last_name[0]}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-ava-charcoal">
                {emp.first_name} {emp.last_name}
              </h1>
              <p className="text-ava-charcoal-light">
                {emp.position ?? "Sin cargo"} · {emp.department ?? "Sin departamento"}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium
                    ${emp.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                >
                  {emp.is_active ? "Activo" : "Inactivo"}
                </span>
                {emp.employee_number && (
                  <span className="text-xs text-ava-charcoal-light">
                    N° {emp.employee_number}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Link
            href={`/dashboard/employees/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-ava-yellow hover:bg-ava-yellow-dark
                       text-ava-charcoal font-medium rounded-lg transition-colors text-sm"
          >
            <Edit className="w-4 h-4" />
            Editar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Datos personales */}
        <InfoSection title="Datos Personales" icon={<User className="w-4 h-4" />}>
          <InfoRow label="Email" value={emp.email} />
          <InfoRow label="Teléfono" value={emp.phone} />
          <InfoRow label="Fecha de nacimiento" value={formatDate(emp.birth_date)} />
          <InfoRow label="NIF" value={emp.nif} sensitive />
        </InfoSection>

        {/* Datos laborales */}
        <InfoSection title="Datos Laborales" icon={<Briefcase className="w-4 h-4" />}>
          <InfoRow label="Fecha de alta" value={formatDate(emp.hire_date)} />
          <InfoRow label="Tipo de contrato" value={emp.contract_type} />
          <InfoRow label="Localización" value={emp.location} />
          <InfoRow label="N° SS" value={emp.social_security_number} sensitive />
        </InfoSection>

        {/* Contacto */}
        <InfoSection title="Contacto y Dirección" icon={<MapPin className="w-4 h-4" />}>
          <InfoRow label="Dirección" value={emp.address} />
          <InfoRow label="Ciudad" value={emp.city} />
          <InfoRow label="CP" value={emp.postal_code} />
          <InfoRow label="País" value={emp.country} />
          <InfoRow label="Contacto emergencia" value={emp.emergency_contact_name} />
          <InfoRow label="Tel. emergencia" value={emp.emergency_contact_phone} />
        </InfoSection>

        {/* Información bancaria */}
        <InfoSection title="Datos Bancarios" icon={<FileText className="w-4 h-4" />}>
          <InfoRow label="IBAN" value={emp.iban} sensitive />
          {emp.notes && (
            <div className="col-span-2">
              <span className="text-xs text-ava-charcoal-light">Notas</span>
              <p className="text-sm text-ava-charcoal mt-0.5 bg-ava-gray rounded p-2">
                {emp.notes}
              </p>
            </div>
          )}
        </InfoSection>
      </div>

      {/* Documentos */}
      <div className="bg-white rounded-lg border border-ava-gray-medium p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ava-charcoal flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Documentos ({documents?.length ?? 0})
          </h2>
          <Link
            href={`/dashboard/documents?employee=${id}`}
            className="text-sm text-ava-charcoal-light hover:text-ava-charcoal underline"
          >
            Ver todos
          </Link>
        </div>
        {!documents || documents.length === 0 ? (
          <p className="text-sm text-ava-charcoal-light">Sin documentos adjuntos.</p>
        ) : (
          <div className="space-y-2">
            {documents.slice(0, 5).map((doc) => (
              <div key={doc.id} className="flex items-center justify-between text-sm">
                <span className="text-ava-charcoal">{doc.file_name}</span>
                <span className="text-xs text-ava-charcoal-light">
                  {formatDate(doc.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Habilidades */}
      <div className="bg-white rounded-lg border border-ava-gray-medium p-6">
        <SkillsManager
          employeeId={id}
          allSkills={allSkills ?? []}
          employeeSkills={employeeSkills ?? []}
        />
      </div>
    </div>
  );
}

// Sección de información
function InfoSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg border border-ava-gray-medium p-6">
      <h2 className="font-semibold text-ava-charcoal flex items-center gap-2 mb-4">
        <span className="text-ava-charcoal-light">{icon}</span>
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

// Fila de información
function InfoRow({
  label,
  value,
  sensitive = false,
}: {
  label: string;
  value: string | null | undefined;
  sensitive?: boolean;
}) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-xs text-ava-charcoal-light shrink-0">{label}</span>
      <span
        className={`text-sm text-ava-charcoal text-right ${
          sensitive && value ? "font-mono tracking-wider" : ""
        }`}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}
