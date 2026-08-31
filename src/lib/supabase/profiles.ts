import { createClient } from "@/lib/supabase/client";

export type Profile = {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone: string;
  cin: string;
  adresse: string;
  ville: string;
  societe: string;
  rib: string;
};

export async function getProfile(): Promise<Profile | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return data ?? {
    id: user.id,
    email: user.email ?? "",
    nom: user.user_metadata?.full_name?.split(" ")[0] ?? "",
    prenom: "",
    telephone: "",
    cin: "",
    adresse: "",
    ville: "",
    societe: "",
    rib: "",
  };
}

export async function upsertProfile(payload: Omit<Profile, "id" | "email">): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Session expirée — reconnectez-vous.");
  const { error } = await supabase.from("profiles").upsert({ id: user.id, email: user.email, ...payload });
  if (error) throw error;
}
