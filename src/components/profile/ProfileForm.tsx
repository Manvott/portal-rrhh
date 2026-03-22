"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/use-toast";
import {
  Save, KeyRound, AlertCircle, CheckCircle,
  GraduationCap, Star, CalendarDays, Phone,
} from "lucide-react";
import { formatDate, ROLE_LABELS } from "@/lib/utils";
import type { Profile, Employee } from "@/types";

const CATEGORY_LABELS: Record<string, string> = {
  general: "General", warehouse: "Almacén", admin: "Administración",
  sales: "Ventas", gastronomy: "Gastronomía", logistics: "Logística", custom: "Personalizada",
};
const TRAINING_CATEGORY_LABELS: Record<string, string> = {
  technical: "Técnica", soft_skills: "Soft Skills", compliance: "Compliance",
  leadership: "Liderazgo", gastronomy: "Gastronomía", languages: "Idiomas", other: "Otro",
};
const TRAINING_STATUS_COLORS: Record<string, string> = {
  planned: "bg-blue-100 text-blue-700", in_progress: "bg-yellow-100 text-yellow-700",
  completed: "bg-green-100 text-green-700", cancelled: "bg-gray-100 text-gray-500",
};
const TRAINING_STATUS_LABELS: Record<string, string> = {
  planned: "Planificada", in_progress: "En curso", completed: "Completada", cancelled: "Cancelada",
};

interface SkillEntry {
  skill: { name: string; category: string } | null;
}
interface TrainingEntry {
  id: string; title: string; provider: string | null; category: string;
  start_date: string; end_date: string | null; hours: number | null; status: string;
}

interface Props {
  profile: Profile;
  employee: Employee | null;
  employeeSkills?: SkillEntry[];
  employeeTrainings?: TrainingEntry[];
  vacationDaysUsed?: number;
}

