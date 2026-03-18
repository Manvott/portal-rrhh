"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Save, AlertCircle } from "lucide-react";

export function NewEmployeeForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    birth_date: "",
    hire_date: "",
    position: "",
    department: "",
    location: "",
    contract_type: "",
    nif: "",
    social_security_number: "",
    iban: "",
    address: "",
    city: "",
    postal_code: "",
    country: "España",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    notes: "",
    employee_number: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!form.first_name || !form.last_name || !form.email) {
      setError("Nombre, apellidos y email son obligatorios.");
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("El formato del email no es válido.");
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: insertError } = await supabase.from("employees").insert({
        ...form,
        birth_date: form.birth_date || null,
        hire_date: form.hire_date || null,
        phone: form.phone || null,
        position: form.position || null,
        department: form.department || null,
        location: form.location || null,
        contract_type: form.contract_type || null,
        nif: form.nif || null,
        social_security_number: form.social_security_number || null,
        iban: form.iban || null,
        address: form.address || null,
        city: form.city || null,
        postal_code: form.postal_code || null,
        emergency_contact_name: form.emergency_contact_name || null,
        emergency_contact_phone: form.emergency_contact_phone || null,
        notes: form.notes || null,
        employee_number: form.employee_number || null,
        is_active: true,
      });

      if (insertError) throw insertError;

      toast({
        title: "Empleado creado",
        description: `${form.first_name} ${form.last_name} ha sido añadido correctamente.`,
      });

      router.push("/dashboard/employees");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al crear el empleado.";
      if (msg.includes("duplicate") || msg.includes("unique")) {
        setError("Ya existe un empleado con ese email.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Datos personales */}
      <Section title="Datos Personales">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre *" name="first_name" value={form.first_name} onChange={handleChange} required />
          <Field label="Apellidos *" name="last_name" value={form.last_name} onChange={handleChange} required />
          <Field label="Email *" name="email" type="email" value={form.email} onChange={handleChange} required />
          <Field label="Teléfono" name="phone" type="tel" value={form.phone} onChange={handleChange} />
          <Field label="Fecha de nacimiento" name="birth_date" type="date" value={form.birth_date} onChange={handleChange} />
          <Field label="NIF/NIE" name="nif" value={form.nif} onChange={handleChange} />
        </div>
      </Section>

      {/* Datos laborales */}
      <Section title="Datos Laborales">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="N° Empleado" name="employee_number" value={form.employee_number} onChange={handleChange} />
          <Field label="Fecha de alta" name="hire_date" type="date" value={form.hire_date} onChange={handleChange} />
          <Field label="Cargo / Puesto" name="position" value={form.position} onChange={handleChange} />
          <Field label="Departamento" name="department" value={form.department} onChange={handleChange} />
          <Field label="Localización" name="location" value={form.location} onChange={handleChange} />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-ava-charcoal">
              Tipo de contrato
            </label>
            <select
              name="contract_type"
              value={form.contract_type}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg border border-ava-gray-medium
                         focus:outline-none focus:ring-2 focus:ring-ava-yellow text-sm"
            >
              <option value="">Seleccionar...</option>
              <option value="Indefinido">Indefinido</option>
              <option value="Temporal">Temporal</option>
              <option value="Prácticas">Prácticas</option>
              <option value="Freelance">Freelance</option>
              <option value="Obra y servicio">Obra y servicio</option>
            </select>
          </div>
          <Field label="N° Seguridad Social" name="social_security_number" value={form.social_security_number} onChange={handleChange} />
        </div>
      </Section>

      {/* Dirección */}
      <Section title="Dirección">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Dirección" name="address" value={form.address} onChange={handleChange} />
          </div>
          <Field label="Ciudad" name="city" value={form.city} onChange={handleChange} />
          <Field label="Código postal" name="postal_code" value={form.postal_code} onChange={handleChange} />
          <Field label="País" name="country" value={form.country} onChange={handleChange} />
        </div>
      </Section>

      {/* Datos bancarios */}
      <Section title="Datos Bancarios (Confidencial)">
        <Field label="IBAN" name="iban" value={form.iban} onChange={handleChange}
          placeholder="ES00 0000 0000 0000 0000 0000" />
        <p className="text-xs text-ava-charcoal-light mt-1">
          Los datos bancarios están cifrados y son de acceso restringido.
        </p>
      </Section>

      {/* Contacto de emergencia */}
      <Section title="Contacto de Emergencia">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre" name="emergency_contact_name" value={form.emergency_contact_name} onChange={handleChange} />
          <Field label="Teléfono" name="emergency_contact_phone" type="tel" value={form.emergency_contact_phone} onChange={handleChange} />
        </div>
      </Section>

      {/* Notas */}
      <Section title="Notas Internas">
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          placeholder="Notas internas sobre el empleado..."
          className="w-full px-3 py-2 rounded-lg border border-ava-gray-medium
                     focus:outline-none focus:ring-2 focus:ring-ava-yellow text-sm resize-y"
        />
      </Section>

      {/* Botones */}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 bg-ava-yellow hover:bg-ava-yellow-dark
                     text-ava-charcoal font-semibold px-6 py-2.5 rounded-lg
                     transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-ava-charcoal/30 border-t-ava-charcoal rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {loading ? "Guardando..." : "Crear empleado"}
        </button>
        <a
          href="/dashboard/employees"
          className="px-6 py-2.5 rounded-lg border border-ava-gray-medium text-ava-charcoal
                     hover:bg-ava-gray transition-colors font-medium text-sm"
        >
          Cancelar
        </a>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-ava-gray-medium p-6">
      <h3 className="font-semibold text-ava-charcoal mb-4 text-sm uppercase tracking-wide">
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-ava-charcoal">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg border border-ava-gray-medium
                   focus:outline-none focus:ring-2 focus:ring-ava-yellow text-sm
                   placeholder:text-ava-charcoal-light"
      />
    </div>
  );
}
