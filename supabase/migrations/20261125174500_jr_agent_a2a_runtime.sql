-- JR Agent Universe: A2A Agent Card and task tracking.
alter table public.jr_agents add column if not exists a2a_skills jsonb not null default '[]'::jsonb;
alter table public.jr_agents add column if not exists a2a_protocol_version text;
alter table public.jr_agent_runs add column if not exists a2a_task_id text;
