import { createClient } from "@/lib/supabase/client";

export type Bien = {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  code_postal: string;
  type: 'appartement' | 'maison' | 'studio' | 'local_commercial' | 'parking' | 'autre';
  surface: number;
  nb_pieces: number;
  etage: number;
  loyer_base: number;
  charges: number;
  depot_garantie: number;
  dpe: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G';
  statut: 'libre' | 'occupe' | 'en_travaux' | 'a_vendre';
  description: string;
  owner_id: string;
  created_at: string;
};

export async function getBiens(): Promise<Bien[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("biens")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getBien(id: string): Promise<Bien | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("biens")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function createBien(payload: Omit<Bien, "id" | "owner_id" | "created_at">): Promise<Bien> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("biens")
    .insert({ ...payload, owner_id: user!.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBien(id: string, payload: Partial<Omit<Bien, "id" | "owner_id" | "created_at">>): Promise<Bien> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("biens")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteBien(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("biens").delete().eq("id", id);
  if (error) throw error;
}
