"use client";

import { useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Star, Plus, ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Skill {
  id: string;
  name: string;
  category: string;
  area: string | null;
  sort_order: number;
}

interface EmployeeSkill {
  id: string;
  skill_id: string;
  level: "basic" | "intermediate" | "advanced" | "expert";
  notes: string | null;
}

interface Props {
  employeeId: string;
  allSkills: Skill[];
  employeeSkills: EmployeeSkill[];
  readOnly?: boolean;
}

const CATEGORIES: Record<string, { label: string; emoji: string; color: string }> = {
  general:    { label: "Habilidades Generales", emoji: "🧠", color: "bg-blue-50 border-blue-200" },
  warehouse:  { label: "Almacén",               emoji: "📦", color: "bg-amber-50 border-amber-200" },
  admin:      { label: "Administración",         emoji: "🗂️", color: "bg-purple-50 border-purple-200" },
  gastronomy: { label: "Gastronomía / Producto", emoji: "🍽️", color: "bg-orange-50 border-orange-200" },
  sales:      { label: "Ventas / Comercial",     emoji: "📈", color: "bg-green-50 border-green-200" },
  logistics:  { label: "Logística",              emoji: "🚚", color: "bg-slate-50 border-slate-200" },
};

const LEVELS: Record<string, { label: string; stars: number; color: string }> = {
  basic:        { label: "Básico",       stars: 1, color: "text-gray-500" },
  intermediate: { label: "Intermedio",   stars: 2, color: "text-blue-500" },
  advanced:     { label: "Avanzado",     stars: 3, color: "text-amber-500" },
  expert:       { label: "Experto",      stars: 4, color: "text-green-600" },
};

function StarRating({ level }: { level: string }) {
  const info = LEVELS[level];
  if (!info) return null;
  return (
    <span className={cn("flex items-center gap-0.5", info.color)}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Star key={i} className={cn("w-3 h-3", i < info.stars ? "fill-current" : "opacity-20")} />
      ))}
      <span className="text-xs ml-1">{info.label}</span>
    </span>
  );
}

