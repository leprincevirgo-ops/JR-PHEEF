do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='jr_user_continuity' and policyname='deny_client_access_jr_user_continuity') then
    create policy deny_client_access_jr_user_continuity on public.jr_user_continuity for all to anon, authenticated using (false) with check (false);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='jr_business_workspaces' and policyname='deny_client_access_jr_business_workspaces') then
    create policy deny_client_access_jr_business_workspaces on public.jr_business_workspaces for all to anon, authenticated using (false) with check (false);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='jr_business_daily_plans' and policyname='deny_client_access_jr_business_daily_plans') then
    create policy deny_client_access_jr_business_daily_plans on public.jr_business_daily_plans for all to anon, authenticated using (false) with check (false);
  end if;
end $$;

revoke all on public.jr_user_continuity from anon, authenticated;
revoke all on public.jr_business_workspaces from anon, authenticated;
revoke all on public.jr_business_daily_plans from anon, authenticated;
