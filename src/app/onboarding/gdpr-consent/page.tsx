"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Shield, CheckCircle } from "lucide-react";
import Link from "next/link";

/**
 * Página de consentimiento RGPD para nuevos usuarios.
 * Solo se muestra si el usuario no ha dado su consentimiento todavía.
 */
export default function GDPRConsentPage() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConsent = async () => {
    if (!accepted) {
      setError("Debes aceptar la política de privacidad para continuar.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Registrar consentimiento en profiles
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          gdpr_consent: true,
          gdpr_consent_date: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Registrar en consent_records para auditoría
      await supabase.from("consent_records").insert({
        user_id: user.id,
        consent_type: "privacy_policy_v1",
        consented: true,
        user_agent:
          typeof window !== "undefined" ? navigator.userAgent : null,
      });

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Error al registrar el consentimiento. Por favor, inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-ava-gray flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-ava-gray-medium shadow-lg p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-ava-yellow rounded-full flex items-center justify-center mb-3">
            <span className="text-ava-charcoal font-bold text-sm">AVA</span>
          </div>
          <h1 className="text-xl font-bold text-ava-charcoal">
            Bienvenido/a al Portal RRHH
          </h1>
          <p className="text-ava-charcoal-light text-sm mt-1 text-center">
            Antes de continuar, necesitamos tu consentimiento
          </p>
        </div>

        {/* Ícono RGPD */}
        <div className="flex items-center gap-3 p-4 bg-ava-yellow-light rounded-lg mb-6">
          <Shield className="w-8 h-8 text-amber-700 shrink-0" />
          <div>
            <p className="font-semibold text-ava-charcoal text-sm">
              Protección de Datos (RGPD)
            </p>
            <p className="text-xs text-ava-charcoal-medium mt-0.5">
              Este portal trata datos personales con arreglo al RGPD (UE 2016/679)
              y la LOPDGDD.
            </p>
          </div>
        </div>

        {/* Resumen del tratamiento */}
        <div className="space-y-3 mb-6 text-sm text-ava-charcoal-medium">
          <p className="font-semibold text-ava-charcoal">¿Qué datos tratamos?</p>
          <ul className="space-y-1.5">
            {[
              "Datos de identificación y contacto (nombre, email, teléfono)",
              "Datos laborales (cargo, departamento, contrato, nóminas)",
              "Datos bancarios para el abono de salarios (IBAN)",
              "Registros de acceso al sistema (IP anonimizada, fecha/hora)",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-ava-charcoal-light">
            Finalidad: gestión de la relación laboral. Base jurídica: ejecución
            del contrato y obligación legal. Tus derechos: acceso, rectificación,
            supresión y portabilidad.{" "}
            <Link href="/privacy" target="_blank" className="underline hover:text-ava-charcoal">
              Ver política completa
            </Link>
          </p>
        </div>

        {/* Checkbox de consentimiento */}
        <label className="flex items-start gap-3 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 rounded border-ava-gray-medium w-4 h-4"
          />
          <span className="text-sm text-ava-charcoal">
            He leído y acepto la{" "}
            <Link
              href="/privacy"
              target="_blank"
              className="underline hover:text-ava-charcoal-medium"
            >
              Política de Privacidad
            </Link>{" "}
            y el tratamiento de mis datos personales para la gestión de la
            relación laboral con AVA Selección.
          </span>
        </label>

        {error && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}

        {/* Botones */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleConsent}
            disabled={loading || !accepted}
            className="w-full bg-ava-yellow hover:bg-ava-yellow-dark text-ava-charcoal
                       font-semibold py-2.5 rounded-lg transition-colors
                       disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Registrando..." : "Aceptar y continuar"}
          </button>
          <button
            onClick={handleReject}
            className="w-full text-ava-charcoal-light hover:text-ava-charcoal
                       text-sm underline transition-colors"
          >
            Rechazar y cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
}
