import { createClient } from "@/lib/supabase/client";

export type TypeBail = 'vide' | 'meuble' | 'commercial' | 'saisonnier' | 'autre';
export type StatutContrat = 'actif' | 'termine' | 'resilie' | 'en_attente';

export type Contrat = {
  id: string;
  owner_id: string;
  bien_id: string;
  locataire_id: string;
  date_debut: string;
  date_fin: string | null;
  loyer_mensuel: number;
  charges_mensuelles: number;
  depot_garantie: number;
  type_bail: TypeBail;
  statut: StatutContrat;
  reconduction_tacite: boolean;
  preavis_mois: number;
  notes: string;
  created_at: string;
  // joined
  bien_nom?: string;
  bien_adresse?: string;
  locataire_nom?: string;
  locataire_email?: string;
  locataire_telephone?: string;
};

export async function getContrats(): Promise<Contrat[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("contrats")
    .select("*, biens(nom, adresse), locataires(nom, prenom, email, telephone)")
    .order("date_debut", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    ...r,
    bien_nom: r.biens?.nom ?? null,
    bien_adresse: r.biens?.adresse ?? null,
    locataire_nom: r.locataires ? `${r.locataires.prenom} ${r.locataires.nom}` : null,
    locataire_email: r.locataires?.email ?? null,
    locataire_telephone: r.locataires?.telephone ?? null,
  }));
}

export async function getContrat(id: string): Promise<Contrat | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("contrats")
    .select("*, biens(nom, adresse), locataires(nom, prenom, email, telephone)")
    .eq("id", id)
    .single();
  if (error) return null;
  return {
    ...data,
    bien_nom: data.biens?.nom ?? null,
    bien_adresse: data.biens?.adresse ?? null,
    locataire_nom: data.locataires ? `${data.locataires.prenom} ${data.locataires.nom}` : null,
    locataire_email: data.locataires?.email ?? null,
    locataire_telephone: data.locataires?.telephone ?? null,
  };
}

export async function createContrat(
  payload: Omit<Contrat, "id" | "owner_id" | "created_at" | "bien_nom" | "bien_adresse" | "locataire_nom" | "locataire_email" | "locataire_telephone">
): Promise<Contrat> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("contrats")
    .insert({ ...payload, owner_id: user!.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateContrat(
  id: string,
  payload: Partial<Omit<Contrat, "id" | "owner_id" | "created_at" | "bien_nom" | "bien_adresse" | "locataire_nom" | "locataire_email" | "locataire_telephone">>
): Promise<Contrat> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("contrats")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteContrat(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("contrats").delete().eq("id", id);
  if (error) throw error;
}
