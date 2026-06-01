-- Migration 008: Club Info table + synced_members created_at index

-- ============================================
-- 1. Create synced_club_info table
-- ============================================

CREATE TABLE IF NOT EXISTS public.synced_club_info (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  club_name TEXT NOT NULL DEFAULT 'Infinity Gym',
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  max_capacity INTEGER DEFAULT 100,
  currency TEXT DEFAULT 'DA',
  timezone TEXT DEFAULT 'Africa/Algiers',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. Create upsert_club_info RPC
-- ============================================

CREATE OR REPLACE FUNCTION public.upsert_club_info(
  p_id BIGINT DEFAULT NULL,
  p_club_name TEXT DEFAULT 'Infinity Gym',
  p_phone TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_website TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_max_capacity INTEGER DEFAULT 100,
  p_currency TEXT DEFAULT 'DA',
  p_timezone TEXT DEFAULT 'Africa/Algiers'
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_id BIGINT;
BEGIN
  INSERT INTO public.synced_club_info (id, club_name, phone, email, website, address, max_capacity, currency, timezone, updated_at)
  VALUES (
    COALESCE(p_id, (SELECT id FROM public.synced_club_info LIMIT 1)),
    p_club_name, p_phone, p_email, p_website, p_address, p_max_capacity, p_currency, p_timezone, NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    club_name = EXCLUDED.club_name,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    website = EXCLUDED.website,
    address = EXCLUDED.address,
    max_capacity = EXCLUDED.max_capacity,
    currency = EXCLUDED.currency,
    timezone = EXCLUDED.timezone,
    updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ============================================
-- 3. RLS policy for synced_club_info
-- ============================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'synced_club_info' AND policyname = 'Service role full access synced_club_info') THEN
    ALTER TABLE public.synced_club_info ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Service role full access synced_club_info" ON public.synced_club_info FOR ALL USING (true);
  END IF;
END $$;

-- ============================================
-- 4. Enable Realtime for synced_club_info
-- ============================================

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'synced_club_info') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.synced_club_info;
  END IF;
END $$;

-- ============================================
-- 5. Add index on synced_members(created_at)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_synced_members_created_at ON public.synced_members(created_at);
