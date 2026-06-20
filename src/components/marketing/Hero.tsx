"use client"

import { useEffect, useRef, Fragment } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Play } from "lucide-react"

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
    <>
      <style>{`
        .coin-rotate {
          transform-style: preserve-3d;
        }
      `}</style>
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

          {/* Logo Watermark removed — visible logo on the right */}
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
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left: Text content */}
          <div className="flex-1 max-w-3xl">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 mb-6 animate-fade-in w-fit">
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

          {/* Right: Thick gold coin 3D */}
          <div className="flex-shrink-0 hidden lg:flex items-center justify-center w-[300px] xl:w-[400px]" style={{ perspective: "1400px" }}>
            <div
              className="coin-rotate"
              style={{
                width: "100%",
                maxWidth: "320px",
                aspectRatio: "1/1",
                position: "relative",
                transformStyle: "preserve-3d",
              }}
            >
              {[-20, -15, -10, -5, 0, 5, 10, 15, 20].map(z => {
                const isFront = z === 20
                const isBack = z === -20
                const isFace = isFront || isBack
                const t = isBack ? `rotateY(180deg) translateZ(${Math.abs(z)}px)` : `translateZ(${z}px)`
                return (
                  <div key={z}
                    style={{
                      position: "absolute",
                      inset: 0,
                      backfaceVisibility: isFace ? "hidden" : "visible",
                      transform: t,
                      borderRadius: "50%",
                      border: "8px solid rgba(200,160,60,0.5)",
                      boxShadow: isFace
                        ? "0 0 50px rgba(200,160,60,0.3), inset 0 0 20px rgba(200,160,60,0.08)"
                        : "inset 0 0 10px rgba(200,160,60,0.05)",
                      overflow: "hidden",
                      background: isFace ? "#0a0a0a" : "#1a1508",
                    }}
                  >
                    {isFace ? (
                      <Image src="/logo-transparent.png" alt="Infinity Gym Center" fill className="object-contain" style={{ transform: "scale(1.15)" }} />
                    ) : null}
                  </div>
                )
              })}
              <div
                style={{
                  position: "absolute",
                  inset: "-8px",
                  borderRadius: "50%",
                  transform: "translateZ(0)",
                  background: "conic-gradient(from 0deg, rgba(200,160,60,0.15) 0deg, transparent 3deg, transparent 7deg, rgba(200,160,60,0.15) 10deg, transparent 13deg, transparent 17deg, rgba(200,160,60,0.15) 20deg, transparent 23deg, transparent 27deg, rgba(200,160,60,0.15) 30deg, transparent 33deg, transparent 37deg, rgba(200,160,60,0.15) 40deg, transparent 43deg)",
                }}
              />
            </div>
          </div>
          </div>
      </div>
    </section>
    </>
  )
}
