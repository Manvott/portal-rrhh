import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Acceder",
  description: "Accede al Portal de Recursos Humanos de AVA Selección",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-ava-gray">
      {/* Header mínimo */}
      <header className="bg-ava-charcoal py-4 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Logo AVA */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-ava-yellow rounded-full flex items-center justify-center">
              <span className="text-ava-charcoal font-bold text-xs">AVA</span>
            </div>
            <span className="text-white font-semibold text-lg tracking-wide">
              AVA Selección
            </span>
          </div>
        </div>
        <span className="text-white/60 text-sm">Portal RRHH</span>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Card de login */}
          <div className="bg-white rounded-2xl shadow-lg border border-ava-gray-medium p-8">
            {/* Logo grande */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-ava-yellow rounded-full flex items-center justify-center mb-4">
                <span className="text-ava-charcoal font-bold text-xl">AVA</span>
              </div>
              <h1 className="text-2xl font-bold text-ava-charcoal">
                Bienvenido/a
              </h1>
              <p className="text-ava-charcoal-light text-sm mt-1">
                Portal Interno de Recursos Humanos
              </p>
            </div>

            <Suspense fallback={<div className="h-48 flex items-center justify-center text-ava-charcoal-light text-sm">Cargando...</div>}>
              <LoginForm />
            </Suspense>

            {/* Enlace a privacidad */}
            <p className="text-center text-xs text-ava-charcoal-light mt-6">
              Al acceder, aceptas nuestra{" "}
              <Link
                href="/privacy"
                className="text-ava-charcoal underline hover:text-ava-yellow transition-colors"
                target="_blank"
              >
                Política de Privacidad
              </Link>
              .
            </p>
          </div>

          {/* Aviso RGPD */}
          <p className="text-center text-xs text-ava-charcoal-light mt-4">
            Este portal contiene datos personales protegidos por el RGPD y la
            LOPDGDD. Acceso restringido a personal autorizado.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-ava-charcoal-light">
        © {new Date().getFullYear()} AVA Selección · Consultor de Producto
        Gastronómico ·{" "}
        <Link
          href="/privacy"
          className="underline hover:text-ava-charcoal transition-colors"
        >
          Privacidad
        </Link>
      </footer>
    </div>
  );
}
