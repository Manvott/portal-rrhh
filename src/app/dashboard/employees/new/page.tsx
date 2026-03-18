import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { NewEmployeeForm } from "@/components/employees/NewEmployeeForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function NewEmployeePage() {
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

  if (!profile || profile.role !== "admin") redirect("/dashboard");

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <Link
          href="/dashboard/employees"
          className="flex items-center gap-1 text-sm text-ava-charcoal-light hover:text-ava-charcoal transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a empleados
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold text-ava-charcoal">Nuevo Empleado</h1>
        <p className="text-ava-charcoal-light text-sm mt-1">
          Rellena los datos del nuevo empleado. Los campos con * son obligatorios.
        </p>
      </div>
      <NewEmployeeForm />
    </div>
  );
}
