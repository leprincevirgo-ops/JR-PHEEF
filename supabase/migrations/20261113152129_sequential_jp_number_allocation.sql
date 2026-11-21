-- Allocate readable, sequential JP Numbers for new members.
-- Existing identities are preserved; the founder remains JP-01.
CREATE SEQUENCE IF NOT EXISTS public.jp_number_seq START WITH 1 INCREMENT BY 1 NO MINVALUE NO MAXVALUE CACHE 1;

SELECT setval(
  'public.jp_number_seq',
  GREATEST(
    COALESCE((
      SELECT MAX(substring(jp_number FROM '^JP-([0-9]+)$')::bigint)
      FROM public.members
      WHERE jp_number ~ '^JP-[0-9]+$'
    ), 1),
    1
  ),
  true
);

ALTER TABLE public.members ALTER COLUMN jp_number DROP DEFAULT;

CREATE OR REPLACE FUNCTION public.enforce_jp_number_identity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.jp_number := 'JP-' || lpad(nextval('public.jp_number_seq')::text, 2, '0');
  ELSIF TG_OP = 'UPDATE' AND OLD.jp_number IS NOT NULL
        AND NEW.jp_number IS DISTINCT FROM OLD.jp_number THEN
    RAISE EXCEPTION 'JP Number is permanent and cannot be changed'
      USING ERRCODE = '23514';
  ELSIF TG_OP = 'UPDATE' AND (NEW.jp_number IS NULL OR btrim(NEW.jp_number) = '') THEN
    NEW.jp_number := 'JP-' || lpad(nextval('public.jp_number_seq')::text, 2, '0');
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON SEQUENCE public.jp_number_seq IS
'Allocates permanent sequential JR PHEEF member identities. Founder JP-01 is preserved.';
