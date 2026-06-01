'use client'
import { createContext, useContext, createElement, useState, ReactNode } from 'react'

type Language = 'fr' | 'en' | 'ar'

interface LanguageContextType {
  language: Language
  lang: Language
  setLanguage: (l: Language) => void
  setLang: (l: Language) => void
  t: (key: string) => string
  dir: string
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'fr', lang: 'fr',
  setLanguage: () => {},
  setLang: () => {},
  t: (k: string) => k,
  dir: 'ltr',
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('fr')
  const setLang = setLanguage
  const t = (key: string) => key
  const dir = language === 'ar' ? 'rtl' : 'ltr'

  return createElement(LanguageContext.Provider, {
    value: { language, lang: language, setLanguage, setLang, t, dir }
  }, children)
}

export function useLanguage() {
  return useContext(LanguageContext)
}