export function ProfileForm({
  profile, employee,
  employeeSkills = [], employeeTrainings = [], vacationDaysUsed = 0,
}: Props) {
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(employee?.phone ?? "");
  const [emergencyName, setEmergencyName] = useState(employee?.emergency_contact_name ?? "");
  const [emergencyPhone, setEmergencyPhone] = useState(employee?.emergency_contact_phone ?? "");
  const [saving, setSaving] = useState(false);

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const VACATION_DAYS_PER_YEAR = 22;
  const vacationDaysLeft = Math.max(0, VACATION_DAYS_PER_YEAR - vacationDaysUsed);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() })
        .eq("id", profile.id);
      if (error) throw error;

      // Actualizar datos de contacto del empleado si existe
      if (employee) {
        await supabase.from("employees").update({
          phone: phone.trim() || null,
          emergency_contact_name: emergencyName.trim() || null,
          emergency_contact_phone: emergencyPhone.trim() || null,
        }).eq("id", employee.id);
      }

      toast({ title: "Perfil actualizado" });
    } catch {
      toast({ title: "Error", description: "No se pudo actualizar.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 10) {
      setPasswordError("La nueva contraseña debe tener al menos 10 caracteres.");
      return;
    }
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(newPassword)) {
      setPasswordError("La contraseña debe contener letras y números.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden.");
      return;
    }

    setChangingPassword(true);
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email, password: currentPassword,
      });
      if (signInError) { setPasswordError("La contraseña actual no es correcta."); return; }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) throw updateError;

      toast({ title: "Contraseña actualizada", description: "Tu contraseña ha sido cambiada correctamente." });
      setShowPasswordForm(false);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch {
      setPasswordError("Error al cambiar la contraseña.");
    } finally {
      setChangingPassword(false);
    }
  };

  // Agrupar habilidades por categoría
  const skillsByCategory: Record<string, string[]> = {};
  employeeSkills.forEach(({ skill }) => {
    if (!skill) return;
    if (!skillsByCategory[skill.category]) skillsByCategory[skill.category] = [];
    skillsByCategory[skill.category].push(skill.name);
  });

  return (
    <div className="space-y-6">
      {/* Información de cuenta */}
      <div className="bg-white rounded-lg border border-ava-gray-medium p-6 space-y-4">
        <h2 className="font-semibold text-ava-charcoal">Información de Cuenta</h2>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-ava-charcoal">Correo electrónico</label>
          <input type="email" value={profile.email} disabled
            className="w-full px-3 py-2 rounded-lg border border-ava-gray-medium bg-ava-gray text-ava-charcoal-light text-sm cursor-not-allowed" />
          <p className="text-xs text-ava-charcoal-light">El email no puede cambiarse. Contacta con el administrador.</p>
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-ava-charcoal">Nombre completo</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
            maxLength={100}
            className="w-full px-3 py-2 rounded-lg border border-ava-gray-medium focus:outline-none focus:ring-2 focus:ring-ava-yellow text-sm" />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-ava-charcoal">Rol</label>
          <div className="flex items-center gap-2">
            <span className="px-3 py-2 bg-ava-gray rounded-lg text-sm text-ava-charcoal">
              {ROLE_LABELS[profile.role]}
            </span>
            <p className="text-xs text-ava-charcoal-light">El rol es asignado por el administrador.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-ava-charcoal-light">
          <div>
            <p className="text-xs font-medium text-ava-charcoal mb-0.5">Miembro desde</p>
            <p>{formatDate(profile.created_at)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ava-charcoal mb-0.5">Última actualización</p>
            <p>{formatDate(profile.updated_at)}</p>
          </div>
        </div>
      </div>

      {/* Datos de contacto editables */}
      {employee && (
        <div className="bg-white rounded-lg border border-ava-gray-medium p-6 space-y-4">
          <h2 className="font-semibold text-ava-charcoal flex items-center gap-2">
            <Phone className="w-4 h-4" /> Datos de Contacto
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-ava-charcoal">Teléfono</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                maxLength={20} placeholder="+34 600 000 000"
                className="w-full px-3 py-2 rounded-lg border border-ava-gray-medium focus:outline-none focus:ring-2 focus:ring-ava-yellow text-sm" />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-ava-charcoal">Nombre contacto emergencia</label>
              <input type="text" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)}
                maxLength={100} placeholder="Nombre y apellidos"
                className="w-full px-3 py-2 rounded-lg border border-ava-gray-medium focus:outline-none focus:ring-2 focus:ring-ava-yellow text-sm" />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-ava-charcoal">Teléfono emergencia</label>
              <input type="tel" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)}
                maxLength={20} placeholder="+34 600 000 000"
                className="w-full px-3 py-2 rounded-lg border border-ava-gray-medium focus:outline-none focus:ring-2 focus:ring-ava-yellow text-sm" />
            </div>
          </div>
        </div>
      )}

      {/* Botón guardar */}
      <button onClick={handleSaveProfile} disabled={saving}
        className="flex items-center gap-2 bg-ava-yellow hover:bg-ava-yellow-dark text-ava-charcoal
                   font-semibold px-4 py-2 rounded-lg transition-colors text-sm disabled:opacity-60">
        <Save className="w-4 h-4" />
        {saving ? "Guardando..." : "Guardar cambios"}
      </button>

      {/* Seguridad */}
      <div className="bg-white rounded-lg border border-ava-gray-medium p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ava-charcoal flex items-center gap-2">
            <KeyRound className="w-4 h-4" /> Seguridad
          </h2>
          <button onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="text-sm text-ava-charcoal-light hover:text-ava-charcoal underline transition-colors">
            {showPasswordForm ? "Cancelar" : "Cambiar contraseña"}
          </button>
        </div>

        {!showPasswordForm && (
          <p className="text-sm text-ava-charcoal-light">
            Por seguridad, utiliza una contraseña de al menos 10 caracteres con letras y números.
          </p>
        )}

        {showPasswordForm && (
          <form onSubmit={handleChangePassword} className="space-y-3">
            {passwordError && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}
            {[
              { label: "Contraseña actual", value: currentPassword, setter: setCurrentPassword },
              { label: "Nueva contraseña", value: newPassword, setter: setNewPassword },
              { label: "Confirmar nueva contraseña", value: confirmPassword, setter: setConfirmPassword },
            ].map((f) => (
              <div key={f.label} className="space-y-1">
                <label className="block text-sm font-medium text-ava-charcoal">{f.label}</label>
                <input type="password" value={f.value} onChange={(e) => f.setter(e.target.value)}
                  required maxLength={128}
                  className="w-full px-3 py-2 rounded-lg border border-ava-gray-medium focus:outline-none focus:ring-2 focus:ring-ava-yellow text-sm" />
              </div>
            ))}
            <button type="submit" disabled={changingPassword}
              className="flex items-center gap-2 bg-ava-yellow hover:bg-ava-yellow-dark text-ava-charcoal
                         font-semibold px-4 py-2 rounded-lg transition-colors text-sm disabled:opacity-60">
              {changingPassword ? "Cambiando..." : "Cambiar contraseña"}
            </button>
          </form>
        )}
      </div>

      {/* Ficha laboral */}
      {employee && (
        <div className="bg-white rounded-lg border border-ava-gray-medium p-6 space-y-4">
          <h2 className="font-semibold text-ava-charcoal">Mi Ficha Laboral</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              { label: "Cargo", value: employee.position },
              { label: "Departamento", value: employee.department },
              { label: "Tipo de contrato", value: employee.contract_type },
              { label: "Fecha de alta", value: formatDate(employee.hire_date) },
              { label: "Fin de contrato", value: employee.contract_end_date ? formatDate(employee.contract_end_date) : null },
              { label: "Localización", value: employee.location },
            ].map((f) => (
              <div key={f.label}>
                <p className="text-xs text-ava-charcoal-light">{f.label}</p>
                <p className="text-ava-charcoal mt-0.5">{f.value ?? "—"}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-ava-charcoal-light">Para modificar estos datos, contacta con RRHH.</p>
        </div>
      )}

      {/* Vacaciones del año */}
      {employee && (
        <div className="bg-white rounded-lg border border-ava-gray-medium p-6">
          <h2 className="font-semibold text-ava-charcoal mb-4 flex items-center gap-2">
            <CalendarDays className="w-4 h-4" /> Mis Vacaciones {new Date().getFullYear()}
          </h2>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-ava-charcoal">{vacationDaysLeft}</p>
              <p className="text-xs text-ava-charcoal-light mt-0.5">días restantes</p>
            </div>
            <div className="flex-1">
              <div className="flex justify-between text-xs text-ava-charcoal-light mb-1">
                <span>{vacationDaysUsed} días usados</span>
                <span>{VACATION_DAYS_PER_YEAR} días totales</span>
              </div>
              <div className="w-full bg-ava-gray rounded-full h-3">
                <div
                  className="bg-ava-yellow rounded-full h-3 transition-all"
                  style={{ width: `${Math.min(100, Math.round((vacationDaysUsed / VACATION_DAYS_PER_YEAR) * 100))}%` }}
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-ava-charcoal-light mt-3">
            Basado en {VACATION_DAYS_PER_YEAR} días laborables anuales. Solo vacaciones aprobadas.
          </p>
        </div>
      )}

      {/* Mis habilidades */}
      {employee && Object.keys(skillsByCategory).length > 0 && (
        <div className="bg-white rounded-lg border border-ava-gray-medium p-6">
          <h2 className="font-semibold text-ava-charcoal mb-4 flex items-center gap-2">
            <Star className="w-4 h-4" /> Mis Habilidades
          </h2>
          <div className="space-y-3">
            {Object.entries(skillsByCategory).map(([cat, skills]) => (
              <div key={cat}>
                <p className="text-xs font-semibold text-ava-charcoal-light uppercase tracking-wider mb-1.5">
                  {CATEGORY_LABELS[cat] ?? cat}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((s) => (
                    <span key={s} className="px-2.5 py-1 bg-ava-yellow-light text-amber-800 text-xs rounded-full font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-ava-charcoal-light mt-3">Habilidades asignadas por RRHH.</p>
        </div>
      )}

      {/* Mis formaciones */}
      {employee && employeeTrainings.length > 0 && (
        <div className="bg-white rounded-lg border border-ava-gray-medium p-6">
          <h2 className="font-semibold text-ava-charcoal mb-4 flex items-center gap-2">
            <GraduationCap className="w-4 h-4" /> Mis Formaciones
            <span className="ml-auto text-xs text-ava-charcoal-light font-normal">
              {employeeTrainings.filter(t => t.status === "completed").reduce((s, t) => s + (t.hours ?? 0), 0)}h completadas
            </span>
          </h2>
          <div className="space-y-2">
            {employeeTrainings.map((t) => (
              <div key={t.id} className="flex items-start justify-between gap-3 py-2 border-b border-ava-gray last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ava-charcoal">{t.title}</p>
                  <p className="text-xs text-ava-charcoal-light mt-0.5">
                    {t.provider && <span>{t.provider} · </span>}
                    {TRAINING_CATEGORY_LABELS[t.category] ?? t.category}
                    {t.hours && <span> · {t.hours}h</span>}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${TRAINING_STATUS_COLORS[t.status] ?? "bg-gray-100 text-gray-600"}`}>
                  {TRAINING_STATUS_LABELS[t.status] ?? t.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* RGPD */}
      <div className="bg-ava-gray rounded-lg border border-ava-gray-medium p-4">
        <div className="flex items-start gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div className="text-sm text-ava-charcoal-medium space-y-1">
            <p className="font-medium text-ava-charcoal">Tus derechos RGPD</p>
            <p>Tienes derecho de acceso, rectificación, supresión, portabilidad y oposición al tratamiento de tus datos personales.</p>
            <p>Para ejercer estos derechos, contacta con{" "}
              <a href="mailto:privacidad@avaseleccion.es" className="underline hover:text-ava-charcoal">
                privacidad@avaseleccion.es
              </a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
