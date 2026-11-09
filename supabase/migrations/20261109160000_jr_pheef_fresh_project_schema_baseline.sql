-- JR PHEEF fresh-project schema baseline.

-- Generated from production schema metadata only; no production rows, secrets, sessions or storage objects are copied.

-- Review this baseline before using it for any future production migration.

SET search_path TO public, extensions;

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

GRANT USAGE ON SCHEMA private TO service_role;

-- Tables and non-foreign-key constraints.

CREATE TABLE public."activity_log" (
  "id" text DEFAULT (gen_random_uuid())::text NOT NULL,
  "member_id" text,
  "action" text,
  "meta" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "activity_log_pkey" PRIMARY KEY (id)
);

CREATE TABLE public."ad_campaigns" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "listing_id" text,
  "category" text,
  "location" text,
  "budget_ksh" numeric DEFAULT 0 NOT NULL,
  "paid" boolean DEFAULT false NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "review_note" text,
  "starts_at" timestamp with time zone,
  "ends_at" timestamp with time zone,
  "impressions" integer DEFAULT 0 NOT NULL,
  "clicks" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "media_urls" text[] DEFAULT '{}'::text[] NOT NULL,
  CONSTRAINT "ad_campaigns_body_check" CHECK (char_length(body) >= 5 AND char_length(body) <= 300),
  CONSTRAINT "ad_campaigns_budget_ksh_check" CHECK (budget_ksh >= 0::numeric),
  CONSTRAINT "ad_campaigns_media_urls_limit" CHECK (cardinality(media_urls) <= 5),
  CONSTRAINT "ad_campaigns_pkey" PRIMARY KEY (id),
  CONSTRAINT "ad_campaigns_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'paused'::text, 'ended'::text])),
  CONSTRAINT "ad_campaigns_title_check" CHECK (char_length(title) >= 3 AND char_length(title) <= 80)
);

CREATE TABLE public."agent_actions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid NOT NULL,
  "kind" text NOT NULL,
  "risk" text DEFAULT 'low'::text NOT NULL,
  "summary" text NOT NULL,
  "payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "status" text DEFAULT 'proposed'::text NOT NULL,
  "auto" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "agent_actions_pkey" PRIMARY KEY (id),
  CONSTRAINT "agent_actions_risk_check" CHECK (risk = ANY (ARRAY['none'::text, 'low'::text, 'high'::text])),
  CONSTRAINT "agent_actions_status_check" CHECK (status = ANY (ARRAY['proposed'::text, 'done'::text, 'dismissed'::text, 'failed'::text]))
);

CREATE TABLE public."agent_settings" (
  "member_id" uuid NOT NULL,
  "autonomy" text DEFAULT 'ask'::text NOT NULL,
  "paused" boolean DEFAULT false NOT NULL,
  "spend_limit_ksh" numeric DEFAULT 0 NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "agent_settings_autonomy_check" CHECK (autonomy = ANY (ARRAY['ask'::text, 'low_risk'::text])),
  CONSTRAINT "agent_settings_pkey" PRIMARY KEY (member_id),
  CONSTRAINT "agent_settings_spend_limit_ksh_check" CHECK (spend_limit_ksh >= 0::numeric)
);

CREATE TABLE public."connections" (
  "id" text DEFAULT (gen_random_uuid())::text NOT NULL,
  "requester_id" text NOT NULL,
  "receiver_id" text NOT NULL,
  "status" text DEFAULT 'pending'::text,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "connections_pkey" PRIMARY KEY (id)
);

CREATE TABLE public."credit_requests" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" text NOT NULL,
  "requested_amount" numeric NOT NULL,
  "approved_amount" numeric DEFAULT 0,
  "principal" numeric DEFAULT 0,
  "interest_amount" numeric DEFAULT 0,
  "fees" numeric DEFAULT 0,
  "total_payable" numeric DEFAULT 0,
  "status" text DEFAULT 'disabled'::text,
  "provider" text DEFAULT 'JR_PHEEF_PENDING_PARTNER'::text,
  "purpose" text DEFAULT 'marketplace_access'::text,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "credit_requests_pkey" PRIMARY KEY (id)
);

CREATE TABLE public."dgbo_businesses" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "sector" text DEFAULT 'other'::text NOT NULL,
  "status" text DEFAULT 'planned'::text NOT NULL,
  "location" text,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "dgbo_businesses_name_check" CHECK (char_length(name) >= 2 AND char_length(name) <= 80),
  CONSTRAINT "dgbo_businesses_pkey" PRIMARY KEY (id),
  CONSTRAINT "dgbo_businesses_slug_key" UNIQUE (slug),
  CONSTRAINT "dgbo_businesses_status_check" CHECK (status = ANY (ARRAY['idea'::text, 'planned'::text, 'operating'::text, 'paused'::text]))
);

CREATE TABLE public."dgbo_decisions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "title" text NOT NULL,
  "venture" text,
  "details" text,
  "status" text DEFAULT 'proposed'::text NOT NULL,
  "proposed_by" uuid,
  "decided_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "decided_at" timestamp with time zone,
  CONSTRAINT "dgbo_decisions_pkey" PRIMARY KEY (id),
  CONSTRAINT "dgbo_decisions_status_check" CHECK (status = ANY (ARRAY['proposed'::text, 'approved'::text, 'rejected'::text])),
  CONSTRAINT "dgbo_decisions_title_check" CHECK (char_length(title) >= 3 AND char_length(title) <= 160)
);

CREATE TABLE public."ecosystem_events" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid,
  "venture" text NOT NULL,
  "type" text NOT NULL,
  "payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "ecosystem_events_pkey" PRIMARY KEY (id)
);

CREATE TABLE public."ecosystem_links" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid NOT NULL,
  "venture" text NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL,
  "consent_scopes" text[] DEFAULT '{}'::text[] NOT NULL,
  "joined_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "ecosystem_links_member_id_venture_key" UNIQUE (member_id, venture),
  CONSTRAINT "ecosystem_links_pkey" PRIMARY KEY (id),
  CONSTRAINT "ecosystem_links_status_check" CHECK (status = ANY (ARRAY['active'::text, 'waitlist'::text, 'left'::text]))
);

CREATE TABLE public."family_applications" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid NOT NULL,
  "kind" text NOT NULL,
  "amount" numeric NOT NULL,
  "purpose" text NOT NULL,
  "status" text DEFAULT 'recorded'::text NOT NULL,
  "partner_note" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "family_applications_amount_check" CHECK (amount > 0::numeric),
  CONSTRAINT "family_applications_kind_check" CHECK (kind = ANY (ARRAY['loan'::text, 'investment'::text, 'savings'::text])),
  CONSTRAINT "family_applications_pkey" PRIMARY KEY (id),
  CONSTRAINT "family_applications_purpose_check" CHECK (char_length(purpose) >= 3 AND char_length(purpose) <= 500),
  CONSTRAINT "family_applications_status_check" CHECK (status = ANY (ARRAY['recorded'::text, 'referred'::text, 'closed'::text]))
);

CREATE TABLE public."family_bank_accounts" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid NOT NULL,
  "account_type" text DEFAULT 'future_service'::text NOT NULL,
  "currency" character(3) DEFAULT 'KES'::bpchar NOT NULL,
  "status" text DEFAULT 'prelaunch'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "family_bank_accounts_currency_check" CHECK (currency ~ '^[A-Z]{3}$'::text),
  CONSTRAINT "family_bank_accounts_pkey" PRIMARY KEY (id),
  CONSTRAINT "family_bank_accounts_status_check" CHECK (status = ANY (ARRAY['prelaunch'::text, 'pending_review'::text, 'active'::text, 'frozen'::text, 'closed'::text])),
  CONSTRAINT "family_bank_accounts_type_check" CHECK (account_type = ANY (ARRAY['future_service'::text, 'savings'::text, 'current'::text, 'business'::text]))
);

CREATE TABLE public."family_bank_audit_events" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "actor_member_id" uuid,
  "subject_member_id" uuid,
  "event_type" text NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "family_bank_audit_events_pkey" PRIMARY KEY (id)
);

CREATE TABLE public."family_bank_ledger_batches" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "reference" text NOT NULL,
  "currency" character(3) DEFAULT 'KES'::bpchar NOT NULL,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "description" text NOT NULL,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "posted_at" timestamp with time zone,
  CONSTRAINT "family_bank_ledger_batches_pkey" PRIMARY KEY (id),
  CONSTRAINT "family_bank_ledger_batches_reference_key" UNIQUE (reference),
  CONSTRAINT "family_bank_ledger_currency_check" CHECK (currency ~ '^[A-Z]{3}$'::text),
  CONSTRAINT "family_bank_ledger_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'posted'::text, 'reversed'::text, 'void'::text]))
);

CREATE TABLE public."family_bank_ledger_entries" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "batch_id" uuid NOT NULL,
  "account_id" uuid NOT NULL,
  "entry_side" text NOT NULL,
  "amount" numeric(20,2) NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "family_bank_entry_side_check" CHECK (entry_side = ANY (ARRAY['debit'::text, 'credit'::text])),
  CONSTRAINT "family_bank_ledger_entries_amount_check" CHECK (amount > 0::numeric),
  CONSTRAINT "family_bank_ledger_entries_pkey" PRIMARY KEY (id)
);

CREATE TABLE public."family_bank_profiles" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid NOT NULL,
  "status" text DEFAULT 'prelaunch'::text NOT NULL,
  "kyc_status" text DEFAULT 'not_started'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "regulatory_notice" text DEFAULT 'Pre-launch only. No deposits, lending, stored value, or transfers are enabled.'::text NOT NULL,
  CONSTRAINT "family_bank_profiles_kyc_check" CHECK (kyc_status = ANY (ARRAY['not_started'::text, 'pending'::text, 'verified'::text, 'rejected'::text])),
  CONSTRAINT "family_bank_profiles_member_id_key" UNIQUE (member_id),
  CONSTRAINT "family_bank_profiles_pkey" PRIMARY KEY (id),
  CONSTRAINT "family_bank_profiles_status_check" CHECK (status = ANY (ARRAY['prelaunch'::text, 'review'::text, 'active'::text, 'restricted'::text, 'closed'::text]))
);

CREATE TABLE public."family_bank_service_requests" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid NOT NULL,
  "request_type" text NOT NULL,
  "details" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "status" text DEFAULT 'received'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "family_bank_requests_status_check" CHECK (status = ANY (ARRAY['received'::text, 'reviewing'::text, 'referred'::text, 'resolved'::text, 'declined'::text])),
  CONSTRAINT "family_bank_requests_type_check" CHECK (request_type = ANY (ARRAY['account_interest'::text, 'kyc_help'::text, 'licensed_partner_referral'::text, 'financial_education'::text, 'support'::text])),
  CONSTRAINT "family_bank_service_requests_pkey" PRIMARY KEY (id)
);

CREATE TABLE public."family_goals" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid NOT NULL,
  "title" text NOT NULL,
  "target_amount" numeric NOT NULL,
  "saved_amount" numeric DEFAULT 0 NOT NULL,
  "target_date" date,
  "status" text DEFAULT 'active'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "family_goals_pkey" PRIMARY KEY (id),
  CONSTRAINT "family_goals_saved_amount_check" CHECK (saved_amount >= 0::numeric),
  CONSTRAINT "family_goals_status_check" CHECK (status = ANY (ARRAY['active'::text, 'achieved'::text, 'paused'::text])),
  CONSTRAINT "family_goals_target_amount_check" CHECK (target_amount > 0::numeric),
  CONSTRAINT "family_goals_title_check" CHECK (char_length(title) >= 2 AND char_length(title) <= 120)
);

CREATE TABLE public."feature_requests" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid,
  "body" text NOT NULL,
  "summary" text,
  "status" text DEFAULT 'new'::text NOT NULL,
  "owner_note" text,
  "votes" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "feature_requests_body_check" CHECK (char_length(body) >= 5 AND char_length(body) <= 2000),
  CONSTRAINT "feature_requests_pkey" PRIMARY KEY (id),
  CONSTRAINT "feature_requests_status_check" CHECK (status = ANY (ARRAY['new'::text, 'planned'::text, 'building'::text, 'done'::text, 'declined'::text]))
);

CREATE TABLE public."feature_votes" (
  "request_id" uuid NOT NULL,
  "member_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "feature_votes_pkey" PRIMARY KEY (request_id, member_id)
);

CREATE TABLE public."file_vault" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid NOT NULL,
  "object_path" text NOT NULL,
  "file_name" text NOT NULL,
  "mime_type" text NOT NULL,
  "size_bytes" bigint NOT NULL,
  "category" text DEFAULT 'personal'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "file_vault_object_path_key" UNIQUE (object_path),
  CONSTRAINT "file_vault_pkey" PRIMARY KEY (id),
  CONSTRAINT "file_vault_size_bytes_check" CHECK (size_bytes >= 0)
);

