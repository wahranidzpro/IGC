import { NextRequest } from 'next/server'

function parseHost(urlStr: string): string | null {
  try {
    const url = new URL(urlStr)
    return url.hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return null
  }
}

const RAW_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'https://igc-gym.vercel.app',
  'https://www.infinitygymcenter.dz',
  'https://infinitygymcenter.dz',
].filter(Boolean) as string[]

const ALLOWED_HOSTS = RAW_ORIGINS.map(parseHost).filter(Boolean) as string[]

export function validateOrigin(request: NextRequest): { valid: boolean; error?: string } {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')

  if (!origin && !referer) {
    return { valid: true }
  }

  const target = origin || referer
  if (!target) return { valid: true }

  const host = parseHost(target)
  if (!host) return { valid: false, error: `Unable to parse host from '${target}'` }

  if (ALLOWED_HOSTS.includes(host)) {
    return { valid: true }
  }

  return { valid: false, error: `Host '${host}' not allowed (from '${target}')` }
}
