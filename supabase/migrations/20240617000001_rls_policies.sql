-- RLS Policies for all synced tables
-- This migration enables Row Level Security and creates policies for service_role and authenticated users

-- Helper: generate RLS policies for a given table
do $$
declare
  tbl text;
  tables text[] := array[
    'synced_members',
    'synced_payments',
    'synced_checkins',
    'synced_products',
    'synced_programs',
    'synced_subscription_plans',
    'synced_sales',
    'synced_employees',
    'synced_absences',
    'synced_payroll',
    'synced_coaches',
    'synced_expenses',
    'synced_private_sessions',
    'synced_events',
    'synced_event_registrations',
    'synced_rewards',
    'synced_product_categories',
    'synced_whatsapp_campaigns',
    'synced_points_ledger',
    'synced_pin_users'
  ];
begin
  foreach tbl in array tables
  loop
    execute format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
    execute format('DROP POLICY IF EXISTS "service_role_all" ON %I;', tbl);
    execute format('CREATE POLICY "service_role_all" ON %I FOR ALL TO service_role USING (true) WITH CHECK (true);', tbl);
    execute format('DROP POLICY IF EXISTS "authenticated_read" ON %I;', tbl);
    execute format('CREATE POLICY "authenticated_read" ON %I FOR SELECT TO authenticated USING (true);', tbl);
  end loop;
end $$;

-- Audit logs: authenticated users can insert
ALTER TABLE IF EXISTS audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all" ON audit_logs;
CREATE POLICY "service_role_all" ON audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_insert" ON audit_logs;
CREATE POLICY "authenticated_insert" ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "authenticated_read" ON audit_logs;
CREATE POLICY "authenticated_read" ON audit_logs FOR SELECT TO authenticated USING (true);
