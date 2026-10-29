-- Explicit default-deny policies for opportunity tables.
-- Trusted Express routes use the server service role; browser clients must use those routes.
drop policy if exists jr_opportunities_deny_client_access on public.jr_opportunities;
create policy jr_opportunities_deny_client_access on public.jr_opportunities
  for all to anon, authenticated using (false) with check (false);

drop policy if exists jr_opportunity_interests_deny_client_access on public.jr_opportunity_interests;
create policy jr_opportunity_interests_deny_client_access on public.jr_opportunity_interests
  for all to anon, authenticated using (false) with check (false);

drop policy if exists jr_opportunity_reports_deny_client_access on public.jr_opportunity_reports;
create policy jr_opportunity_reports_deny_client_access on public.jr_opportunity_reports
  for all to anon, authenticated using (false) with check (false);
