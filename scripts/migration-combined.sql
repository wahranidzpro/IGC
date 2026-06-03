-- ============================================================
-- INFINITY GYM CENTER — Migration complète 013 + 014
-- Copiez-collez CE CONTENU dans le SQL Editor Supabase
-- ============================================================

-- ============================================================
-- MIGRATION 013: Reception & Coach Privileges
-- ============================================================

CREATE TABLE IF NOT EXISTS public.coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  club_id UUID REFERENCES public.clubs(id) ON DELETE SET NULL,
  speciality TEXT,
  bio TEXT,
  certifications JSONB DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT coaches_profile_id_unique UNIQUE (profile_id)
);

CREATE TABLE IF NOT EXISTS public.member_coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT member_coaches_coach_member_unique UNIQUE (coach_id, member_id)
);

CREATE TABLE IF NOT EXISTS public.workout_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  exercises JSONB DEFAULT '[]',
  assigned_to JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.nutrition_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  meals JSONB DEFAULT '[]',
  assigned_to JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.progress_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  weight DECIMAL,
  body_fat DECIMAL,
  muscle_mass DECIMAL,
  waist_circumference DECIMAL,
  notes TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('coaching', 'class', 'appointment')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rfid_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
  rfid_code TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT rfid_cards_rfid_code_unique UNIQUE (rfid_code)
);

-- Indexes

