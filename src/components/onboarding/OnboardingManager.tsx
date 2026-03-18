"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { UserPlus, Plus, AlertCircle, Mail, Phone, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { Candidate } from "@/types";

const STATUS_LABELS: Record<string, string> = {
  new: "Nuevo",
  screening: "Screening",
  interview: "Entrevista",
  offer: "Oferta",
  hired: "Contratado",
  rejected: "Descartado",
};

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  screening: "bg-purple-100 text-purple-800",
  interview: "bg-amber-100 text-amber-800",
  offer: "bg-green-100 text-green-800",
  hired: "bg-ava-yellow-light text-amber-700",
  rejected: "bg-gray-100 text-gray-600",
};

interface Props {
  candidates: Candidate[];
}

export function OnboardingManager({ candidates: initialCandidates }: Props) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    position_applied: "",
    department: "",
    source: "",
    salary_expectation: "",
    interview_date: "",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.first_name || !form.last_name || !form.email || !form.position_applied) {
      setError("Nombre, apellidos, email y puesto son obligatorios.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data, error: insertError } = await supabase
        .from("candidates")
        .insert({
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone || null,
          position_applied: form.position_applied,
          department: form.department || null,
          source: form.source || null,
          salary_expectation: form.salary_expectation
            ? parseFloat(form.salary_expectation)
            : null,
          interview_date: form.interview_date || null,
          notes: form.notes || null,
          status: "new",
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setCandidates((prev) => [data as Candidate, ...prev]);
      setShowForm(false);
      setForm({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        position_applied: "",
        department: "",
        source: "",
        salary_expectation: "",
        interview_date: "",
        notes: "",
      });
      toast({ title: "Candidato añadido", description: "El candidato ha sido registrado." });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdvanceStatus = async (candidate: Candidate) => {
    const statusOrder = ["new", "screening", "interview", "offer", "hired"];
    const currentIdx = statusOrder.indexOf(candidate.status);
    if (currentIdx === -1 || currentIdx === statusOrder.length - 1) return;

    const nextStatus = statusOrder[currentIdx + 1];

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("candidates")
        .update({ status: nextStatus })
        .eq("id", candidate.id);

      if (error) throw error;

      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidate.id ? { ...c, status: nextStatus as Candidate["status"] } : c
        )
      );
      toast({ title: "Estado actualizado", description: `Avanzado a: ${STATUS_LABELS[nextStatus]}` });
    } catch {
      toast({ title: "Error", description: "No se pudo actualizar.", variant: "destructive" });
    }
  };

  const filteredCandidates =
    filterStatus === "all"
      ? candidates
      : candidates.filter((c) => c.status === filterStatus);

  const activeCandidates = candidates.filter(
    (c) => !["hired", "rejected"].includes(c.status)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ava-charcoal flex items-center gap-2">
            <UserPlus className="w-6 h-6" />
            Selección y Onboarding
          </h1>
          <p className="text-ava-charcoal-light text-sm mt-1">
            {activeCandidates} candidato{activeCandidates !== 1 ? "s" : ""} en proceso activo
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-ava-yellow hover:bg-ava-yellow-dark
                     text-ava-charcoal font-semibold px-4 py-2 rounded-lg
                     transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Nuevo candidato
        </button>
      </div>

      {/* Pipeline visual */}
      <div className="grid grid-cols-5 gap-2">
        {Object.entries(STATUS_LABELS).slice(0, 5).map(([status, label]) => {
          const count = candidates.filter((c) => c.status === status).length;
          return (
            <div key={status} className="bg-white rounded-lg border border-ava-gray-medium p-3 text-center">
              <p className="text-2xl font-bold text-ava-charcoal">{count}</p>
              <p className="text-xs text-ava-charcoal-light mt-0.5">{label}</p>
            </div>
          );
        })}
      </div>

      {/* Formulario nuevo candidato */}
      {showForm && (
        <div className="bg-white rounded-lg border border-ava-gray-medium p-6">
          <h2 className="font-semibold text-ava-charcoal mb-4">Nuevo Candidato</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Nombre *", name: "first_name", type: "text", required: true },
                { label: "Apellidos *", name: "last_name", type: "text", required: true },
                { label: "Email *", name: "email", type: "email", required: true },
                { label: "Teléfono", name: "phone", type: "tel" },
                { label: "Puesto solicitado *", name: "position_applied", type: "text", required: true },
                { label: "Departamento", name: "department", type: "text" },
                { label: "Fuente", name: "source", type: "text", placeholder: "LinkedIn, referido..." },
                { label: "Salario esperado (€)", name: "salary_expectation", type: "number" },
                { label: "Fecha entrevista", name: "interview_date", type: "datetime-local" },
              ].map((f) => (
                <div key={f.name} className="space-y-1">
                  <label className="block text-sm font-medium text-ava-charcoal">{f.label}</label>
                  <input
                    type={f.type}
                    name={f.name}
                    value={form[f.name as keyof typeof form]}
                    onChange={handleChange}
                    required={f.required}
                    placeholder={f.placeholder}
                    className="w-full px-3 py-2 rounded-lg border border-ava-gray-medium
                               focus:outline-none focus:ring-2 focus:ring-ava-yellow text-sm"
                  />
                </div>
              ))}
              <div className="space-y-1 sm:col-span-2">
                <label className="block text-sm font-medium text-ava-charcoal">Notas</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-ava-gray-medium
                             focus:outline-none focus:ring-2 focus:ring-ava-yellow text-sm resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="bg-ava-yellow hover:bg-ava-yellow-dark text-ava-charcoal
                           font-semibold px-4 py-2 rounded-lg transition-colors text-sm
                           disabled:opacity-60"
              >
                {submitting ? "Guardando..." : "Añadir candidato"}
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

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
            ${filterStatus === "all" ? "bg-ava-yellow text-ava-charcoal" : "bg-white border border-ava-gray-medium text-ava-charcoal-medium hover:bg-ava-gray"}`}
        >
          Todos ({candidates.length})
        </button>
        {Object.entries(STATUS_LABELS).map(([status, label]) => {
          const count = candidates.filter((c) => c.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${filterStatus === status ? "bg-ava-yellow text-ava-charcoal" : "bg-white border border-ava-gray-medium text-ava-charcoal-medium hover:bg-ava-gray"}`}
            >
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Lista de candidatos */}
      {filteredCandidates.length === 0 ? (
        <div className="bg-white rounded-lg border border-ava-gray-medium p-12 text-center">
          <UserPlus className="w-12 h-12 text-ava-gray-medium mx-auto mb-4" />
          <p className="font-medium text-ava-charcoal">Sin candidatos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCandidates.map((candidate) => (
            <div
              key={candidate.id}
              className="bg-white rounded-lg border border-ava-gray-medium p-5 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-ava-charcoal">
                    {candidate.first_name} {candidate.last_name}
                  </h3>
                  <p className="text-sm text-ava-charcoal-light">
                    {candidate.position_applied}
                    {candidate.department && ` · ${candidate.department}`}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${STATUS_COLORS[candidate.status]}`}>
                  {STATUS_LABELS[candidate.status]}
                </span>
              </div>

              <div className="flex flex-wrap gap-3 text-xs text-ava-charcoal-light">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {candidate.email}
                </span>
                {candidate.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {candidate.phone}
                  </span>
                )}
              </div>

              {candidate.interview_date && (
                <p className="text-xs text-ava-charcoal-light">
                  Entrevista: {formatDate(candidate.interview_date, "dd/MM/yyyy HH:mm")}
                </p>
              )}

              {!["hired", "rejected"].includes(candidate.status) && (
                <button
                  onClick={() => handleAdvanceStatus(candidate)}
                  className="flex items-center gap-1 text-xs text-ava-charcoal-light
                             hover:text-ava-charcoal transition-colors"
                >
                  <ArrowRight className="w-3 h-3" />
                  Avanzar a: {STATUS_LABELS[
                    ["new", "screening", "interview", "offer", "hired"][
                      (["new", "screening", "interview", "offer", "hired"].indexOf(candidate.status) + 1) % 5
                    ]
                  ]}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