CREATE TABLE public."jr_action_proposals" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid NOT NULL,
  "action_key" text NOT NULL,
  "summary" text NOT NULL,
  "risk_level" text NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "requires_confirmation" boolean DEFAULT true NOT NULL,
  "idempotency_key" text,
  "expires_at" timestamp with time zone DEFAULT (now() + '24:00:00'::interval) NOT NULL,
  "decided_at" timestamp with time zone,
  "executed_at" timestamp with time zone,
  "result_summary" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "jr_action_proposals_action_key_check" CHECK (action_key ~ '^[a-z][a-z0-9_.:-]{1,79}$'::text),
  CONSTRAINT "jr_action_proposals_idempotency_key_check" CHECK (idempotency_key IS NULL OR char_length(idempotency_key) >= 8 AND char_length(idempotency_key) <= 100),
  CONSTRAINT "jr_action_proposals_member_id_idempotency_key_key" UNIQUE (member_id, idempotency_key),
  CONSTRAINT "jr_action_proposals_pkey" PRIMARY KEY (id),
  CONSTRAINT "jr_action_proposals_result_summary_check" CHECK (result_summary IS NULL OR char_length(result_summary) <= 500),
  CONSTRAINT "jr_action_proposals_risk_level_check" CHECK (risk_level = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'critical'::text])),
  CONSTRAINT "jr_action_proposals_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'expired'::text, 'executed'::text, 'failed'::text])),
  CONSTRAINT "jr_action_proposals_summary_check" CHECK (char_length(btrim(summary)) >= 5 AND char_length(btrim(summary)) <= 280)
);

CREATE TABLE public."jr_blocks" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid,
  "blocked_id" uuid,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "jr_blocks_member_id_blocked_id_key" UNIQUE (member_id, blocked_id),
  CONSTRAINT "jr_blocks_pkey" PRIMARY KEY (id)
);

CREATE TABLE public."jr_business_daily_plans" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "plan_date" date NOT NULL,
  "plan" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "source" text DEFAULT 'template'::text NOT NULL,
  "status" text DEFAULT 'ready'::text NOT NULL,
  "completed_tasks" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "jr_business_daily_plans_business_id_plan_date_key" UNIQUE (business_id, plan_date),
  CONSTRAINT "jr_business_daily_plans_pkey" PRIMARY KEY (id),
  CONSTRAINT "jr_business_daily_plans_source_check" CHECK (source = ANY (ARRAY['ai'::text, 'template'::text])),
  CONSTRAINT "jr_business_daily_plans_status_check" CHECK (status = ANY (ARRAY['ready'::text, 'in_progress'::text, 'completed'::text, 'dismissed'::text]))
);

CREATE TABLE public."jr_business_import_jobs" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "requested_by" uuid NOT NULL,
  "source_system" text,
  "source_type" text NOT NULL,
  "data_domains" text[] DEFAULT '{}'::text[] NOT NULL,
  "status" text DEFAULT 'draft'::text NOT NULL,
  "file_reference" text,
  "mapping" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "validation_summary" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "consent_confirmed" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "jr_business_import_jobs_pkey" PRIMARY KEY (id),
  CONSTRAINT "jr_business_import_jobs_source_type_check" CHECK (source_type = ANY (ARRAY['csv'::text, 'xlsx'::text, 'json'::text, 'xml'::text, 'database_backup'::text, 'api_connector'::text, 'documents'::text, 'other'::text])),
  CONSTRAINT "jr_business_import_jobs_status_check" CHECK (status = ANY (ARRAY['draft'::text, 'uploaded'::text, 'scanning'::text, 'needs_mapping'::text, 'preview_ready'::text, 'approved'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'cancelled'::text]))
);

CREATE TABLE public."jr_business_workspace_members" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "member_id" uuid NOT NULL,
  "role_key" text DEFAULT 'staff'::text NOT NULL,
  "permissions" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "status" text DEFAULT 'invited'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "jr_business_workspace_members_business_id_member_id_key" UNIQUE (business_id, member_id),
  CONSTRAINT "jr_business_workspace_members_pkey" PRIMARY KEY (id),
  CONSTRAINT "jr_business_workspace_members_status_check" CHECK (status = ANY (ARRAY['invited'::text, 'active'::text, 'suspended'::text, 'removed'::text]))
);

CREATE TABLE public."jr_business_workspaces" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "owner_member_id" uuid NOT NULL,
  "business_name" text NOT NULL,
  "sector" text DEFAULT 'other'::text NOT NULL,
  "location" text,
  "goals" text,
  "plan_tier" text DEFAULT 'free'::text NOT NULL,
  "daily_plan_enabled" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "slug" text,
  "description" text,
  "legal_entity_name" text,
  "registration_country" text,
  "operating_countries" text[] DEFAULT '{}'::text[] NOT NULL,
  "base_currency" text,
  "timezone" text,
  "primary_language" text,
  "status" text DEFAULT 'setup'::text NOT NULL,
  "template_version" text DEFAULT '1.0'::text NOT NULL,
  "workspace_config" jsonb DEFAULT '{}'::jsonb NOT NULL,
  CONSTRAINT "jr_business_workspaces_business_name_check" CHECK (char_length(business_name) >= 2 AND char_length(business_name) <= 160),
  CONSTRAINT "jr_business_workspaces_pkey" PRIMARY KEY (id),
  CONSTRAINT "jr_business_workspaces_plan_tier_check" CHECK (plan_tier = ANY (ARRAY['free'::text, 'pro'::text, 'prime'::text, 'enterprise'::text]))
);

CREATE TABLE public."jr_capability_permissions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid NOT NULL,
  "capability_key" text NOT NULL,
  "enabled" boolean DEFAULT false NOT NULL,
  "scope" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "jr_capability_permissions_capability_key_check" CHECK (capability_key = ANY (ARRAY['learning'::text, 'discovery'::text, 'creation'::text, 'projects'::text, 'marketplace'::text, 'business_operations'::text, 'connections'::text, 'private_files'::text, 'notifications'::text])),
  CONSTRAINT "jr_capability_permissions_member_id_capability_key_key" UNIQUE (member_id, capability_key),
  CONSTRAINT "jr_capability_permissions_pkey" PRIMARY KEY (id),
  CONSTRAINT "jr_capability_permissions_scope_check" CHECK (jsonb_typeof(scope) = 'object'::text)
);

CREATE TABLE public."jr_conversation_participants" (
  "conversation_id" uuid NOT NULL,
  "member_id" uuid NOT NULL,
  "joined_at" timestamp with time zone DEFAULT now() NOT NULL,
  "last_read_at" timestamp with time zone,
  CONSTRAINT "jr_conversation_participants_pkey" PRIMARY KEY (conversation_id, member_id)
);

CREATE TABLE public."jr_conversations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "created_by" uuid NOT NULL,
  "title" text,
  "is_group" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "jr_conversations_check" CHECK (is_group AND title IS NOT NULL OR NOT is_group AND title IS NULL),
  CONSTRAINT "jr_conversations_pkey" PRIMARY KEY (id),
  CONSTRAINT "jr_conversations_title_check" CHECK (title IS NULL OR char_length(title) >= 1 AND char_length(title) <= 80)
);

CREATE TABLE public."jr_coupon_users" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "coupon_id" uuid,
  "member_id" uuid,
  "used_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "jr_coupon_users_coupon_id_member_id_key" UNIQUE (coupon_id, member_id),
  CONSTRAINT "jr_coupon_users_pkey" PRIMARY KEY (id)
);

CREATE TABLE public."jr_coupons" (
  "code" text NOT NULL,
  "discount" numeric DEFAULT 0,
  "active" boolean DEFAULT true,
  "max_uses" integer DEFAULT 100,
  "uses" integer DEFAULT 0,
  CONSTRAINT "jr_coupons_pkey" PRIMARY KEY (code)
);

CREATE TABLE public."jr_deal_messages" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "room_id" uuid NOT NULL,
  "sender_id" uuid NOT NULL,
  "body" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "jr_deal_messages_body_check" CHECK (char_length(body) >= 1 AND char_length(body) <= 2000),
  CONSTRAINT "jr_deal_messages_pkey" PRIMARY KEY (id)
);

CREATE TABLE public."jr_deal_rooms" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "buyer_id" uuid,
  "seller_id" uuid,
  "listing_id" text,
  "amount" numeric DEFAULT 0,
  "fee" numeric DEFAULT 0,
  "status" text DEFAULT 'open'::text,
  "created_at" timestamp with time zone DEFAULT now(),
  "offer_amount" numeric,
  "buyer_agreed" boolean DEFAULT false,
  "seller_agreed" boolean DEFAULT false,
  "updated_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "jr_deal_rooms_pkey" PRIMARY KEY (id),
  CONSTRAINT "jr_deal_rooms_status_check" CHECK (status = ANY (ARRAY['open'::text, 'agreed'::text, 'completed'::text, 'cancelled'::text]))
);

CREATE TABLE public."jr_delivery_requests" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "requester_id" uuid,
  "rider_id" uuid,
  "pickup" text,
  "destination" text,
  "description" text,
  "price" numeric DEFAULT 0,
  "status" text DEFAULT 'open'::text,
  "created_at" timestamp with time zone DEFAULT now(),
  "listing_id" text,
  "accepted_at" timestamp with time zone,
  "delivered_at" timestamp with time zone,
  "updated_at" timestamp with time zone DEFAULT now(),
  "commission" numeric DEFAULT 0,
  "pickup_notes" text,
  CONSTRAINT "jr_delivery_requests_pkey" PRIMARY KEY (id),
  CONSTRAINT "jr_delivery_requests_status_check" CHECK (status = ANY (ARRAY['open'::text, 'accepted'::text, 'picked_up'::text, 'delivered'::text, 'cancelled'::text])),
  CONSTRAINT "jr_delivery_status_check" CHECK (status = ANY (ARRAY['open'::text, 'accepted'::text, 'picked_up'::text, 'delivered'::text, 'cancelled'::text]))
);

CREATE TABLE public."jr_errand_events" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "errand_id" uuid NOT NULL,
  "actor_id" uuid,
  "kind" text NOT NULL,
  "detail" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "jr_errand_events_pkey" PRIMARY KEY (id)
);

CREATE TABLE public."jr_errands" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "requester_id" uuid NOT NULL,
  "recipient_id" uuid,
  "recipient_name" text,
  "seller_id" uuid,
  "listing_id" text,
  "title" text NOT NULL,
  "items" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "budget_ksh" numeric,
  "pickup" text,
  "destination" text NOT NULL,
  "notes" text,
  "quote_ksh" numeric,
  "delivery_fee_ksh" numeric,
  "delivery_id" uuid,
  "status" text DEFAULT 'requested'::text NOT NULL,
  "payment_status" text DEFAULT 'unpaid'::text NOT NULL,
  "payment_note" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "jr_errands_budget_ksh_check" CHECK (budget_ksh IS NULL OR budget_ksh >= 0::numeric),
  CONSTRAINT "jr_errands_delivery_fee_ksh_check" CHECK (delivery_fee_ksh IS NULL OR delivery_fee_ksh >= 0::numeric),
  CONSTRAINT "jr_errands_destination_check" CHECK (char_length(destination) >= 3 AND char_length(destination) <= 200),
  CONSTRAINT "jr_errands_payment_status_check" CHECK (payment_status = ANY (ARRAY['unpaid'::text, 'claimed'::text, 'confirmed'::text])),
  CONSTRAINT "jr_errands_pkey" PRIMARY KEY (id),
  CONSTRAINT "jr_errands_quote_ksh_check" CHECK (quote_ksh IS NULL OR quote_ksh >= 0::numeric),
  CONSTRAINT "jr_errands_status_check" CHECK (status = ANY (ARRAY['requested'::text, 'quoted'::text, 'accepted'::text, 'paid'::text, 'completed'::text, 'cancelled'::text, 'declined'::text])),
  CONSTRAINT "jr_errands_title_check" CHECK (char_length(title) >= 3 AND char_length(title) <= 120)
);

CREATE TABLE public."jr_growth_journal" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid NOT NULL,
  "event_kind" text NOT NULL,
  "world_key" text,
  "title" text NOT NULL,
  "detail" text DEFAULT ''::text NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "jr_growth_journal_detail_check" CHECK (char_length(detail) <= 2000),
  CONSTRAINT "jr_growth_journal_event_kind_check" CHECK (event_kind = ANY (ARRAY['interaction'::text, 'milestone'::text, 'reflection'::text, 'learning'::text, 'creation'::text, 'work'::text, 'connection'::text, 'resume'::text])),
  CONSTRAINT "jr_growth_journal_metadata_check" CHECK (jsonb_typeof(metadata) = 'object'::text),
  CONSTRAINT "jr_growth_journal_pkey" PRIMARY KEY (id),
  CONSTRAINT "jr_growth_journal_title_check" CHECK (char_length(btrim(title)) >= 2 AND char_length(btrim(title)) <= 140),
  CONSTRAINT "jr_growth_journal_world_key_check" CHECK (world_key IS NULL OR (world_key = ANY (ARRAY['personal'::text, 'learning'::text, 'creative'::text, 'work'::text, 'business'::text, 'opportunities'::text, 'relationships'::text, 'community'::text, 'family'::text, 'civic'::text, 'exploration'::text, 'health'::text, 'culture'::text])))
);

