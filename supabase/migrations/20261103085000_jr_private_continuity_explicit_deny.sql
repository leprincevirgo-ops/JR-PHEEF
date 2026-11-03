-- Make the server-only access model explicit for private continuity tables.
-- The app uses a trusted server session, not Supabase browser JWTs, for these records.
do $$
declare table_name text;
begin
  foreach table_name in array array['jr_world_progress','jr_growth_journal','jr_capability_permissions'] loop
    execute format('drop policy if exists deny_client_%I on public.%I', table_name, table_name);
    execute format('create policy deny_client_%I on public.%I for all to anon, authenticated using (false) with check (false)', table_name, table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
    execute format('grant all on table public.%I to service_role', table_name);
  end loop;
end $$;

comment on table public.jr_world_progress is
  'Private member continuity. Server-only access; direct anon/authenticated Data API access is explicitly denied.';
comment on table public.jr_growth_journal is
  'Private member growth journal. Server-only access; direct anon/authenticated Data API access is explicitly denied.';
comment on table public.jr_capability_permissions is
  'Private member capability settings. Server-only access; direct anon/authenticated Data API access is explicitly denied.';
