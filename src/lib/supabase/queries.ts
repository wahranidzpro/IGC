import { createBrowserClient } from "@supabase/ssr"

function sb() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export const profileQueries = {
  get: (id: string) =>
    sb().from("profiles").select("*").eq("id", id).single(),
  update: (id: string, data: Record<string, unknown>) =>
    sb().from("profiles").update(data).eq("id", id),
}

export const memberQueries = {
  list: () =>
    sb().from("members").select("*, profile:profiles(*), club:clubs(*)"),
  get: (id: string) =>
    sb().from("members").select("*, profile:profiles(*), club:clubs(*)").eq("id", id).single(),
  create: (data: Record<string, unknown>) =>
    sb().from("members").insert(data).select("*, profile:profiles(*)").single(),
  update: (id: string, data: Record<string, unknown>) =>
    sb().from("members").update(data).eq("id", id),
  search: (query: string) =>
    sb().from("members").select("*, profile:profiles(*)").textSearch("firstName", query),
  byStatus: (status: string) =>
    sb().from("members").select("*, profile:profiles(*)").eq("status", status),
}

export const membershipQueries = {
  listByMember: (memberId: string) =>
    sb().from("memberships").select("*").eq("memberId", memberId)
      .order("createdAt", { ascending: false } as never),
  activeByMember: (memberId: string) =>
    sb().from("memberships").select("*").eq("memberId", memberId).eq("status", "active").single(),
  create: (data: Record<string, unknown>) =>
    sb().from("memberships").insert(data).select().single(),
  renew: (id: string, data: Record<string, unknown>) =>
    sb().from("memberships").update(data).eq("id", id),
}

export const paymentQueries = {
  list: (clubId?: string) => {
    let q = sb().from("payments").select("*, member:members(*)")
    if (clubId) q = q.eq("member.clubId", clubId)
    return q
  },
  create: (data: Record<string, unknown>) =>
    sb().from("payments").insert(data).select().single(),
  today: () =>
    sb().from("payments").select("*, member:members(*)")
      .gte("createdAt", new Date().toISOString().slice(0, 10)),
}

export const attendanceQueries = {
  today: (clubId?: string) => {
    let q = sb().from("attendance")
      .select("*, member:members(*, profile:profiles(*)), device:devices(*)")
      .gte("timestamp", new Date().toISOString().slice(0, 10))
    if (clubId) q = q.eq("clubId", clubId)
    return q
  },
  byMember: (memberId: string, limit = 10) =>
    sb().from("attendance").select("*").eq("memberId", memberId)
      .order("timestamp", { ascending: false } as never).limit(limit),
  record: (data: Record<string, unknown>) =>
    sb().from("attendance").insert(data).select().single(),
}

export const deviceQueries = {
  list: (clubId?: string) => {
    let q = sb().from("devices").select("*")
    if (clubId) q = q.eq("clubId", clubId)
    return q
  },
}

export const dashboardQueries = {
  stats: (clubId?: string) =>
    sb().rpc("get_dashboard_stats", { p_club_id: clubId ?? null }),
}

export function subscribeToTable(
  table: string,
  onChange: () => void
) {
  return sb()
    .channel(`public:${table}`)
    .on("postgres_changes",
      { event: "*", schema: "public", table },
      () => onChange()
    )
    .subscribe()
}