CREATE TABLE public."jr_listings" (
  "id" text DEFAULT (gen_random_uuid())::text NOT NULL,
  "member_id" uuid,
  "title" text,
  "description" text,
  "price" numeric,
  "location" text,
  "category" text,
  "photos" jsonb DEFAULT '[]'::jsonb,
  "status" text DEFAULT 'active'::text,
  "created_at" timestamp with time zone DEFAULT now(),
  "seller_name" text,
  "phone" text,
  "item_name" text,
  "condition" text,
  "negotiable" boolean DEFAULT false,
  "updated_at" timestamp with time zone DEFAULT now(),
  "views" integer DEFAULT 0,
  "original_price" numeric,
  "promo_ends_at" timestamp with time zone,
  "featured_until" timestamp with time zone,
  "promo_label" text,
  CONSTRAINT "jr_listings_pkey" PRIMARY KEY (id)
);

CREATE TABLE public."jr_member_preferences" (
  "member_id" uuid NOT NULL,
  "preferences" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "jr_member_preferences_object" CHECK (jsonb_typeof(preferences) = 'object'::text),
  CONSTRAINT "jr_member_preferences_pkey" PRIMARY KEY (member_id)
);

CREATE TABLE public."jr_member_state" (
  "member_id" uuid NOT NULL,
  "state" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "jr_member_state_pkey" PRIMARY KEY (member_id),
  CONSTRAINT "jr_member_state_state_check" CHECK (jsonb_typeof(state) = 'object'::text)
);

CREATE TABLE public."jr_memberships" (
  "member_id" uuid NOT NULL,
  "plan" text DEFAULT 'free'::text,
  "price" numeric DEFAULT 0,
  "match_fee" numeric DEFAULT 30,
  "expires_at" timestamp with time zone,
  "updated_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "jr_memberships_pkey" PRIMARY KEY (member_id)
);

CREATE TABLE public."jr_memory_items" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid NOT NULL,
  "memory_kind" text NOT NULL,
  "memory_text" text NOT NULL,
  "consent_ai_context" boolean DEFAULT false NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "source" text DEFAULT 'member_entered'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "jr_memory_items_memory_kind_check" CHECK (memory_kind = ANY (ARRAY['preference'::text, 'goal'::text, 'project_context'::text, 'workflow'::text, 'non_sensitive_fact'::text])),
  CONSTRAINT "jr_memory_items_memory_text_check" CHECK (char_length(btrim(memory_text)) >= 3 AND char_length(btrim(memory_text)) <= 1000),
  CONSTRAINT "jr_memory_items_pkey" PRIMARY KEY (id),
  CONSTRAINT "jr_memory_items_source_check" CHECK (source = ANY (ARRAY['member_entered'::text, 'member_confirmed'::text]))
);

CREATE TABLE public."jr_messages" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "conversation_id" uuid NOT NULL,
  "sender_id" uuid NOT NULL,
  "body" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "jr_messages_body_check" CHECK (char_length(btrim(body)) >= 1 AND char_length(btrim(body)) <= 4000),
  CONSTRAINT "jr_messages_pkey" PRIMARY KEY (id)
);

CREATE TABLE public."jr_notifications" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid,
  "title" text,
  "message" text,
  "type" text,
  "read" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "jr_notifications_pkey" PRIMARY KEY (id)
);

CREATE TABLE public."jr_opportunities" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "owner_user_id" uuid NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "opportunity_type" text DEFAULT 'business_opportunity'::text NOT NULL,
  "availability_status" text DEFAULT 'available_now'::text NOT NULL,
  "audience_scope" text DEFAULT 'local_and_international'::text NOT NULL,
  "country_code" text,
  "location" text,
  "eligible_regions" text[] DEFAULT '{}'::text[] NOT NULL,
  "offer_details" text DEFAULT ''::text NOT NULL,
  "requirements" text DEFAULT ''::text NOT NULL,
  "commercial_terms" text DEFAULT ''::text NOT NULL,
  "currency_code" character(3),
  "deadline_at" timestamp with time zone,
  "publication_status" text DEFAULT 'published'::text NOT NULL,
  "verification_status" text DEFAULT 'unverified'::text NOT NULL,
  "report_count" integer DEFAULT 0 NOT NULL,
  "published_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "jr_opportunities_audience_scope_check" CHECK (audience_scope = ANY (ARRAY['local'::text, 'national'::text, 'international'::text, 'local_and_international'::text, 'remote'::text])),
  CONSTRAINT "jr_opportunities_availability_status_check" CHECK (availability_status = ANY (ARRAY['available_now'::text, 'coming_soon'::text, 'seeking_interest'::text, 'recurring'::text])),
  CONSTRAINT "jr_opportunities_country_code_check" CHECK (country_code IS NULL OR country_code ~ '^[A-Z]{2}$'::text),
  CONSTRAINT "jr_opportunities_currency_code_check" CHECK (currency_code IS NULL OR currency_code ~ '^[A-Z]{3}$'::text),
  CONSTRAINT "jr_opportunities_description_check" CHECK (char_length(btrim(description)) >= 10 AND char_length(btrim(description)) <= 5000),
  CONSTRAINT "jr_opportunities_opportunity_type_check" CHECK (opportunity_type = 'business_opportunity'::text),
  CONSTRAINT "jr_opportunities_pkey" PRIMARY KEY (id),
  CONSTRAINT "jr_opportunities_publication_status_check" CHECK (publication_status = ANY (ARRAY['draft'::text, 'pending_review'::text, 'published'::text, 'closed'::text, 'expired'::text, 'removed'::text])),
  CONSTRAINT "jr_opportunities_report_count_check" CHECK (report_count >= 0),
  CONSTRAINT "jr_opportunities_title_check" CHECK (char_length(btrim(title)) >= 3 AND char_length(btrim(title)) <= 140),
  CONSTRAINT "jr_opportunities_verification_status_check" CHECK (verification_status = ANY (ARRAY['unverified'::text, 'pending'::text, 'verified'::text, 'rejected'::text]))
);

CREATE TABLE public."jr_opportunity_interests" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "opportunity_id" uuid NOT NULL,
  "member_id" uuid NOT NULL,
  "message" text DEFAULT ''::text NOT NULL,
  "status" text DEFAULT 'pending'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "jr_opportunity_interests_message_check" CHECK (char_length(message) <= 1500),
  CONSTRAINT "jr_opportunity_interests_opportunity_id_member_id_key" UNIQUE (opportunity_id, member_id),
  CONSTRAINT "jr_opportunity_interests_pkey" PRIMARY KEY (id),
  CONSTRAINT "jr_opportunity_interests_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text, 'withdrawn'::text]))
);

CREATE TABLE public."jr_opportunity_reports" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "opportunity_id" uuid NOT NULL,
  "reporter_member_id" uuid NOT NULL,
  "reason" text NOT NULL,
  "details" text DEFAULT ''::text NOT NULL,
  "review_status" text DEFAULT 'pending'::text NOT NULL,
  "reviewed_by" uuid,
  "reviewed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "jr_opportunity_reports_details_check" CHECK (char_length(details) <= 1500),
  CONSTRAINT "jr_opportunity_reports_opportunity_id_reporter_member_id_key" UNIQUE (opportunity_id, reporter_member_id),
  CONSTRAINT "jr_opportunity_reports_pkey" PRIMARY KEY (id),
  CONSTRAINT "jr_opportunity_reports_reason_check" CHECK (reason = ANY (ARRAY['misleading'::text, 'spam'::text, 'impersonation'::text, 'prohibited'::text, 'contact_bypass'::text, 'other'::text])),
  CONSTRAINT "jr_opportunity_reports_review_status_check" CHECK (review_status = ANY (ARRAY['pending'::text, 'reviewing'::text, 'actioned'::text, 'dismissed'::text]))
);

CREATE TABLE public."jr_org_members" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid,
  "member_id" uuid,
  "role" text DEFAULT 'staff'::text,
  "status" text DEFAULT 'active'::text,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "jr_org_members_organization_id_member_id_key" UNIQUE (organization_id, member_id),
  CONSTRAINT "jr_org_members_pkey" PRIMARY KEY (id)
);

CREATE TABLE public."jr_organizations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "owner_id" uuid,
  "name" text NOT NULL,
  "type" text,
  "description" text,
  "logo_url" text,
  "location" text,
  "country" text,
  "verified" boolean DEFAULT false,
  "status" text DEFAULT 'pending'::text,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "jr_organizations_pkey" PRIMARY KEY (id)
);

CREATE TABLE public."jr_partner_connections" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid NOT NULL,
  "name" text NOT NULL,
  "token_hash" text NOT NULL,
  "scopes" text[] DEFAULT ARRAY['events:write'::text] NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "last_used_at" timestamp with time zone,
  "revoked_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "jr_partner_connections_name_check" CHECK (char_length(btrim(name)) >= 3 AND char_length(btrim(name)) <= 60),
  CONSTRAINT "jr_partner_connections_pkey" PRIMARY KEY (id),
  CONSTRAINT "jr_partner_connections_scopes_check" CHECK (scopes <@ ARRAY['events:write'::text]),
  CONSTRAINT "jr_partner_connections_token_hash_check" CHECK (token_hash ~ '^[a-f0-9]{64}$'::text),
  CONSTRAINT "jr_partner_connections_token_hash_key" UNIQUE (token_hash)
);

CREATE TABLE public."jr_partner_events" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid NOT NULL,
  "connection_id" uuid NOT NULL,
  "event_type" text NOT NULL,
  "title" text NOT NULL,
  "summary" text NOT NULL,
  "external_event_id" text NOT NULL,
  "occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
  "received_at" timestamp with time zone DEFAULT now() NOT NULL,
  "event_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
  CONSTRAINT "jr_partner_events_connection_id_external_event_id_key" UNIQUE (connection_id, external_event_id),
  CONSTRAINT "jr_partner_events_event_data_check" CHECK (jsonb_typeof(event_data) = 'object'::text),
  CONSTRAINT "jr_partner_events_event_type_check" CHECK (event_type = ANY (ARRAY['status_update'::text, 'task_update'::text, 'inventory_update'::text, 'delivery_update'::text, 'message_received'::text, 'calendar_update'::text, 'other'::text])),
  CONSTRAINT "jr_partner_events_external_event_id_check" CHECK (char_length(external_event_id) >= 3 AND char_length(external_event_id) <= 120),
  CONSTRAINT "jr_partner_events_pkey" PRIMARY KEY (id),
  CONSTRAINT "jr_partner_events_summary_check" CHECK (char_length(btrim(summary)) >= 2 AND char_length(btrim(summary)) <= 500),
  CONSTRAINT "jr_partner_events_title_check" CHECK (char_length(btrim(title)) >= 2 AND char_length(btrim(title)) <= 100)
);

CREATE TABLE public."jr_payments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid,
  "deal_id" uuid,
  "amount" numeric DEFAULT 0,
  "currency" text DEFAULT 'KES'::text,
  "method" text,
  "reference" text,
  "status" text DEFAULT 'pending'::text,
  "created_at" timestamp with time zone DEFAULT now(),
  "purpose" text,
  "ref_id" text,
  "phone" text,
  "checkout_request_id" text,
  "merchant_request_id" text,
  "mpesa_receipt" text,
  "result_code" integer,
  "result_desc" text,
  "updated_at" timestamp with time zone DEFAULT now(),
  "raw_callback" jsonb,
  CONSTRAINT "jr_payments_pkey" PRIMARY KEY (id)
);

CREATE TABLE public."jr_project_tasks" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL,
  "title" text NOT NULL,
  "detail" text,
  "category" text,
  "status" text DEFAULT 'todo'::text NOT NULL,
  "est_cost_ksh" numeric,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "jr_project_tasks_est_cost_ksh_check" CHECK (est_cost_ksh IS NULL OR est_cost_ksh >= 0::numeric),
  CONSTRAINT "jr_project_tasks_pkey" PRIMARY KEY (id),
  CONSTRAINT "jr_project_tasks_status_check" CHECK (status = ANY (ARRAY['todo'::text, 'doing'::text, 'done'::text])),
  CONSTRAINT "jr_project_tasks_title_check" CHECK (char_length(title) >= 2 AND char_length(title) <= 160)
);

CREATE TABLE public."jr_projects" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid NOT NULL,
  "title" text NOT NULL,
  "goal" text NOT NULL,
  "budget_ksh" numeric,
  "status" text DEFAULT 'planning'::text NOT NULL,
  "summary" text,
  "risks" text[] DEFAULT '{}'::text[] NOT NULL,
  "ai_generated" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "jr_projects_budget_ksh_check" CHECK (budget_ksh IS NULL OR budget_ksh >= 0::numeric),
  CONSTRAINT "jr_projects_goal_check" CHECK (char_length(goal) >= 5 AND char_length(goal) <= 2000),
  CONSTRAINT "jr_projects_pkey" PRIMARY KEY (id),
  CONSTRAINT "jr_projects_status_check" CHECK (status = ANY (ARRAY['planning'::text, 'active'::text, 'paused'::text, 'done'::text])),
  CONSTRAINT "jr_projects_title_check" CHECK (char_length(title) >= 3 AND char_length(title) <= 140)
);

CREATE TABLE public."jr_referrals" (
  "id" text DEFAULT (gen_random_uuid())::text NOT NULL,
  "referrer_id" uuid,
  "referred_id" uuid,
  "reward" numeric DEFAULT 0,
  "status" text DEFAULT 'pending'::text,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "jr_referrals_pkey" PRIMARY KEY (id),
  CONSTRAINT "jr_referrals_status_check" CHECK (status = ANY (ARRAY['pending'::text, 'verified'::text, 'qualified'::text, 'rejected'::text]))
);

