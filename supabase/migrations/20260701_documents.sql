-- Migration : Table documents + bucket Storage
-- À exécuter dans Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS public.documents (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categorie      text NOT NULL CHECK (categorie IN (
                   'contrat_bail','piece_identite','justificatif_revenus',
                   'titre_propriete','assurance','etat_des_lieux')),
  nom            text NOT NULL DEFAULT '',
  fichier_url    text NOT NULL DEFAULT '',
  fichier_type   text NOT NULL DEFAULT '',
  taille         bigint NOT NULL DEFAULT 0,
  bien_id        uuid REFERENCES public.biens(id) ON DELETE SET NULL,
  locataire_id   uuid REFERENCES public.locataires(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documents_select_own" ON public.documents;
DROP POLICY IF EXISTS "documents_insert_own" ON public.documents;
DROP POLICY IF EXISTS "documents_update_own" ON public.documents;
DROP POLICY IF EXISTS "documents_delete_own" ON public.documents;

CREATE POLICY "documents_select_own" ON public.documents
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "documents_insert_own" ON public.documents
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "documents_update_own" ON public.documents
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "documents_delete_own" ON public.documents
  FOR DELETE USING (auth.uid() = owner_id);

-- Policies Storage bucket "documents" (à exécuter dans SQL Editor aussi)
-- Le bucket doit être créé manuellement dans Storage > New bucket
-- Name: documents | Public: OFF | Size limit: 52428800

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('documents', 'documents', false, 52428800)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "storage_documents_select" ON storage.objects;
DROP POLICY IF EXISTS "storage_documents_insert" ON storage.objects;
DROP POLICY IF EXISTS "storage_documents_delete" ON storage.objects;

CREATE POLICY "storage_documents_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "storage_documents_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "storage_documents_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
