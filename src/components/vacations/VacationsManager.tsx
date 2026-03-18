"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/use-toast";
import {
  CalendarDays,
  Plus,
  Check,
  X,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  formatDate,
  VACATION_TYPE_LABELS,
  VACATION_STATUS_LABELS,
  VACATION_STATUS_COLORS,
} from "@/lib/utils";
import type { UserRole } from "@/types";

interface VacationRequest {
  id: string;
  start_date: string;
  end_date: string;
  days_count: number;
  type: string;
  reason: string | null;
  status: string;
  created_at: string;
  employee?: { first_name: string; last_name: string; department: string | null } | null;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department: string | null;
}

interface Props {
  vacations: VacationRequest[];
  userRole: UserRole;
  currentEmployeeId: string | null;
  employees: Employee[] | null;
}

export function VacationsManager({
  vacations: initialVacations,
  userRole,
  currentEmployeeId,
  employees,
}: Props) {
  const [vacations, setVacations] = useState(initialVacations);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    employee_id: currentEmployeeId ?? "",
    start_date: "",
    end_date: "",
    type: "vacation",
    reason: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Calcular días laborables entre dos fechas
  const calcBusinessDays = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const s = new Date(start);
    const e = new Date(end);
    if (s > e) return 0;
    let count = 0;
    const cur = new Date(s);
    while (cur <= e) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) count++;
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.start_date || !form.end_date) {
      setFormError("Las fechas de inicio y fin son obligatorias.");
      return;
    }

    if (new Date(form.start_date) > new Date(form.end_date)) {
      setFormError("La fecha de inicio no puede ser posterior a la de fin.");
      return;
    }

    const targetId =
      userRole === "admin" ? form.employee_id : currentEmployeeId;
    if (!targetId) {
      setFormError("Selecciona un empleado.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const days = calcBusinessDays(form.start_date, form.end_date);

      const { data: newReq, error } = await supabase
        .from("vacation_requests")
        .insert({
          employee_id: targetId,
          start_date: form.start_date,
          end_date: form.end_date,
          days_count: days,
          type: form.type,
          reason: form.reason || null,
          status: "pending",
        })
        .select(`*, employee:employees(first_name, last_name, department)`)
        .single();

      if (error) throw error;

      setVacations((prev) => [newReq as VacationRequest, ...prev]);
      setShowForm(false);
      setForm({
        employee_id: currentEmployeeId ?? "",
        start_date: "",
        end_date: "",
        type: "vacation",
        reason: "",
      });

      toast({
        title: "Solicitud enviada",
        description: "Tu solicitud de ausencia ha sido enviada para su revisión.",
      });
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Error al enviar la solicitud.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("vacation_requests")
        .update({ status: "approved", approved_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      setVacations((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: "approved" } : v))
      );
      toast({ title: "Solicitud aprobada" });
    } catch {
      toast({ title: "Error", description: "No se pudo aprobar.", variant: "destructive" });
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Motivo del rechazo (opcional):");
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("vacation_requests")
        .update({
          status: "rejected",
          rejection_reason: reason || null,
        })
        .eq("id", id);

      if (error) throw error;

      setVacations((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: "rejected" } : v))
      );
      toast({ title: "Solicitud rechazada" });
    } catch {
      toast({ title: "Error", description: "No se pudo rechazar.", variant: "destructive" });
    }
  };

  const pendingCount = vacations.filter((v) => v.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ava-charcoal flex items-center gap-2">
            <CalendarDays className="w-6 h-6" />
            {userRole === "collaborator" ? "Mis Vacaciones y Ausencias" : "Vacaciones y Ausencias"}
          </h1>
          {pendingCount > 0 && (
            <p className="text-amber-600 text-sm mt-1 font-medium">
              {pendingCount} solicitud{pendingCount !== 1 ? "es" : ""} pendiente{pendingCount !== 1 ? "s" : ""} de revisión
            </p>
          )}
        </div>
        {(userRole === "collaborator" || userRole === "admin") && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-ava-yellow hover:bg-ava-yellow-dark
                       text-ava-charcoal font-semibold px-4 py-2 rounded-lg
                       transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Nueva solicitud
          </button>
        )}
      </div>

      {/* Formulario de nueva solicitud */}
      {showForm && (
        <div className="bg-white rounded-lg border border-ava-gray-medium p-6">
          <h2 className="font-semibold text-ava-charcoal mb-4">
            Nueva Solicitud de Ausencia
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userRole === "admin" && employees && (
                <div className="space-y-1 sm:col-span-2">
                  <label className="block text-sm font-medium text-ava-charcoal">
                    Empleado *
                  </label>
                  <select
                    name="employee_id"
                    value={form.employee_id}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-ava-gray-medium
                               focus:outline-none focus:ring-2 focus:ring-ava-yellow text-sm"
                  >
                    <option value="">Seleccionar...</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.last_name}, {emp.first_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-sm font-medium text-ava-charcoal">
                  Tipo *
                </label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 rounded-lg border border-ava-gray-medium
                             focus:outline-none focus:ring-2 focus:ring-ava-yellow text-sm"
                >
                  {Object.entries(VACATION_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-ava-charcoal">
                  Fecha inicio *
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={form.start_date}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 rounded-lg border border-ava-gray-medium
                             focus:outline-none focus:ring-2 focus:ring-ava-yellow text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-ava-charcoal">
                  Fecha fin *
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={form.end_date}
                  onChange={handleChange}
                  required
                  min={form.start_date || new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2 rounded-lg border border-ava-gray-medium
                             focus:outline-none focus:ring-2 focus:ring-ava-yellow text-sm"
                />
              </div>

              {form.start_date && form.end_date && (
                <div className="flex items-center gap-2 text-sm text-ava-charcoal-medium">
                  <Clock className="w-4 h-4 text-ava-yellow" />
                  <span>
                    <strong>{calcBusinessDays(form.start_date, form.end_date)}</strong> días laborables
                  </span>
                </div>
              )}

              <div className="space-y-1 sm:col-span-2">
                <label className="block text-sm font-medium text-ava-charcoal">
                  Motivo (opcional)
                </label>
                <textarea
                  name="reason"
                  value={form.reason}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Motivo de la solicitud..."
                  className="w-full px-3 py-2 rounded-lg border border-ava-gray-medium
                             focus:outline-none focus:ring-2 focus:ring-ava-yellow text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 bg-ava-yellow hover:bg-ava-yellow-dark
                           text-ava-charcoal font-semibold px-4 py-2 rounded-lg
                           transition-colors text-sm disabled:opacity-60"
              >
                {submitting ? "Enviando..." : "Enviar solicitud"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg border border-ava-gray-medium
                           text-ava-charcoal hover:bg-ava-gray transition-colors text-sm"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de solicitudes */}
      <div className="bg-white rounded-lg border border-ava-gray-medium overflow-hidden">
        {vacations.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarDays className="w-12 h-12 text-ava-gray-medium mx-auto mb-4" />
            <p className="font-medium text-ava-charcoal">Sin solicitudes</p>
            <p className="text-sm text-ava-charcoal-light mt-1">
              No hay solicitudes de vacaciones registradas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-ava-gray border-b border-ava-gray-medium">
                  {userRole === "admin" && (
                    <th className="text-left text-xs font-semibold text-ava-charcoal-light uppercase tracking-wider px-4 py-3">
                      Empleado
                    </th>
                  )}
                  <th className="text-left text-xs font-semibold text-ava-charcoal-light uppercase tracking-wider px-4 py-3">
                    Tipo
                  </th>
                  <th className="text-left text-xs font-semibold text-ava-charcoal-light uppercase tracking-wider px-4 py-3">
                    Período
                  </th>
                  <th className="text-left text-xs font-semibold text-ava-charcoal-light uppercase tracking-wider px-4 py-3">
                    Días
                  </th>
                  <th className="text-left text-xs font-semibold text-ava-charcoal-light uppercase tracking-wider px-4 py-3">
                    Estado
                  </th>
                  {userRole === "admin" && (
                    <th className="px-4 py-3" />
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-ava-gray-medium">
                {vacations.map((v) => (
                  <tr key={v.id} className="hover:bg-ava-gray/50 transition-colors">
                    {userRole === "admin" && (
                      <td className="px-4 py-3 text-sm text-ava-charcoal">
                        {v.employee
                          ? `${v.employee.first_name} ${v.employee.last_name}`
                          : "—"}
                        {v.employee?.department && (
                          <span className="block text-xs text-ava-charcoal-light">
                            {v.employee.department}
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-ava-charcoal">
                      {VACATION_TYPE_LABELS[v.type] ?? v.type}
                    </td>
                    <td className="px-4 py-3 text-sm text-ava-charcoal">
                      {formatDate(v.start_date)} — {formatDate(v.end_date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-ava-charcoal font-medium">
                      {v.days_count}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium
                          ${VACATION_STATUS_COLORS[v.status] ?? "bg-gray-100 text-gray-600"}`}
                      >
                        {VACATION_STATUS_LABELS[v.status] ?? v.status}
                      </span>
                    </td>
                    {userRole === "admin" && v.status === "pending" && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          <button
                            onClick={() => handleApprove(v.id)}
                            className="p-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                            title="Aprobar"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(v.id)}
                            className="p-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                            title="Rechazar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                    {userRole === "admin" && v.status !== "pending" && (
                      <td className="px-4 py-3" />
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