CREATE TABLE public."jr_reports" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "reporter_id" uuid,
  "reported_id" uuid,
  "message_id" uuid,
  "reason" text,
  "status" text DEFAULT 'pending'::text,
  "created_at" timestamp with time zone DEFAULT now(),
  "listing_id" text,
  "details" text,
  "post_id" uuid,
  CONSTRAINT "jr_reports_pkey" PRIMARY KEY (id)
);

CREATE TABLE public."jr_rewards" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid,
  "amount" numeric DEFAULT 0,
  "reason" text,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "jr_rewards_pkey" PRIMARY KEY (id)
);

CREATE TABLE public."jr_riders" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid,
  "company_name" text,
  "vehicle_type" text,
  "vehicle_number" text,
  "location" text,
  "latitude" numeric,
  "longitude" numeric,
  "online" boolean DEFAULT false,
  "verified" boolean DEFAULT false,
  "approved" boolean DEFAULT false,
  "rating" numeric DEFAULT 5,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "jr_riders_pkey" PRIMARY KEY (id)
);

CREATE TABLE public."jr_security_events" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid NOT NULL,
  "event_type" text NOT NULL,
  "resource_type" text NOT NULL,
  "resource_id" text,
  "summary" text NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "jr_security_events_event_type_check" CHECK (char_length(event_type) >= 2 AND char_length(event_type) <= 80),
  CONSTRAINT "jr_security_events_metadata_check" CHECK (jsonb_typeof(metadata) = 'object'::text),
  CONSTRAINT "jr_security_events_pkey" PRIMARY KEY (id),
  CONSTRAINT "jr_security_events_resource_id_check" CHECK (resource_id IS NULL OR char_length(resource_id) <= 120),
  CONSTRAINT "jr_security_events_resource_type_check" CHECK (char_length(resource_type) >= 2 AND char_length(resource_type) <= 80),
  CONSTRAINT "jr_security_events_summary_check" CHECK (char_length(summary) >= 2 AND char_length(summary) <= 280)
);

CREATE TABLE public."jr_status_updates" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid NOT NULL,
  "body" text NOT NULL,
  "background" text DEFAULT 'ocean'::text NOT NULL,
  "visibility" text DEFAULT 'connections'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone DEFAULT (now() + '24:00:00'::interval) NOT NULL,
  CONSTRAINT "jr_status_updates_background_check" CHECK (background = ANY (ARRAY['ocean'::text, 'violet'::text, 'sunset'::text, 'emerald'::text, 'midnight'::text, 'rose'::text])),
  CONSTRAINT "jr_status_updates_body_check" CHECK (char_length(body) >= 1 AND char_length(body) <= 700),
  CONSTRAINT "jr_status_updates_pkey" PRIMARY KEY (id),
  CONSTRAINT "jr_status_updates_visibility_check" CHECK (visibility = ANY (ARRAY['connections'::text, 'everyone'::text]))
);

CREATE TABLE public."jr_status_views" (
  "status_id" uuid NOT NULL,
  "viewer_id" uuid NOT NULL,
  "viewed_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "jr_status_views_pkey" PRIMARY KEY (status_id, viewer_id)
);

CREATE TABLE public."jr_world_progress" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid NOT NULL,
  "world_key" text NOT NULL,
  "stage" text DEFAULT 'discovering'::text NOT NULL,
  "progress" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "last_position" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "last_interaction_at" timestamp with time zone DEFAULT now() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "jr_world_progress_last_position_check" CHECK (jsonb_typeof(last_position) = 'object'::text),
  CONSTRAINT "jr_world_progress_member_id_world_key_key" UNIQUE (member_id, world_key),
  CONSTRAINT "jr_world_progress_pkey" PRIMARY KEY (id),
  CONSTRAINT "jr_world_progress_progress_check" CHECK (jsonb_typeof(progress) = 'object'::text),
  CONSTRAINT "jr_world_progress_stage_check" CHECK (stage = ANY (ARRAY['discovering'::text, 'learning'::text, 'practising'::text, 'building'::text, 'contributing'::text, 'paused'::text])),
  CONSTRAINT "jr_world_progress_world_key_check" CHECK (world_key = ANY (ARRAY['personal'::text, 'learning'::text, 'creative'::text, 'work'::text, 'business'::text, 'opportunities'::text, 'relationships'::text, 'community'::text, 'family'::text, 'civic'::text, 'exploration'::text, 'health'::text, 'culture'::text]))
);

CREATE TABLE public."knowledge_articles" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "slug" text NOT NULL,
  "title" text NOT NULL,
  "domain" text NOT NULL,
  "summary" text NOT NULL,
  "content" text DEFAULT ''::text NOT NULL,
  "tags" text[] DEFAULT '{}'::text[] NOT NULL,
  "source_name" text,
  "source_url" text,
  "source_published_at" date,
  "evidence_status" text DEFAULT 'needs_review'::text NOT NULL,
  "visibility" text DEFAULT 'published'::text NOT NULL,
  "created_by" uuid,
  "reviewed_by" uuid,
  "reviewed_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "knowledge_articles_evidence_status_check" CHECK (evidence_status = ANY (ARRAY['needs_review'::text, 'internally_reviewed'::text, 'source_verified'::text, 'disputed'::text])),
  CONSTRAINT "knowledge_articles_pkey" PRIMARY KEY (id),
  CONSTRAINT "knowledge_articles_slug_key" UNIQUE (slug),
  CONSTRAINT "knowledge_articles_visibility_check" CHECK (visibility = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text]))
);

CREATE TABLE public."lab_experiments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid NOT NULL,
  "title" text NOT NULL,
  "challenge" text NOT NULL,
  "thinking_approach" text DEFAULT 'scientist'::text NOT NULL,
  "constraints_text" text DEFAULT ''::text NOT NULL,
  "hypothesis" text DEFAULT ''::text NOT NULL,
  "method" text DEFAULT ''::text NOT NULL,
  "success_measure" text DEFAULT ''::text NOT NULL,
  "risk_notes" text DEFAULT ''::text NOT NULL,
  "status" text DEFAULT 'planned'::text NOT NULL,
  "outcome_notes" text DEFAULT ''::text NOT NULL,
  "lessons_learned" text DEFAULT ''::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "lab_experiments_pkey" PRIMARY KEY (id),
  CONSTRAINT "lab_experiments_status_check" CHECK (status = ANY (ARRAY['planned'::text, 'running'::text, 'completed'::text, 'cancelled'::text]))
);

CREATE TABLE public."member_authentication_preferences" (
  "member_id" uuid NOT NULL,
  "phone_login_enabled" boolean DEFAULT true NOT NULL,
  "face_unlock_enabled" boolean DEFAULT false NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "member_authentication_preferences_pkey" PRIMARY KEY (member_id)
);

CREATE TABLE public."member_links" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid NOT NULL,
  "platform" text NOT NULL,
  "url" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "member_links_member_id_url_key" UNIQUE (member_id, url),
  CONSTRAINT "member_links_pkey" PRIMARY KEY (id),
  CONSTRAINT "member_links_platform_check" CHECK (platform = ANY (ARRAY['facebook'::text, 'instagram'::text, 'x'::text, 'tiktok'::text, 'youtube'::text, 'linkedin'::text, 'whatsapp'::text, 'website'::text, 'other'::text])),
  CONSTRAINT "member_links_url_check" CHECK (url ~ '^https://'::text AND char_length(url) <= 300)
);

CREATE TABLE public."members" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "dgbo_id" text,
  "full_name" text,
  "phone" text,
  "reputation" bigint DEFAULT '0'::bigint,
  "verified" boolean DEFAULT false,
  "status" text DEFAULT 'active '::text,
  "birth_year" integer,
  "password_hash" text,
  "plan" text DEFAULT 'free'::text,
  "rewards" numeric DEFAULT 0,
  "credits" numeric DEFAULT 0,
  "referrals" integer DEFAULT 0,
  "theme" text DEFAULT 'jr-green'::text,
  "account_type" text DEFAULT 'individual'::text,
  "referral_code" text,
  "last_login" timestamp with time zone,
  "avatar_url" text,
  "bio" text,
  "email" text,
  "city" text,
  "country" text DEFAULT 'Kenya'::text,
  "latitude" numeric,
  "longitude" numeric,
  "interests" jsonb DEFAULT '[]'::jsonb,
  "public_profile" boolean DEFAULT true,
  "public_phone" boolean DEFAULT false,
  "public_email" boolean DEFAULT false,
  "online" boolean DEFAULT false,
  "location" text DEFAULT ''::text,
  "profile_photo" text DEFAULT ''::text,
  "role" text DEFAULT 'person'::text,
  "cash_balance" numeric(14,2) DEFAULT 0,
  "profile_visibility" text DEFAULT 'public'::text,
  "show_email" boolean DEFAULT false,
  "show_birth_year" boolean DEFAULT false,
  "show_location" boolean DEFAULT true,
  "last_seen_at" timestamp with time zone,
  "is_online" boolean DEFAULT false,
  "reward_points" integer DEFAULT 0,
  "jp_number" text DEFAULT ('JP-'::text || upper(substr(replace((gen_random_uuid())::text, '-'::text, ''::text), 1, 10))),
  "profile_photo_hidden" boolean DEFAULT false NOT NULL,
  "profile_photo_hidden_url" text,
  "country_code" character(2),
  "preferred_locale" character varying(35),
  "preferred_timezone" character varying(80),
  "preferred_currency" character(3),
  "measurement_system" character varying(12) DEFAULT 'metric'::character varying NOT NULL,
  CONSTRAINT "members_country_code_iso2_check" CHECK (country_code IS NULL OR country_code ~ '^[A-Z]{2}$'::text),
  CONSTRAINT "members_measurement_system_check" CHECK (measurement_system::text = ANY (ARRAY['metric'::character varying, 'imperial'::character varying]::text[])),
  CONSTRAINT "members_pkey" PRIMARY KEY (id),
  CONSTRAINT "members_preferred_currency_iso3_check" CHECK (preferred_currency IS NULL OR preferred_currency ~ '^[A-Z]{3}$'::text),
  CONSTRAINT "members_referral_code_key" UNIQUE (referral_code)
);

CREATE TABLE public."password_resets" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "phone" text NOT NULL,
  "code_hash" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "used" boolean DEFAULT false,
  "created_at" timestamp with time zone DEFAULT now(),
  "member_id" text,
  "purpose" text,
  "attempts" integer DEFAULT 0,
  "used_at" timestamp with time zone,
  CONSTRAINT "password_resets_pkey" PRIMARY KEY (id)
);

CREATE TABLE public."pay_later_accounts" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" text NOT NULL,
  "status" text DEFAULT 'inactive'::text,
  "credit_limit" numeric DEFAULT 0,
  "available_limit" numeric DEFAULT 0,
  "trust_level" integer DEFAULT 0,
  "total_borrowed" numeric DEFAULT 0,
  "total_repaid" numeric DEFAULT 0,
  "outstanding" numeric DEFAULT 0,
  "created_at" timestamp with time zone DEFAULT now(),
  "updated_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "pay_later_accounts_member_id_key" UNIQUE (member_id),
  CONSTRAINT "pay_later_accounts_pkey" PRIMARY KEY (id)
);

CREATE TABLE public."point_transactions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" text NOT NULL,
  "amount" integer NOT NULL,
  "transaction_type" text NOT NULL,
  "description" text,
  "reference_id" text,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "point_transactions_pkey" PRIMARY KEY (id)
);

CREATE TABLE public."pos_counters" (
  "business_id" uuid NOT NULL,
  "last_no" bigint DEFAULT 0 NOT NULL,
  CONSTRAINT "pos_counters_pkey" PRIMARY KEY (business_id)
);

CREATE TABLE public."pos_products" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "name" text NOT NULL,
  "sku" text,
  "barcode" text,
  "category" text,
  "price_ksh" numeric(12,2) NOT NULL,
  "cost_ksh" numeric(12,2),
  "tax_class" text DEFAULT 'standard'::text NOT NULL,
  "stock_qty" numeric(12,3) DEFAULT 0 NOT NULL,
  "reorder_level" numeric(12,3) DEFAULT 0 NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "pos_products_barcode_check" CHECK (barcode IS NULL OR char_length(barcode) <= 40),
  CONSTRAINT "pos_products_category_check" CHECK (category IS NULL OR char_length(category) <= 60),
  CONSTRAINT "pos_products_cost_ksh_check" CHECK (cost_ksh IS NULL OR cost_ksh >= 0::numeric),
  CONSTRAINT "pos_products_name_check" CHECK (char_length(name) >= 1 AND char_length(name) <= 120),
  CONSTRAINT "pos_products_pkey" PRIMARY KEY (id),
  CONSTRAINT "pos_products_price_ksh_check" CHECK (price_ksh >= 0::numeric),
  CONSTRAINT "pos_products_reorder_level_check" CHECK (reorder_level >= 0::numeric),
  CONSTRAINT "pos_products_sku_check" CHECK (sku IS NULL OR char_length(sku) <= 40),
  CONSTRAINT "pos_products_stock_qty_check" CHECK (stock_qty >= 0::numeric),
  CONSTRAINT "pos_products_tax_class_check" CHECK (tax_class = ANY (ARRAY['standard'::text, 'zero_rated'::text, 'exempt'::text]))
);

