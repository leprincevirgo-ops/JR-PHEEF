-- Cover all 24 foreign-key columns flagged by the staging Performance Advisor.
-- Additive indexes only; no table data, constraints, or access policies are changed.
create index if not exists dgbo_capabilities_created_by_idx on public.dgbo_capabilities (created_by);
create index if not exists dgbo_opportunity_dossiers_created_by_member_id_idx on public.dgbo_opportunity_dossiers (created_by_member_id);
create index if not exists dgbo_opportunity_dossiers_reviewed_by_member_id_idx on public.dgbo_opportunity_dossiers (reviewed_by_member_id);
create index if not exists dgbo_opportunity_dossiers_submitted_by_member_id_idx on public.dgbo_opportunity_dossiers (submitted_by_member_id);
create index if not exists dgbo_opportunity_events_actor_member_id_idx on public.dgbo_opportunity_events (actor_member_id);
create index if not exists dgbo_opportunity_reviews_reviewer_member_id_idx on public.dgbo_opportunity_reviews (reviewer_member_id);
create index if not exists dgbo_venture_projects_created_by_member_id_idx on public.dgbo_venture_projects (created_by_member_id);
create index if not exists dgbo_venture_projects_owner_member_id_idx on public.dgbo_venture_projects (owner_member_id);
create index if not exists jr_ai_messages_member_id_idx on public.jr_ai_messages (member_id);
create index if not exists jr_business_expenses_recorded_by_idx on public.jr_business_expenses (recorded_by);
create index if not exists jr_business_purchase_order_items_product_id_idx on public.jr_business_purchase_order_items (product_id);
create index if not exists jr_business_purchase_orders_created_by_idx on public.jr_business_purchase_orders (created_by);
create index if not exists jr_business_purchase_orders_supplier_id_idx on public.jr_business_purchase_orders (supplier_id);
create index if not exists jr_business_sale_items_product_id_idx on public.jr_business_sale_items (product_id);
create index if not exists jr_business_sale_items_sale_id_idx on public.jr_business_sale_items (sale_id);
create index if not exists jr_business_sales_cashier_member_id_idx on public.jr_business_sales (cashier_member_id);
create index if not exists jr_business_stock_movements_actor_member_id_idx on public.jr_business_stock_movements (actor_member_id);
create index if not exists jr_business_stock_movements_product_id_idx on public.jr_business_stock_movements (product_id);
create index if not exists jr_business_tasks_assigned_to_idx on public.jr_business_tasks (assigned_to);
create index if not exists jr_business_tasks_created_by_idx on public.jr_business_tasks (created_by);
create index if not exists jr_partner_inquiries_member_id_idx on public.jr_partner_inquiries (member_id);
create index if not exists venture_membership_events_actor_member_id_idx on public.venture_membership_events (actor_member_id);
create index if not exists venture_membership_events_venture_slug_idx on public.venture_membership_events (venture_slug);
create index if not exists venture_memberships_reviewed_by_idx on public.venture_memberships (reviewed_by);
