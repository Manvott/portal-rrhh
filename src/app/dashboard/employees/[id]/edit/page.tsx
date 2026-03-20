import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { EditEmployeeForm } from "@/components/employees/EditEmployeeForm";
import type { Employee } from "@/types";

export default async function EditEmployeePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single();

  if (!employee) notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-ava-charcoal-light">
        <Link href="/dashboard/employees" className="hover:text-ava-charcoal transition-colors">
          Empleados
        </Link>
        <span>/</span>
        <Link href={`/dashboard/employees/${id}`} className="hover:text-ava-charcoal transition-colors">
          {employee.first_name} {employee.last_name}
        </Link>
        <span>/</span>
        <span className="text-ava-charcoal">Editar</span>
      </div>

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/employees/${id}`}
          className="flex items-center gap-1 text-sm text-ava-charcoal-light hover:text-ava-charcoal transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la ficha
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-ava-charcoal">
          Editar empleado
        </h1>
        <p className="text-ava-charcoal-light text-sm mt-1">
          {employee.first_name} {employee.last_name} · {employee.position ?? "Sin cargo"}
        </p>
      </div>

      <EditEmployeeForm employee={employee as Employee} />
    </div>
  );
}
