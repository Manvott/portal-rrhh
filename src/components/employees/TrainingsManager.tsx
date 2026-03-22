"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { GraduationCap, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import type { UserRole } from "@/types";

interface Training {
  id: string;
  title: string;
  provider: string | null;
  category: string;
  start_date: string;
  end_date: string | null;
  hours: number | null;
  cost: number | null;
  notes: string | null;
  status: string;
  created_at: string;
}

interface Props {
  employeeId: string;
  trainings: Training[];
  userRole: UserRole;
}

const CATEGORY_LABELS: Record<string, string> = {
  technical: "Técnica",
  soft_skills: "Soft Skills",
  compliance: "Compliance/Legal",
  leadership: "Liderazgo",
  gastronomy: "Gastronomía",
  languages: "Idiomas",
  other: "Otro",
};

const CATEGORY_COLORS: Record<string, string> = {
  technical: "bg-blue-100 text-blue-700",
  soft_skills: "bg-green-100 text-green-700",
  compliance: "bg-red-100 text-red-700",
  leadership: "bg-purple-100 text-purple-700",
  gastronomy: "bg-orange-100 text-orange-700",
  languages: "bg-teal-100 text-teal-700",
  other: "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<string, string> = {
  planned: "Planificada",
  in_progress: "En curso",
  completed: "Completada",
  cancelled: "Cancelada",
};

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-500",
};

const emptyForm = {
  title: "",
  provider: "",
  category: "technical",
  start_date: "",
  end_date: "",
  hours: "",
  cost: "",
  notes: "",
  status: "completed",
};

export function TrainingsManager({ employeeId, trainings: initial, userRole }: Props) {
  const [trainings, setTrainings] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const isAdmin = userRole === "admin";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.start_date) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("trainings")
        .insert({
          employee_id: employeeId,
          title: form.title.trim(),
          provider: form.provider.trim() || null,
          category: form.category,
          start_date: form.start_date,
          end_date: form.end_date || null,
          hours: form.hours ? parseInt(form.hours) : null,
          cost: form.cost ? parseFloat(form.cost) : null,
          notes: form.notes.trim() || null,
          status: form.status,
        })
        .select()
        .single();
      if (error) throw error;
      setTrainings((prev) => [data as Training, ...prev]);
      setForm(emptyForm);
      setShowForm(false);
      toast({ title: "Formación añadida correctamente" });
    } catch {
      toast({ title: "Error", description: "No se pudo guardar la formación.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta formación?")) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from("trainings").delete().eq("id", id);
      if (error) throw error;
      setTrainings((prev) => prev.filter((t) => t.id !== id));
      toast({ title: "Formación eliminada" });
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar.", variant: "destructive" });
    }
  };

  const totalHours = trainings
    .filter((t) => t.status === "completed" && t.hours)
    .reduce((sum, t) => sum + (t.hours ?? 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="flex items-center gap-2 font-semibold text-ava-charcoal hover:text-ava-charcoal-light transition-colors"
        >
          <GraduationCap className="w-4 h-4" />
          Formaciones y Certificaciones ({trainings.length})
          {totalHours > 0 && (
            <span className="text-xs font-normal text-ava-charcoal-light ml-1">
              · {totalHours}h completadas
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
        </button>
        {isAdmin && expanded && (
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-1.5 text-sm bg-ava-yellow hover:bg-ava-yellow-dark
                       text-ava-charcoal font-medium px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Añadir
          </button>
        )}
      </div>

      {expanded && (
        <div className="space-y-4">
          {/* Formulario */}
          {showForm && isAdmin && (
            <div className="border border-ava-gray-medium rounded-lg p-4 bg-ava-gray/30">
              <h3 className="font-medium text-ava-charcoal mb-3 text-sm">Nueva formación</h3>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleChange}
                      required
                      maxLength={200}
                      placeholder="Título del curso o certificación *"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-ava-gray-medium
                                 focus:outline-none focus:ring-2 focus:ring-ava-yellow"
                    />
                  </div>
                  <input
                    name="provider"
                    value={form.provider}
                    onChange={handleChange}
                    placeholder="Proveedor / Centro formativo"
                    className="px-3 py-2 text-sm rounded-lg border border-ava-gray-medium
                               focus:outline-none focus:ring-2 focus:ring-ava-yellow"
                  />
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="px-3 py-2 text-sm rounded-lg border border-ava-gray-medium
                               focus:outline-none focus:ring-2 focus:ring-ava-yellow"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <div>
                    <label className="text-xs text-ava-charcoal-light block mb-1">Fecha inicio *</label>
                    <input
                      type="date"
                      name="start_date"
                      value={form.start_date}
                      onChange={handleChange}
                      required
                      className="w-full px-3 py-2 text-sm rounded-lg border border-ava-gray-medium
                                 focus:outline-none focus:ring-2 focus:ring-ava-yellow"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-ava-charcoal-light block mb-1">Fecha fin</label>
                    <input
                      type="date"
                      name="end_date"
                      value={form.end_date}
                      onChange={handleChange}
                      min={form.start_date}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-ava-gray-medium
                                 focus:outline-none focus:ring-2 focus:ring-ava-yellow"
                    />
                  </div>
                  <input
                    type="number"
                    name="hours"
                    value={form.hours}
                    onChange={handleChange}
                    min={1}
                    placeholder="Horas"
                    className="px-3 py-2 text-sm rounded-lg border border-ava-gray-medium
                               focus:outline-none focus:ring-2 focus:ring-ava-yellow"
                  />
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="px-3 py-2 text-sm rounded-lg border border-ava-gray-medium
                               focus:outline-none focus:ring-2 focus:ring-ava-yellow"
                  >
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <div className="sm:col-span-2">
                    <textarea
                      name="notes"
                      value={form.notes}
                      onChange={handleChange}
                      rows={2}
                      placeholder="Notas adicionales..."
                      className="w-full px-3 py-2 text-sm rounded-lg border border-ava-gray-medium
                                 focus:outline-none focus:ring-2 focus:ring-ava-yellow resize-none"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-ava-yellow hover:bg-ava-yellow-dark text-ava-charcoal
                               font-medium rounded-lg text-sm transition-colors disabled:opacity-60"
                  >
                    {saving ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setForm(emptyForm); }}
                    className="px-4 py-2 border border-ava-gray-medium rounded-lg text-sm
                               text-ava-charcoal hover:bg-ava-gray transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lista */}
          {trainings.length === 0 ? (
            <p className="text-sm text-ava-charcoal-light">Sin formaciones registradas.</p>
          ) : (
            <div className="space-y-2">
              {trainings.map((t) => (
                <div
                  key={t.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-ava-gray-medium
                             bg-white hover:bg-ava-gray/20 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-ava-charcoal">{t.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[t.category] ?? CATEGORY_COLORS.other}`}>
                        {CATEGORY_LABELS[t.category] ?? t.category}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[t.status] ?? STATUS_COLORS.completed}`}>
                        {STATUS_LABELS[t.status] ?? t.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-ava-charcoal-light">
                      {t.provider && <span>{t.provider}</span>}
                      <span>
                        {new Date(t.start_date + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                        {t.end_date && ` — ${new Date(t.end_date + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}`}
                      </span>
                      {t.hours && <span>{t.hours}h</span>}
                    </div>
                    {t.notes && (
                      <p className="text-xs text-ava-charcoal-light mt-1 italic">{t.notes}</p>
                    )}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(t.id)}
                      className="p-1 text-ava-charcoal-light hover:text-red-500 transition-colors shrink-0"
                      title="Eliminar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
