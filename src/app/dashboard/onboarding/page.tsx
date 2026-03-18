import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingManager } from "@/components/onboarding/OnboardingManager";

export default async function OnboardingPage() {
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

  const { data: candidates } = await supabase
    .from("candidates")
    .select("*")
    .order("created_at", { ascending: false });

  return <OnboardingManager candidates={candidates ?? []} />;
}
