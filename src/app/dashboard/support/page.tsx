import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Shield, Activity, Database, Server, AlertCircle } from "lucide-react";
import { formatDate, anonymizeEmail } from "@/lib/utils";

/**
 * Panel de soporte técnico.
 * - Rol 'support': ve logs ANONIMIZADOS (sin datos personales)
 * - Rol 'admin': ve logs completos
 */
export default async function SupportPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "support"].includes(profile.role)) {
    redirect("/dashboard");
  }

  // Obtener logs de auditoría
  const { data: logs } = await supabase
    .from("audit_logs")
    .select("id, action, resource_type, ip_address, created_at, metadata")
    .order("created_at", { ascending: false })
    .limit(50);

  // Estadísticas del sistema
  const { count: totalProfiles } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true });

  const { count: totalDocuments } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true });

  const { count: totalEmployees } = await supabase
    .from("employees")
    .select("id", { count: "exact", head: true });

  const isAdmin = profile.role === "admin";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-ava-charcoal flex items-center gap-2">
          <Shield className="w-6 h-6" />
          Panel de Soporte Técnico
        </h1>
        <p className="text-ava-charcoal-light text-sm mt-1">
          Monitorización del sistema · Acceso restringido
        </p>
      </div>

      {/* Aviso RGPD para soporte */}
      {!isAdmin && (
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <strong>Datos anonimizados:</strong> Los logs mostrados cumplen con
            el RGPD Art. 5.1.f. No contienen datos personales identificables.
            Los IDs de usuario y correos están anonimizados.
          </div>
        </div>
      )}

      {/* Estadísticas del sistema */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-ava-gray-medium p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ava-charcoal">{totalProfiles ?? 0}</p>
              <p className="text-xs text-ava-charcoal-light">Usuarios registrados</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-ava-gray-medium p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Server className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ava-charcoal">{totalEmployees ?? 0}</p>
              <p className="text-xs text-ava-charcoal-light">Empleados en BD</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-ava-gray-medium p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Activity className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ava-charcoal">{totalDocuments ?? 0}</p>
              <p className="text-xs text-ava-charcoal-light">Documentos almacenados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Log de auditoría */}
      <div className="bg-white rounded-lg border border-ava-gray-medium overflow-hidden">
        <div className="px-6 py-4 border-b border-ava-gray-medium flex items-center justify-between">
          <h2 className="font-semibold text-ava-charcoal flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Log de Actividad del Sistema
            {!isAdmin && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full ml-2">
                Anonimizado
              </span>
            )}
          </h2>
          <span className="text-xs text-ava-charcoal-light">
            Últimas {logs?.length ?? 0} entradas
          </span>
        </div>

        {!logs || logs.length === 0 ? (
          <div className="p-8 text-center text-ava-charcoal-light text-sm">
            No hay entradas de log disponibles.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ava-gray border-b border-ava-gray-medium">
                  <th className="text-left text-xs font-semibold text-ava-charcoal-light uppercase tracking-wider px-4 py-3">
                    Fecha/Hora
                  </th>
                  <th className="text-left text-xs font-semibold text-ava-charcoal-light uppercase tracking-wider px-4 py-3">
                    Acción
                  </th>
                  <th className="text-left text-xs font-semibold text-ava-charcoal-light uppercase tracking-wider px-4 py-3">
                    Recurso
                  </th>
                  <th className="text-left text-xs font-semibold text-ava-charcoal-light uppercase tracking-wider px-4 py-3">
                    IP
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ava-gray-medium">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-ava-gray/30 transition-colors">
                    <td className="px-4 py-2.5 text-ava-charcoal-light font-mono text-xs">
                      {formatDate(log.created_at, "dd/MM/yy HH:mm:ss")}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="capitalize text-ava-charcoal">{log.action}</span>
                    </td>
                    <td className="px-4 py-2.5 text-ava-charcoal-light capitalize">
                      {log.resource_type}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-ava-charcoal-light">
                      {/* Para soporte: anonimizar la IP */}
                      {log.ip_address
                        ? isAdmin
                          ? log.ip_address
                          : log.ip_address.split(".").slice(0, 2).join(".") + ".x.x"
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Información técnica del sistema */}
      <div className="bg-ava-charcoal rounded-lg p-6 text-white">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Server className="w-4 h-4 text-ava-yellow" />
          Información del Sistema
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-white/50 text-xs">Stack</p>
            <p className="text-white mt-0.5">Next.js 15</p>
          </div>
          <div>
            <p className="text-white/50 text-xs">Base de datos</p>
            <p className="text-white mt-0.5">Supabase (PostgreSQL)</p>
          </div>
          <div>
            <p className="text-white/50 text-xs">Auth</p>
            <p className="text-white mt-0.5">Supabase Auth</p>
          </div>
          <div>
            <p className="text-white/50 text-xs">Storage</p>
            <p className="text-white mt-0.5">Supabase Storage</p>
          </div>
          <div>
            <p className="text-white/50 text-xs">Cumplimiento</p>
            <p className="text-white mt-0.5">RGPD + LOPDGDD</p>
          </div>
          <div>
            <p className="text-white/50 text-xs">Despliegue</p>
            <p className="text-white mt-0.5">Vercel</p>
          </div>
          <div>
            <p className="text-white/50 text-xs">Cifrado</p>
            <p className="text-white mt-0.5">TLS 1.3 / AES-256</p>
          </div>
          <div>
            <p className="text-white/50 text-xs">Versión</p>
            <p className="text-white mt-0.5">1.0.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
