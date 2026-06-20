import { Page, expect } from '@playwright/test'

export const USERS = {
  admin: { username: 'admin', password: 'Admin@123' },
  reception: { username: 'reception', password: 'Reception@123' },
  coach: { username: 'coach', password: 'Coach@123' },
}

export async function login(page: Page, role: keyof typeof USERS = 'admin') {
  const user = USERS[role]
  await page.goto('/login', { waitUntil: 'load', timeout: 60000 })
  await page.locator('input[placeholder="admin"]').waitFor({ state: 'visible', timeout: 60000 })
  await page.locator('input[placeholder="admin"]').fill(user.username)
  await page.locator('input[placeholder="••••••••"]').fill(user.password)
  await page.locator('button[type="submit"]').click()
  for (let i = 0; i < 60; i++) {
    await page.waitForTimeout(500)
    if (!page.url().includes('/login')) return
  }
  throw new Error(`Login failed for ${role} — still on /login after 30s`)
}

async function waitForPageReady(page: Page): Promise<boolean> {
  // Wait for app to finish rendering — either sidebar (auth ok) or PinPad (redirected)
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(500)
    const text = await page.locator('body').innerText()
    if (text.length > 10) return !page.url().includes('/login')
  }
  return !page.url().includes('/login')
}

export async function loginAndNavigateTo(page: Page, path: string) {
  await login(page, 'admin')

  // Navigate to target page
  await page.goto(path, { waitUntil: 'load', timeout: 60000 })
  let ready = await waitForPageReady(page)

  if (!ready) {
    // Redirected to /login — re-login and navigate via sidebar (SPA)
    await page.locator('input[placeholder="admin"]').waitFor({ state: 'visible', timeout: 15000 })
    await page.locator('input[placeholder="admin"]').fill(USERS.admin.username)
    await page.locator('input[placeholder="••••••••"]').fill(USERS.admin.password)
    await page.locator('button[type="submit"]').click()
    for (let i = 0; i < 30; i++) {
      await page.waitForTimeout(500)
      if (!page.url().includes('/login')) break
    }

    // Try sidebar link
    const sideLink = page.locator(`nav a[href="${path}"]`)
    if (await sideLink.count() > 0) {
      await sideLink.first().click()
    } else {
      await page.goto(path, { waitUntil: 'load', timeout: 60000 })
    }
    ready = await waitForPageReady(page)
  }

  expect(page.url()).toContain(path)
  expect(ready).toBe(true)
}
