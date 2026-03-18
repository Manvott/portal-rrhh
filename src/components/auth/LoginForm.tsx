"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mensaje de error por callback fallido
  const callbackError = searchParams.get("error");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validaciones básicas del lado cliente
    if (!email || !password) {
      setError("Por favor, introduce tu email y contraseña.");
      setLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("El formato del email no es válido.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        // Mensajes de error genéricos (sin revelar si el usuario existe)
        if (
          authError.message.includes("Invalid login credentials") ||
          authError.message.includes("invalid_credentials")
        ) {
          setError(
            "Credenciales incorrectas. Verifica tu email y contraseña."
          );
        } else if (authError.message.includes("Email not confirmed")) {
          setError(
            "Tu cuenta no ha sido confirmada. Revisa tu correo electrónico."
          );
        } else if (authError.message.includes("Too many requests")) {
          setError(
            "Demasiados intentos de acceso. Por favor, espera unos minutos."
          );
        } else {
          setError("Error al iniciar sesión. Inténtalo de nuevo.");
        }
        return;
      }

      // Login exitoso → redirigir
      const redirectTo = searchParams.get("redirectTo") || "/dashboard";
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Error de conexión. Comprueba tu conexión a Internet.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {/* Error de callback */}
      {callbackError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Error en la autenticación. Por favor, inténtalo de nuevo.</span>
        </div>
      )}

      {/* Error de login */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Email */}
      <div className="space-y-1.5">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-ava-charcoal"
        >
          Correo electrónico
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@avaseleccion.es"
          className="w-full px-3 py-2.5 rounded-lg border border-ava-gray-medium
                     focus:outline-none focus:ring-2 focus:ring-ava-yellow focus:border-transparent
                     bg-white text-ava-charcoal placeholder:text-ava-charcoal-light
                     disabled:opacity-50 transition-all"
          disabled={loading}
          maxLength={254}
        />
      </div>

      {/* Contraseña */}
      <div className="space-y-1.5">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-ava-charcoal"
        >
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3 py-2.5 pr-10 rounded-lg border border-ava-gray-medium
                       focus:outline-none focus:ring-2 focus:ring-ava-yellow focus:border-transparent
                       bg-white text-ava-charcoal placeholder:text-ava-charcoal-light
                       disabled:opacity-50 transition-all"
            disabled={loading}
            maxLength={128}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ava-charcoal-light
                       hover:text-ava-charcoal transition-colors"
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Botón de acceso */}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2
                   bg-ava-yellow hover:bg-ava-yellow-dark text-ava-charcoal
                   font-semibold py-2.5 rounded-lg transition-colors duration-200
                   focus-visible:ring-2 focus-visible:ring-ava-yellow focus-visible:ring-offset-2
                   disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-ava-charcoal/30 border-t-ava-charcoal rounded-full animate-spin" />
            Accediendo...
          </>
        ) : (
          <>
            <LogIn className="w-4 h-4" />
            Acceder
          </>
        )}
      </button>

      {/* Nota de seguridad */}
      <p className="text-xs text-center text-ava-charcoal-light">
        Acceso restringido a personal de AVA Selección.
        <br />
        Si tienes problemas para acceder, contacta con{" "}
        <a
          href={`mailto:${process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "soporte@avaseleccion.es"}`}
          className="underline hover:text-ava-charcoal"
        >
          soporte
        </a>
        .
      </p>
    </form>
  );
}
