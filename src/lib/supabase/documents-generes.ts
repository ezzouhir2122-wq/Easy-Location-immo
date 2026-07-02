import { createClient } from "@/lib/supabase/client";

export type DocType = "quittance" | "bail" | "etat_des_lieux";

export type DocumentGenere = {
  id: string;
  owner_id: string;
  type: DocType;
  titre: string;
  data: Record<string, unknown>;
  bien_id: string | null;
  locataire_id: string | null;
  created_at: string;
};

export async function getDocumentsGeneres(): Promise<DocumentGenere[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("documents_generes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function createDocumentGenere(
  payload: Omit<DocumentGenere, "id" | "owner_id" | "created_at">
): Promise<DocumentGenere> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");
  const { data, error } = await supabase
    .from("documents_generes")
    .insert({ ...payload, owner_id: user.id })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDocumentGenere(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("documents_generes")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
