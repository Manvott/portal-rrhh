"use client";

import { Download } from "lucide-react";

interface EmployeeRow {
  first_name: string;
  last_name: string;
  email: string | null;
  position: string | null;
  department: string | null;
  hire_date: string | null;
  contract_type: string | null;
  contract_end_date: string | null;
  is_active: boolean;
  phone: string | null;
  location: string | null;
}

export function ExportCSVButton({ employees }: { employees: EmployeeRow[] }) {
  const handleExport = () => {
    const headers = [
      "Nombre", "Apellidos", "Email", "Cargo", "Departamento",
      "Fecha Alta", "Tipo Contrato", "Fin Contrato", "Teléfono", "Localización", "Estado",
    ];
    const rows = employees.map((e) => [
      e.first_name,
      e.last_name,
      e.email ?? "",
      e.position ?? "",
      e.department ?? "",
      e.hire_date ?? "",
      e.contract_type ?? "",
      e.contract_end_date ?? "",
      e.phone ?? "",
      e.location ?? "",
      e.is_active ? "Activo" : "Inactivo",
    ]);
    const csv = [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `empleados_ava_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-3 py-2 text-sm border border-ava-gray-medium
                 rounded-lg text-ava-charcoal hover:bg-ava-gray transition-colors"
      title="Exportar lista de empleados a CSV"
    >
      <Download className="w-4 h-4" />
      Exportar CSV
    </button>
  );
}
