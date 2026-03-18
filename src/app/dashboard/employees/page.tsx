import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users, Plus, Search } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import type { Employee } from "@/types";

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const supabase = await createClient();
  const { q, status } = await searchParams;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verificar rol admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard");
  }

  // Obtener empleados con filtros
  let query = supabase
    .from("employees")
    .select("*")
    .order("last_name", { ascending: true });

  if (q) {
    query = query.or(
      `first_name.ilike.%${q}%,last_name.ilike.%${q}%,email.ilike.%${q}%,position.ilike.%${q}%`
    );
  }

  if (status === "active") {
    query = query.eq("is_active", true);
  } else if (status === "inactive") {
    query = query.eq("is_active", false);
  }

  const { data: employees } = await query;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ava-charcoal flex items-center gap-2">
            <Users className="w-6 h-6" />
            Empleados
          </h1>
          <p className="text-ava-charcoal-light text-sm mt-1">
            {employees?.length ?? 0} empleados en total
          </p>
        </div>
        <Link
          href="/dashboard/employees/new"
          className="flex items-center gap-2 bg-ava-yellow hover:bg-ava-yellow-dark
                     text-ava-charcoal font-semibold px-4 py-2 rounded-lg
                     transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo empleado
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-ava-gray-medium p-4 flex flex-wrap gap-4">
        <form className="flex-1 min-w-48 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ava-charcoal-light" />
          <input
            name="q"
            type="search"
            defaultValue={q}
            placeholder="Buscar por nombre, email, cargo..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-ava-gray-medium
                       focus:outline-none focus:ring-2 focus:ring-ava-yellow"
          />
        </form>

        <div className="flex gap-2">
          <Link
            href="/dashboard/employees"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${!status ? "bg-ava-yellow text-ava-charcoal" : "bg-ava-gray text-ava-charcoal-medium hover:bg-ava-gray-medium"}`}
          >
            Todos
          </Link>
          <Link
            href="/dashboard/employees?status=active"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${status === "active" ? "bg-ava-yellow text-ava-charcoal" : "bg-ava-gray text-ava-charcoal-medium hover:bg-ava-gray-medium"}`}
          >
            Activos
          </Link>
          <Link
            href="/dashboard/employees?status=inactive"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${status === "inactive" ? "bg-ava-yellow text-ava-charcoal" : "bg-ava-gray text-ava-charcoal-medium hover:bg-ava-gray-medium"}`}
          >
            Inactivos
          </Link>
        </div>
      </div>

      {/* Tabla de empleados */}
      {!employees || employees.length === 0 ? (
        <div className="bg-white rounded-lg border border-ava-gray-medium p-12 text-center">
          <Users className="w-12 h-12 text-ava-gray-medium mx-auto mb-4" />
          <p className="text-ava-charcoal font-medium">No hay empleados</p>
          <p className="text-ava-charcoal-light text-sm mt-1">
            {q ? "No se encontraron resultados para tu búsqueda." : "Añade tu primer empleado."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-ava-gray-medium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-ava-gray border-b border-ava-gray-medium">
                  <th className="text-left text-xs font-semibold text-ava-charcoal-light uppercase tracking-wider px-4 py-3">
                    Empleado
                  </th>
                  <th className="text-left text-xs font-semibold text-ava-charcoal-light uppercase tracking-wider px-4 py-3">
                    Cargo / Depto.
                  </th>
                  <th className="text-left text-xs font-semibold text-ava-charcoal-light uppercase tracking-wider px-4 py-3">
                    Contrato
                  </th>
                  <th className="text-left text-xs font-semibold text-ava-charcoal-light uppercase tracking-wider px-4 py-3">
                    Alta
                  </th>
                  <th className="text-left text-xs font-semibold text-ava-charcoal-light uppercase tracking-wider px-4 py-3">
                    Estado
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ava-gray-medium">
                {employees.map((emp: Employee) => (
                  <tr
                    key={emp.id}
                    className="hover:bg-ava-gray/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-ava-yellow-light rounded-full flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-amber-700">
                            {emp.first_name[0]}{emp.last_name[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-ava-charcoal text-sm">
                            {emp.first_name} {emp.last_name}
                          </p>
                          <p className="text-xs text-ava-charcoal-light">
                            {emp.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-ava-charcoal">
                      <p>{emp.position ?? "—"}</p>
                      <p className="text-xs text-ava-charcoal-light">
                        {emp.department ?? "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-ava-charcoal">
                      {emp.contract_type ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-ava-charcoal">
                      {formatDate(emp.hire_date)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium
                          ${emp.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                      >
                        {emp.is_active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/dashboard/employees/${emp.id}`}
                        className="text-xs text-ava-charcoal-light hover:text-ava-charcoal
                                   underline transition-colors"
                      >
                        Ver ficha
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
