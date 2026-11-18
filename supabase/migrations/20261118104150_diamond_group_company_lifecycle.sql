alter table public.ventures
  add column if not exists parent_venture_slug text,
  add column if not exists ownership_percent numeric(5,2),
  add column if not exists legal_entity_status text not null default 'planned',
  add column if not exists operating_structure text not null default 'planned',
  add column if not exists registration_country text,
  add column if not exists registered_name text,
  add column if not exists registration_number text,
  add column if not exists physical_presence_status text not null default 'not_planned',
  add column if not exists physical_presence jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (select 1 from pg_constraint where conrelid='public.ventures'::regclass and conname='ventures_parent_venture_slug_fkey') then
    alter table public.ventures add constraint ventures_parent_venture_slug_fkey
      foreign key (parent_venture_slug) references public.ventures(slug) on update cascade on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.ventures'::regclass and conname='ventures_ownership_percent_check') then
    alter table public.ventures add constraint ventures_ownership_percent_check
      check (ownership_percent is null or (ownership_percent >= 0 and ownership_percent <= 100));
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.ventures'::regclass and conname='ventures_legal_entity_status_check') then
    alter table public.ventures add constraint ventures_legal_entity_status_check
      check (legal_entity_status in ('planned','incorporation_in_progress','incorporated','dissolved'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.ventures'::regclass and conname='ventures_operating_structure_check') then
    alter table public.ventures add constraint ventures_operating_structure_check
      check (operating_structure in ('parent_company','division','subsidiary','planned'));
  end if;
  if not exists (select 1 from pg_constraint where conrelid='public.ventures'::regclass and conname='ventures_physical_presence_status_check') then
    alter table public.ventures add constraint ventures_physical_presence_status_check
      check (physical_presence_status in ('not_planned','planned','searching','secured','operational'));
  end if;
end $$;

create index if not exists ventures_parent_venture_slug_idx on public.ventures(parent_venture_slug);

update public.ventures
set operating_structure='parent_company',
    legal_entity_status='planned',
    physical_presence_status='planned'
where slug='dgbo';

update public.ventures
set parent_venture_slug='dgbo',
    ownership_percent=100,
    operating_structure='subsidiary',
    legal_entity_status='planned',
    physical_presence_status='planned'
where slug in ('jr-pheef','family');
