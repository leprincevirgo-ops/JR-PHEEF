-- JR Agent Universe: permissioned remote MCP connection and tool execution ledger.
-- Remote tools stay disabled until the member explicitly enables a connected agent.
alter table public.jr_agents add column if not exists endpoint_url text;
alter table public.jr_agents add column if not exists connection_status text not null default 'unconnected';
alter table public.jr_agents add column if not exists mcp_protocol_version text;
alter table public.jr_agents add column if not exists mcp_session_id text;
alter table public.jr_agents add column if not exists mcp_tools jsonb not null default '[]'::jsonb;
alter table public.jr_agents add column if not exists last_checked_at timestamptz;
alter table public.jr_agents add column if not exists last_error text;
alter table public.jr_agent_runs add column if not exists tool_name text;
alter table public.jr_agent_runs add column if not exists tool_arguments jsonb not null default '{}'::jsonb;
alter table public.jr_agent_runs add column if not exists execution_state text not null default 'not_started';
alter table public.jr_agent_runs add column if not exists execution_result jsonb;
alter table public.jr_agent_runs add column if not exists execution_started_at timestamptz;
alter table public.jr_agent_runs add column if not exists completed_at timestamptz;
alter table public.jr_agents drop constraint if exists jr_agents_connection_status_check;
alter table public.jr_agents add constraint jr_agents_connection_status_check check (connection_status in ('unconnected','connected','error'));
alter table public.jr_agent_runs drop constraint if exists jr_agent_runs_execution_state_check;
alter table public.jr_agent_runs add constraint jr_agent_runs_execution_state_check check (execution_state in ('not_started','running','completed','failed','unknown'));
create index if not exists jr_agent_runs_execution_queue_idx on public.jr_agent_runs(member_id,execution_state,created_at desc);