CREATE TABLE public."pos_sale_items" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "sale_id" uuid NOT NULL,
  "product_id" uuid,
  "name" text NOT NULL,
  "qty" numeric(12,3) NOT NULL,
  "unit_price_ksh" numeric(12,2) NOT NULL,
  "tax_class" text NOT NULL,
  "vat_ksh" numeric(14,2) DEFAULT 0 NOT NULL,
  "line_total_ksh" numeric(14,2) NOT NULL,
  CONSTRAINT "pos_sale_items_pkey" PRIMARY KEY (id),
  CONSTRAINT "pos_sale_items_qty_check" CHECK (qty > 0::numeric)
);

CREATE TABLE public."pos_sales" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "cashier_id" uuid,
  "receipt_no" text NOT NULL,
  "subtotal_ksh" numeric(14,2) DEFAULT 0 NOT NULL,
  "vat_ksh" numeric(14,2) DEFAULT 0 NOT NULL,
  "total_ksh" numeric(14,2) DEFAULT 0 NOT NULL,
  "payment_method" text NOT NULL,
  "mpesa_ref" text,
  "note" text,
  "status" text DEFAULT 'completed'::text NOT NULL,
  "void_reason" text,
  "voided_at" timestamp with time zone,
  "voided_by" uuid,
  "etims_status" text DEFAULT 'not_submitted'::text NOT NULL,
  "etims_ref" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "pos_sales_business_id_receipt_no_key" UNIQUE (business_id, receipt_no),
  CONSTRAINT "pos_sales_etims_status_check" CHECK (etims_status = ANY (ARRAY['not_submitted'::text, 'pending'::text, 'submitted'::text, 'failed'::text])),
  CONSTRAINT "pos_sales_mpesa_ref_check" CHECK (mpesa_ref IS NULL OR char_length(mpesa_ref) <= 30),
  CONSTRAINT "pos_sales_note_check" CHECK (note IS NULL OR char_length(note) <= 200),
  CONSTRAINT "pos_sales_payment_method_check" CHECK (payment_method = ANY (ARRAY['cash'::text, 'mpesa'::text, 'card'::text, 'other'::text])),
  CONSTRAINT "pos_sales_pkey" PRIMARY KEY (id),
  CONSTRAINT "pos_sales_status_check" CHECK (status = ANY (ARRAY['completed'::text, 'voided'::text]))
);

CREATE TABLE public."pos_stock_moves" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "business_id" uuid NOT NULL,
  "product_id" uuid NOT NULL,
  "delta" numeric(12,3) NOT NULL,
  "reason" text NOT NULL,
  "sale_id" uuid,
  "actor_id" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "pos_stock_moves_pkey" PRIMARY KEY (id),
  CONSTRAINT "pos_stock_moves_reason_check" CHECK (char_length(reason) >= 1 AND char_length(reason) <= 80)
);

CREATE TABLE public."repayment_schedule" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "credit_request_id" uuid,
  "member_id" text NOT NULL,
  "amount_due" numeric DEFAULT 0,
  "amount_paid" numeric DEFAULT 0,
  "due_at" timestamp with time zone,
  "status" text DEFAULT 'pending'::text,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "repayment_schedule_pkey" PRIMARY KEY (id)
);

CREATE TABLE public."repayments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "credit_request_id" uuid,
  "member_id" text NOT NULL,
  "amount" numeric NOT NULL,
  "payment_method" text,
  "reference" text,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "repayments_pkey" PRIMARY KEY (id)
);

CREATE TABLE public."room_listings" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid NOT NULL,
  "title" text NOT NULL,
  "room_type" text NOT NULL,
  "rent_ksh" numeric(12,2) NOT NULL,
  "location" text NOT NULL,
  "description" text DEFAULT ''::text NOT NULL,
  "amenities" text[] DEFAULT '{}'::text[] NOT NULL,
  "available_from" date,
  "status" text DEFAULT 'active'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "room_listings_description_check" CHECK (char_length(description) <= 2000),
  CONSTRAINT "room_listings_location_check" CHECK (char_length(location) >= 2 AND char_length(location) <= 180),
  CONSTRAINT "room_listings_pkey" PRIMARY KEY (id),
  CONSTRAINT "room_listings_rent_ksh_check" CHECK (rent_ksh >= 0::numeric),
  CONSTRAINT "room_listings_room_type_check" CHECK (room_type = ANY (ARRAY['bedsitter'::text, 'studio'::text, 'one_bedroom'::text, 'two_bedroom'::text, 'three_bedroom'::text, 'four_bedroom'::text, 'shared'::text, 'single_room'::text, 'other'::text])),
  CONSTRAINT "room_listings_status_check" CHECK (status = ANY (ARRAY['active'::text, 'paused'::text, 'filled'::text])),
  CONSTRAINT "room_listings_title_check" CHECK (char_length(title) >= 3 AND char_length(title) <= 120)
);

CREATE TABLE public."sessions" (
  "id" text DEFAULT (gen_random_uuid())::text NOT NULL,
  "member_id" text NOT NULL,
  "token_hash" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "created_at" timestamp with time zone DEFAULT now(),
  "device_label" text,
  "user_agent" text,
  "last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "sessions_pkey" PRIMARY KEY (id),
  CONSTRAINT "sessions_token_hash_key" UNIQUE (token_hash)
);

CREATE TABLE public."social_comments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "post_id" uuid NOT NULL,
  "member_id" uuid NOT NULL,
  "body" text NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "social_comments_body_check" CHECK (char_length(body) >= 1 AND char_length(body) <= 500),
  CONSTRAINT "social_comments_pkey" PRIMARY KEY (id),
  CONSTRAINT "social_comments_status_check" CHECK (status = ANY (ARRAY['active'::text, 'removed'::text]))
);

CREATE TABLE public."social_follows" (
  "follower_id" uuid NOT NULL,
  "followee_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "social_follows_check" CHECK (follower_id <> followee_id),
  CONSTRAINT "social_follows_pkey" PRIMARY KEY (follower_id, followee_id)
);

CREATE TABLE public."social_likes" (
  "post_id" uuid NOT NULL,
  "member_id" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "social_likes_pkey" PRIMARY KEY (post_id, member_id)
);

CREATE TABLE public."social_posts" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" uuid NOT NULL,
  "body" text NOT NULL,
  "visibility" text DEFAULT 'connections'::text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "media" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "likes_count" integer DEFAULT 0 NOT NULL,
  "comments_count" integer DEFAULT 0 NOT NULL,
  "shares_count" integer DEFAULT 0 NOT NULL,
  "repost_of" uuid,
  "status" text DEFAULT 'active'::text NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "social_posts_body_check" CHECK (char_length(body) >= 1 AND char_length(body) <= 2000),
  CONSTRAINT "social_posts_pkey" PRIMARY KEY (id),
  CONSTRAINT "social_posts_status_check" CHECK (status = ANY (ARRAY['active'::text, 'removed'::text])),
  CONSTRAINT "social_posts_visibility_check" CHECK (visibility = ANY (ARRAY['connections'::text, 'public'::text, 'private'::text]))
);

CREATE TABLE public."trust_history" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "member_id" text NOT NULL,
  "trust_level" integer DEFAULT 0,
  "reason" text,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "trust_history_pkey" PRIMARY KEY (id)
);

CREATE TABLE public."ventures" (
  "slug" text NOT NULL,
  "name" text NOT NULL,
  "kind" text NOT NULL,
  "status" text DEFAULT 'planned'::text NOT NULL,
  "regulated" boolean DEFAULT false NOT NULL,
  "licence_ref" text,
  "description" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "ventures_kind_check" CHECK (kind = ANY (ARRAY['parent'::text, 'venture'::text])),
  CONSTRAINT "ventures_pkey" PRIMARY KEY (slug),
  CONSTRAINT "ventures_status_check" CHECK (status = ANY (ARRAY['active'::text, 'planned'::text, 'paused'::text]))
);

-- Foreign keys are added only after all referenced tables exist.

ALTER TABLE public."ad_campaigns" ADD CONSTRAINT "ad_campaigns_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."agent_actions" ADD CONSTRAINT "agent_actions_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."agent_settings" ADD CONSTRAINT "agent_settings_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."dgbo_decisions" ADD CONSTRAINT "dgbo_decisions_decided_by_fkey" FOREIGN KEY (decided_by) REFERENCES members(id) ON DELETE SET NULL;

ALTER TABLE public."dgbo_decisions" ADD CONSTRAINT "dgbo_decisions_proposed_by_fkey" FOREIGN KEY (proposed_by) REFERENCES members(id) ON DELETE SET NULL;

ALTER TABLE public."dgbo_decisions" ADD CONSTRAINT "dgbo_decisions_venture_fkey" FOREIGN KEY (venture) REFERENCES ventures(slug);

ALTER TABLE public."ecosystem_events" ADD CONSTRAINT "ecosystem_events_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL;

ALTER TABLE public."ecosystem_links" ADD CONSTRAINT "ecosystem_links_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."ecosystem_links" ADD CONSTRAINT "ecosystem_links_venture_fkey" FOREIGN KEY (venture) REFERENCES ventures(slug);

ALTER TABLE public."family_applications" ADD CONSTRAINT "family_applications_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."family_bank_accounts" ADD CONSTRAINT "family_bank_accounts_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE RESTRICT;

ALTER TABLE public."family_bank_audit_events" ADD CONSTRAINT "family_bank_audit_events_actor_member_id_fkey" FOREIGN KEY (actor_member_id) REFERENCES members(id) ON DELETE SET NULL;

ALTER TABLE public."family_bank_audit_events" ADD CONSTRAINT "family_bank_audit_events_subject_member_id_fkey" FOREIGN KEY (subject_member_id) REFERENCES members(id) ON DELETE SET NULL;

ALTER TABLE public."family_bank_ledger_batches" ADD CONSTRAINT "family_bank_ledger_batches_created_by_fkey" FOREIGN KEY (created_by) REFERENCES members(id) ON DELETE SET NULL;

ALTER TABLE public."family_bank_ledger_entries" ADD CONSTRAINT "family_bank_ledger_entries_account_id_fkey" FOREIGN KEY (account_id) REFERENCES family_bank_accounts(id) ON DELETE RESTRICT;

ALTER TABLE public."family_bank_ledger_entries" ADD CONSTRAINT "family_bank_ledger_entries_batch_id_fkey" FOREIGN KEY (batch_id) REFERENCES family_bank_ledger_batches(id) ON DELETE RESTRICT;

ALTER TABLE public."family_bank_profiles" ADD CONSTRAINT "family_bank_profiles_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."family_bank_service_requests" ADD CONSTRAINT "family_bank_service_requests_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."family_goals" ADD CONSTRAINT "family_goals_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."feature_requests" ADD CONSTRAINT "feature_requests_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL;

ALTER TABLE public."feature_votes" ADD CONSTRAINT "feature_votes_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."feature_votes" ADD CONSTRAINT "feature_votes_request_id_fkey" FOREIGN KEY (request_id) REFERENCES feature_requests(id) ON DELETE CASCADE;

ALTER TABLE public."file_vault" ADD CONSTRAINT "file_vault_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."jr_action_proposals" ADD CONSTRAINT "jr_action_proposals_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."jr_business_daily_plans" ADD CONSTRAINT "jr_business_daily_plans_business_id_fkey" FOREIGN KEY (business_id) REFERENCES jr_business_workspaces(id) ON DELETE CASCADE;

ALTER TABLE public."jr_business_import_jobs" ADD CONSTRAINT "jr_business_import_jobs_business_id_fkey" FOREIGN KEY (business_id) REFERENCES jr_business_workspaces(id) ON DELETE CASCADE;

ALTER TABLE public."jr_business_import_jobs" ADD CONSTRAINT "jr_business_import_jobs_requested_by_fkey" FOREIGN KEY (requested_by) REFERENCES members(id);

ALTER TABLE public."jr_business_workspace_members" ADD CONSTRAINT "jr_business_workspace_members_business_id_fkey" FOREIGN KEY (business_id) REFERENCES jr_business_workspaces(id) ON DELETE CASCADE;

ALTER TABLE public."jr_business_workspace_members" ADD CONSTRAINT "jr_business_workspace_members_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."jr_business_workspaces" ADD CONSTRAINT "jr_business_workspaces_owner_member_id_fkey" FOREIGN KEY (owner_member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."jr_capability_permissions" ADD CONSTRAINT "jr_capability_permissions_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."jr_conversation_participants" ADD CONSTRAINT "jr_conversation_participants_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES jr_conversations(id) ON DELETE CASCADE;

ALTER TABLE public."jr_conversation_participants" ADD CONSTRAINT "jr_conversation_participants_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."jr_conversations" ADD CONSTRAINT "jr_conversations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."jr_deal_messages" ADD CONSTRAINT "jr_deal_messages_room_id_fkey" FOREIGN KEY (room_id) REFERENCES jr_deal_rooms(id) ON DELETE CASCADE;