CREATE INDEX IF NOT EXISTS idx_coaches_profile_id ON public.coaches(profile_id);
CREATE INDEX IF NOT EXISTS idx_coaches_club_id ON public.coaches(club_id);
CREATE INDEX IF NOT EXISTS idx_coaches_created_at ON public.coaches(created_at);
CREATE INDEX IF NOT EXISTS idx_member_coaches_coach_id ON public.member_coaches(coach_id);
CREATE INDEX IF NOT EXISTS idx_member_coaches_member_id ON public.member_coaches(member_id);
CREATE INDEX IF NOT EXISTS idx_member_coaches_assigned_at ON public.member_coaches(assigned_at);
CREATE INDEX IF NOT EXISTS idx_workout_programs_coach_id ON public.workout_programs(coach_id);
CREATE INDEX IF NOT EXISTS idx_workout_programs_created_at ON public.workout_programs(created_at);
CREATE INDEX IF NOT EXISTS idx_nutrition_programs_coach_id ON public.nutrition_programs(coach_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_programs_created_at ON public.nutrition_programs(created_at);
CREATE INDEX IF NOT EXISTS idx_progress_logs_member_id ON public.progress_logs(member_id);
CREATE INDEX IF NOT EXISTS idx_progress_logs_coach_id ON public.progress_logs(coach_id);
CREATE INDEX IF NOT EXISTS idx_progress_logs_logged_at ON public.progress_logs(logged_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_schedules_coach_id ON public.schedules(coach_id);
CREATE INDEX IF NOT EXISTS idx_schedules_start_time ON public.schedules(start_time);
CREATE INDEX IF NOT EXISTS idx_schedules_created_at ON public.schedules(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_member_id ON public.notifications(member_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_rfid_cards_member_id ON public.rfid_cards(member_id);
CREATE INDEX IF NOT EXISTS idx_rfid_cards_rfid_code ON public.rfid_cards(rfid_code);
CREATE INDEX IF NOT EXISTS idx_rfid_cards_created_at ON public.rfid_cards(created_at);

-- RLS

ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rfid_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_all_coaches" ON public.coaches FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "reception_read_coaches" ON public.coaches FOR SELECT USING (get_user_role() IN ('admin', 'reception'));
CREATE POLICY "coach_manage_own" ON public.coaches FOR ALL USING (profile_id = auth.uid());
CREATE POLICY "service_role_all_coaches" ON public.coaches FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "admin_all_member_coaches" ON public.member_coaches FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "reception_all_member_coaches" ON public.member_coaches FOR ALL USING (get_user_role() IN ('admin', 'reception'));
CREATE POLICY "coach_read_assigned" ON public.member_coaches FOR SELECT USING (coach_id IN (SELECT id FROM public.coaches WHERE profile_id = auth.uid()));
CREATE POLICY "coach_assign_member" ON public.member_coaches FOR INSERT WITH CHECK (coach_id IN (SELECT id FROM public.coaches WHERE profile_id = auth.uid()));
CREATE POLICY "member_read_own_coach" ON public.member_coaches FOR SELECT USING (member_id IN (SELECT id FROM public.members WHERE profile_id = auth.uid()));
CREATE POLICY "service_role_all_member_coaches" ON public.member_coaches FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "admin_all_workout_programs" ON public.workout_programs FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "reception_read_workout_programs" ON public.workout_programs FOR SELECT USING (get_user_role() = 'reception');
CREATE POLICY "coach_all_own_workout_programs" ON public.workout_programs FOR ALL USING (coach_id IN (SELECT id FROM public.coaches WHERE profile_id = auth.uid()));
CREATE POLICY "member_read_assigned_workout_programs" ON public.workout_programs FOR SELECT USING (auth.uid() IN (SELECT m.profile_id FROM public.members m WHERE m.id::text = ANY (ARRAY(SELECT jsonb_array_elements_text(assigned_to)))));
CREATE POLICY "service_role_all_workout_programs" ON public.workout_programs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "admin_all_nutrition_programs" ON public.nutrition_programs FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "reception_read_nutrition_programs" ON public.nutrition_programs FOR SELECT USING (get_user_role() = 'reception');
CREATE POLICY "coach_all_own_nutrition_programs" ON public.nutrition_programs FOR ALL USING (coach_id IN (SELECT id FROM public.coaches WHERE profile_id = auth.uid()));
CREATE POLICY "member_read_assigned_nutrition_programs" ON public.nutrition_programs FOR SELECT USING (auth.uid() IN (SELECT m.profile_id FROM public.members m WHERE m.id::text = ANY (ARRAY(SELECT jsonb_array_elements_text(assigned_to)))));
CREATE POLICY "service_role_all_nutrition_programs" ON public.nutrition_programs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "admin_all_progress_logs" ON public.progress_logs FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "reception_read_progress_logs" ON public.progress_logs FOR SELECT USING (get_user_role() = 'reception');
CREATE POLICY "coach_manage_progress_logs" ON public.progress_logs FOR ALL USING (coach_id IN (SELECT id FROM public.coaches WHERE profile_id = auth.uid()));
CREATE POLICY "member_read_own_progress_logs" ON public.progress_logs FOR SELECT USING (member_id IN (SELECT id FROM public.members WHERE profile_id = auth.uid()));
CREATE POLICY "service_role_all_progress_logs" ON public.progress_logs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "admin_all_messages" ON public.messages FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "reception_all_messages" ON public.messages FOR ALL USING (get_user_role() IN ('admin', 'reception'));
CREATE POLICY "user_own_messages" ON public.messages FOR ALL USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "service_role_all_messages" ON public.messages FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "admin_all_schedules" ON public.schedules FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "reception_all_schedules" ON public.schedules FOR ALL USING (get_user_role() IN ('admin', 'reception'));
CREATE POLICY "coach_all_own_schedules" ON public.schedules FOR ALL USING (coach_id IN (SELECT id FROM public.coaches WHERE profile_id = auth.uid()));
CREATE POLICY "member_read_own_schedules" ON public.schedules FOR SELECT USING (member_id IN (SELECT id FROM public.members WHERE profile_id = auth.uid()));
CREATE POLICY "service_role_all_schedules" ON public.schedules FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "admin_all_notifications" ON public.notifications FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "reception_all_notifications" ON public.notifications FOR ALL USING (get_user_role() IN ('admin', 'reception'));
CREATE POLICY "member_manage_own_notifications" ON public.notifications FOR ALL USING (member_id IN (SELECT id FROM public.members WHERE profile_id = auth.uid()));
CREATE POLICY "service_role_all_notifications" ON public.notifications FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "admin_all_rfid_cards" ON public.rfid_cards FOR ALL USING (get_user_role() = 'admin');
CREATE POLICY "reception_all_rfid_cards" ON public.rfid_cards FOR ALL USING (get_user_role() IN ('admin', 'reception'));
CREATE POLICY "member_read_own_rfid_cards" ON public.rfid_cards FOR SELECT USING (member_id IN (SELECT id FROM public.members WHERE profile_id = auth.uid()));
CREATE POLICY "service_role_all_rfid_cards" ON public.rfid_cards FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Triggers

CREATE TRIGGER trg_coaches_updated_at BEFORE UPDATE ON public.coaches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_workout_programs_updated_at BEFORE UPDATE ON public.workout_programs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_nutrition_programs_updated_at BEFORE UPDATE ON public.nutrition_programs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_schedules_updated_at BEFORE UPDATE ON public.schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_rfid_cards_updated_at BEFORE UPDATE ON public.rfid_cards FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.coaches; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.member_coaches; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.messages; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- MIGRATION 014: Auto Subscriptions & Settings
-- ============================================================

CREATE TABLE IF NOT EXISTS public.settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY settings_read_all ON public.settings FOR SELECT USING (get_user_role() IS NOT NULL);
CREATE POLICY settings_write_admin ON public.settings FOR ALL USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

CREATE OR REPLACE FUNCTION public.ensure_user_subscription(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_result JSONB;
BEGIN
  SELECT role INTO v_role FROM gym_users WHERE auth_user_id = p_user_id;
  INSERT INTO public.subscriptions (user_id, status, plan_name)
  VALUES (p_user_id, 'active', 'Standard')
  ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.memberships_control (user_id, approved_by_admin, approved_by_reception)
  VALUES (p_user_id, v_role IN ('admin', 'reception', 'coach'), v_role IN ('admin', 'reception'))
  ON CONFLICT (user_id) DO NOTHING;
  SELECT jsonb_build_object('subscription_created', true, 'control_created', true, 'role', v_role) INTO v_result;
  RETURN v_result;
END;
$$;

DO $$
DECLARE
  v_rec RECORD;
BEGIN
  FOR v_rec IN
    SELECT gu.auth_user_id, gu.role
    FROM gym_users gu
    WHERE gu.auth_user_id IS NOT NULL
      AND (NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = gu.auth_user_id)
        OR NOT EXISTS (SELECT 1 FROM memberships_control mc WHERE mc.user_id = gu.auth_user_id))
  LOOP
    PERFORM public.ensure_user_subscription(v_rec.auth_user_id);
  END LOOP;
END $$;

INSERT INTO public.settings (key, value) VALUES
  ('structure_locked', 'false'),
  ('sync_version', '1'),
  ('last_migration', '014')
ON CONFLICT (key) DO NOTHING;
