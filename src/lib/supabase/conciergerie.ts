import { createClient } from "@/lib/supabase/client";

export type Reservation = {
  id: string; owner_id: string; bien_id: string; nom_client: string; email_client: string; telephone_client: string;
  date_arrivee: string; date_depart: string; nombre_voyageurs: number;
  canal: "direct" | "airbnb" | "booking" | "agence" | "autre";
  statut: "a_confirmer" | "confirmee" | "en_cours" | "terminee" | "annulee";
  montant_brut: number; commission_taux: number; frais_menage: number; notes: string;
  created_at: string; updated_at: string; bien_nom?: string;
};
export type ReservationInput = Omit<Reservation, "id" | "owner_id" | "created_at" | "updated_at" | "bien_nom">;
export type Tache = {
  id: string; owner_id: string; bien_id: string | null; reservation_id: string | null;
  type: "menage" | "linge" | "check_in" | "check_out" | "maintenance" | "approvisionnement" | "autre";
  titre: string; description: string; assignee_nom: string; assignee_telephone: string;
  priorite: "basse" | "normale" | "haute" | "urgente"; statut: "a_faire" | "en_cours" | "terminee" | "annulee";
  date_prevue: string | null; cout_estime: number; cout_reel: number; created_at: string; updated_at: string; bien_nom?: string;
};
export type TacheInput = Omit<Tache, "id" | "owner_id" | "created_at" | "updated_at" | "bien_nom">;

export async function getReservations(): Promise<Reservation[]> {
  const { data, error } = await createClient().from("reservations_conciergerie").select("*, biens(nom)").order("date_arrivee", { ascending: true });
  if (error) throw error; return (data ?? []).map((row: any) => ({ ...row, bien_nom: row.biens?.nom ?? null }));
}
export async function createReservation(payload: ReservationInput): Promise<Reservation> {
  const supabase = createClient(); const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Session expirée — reconnectez-vous.");
  const { data, error } = await supabase.from("reservations_conciergerie").insert({ ...payload, owner_id: user.id }).select().single();
  if (error) throw error; return data;
}
export async function deleteReservation(id: string): Promise<void> { const { error } = await createClient().from("reservations_conciergerie").delete().eq("id", id); if (error) throw error; }
export async function getTaches(): Promise<Tache[]> {
  const { data, error } = await createClient().from("taches_conciergerie").select("*, biens(nom)").order("date_prevue", { ascending: true, nullsFirst: false });
  if (error) throw error; return (data ?? []).map((row: any) => ({ ...row, bien_nom: row.biens?.nom ?? null }));
}
export async function createTache(payload: TacheInput): Promise<Tache> {
  const supabase = createClient(); const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error("Session expirée — reconnectez-vous.");
  const { data, error } = await supabase.from("taches_conciergerie").insert({ ...payload, owner_id: user.id }).select().single();
  if (error) throw error; return data;
}
export async function updateTache(id: string, payload: Partial<TacheInput>): Promise<Tache> { const { data, error } = await createClient().from("taches_conciergerie").update(payload).eq("id", id).select().single(); if (error) throw error; return data; }

export type ComptaCompte = { id: string; owner_id: string; code: string; libelle: string; classe: number; actif: boolean };
export type ComptaEcriture = { id: string; owner_id: string; bien_id: string | null; date_operation: string; libelle: string; reference: string; source_type: string; statut: "brouillon" | "validee" | "rapprochee"; created_at: string };

export async function getComptaComptes(): Promise<ComptaCompte[]> {
  const { data, error } = await createClient().from("compta_comptes").select("*").eq("actif", true).order("code");
  if (error) throw error; return data ?? [];
}
export async function createComptaCompte(payload: Pick<ComptaCompte, "code" | "libelle" | "classe">): Promise<ComptaCompte> {
  const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Session expirée — reconnectez-vous.");
  const { data, error } = await supabase.from("compta_comptes").insert({ ...payload, owner_id: user.id }).select().single();
  if (error) throw error; return data;
}
export async function getComptaEcritures(): Promise<ComptaEcriture[]> {
  const { data, error } = await createClient().from("compta_ecritures").select("*").order("date_operation", { ascending: false });
  if (error) throw error; return data ?? [];
}
export async function createComptaEcriture(payload: { bien_id: string | null; date_operation: string; libelle: string; reference: string; compte_debit: string; compte_credit: string; montant: number }): Promise<ComptaEcriture> {
  const supabase = createClient(); const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Session expirée — reconnectez-vous.");
  if (payload.montant <= 0 || payload.compte_debit === payload.compte_credit) throw new Error("Montant positif et comptes différents obligatoires.");
  const { data: entry, error: entryError } = await supabase.from("compta_ecritures").insert({ owner_id: user.id, bien_id: payload.bien_id, date_operation: payload.date_operation, libelle: payload.libelle, reference: payload.reference, source_type: "manuel" }).select().single();
  if (entryError || !entry) throw entryError ?? new Error("Création de l'écriture impossible.");
  const { data: accounts, error: accountsError } = await supabase.from("compta_comptes").select("id, code").in("code", [payload.compte_debit, payload.compte_credit]).eq("owner_id", user.id);
  if (accountsError || !accounts || accounts.length !== 2) throw accountsError ?? new Error("Comptes comptables introuvables.");
  const debit = accounts.find(a => a.code === payload.compte_debit); const credit = accounts.find(a => a.code === payload.compte_credit);
  const { error: linesError } = await supabase.from("compta_lignes").insert([{ owner_id: user.id, ecriture_id: entry.id, compte_id: debit!.id, libelle: payload.libelle, debit: payload.montant, credit: 0 }, { owner_id: user.id, ecriture_id: entry.id, compte_id: credit!.id, libelle: payload.libelle, debit: 0, credit: payload.montant }]);
  if (linesError) throw linesError; return entry;
}
export async function validateComptaEcriture(id: string): Promise<ComptaEcriture> {
  const { data, error } = await createClient().rpc("valider_ecriture_comptable", { p_ecriture_id: id });
  if (error) throw error; return data;
}
