"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/client"
import { mapRow, mapRows } from "@/lib/utils/transform"
import Image from "next/image"
import {
  User, Mail, Phone, Award, BookOpen, Save, AlertCircle, RefreshCw,
  Camera, MapPin,
} from "lucide-react"
import type { Coach, Profile } from "@/types"

export default function CoachProfilePage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [coach, setCoach] = useState<Coach | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [form, setForm] = useState({
    firstName: "", lastName: "", phone: "", speciality: "", bio: "", certificationInput: "",
    certifications: [] as string[],
  })

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const uid = user?.id as string
    const supabase = createClient()

    async function load() {
      try {
        const [{ data: pData }, { data: cData }] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
          supabase.from("coaches").select("*").eq("profile_id", uid).maybeSingle(),
        ])

        const p = mapRow<Profile>(pData as Record<string, unknown> | null)
        const c = mapRow<Coach>(cData as Record<string, unknown> | null)
        setProfile(p)
        setCoach(c)
        if (p) {
          setForm({
            firstName: p.firstName || "",
            lastName: p.lastName || "",
            phone: p.phone || "",
            speciality: c?.speciality || "",
            bio: c?.bio || "",
            certificationInput: "",
            certifications: c?.certifications || [],
          })
        }
      } catch {
        setError("Impossible de charger le profil")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user])

  const addCertification = () => {
    if (!form.certificationInput.trim()) return
    setForm((f) => ({
      ...f,
      certifications: [...f.certifications, f.certificationInput.trim()],
      certificationInput: "",
    }))
  }

  const removeCertification = (idx: number) => {
    setForm((f) => ({
      ...f,
      certifications: f.certifications.filter((_, i) => i !== idx),
    }))
  }

  const saveProfile = async () => {
    if (!user) return
    setSaving(true)
    const supabase = createClient()
    try {
      await supabase.from("profiles").update({
        first_name: form.firstName,
        last_name: form.lastName,
        phone: form.phone || null,
      } as never).eq("id", user?.id as string)

      if (coach) {
        await supabase.from("coaches").update({
          speciality: form.speciality || null,
          bio: form.bio || null,
          certifications: form.certifications,
        } as never).eq("id", coach.id)
      } else {
        const { data } = await supabase.from("coaches").insert({
          profile_id: user.id,
          speciality: form.speciality || null,
          bio: form.bio || null,
          certifications: form.certifications,
          is_active: true,
        } as never).select().maybeSingle()
        if (data) setCoach(mapRow<Coach>(data as Record<string, unknown>))
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      setEditMode(false)
    } catch {
      setError("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-sm font-bold text-brand-black mb-1">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-sm font-bold text-white bg-brand-red px-6 py-2.5 rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2">
            <RefreshCw className="w-4 h-4" /> Réessayer
          </button>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-3">
            <User className="w-7 h-7 text-amber-500" />
          </div>
          <p className="text-sm font-bold text-brand-black mb-1">Profil introuvable</p>
          <p className="text-xs text-gray-500">Veuillez vous reconnecter.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-brand-black">Mon profil</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gérez vos informations personnelles</p>
        </div>
        <button onClick={() => setEditMode(!editMode)}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
            editMode ? "bg-gray-100 text-gray-600" : "bg-brand-red text-white hover:bg-red-700"
          }`}>
          {editMode ? "Annuler" : "Modifier"}
        </button>
      </div>

      <div className="bg-gradient-to-r from-brand-red to-red-700 rounded-2xl p-6 text-white shadow-lg shadow-brand-red/20">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
              {profile.avatarUrl ? (
                <Image src={profile.avatarUrl} alt="" width={80} height={80} className="w-full h-full rounded-full object-cover" />
              ) : form.firstName.charAt(0).toUpperCase()}
            </div>
            {editMode && (
              <button className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-md">
                <Camera className="w-3.5 h-3.5 text-brand-red" />
              </button>
            )}
          </div>
          <div>
            {editMode ? (
              <div className="flex gap-2">
                <input type="text" value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  className="bg-white/20 text-white placeholder-white/50 px-3 py-1.5 rounded-lg text-lg font-bold outline-none w-28" placeholder="Prénom" />
                <input type="text" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  className="bg-white/20 text-white placeholder-white/50 px-3 py-1.5 rounded-lg text-lg font-bold outline-none w-28" placeholder="Nom" />
              </div>
            ) : (
              <h2 className="text-xl font-bold">{form.firstName} {form.lastName}</h2>
            )}
            <p className="text-sm text-white/70 mt-1">Coach sportif</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-bold text-brand-black flex items-center gap-2"><User className="w-4 h-4 text-brand-red" /> Informations personnelles</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-700">{profile.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-gray-400" />
            {editMode ? (
              <input type="text" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="flex-1 px-3 py-1.5 bg-gray-50 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-red/20" placeholder="Téléphone" />
            ) : (
              <span className="text-sm text-gray-700">{form.phone || "Non renseigné"}</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-bold text-brand-black flex items-center gap-2"><Award className="w-4 h-4 text-brand-red" /> Spécialités</h3>
        {editMode ? (
          <input type="text" value={form.speciality} onChange={(e) => setForm((f) => ({ ...f, speciality: e.target.value }))}
            className="w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-red/20" placeholder="Ex: Musculation, CrossFit, Nutrition..." />
        ) : (
          <p className="text-sm text-gray-700">{form.speciality || "Non renseigné"}</p>
        )}
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-bold text-brand-black flex items-center gap-2"><BookOpen className="w-4 h-4 text-brand-red" /> Certifications</h3>
        {editMode && (
          <div className="flex gap-2">
            <input type="text" value={form.certificationInput} onChange={(e) => setForm((f) => ({ ...f, certificationInput: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && addCertification()}
              className="flex-1 px-3.5 py-2 bg-gray-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-red/20" placeholder="Ajouter une certification" />
            <button onClick={addCertification} className="px-4 py-2 bg-brand-red text-white rounded-xl text-sm font-bold hover:bg-red-700 transition-colors">Ajouter</button>
          </div>
        )}
        {form.certifications.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune certification renseignée</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {form.certifications.map((cert, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-brand-red/5 text-brand-red px-3 py-1.5 rounded-full border border-brand-red/10">
                {cert}
                {editMode && (
                  <button onClick={() => removeCertification(i)} className="text-red-400 hover:text-red-600 ml-1">&times;</button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-5 space-y-3">
        <h3 className="text-sm font-bold text-brand-black">Bio</h3>
        {editMode ? (
          <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            className="w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-red/20" rows={4} placeholder="Parlez de vous..." />
        ) : (
          <p className="text-sm text-gray-700">{form.bio || "Aucune bio renseignée"}</p>
        )}
      </div>

      {editMode && (
        <button onClick={saveProfile} disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-brand-red text-white py-3.5 rounded-xl text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50 shadow-lg shadow-brand-red/20">
          {saving ? "Enregistrement..." : saved ? "Profil mis à jour ✓" : <><Save className="w-4 h-4" /> Enregistrer</>}
        </button>
      )}
    </div>
  )
}
