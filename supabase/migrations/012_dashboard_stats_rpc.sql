-- Migration 012: Dashboard stats RPC
-- Returns aggregated dashboard statistics from sync tables

CREATE OR REPLACE FUNCTION public.get_dashboard_stats(p_club_id TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_total_members INTEGER;
  v_active_members INTEGER;
  v_new_members_this_month INTEGER;
  v_today_checkins INTEGER;
  v_monthly_revenue NUMERIC;
  v_last_month_revenue NUMERIC;
  v_revenue_change NUMERIC;
  v_members_by_status JSONB;
  v_today_start TIMESTAMPTZ;
  v_month_start TIMESTAMPTZ;
  v_last_month_start TIMESTAMPTZ;
  v_last_month_end TIMESTAMPTZ;
BEGIN
  v_today_start    := date_trunc('day', NOW());
  v_month_start    := date_trunc('month', NOW());
  v_last_month_start := date_trunc('month', NOW() - INTERVAL '1 month');
  v_last_month_end := v_month_start;

  SELECT COUNT(*) INTO v_total_members FROM public.synced_members;

  SELECT COUNT(*) INTO v_active_members
  FROM public.synced_members
  WHERE status = 'active';

  SELECT COUNT(*) INTO v_new_members_this_month
  FROM public.synced_members
  WHERE created_at >= v_month_start;

  SELECT COUNT(*) INTO v_today_checkins
  FROM public.synced_checkins
  WHERE type = 'checkin' AND timestamp >= v_today_start;

  SELECT COALESCE(SUM(amount), 0) INTO v_monthly_revenue
  FROM public.synced_payments
  WHERE date >= v_month_start;

  SELECT COALESCE(SUM(amount), 0) INTO v_last_month_revenue
  FROM public.synced_payments
  WHERE date >= v_last_month_start AND date < v_last_month_end;

  IF v_last_month_revenue > 0 THEN
    v_revenue_change := ROUND(
      ((v_monthly_revenue - v_last_month_revenue) / v_last_month_revenue) * 100, 1
    );
  ELSE
    v_revenue_change := 0;
  END IF;

  SELECT COALESCE(jsonb_object_agg(status, cnt), '{}'::JSONB) INTO v_members_by_status
  FROM (
    SELECT COALESCE(status, 'unknown') AS status, COUNT(*) AS cnt
    FROM public.synced_members
    GROUP BY status
  ) s;

  RETURN jsonb_build_object(
    'totalMembers',          v_total_members,
    'activeMembers',         v_active_members,
    'newMembersThisMonth',   v_new_members_this_month,
    'todayCheckins',         v_today_checkins,
    'monthlyRevenue',        v_monthly_revenue,
    'revenueChange',         v_revenue_change,
    'membersByStatus',       v_members_by_status,
    'recentActivity',        '[]'::JSONB,
    'expiringMemberships',   '[]'::JSONB,
    'topDevices',            '[]'::JSONB
  );
END;
$$;
