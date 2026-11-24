-- Explicit server-only boundaries for private operational tables.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'dgbo_capabilities',
    'jp_contact_invites',
    'jr_ai_conversations',
    'jr_ai_messages',
    'jr_partner_inquiries'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated',t);
    EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role',t);
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname='public' AND tablename=t AND policyname='jr_server_only_deny_api'
    ) THEN
      EXECUTE format(
        'CREATE POLICY jr_server_only_deny_api ON public.%I FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)',
        t
      );
    END IF;
  END LOOP;
END $$;

-- Cover the foreign keys added by DGBO opportunity and business operations.
CREATE INDEX IF NOT EXISTS dgbo_opportunity_dossiers_created_by_member_id_idx ON public.dgbo_opportunity_dossiers(created_by_member_id);
CREATE INDEX IF NOT EXISTS dgbo_opportunity_dossiers_reviewed_by_member_id_idx ON public.dgbo_opportunity_dossiers(reviewed_by_member_id);
CREATE INDEX IF NOT EXISTS dgbo_opportunity_dossiers_submitted_by_member_id_idx ON public.dgbo_opportunity_dossiers(submitted_by_member_id);
CREATE INDEX IF NOT EXISTS dgbo_opportunity_events_actor_member_id_idx ON public.dgbo_opportunity_events(actor_member_id);
CREATE INDEX IF NOT EXISTS dgbo_opportunity_reviews_reviewer_member_id_idx ON public.dgbo_opportunity_reviews(reviewer_member_id);
CREATE INDEX IF NOT EXISTS dgbo_venture_projects_created_by_member_id_idx ON public.dgbo_venture_projects(created_by_member_id);
CREATE INDEX IF NOT EXISTS dgbo_venture_projects_owner_member_id_idx ON public.dgbo_venture_projects(owner_member_id);
CREATE INDEX IF NOT EXISTS jr_business_expenses_recorded_by_idx ON public.jr_business_expenses(recorded_by);
CREATE INDEX IF NOT EXISTS jr_business_purchase_order_items_product_id_idx ON public.jr_business_purchase_order_items(product_id);
CREATE INDEX IF NOT EXISTS jr_business_purchase_orders_created_by_idx ON public.jr_business_purchase_orders(created_by);
CREATE INDEX IF NOT EXISTS jr_business_purchase_orders_supplier_id_idx ON public.jr_business_purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS jr_business_sale_items_product_id_idx ON public.jr_business_sale_items(product_id);
CREATE INDEX IF NOT EXISTS jr_business_sale_items_sale_id_idx ON public.jr_business_sale_items(sale_id);
CREATE INDEX IF NOT EXISTS jr_business_sales_cashier_member_id_idx ON public.jr_business_sales(cashier_member_id);
CREATE INDEX IF NOT EXISTS jr_business_stock_movements_actor_member_id_idx ON public.jr_business_stock_movements(actor_member_id);
CREATE INDEX IF NOT EXISTS jr_business_stock_movements_product_id_idx ON public.jr_business_stock_movements(product_id);
CREATE INDEX IF NOT EXISTS jr_business_tasks_assigned_to_idx ON public.jr_business_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS jr_business_tasks_created_by_idx ON public.jr_business_tasks(created_by);
