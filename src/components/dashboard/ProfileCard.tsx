"use client"

import { User, Mail, Phone, Calendar } from "lucide-react"
import type { Profile, Member } from "@/types"

interface ProfileCardProps {
  profile: Profile | null
  member: Member | null
}

export default function ProfileCard({ profile, member }: ProfileCardProps) {
  if (!profile) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-muted-foreground" />
          <h2 className="font-semibold">Mes informations</h2>
        </div>
        <p className="text-sm text-muted-foreground text-center py-8">Informations non disponibles</p>
      </div>
    )
  }

  const fields = [
    { icon: User, label: "Nom", value: `${profile.firstName} ${profile.lastName}` },
    { icon: Mail, label: "Email", value: profile.email },
    { icon: Phone, label: "Téléphone", value: profile.phone || "Non renseigné" },
    {
      icon: Calendar,
      label: "Membre depuis",
      value: new Date(profile.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
    },
  ]

  if (member?.birthDate) {
    fields.push({
      icon: Calendar,
      label: "Date de naissance",
      value: new Date(member.birthDate).toLocaleDateString("fr-FR"),
    })
  }

  if (member?.emergencyContact) {
    fields.push({
      icon: Phone,
      label: "Contact urgence",
      value: `${member.emergencyContact}${member.emergencyPhone ? ` - ${member.emergencyPhone}` : ""}`,
    })
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-muted-foreground" />
        <h2 className="font-semibold">Mes informations</h2>
      </div>

      <div className="space-y-3">
        {fields.map((f, i) => (
          <div key={i} className="flex items-start gap-3">
            <f.icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{f.label}</p>
              <p className="text-sm font-medium break-words">{f.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
