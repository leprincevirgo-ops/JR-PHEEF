-- Transport records remain server-mediated. Express authenticates members and
-- performs ownership/participant checks before using the service role.
-- Browser clients must never query these operational tables directly.
ALTER TABLE public.jr_transport_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jr_transport_fare_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jr_transport_vehicle_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jr_transport_vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS jr_transport_documents_client_deny ON public.jr_transport_documents;
CREATE POLICY jr_transport_documents_client_deny ON public.jr_transport_documents
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS jr_transport_fare_quotes_client_deny ON public.jr_transport_fare_quotes;
CREATE POLICY jr_transport_fare_quotes_client_deny ON public.jr_transport_fare_quotes
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS jr_transport_vehicle_access_client_deny ON public.jr_transport_vehicle_access;
CREATE POLICY jr_transport_vehicle_access_client_deny ON public.jr_transport_vehicle_access
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS jr_transport_vehicles_client_deny ON public.jr_transport_vehicles;
CREATE POLICY jr_transport_vehicles_client_deny ON public.jr_transport_vehicles
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

REVOKE ALL ON TABLE public.jr_transport_documents FROM anon, authenticated;
REVOKE ALL ON TABLE public.jr_transport_fare_quotes FROM anon, authenticated;
REVOKE ALL ON TABLE public.jr_transport_vehicle_access FROM anon, authenticated;
REVOKE ALL ON TABLE public.jr_transport_vehicles FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.jr_transport_documents TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.jr_transport_fare_quotes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.jr_transport_vehicle_access TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.jr_transport_vehicles TO service_role;
