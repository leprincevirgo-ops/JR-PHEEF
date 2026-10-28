# JR PHEEF, DGBO, and FAMILY — Connected Operating Architecture

**Status:** Architecture baseline for implementation. This document does not claim that the components below are already implemented.

## Purpose

Connect JR PHEEF, DGBO, and FAMILY as one coordinated ecosystem while preserving each environment's identity, data boundaries, leadership, and permissions. JR PHEEF coordinates approved cross-ecosystem activity; it does not automatically own or gain unrestricted access to DGBO or FAMILY data.

## Four components in each environment

Each environment has four distinct responsibilities:

1. **Intelligence** — research, analysis, evidence, forecasts, risks, opportunities, confidence, and source provenance.
2. **Command Center** — strategic overview, authorized decisions, priorities, and coordination.
3. **Control Room** — operational status, live task monitoring, incidents, alerts, service health, and response tracking.
4. **Control System** — policy enforcement, identity and role checks, approval gates, workflow permissions, and tamper-evident audit records.

These responsibilities should remain separate in code and permission design even if a user sees them in one dashboard.

## Environment responsibilities

### JR PHEEF
- Coordinate services, people, tools, knowledge, and approved requests across the ecosystem.
- Provide the authorized cross-ecosystem overview.
- Maintain shared integration contracts, identity boundaries, and platform health.
- Never bypass an environment's own policy or approval requirements.

### DGBO
- Own business and organizational operations, planning, performance, and business decisions.
- Keep business records and financial approvals within DGBO-authorized roles.
- Share only the minimum information explicitly approved for a cross-ecosystem task.

### FAMILY
- Coordinate family schedules, tasks, reminders, agreed plans, and continuity.
- Keep family relationships, communications, and private records isolated by default.
- Use age-appropriate protections and explicit consent for sharing; do not expose family data to business systems by default.

## Cross-ecosystem integration contract

All cross-environment requests must carry:
- request_id and timestamp;
- requesting identity and active environment;
- target environment and requested action;
- stated purpose and minimum data scope;
- required permission/approval and its result;
- status, result summary, and audit reference.

A request must be denied by default if identity, purpose, target, scope, or permission cannot be verified. A successful connection does not grant standing access to the target environment.

## Governance and security requirements

- Deny by default; least privilege; separate roles for reading, proposing, approving, and executing.
- Require explicit human approval for consequential, irreversible, financial, legal, account-access, or cross-environment actions.
- Record who proposed, approved, executed, and reviewed an action, without logging passwords, tokens, or unnecessary private content.
- Keep credentials and service secrets server-side; never expose service-role database keys to browsers.
- Isolate data by environment and user/family/business membership. Enforce authorization on the server and database, not only in the UI.
- Separate verified facts from estimates and interpretations; record sources, timestamps, and confidence for intelligence outputs.
- Provide revocation, incident response, recovery, backup, and audit-review procedures.
- Do not use a dashboard's visibility as proof that a user is authorized to perform an action.

## Succession and continuity

Each environment must define:
- primary and alternate responsible roles;
- a documented transfer-of-authority process with explicit approval;
- recovery access and emergency contacts stored securely outside source code;
- continuity procedures for critical services, business responsibilities, and family coordination;
- periodic review, audit history, and a way to revoke former leaders' access.

Succession must not permit a person to inherit access automatically without identity verification and the required authorization.

## Initial implementation stages

1. **Baseline and inventory:** map existing routes, tables, roles, authentication/session logic, and deployment status. Do not duplicate existing tables or alter customer data merely to match a diagram.
2. **Shared contracts:** define environment identifiers, component registry, request/approval state model, and audit event shape.
3. **Secure read-only overview:** show health and authorized status for JR PHEEF, DGBO, and FAMILY without merging private records.
4. **Control System enforcement:** add server-side authorization, explicit approval gates, and audit records before enabling write actions.
5. **Control Room:** add operational status and incident views based on verified telemetry.
6. **Command Centers:** add role-scoped priorities and decisions.
7. **Intelligence:** add sourced analysis with uncertainty and evidence trails.
8. **Continuity and succession:** exercise recovery and authority transfer in tests.
9. **Validation:** test account isolation, cross-environment denial by default, approvals, revocation, audit completeness, and failure recovery before production rollout.

## Acceptance criteria

- A JR PHEEF user cannot read private DGBO or FAMILY records without explicit authorization.
- A DGBO role cannot read FAMILY records by virtue of its DGBO role, and vice versa.
- Cross-environment actions are denied if approval or required scope is missing.
- Read-only overview works without returning private source records.
- Every consequential action has a traceable requester, approver (where required), outcome, and timestamp.
- Revoked users lose access; former leaders do not retain inherited access.
- Health, test, and deployment results are reported honestly; no component is labelled live until it is implemented and tested.

## Current implementation note

This file is the agreed architecture baseline. The next code changes should be based on the existing JR PHEEF server and Supabase schema after a route-by-route and role-by-role inventory. Keep changes in a feature branch and review them before merging into main.
