import { createClient } from "@/lib/supabase/client";

export type Loyer = {
  id: string;
  owner_id: string;
  bien_id: string | null;
  locataire_id: string | null;
  montant: number;
  date_echeance: string;
  date_paiement: string | null;
  statut: 'paye' | 'en_attente' | 'retard' | 'partiel';
  type: 'loyer' | 'charge' | 'depot_garantie' | 'autre';
  notes: string;
  created_at: string;
  // joined
  bien_nom?: string;
  locataire_nom?: string;
};

export async function getLoyers(): Promise<Loyer[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("loyers")
    .select("*, biens(nom), locataires(nom, prenom)")
    .order("date_echeance", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    ...r,
    bien_nom: r.biens?.nom ?? null,
    locataire_nom: r.locataires ? `${r.locataires.prenom} ${r.locataires.nom}` : null,
  }));
}

export async function createLoyer(payload: Omit<Loyer, "id" | "owner_id" | "created_at" | "bien_nom" | "locataire_nom">): Promise<Loyer> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("loyers")
    .insert({ ...payload, owner_id: user!.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateLoyer(id: string, payload: Partial<Omit<Loyer, "id" | "owner_id" | "created_at" | "bien_nom" | "locataire_nom">>): Promise<Loyer> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("loyers")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteLoyer(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("loyers").delete().eq("id", id);
  if (error) throw error;
}
