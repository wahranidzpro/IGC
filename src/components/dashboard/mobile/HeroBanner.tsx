"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { Sparkles, Award, ChevronRight, Sun, Moon, Sunrise } from "lucide-react"
import type { Gender } from "./theme"

const heroImages: Record<Gender, string> = {
  male: "/images/athlete-male.jpg",
  female: "/images/athlete-female.jpg",
  other: "/images/hero-home.jpg",
}

interface HeroBannerProps {
  firstName: string
  gender: Gender
  membershipActive: boolean
  planName?: string
  daysLeft: number
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return { text: "Bonjour", icon: Sunrise }
  if (h < 18) return { text: "Bon après-midi", icon: Sun }
  return { text: "Bonsoir", icon: Moon }
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

export default function HeroBanner({ firstName, gender, membershipActive, planName, daysLeft }: HeroBannerProps) {
  const router = useRouter()
  const heroImage = heroImages[gender] || heroImages.other
  const isMale = gender === "male"
  const greeting = getGreeting()
  const GreetIcon = greeting.icon

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden cursor-pointer"
      style={{ height: "38vh", minHeight: 300 }}
      onClick={() => router.push("/dashboard/membership")}
    >
      <div
        className="absolute inset-0"
        style={{
          background: isMale
            ? "linear-gradient(160deg, #020B22 0%, #0A1628 40%, #1A0A22 100%)"
            : "linear-gradient(160deg, #020B22 0%, #0A1A12 40%, #000000 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: isMale
            ? "radial-gradient(ellipse at 75% 15%, rgba(0,136,255,0.2) 0%, transparent 50%), radial-gradient(ellipse at 25% 85%, rgba(255,77,77,0.08) 0%, transparent 40%)"
            : "radial-gradient(ellipse at 75% 15%, rgba(0,212,138,0.18) 0%, transparent 50%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="absolute top-4 left-0 right-0 flex justify-center z-10"
      >
        <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg">
          <Image src="/logo-transparent.png" alt="IGC" width={36} height={36} className="object-contain" />
        </div>
      </motion.div>

      <div className="relative z-10 h-full flex flex-col justify-center px-6 pb-6">
        <div className="max-w-[55%]">
          <motion.div className="flex items-center gap-2 mb-1" {...fadeUp} transition={{ delay: 0.15 }}>
            <GreetIcon className="w-3.5 h-3.5 text-white/40" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">{greeting.text}</span>
          </motion.div>
          <motion.h1
            className="text-2xl font-black text-white leading-tight"
            {...fadeUp}
            transition={{ delay: 0.2 }}
          >
            {firstName}
          </motion.h1>
          <motion.p
            className="text-sm text-gray-300 mt-2 leading-relaxed font-medium"
            {...fadeUp}
            transition={{ delay: 0.25 }}
          >
            {isMale ? "Repoussez vos limites aujourd'hui" : "Donnez le meilleur de vous-même"}
          </motion.p>
          <motion.p
            className="text-xs text-gray-500 mt-1 leading-relaxed"
            {...fadeUp}
            transition={{ delay: 0.3 }}
          >
            {isMale ? "Chaque séance vous rapproche de votre meilleure version." : "La force est en vous, libérez-la."}
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-2 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            {membershipActive && (
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full border backdrop-blur-sm"
                style={{
                  background: isMale ? "rgba(0,136,255,0.12)" : "rgba(0,212,138,0.12)",
                  color: isMale ? "#0088FF" : "#00D48A",
                  borderColor: isMale ? "rgba(0,136,255,0.25)" : "rgba(0,212,138,0.25)",
                  boxShadow: isMale ? "0 0 20px rgba(0,136,255,0.15)" : "0 0 20px rgba(0,212,138,0.15)",
                }}
              >
                <Award className="w-3 h-3" />
                {planName || "Premium"}
              </span>
            )}
            {daysLeft > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 backdrop-blur-sm">
                <Sparkles className="w-3 h-3" />J-{daysLeft}
              </span>
            )}
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-3 left-6 right-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div
            className="flex items-center justify-between px-4 py-2.5 rounded-2xl backdrop-blur-md border transition-all duration-200 active:scale-[0.99]"
            style={{
              background: isMale ? "rgba(0,136,255,0.08)" : "rgba(0,212,138,0.08)",
              borderColor: isMale ? "rgba(0,136,255,0.15)" : "rgba(0,212,138,0.15)",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: isMale ? "rgba(0,136,255,0.15)" : "rgba(0,212,138,0.15)" }}
              >
                <Award className="w-4 h-4" style={{ color: isMale ? "#0088FF" : "#00D48A" }} />
              </div>
              <div>
                <p className="text-xs font-bold text-white">{planName || "Premium"}</p>
                <p className="text-[9px] text-gray-400">J-{daysLeft} • Valide jusqu'au prochain renouvellement</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/30" />
          </div>
        </motion.div>
      </div>

      <motion.div
        className="absolute right-0 bottom-0 w-[55%] h-[95%] pointer-events-none"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <div className="relative w-full h-full">
          <Image
            src={heroImage}
            alt=""
            fill
            className="object-cover object-center"
            style={{
              maskImage: "linear-gradient(to left, black 45%, transparent 100%)",
              WebkitMaskImage: "linear-gradient(to left, black 45%, transparent 100%)",
            }}
            priority
          />
        </div>
      </motion.div>
    </motion.div>
  )
}
