"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/context"
import { createClient } from "@/lib/supabase/client"
import { mapRow } from "@/lib/utils/transform"
import Image from "next/image"
import {
  User, Mail, Phone, Award, BookOpen, Save, AlertCircle, RefreshCw,
  Camera,
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
  const [originalData, setOriginalData] = useState({
    firstName: "", lastName: "", phone: "", speciality: "", bio: "", certifications: [] as string[],
  })
  const [form, setForm] = useState({
    firstName: "", lastName: "", phone: "", speciality: "", bio: "", certificationInput: "",
    certifications: [] as string[],
  })

  useEffect(() => {
    if (!user) { setTimeout(() => setLoading(false)); return }
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
          const initForm = {
            firstName: p.firstName || "",
            lastName: p.lastName || "",
            phone: p.phone || "",
            speciality: c?.speciality || "",
            bio: c?.bio || "",
            certificationInput: "",
            certifications: c?.certifications || [],
          }
          setForm(initForm)
          setOriginalData({
            firstName: initForm.firstName,
            lastName: initForm.lastName,
            phone: initForm.phone,
            speciality: initForm.speciality,
            bio: initForm.bio,
            certifications: [...initForm.certifications],
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

  const enterEditMode = () => {
    setOriginalData({
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone,
      speciality: form.speciality,
      bio: form.bio,
      certifications: [...form.certifications],
    })
    setEditMode(true)
  }

  const cancelEdit = () => {
    setForm((f) => ({
      ...f,
      firstName: originalData.firstName,
      lastName: originalData.lastName,
      phone: originalData.phone,
      speciality: originalData.speciality,
      bio: originalData.bio,
      certifications: [...originalData.certifications],
    }))
    setEditMode(false)
  }

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
        <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
        <div className="h-40 bg-white/5 rounded-2xl animate-pulse border border-white/10" />
        <div className="h-32 bg-white/5 rounded-2xl animate-pulse border border-white/10" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-sm font-bold text-white mb-1">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-sm font-bold text-white bg-gradient-to-r from-[#C89B3C] to-[#F5D77B] px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2">
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
          <div className="w-14 h-14 rounded-full bg-[#C89B3C]/10 flex items-center justify-center mx-auto mb-3 border border-[#C89B3C]/20">
            <User className="w-7 h-7 text-[#C89B3C]" />
          </div>
          <p className="text-sm font-bold text-white mb-1">Profil introuvable</p>
          <p className="text-xs text-gray-400">Veuillez vous reconnecter.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-[#C89B3C] to-[#F5D77B] bg-clip-text text-transparent">Mon Profil</h1>
          <p className="text-sm text-gray-400 mt-1">Informations personnelles et professionnelles</p>
        </div>
        {editMode ? (
          <button onClick={cancelEdit}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-400 hover:text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
            Annuler
          </button>
        ) : (
          <button onClick={enterEditMode}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-black bg-gradient-to-r from-[#C89B3C] to-[#F5D77B] hover:opacity-90 transition-opacity shadow-lg shadow-[#C89B3C]/20">
            Modifier
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center lg:text-left">
            <div className="flex flex-col items-center lg:items-start">
              <div className="relative mb-4 mx-auto lg:mx-0">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#C89B3C] to-[#F5D77B] p-[3px]">
                  <div className="w-full h-full rounded-full bg-gray-900 flex items-center justify-center text-3xl font-bold text-white overflow-hidden">
                    {profile.avatarUrl ? (
                      <Image src={profile.avatarUrl} alt="" width={96} height={96} className="w-full h-full object-cover" />
                    ) : form.firstName.charAt(0).toUpperCase()}
                  </div>
                </div>
                {editMode && (
                  <button className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-br from-[#C89B3C] to-[#F5D77B] rounded-full flex items-center justify-center shadow-lg shadow-[#C89B3C]/30">
                    <Camera className="w-4 h-4 text-black" />
                  </button>
                )}
              </div>

              <h2 className="text-lg font-bold text-white">{form.firstName} {form.lastName}</h2>
              <span className="inline-flex items-center gap-1 text-xs font-bold bg-gradient-to-r from-[#C89B3C] to-[#F5D77B] text-black px-3 py-1 rounded-full mt-1.5 mb-4">
                <Award className="w-3 h-3" /> Coach Premium
              </span>

              <div className="space-y-2.5 w-full">
                <div className="flex items-center gap-2.5 text-sm">
                  <Mail className="w-4 h-4 text-[#C89B3C]" />
                  <span className="text-gray-300">{profile.email}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <Phone className="w-4 h-4 text-[#C89B3C]" />
                  <span className="text-gray-300">{form.phone || "Non renseigné"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white/5 backdrop-blur-xl border border-t-2 border-t-[#C89B3C] border-white/10 rounded-2xl p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-[#C89B3C]" /> Informations personnelles
              </h3>
              {editMode ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Nom</label>
                    <input type="text" value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#C89B3C]/50 transition-colors placeholder-gray-500" placeholder="Nom" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Email</label>
                    <input type="email" value={profile.email} disabled
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-400 outline-none cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 mb-1 block">Téléphone</label>
                    <input type="text" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#C89B3C]/50 transition-colors placeholder-gray-500" placeholder="Téléphone" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white/[0.03] rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Nom</p>
                    <p className="text-sm text-white font-bold">{form.lastName}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Email</p>
                    <p className="text-sm text-white font-bold">{profile.email}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Téléphone</p>
                    <p className="text-sm text-white font-bold">{form.phone || "Non renseigné"}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-[#C89B3C]" /> Spécialité
              </h3>
              {editMode ? (
                <input type="text" value={form.speciality} onChange={(e) => setForm((f) => ({ ...f, speciality: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#C89B3C]/50 transition-colors placeholder-gray-500" placeholder="Ex: Musculation, CrossFit, Nutrition..." />
              ) : (
                <p className="text-sm text-gray-300 bg-white/[0.03] rounded-xl px-3.5 py-2.5">{form.speciality || "Non renseigné"}</p>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-[#C89B3C]" /> Certifications
              </h3>
              {editMode && (
                <div className="flex gap-2">
                  <input type="text" value={form.certificationInput} onChange={(e) => setForm((f) => ({ ...f, certificationInput: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addCertification()}
                    className="flex-1 px-3.5 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#C89B3C]/50 transition-colors placeholder-gray-500" placeholder="Ajouter une certification" />
                  <button onClick={addCertification} className="px-4 py-2 bg-gradient-to-r from-[#C89B3C] to-[#F5D77B] text-black rounded-xl text-sm font-bold hover:opacity-90 transition-opacity">Ajouter</button>
                </div>
              )}
              {form.certifications.length === 0 ? (
                <p className="text-sm text-gray-400">Aucune certification renseignée</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {form.certifications.map((cert, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-[#C89B3C]/10 text-[#C89B3C] px-3 py-1.5 rounded-full border border-[#C89B3C]/20">
                      {cert}
                      {editMode && (
                        <button onClick={() => removeCertification(i)} className="text-[#C89B3C]/60 hover:text-[#C89B3C] ml-1">
                          <span className="text-sm leading-none">&times;</span>
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <User className="w-4 h-4 text-[#C89B3C]" /> Bio
              </h3>
              {editMode ? (
                <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-[#C89B3C]/50 transition-colors placeholder-gray-500 resize-none" rows={4} placeholder="Parlez de vous..." />
              ) : (
                <p className="text-sm text-gray-300 bg-white/[0.03] rounded-xl px-3.5 py-2.5">{form.bio || "Aucune bio renseignée"}</p>
              )}
            </div>

            {editMode && (
              <button onClick={saveProfile} disabled={saving}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#C89B3C] to-[#F5D77B] text-black py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-[#C89B3C]/20">
                {saving ? "Enregistrement..." : saved ? "Profil mis à jour ✓" : <><Save className="w-4 h-4" /> Enregistrer</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