export function SkillsManager({ employeeId, allSkills, employeeSkills: initialSkills, readOnly = false }: Props) {
  const [employeeSkills, setEmployeeSkills] = useState<EmployeeSkill[]>(initialSkills);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ general: true });
  const [saving, setSaving] = useState<string | null>(null);
  const [editingLevel, setEditingLevel] = useState<string | null>(null);
  const [customSkillCategory, setCustomSkillCategory] = useState<string | null>(null);
  const [customSkillName, setCustomSkillName] = useState("");
  const [addingCustom, setAddingCustom] = useState(false);

  const skillMap = useMemo(() => {
    const m: Record<string, EmployeeSkill> = {};
    employeeSkills.forEach((es) => { m[es.skill_id] = es; });
    return m;
  }, [employeeSkills]);

  const byCategory = useMemo(() => {
    const m: Record<string, Skill[]> = {};
    allSkills.forEach((s) => {
      if (!m[s.category]) m[s.category] = [];
      m[s.category].push(s);
    });
    return m;
  }, [allSkills]);

  const totalAssigned = employeeSkills.length;
  const totalSkills = allSkills.length;

  const toggleSkill = async (skill: Skill) => {
    if (readOnly) return;
    const existing = skillMap[skill.id];
    setSaving(skill.id);
    const supabase = createClient();
    try {
      if (existing) {
        // Quitar habilidad
        const { error } = await supabase.from("employee_skills").delete().eq("id", existing.id);
        if (error) throw error;
        setEmployeeSkills((prev) => prev.filter((es) => es.skill_id !== skill.id));
        toast({ title: "Habilidad eliminada", description: skill.name });
      } else {
        // Añadir habilidad
        const { data, error } = await supabase
          .from("employee_skills")
          .insert({ employee_id: employeeId, skill_id: skill.id, level: "basic" })
          .select()
          .single();
        if (error) throw error;
        setEmployeeSkills((prev) => [...prev, data as EmployeeSkill]);
        toast({ title: "Habilidad añadida", description: skill.name });
      }
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error desconocido", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const updateLevel = async (skillId: string, empSkillId: string, level: string) => {
    setSaving(skillId);
    const supabase = createClient();
    try {
      const { error } = await supabase.from("employee_skills").update({ level }).eq("id", empSkillId);
      if (error) throw error;
      setEmployeeSkills((prev) => prev.map((es) => es.skill_id === skillId ? { ...es, level: level as EmployeeSkill["level"] } : es));
      setEditingLevel(null);
    } catch (err) {
      toast({ title: "Error al actualizar nivel", variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const addCustomSkill = async () => {
    if (!customSkillName.trim() || !customSkillCategory) return;
    setAddingCustom(true);
    const supabase = createClient();
    try {
      // Insertar nueva habilidad en el catálogo
      const { data: newSkill, error: skillError } = await supabase
        .from("skills")
        .insert({ name: customSkillName.trim(), category: customSkillCategory, area: CATEGORIES[customSkillCategory]?.label ?? null })
        .select()
        .single();
      if (skillError) throw skillError;

      // Asignarla al empleado
      const { data: empSkill, error: empError } = await supabase
        .from("employee_skills")
        .insert({ employee_id: employeeId, skill_id: newSkill.id, level: "basic" })
        .select()
        .single();
      if (empError) throw empError;

      setEmployeeSkills((prev) => [...prev, empSkill as EmployeeSkill]);
      toast({ title: "Habilidad personalizada añadida", description: customSkillName.trim() });
      setCustomSkillName("");
      setCustomSkillCategory(null);
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error", variant: "destructive" });
    } finally {
      setAddingCustom(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-ava-yellow" />
          <h2 className="font-semibold text-ava-charcoal text-lg">Habilidades y Competencias</h2>
        </div>
        <span className="text-sm text-ava-charcoal-light bg-ava-gray px-3 py-1 rounded-full">
          {totalAssigned} / {totalSkills} asignadas
        </span>
      </div>

      {/* Barra de progreso */}
      <div className="w-full bg-ava-gray rounded-full h-2">
        <div
          className="bg-ava-yellow h-2 rounded-full transition-all duration-500"
          style={{ width: totalSkills > 0 ? `${(totalAssigned / totalSkills) * 100}%` : "0%" }}
        />
      </div>

      {/* Categorías */}
      {Object.entries(CATEGORIES).map(([catKey, catInfo]) => {
        const skills = byCategory[catKey] ?? [];
        const assignedInCat = skills.filter((s) => skillMap[s.id]).length;
        const isOpen = expanded[catKey] ?? false;

        return (
          <div key={catKey} className={cn("rounded-lg border", catInfo.color)}>
            {/* Cabecera de categoría */}
            <button
              onClick={() => setExpanded((prev) => ({ ...prev, [catKey]: !isOpen }))}
              className="w-full flex items-center justify-between px-4 py-3 text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{catInfo.emoji}</span>
                <span className="font-semibold text-ava-charcoal">{catInfo.label}</span>
                <span className="text-xs text-ava-charcoal-light bg-white/70 px-2 py-0.5 rounded-full">
                  {assignedInCat}/{skills.length}
                </span>
              </div>
              {isOpen ? <ChevronDown className="w-4 h-4 text-ava-charcoal-light" /> : <ChevronRight className="w-4 h-4 text-ava-charcoal-light" />}
            </button>

            {/* Lista de habilidades */}
            {isOpen && (
              <div className="px-4 pb-4 space-y-2">
                {skills.map((skill) => {
                  const empSkill = skillMap[skill.id];
                  const isChecked = !!empSkill;
                  const isSaving = saving === skill.id;
                  const isEditingThisLevel = editingLevel === skill.id;

                  return (
                    <div
                      key={skill.id}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/80 border transition-all",
                        isChecked ? "border-ava-yellow shadow-sm" : "border-transparent hover:border-gray-200"
                      )}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isSaving || readOnly}
                        onChange={() => toggleSkill(skill)}
                        className="w-4 h-4 rounded accent-amber-400 cursor-pointer shrink-0"
                      />

                      {/* Nombre */}
                      <span className={cn("text-sm flex-1", isChecked ? "text-ava-charcoal font-medium" : "text-ava-charcoal-light")}>
                        {skill.name}
                      </span>

                      {/* Nivel (solo si está asignada) */}
                      {isChecked && empSkill && (
                        <div className="flex items-center gap-2">
                          {isEditingThisLevel ? (
                            <select
                              autoFocus
                              value={empSkill.level}
                              onChange={(e) => updateLevel(skill.id, empSkill.id, e.target.value)}
                              onBlur={() => setEditingLevel(null)}
                              className="text-xs border border-ava-gray-medium rounded px-2 py-1 bg-white"
                            >
                              {Object.entries(LEVELS).map(([key, val]) => (
                                <option key={key} value={key}>{val.label}</option>
                              ))}
                            </select>
                          ) : (
                            <button
                              onClick={() => !readOnly && setEditingLevel(skill.id)}
                              className="hover:opacity-80 transition-opacity"
                              title="Cambiar nivel"
                              disabled={readOnly}
                            >
                              <StarRating level={empSkill.level} />
                            </button>
                          )}
                        </div>
                      )}

                      {isSaving && (
                        <span className="text-xs text-ava-charcoal-light animate-pulse">guardando...</span>
                      )}
                    </div>
                  );
                })}

                {/* Añadir habilidad personalizada */}
                {!readOnly && (
                  <div className="pt-1">
                    {customSkillCategory === catKey ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={customSkillName}
                          onChange={(e) => setCustomSkillName(e.target.value)}
                          placeholder="Nombre de la habilidad..."
                          className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-ava-gray-medium focus:outline-none focus:ring-2 focus:ring-ava-yellow bg-white"
                          onKeyDown={(e) => { if (e.key === "Enter") addCustomSkill(); if (e.key === "Escape") setCustomSkillCategory(null); }}
                          autoFocus
                        />
                        <button
                          onClick={addCustomSkill}
                          disabled={addingCustom || !customSkillName.trim()}
                          className="px-3 py-1.5 bg-ava-yellow text-ava-charcoal text-sm font-medium rounded-lg hover:bg-ava-yellow-dark transition-colors disabled:opacity-50"
                        >
                          {addingCustom ? "..." : "Añadir"}
                        </button>
                        <button
                          onClick={() => { setCustomSkillCategory(null); setCustomSkillName(""); }}
                          className="px-3 py-1.5 border border-ava-gray-medium text-sm rounded-lg hover:bg-ava-gray transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setCustomSkillCategory(catKey)}
                        className="flex items-center gap-1.5 text-xs text-ava-charcoal-light hover:text-ava-charcoal transition-colors py-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Añadir habilidad personalizada
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
