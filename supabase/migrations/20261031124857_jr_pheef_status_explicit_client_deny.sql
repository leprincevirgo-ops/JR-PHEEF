drop policy if exists jr_status_updates_client_deny on public.jr_status_updates;
create policy jr_status_updates_client_deny on public.jr_status_updates for all to anon, authenticated using (false) with check (false);
drop policy if exists jr_status_views_client_deny on public.jr_status_views;
create policy jr_status_views_client_deny on public.jr_status_views for all to anon, authenticated using (false) with check (false);
