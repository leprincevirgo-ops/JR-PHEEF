ALTER TABLE public.ventures
  ADD COLUMN IF NOT EXISTS parent_venture_slug text,
  ADD COLUMN IF NOT EXISTS ownership_percent numeric(5,2),
  ADD COLUMN IF NOT EXISTS legal_entity_status text NOT NULL DEFAULT 'planned',
  ADD COLUMN IF NOT EXISTS operating_structure text NOT NULL DEFAULT 'planned',
  ADD COLUMN IF NOT EXISTS registration_country text,
  ADD COLUMN IF NOT EXISTS registered_name text,
  ADD COLUMN IF NOT EXISTS registration_number text,
  ADD COLUMN IF NOT EXISTS physical_presence_status text NOT NULL DEFAULT 'not_planned',
  ADD COLUMN IF NOT EXISTS physical_presence jsonb NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.ventures'::regclass AND conname='ventures_parent_venture_slug_fkey') THEN
    ALTER TABLE public.ventures ADD CONSTRAINT ventures_parent_venture_slug_fkey
      FOREIGN KEY (parent_venture_slug) REFERENCES public.ventures(slug) ON UPDATE CASCADE ON DELETE RESTRICT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.ventures'::regclass AND conname='ventures_ownership_percent_check') THEN
    ALTER TABLE public.ventures ADD CONSTRAINT ventures_ownership_percent_check
      CHECK (ownership_percent IS NULL OR (ownership_percent >= 0 AND ownership_percent <= 100));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.ventures'::regclass AND conname='ventures_legal_entity_status_check') THEN
    ALTER TABLE public.ventures ADD CONSTRAINT ventures_legal_entity_status_check
      CHECK (legal_entity_status IN ('planned','incorporation_in_progress','incorporated','dissolved'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.ventures'::regclass AND conname='ventures_operating_structure_check') THEN
    ALTER TABLE public.ventures ADD CONSTRAINT ventures_operating_structure_check
      CHECK (operating_structure IN ('parent_company','division','subsidiary','planned'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.ventures'::regclass AND conname='ventures_physical_presence_status_check') THEN
    ALTER TABLE public.ventures ADD CONSTRAINT ventures_physical_presence_status_check
      CHECK (physical_presence_status IN ('not_planned','planned','searching','secured','operational'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS ventures_parent_venture_slug_idx ON public.ventures(parent_venture_slug);

UPDATE public.ventures
SET operating_structure='parent_company',
    legal_entity_status='planned',
    physical_presence_status='planned'
WHERE slug='dgbo';

UPDATE public.ventures
SET parent_venture_slug='dgbo',
    ownership_percent=100,
    operating_structure='subsidiary',
    legal_entity_status='planned',
    physical_presence_status='planned'
WHERE slug IN ('jr-pheef','family');
