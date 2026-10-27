-- Remove only verified duplicate indexes reported by Supabase.
-- Constraint-backed indexes (PRIMARY KEY / UNIQUE constraints) are retained.
-- All dropped indexes had an identical remaining index on the same columns/predicate.

drop index if exists public.jr_blocks_unique;
drop index if exists public.jr_listings_category_idx;
drop index if exists public.listings_member_idx;
drop index if exists public.listings_status_idx;
drop index if exists public.jr_memberships_member_unique;
drop index if exists public.jr_payments_checkout_unique;
drop index if exists public.jr_payments_receipt_unique;
drop index if exists public.jr_riders_member_unique;
drop index if exists public.reset_phone_idx;
drop index if exists public.sessions_token_idx;
drop index if exists public.social_posts_member_idx;
