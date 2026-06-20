"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth, type AuthUser } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/client"
import { mapRow } from "@/lib/utils/transform"
import Image from "next/image"
import {
  User, CreditCard, FileText, Settings, LogOut, ChevronRight, Camera,
} from "lucide-react"
import type { Profile } from "@/types"
import BackButton from "@/components/dashboard/mobile/BackButton"

const menuItems = [
  { label: "Informations personnelles", href: "", icon: User, color: "#0A84FF" },
  { label: "Abonnement", href: "/dashboard/membership", icon: CreditCard, color: "#C89B3C" },
  { label: "Paiements & Factures", href: "", icon: CreditCard, color: "#10B981" },
  { label: "Documents", href: "", icon: FileText, color: "#A855F7" },
  { label: "Préférences", href: "", icon: Settings, color: "#6B7280" },
  { label: "Paramètres", href: "/dashboard/settings", icon: Settings, color: "#6B7280" },
]

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    if (!user) return
    const uid = user?.id as string
    const supabase = createClient()
    async function load() {
      const { data: p } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle()
      if (p) setProfile(mapRow<Profile>(p))
    }
    load()
  }, [user])

  const firstName = profile?.firstName || (user && "name" in user ? (user as AuthUser).name : "Membre")
  const lastName = profile?.lastName || ""
  const email = profile?.email || (user && "email" in user ? (user as AuthUser).email : "")
  const phone = profile?.phone || ""
  const avatar = profile?.avatarUrl || ""

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #020B22 0%, #08173B 100%)" }}>
      <BackButton />
      <div className="pt-2 pb-4 px-4 flex flex-col items-center text-center">
        <div className="relative mb-4">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2" style={{ borderColor: "rgba(10,132,255,0.3)" }}>
            {avatar ? (
              <Image src={avatar} alt="" width={80} height={80} className="object-cover w-full h-full" loading="lazy" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#0A84FF] to-[#C89B3C] flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#0A84FF] flex items-center justify-center border-2" style={{ borderColor: "#020B22" }}>
            <Camera className="w-3.5 h-3.5 text-white" />
          </div>
        </div>
        <h1 className="text-lg font-bold text-white">{firstName} {lastName}</h1>
        {email && <p className="text-xs text-gray-400 mt-0.5">{email}</p>}
        {phone && <p className="text-xs text-gray-400">{phone}</p>}
      </div>

      <div className="px-4 mt-2 space-y-1 pb-28">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => item.href && router.push(item.href)}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-200 hover:bg-white/[0.04] active:scale-[0.99]"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${item.color}15` }}>
              <item.icon className="w-5 h-5" style={{ color: item.color }} />
            </div>
            <span className="flex-1 text-left text-sm font-bold text-white">{item.label}</span>
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        ))}

        <button
          onClick={() => { logout(); router.push("/login") }}
          className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl mt-6 transition-all duration-200 hover:bg-red-500/5 active:scale-[0.99]"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/10">
            <LogOut className="w-5 h-5 text-red-400" />
          </div>
          <span className="flex-1 text-left text-sm font-bold text-red-400">Déconnexion</span>
        </button>
      </div>
    </div>
  )
}
