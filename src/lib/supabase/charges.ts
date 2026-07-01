import { createClient } from "@/lib/supabase/client";

export type Charge = {
  id: string;
  owner_id: string;
  bien_id: string | null;
  type: 'eau' | 'electricite' | 'internet' | 'assurance' | 'entretien' | 'taxe' | 'autre';
  montant: number;
  date: string;
  description: string;
  statut: 'paye' | 'en_attente';
  created_at: string;
  bien_nom?: string;
};

export async function getCharges(): Promise<Charge[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("charges")
    .select("*, biens(nom)")
    .order("date", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({ ...r, bien_nom: r.biens?.nom ?? null }));
}

export async function createCharge(payload: Omit<Charge, "id" | "owner_id" | "created_at" | "bien_nom">): Promise<Charge> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("charges")
    .insert({ ...payload, owner_id: user!.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCharge(id: string, payload: Partial<Omit<Charge, "id" | "owner_id" | "created_at" | "bien_nom">>): Promise<Charge> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("charges")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCharge(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("charges").delete().eq("id", id);
  if (error) throw error;
}
