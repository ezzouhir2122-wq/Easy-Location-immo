import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const ADMIN_EMAIL = "ezzouhir2122@gmail.com";

export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function requireAdmin() {
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status, email")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = profile?.role === "admin" || user.email?.toLowerCase() === ADMIN_EMAIL;
  if (!isAdmin || profile?.status === "suspended") redirect("/dashboard");
  return { supabase, user, profile };
}
