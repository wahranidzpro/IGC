'use client'

import { useRealtimeSync } from '@/lib/supabase/realtime'

export default function RealtimeProvider({ children }: { children: React.ReactNode }) {
  useRealtimeSync()
  return <>{children}</>
}
