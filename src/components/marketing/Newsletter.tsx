"use client"

import SectionWrapper from "./SectionWrapper"

export default function Newsletter() {
  return (
    <SectionWrapper className="!py-16">
      <div className="bg-brand-black rounded-3xl p-8 sm:p-12 lg:p-16 flex flex-col lg:flex-row items-center gap-10">
        <div className="flex-1">
          <h3 className="text-2xl sm:text-3xl font-black text-white mb-3">
            Restez connecté
          </h3>
          <p className="text-white/60 text-sm leading-relaxed mb-6">
            Recevez nos actualités, conseils fitness et offres exclusives directement dans votre boîte mail.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              required
              placeholder="Votre adresse email"
              className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-brand-red"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-brand-red text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors whitespace-nowrap"
            >
              S&apos;abonner
            </button>
          </form>
        </div>
        <div className="w-full lg:w-72 aspect-[4/3] rounded-2xl bg-gradient-to-br from-brand-red/20 to-brand-black overflow-hidden flex items-center justify-center">
          <div className="text-center p-6">
            <div className="text-5xl mb-2">💪</div>
            <p className="text-white/40 text-xs">Infinity Gym Center News</p>
          </div>
        </div>
      </div>
    </SectionWrapper>
  )
}
