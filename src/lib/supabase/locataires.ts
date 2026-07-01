import { createClient } from "@/lib/supabase/client";

export type Locataire = {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  date_naissance: string;
  lieu_naissance: string;
  profession: string;
  revenus_mensuels: number;
  owner_id: string;
  created_at: string;
};

export async function getLocataires(): Promise<Locataire[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("locataires")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getLocataire(id: string): Promise<Locataire | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("locataires")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function createLocataire(payload: Omit<Locataire, "id" | "owner_id" | "created_at">): Promise<Locataire> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("locataires")
    .insert({ ...payload, owner_id: user!.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateLocataire(id: string, payload: Partial<Omit<Locataire, "id" | "owner_id" | "created_at">>): Promise<Locataire> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("locataires")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteLocataire(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("locataires").delete().eq("id", id);
  if (error) throw error;
}
