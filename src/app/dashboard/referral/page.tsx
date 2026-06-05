"use client"

import { useState } from "react"
import { UserPlus, Gift, Copy, Check, Share2, ChevronDown } from "lucide-react"

export default function ReferralPage() {
  const [copied, setCopied] = useState(false)
  const referralCode = "IGC-WAHID24"
  const referralLink = `https://igc.dz/ref/${referralCode}`

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-br from-brand-red via-red-700 to-brand-black px-5 pt-6 pb-20 text-white overflow-hidden relative">
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
        <div className="relative z-10">
          <h1 className="text-xl font-bold">Parrainage</h1>
          <p className="text-sm text-white/70 mt-1">Invitez vos amis et gagnez des récompenses</p>

          <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/10 p-5 text-center">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
              <Gift className="w-7 h-7 text-white" />
            </div>
            <p className="text-2xl font-bold">+500 pts</p>
            <p className="text-xs text-white/70 mt-1">Par ami parrainé</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-14 relative z-10 space-y-4 pb-28">
        <div className="glass-strong rounded-2xl border border-white/10 p-5 shadow-lg">
          <h2 className="text-sm font-bold text-white mb-3">Votre code de parrainage</h2>
          <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1">
            <div className="flex-1 px-3 py-2.5 font-mono text-sm font-bold text-white tracking-wider">
              {referralCode}
            </div>
            <button
              onClick={() => copyToClipboard(referralCode)}
              className="p-2.5 rounded-lg bg-brand-red text-white hover:bg-red-700 transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="glass-strong rounded-2xl border border-white/10 p-5 shadow-lg">
          <h2 className="text-sm font-bold text-white mb-3">Lien de parrainage</h2>
          <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1">
            <div className="flex-1 px-3 py-2.5 text-xs text-gray-400 truncate">
              {referralLink}
            </div>
            <button
              onClick={() => copyToClipboard(referralLink)}
              className="shrink-0 p-2.5 rounded-lg bg-brand-red text-white hover:bg-red-700 transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button className="w-full flex items-center justify-center gap-2 glass text-white rounded-2xl py-4 text-sm font-bold border border-white/10 hover:bg-white/5 transition-colors active:scale-[0.98]">
          <Share2 className="w-4 h-4" />
          Partager mon code
        </button>

        <div className="glass-strong rounded-2xl border border-white/10 p-5 shadow-lg">
          <h2 className="text-sm font-bold text-white mb-3">Comment ça marche ?</h2>
          <div className="space-y-3">
            {[
              { step: "1", title: "Partagez votre code", desc: "Invitez vos amis via votre code unique" },
              { step: "2", title: "Ils s'inscrivent", desc: "Votre ami utilise votre code lors de son inscription" },
              { step: "3", title: "Vous gagnez des points", desc: "500 points bonus par ami inscrit" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red text-xs font-bold shrink-0">
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
