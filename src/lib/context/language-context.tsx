"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"

type Language = "fr" | "ar"

interface LanguageContextType {
  lang: Language
  setLang: (l: Language) => void
  t: (key: string) => string
  dir: "ltr" | "rtl"
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const translations: Record<string, { fr: string; ar: string }> = {
  "sidebar.principal": { fr: "Principal", ar: "الرئيسية" },
  "sidebar.dashboard": { fr: "Dashboard", ar: "لوحة القيادة" },
  "sidebar.checkin": { fr: "Pointage & Accès", ar: "الحضور والولوج" },
  "sidebar.coach": { fr: "Coach IA", ar: "المدرب الذكي" },
  "sidebar.members": { fr: "Adhérents", ar: "المنخرطون" },
  "sidebar.habits": { fr: "Habitudes", ar: "العادات" },
  "sidebar.pos": { fr: "Point de Vente", ar: "نقطة البيع" },
  "sidebar.products": { fr: "Produits", ar: "المنتجات" },
  "sidebar.materiel": { fr: "Matériel", ar: "المعدات" },
  "sidebar.equipment": { fr: "Équipements", ar: "التجهيزات" },
  "sidebar.consumables": { fr: "Consommables", ar: "المواد الاستهلاكية" },
  "sidebar.gestion": { fr: "Gestion", ar: "الإدارة" },
  "sidebar.coaches": { fr: "Coachs", ar: "المدربون" },
  "sidebar.programs": { fr: "Programmes", ar: "البرامج" },
  "sidebar.plans": { fr: "Plans d'abonnement", ar: "خطط الاشتراك" },
  "sidebar.access": { fr: "Contrôle d'accès", ar: "التحكم في الولوج" },
  "sidebar.rfid": { fr: "Contrôle d'accès", ar: "التحكم في الولوج" },
  "sidebar.turnstiles": { fr: "Tourniquets", ar: "الدوارات" },
  "sidebar.access.logs": { fr: "Journaux d'accès", ar: "سجلات الولوج" },
  "sidebar.turnstiles.install": { fr: "Installation Bridge", ar: "تثبيت الجسر" },
  "sidebar.finance": { fr: "Finance", ar: "المالية" },
  "sidebar.finance.assistant": { fr: "Assistant Comptable", ar: "المساعد المحاسبي" },
  "sidebar.payments": { fr: "Paiements", ar: "المدفوعات" },
  "sidebar.expenses": { fr: "Dépenses", ar: "المصروفات" },
  "sidebar.administration": { fr: "Administration", ar: "الإدارة العامة" },
  "sidebar.admin": { fr: "Dashboard Admin", ar: "لوحة الإدارة" },
  "sidebar.notifications": { fr: "Notifications", ar: "الإشعارات" },
  "sidebar.database": { fr: "Base de données", ar: "قاعدة البيانات" },
  "sidebar.audit": { fr: "Journal Audit", ar: "سجل التدقيق" },
  "sidebar.loyalty": { fr: "Fidelite & Points", ar: "الولاء والنقاط" },
  "sidebar.pin": { fr: "Gestion PIN", ar: "إدارة الرمز السري" },
  "sidebar.rentabilisation": { fr: "Rentabilisation", ar: "الربحية" },
  "sidebar.fidelity": { fr: "Fidélité & Points", ar: "الولاء والنقاط" },
  "sidebar.commissions": { fr: "Commissions", ar: "العمولات" },
  "sidebar.coaching": { fr: "Coaching Privé", ar: "التدريب الخاص" },
  "sidebar.events": { fr: "Événements", ar: "الفعاليات" },
  "sidebar.config": { fr: "Configuration", ar: "الإعدادات" },
  "sidebar.settings": { fr: "Paramètres Club", ar: "إعدادات النادي" },
  "sidebar.logout": { fr: "Déconnexion", ar: "تسجيل الخروج" },
  "sidebar.personnel": { fr: "Personnel", ar: "الموظفون" },
  "sidebar.personnel.manage": { fr: "Gestion du personnel", ar: "إدارة الموظفين" },
  "sidebar.monitoring": { fr: "Monitoring", ar: "المراقبة" },
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("fr")

  useEffect(() => {
    const saved = localStorage.getItem("gym-lang") as Language
    if (saved === "fr" || saved === "ar") setLangState(saved)
  }, [])

  const setLang = useCallback((l: Language) => {
    setLangState(l)
    localStorage.setItem("gym-lang", l)
  }, [])

  useEffect(() => {
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"
    document.documentElement.lang = lang
  }, [lang])

  const t = useCallback((key: string): string => {
    return translations[key]?.[lang] ?? key
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir: lang === "ar" ? "rtl" : "ltr" }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error("useLanguage must be used within LanguageProvider")
  return context
}
