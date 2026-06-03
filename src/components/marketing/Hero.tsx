"use client"

import { useEffect, useRef, Fragment } from "react"
import Link from "next/link"
import { ArrowRight, Play } from "lucide-react"
import Image from "next/image"

interface HeroProps {
  title: string
  subtitle?: string
  cta?: { label: string; href: string }
  secondaryCta?: { label: string; href: string }
  height?: "full" | "large" | "medium"
  image?: string
  children?: React.ReactNode
}

export default function Hero({
  title,
  subtitle,
  cta,
  secondaryCta,
  height = "full",
  image,
  children,
}: HeroProps) {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const onMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 6
      const y = (e.clientY / window.innerHeight - 0.5) * 6
      el.style.setProperty("--mouse-x", `${x}px`)
      el.style.setProperty("--mouse-y", `${y}px`)
    }
    window.addEventListener("mousemove", onMove)
    return () => window.removeEventListener("mousemove", onMove)
  }, [])

  const heights = {
    full: "min-h-[95vh] lg:min-h-[90vh]",
    large: "min-h-[75vh] lg:min-h-[80vh]",
    medium: "min-h-[55vh] lg:min-h-[60vh]",
  }

  return (
    <section
      ref={sectionRef}
      className={`relative ${heights[height]} flex items-center bg-black overflow-hidden`}
      style={{ perspective: "1000px" }}
    >
      {image && (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center scale-105 transition-transform duration-[10s] ease-out"
            style={{
              backgroundImage: `url(${image})`,
              transform: "translate(var(--mouse-x, 0), var(--mouse-y, 0)) scale(1.05)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Logo Watermark */}
          <div className="logo-watermark hidden lg:flex">
            <img src="/logo-transparent.png" alt="" className="w-1/2 h-1/2 object-contain opacity-[0.04]" />
          </div>
        </>
      )}

      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 50%, rgba(225,6,0,0.35) 0%, transparent 55%),
            radial-gradient(circle at 80% 30%, rgba(225,6,0,0.15) 0%, transparent 45%),
            radial-gradient(circle at 50% 80%, rgba(225,6,0,0.1) 0%, transparent 40%)
          `,
        }}
      />

      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-orange/15 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-red/10 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "6s", animationDelay: "1s" }} />
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-brand-cyan/8 rounded-full blur-[90px] animate-pulse" style={{ animationDuration: "7s", animationDelay: "2s" }} />
        <div className="absolute bottom-1/3 left-1/3 w-72 h-72 bg-brand-gold/8 rounded-full blur-[110px] animate-pulse" style={{ animationDuration: "9s", animationDelay: "0.5s" }} />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-6 animate-fade-in">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-white/80">Ouvert 7J/7 — 6h à 23h</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black text-white leading-none tracking-tight">
            {title.split(" ").map((word, i) => (
              <Fragment key={i}>
                {i > 0 && <span className="inline-block w-[0.35em]" />}
                <span className="inline-block animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                  {i === 1 && image ? (
                    <span className="text-brand-red">{word}</span>
                  ) : (
                    word
                  )}
                </span>
              </Fragment>
            ))}
          </h1>

          {subtitle && (
            <p className="mt-6 text-lg sm:text-xl text-white/70 max-w-xl leading-relaxed animate-fade-in" style={{ animationDelay: "0.5s" }}>
              {subtitle}
            </p>
          )}

          {(cta || secondaryCta) && (
            <div className="mt-10 flex flex-wrap gap-4 animate-fade-in" style={{ animationDelay: "0.7s" }}>
              {cta && (
                <Link
                  href={cta.href}
                  className="group inline-flex items-center gap-2 bg-gradient-to-r from-brand-red via-brand-accent to-brand-red bg-[length:200%_100%] hover:bg-right-top text-white px-7 py-3.5 rounded-xl font-bold text-sm hover:brightness-110 transition-all duration-300 active:scale-95 shadow-xl shadow-brand-red/30 animate-gradient"
                >
                  {cta.label}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}
              {secondaryCta && (
                <Link
                  href={secondaryCta.href}
                  className="group inline-flex items-center gap-2 border border-white/20 text-white px-7 py-3.5 rounded-xl font-semibold text-sm hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                >
                  <Play className="w-4 h-4" />
                  {secondaryCta.label}
                </Link>
              )}
            </div>
          )}

          {children}

          <div className="mt-12 flex items-center gap-8 text-sm animate-fade-in" style={{ animationDelay: "1s" }}>
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-black bg-gray-700 flex items-center justify-center text-[10px] font-bold text-white"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-black bg-brand-red flex items-center justify-center text-[10px] font-bold text-white">
                +
              </div>
            </div>
            <span className="text-white/50">
              <strong className="text-white">1000+</strong> membres actifs
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
