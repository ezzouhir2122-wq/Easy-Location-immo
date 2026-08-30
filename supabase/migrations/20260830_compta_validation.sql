-- Validation comptable côté base : une écriture ne devient validée
-- que si ses lignes sont équilibrées au centime près.

CREATE OR REPLACE FUNCTION public.valider_ecriture_comptable(p_ecriture_id uuid)
RETURNS public.compta_ecritures
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_debit numeric(14,2);
  v_credit numeric(14,2);
  v_result public.compta_ecritures;
BEGIN
  SELECT owner_id INTO v_owner_id
  FROM public.compta_ecritures
  WHERE id = p_ecriture_id;

  IF v_owner_id IS NULL OR v_owner_id <> auth.uid() THEN
    RAISE EXCEPTION 'Écriture introuvable ou non autorisée';
  END IF;

  SELECT COALESCE(SUM(debit), 0), COALESCE(SUM(credit), 0)
  INTO v_debit, v_credit
  FROM public.compta_lignes
  WHERE ecriture_id = p_ecriture_id AND owner_id = auth.uid();

  IF v_debit = 0 OR v_credit = 0 OR v_debit <> v_credit THEN
    RAISE EXCEPTION 'Écriture déséquilibrée : débit=% crédit=%', v_debit, v_credit;
  END IF;

  UPDATE public.compta_ecritures
  SET statut = 'validee', updated_at = now()
  WHERE id = p_ecriture_id AND owner_id = auth.uid()
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.valider_ecriture_comptable(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.valider_ecriture_comptable(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.bloquer_modification_ecriture_validee()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.statut IN ('validee', 'rapprochee') THEN
    RAISE EXCEPTION 'Une écriture validée ne peut pas être modifiée ou supprimée';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS compta_ecritures_immutables ON public.compta_ecritures;
CREATE TRIGGER compta_ecritures_immutables
BEFORE UPDATE OR DELETE ON public.compta_ecritures
FOR EACH ROW EXECUTE FUNCTION public.bloquer_modification_ecriture_validee();
