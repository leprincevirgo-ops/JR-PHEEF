"use strict";
const fs=require("node:fs"),assert=require("node:assert/strict"),vm=require("node:vm");
const server=fs.readFileSync("fresh/server.js","utf8");
const route=fs.readFileSync("fresh/routes/agent-universe.js","utf8");
const ui=fs.readFileSync("fresh/public/agent-universe.js","utf8");
const intelligence=fs.readFileSync("fresh/public/intelligence.js","utf8");
const styles=fs.readFileSync("fresh/public/styles.css","utf8");
const html=fs.readFileSync("fresh/public/index.html","utf8");
const app=fs.readFileSync("fresh/public/app.js","utf8");
const schema=fs.readFileSync("database/jr-agent-universe.sql","utf8");
const migration=fs.readFileSync("supabase/migrations/20261125171000_jr_agent_universe.sql","utf8");
const runtimeMigration=fs.readFileSync("supabase/migrations/20261125173000_jr_agent_mcp_runtime.sql","utf8");
const credentialMigration=fs.readFileSync("supabase/migrations/20261126110000_jr_agent_credential_vault.sql","utf8");
const a2aMigration=fs.readFileSync("supabase/migrations/20261125174500_jr_agent_a2a_runtime.sql","utf8");
new vm.Script(route);new vm.Script(ui);
for(const p of ["/api/agents","/api/agents/discover/mcp","/api/agents/discover/a2a","/api/agents/:id/connect","/api/agents/:id/credentials","/api/agents/:id/tools/:toolName/proposals","/api/agents/:id/a2a/proposals","/api/agents/runs/:runId/execute","/api/agents/runs/:runId/poll","/api/agents/:id","/api/agents/activity","/api/agents/:id/tasks","/api/agents/runs/:runId/decision"])assert.ok(route.includes(p),"Missing API route "+p);
for(const s of ["currentUser","provisionMember","sameOrigin","rateLimit"])assert.ok(route.includes(s),"Missing auth boundary "+s);
assert.ok(server.includes('require("./routes/agent-universe")'),"Active server does not mount agent routes");
assert.ok(html.includes('id="view-agents"')&&html.includes('id="jrauMount"'),"Agent workspace view is missing");
assert.ok(html.includes("/agent-universe.js")&&html.includes("/agent-universe.css"),"Agent assets are not loaded");
assert.ok(ui.includes("Discover agent blueprints")&&ui.includes("Browse the live MCP Registry")&&ui.includes("Discover A2A agents")&&ui.includes("searchA2a")&&ui.includes("searchMcp")&&ui.includes("Model Context Protocol (MCP)")&&ui.includes("Agent2Agent (A2A)"),"Agent discovery and protocol browser are missing");
assert.ok(app.includes('"/agents":"agents"')&&app.includes('agents:"/agents"'),"Workspace router is missing Agent Universe");
for(const s of ["enable row level security","owner_auth_id","auth.uid()","with check","grant select"])assert.ok(schema.toLowerCase().includes(s.toLowerCase()),"Missing database safeguard "+s);
for(const s of ["create table if not exists public.jr_agents","create table if not exists public.jr_agent_runs","enable row level security","owner_auth_id","auth.uid()","grant select"])assert.ok(migration.toLowerCase().includes(s.toLowerCase()),"Missing migration safeguard "+s);
assert.ok(route.includes('status:"paused"')&&route.includes('trust_status:"unverified"'),"Agents must start paused and unverified");
assert.ok(route.includes("approved_not_executed")&&route.includes("Execution still requires a separate command."),"Approval must not silently execute agents");
assert.ok(!route.includes("fetch(endpoint"),"No unreviewed external endpoint execution");
for(const s of ["aes-256-gcm","createCipheriv","createDecipheriv","JR_AGENT_VAULT_KEY","encrypted_credentials","bearerToken","Authorization","/api/agents/:id/credentials"])assert.ok(route.includes(s),"Missing encrypted credential safeguard "+s);
assert.ok(route.includes("encrypted_credentials:encrypted")&&route.includes("credential_saved:true"),"Agent credentials must be encrypted before storage");
assert.ok(!route.includes("encrypted_credentials,")&&!route.includes("encrypted_credentials:agent"),"Encrypted credentials must never be returned by public agent API fields");
assert.ok(credentialMigration.includes("encrypted_credentials")&&credentialMigration.includes("credential_updated_at"),"Credential vault schema is missing");
assert.ok(ui.includes("Provider bearer token (optional)")&&ui.includes("SAVE TOKEN")&&ui.includes("REMOVE TOKEN"),"Credential management UI is missing");
assert.ok(route.includes("credential_updated_at")&&ui.includes("Last checked ")&&ui.includes("bearer token saved")&&ui.includes("Last connection issue:"),"Agent health and credential status monitoring is missing");


