"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Save, KeyRound, AlertCircle, CheckCircle } from "lucide-react";
import { formatDate, ROLE_LABELS } from "@/lib/utils";
import type { Profile, Employee } from "@/types";

interface Props {
  profile: Profile;
  employee: Employee | null;
}

export function ProfileForm({ profile, employee }: Props) {
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [saving, setSaving] = useState(false);

  // Cambio de contraseña
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() })
        .eq("id", profile.id);

      if (error) throw error;

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

    if (newPassword.length < 8) {
      setPasswordError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      setPasswordError(
        "La contraseña debe contener al menos una mayúscula, una minúscula y un número."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden.");
      return;
    }

    setChangingPassword(true);
    try {
      const supabase = createClient();

      // Verificar contraseña actual
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password: currentPassword,
      });

      if (signInError) {
        setPasswordError("La contraseña actual no es correcta.");
        return;
      }

      // Actualizar contraseña
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      toast({
        title: "Contraseña actualizada",
        description: "Tu contraseña ha sido cambiada correctamente.",
      });
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordError("Error al cambiar la contraseña.");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Información básica */}
      <div className="bg-white rounded-lg border border-ava-gray-medium p-6 space-y-4">
        <h2 className="font-semibold text-ava-charcoal">Información de Cuenta</h2>

        {/* Email (no editable) */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-ava-charcoal">
            Correo electrónico
          </label>
          <input
            type="email"
            value={profile.email}
            disabled
            className="w-full px-3 py-2 rounded-lg border border-ava-gray-medium
                       bg-ava-gray text-ava-charcoal-light text-sm cursor-not-allowed"
          />
          <p className="text-xs text-ava-charcoal-light">
            El email no puede cambiarse. Contacta con el administrador si necesitas actualizarlo.
          </p>
        </div>

        {/* Nombre completo */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-ava-charcoal">
            Nombre completo
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            maxLength={100}
            className="w-full px-3 py-2 rounded-lg border border-ava-gray-medium
                       focus:outline-none focus:ring-2 focus:ring-ava-yellow text-sm"
          />
        </div>

        {/* Rol */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-ava-charcoal">Rol</label>
          <div className="flex items-center gap-2">
            <span className="px-3 py-2 bg-ava-gray rounded-lg text-sm text-ava-charcoal">
              {ROLE_LABELS[profile.role]}
            </span>
            <p className="text-xs text-ava-charcoal-light">
              El rol es asignado por el administrador.
            </p>
          </div>
        </div>

        {/* Fechas */}
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

        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="flex items-center gap-2 bg-ava-yellow hover:bg-ava-yellow-dark
                     text-ava-charcoal font-semibold px-4 py-2 rounded-lg
                     transition-colors text-sm disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      {/* Seguridad / Contraseña */}
      <div className="bg-white rounded-lg border border-ava-gray-medium p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ava-charcoal flex items-center gap-2">
            <KeyRound className="w-4 h-4" />
            Seguridad
          </h2>
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="text-sm text-ava-charcoal-light hover:text-ava-charcoal underline transition-colors"
          >
            {showPasswordForm ? "Cancelar" : "Cambiar contraseña"}
          </button>
        </div>

        {!showPasswordForm && (
          <p className="text-sm text-ava-charcoal-light">
            Por seguridad, utiliza una contraseña de al menos 8 caracteres con
            mayúsculas, minúsculas y números.
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
                <input
                  type="password"
                  value={f.value}
                  onChange={(e) => f.setter(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-ava-gray-medium
                             focus:outline-none focus:ring-2 focus:ring-ava-yellow text-sm"
                />
              </div>
            ))}

            <button
              type="submit"
              disabled={changingPassword}
              className="flex items-center gap-2 bg-ava-yellow hover:bg-ava-yellow-dark
                         text-ava-charcoal font-semibold px-4 py-2 rounded-lg
                         transition-colors text-sm disabled:opacity-60"
            >
              {changingPassword ? "Cambiando..." : "Cambiar contraseña"}
            </button>
          </form>
        )}
      </div>

      {/* Ficha de empleado (si existe) */}
      {employee && (
        <div className="bg-white rounded-lg border border-ava-gray-medium p-6 space-y-4">
          <h2 className="font-semibold text-ava-charcoal">Mi Ficha de Empleado</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {[
              { label: "Cargo", value: employee.position },
              { label: "Departamento", value: employee.department },
              { label: "Tipo de contrato", value: employee.contract_type },
              { label: "Fecha de alta", value: formatDate(employee.hire_date) },
              { label: "Localización", value: employee.location },
              { label: "Teléfono", value: employee.phone },
            ].map((f) => (
              <div key={f.label}>
                <p className="text-xs text-ava-charcoal-light">{f.label}</p>
                <p className="text-ava-charcoal mt-0.5">{f.value ?? "—"}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-ava-charcoal-light">
            Para modificar estos datos, contacta con el departamento de RRHH.
          </p>
        </div>
      )}

      {/* Información RGPD */}
      <div className="bg-ava-gray rounded-lg border border-ava-gray-medium p-4">
        <div className="flex items-start gap-2">
          <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div className="text-sm text-ava-charcoal-medium space-y-1">
            <p className="font-medium text-ava-charcoal">Tus derechos RGPD</p>
            <p>
              Tienes derecho de acceso, rectificación, supresión, portabilidad y
              oposición al tratamiento de tus datos personales.
            </p>
            <p>
              Para ejercer estos derechos, contacta con{" "}
              <a
                href="mailto:privacidad@avaseleccion.es"
                className="underline hover:text-ava-charcoal"
              >
                privacidad@avaseleccion.es
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
