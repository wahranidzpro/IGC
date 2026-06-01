"use client"

import Hero from "@/components/marketing/Hero"
import SectionWrapper, { SectionHeader } from "@/components/marketing/SectionWrapper"
import Newsletter from "@/components/marketing/Newsletter"
import { MapPin, Phone, Clock, Mail } from "lucide-react"

const contactInfo = [
  {
    icon: MapPin,
    title: "Adresse",
    lines: ["Infinity Gym Center", "Cité 92 Logements, Saïda", "Algérie"],
  },
  {
    icon: Phone,
    title: "Téléphone",
    lines: ["+213 (0) 555 12 34 56"],
  },
  {
    icon: Mail,
    title: "Email",
    lines: ["infinity.gym.ig@gmail.com"],
  },
  {
    icon: Clock,
    title: "Horaires",
    lines: ["Lun - Sam : 6h - 23h", "Dim : 8h - 20h"],
  },
]

export default function ContactPage() {
  return (
    <>
      <Hero
        title="Contactez-nous"
        subtitle="Une question ? Besoin d'informations ? Notre équipe est là pour vous répondre."
        height="medium"
        image="/images/hero-activites.jpg"
      />

      <SectionWrapper>
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <SectionHeader title="Parlons de vous" center={false} />
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Prénom</label>
                  <input
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Nom</label>
                  <input
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Message</label>
                <textarea
                  required
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red resize-none"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto bg-brand-red text-white px-8 py-3.5 rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors"
              >
                Envoyer le message
              </button>
            </form>
          </div>

          <div className="space-y-6">
            {contactInfo.map((item) => (
              <div key={item.title} className="flex items-start gap-4 p-5 rounded-2xl bg-gray-50">
                <div className="w-12 h-12 rounded-xl bg-brand-red/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-brand-red" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
                  {item.lines.map((line) => (
                    <p key={line} className="text-sm text-gray-500">{line}</p>
                  ))}
                </div>
              </div>
            ))}

            <div
              className="aspect-[16/9] rounded-2xl bg-cover bg-center"
              style={{ backgroundImage: "url(/images/contact-map.jpg)" }}
            />
          </div>
        </div>
      </SectionWrapper>

      <Newsletter />
    </>
  )
}
