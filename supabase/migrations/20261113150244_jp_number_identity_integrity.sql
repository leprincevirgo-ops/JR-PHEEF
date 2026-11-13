-- JP Numbers are permanent member identifiers, not authentication credentials.
-- Preserve existing values (including the founder's JP-01), while enforcing uniqueness.
CREATE UNIQUE INDEX IF NOT EXISTS members_jp_number_unique_idx
ON public.members (upper(btrim(jp_number)))
WHERE jp_number IS NOT NULL AND btrim(jp_number) <> '';

CREATE OR REPLACE FUNCTION public.enforce_jp_number_identity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public, pg_temp
AS $
BEGIN
  IF TG_OP = 'INSERT' AND (NEW.jp_number IS NULL OR btrim(NEW.jp_number) = '') THEN
    NEW.jp_number := 'JP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  ELSIF TG_OP = 'UPDATE' AND OLD.jp_number IS NOT NULL
        AND NEW.jp_number IS DISTINCT FROM OLD.jp_number THEN
    RAISE EXCEPTION 'JP Number is permanent and cannot be changed'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS members_jp_number_identity_guard ON public.members;
CREATE TRIGGER members_jp_number_identity_guard
BEFORE INSERT OR UPDATE OF jp_number ON public.members
FOR EACH ROW EXECUTE FUNCTION public.enforce_jp_number_identity();

COMMENT ON COLUMN public.members.jp_number IS
'Permanent unique member identifier. Not an authentication credential or phone number. Immutable after assignment.';