ALTER TABLE public."jr_deal_messages" ADD CONSTRAINT "jr_deal_messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."jr_errand_events" ADD CONSTRAINT "jr_errand_events_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES members(id) ON DELETE SET NULL;

ALTER TABLE public."jr_errand_events" ADD CONSTRAINT "jr_errand_events_errand_id_fkey" FOREIGN KEY (errand_id) REFERENCES jr_errands(id) ON DELETE CASCADE;

ALTER TABLE public."jr_errands" ADD CONSTRAINT "jr_errands_delivery_id_fkey" FOREIGN KEY (delivery_id) REFERENCES jr_delivery_requests(id) ON DELETE SET NULL;

ALTER TABLE public."jr_errands" ADD CONSTRAINT "jr_errands_recipient_id_fkey" FOREIGN KEY (recipient_id) REFERENCES members(id) ON DELETE SET NULL;

ALTER TABLE public."jr_errands" ADD CONSTRAINT "jr_errands_requester_id_fkey" FOREIGN KEY (requester_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."jr_errands" ADD CONSTRAINT "jr_errands_seller_id_fkey" FOREIGN KEY (seller_id) REFERENCES members(id) ON DELETE SET NULL;

ALTER TABLE public."jr_growth_journal" ADD CONSTRAINT "jr_growth_journal_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."jr_member_preferences" ADD CONSTRAINT "jr_member_preferences_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."jr_member_state" ADD CONSTRAINT "jr_member_state_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."jr_memory_items" ADD CONSTRAINT "jr_memory_items_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."jr_messages" ADD CONSTRAINT "jr_messages_conversation_id_fkey" FOREIGN KEY (conversation_id) REFERENCES jr_conversations(id) ON DELETE CASCADE;

ALTER TABLE public."jr_messages" ADD CONSTRAINT "jr_messages_sender_id_fkey" FOREIGN KEY (sender_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."jr_opportunities" ADD CONSTRAINT "jr_opportunities_owner_user_id_fkey" FOREIGN KEY (owner_user_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."jr_opportunity_interests" ADD CONSTRAINT "jr_opportunity_interests_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."jr_opportunity_interests" ADD CONSTRAINT "jr_opportunity_interests_opportunity_id_fkey" FOREIGN KEY (opportunity_id) REFERENCES jr_opportunities(id) ON DELETE CASCADE;

ALTER TABLE public."jr_opportunity_reports" ADD CONSTRAINT "jr_opportunity_reports_opportunity_id_fkey" FOREIGN KEY (opportunity_id) REFERENCES jr_opportunities(id) ON DELETE CASCADE;

ALTER TABLE public."jr_opportunity_reports" ADD CONSTRAINT "jr_opportunity_reports_reporter_member_id_fkey" FOREIGN KEY (reporter_member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."jr_opportunity_reports" ADD CONSTRAINT "jr_opportunity_reports_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES members(id) ON DELETE SET NULL;

ALTER TABLE public."jr_partner_connections" ADD CONSTRAINT "jr_partner_connections_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."jr_partner_events" ADD CONSTRAINT "jr_partner_events_connection_id_fkey" FOREIGN KEY (connection_id) REFERENCES jr_partner_connections(id) ON DELETE CASCADE;

ALTER TABLE public."jr_partner_events" ADD CONSTRAINT "jr_partner_events_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."jr_project_tasks" ADD CONSTRAINT "jr_project_tasks_project_id_fkey" FOREIGN KEY (project_id) REFERENCES jr_projects(id) ON DELETE CASCADE;

ALTER TABLE public."jr_projects" ADD CONSTRAINT "jr_projects_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."jr_referrals" ADD CONSTRAINT "jr_referrals_referred_id_fkey" FOREIGN KEY (referred_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."jr_referrals" ADD CONSTRAINT "jr_referrals_referrer_id_fkey" FOREIGN KEY (referrer_id) REFERENCES members(id) ON DELETE SET NULL;

ALTER TABLE public."jr_security_events" ADD CONSTRAINT "jr_security_events_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."jr_status_updates" ADD CONSTRAINT "jr_status_updates_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."jr_status_views" ADD CONSTRAINT "jr_status_views_status_id_fkey" FOREIGN KEY (status_id) REFERENCES jr_status_updates(id) ON DELETE CASCADE;

ALTER TABLE public."jr_status_views" ADD CONSTRAINT "jr_status_views_viewer_id_fkey" FOREIGN KEY (viewer_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."jr_world_progress" ADD CONSTRAINT "jr_world_progress_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."knowledge_articles" ADD CONSTRAINT "knowledge_articles_created_by_fkey" FOREIGN KEY (created_by) REFERENCES members(id) ON DELETE SET NULL;

ALTER TABLE public."knowledge_articles" ADD CONSTRAINT "knowledge_articles_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES members(id) ON DELETE SET NULL;

ALTER TABLE public."lab_experiments" ADD CONSTRAINT "lab_experiments_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."member_authentication_preferences" ADD CONSTRAINT "member_authentication_preferences_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."member_links" ADD CONSTRAINT "member_links_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."pos_counters" ADD CONSTRAINT "pos_counters_business_id_fkey" FOREIGN KEY (business_id) REFERENCES jr_business_workspaces(id) ON DELETE CASCADE;

ALTER TABLE public."pos_products" ADD CONSTRAINT "pos_products_business_id_fkey" FOREIGN KEY (business_id) REFERENCES jr_business_workspaces(id) ON DELETE CASCADE;

ALTER TABLE public."pos_sale_items" ADD CONSTRAINT "pos_sale_items_product_id_fkey" FOREIGN KEY (product_id) REFERENCES pos_products(id) ON DELETE SET NULL;

ALTER TABLE public."pos_sale_items" ADD CONSTRAINT "pos_sale_items_sale_id_fkey" FOREIGN KEY (sale_id) REFERENCES pos_sales(id) ON DELETE CASCADE;

ALTER TABLE public."pos_sales" ADD CONSTRAINT "pos_sales_business_id_fkey" FOREIGN KEY (business_id) REFERENCES jr_business_workspaces(id) ON DELETE CASCADE;

ALTER TABLE public."pos_sales" ADD CONSTRAINT "pos_sales_cashier_id_fkey" FOREIGN KEY (cashier_id) REFERENCES members(id) ON DELETE SET NULL;

ALTER TABLE public."pos_sales" ADD CONSTRAINT "pos_sales_voided_by_fkey" FOREIGN KEY (voided_by) REFERENCES members(id) ON DELETE SET NULL;

ALTER TABLE public."pos_stock_moves" ADD CONSTRAINT "pos_stock_moves_actor_id_fkey" FOREIGN KEY (actor_id) REFERENCES members(id) ON DELETE SET NULL;

ALTER TABLE public."pos_stock_moves" ADD CONSTRAINT "pos_stock_moves_business_id_fkey" FOREIGN KEY (business_id) REFERENCES jr_business_workspaces(id) ON DELETE CASCADE;

ALTER TABLE public."pos_stock_moves" ADD CONSTRAINT "pos_stock_moves_product_id_fkey" FOREIGN KEY (product_id) REFERENCES pos_products(id) ON DELETE CASCADE;

ALTER TABLE public."pos_stock_moves" ADD CONSTRAINT "pos_stock_moves_sale_id_fkey" FOREIGN KEY (sale_id) REFERENCES pos_sales(id) ON DELETE SET NULL;

ALTER TABLE public."room_listings" ADD CONSTRAINT "room_listings_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."social_comments" ADD CONSTRAINT "social_comments_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."social_comments" ADD CONSTRAINT "social_comments_post_id_fkey" FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE;

ALTER TABLE public."social_follows" ADD CONSTRAINT "social_follows_followee_id_fkey" FOREIGN KEY (followee_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."social_follows" ADD CONSTRAINT "social_follows_follower_id_fkey" FOREIGN KEY (follower_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."social_likes" ADD CONSTRAINT "social_likes_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."social_likes" ADD CONSTRAINT "social_likes_post_id_fkey" FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE;

ALTER TABLE public."social_posts" ADD CONSTRAINT "social_posts_member_id_fkey" FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE;

ALTER TABLE public."social_posts" ADD CONSTRAINT "social_posts_repost_of_fkey" FOREIGN KEY (repost_of) REFERENCES social_posts(id) ON DELETE SET NULL;

-- Functions and indexes.

CREATE OR REPLACE FUNCTION private.prevent_jr_security_event_mutation()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
begin
  raise exception 'JR security event history is append-only';
end;
$function$;

CREATE OR REPLACE FUNCTION public.ad_event(p_id uuid, p_kind text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if p_kind = 'impression' then update public.ad_campaigns set impressions = impressions + 1 where id = p_id and status = 'approved';
  elsif p_kind = 'click' then update public.ad_campaigns set clicks = clicks + 1 where id = p_id and status = 'approved';
  end if;
end $function$;

CREATE OR REPLACE FUNCTION public.expire_promos()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare n integer;
begin
  update public.jr_listings
     set price = original_price, original_price = null, promo_label = null, promo_ends_at = null, updated_at = now()
   where promo_ends_at is not null and promo_ends_at <= now() and original_price is not null;
  get diagnostics n = row_count;
  return n;
end $function$;

CREATE OR REPLACE FUNCTION public.next_dgbo_id()
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
                                                                                                                                                          declare
                                                                                                                                                            n integer;
                                                                                                                                                            begin

                                                                                                                                                              perform pg_advisory_xact_lock(774411);

                                                                                                                                                                select coalesce(
                                                                                                                                                                    max(
                                                                                                                                                                          (regexp_match(dgbo_id,'DGBO-([0-9]+)'))[1]::integer
                                                                                                                                                                              ),
                                                                                                                                                                                  0
                                                                                                                                                                                    ) + 1
                                                                                                                                                                                      into n
                                                                                                                                                                                        from public.members
                                                                                                                                                                                          where dgbo_id ~ '^DGBO-[0-9]+$';

                                                                                                                                                                                            return 'DGBO-' || lpad(n::text,6,'0');

                                                                                                                                                                                            end;
                                                                                                                                                                                            $function$;

CREATE OR REPLACE FUNCTION public.pos_adjust_stock(p_business uuid, p_product uuid, p_delta numeric, p_reason text, p_member uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare cur numeric;
begin
  select stock_qty into cur from public.pos_products where id = p_product and business_id = p_business for update;
  if not found then raise exception 'product not found'; end if;
  if cur + p_delta < 0 then raise exception 'stock cannot go below zero'; end if;
  update public.pos_products set stock_qty = stock_qty + p_delta, updated_at = now() where id = p_product;
  insert into public.pos_stock_moves (business_id, product_id, delta, reason, actor_id) values (p_business, p_product, p_delta, left(coalesce(nullif(p_reason, ''), 'adjustment'), 80), p_member);
  return cur + p_delta;
end $function$;

CREATE OR REPLACE FUNCTION public.pos_create_sale(p_business uuid, p_cashier uuid, p_items jsonb, p_method text, p_ref text, p_note text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  it jsonb; prod public.pos_products%rowtype; q numeric; line numeric; rate numeric; v numeric;
  sub numeric := 0; vat_total numeric := 0; sid uuid; n bigint; rcpt text;
begin
  if p_method not in ('cash','mpesa','card','other') then raise exception 'invalid payment method'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 100 then raise exception 'cart must have 1 to 100 lines'; end if;
  insert into public.pos_counters (business_id, last_no) values (p_business, 0) on conflict do nothing;
  update public.pos_counters set last_no = last_no + 1 where business_id = p_business returning last_no into n;
  rcpt := 'R' || to_char(now() at time zone 'Africa/Nairobi', 'YYMMDD') || '-' || lpad(n::text, 5, '0');
  insert into public.pos_sales (business_id, cashier_id, receipt_no, payment_method, mpesa_ref, note)
    values (p_business, p_cashier, rcpt, p_method, nullif(p_ref, ''), nullif(p_note, '')) returning id into sid;
  for it in select * from jsonb_array_elements(p_items) loop
    q := (it->>'qty')::numeric;
    if q is null or q <= 0 or q > 100000 then raise exception 'invalid quantity'; end if;
    select * into prod from public.pos_products where id = (it->>'product_id')::uuid and business_id = p_business and active for update;
    if not found then raise exception 'product not found'; end if;
    if prod.stock_qty < q then raise exception 'not enough stock for %', prod.name; end if;
    line := round(prod.price_ksh * q, 2);
    rate := case prod.tax_class when 'standard' then 16 else 0 end;
    v := round(line * rate / (100 + rate), 2);
    insert into public.pos_sale_items (sale_id, product_id, name, qty, unit_price_ksh, tax_class, vat_ksh, line_total_ksh)
      values (sid, prod.id, prod.name, q, prod.price_ksh, prod.tax_class, v, line);
    update public.pos_products set stock_qty = stock_qty - q, updated_at = now() where id = prod.id;
    insert into public.pos_stock_moves (business_id, product_id, delta, reason, sale_id, actor_id) values (p_business, prod.id, -q, 'sale', sid, p_cashier);
    sub := sub + line; vat_total := vat_total + v;
  end loop;
  update public.pos_sales set subtotal_ksh = sub - vat_total, vat_ksh = vat_total, total_ksh = sub where id = sid;
  return jsonb_build_object('sale_id', sid, 'receipt_no', rcpt, 'total_ksh', sub, 'vat_ksh', vat_total);
end $function$;

CREATE OR REPLACE FUNCTION public.pos_void_sale(p_business uuid, p_sale uuid, p_member uuid, p_reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare s public.pos_sales%rowtype; r record;
begin
  select * into s from public.pos_sales where id = p_sale and business_id = p_business for update;
  if not found then raise exception 'sale not found'; end if;
  if s.status <> 'completed' then raise exception 'sale already voided'; end if;
  for r in select product_id, qty from public.pos_sale_items where sale_id = p_sale and product_id is not null loop
    update public.pos_products set stock_qty = stock_qty + r.qty, updated_at = now() where id = r.product_id;
    insert into public.pos_stock_moves (business_id, product_id, delta, reason, sale_id, actor_id) values (p_business, r.product_id, r.qty, 'void', p_sale, p_member);
  end loop;
  update public.pos_sales set status = 'voided', void_reason = left(coalesce(p_reason, ''), 160), voided_at = now(), voided_by = p_member where id = p_sale;
  return jsonb_build_object('sale_id', p_sale, 'status', 'voided');
end $function$;

CREATE OR REPLACE FUNCTION public.vote_feature(p_request uuid, p_member uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v integer;
begin
  insert into public.feature_votes (request_id, member_id) values (p_request, p_member) on conflict do nothing;
  if found then update public.feature_requests set votes = votes + 1 where id = p_request; end if;
  select votes into v from public.feature_requests where id = p_request;
  return v;
end $function$;

CREATE INDEX ad_campaigns_live_idx ON public.ad_campaigns USING btree (status, ends_at);

CREATE INDEX ad_campaigns_member_idx ON public.ad_campaigns USING btree (member_id);

CREATE INDEX agent_actions_member_idx ON public.agent_actions USING btree (member_id, created_at DESC);

CREATE INDEX connections_receiver_status_idx ON public.connections USING btree (receiver_id, status);

CREATE INDEX connections_requester_status_idx ON public.connections USING btree (requester_id, status);

CREATE UNIQUE INDEX uq_connections_pair ON public.connections USING btree (requester_id, receiver_id);

CREATE UNIQUE INDEX uq_connections_undirected_pair ON public.connections USING btree (LEAST(requester_id, receiver_id), GREATEST(requester_id, receiver_id));

CREATE INDEX idx_credit_requests_member ON public.credit_requests USING btree (member_id, created_at DESC);

CREATE INDEX jr_idx_dgbo_decisions_decided_by ON public.dgbo_decisions USING btree (decided_by);

CREATE INDEX jr_idx_dgbo_decisions_proposed_by ON public.dgbo_decisions USING btree (proposed_by);

CREATE INDEX jr_idx_dgbo_decisions_venture ON public.dgbo_decisions USING btree (venture);

CREATE INDEX ecosystem_events_created_idx ON public.ecosystem_events USING btree (created_at DESC);

CREATE INDEX jr_idx_ecosystem_events_member_id ON public.ecosystem_events USING btree (member_id);

CREATE INDEX ecosystem_links_venture_idx ON public.ecosystem_links USING btree (venture, status);

CREATE INDEX family_applications_status_idx ON public.family_applications USING btree (status, created_at DESC);

CREATE INDEX jr_idx_family_applications_member_id ON public.family_applications USING btree (member_id);

CREATE INDEX family_bank_accounts_member_idx ON public.family_bank_accounts USING btree (member_id, created_at DESC);

CREATE INDEX family_bank_audit_events_actor_member_id_idx ON public.family_bank_audit_events USING btree (actor_member_id);

CREATE INDEX family_bank_audit_subject_created_idx ON public.family_bank_audit_events USING btree (subject_member_id, created_at DESC);

CREATE INDEX family_bank_ledger_batches_created_by_idx ON public.family_bank_ledger_batches USING btree (created_by);

CREATE INDEX family_bank_entries_account_idx ON public.family_bank_ledger_entries USING btree (account_id, created_at DESC);

CREATE INDEX family_bank_entries_batch_idx ON public.family_bank_ledger_entries USING btree (batch_id);

CREATE INDEX family_bank_requests_member_created_idx ON public.family_bank_service_requests USING btree (member_id, created_at DESC);

CREATE INDEX family_goals_member_idx ON public.family_goals USING btree (member_id);

CREATE INDEX jr_idx_feature_requests_member_id ON public.feature_requests USING btree (member_id);

CREATE INDEX jr_idx_feature_votes_member_id ON public.feature_votes USING btree (member_id);

CREATE INDEX file_vault_member_created_idx ON public.file_vault USING btree (member_id, created_at DESC);

CREATE INDEX jr_action_proposals_member_recent_idx ON public.jr_action_proposals USING btree (member_id, created_at DESC);

CREATE INDEX jr_action_proposals_pending_idx ON public.jr_action_proposals USING btree (member_id, expires_at) WHERE (status = 'pending'::text);

CREATE INDEX jr_business_daily_plans_date_idx ON public.jr_business_daily_plans USING btree (plan_date DESC);

CREATE INDEX jr_business_import_jobs_business_idx ON public.jr_business_import_jobs USING btree (business_id, created_at DESC);

CREATE INDEX jr_business_import_jobs_requested_by_idx ON public.jr_business_import_jobs USING btree (requested_by);

CREATE INDEX jr_business_workspace_members_member_idx ON public.jr_business_workspace_members USING btree (member_id, status);

CREATE INDEX jr_business_workspaces_owner_idx ON public.jr_business_workspaces USING btree (owner_member_id, updated_at DESC);

CREATE UNIQUE INDEX jr_business_workspaces_owner_slug_uidx ON public.jr_business_workspaces USING btree (owner_member_id, slug);

CREATE INDEX jr_conversation_participants_member_idx ON public.jr_conversation_participants USING btree (member_id, conversation_id);

CREATE INDEX jr_conversations_created_by_idx ON public.jr_conversations USING btree (created_by);

CREATE INDEX jr_deal_messages_room_idx ON public.jr_deal_messages USING btree (room_id, created_at);

CREATE INDEX jr_idx_jr_deal_messages_sender_id ON public.jr_deal_messages USING btree (sender_id);

CREATE INDEX jr_deal_rooms_buyer_idx ON public.jr_deal_rooms USING btree (buyer_id);

CREATE UNIQUE INDEX jr_deal_rooms_one_open_per_buyer ON public.jr_deal_rooms USING btree (listing_id, buyer_id) WHERE (status = ANY (ARRAY['open'::text, 'agreed'::text]));

CREATE INDEX jr_deal_rooms_seller_idx ON public.jr_deal_rooms USING btree (seller_id);

CREATE INDEX jr_delivery_requester_idx ON public.jr_delivery_requests USING btree (requester_id);

CREATE INDEX jr_delivery_rider_idx ON public.jr_delivery_requests USING btree (rider_id);

CREATE INDEX jr_delivery_status_idx ON public.jr_delivery_requests USING btree (status, created_at DESC);

CREATE INDEX jr_errand_events_idx ON public.jr_errand_events USING btree (errand_id, created_at);

CREATE INDEX jr_idx_jr_errand_events_actor_id ON public.jr_errand_events USING btree (actor_id);

CREATE INDEX jr_errands_recipient_idx ON public.jr_errands USING btree (recipient_id);

CREATE INDEX jr_errands_requester_idx ON public.jr_errands USING btree (requester_id, created_at DESC);

CREATE INDEX jr_errands_seller_idx ON public.jr_errands USING btree (seller_id);

CREATE INDEX jr_idx_jr_errands_delivery_id ON public.jr_errands USING btree (delivery_id);

CREATE INDEX jr_growth_journal_member_recent_idx ON public.jr_growth_journal USING btree (member_id, created_at DESC);

CREATE INDEX jr_growth_journal_member_world_idx ON public.jr_growth_journal USING btree (member_id, world_key, created_at DESC);

CREATE INDEX idx_jr_listings_category ON public.jr_listings USING btree (category);

CREATE INDEX idx_jr_listings_location ON public.jr_listings USING btree (location);

CREATE INDEX idx_jr_listings_status ON public.jr_listings USING btree (status);

CREATE INDEX jr_listings_featured_idx ON public.jr_listings USING btree (featured_until) WHERE (featured_until IS NOT NULL);

CREATE INDEX jr_listings_member_idx ON public.jr_listings USING btree (member_id);

CREATE INDEX jr_listings_promo_idx ON public.jr_listings USING btree (promo_ends_at) WHERE (original_price IS NOT NULL);

CREATE INDEX jr_listings_status_created_idx ON public.jr_listings USING btree (status, created_at DESC);

CREATE INDEX jr_memory_items_member_active_idx ON public.jr_memory_items USING btree (member_id, updated_at DESC) WHERE (active = true);

CREATE INDEX jr_messages_conversation_created_idx ON public.jr_messages USING btree (conversation_id, created_at DESC);

CREATE INDEX jr_messages_sender_id_idx ON public.jr_messages USING btree (sender_id);

CREATE INDEX idx_jr_notifications_member ON public.jr_notifications USING btree (member_id);

CREATE INDEX jr_notifications_member_idx ON public.jr_notifications USING btree (member_id, created_at DESC);

CREATE INDEX jr_opportunities_owner_idx ON public.jr_opportunities USING btree (owner_user_id, created_at DESC);

CREATE INDEX jr_opportunities_public_feed_idx ON public.jr_opportunities USING btree (publication_status, availability_status, published_at DESC);

CREATE INDEX jr_opportunities_regions_idx ON public.jr_opportunities USING gin (eligible_regions);

CREATE INDEX jr_opportunity_interests_member_idx ON public.jr_opportunity_interests USING btree (member_id, created_at DESC);

CREATE INDEX jr_opportunity_interests_opportunity_idx ON public.jr_opportunity_interests USING btree (opportunity_id, created_at DESC);

CREATE INDEX jr_opportunity_reports_reporter_member_id_idx ON public.jr_opportunity_reports USING btree (reporter_member_id);

CREATE INDEX jr_opportunity_reports_review_idx ON public.jr_opportunity_reports USING btree (review_status, created_at);

CREATE INDEX jr_opportunity_reports_reviewed_by_idx ON public.jr_opportunity_reports USING btree (reviewed_by);

CREATE INDEX jr_partner_connections_member_idx ON public.jr_partner_connections USING btree (member_id, created_at DESC);

CREATE INDEX jr_partner_events_connection_recent_idx ON public.jr_partner_events USING btree (connection_id, received_at DESC);

CREATE INDEX jr_partner_events_member_recent_idx ON public.jr_partner_events USING btree (member_id, received_at DESC);

CREATE UNIQUE INDEX jr_payments_checkout_uidx ON public.jr_payments USING btree (checkout_request_id) WHERE (checkout_request_id IS NOT NULL);

CREATE INDEX jr_payments_member_idx ON public.jr_payments USING btree (member_id, created_at DESC);

CREATE UNIQUE INDEX jr_payments_receipt_uidx ON public.jr_payments USING btree (mpesa_receipt) WHERE (mpesa_receipt IS NOT NULL);

CREATE INDEX jr_project_tasks_project_idx ON public.jr_project_tasks USING btree (project_id, sort_order);

CREATE INDEX jr_projects_member_idx ON public.jr_projects USING btree (member_id, created_at DESC);

CREATE UNIQUE INDEX jr_referrals_one_attribution_per_member ON public.jr_referrals USING btree (referred_id) WHERE (referred_id IS NOT NULL);

CREATE INDEX jr_referrals_referrer_created_idx ON public.jr_referrals USING btree (referrer_id, created_at DESC);

CREATE INDEX idx_jr_riders_location ON public.jr_riders USING btree (location);

CREATE INDEX idx_jr_riders_online ON public.jr_riders USING btree (online);

CREATE UNIQUE INDEX jr_riders_member_uidx ON public.jr_riders USING btree (member_id);

CREATE INDEX jr_security_events_member_created_idx ON public.jr_security_events USING btree (member_id, created_at DESC);

CREATE INDEX jr_security_events_type_created_idx ON public.jr_security_events USING btree (event_type, created_at DESC);

CREATE INDEX jr_status_updates_expiry_idx ON public.jr_status_updates USING btree (expires_at);

CREATE INDEX jr_status_updates_member_created_idx ON public.jr_status_updates USING btree (member_id, created_at DESC);

CREATE INDEX jr_status_views_viewer_idx ON public.jr_status_views USING btree (viewer_id, viewed_at DESC);

CREATE INDEX jr_world_progress_member_recent_idx ON public.jr_world_progress USING btree (member_id, last_interaction_at DESC);

CREATE INDEX knowledge_articles_created_by_idx ON public.knowledge_articles USING btree (created_by);

CREATE INDEX knowledge_articles_domain_idx ON public.knowledge_articles USING btree (domain);

CREATE INDEX knowledge_articles_reviewed_by_idx ON public.knowledge_articles USING btree (reviewed_by);

CREATE INDEX knowledge_articles_tags_idx ON public.knowledge_articles USING gin (tags);

CREATE INDEX knowledge_articles_visibility_idx ON public.knowledge_articles USING btree (visibility);

CREATE INDEX lab_experiments_member_idx ON public.lab_experiments USING btree (member_id, created_at DESC);

CREATE INDEX members_dgbo_idx ON public.members USING btree (dgbo_id);

CREATE INDEX members_email_idx ON public.members USING btree (email);

CREATE INDEX members_email_lower_idx ON public.members USING btree (lower(email));

CREATE UNIQUE INDEX members_jp_number_uidx ON public.members USING btree (jp_number);

CREATE INDEX members_phone_idx ON public.members USING btree (phone);

CREATE INDEX password_resets_phone_idx ON public.password_resets USING btree (phone);

CREATE INDEX idx_point_transactions_member ON public.point_transactions USING btree (member_id, created_at DESC);

CREATE INDEX pos_products_barcode_idx ON public.pos_products USING btree (business_id, barcode) WHERE (barcode IS NOT NULL);

CREATE INDEX pos_products_biz_idx ON public.pos_products USING btree (business_id, active, name);

CREATE UNIQUE INDEX pos_products_sku_idx ON public.pos_products USING btree (business_id, sku) WHERE (sku IS NOT NULL);

CREATE INDEX pos_sale_items_product_idx ON public.pos_sale_items USING btree (product_id);

CREATE INDEX pos_sale_items_sale_idx ON public.pos_sale_items USING btree (sale_id);

CREATE INDEX pos_sales_biz_idx ON public.pos_sales USING btree (business_id, created_at DESC);

CREATE INDEX pos_sales_cashier_idx ON public.pos_sales USING btree (cashier_id);

CREATE INDEX pos_sales_voided_by_idx ON public.pos_sales USING btree (voided_by);

CREATE INDEX pos_stock_moves_actor_idx ON public.pos_stock_moves USING btree (actor_id);

CREATE INDEX pos_stock_moves_biz_idx ON public.pos_stock_moves USING btree (business_id, created_at DESC);

CREATE INDEX pos_stock_moves_product_idx ON public.pos_stock_moves USING btree (product_id);

CREATE INDEX pos_stock_moves_sale_idx ON public.pos_stock_moves USING btree (sale_id);

CREATE INDEX room_listings_active_location_idx ON public.room_listings USING btree (status, location);

CREATE INDEX room_listings_member_created_idx ON public.room_listings USING btree (member_id, created_at DESC);

CREATE INDEX room_listings_type_rent_idx ON public.room_listings USING btree (room_type, rent_ksh) WHERE (status = 'active'::text);

CREATE INDEX idx_sessions_token ON public.sessions USING btree (token_hash);

CREATE INDEX jr_idx_social_comments_member_id ON public.social_comments USING btree (member_id);

CREATE INDEX social_comments_post_idx ON public.social_comments USING btree (post_id, created_at);

CREATE INDEX social_follows_followee_idx ON public.social_follows USING btree (followee_id);

CREATE INDEX jr_idx_social_likes_member_id ON public.social_likes USING btree (member_id);

CREATE INDEX jr_idx_social_posts_repost_of ON public.social_posts USING btree (repost_of);

CREATE INDEX social_posts_feed_idx ON public.social_posts USING btree (created_at DESC) WHERE (status = 'active'::text);

CREATE INDEX social_posts_member_created_idx ON public.social_posts USING btree (member_id, created_at DESC);

CREATE INDEX social_posts_visibility_created_idx ON public.social_posts USING btree (visibility, created_at DESC);

-- Comments.

COMMENT ON TABLE public."jr_action_proposals" IS 'Member-scoped JR action proposals and explicit decisions. Approval records consent only; connected execution handlers must separately verify permissions and provider outcomes.';

COMMENT ON TABLE public."jr_capability_permissions" IS 'Private member capability settings. Server-only access; direct anon/authenticated Data API access is explicitly denied.';

COMMENT ON TABLE public."jr_growth_journal" IS 'Private member growth journal. Server-only access; direct anon/authenticated Data API access is explicitly denied.';

COMMENT ON TABLE public."jr_memory_items" IS 'Explicitly member-entered non-sensitive continuity memory. Reuse as AI context only when consent_ai_context is true. Never infer or store sensitive personal data.';

COMMENT ON TABLE public."jr_partner_connections" IS 'Member-owned inbound integration credentials. Store only SHA-256 token hashes; credentials have events:write scope only.';

COMMENT ON TABLE public."jr_partner_events" IS 'Private, deduplicated inbound partner events. Events are informational and never execute actions automatically.';

COMMENT ON TABLE public."jr_referrals" IS 'Server-managed referral attribution. Rewards remain zero and non-cash until a separately approved reward programme and ledger are activated.';

COMMENT ON TABLE public."jr_security_events" IS 'Private member-scoped security and consent event history. Server-side access only; never store secrets or raw authentication tokens.';

COMMENT ON TABLE public."jr_world_progress" IS 'Private member continuity. Server-only access; direct anon/authenticated Data API access is explicitly denied.';

COMMENT ON TABLE public."member_authentication_preferences" IS 'Private per-member sign-in preferences. Face Unlock is opt-in; no biometric data is stored.';

COMMENT ON COLUMN public."ad_campaigns"."media_urls" IS 'Public image/video URLs attached to an ad; only approved ads are served in the sponsored feed.';

COMMENT ON COLUMN public."member_authentication_preferences"."phone_login_enabled" IS 'Controls phone-number sign-in only; it does not delete the stored contact number.';

COMMENT ON COLUMN public."member_authentication_preferences"."face_unlock_enabled" IS 'Opt-in preference for platform Face Unlock where supported. WebAuthn/passkeys do not prove face-only verification.';

COMMENT ON COLUMN public."members"."profile_photo_hidden" IS 'Member-controlled visibility flag for the profile photo.';

COMMENT ON COLUMN public."members"."profile_photo_hidden_url" IS 'Private server-only storage URL retained when a member hides their profile photo.';

COMMENT ON COLUMN public."members"."country_code" IS 'Member-selected ISO 3166-1 alpha-2 country/market setting.';

COMMENT ON COLUMN public."members"."preferred_locale" IS 'Member-selected BCP 47 language/locale preference.';

COMMENT ON COLUMN public."members"."preferred_timezone" IS 'Member-selected IANA time zone.';

COMMENT ON COLUMN public."members"."preferred_currency" IS 'Member-selected ISO 4217 currency for display; does not imply payment support.';

-- Row-level security and deny-by-default API policies.

ALTER TABLE public."activity_log" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."activity_log" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."ad_campaigns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ad_campaigns" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."agent_actions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."agent_actions" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."agent_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."agent_settings" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."connections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."connections" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."credit_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."credit_requests" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."dgbo_businesses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."dgbo_decisions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."dgbo_decisions" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."ecosystem_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ecosystem_events" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."ecosystem_links" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ecosystem_links" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."family_applications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."family_applications" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."family_bank_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."family_bank_accounts" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."family_bank_audit_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."family_bank_audit_events" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."family_bank_ledger_batches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."family_bank_ledger_batches" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."family_bank_ledger_entries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."family_bank_ledger_entries" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."family_bank_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."family_bank_profiles" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."family_bank_service_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."family_bank_service_requests" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."family_goals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."family_goals" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."feature_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."feature_requests" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."feature_votes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."feature_votes" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."file_vault" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."file_vault" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."jr_action_proposals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_blocks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_blocks" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."jr_business_daily_plans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_business_import_jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_business_workspace_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_business_workspaces" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_capability_permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_conversation_participants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_coupon_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_coupon_users" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."jr_coupons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_coupons" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."jr_deal_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_deal_messages" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."jr_deal_rooms" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_deal_rooms" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."jr_delivery_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_delivery_requests" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."jr_errand_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_errands" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_growth_journal" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_listings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_listings" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."jr_member_preferences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_member_state" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_memberships" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."jr_memory_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_notifications" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."jr_opportunities" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_opportunity_interests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_opportunity_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_org_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_org_members" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."jr_organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_organizations" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."jr_partner_connections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_partner_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_payments" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."jr_project_tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_project_tasks" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."jr_projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_projects" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."jr_referrals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_referrals" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."jr_reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_reports" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."jr_rewards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_rewards" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."jr_riders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_riders" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."jr_security_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_status_updates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_status_views" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."jr_world_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."knowledge_articles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."knowledge_articles" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."lab_experiments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."lab_experiments" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."member_authentication_preferences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."member_links" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."members" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."password_resets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."password_resets" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pay_later_accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pay_later_accounts" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."point_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."point_transactions" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."pos_counters" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pos_products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pos_sale_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pos_sales" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."pos_stock_moves" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."repayment_schedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."repayment_schedule" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."repayments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."repayments" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."room_listings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."room_listings" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."sessions" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."social_comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."social_follows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."social_likes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."social_posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."social_posts" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."trust_history" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."trust_history" FORCE ROW LEVEL SECURITY;
ALTER TABLE public."ventures" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."ventures" FORCE ROW LEVEL SECURITY;

CREATE POLICY "jr_server_only_deny_api" ON public."activity_log" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."ad_campaigns" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."agent_actions" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."agent_settings" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."connections" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."credit_requests" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "No direct client access to dgbo_businesses" ON public."dgbo_businesses" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."dgbo_decisions" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."ecosystem_events" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."ecosystem_links" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."family_applications" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "family_bank_accounts_deny_client_access" ON public."family_bank_accounts" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "family_bank_audit_events_deny_client_access" ON public."family_bank_audit_events" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "family_bank_ledger_batches_deny_client_access" ON public."family_bank_ledger_batches" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "family_bank_ledger_entries_deny_client_access" ON public."family_bank_ledger_entries" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "family_bank_profiles_deny_client_access" ON public."family_bank_profiles" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "family_bank_service_requests_deny_client_access" ON public."family_bank_service_requests" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."family_goals" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."feature_requests" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."feature_votes" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."file_vault" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "deny_client_jr_action_proposals" ON public."jr_action_proposals" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."jr_blocks" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "deny_client_access_jr_business_daily_plans" ON public."jr_business_daily_plans" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_business_import_jobs_no_client_access" ON public."jr_business_import_jobs" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_business_workspace_members_no_client_access" ON public."jr_business_workspace_members" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "deny_client_access_jr_business_workspaces" ON public."jr_business_workspaces" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "deny_client_jr_capability_permissions" ON public."jr_capability_permissions" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_conversation_participants_deny_client_access" ON public."jr_conversation_participants" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_conversations_deny_client_access" ON public."jr_conversations" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."jr_coupon_users" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."jr_coupons" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."jr_deal_messages" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."jr_deal_rooms" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."jr_delivery_requests" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."jr_errand_events" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."jr_errands" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "deny_client_jr_growth_journal" ON public."jr_growth_journal" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."jr_listings" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "deny_client_jr_member_preferences" ON public."jr_member_preferences" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "deny_client_access_jr_member_state" ON public."jr_member_state" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."jr_memberships" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "deny_client_jr_memory_items" ON public."jr_memory_items" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_messages_deny_client_access" ON public."jr_messages" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."jr_notifications" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_opportunities_deny_client_access" ON public."jr_opportunities" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_opportunity_interests_deny_client_access" ON public."jr_opportunity_interests" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_opportunity_reports_deny_client_access" ON public."jr_opportunity_reports" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."jr_org_members" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."jr_organizations" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "deny_client_jr_partner_connections" ON public."jr_partner_connections" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "deny_client_jr_partner_events" ON public."jr_partner_events" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."jr_payments" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."jr_project_tasks" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."jr_projects" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."jr_referrals" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."jr_reports" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."jr_rewards" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."jr_riders" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "deny_client_jr_security_events" ON public."jr_security_events" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_status_updates_client_deny" ON public."jr_status_updates" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_status_views_client_deny" ON public."jr_status_views" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "deny_client_jr_world_progress" ON public."jr_world_progress" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."knowledge_articles" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."lab_experiments" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "deny all client access to authentication preferences" ON public."member_authentication_preferences" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."member_links" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."members" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."password_resets" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."pay_later_accounts" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."point_transactions" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "No direct client access to pos_counters" ON public."pos_counters" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "No direct client access to pos_products" ON public."pos_products" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "No direct client access to pos_sale_items" ON public."pos_sale_items" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "No direct client access to pos_sales" ON public."pos_sales" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "No direct client access to pos_stock_moves" ON public."pos_stock_moves" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."repayment_schedule" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."repayments" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."room_listings" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."sessions" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."social_comments" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."social_follows" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."social_likes" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."social_posts" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."trust_history" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

CREATE POLICY "jr_server_only_deny_api" ON public."ventures" AS PERMISSIVE FOR ALL TO "anon", "authenticated" USING (false) WITH CHECK (false);

-- Trigger definitions.

CREATE TRIGGER jr_security_events_no_truncate BEFORE TRUNCATE ON jr_security_events FOR EACH STATEMENT EXECUTE FUNCTION private.prevent_jr_security_event_mutation();

CREATE TRIGGER jr_security_events_no_update_delete BEFORE DELETE OR UPDATE ON jr_security_events FOR EACH ROW EXECUTE FUNCTION private.prevent_jr_security_event_mutation();

-- Explicit server-only API grants.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;

REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO service_role;

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO service_role;
