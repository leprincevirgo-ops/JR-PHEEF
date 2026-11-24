-- Private, expiring invitations let members connect without disclosing JP identifiers.
CREATE TABLE IF NOT EXISTS public.jp_contact_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  CONSTRAINT jp_contact_invites_expiry_check CHECK (expires_at > created_at)
);
CREATE INDEX IF NOT EXISTS jp_contact_invites_member_created_idx
  ON public.jp_contact_invites(member_id, created_at DESC);
ALTER TABLE public.jp_contact_invites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.jp_contact_invites FROM anon, authenticated;
COMMENT ON TABLE public.jp_contact_invites IS
'Server-only hashed invitation tokens for private JR PHEEF connections. Never exposes JP numbers or member phone numbers.';