for(const s of ["tools/list","tools/call","notifications/initialized","pinnedHttps","publicHost","execution_state","approved_not_executed","execution_state=eq.not_started","execution outcome is uncertain","validateSchema","Mcp-Session-Id","MCP-Protocol-Version"])assert.ok(route.includes(s),"Missing governed MCP runtime safeguard "+s);
assert.ok(route.includes('v==="active"')&&route.includes('connection_status!=="connected"'),"MCP agents must be connected before owner enablement");
assert.ok(route.includes('privateAgentFields=agentFields+",mcp_session_id,encrypted_credentials"'),"MCP session identifiers must remain server-side");
for(const s of ["endpoint_url","connection_status","mcp_session_id","mcp_tools","tool_arguments","execution_state","execution_result"])assert.ok(runtimeMigration.includes(s),"Missing MCP runtime database field "+s);
assert.ok(ui.includes("CONNECT & DISCOVER TOOLS")&&ui.includes("ENABLE AGENT")&&ui.includes("PROPOSE TOOL CALL")&&ui.includes("EXECUTE APPROVED TOOL")&&ui.includes("PROPOSE A2A TASK")&&ui.includes("SEND APPROVED A2A TASK")&&ui.includes("REFRESH A2A TASK STATUS"),"MCP connection and execution controls are missing");
for(const s of ["agentToolMap","jr_mcp_","jr_a2a_","function_call","function_call_output","createAgentProposal","agentProposals","parallel_tool_calls=false","status:\"awaiting_approval\"","execution_state:\"not_started\"","The member must review it in Agent Universe"])assert.ok(server.includes(s),"Missing JR conversation agent governance "+s);
assert.ok(server.includes("connection_status:\"eq.connected\"")&&server.includes("status:\"eq.active\""),"JR may only discover the signed-in member's active connected agents");
assert.ok(intelligence.includes("addAgentProposalCards")&&intelligence.includes("Review in Agent Universe"),"JR conversation does not surface agent proposals for member review");
assert.ok(styles.includes(".jr-agent-proposal-results"),"Agent proposal cards are not styled");


assert.ok(route.includes("registry.modelcontextprotocol.io/v0.1/servers"),"Official MCP Registry integration is missing");
for(const s of ["node:dns","node:https","node:net","dns.lookup","publicIp","redirect:\"error\"","AbortSignal.timeout(8000)","65536","agent-card.json","agent.json","agent_card_url"])assert.ok(route.includes(s),"Missing A2A discovery safeguard "+s);
assert.ok(route.includes("eu.hostname.toLowerCase()!==u.hostname.toLowerCase()"),"A2A bearer tokens must not be forwarded to a different host");

assert.ok(route.includes('endpoint_host:new URL(connection.endpoint).hostname')&&route.includes('endpoint_url:connection.endpoint'),"A2A Agent Card details are not returned for review");
assert.ok(migration.includes("agent_card_url"),"A2A Agent Card reference is not persisted");
for(const s of ["a2a_skills","a2a_protocol_version","a2a_task_id"])assert.ok(a2aMigration.includes(s),"Missing A2A runtime field "+s);
for(const s of ["fetchA2aCard","securitySchemes","message/send","tasks/get","a2a_message/send","a2a_task_id","supportedInterfaces","blocking:false"])assert.ok(route.includes(s),"Missing A2A runtime safeguard "+s);


console.log("PASS: JR Agent Universe active runtime, workspace routing, private API, ownership policies and execution guardrails.");
