do $$
begin
  if to_regclass('public.jr_member_state') is not null
     and not exists (select 1 from pg_policies where schemaname='public' and tablename='jr_member_state' and policyname='deny_client_access_jr_member_state') then
    create policy deny_client_access_jr_member_state on public.jr_member_state for all to anon, authenticated using (false) with check (false);
  end if;
end $$;
revoke all on public.jr_member_state from anon, authenticated;