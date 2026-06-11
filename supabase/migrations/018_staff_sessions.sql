-- Migration 018: Add staff_sessions table for tracking staff login sessions

-- Create staff_sessions table
CREATE TABLE IF NOT EXISTS public.staff_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gym_user_id UUID REFERENCES public.gym_users(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  device_fingerprint TEXT,
  device_info TEXT,
  ip_address TEXT,
  login_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  logout_at TIMESTAMPTZ,
  last_heartbeat_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_staff_sessions_gym_user_id ON public.staff_sessions(gym_user_id);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_status ON public.staff_sessions(status);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_login_at ON public.staff_sessions(login_at DESC);
CREATE INDEX IF NOT EXISTS idx_staff_sessions_active_lookup ON public.staff_sessions(gym_user_id, status, last_heartbeat_at) WHERE status = 'active';
