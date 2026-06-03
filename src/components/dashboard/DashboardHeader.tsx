"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/context"
import { Button } from "@/components/ui/button"
import { QrCode, LogOut } from "lucide-react"

export default function DashboardHeader() {
  const router = useRouter()
  const { user, logout } = useAuth()

  return (
    <header className="flex items-center justify-between p-4 md:p-6 border-b">
      <div className="flex items-center gap-3">
        <Image
          src="/logo-transparent.png"
          alt="Infinity Gym Center"
          width={36}
          height={38}
          className="rounded-full"
        />
        <div>
          <p className="text-sm text-muted-foreground">Bonjour,</p>
          <p className="font-semibold">{user?.email?.split("@")[0] || "Membre"}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/qr")}>
          <QrCode className="w-4 h-4 mr-2" />
          Mon QR
        </Button>
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  )
}
