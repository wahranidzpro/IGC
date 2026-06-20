import { test, expect } from '@playwright/test'
import { login } from './helpers'

const PAGES = [
  { href: '/admin',          label: 'Dashboard' },
  { href: '/members',        label: 'Adhérents' },
  { href: '/checkin',        label: 'Check-in' },
  { href: '/pos',            label: 'POS' },
  { href: '/products',       label: 'Produits' },
  { href: '/equipment',      label: 'Équipement' },
  { href: '/consumables',    label: 'Consommables' },
  { href: '/coaches',        label: 'Coaches' },
  { href: '/programs-plans', label: 'Programmes' },
  { href: '/notifications',  label: 'Notifications' },
  { href: '/admin/rewards',  label: 'Récompenses' },
  { href: '/admin/loyalty',  label: 'Fidélité' },
  { href: '/admin/database', label: 'Base de données' },
  { href: '/payments',       label: 'Paiements' },
  { href: '/expenses',       label: 'Dépenses' },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function waitForPage(page: any, timeout = 20000) {
  for (let i = 0; i < Math.ceil(timeout / 500); i++) {
    await page.waitForTimeout(500)
    if (page.url().includes('/login')) return 'login'
    const text = await page.locator('body').innerText()
    if (text.length > 10) return 'ready'
  }
  return 'timeout'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function reLogin(page: any) {
  await page.locator('input[placeholder="admin"]').first().waitFor({ state: 'visible', timeout: 10000 })
  await page.locator('input[placeholder="admin"]').first().fill('admin')
  await page.locator('input[placeholder="••••••••"]').first().fill('Admin@123')
  await page.locator('button[type="submit"]').first().click()
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(500)
    if (!page.url().includes('/login')) break
  }
}

test.describe('IGC Regression', () => {
  test.describe('1 — Authentification', () => {
    for (const role of ['admin', 'reception', 'coach'] as const) {
      test(`Connexion ${role}`, async ({ page }) => {
        await login(page, role)
        expect(page.url()).not.toContain('/login')
      })
    }
  })

  for (const { href, label } of PAGES) {
    test(`Page ${label} (${href})`, async ({ page }) => {
      await login(page, 'admin')

      // Strategy 1: full reload (auth cookie should survive)
      await page.goto(href, { waitUntil: 'load', timeout: 60000 })
      let status = await waitForPage(page)

      if (status === 'login') {
        // Auth didn't survive — re-login
        await reLogin(page)
        // Strategy 2: sidebar link (SPA, keeps auth in memory)
        const sideLink = page.locator(`nav a[href="${href}"]`)
        if (await sideLink.count() > 0) {
          await sideLink.first().click()
          status = await waitForPage(page)
        }
        // Strategy 3: if sidebar didn't work, try goto again
        if (status !== 'ready') {
          await page.goto(href, { waitUntil: 'load', timeout: 60000 })
          status = await waitForPage(page)
        }
      }

      expect(status).toBe('ready')
      expect(page.url()).toContain(href)
    })
  }
})
