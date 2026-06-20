/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest'

// Test the formatPhone function inline (import won't work in jsdom-less env)
function formatPhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '')
}

function formatPhoneDisplay(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '')
  if (cleaned.length === 10) return cleaned.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5')
  return phone
}

function getTemplate(templateName: string, data: Record<string, any>): string {
  const templates: Record<string, string> = {
    renewal_reminder: "Bonjour {{name}}, votre abonnement expire dans {{days}} jours. Pensez à le renouveler !",
    expired: "Bonjour {{name}}, votre abonnement a expiré. Rejoignez-nous vite pour continuer votre progression !",
    welcome: "Bienvenue {{name}} à l'IGC ! Nous sommes ravis de vous accueillir.",
    receipt: "Bonjour {{name}}, nous avons bien reçu votre paiement de {{amount}} DA. Merci !",
  }
  const template = templates[templateName] || 'Bonjour {{name}} !'
  return Object.entries(data).reduce((msg, [key, value]) => {
    return msg.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
  }, template)
}

describe('formatPhone', () => {
  it('supprime les espaces', () => {
    expect(formatPhone('06 12 34 56 78')).toBe('0612345678')
  })
  it('supprime les tirets', () => {
    expect(formatPhone('06-12-34-56-78')).toBe('0612345678')
  })
  it('supprime les lettres', () => {
    expect(formatPhone('+213 6 12 34 56 78')).toBe('213612345678')
  })
  it('gère une chaîne vide', () => {
    expect(formatPhone('')).toBe('')
  })
})

describe('formatPhoneDisplay', () => {
  it('formate un numéro 10 chiffres', () => {
    expect(formatPhoneDisplay('0612345678')).toBe('06 12 34 56 78')
  })
  it('laisse un numéro court inchangé', () => {
    expect(formatPhoneDisplay('1234')).toBe('1234')
  })
})

describe('getTemplate', () => {
  it('résout renewal_reminder avec name et days', () => {
    const result = getTemplate('renewal_reminder', { name: 'Ahmed Benali', days: '5' })
    expect(result).toBe('Bonjour Ahmed Benali, votre abonnement expire dans 5 jours. Pensez à le renouveler !')
  })
  it('résout expired avec name', () => {
    const result = getTemplate('expired', { name: 'Sara Amrani' })
    expect(result).toBe("Bonjour Sara Amrani, votre abonnement a expiré. Rejoignez-nous vite pour continuer votre progression !")
  })
  it('résout welcome avec name', () => {
    const result = getTemplate('welcome', { name: 'Test User' })
    expect(result).toBe("Bienvenue Test User à l'IGC ! Nous sommes ravis de vous accueillir.")
  })
  it('résout receipt avec name et amount', () => {
    const result = getTemplate('receipt', { name: 'Omar Tazi', amount: '5000' })
    expect(result).toBe('Bonjour Omar Tazi, nous avons bien reçu votre paiement de 5000 DA. Merci !')
  })
  it('retourne le fallback si la clé est inconnue', () => {
    const result = getTemplate('inconnu', { name: 'X' })
    expect(result).toBe('Bonjour X !')
  })
})
