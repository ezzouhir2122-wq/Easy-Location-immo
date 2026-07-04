import { createClient } from "@/lib/supabase/client";

export type CategorieDoc =
  | "contrat_bail"
  | "piece_identite"
  | "justificatif_revenus"
  | "titre_propriete"
  | "assurance"
  | "etat_des_lieux";

export type Document = {
  id: string;
  owner_id: string;
  categorie: CategorieDoc;
  nom: string;
  fichier_url: string;
  fichier_type: string;
  taille: number;
  bien_id: string | null;
  locataire_id: string | null;
  created_at: string;
};

export type DocumentMeta = {
  categorie: CategorieDoc;
  nom: string;
  bien_id?: string | null;
  locataire_id?: string | null;
};

export type DocumentFilters = {
  categorie?: CategorieDoc;
  bien_id?: string;
  locataire_id?: string;
};

export async function getDocuments(filters?: DocumentFilters): Promise<Document[]> {
  const supabase = createClient();
  let query = supabase.from("documents").select("*").order("created_at", { ascending: false });
  if (filters?.categorie) query = query.eq("categorie", filters.categorie);
  if (filters?.bien_id) query = query.eq("bien_id", filters.bien_id);
  if (filters?.locataire_id) query = query.eq("locataire_id", filters.locataire_id);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function createDocument(file: File, meta: DocumentMeta): Promise<Document> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const docId = crypto.randomUUID();
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${user.id}/${docId}/fichier.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("documents")
    .insert({
      id: docId,
      owner_id: user.id,
      categorie: meta.categorie,
      nom: meta.nom,
      fichier_url: path,
      fichier_type: file.type,
      taille: file.size,
      bien_id: meta.bien_id ?? null,
      locataire_id: meta.locataire_id ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteDocument(id: string, fichier_url: string): Promise<void> {
  const supabase = createClient();
  await supabase.storage.from("documents").remove([fichier_url]);
  const { error } = await supabase.from("documents").delete().eq("id", id);
  if (error) throw error;
}

export async function getSignedUrl(fichier_url: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(fichier_url, 60);
  if (error) throw error;
  return data.signedUrl;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export const CATEGORIES: {
  value: CategorieDoc;
  label: string;
  icon: string;
  color: string;
  text: string;
}[] = [
  { value: "contrat_bail",         label: "Contrats de bail",        icon: "📄", color: "#DBEAFE", text: "#1E40AF" },
  { value: "piece_identite",       label: "Pièces d'identité",       icon: "🪪", color: "#EDE9FE", text: "#5B21B6" },
  { value: "justificatif_revenus", label: "Justificatifs de revenus", icon: "💼", color: "#D1FAE5", text: "#065F46" },
  { value: "titre_propriete",      label: "Titres de propriété",     icon: "🏠", color: "#FEF3C7", text: "#92400E" },
  { value: "assurance",            label: "Assurances",              icon: "🛡️", color: "#FCE7F3", text: "#9D174D" },
  { value: "etat_des_lieux",       label: "États des lieux",         icon: "📋", color: "#FEE2E2", text: "#991B1B" },
];
