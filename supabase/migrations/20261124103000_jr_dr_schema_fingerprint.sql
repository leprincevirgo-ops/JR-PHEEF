-- JR PHEEF cross-region recovery: read-only schema fingerprint.
-- SECURITY INVOKER + service_role-only EXECUTE: no client-visible schema endpoint.
create or replace function public.jr_dr_schema_fingerprint()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $function$
with inventory as (
  select jsonb_build_object(
    'tables', (
      select coalesce(jsonb_agg(jsonb_build_object('schema',n.nspname,'table',c.relname,'kind',c.relkind,'rls_enabled',c.relrowsecurity,'rls_forced',c.relforcerowsecurity) order by n.nspname,c.relname),'[]'::jsonb)
      from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relkind in ('r','p')
    ),
    'columns', (
      select coalesce(jsonb_agg(jsonb_build_object('table',c.relname,'column',a.attname,'type',pg_catalog.format_type(a.atttypid,a.atttypmod),'nullable',not a.attnotnull,'default',pg_catalog.pg_get_expr(d.adbin,d.adrelid),'identity',a.attidentity,'generated',a.attgenerated) order by c.relname,a.attnum),'[]'::jsonb)
      from pg_catalog.pg_attribute a join pg_catalog.pg_class c on c.oid=a.attrelid join pg_catalog.pg_namespace n on n.oid=c.relnamespace
      left join pg_catalog.pg_attrdef d on d.adrelid=a.attrelid and d.adnum=a.attnum
      where n.nspname='public' and c.relkind in ('r','p') and a.attnum>0 and not a.attisdropped
    ),
    'constraints', (
      select coalesce(jsonb_agg(jsonb_build_object('table',c.relname,'name',con.conname,'type',con.contype,'definition',pg_catalog.pg_get_constraintdef(con.oid,true)) order by c.relname,con.conname),'[]'::jsonb)
      from pg_catalog.pg_constraint con join pg_catalog.pg_class c on c.oid=con.conrelid join pg_catalog.pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public'
    ),
    'indexes', (
      select coalesce(jsonb_agg(jsonb_build_object('table',c.relname,'name',i.relname,'definition',pg_catalog.pg_get_indexdef(i.oid)) order by c.relname,i.relname),'[]'::jsonb)
      from pg_catalog.pg_index ix join pg_catalog.pg_class c on c.oid=ix.indrelid join pg_catalog.pg_namespace n on n.oid=c.relnamespace join pg_catalog.pg_class i on i.oid=ix.indexrelid
      where n.nspname='public'
    ),
    'policies', (
      select coalesce(jsonb_agg(jsonb_build_object('table',p.tablename,'name',p.policyname,'roles',p.roles,'command',p.cmd,'using',p.qual,'check',p.with_check) order by p.tablename,p.policyname),'[]'::jsonb)
      from pg_catalog.pg_policies p where p.schemaname='public'
    )
  ) as data
)
select jsonb_build_object('format_version',1,'fingerprint',pg_catalog.md5(data::text),'inventory',data)
from inventory;
$function$;

revoke all on function public.jr_dr_schema_fingerprint() from public;
revoke all on function public.jr_dr_schema_fingerprint() from anon;
revoke all on function public.jr_dr_schema_fingerprint() from authenticated;
grant execute on function public.jr_dr_schema_fingerprint() to service_role;
