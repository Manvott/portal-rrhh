import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Política de Privacidad",
  description: "Política de Privacidad y Protección de Datos de AVA Selección",
};

export default function PrivacyPage() {
  const lastUpdated = "18 de marzo de 2026";

  return (
    <div className="min-h-screen bg-ava-gray">
      {/* Header */}
      <header className="bg-ava-charcoal py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-ava-yellow rounded-full flex items-center justify-center">
              <span className="text-ava-charcoal font-bold text-xs">AVA</span>
            </div>
            <span className="text-white font-semibold">AVA Selección · Portal RRHH</span>
          </div>
          <Link
            href="/login"
            className="flex items-center gap-1 text-white/70 hover:text-white text-sm transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl border border-ava-gray-medium shadow-sm p-8 md:p-12">
          {/* Título */}
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-ava-yellow-light rounded-lg">
              <Shield className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-ava-charcoal">
                Política de Privacidad y Protección de Datos
              </h1>
              <p className="text-ava-charcoal-light text-sm mt-1">
                Última actualización: {lastUpdated}
              </p>
            </div>
          </div>

          <div className="prose prose-sm max-w-none text-ava-charcoal space-y-8">

            {/* 1. Responsable */}
            <Section title="1. Responsable del Tratamiento">
              <p>
                En cumplimiento del <strong>Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo
                (RGPD)</strong> y la <strong>Ley Orgánica 3/2018, de 5 de diciembre, de Protección de
                Datos Personales y garantía de los derechos digitales (LOPDGDD)</strong>, le informamos
                que el responsable del tratamiento de sus datos personales es:
              </p>
              <ul className="mt-3 space-y-1 text-sm">
                <li><strong>Denominación:</strong> AVA Selección (Consultor de Producto Gastronómico)</li>
                <li><strong>Razón social:</strong> [NOMBRE LEGAL COMPLETO]</li>
                <li><strong>CIF:</strong> [CIF DE LA EMPRESA]</li>
                <li><strong>Dirección:</strong> [DIRECCIÓN FISCAL]</li>
                <li><strong>Email de contacto:</strong> info@avaseleccion.es</li>
                <li>
                  <strong>Responsable de Protección de Datos (DPO):</strong>{" "}
                  <a href="mailto:privacidad@avaseleccion.es" className="text-amber-700 underline">
                    privacidad@avaseleccion.es
                  </a>
                </li>
              </ul>
            </Section>

            {/* 2. Finalidades */}
            <Section title="2. Finalidad del Tratamiento">
              <p>Los datos personales recabados a través de este Portal Interno de Recursos Humanos
              se tratan con las siguientes finalidades:</p>
              <ul className="mt-3 space-y-2 text-sm list-disc list-inside">
                <li><strong>Gestión laboral:</strong> administración de la relación laboral, nóminas,
                    contratos, vacaciones y ausencias.</li>
                <li><strong>Control de acceso:</strong> autenticación y control de acceso al portal
                    interno, con registro de actividad para seguridad.</li>
                <li><strong>Documentación:</strong> almacenamiento y gestión de documentos
                    relacionados con la relación laboral.</li>
                <li><strong>Selección de personal:</strong> gestión de procesos de selección y
                    candidaturas para posiciones en AVA Selección.</li>
                <li><strong>Cumplimiento legal:</strong> cumplimiento de obligaciones fiscales,
                    laborales y de Seguridad Social.</li>
                <li><strong>Calendario de equipo:</strong> las fechas de ausencias por vacaciones
                    aprobadas son visibles para todos los empleados con fines de coordinación interna
                    y planificación de recursos. Los eventos empresariales, ferias y festivos son
                    igualmente visibles para todos los empleados. Esta visibilidad se basa en el
                    interés legítimo del empleador para la correcta organización del trabajo
                    (Art. 6.1.f RGPD).</li>
                <li><strong>Gestión de habilidades:</strong> registro de competencias y habilidades
                    profesionales de los empleados para la asignación óptima de recursos y procesos
                    de selección interna.</li>
              </ul>
            </Section>

            {/* 3. Legitimación */}
            <Section title="3. Base Jurídica del Tratamiento">
              <ul className="space-y-2 text-sm">
                <li>
                  <strong>Ejecución del contrato laboral</strong> (Art. 6.1.b RGPD): tratamiento
                  necesario para el mantenimiento y ejecución del contrato de trabajo.
                </li>
                <li>
                  <strong>Obligación legal</strong> (Art. 6.1.c RGPD): cumplimiento de
                  obligaciones previstas en la legislación laboral, tributaria y de
                  Seguridad Social.
                </li>
                <li>
                  <strong>Interés legítimo</strong> (Art. 6.1.f RGPD): control de acceso y
                  seguridad del sistema de información interno.
                </li>
                <li>
                  <strong>Consentimiento</strong> (Art. 6.1.a RGPD): para tratamientos no
                  comprendidos en las bases anteriores.
                </li>
              </ul>
            </Section>

            {/* 4. Datos tratados */}
            <Section title="4. Categorías de Datos Tratados">
              <p>Este portal trata las siguientes categorías de datos:</p>
              <div className="mt-3 space-y-3 text-sm">
                <div>
                  <strong>Datos identificativos:</strong> nombre y apellidos, NIF/NIE, número de
                  empleado, foto de perfil.
                </div>
                <div>
                  <strong>Datos de contacto:</strong> dirección de correo electrónico, teléfono,
                  dirección postal.
                </div>
                <div>
                  <strong>Datos laborales:</strong> cargo, departamento, tipo de contrato, fecha
                  de alta, número de Seguridad Social.
                </div>
                <div>
                  <strong>Datos económicos:</strong> IBAN bancario para el abono de nóminas.
                  <span className="text-red-700 font-medium"> (Datos confidenciales de acceso restringido)</span>
                </div>
                <div>
                  <strong>Datos de acceso:</strong> log de accesos al sistema, dirección IP
                  (anonimizada para el personal de soporte técnico), fecha y hora.
                </div>
                <div>
                  <strong>Datos de candidatos:</strong> CV, historial de selección, expectativas
                  salariales. Se conservan máximo 12 meses desde el fin del proceso.
                </div>
              </div>
            </Section>

            {/* 5. Destinatarios */}
            <Section title="5. Destinatarios y Transferencias">
              <p>Sus datos podrán ser comunicados a:</p>
              <ul className="mt-3 space-y-2 text-sm list-disc list-inside">
                <li>
                  <strong>Supabase Inc.</strong> (proveedor de infraestructura cloud), con
                  servidores en la UE, bajo DPA conforme al RGPD.
                </li>
                <li>
                  <strong>Vercel Inc.</strong> (proveedor de alojamiento web), con transferencia
                  a EE.UU. bajo Cláusulas Contractuales Tipo (CCT).
                </li>
                <li>
                  <strong>Organismos públicos</strong> (Hacienda, Seguridad Social, SEPE) cuando
                  exista obligación legal.
                </li>
              </ul>
              <p className="mt-3 text-sm">
                No se realizan transferencias internacionales de datos fuera del Espacio Económico
                Europeo (EEE) sin las garantías adecuadas exigidas por el RGPD.
              </p>
            </Section>

            {/* 6. Conservación */}
            <Section title="6. Plazos de Conservación">
              <ul className="space-y-2 text-sm">
                <li><strong>Datos laborales activos:</strong> durante la vigencia de la relación laboral y posteriormente durante los plazos legales (4 años para datos fiscales, 4 años ET).</li>
                <li><strong>Documentos laborales:</strong> 5 años tras la extinción del contrato.</li>
                <li><strong>Logs de acceso:</strong> 12 meses.</li>
                <li><strong>Datos de candidatos descartados:</strong> máximo 12 meses.</li>
                <li><strong>Datos de candidatos contratados:</strong> se convierten en datos del empleado.</li>
              </ul>
            </Section>

            {/* 7. Derechos */}
            <Section title="7. Derechos de los Interesados">
              <p>
                En virtud del RGPD y la LOPDGDD, puede ejercer los siguientes derechos:
              </p>
              <ul className="mt-3 space-y-2 text-sm list-disc list-inside">
                <li><strong>Acceso:</strong> conocer qué datos tratamos sobre usted.</li>
                <li><strong>Rectificación:</strong> corregir datos inexactos o incompletos.</li>
                <li><strong>Supresión («derecho al olvido»):</strong> solicitar la eliminación de sus datos cuando no sean necesarios.</li>
                <li><strong>Limitación:</strong> solicitar que suspendamos el tratamiento en determinadas circunstancias.</li>
                <li><strong>Portabilidad:</strong> recibir sus datos en formato estructurado y de uso común.</li>
                <li><strong>Oposición:</strong> oponerse a ciertos tratamientos basados en interés legítimo.</li>
              </ul>
              <p className="mt-3 text-sm">
                Para ejercer estos derechos, diríjase a:{" "}
                <a
                  href="mailto:privacidad@avaseleccion.es"
                  className="text-amber-700 underline"
                >
                  privacidad@avaseleccion.es
                </a>{" "}
                adjuntando copia de su documento de identidad.
              </p>
              <p className="mt-2 text-sm">
                Si considera que el tratamiento de sus datos vulnera la normativa, puede
                presentar una reclamación ante la{" "}
                <a
                  href="https://www.aepd.es"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-700 underline"
                >
                  Agencia Española de Protección de Datos (AEPD)
                </a>
                .
              </p>
            </Section>

            {/* 8. Medidas de seguridad */}
            <Section title="8. Medidas de Seguridad">
              <p>
                En cumplimiento del Art. 32 RGPD (seguridad del tratamiento), este portal
                implementa las siguientes medidas técnicas y organizativas:
              </p>
              <ul className="mt-3 space-y-2 text-sm list-disc list-inside">
                <li>Cifrado en tránsito mediante TLS 1.3.</li>
                <li>Cifrado en reposo de datos sensibles (AES-256) mediante Supabase.</li>
                <li>Control de acceso basado en roles (RBAC) con principio de mínimo privilegio.</li>
                <li>Seguridad a nivel de fila (Row Level Security) en la base de datos.</li>
                <li>Registro de auditoría de accesos y operaciones.</li>
                <li>Autenticación con contraseñas robustas (mínimo 8 caracteres).</li>
                <li>Cabeceras de seguridad HTTP (CSP, HSTS, X-Frame-Options, etc.).</li>
                <li>No indexación por motores de búsqueda (noindex, nofollow).</li>
              </ul>
            </Section>

            {/* 9. Cookies */}
            <Section title="9. Uso de Cookies">
              <p>
                Este portal utiliza únicamente las cookies estrictamente necesarias para
                el funcionamiento de la sesión de usuario (cookies de sesión de Supabase Auth).
                No utilizamos cookies de terceros ni con fines publicitarios.
              </p>
            </Section>

            {/* 10. Modificaciones */}
            <Section title="10. Modificaciones de esta Política">
              <p>
                Esta política podrá ser actualizada para reflejar cambios normativos o
                en el tratamiento. Le notificaremos cualquier cambio sustancial a través
                del portal o por correo electrónico. Le recomendamos revisar periódicamente
                esta página.
              </p>
            </Section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-ava-charcoal-light">
        © {new Date().getFullYear()} AVA Selección · Consultor de Producto Gastronómico ·{" "}
        <Link href="/login" className="underline hover:text-ava-charcoal">
          Volver al portal
        </Link>
      </footer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-ava-charcoal mb-3 pb-2 border-b border-ava-gray-medium">
        {title}
      </h2>
      <div className="text-ava-charcoal-medium leading-relaxed">{children}</div>
    </section>
  );
}
