"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/client"
import { mapRow, mapRows } from "@/lib/utils/transform"
import Image from "next/image"
import {
  User, Mail, Phone, Calendar, Camera, Check, X,
  Cake, Heart, AlertTriangle, Goal,
} from "lucide-react"
import type { Profile, Member } from "@/types"

export default function ProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [member, setMember] = useState<Member | null>(null)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    birthDate: "",
    gender: "",
    emergencyContact: "",
    emergencyPhone: "",
    fitnessGoal: "",
  })

  useEffect(() => {
    if (!user) return
    const uid = user?.id as string
    const supabase = createClient()

    async function load() {
      const { data: p } = await supabase.from("profiles").select("*").eq("id", uid).maybeSingle()
      const prof = p ? mapRow<Profile>(p) : null
      if (prof) setProfile(prof)

      const { data: m } = await supabase.from("members").select("*").eq("profile_id", uid).maybeSingle()
      const mem = m ? mapRow<Member>(m) : null
      if (mem) setMember(mem)

      setForm({
        firstName: prof?.firstName || "",
        lastName: prof?.lastName || "",
        phone: prof?.phone || "",
        birthDate: mem?.birthDate ? mem.birthDate.split("T")[0] : "",
        gender: mem?.gender || "",
        emergencyContact: mem?.emergencyContact || "",
        emergencyPhone: mem?.emergencyPhone || "",
        fitnessGoal: mem?.fitnessGoal || "",
      })
    }
    load()
  }, [user])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const supabase = createClient()
      await supabase.from("profiles").update({
        first_name: form.firstName,
        last_name: form.lastName,
        phone: form.phone || null,
      } as never).eq("id", user?.id as string)

      const { data: m } = await supabase.from("members").select("*").eq("profile_id", user?.id as string).maybeSingle()
      const memberRow = m ? mapRow<Member>(m) : null
      const memberId = memberRow?.id
      if (memberId) {
        await supabase.from("members").update({
          birth_date: form.birthDate || null,
          gender: form.gender || null,
          emergency_contact: form.emergencyContact || null,
          emergency_phone: form.emergencyPhone || null,
          fitness_goal: form.fitnessGoal || null,
        } as never).eq("id", memberId)
      }

      setProfile((prev) => prev ? { ...prev, firstName: form.firstName, lastName: form.lastName, phone: form.phone || null } : prev)
      setEditing(false)
    } catch {
      console.error("Erreur sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (!profile) return
    setForm({
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      phone: profile.phone || "",
      birthDate: member?.birthDate?.split("T")[0] || "",
      gender: member?.gender || "",
      emergencyContact: member?.emergencyContact || "",
      emergencyPhone: member?.emergencyPhone || "",
      fitnessGoal: member?.fitnessGoal || "",
    })
    setEditing(false)
  }

  const initials = (profile?.firstName?.[0] || user?.email?.[0] || "M").toUpperCase()

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-brand-black">Mon profil</h1>
          <p className="text-sm text-gray-500 mt-0.5">{editing ? "Modifier vos informations" : "Gérez vos informations personnelles"}</p>
        </div>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="bg-brand-red text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors"
          >
            Modifier
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" /> Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-brand-red hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border shadow-lg shadow-black/5 overflow-hidden">
        <div className="bg-gradient-to-r from-brand-red to-red-700 px-5 pt-6 pb-12 text-center text-white">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white/30 shadow-xl mx-auto bg-white/10">
              {profile?.avatarUrl ? (
                <Image src={profile.avatarUrl} alt="" width={96} height={96} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl font-bold">{initials}</div>
              )}
            </div>
            {editing && (
              <button className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white text-brand-red flex items-center justify-center border-2 border-white shadow-md hover:bg-gray-100 transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>
          {!editing && (
            <>
              <h2 className="text-xl font-bold mt-3">{profile?.firstName} {profile?.lastName}</h2>
              <p className="text-sm text-white/70">Membre Infinity Gym Center</p>
            </>
          )}
        </div>

        <div className="px-5 -mt-6 relative z-10 space-y-4 pb-5">
          {editing ? (
            <div className="bg-white rounded-xl border shadow-sm p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Prénom</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    className="w-full mt-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-colors"
                    placeholder="Votre prénom"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Nom</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    className="w-full mt-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-colors"
                    placeholder="Votre nom"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Téléphone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full mt-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-colors"
                    placeholder="+213 XX XX XX XX"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Date de naissance</label>
                  <input
                    type="date"
                    value={form.birthDate}
                    onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
                    className="w-full mt-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Genre</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
                    className="w-full mt-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-colors"
                  >
                    <option value="">Sélectionner</option>
                    <option value="male">Homme</option>
                    <option value="female">Femme</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Objectif fitness</label>
                  <select
                    value={form.fitnessGoal}
                    onChange={(e) => setForm((f) => ({ ...f, fitnessGoal: e.target.value }))}
                    className="w-full mt-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-colors"
                  >
                    <option value="">Sélectionner</option>
                    <option value="weight_loss">Perte de poids</option>
                    <option value="muscle_gain">Prise de masse</option>
                    <option value="toning">Toning / Raffermir</option>
                    <option value="endurance">Endurance / Cardio</option>
                    <option value="strength">Force / Musculation</option>
                    <option value="health">Santé générale</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Contact urgence</label>
                  <input
                    type="text"
                    value={form.emergencyContact}
                    onChange={(e) => setForm((f) => ({ ...f, emergencyContact: e.target.value }))}
                    className="w-full mt-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-colors"
                    placeholder="Nom du contact"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Tél. urgence</label>
                  <input
                    type="tel"
                    value={form.emergencyPhone}
                    onChange={(e) => setForm((f) => ({ ...f, emergencyPhone: e.target.value }))}
                    className="w-full mt-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-colors"
                    placeholder="+213 XX XX XX XX"
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-xl border shadow-sm divide-y">
                {[
                  { icon: Mail, label: "Email", value: user?.email || "---" },
                  { icon: Phone, label: "Téléphone", value: profile?.phone || "Non renseigné" },
                  { icon: Cake, label: "Date de naissance", value: member?.birthDate ? new Date(member.birthDate).toLocaleDateString("fr-FR") : "Non renseignée" },
                  { icon: Heart, label: "Genre", value: member?.gender === "male" ? "Homme" : member?.gender === "female" ? "Femme" : "Non renseigné" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className="text-sm font-medium text-brand-black truncate">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {member?.fitnessGoal && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-brand-red/5 border border-brand-red/10">
                  <Goal className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Objectif fitness</p>
                    <p className="text-sm font-medium text-brand-black mt-0.5">
                      {member.fitnessGoal === "weight_loss" ? "Perte de poids" :
                       member.fitnessGoal === "muscle_gain" ? "Prise de masse" :
                       member.fitnessGoal === "toning" ? "Toning / Raffermir" :
                       member.fitnessGoal === "endurance" ? "Endurance / Cardio" :
                       member.fitnessGoal === "strength" ? "Force / Musculation" :
                       member.fitnessGoal === "health" ? "Santé générale" : member.fitnessGoal}
                    </p>
                  </div>
                </div>
              )}

              {member?.emergencyContact && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">Contact d&apos;urgence</p>
                    <p className="text-sm font-medium text-amber-900 mt-0.5">
                      {member.emergencyContact}{member.emergencyPhone ? ` · ${member.emergencyPhone}` : ""}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-5">
        <h3 className="text-sm font-bold text-brand-black mb-3">Abonnement</h3>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Statut</span>
          <span className="font-bold text-green-600 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            Actif
          </span>
        </div>
        {member?.createdAt && (
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-500">Membre depuis</span>
            <span className="font-medium text-brand-black">{new Date(member.createdAt).toLocaleDateString("fr-FR")}</span>
          </div>
        )}
      </div>
    </div>
  )
}
