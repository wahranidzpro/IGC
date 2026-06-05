"use client"

import { useAuth } from "@/lib/auth/context"
import { Search, Bell, MessageCircle, ChevronDown } from "lucide-react"

export function CoachHeader() {
  const { user } = useAuth()
  const coachName = user && 'name' in user ? (user as any).name : user && 'firstName' in user ? `${(user as any).firstName} ${(user as any).lastName}`.trim() : 'Coach'

  return (
    <header className="sticky top-0 z-30 w-full h-16">
      <div className="absolute inset-0 bg-[rgba(8,17,32,0.72)] backdrop-blur-[20px] border-b border-[rgba(200,155,60,0.12)]" />
      <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-[rgba(200,155,60,0.25)] to-transparent" />

      <div className="relative z-10 flex items-center justify-between h-full px-4 md:px-6 gap-4">
        <div className="flex items-center gap-3 min-w-0 shrink-0">
          <div className="flex flex-col">
            <h1 className="text-white font-bold text-base md:text-lg truncate leading-tight">
              Bienvenue Coach {coachName}
            </h1>
            <span className="text-xs bg-gradient-to-r from-[#C89B3C] to-[rgba(200,155,60,0.5)] bg-clip-text text-transparent font-medium">
              Prêt à transformer des vies aujourd&apos;hui ?
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center flex-1 max-w-xs">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(200,155,60,0.5)] pointer-events-none" />
            <input
              type="text"
              placeholder="Rechercher..."
              className="w-full h-9 pl-9 pr-4 text-sm text-white placeholder-[rgba(168,178,199,0.4)] bg-[rgba(200,155,60,0.06)] border border-[rgba(200,155,60,0.12)] rounded-full outline-none transition-all duration-200 focus:border-[rgba(200,155,60,0.35)] focus:bg-[rgba(200,155,60,0.1)] focus:shadow-[0_0_20px_rgba(200,155,60,0.06)]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button className="relative flex items-center justify-center w-9 h-9 rounded-full bg-[rgba(200,155,60,0.08)] border border-[rgba(200,155,60,0.1)] hover:bg-[rgba(200,155,60,0.15)] hover:border-[rgba(200,155,60,0.25)] transition-all duration-200 group">
            <Bell className="w-[18px] h-[18px] text-[rgba(200,155,60,0.6)] group-hover:text-[#D6A84F] transition-colors duration-200" />
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-[18px] h-[18px] text-[10px] font-bold text-white bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]">
              3
            </span>
          </button>

          <button className="relative flex items-center justify-center w-9 h-9 rounded-full bg-[rgba(200,155,60,0.08)] border border-[rgba(200,155,60,0.1)] hover:bg-[rgba(200,155,60,0.15)] hover:border-[rgba(200,155,60,0.25)] transition-all duration-200 group">
            <MessageCircle className="w-[18px] h-[18px] text-[rgba(200,155,60,0.6)] group-hover:text-[#D6A84F] transition-colors duration-200" />
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-[18px] h-[18px] text-[10px] font-bold text-white bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]">
              5
            </span>
          </button>

          <div className="relative shrink-0 ml-1">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#C89B3C] via-[#D6A84F] to-[#E0B85D] flex items-center justify-center text-[#081120] font-black text-sm shadow-[0_0_20px_rgba(200,155,60,0.3)]">
              {coachName[0].toUpperCase()}
            </div>
            <div className="absolute -inset-[2px] rounded-full bg-gradient-to-br from-[#C89B3C]/40 to-[#E0B85D]/10 blur-sm -z-10" />
          </div>

          <button className="hidden md:flex items-center justify-center w-6 h-6 text-[rgba(200,155,60,0.4)] hover:text-[#D6A84F] transition-colors duration-200">
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="md:hidden relative z-10 px-4 pb-3">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgba(200,155,60,0.5)] pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="w-full h-9 pl-9 pr-4 text-sm text-white placeholder-[rgba(168,178,199,0.4)] bg-[rgba(200,155,60,0.06)] border border-[rgba(200,155,60,0.12)] rounded-full outline-none transition-all duration-200 focus:border-[rgba(200,155,60,0.35)] focus:bg-[rgba(200,155,60,0.1)] focus:shadow-[0_0_20px_rgba(200,155,60,0.06)]"
          />
        </div>
      </div>
    </header>
  )
}
