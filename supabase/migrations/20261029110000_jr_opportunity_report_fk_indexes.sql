-- Cover opportunity report foreign keys flagged by the database performance advisor.
-- These indexes improve reviewer/member lookups and avoid table scans during deletes/joins.
create index if not exists jr_opportunity_reports_reporter_member_idx
  on public.jr_opportunity_reports (reporter_member_id);
create index if not exists jr_opportunity_reports_reviewed_by_idx
  on public.jr_opportunity_reports (reviewed_by);
