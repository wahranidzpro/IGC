"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"

interface NotificationBadgeProps {
  memberId: string | undefined
}

export default function NotificationBadge({ memberId }: NotificationBadgeProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!memberId) return

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const fetchCount = async () => {
      const { count: total } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("member_id", memberId)
        .eq("is_read", false)
      setCount(total ?? 0)
    }

    fetchCount()

    const channel = supabase
      .channel(`notification-badge-${memberId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `member_id=eq.${memberId}`,
        },
        () => {
          fetchCount()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [memberId])

  if (count === 0) return null

  return (
    <span
      className="absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-[#FF4D4D] text-white shadow-[0_0_6px_rgba(255,77,77,0.6)]"
      style={{ minWidth: 16, height: 16, fontSize: 10, fontWeight: 600, lineHeight: 1 }}
    >
      {count > 99 ? "99+" : count}
    </span>
  )
}
