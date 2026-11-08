-- Consolidate duplicate deny policies and index the import requester foreign key.
drop policy if exists jr_business_workspaces_no_client_access on public.jr_business_workspaces;
create index if not exists jr_business_import_jobs_requested_by_idx
  on public.jr_business_import_jobs(requested_by);
