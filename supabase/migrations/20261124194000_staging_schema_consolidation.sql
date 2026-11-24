-- Additive consolidation of staging-only JR LINK, transport, worlds and venture membership schema.
-- All new operational tables remain server-only; public clients cannot read or write them.

CREATE TABLE IF NOT EXISTS public.jr_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  description text NOT NULL DEFAULT '' CHECK (char_length(description) <= 1000),
  category text NOT NULL DEFAULT 'community' CHECK (char_length(category) <= 60),
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','private')),
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS jr_channels_owner_member_idx ON public.jr_channels(owner_member_id);
CREATE INDEX IF NOT EXISTS jr_channels_visibility_created_idx ON public.jr_channels(visibility,created_at DESC);

CREATE TABLE IF NOT EXISTS public.jr_channel_members (
  channel_id uuid NOT NULL REFERENCES public.jr_channels(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'follower' CHECK (role IN ('owner','moderator','follower')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (channel_id,member_id)
);
CREATE INDEX IF NOT EXISTS jr_channel_members_member_idx ON public.jr_channel_members(member_id,joined_at DESC);

CREATE TABLE IF NOT EXISTS public.jr_channel_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.jr_channels(id) ON DELETE CASCADE,
  author_member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '' CHECK (char_length(body) <= 4000),
  media jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (char_length(body)>0 OR jsonb_array_length(media)>0)
);
CREATE INDEX IF NOT EXISTS jr_channel_posts_author_member_idx ON public.jr_channel_posts(author_member_id);
CREATE INDEX IF NOT EXISTS jr_channel_posts_channel_created_idx ON public.jr_channel_posts(channel_id,created_at DESC);

CREATE TABLE IF NOT EXISTS public.jr_message_receipts (
  message_id uuid NOT NULL REFERENCES public.jr_messages(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id,recipient_id),
  CHECK (read_at IS NULL OR delivered_at IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS jr_message_receipts_recipient_idx ON public.jr_message_receipts(recipient_id,delivered_at,read_at);

CREATE TABLE IF NOT EXISTS public.jr_transport_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_member_id uuid NOT NULL REFERENCES public.members(id),
  vehicle_type text NOT NULL CHECK (vehicle_type IN ('motorbike','bicycle','car','tuk_tuk','van','pickup','small_truck','truck','lorry','other')),
  make text NOT NULL DEFAULT '',
  model text NOT NULL DEFAULT '',
  registration_number text NOT NULL,
  capacity_value numeric,
  capacity_unit text NOT NULL DEFAULT 'passengers' CHECK (capacity_unit IN ('passengers','kg','tonnes','cubic_metres')),
  country_code char(2) NOT NULL DEFAULT 'KE',
  service_area_city text NOT NULL,
  verification_status text NOT NULL DEFAULT 'pending_review' CHECK (verification_status IN ('pending_review','verified','rejected','suspended')),
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(country_code,registration_number)
);
CREATE INDEX IF NOT EXISTS jr_transport_vehicles_owner_idx ON public.jr_transport_vehicles(owner_member_id);

CREATE TABLE IF NOT EXISTS public.jr_transport_fare_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.members(id),
  service_kind text NOT NULL CHECK (service_kind IN ('passenger','parcel','cargo','moving','business_delivery')),
  pickup text NOT NULL,
  destination text NOT NULL,
  service_area_city text NOT NULL DEFAULT 'Nairobi',
  country_code char(2) NOT NULL DEFAULT 'KE',
  distance_km numeric NOT NULL CHECK (distance_km>0 AND distance_km<=3000),
  duration_minutes integer NOT NULL CHECK (duration_minutes>0 AND duration_minutes<=2880),
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  recommendations jsonb NOT NULL DEFAULT '[]'::jsonb,
  selected_mode text,
  status text NOT NULL DEFAULT 'estimate_only' CHECK (status IN ('estimate_only','request_submitted','expired','cancelled')),
  expires_at timestamptz NOT NULL DEFAULT (now()+interval '30 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS jr_transport_fare_quotes_requester_idx ON public.jr_transport_fare_quotes(requester_id,created_at DESC);

CREATE TABLE IF NOT EXISTS public.jr_transport_vehicle_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES public.jr_transport_vehicles(id) ON DELETE CASCADE,
  owner_member_id uuid NOT NULL REFERENCES public.members(id),
  driver_member_id uuid NOT NULL REFERENCES public.members(id),
  status text NOT NULL DEFAULT 'pending_driver_consent' CHECK (status IN ('pending_driver_consent','active','rejected','revoked')),
  requested_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  UNIQUE(vehicle_id,driver_member_id)
);
CREATE INDEX IF NOT EXISTS jr_transport_vehicle_access_driver_idx ON public.jr_transport_vehicle_access(driver_member_id,status);
CREATE INDEX IF NOT EXISTS jr_transport_vehicle_access_owner_idx ON public.jr_transport_vehicle_access(owner_member_id);

CREATE TABLE IF NOT EXISTS public.jr_transport_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.jr_riders(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  file_vault_id uuid NOT NULL REFERENCES public.file_vault(id) ON DELETE RESTRICT,
  document_type text NOT NULL CHECK (document_type IN ('identity','driving_licence','vehicle_logbook','insurance','inspection','business_permit','other')),
  status text NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review','verified','rejected','expired')),
  reviewed_by uuid REFERENCES public.members(id),
  review_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  UNIQUE(provider_id,file_vault_id)
);
CREATE INDEX IF NOT EXISTS jr_transport_documents_file_idx ON public.jr_transport_documents(file_vault_id);
CREATE INDEX IF NOT EXISTS jr_transport_documents_member_idx ON public.jr_transport_documents(member_id);
CREATE INDEX IF NOT EXISTS jr_transport_documents_provider_idx ON public.jr_transport_documents(provider_id,created_at DESC);
CREATE INDEX IF NOT EXISTS jr_transport_documents_provider_status_idx ON public.jr_transport_documents(provider_id,status,document_type);
CREATE INDEX IF NOT EXISTS jr_transport_documents_reviewer_idx ON public.jr_transport_documents(reviewed_by);

CREATE TABLE IF NOT EXISTS public.jr_worlds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  world_type text NOT NULL CHECK (world_type IN ('personal','family_personal','business','education','commerce','family_finance','creative','community','global')),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 120),
  description text NOT NULL DEFAULT '' CHECK (char_length(description)<=2000),
  intended_members text NOT NULL DEFAULT 'owner' CHECK (char_length(intended_members)<=500),
  permissions jsonb NOT NULL DEFAULT '{"owner":"manage","members":"invite-only"}'::jsonb,
  workflows jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS jr_worlds_owner_created_idx ON public.jr_worlds(owner_member_id,created_at DESC);

CREATE TABLE IF NOT EXISTS public.venture_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_slug text NOT NULL REFERENCES public.ventures(slug) ON UPDATE CASCADE ON DELETE RESTRICT,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  role_key text NOT NULL CHECK (role_key ~ '^[a-z][a-z0-9_-]{1,59}$'),
  status text NOT NULL DEFAULT 'applied' CHECK (status IN ('applied','approved','rejected','suspended','revoked')),
  application_data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(application_data)='object'),
  consent_version text NOT NULL,
  consented_at timestamptz DEFAULT now(),
  reviewed_by uuid REFERENCES public.members(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_note text CHECK (review_note IS NULL OR char_length(review_note)<=1200),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(venture_slug,member_id)
);
CREATE INDEX IF NOT EXISTS venture_memberships_member_status_idx ON public.venture_memberships(member_id,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS venture_memberships_reviewed_by_idx ON public.venture_memberships(reviewed_by);
CREATE INDEX IF NOT EXISTS venture_memberships_venture_status_idx ON public.venture_memberships(venture_slug,status,created_at DESC);

CREATE TABLE IF NOT EXISTS public.venture_membership_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_id uuid NOT NULL REFERENCES public.venture_memberships(id) ON DELETE CASCADE,
  venture_slug text NOT NULL REFERENCES public.ventures(slug) ON UPDATE CASCADE ON DELETE RESTRICT,
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  actor_member_id uuid REFERENCES public.members(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN ('applied','approved','rejected','suspended','revoked','reapplied')),
  event_data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(event_data)='object'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS venture_membership_events_actor_member_id_idx ON public.venture_membership_events(actor_member_id);
CREATE INDEX IF NOT EXISTS venture_membership_events_member_idx ON public.venture_membership_events(member_id,created_at DESC);
CREATE INDEX IF NOT EXISTS venture_membership_events_membership_idx ON public.venture_membership_events(membership_id,created_at DESC);
CREATE INDEX IF NOT EXISTS venture_membership_events_venture_slug_idx ON public.venture_membership_events(venture_slug);

CREATE TABLE IF NOT EXISTS public.venture_registration_templates (
  venture_slug text PRIMARY KEY REFERENCES public.ventures(slug) ON UPDATE CASCADE ON DELETE RESTRICT,
  version text NOT NULL,
  form_schema jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(form_schema)='object'),
  active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Additive columns that exist in the consolidated staging schema.
ALTER TABLE public.jr_conversation_participants ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'member';
ALTER TABLE public.jr_conversations ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.jr_conversations ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.jr_delivery_requests ADD COLUMN IF NOT EXISTS service_mode text NOT NULL DEFAULT 'motorbike';
ALTER TABLE public.jr_delivery_requests ADD COLUMN IF NOT EXISTS service_kind text NOT NULL DEFAULT 'parcel';
ALTER TABLE public.jr_delivery_requests ADD COLUMN IF NOT EXISTS quote_id uuid;
ALTER TABLE public.jr_delivery_requests ADD COLUMN IF NOT EXISTS distance_km numeric;
ALTER TABLE public.jr_delivery_requests ADD COLUMN IF NOT EXISTS duration_minutes integer;
ALTER TABLE public.jr_delivery_requests ADD COLUMN IF NOT EXISTS fare_breakdown jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.jr_delivery_requests ADD COLUMN IF NOT EXISTS provider_earnings numeric;
ALTER TABLE public.jr_listings ADD COLUMN IF NOT EXISTS media jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.jr_messages ADD COLUMN IF NOT EXISTS client_message_id uuid;
ALTER TABLE public.jr_opportunities ADD COLUMN IF NOT EXISTS media jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.jr_riders ADD COLUMN IF NOT EXISTS provider_type text NOT NULL DEFAULT 'rider';
ALTER TABLE public.jr_riders ADD COLUMN IF NOT EXISTS service_types text[] NOT NULL DEFAULT ARRAY['parcel_delivery'::text];
ALTER TABLE public.jr_riders ADD COLUMN IF NOT EXISTS service_area_city text;
ALTER TABLE public.jr_riders ADD COLUMN IF NOT EXISTS country_code char(2) NOT NULL DEFAULT 'KE';
ALTER TABLE public.jr_riders ADD COLUMN IF NOT EXISTS has_vehicle boolean NOT NULL DEFAULT true;
ALTER TABLE public.jr_riders ADD COLUMN IF NOT EXISTS vehicle_owner_member_id uuid;
ALTER TABLE public.jr_riders ADD COLUMN IF NOT EXISTS verification_status text NOT NULL DEFAULT 'pending_review';
ALTER TABLE public.jr_riders ADD COLUMN IF NOT EXISTS licence_status text NOT NULL DEFAULT 'not_submitted';
ALTER TABLE public.jr_riders ADD COLUMN IF NOT EXISTS insurance_status text NOT NULL DEFAULT 'not_submitted';
ALTER TABLE public.jr_riders ADD COLUMN IF NOT EXISTS registration_submitted_at timestamptz;
ALTER TABLE public.jr_riders ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
ALTER TABLE public.jr_status_updates ADD COLUMN IF NOT EXISTS media jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.jr_status_updates ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS country_of_origin_code char(2);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.jr_conversation_participants'::regclass AND conname='jr_conversation_participants_role_check') THEN
    ALTER TABLE public.jr_conversation_participants ADD CONSTRAINT jr_conversation_participants_role_check CHECK (role IN ('owner','admin','member'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.jr_delivery_requests'::regclass AND conname='jr_delivery_requests_quote_id_fkey') THEN
    ALTER TABLE public.jr_delivery_requests ADD CONSTRAINT jr_delivery_requests_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.jr_transport_fare_quotes(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.jr_riders'::regclass AND conname='jr_riders_vehicle_owner_member_id_fkey') THEN
    ALTER TABLE public.jr_riders ADD CONSTRAINT jr_riders_vehicle_owner_member_id_fkey FOREIGN KEY (vehicle_owner_member_id) REFERENCES public.members(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.jr_riders'::regclass AND conname='jr_riders_provider_type_check') THEN
    ALTER TABLE public.jr_riders ADD CONSTRAINT jr_riders_provider_type_check CHECK (provider_type IN ('rider','driver','courier','vehicle_owner','fleet_operator'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.jr_riders'::regclass AND conname='jr_riders_service_types_check') THEN
    ALTER TABLE public.jr_riders ADD CONSTRAINT jr_riders_service_types_check CHECK (cardinality(service_types)>=1 AND cardinality(service_types)<=8);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.jr_riders'::regclass AND conname='jr_riders_verification_status_check') THEN
    ALTER TABLE public.jr_riders ADD CONSTRAINT jr_riders_verification_status_check CHECK (verification_status IN ('pending_review','approved','rejected','suspended','more_info_required'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.jr_riders'::regclass AND conname='jr_riders_licence_status_check') THEN
    ALTER TABLE public.jr_riders ADD CONSTRAINT jr_riders_licence_status_check CHECK (licence_status IN ('not_submitted','pending_review','verified','rejected','not_required'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.jr_riders'::regclass AND conname='jr_riders_insurance_status_check') THEN
    ALTER TABLE public.jr_riders ADD CONSTRAINT jr_riders_insurance_status_check CHECK (insurance_status IN ('not_submitted','pending_review','verified','rejected','not_required'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.members'::regclass AND conname='members_country_of_origin_code_format') THEN
    ALTER TABLE public.members ADD CONSTRAINT members_country_of_origin_code_format CHECK (country_of_origin_code IS NULL OR country_of_origin_code ~ '^[A-Z]{2}$');
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS jr_messages_sender_client_id_uidx ON public.jr_messages(sender_id,client_message_id) WHERE client_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS jr_delivery_requests_quote_idx ON public.jr_delivery_requests(quote_id);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'jr_channels','jr_channel_members','jr_channel_posts','jr_message_receipts',
    'jr_transport_vehicles','jr_transport_fare_quotes','jr_transport_vehicle_access',
    'jr_transport_documents','jr_worlds','venture_memberships',
    'venture_membership_events','venture_registration_templates'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated',t);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role',t);
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename=t AND policyname='jr_server_only_deny_api') THEN
      EXECUTE format('CREATE POLICY jr_server_only_deny_api ON public.%I FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)',t);
    END IF;
  END LOOP;
END $$;

REVOKE ALL ON TABLE public.jr_channels,public.jr_channel_members,public.jr_channel_posts,public.jr_message_receipts,
  public.jr_transport_vehicles,public.jr_transport_fare_quotes,public.jr_transport_vehicle_access,
  public.jr_transport_documents,public.jr_worlds,public.venture_memberships,
  public.venture_membership_events,public.venture_registration_templates
FROM anon,authenticated;
GRANT ALL ON TABLE public.jr_channels,public.jr_channel_members,public.jr_channel_posts,public.jr_message_receipts,
  public.jr_transport_vehicles,public.jr_transport_fare_quotes,public.jr_transport_vehicle_access,
  public.jr_transport_documents,public.jr_worlds,public.venture_memberships,
  public.venture_membership_events,public.venture_registration_templates
TO service_role;

COMMENT ON TABLE public.venture_memberships IS 'Private, consent-based membership and role assignments for individual JR PHEEF venture worlds.';
COMMENT ON TABLE public.jr_transport_fare_quotes IS 'Private transport estimates; an estimate is not a booking or a guaranteed fare.';
COMMENT ON TABLE public.jr_transport_documents IS 'Private provider verification documents; file bytes remain in the private file vault.';
