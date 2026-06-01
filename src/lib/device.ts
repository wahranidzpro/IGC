const DEVICE_KEY = "igc_device_id"
const DEVICE_NAME_KEY = "igc_device_name"
const HEARTBEAT_INTERVAL = 30000

export function getDeviceFingerprint(): string {
  if (typeof window === "undefined") return ""
  let fp = localStorage.getItem(DEVICE_KEY)
  if (!fp) {
    fp = crypto.randomUUID()
    localStorage.setItem(DEVICE_KEY, fp)
  }
  return fp
}

export function getDeviceName(): string {
  if (typeof window === "undefined") return ""
  let name = localStorage.getItem(DEVICE_NAME_KEY)
  if (!name) {
    const ua = navigator.userAgent
    const isMobile = /Mobi|Android/i.test(ua)
    const brand = isMobile ? "Mobile" : "Desktop"
    const browser = ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox" : ua.includes("Safari") ? "Safari" : "Navigateur"
    name = `${browser} (${brand})`
    localStorage.setItem(DEVICE_NAME_KEY, name)
  }
  return name
}

export function getDeviceInfo() {
  if (typeof window === "undefined") return { fingerprint: "", name: "" }
  return {
    fingerprint: getDeviceFingerprint(),
    name: getDeviceName(),
  }
}

export function clearDeviceData() {
  if (typeof window === "undefined") return
  localStorage.removeItem(DEVICE_KEY)
  localStorage.removeItem(DEVICE_NAME_KEY)
}

export async function verifyDevice(input: { profileId?: string; email?: string }): Promise<{
  allowed: boolean
  reason?: string
  profileId?: string
}> {
  const fingerprint = getDeviceFingerprint()
  if (!fingerprint) return { allowed: false, reason: "DEVICE_NOT_IDENTIFIED" }

  const res = await fetch("/api/device/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, fingerprint }),
  })
  return res.json()
}

export async function registerDevice(profileId: string): Promise<{ success: boolean; error?: string }> {
  const { fingerprint, name } = getDeviceInfo()
  if (!fingerprint) return { success: false, error: "Impossible d'identifier l'appareil" }

  const res = await fetch("/api/device/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profileId, fingerprint, name }),
  })
  return res.json()
}

export async function requestTransferOtp(profileId: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetch("/api/device/transfer/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profileId }),
  })
  return res.json()
}

export async function confirmTransferOtp(
  profileId: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  const { fingerprint, name } = getDeviceInfo()

  const res = await fetch("/api/device/transfer/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profileId, otp, fingerprint, name }),
  })
  return res.json()
}

export async function sendHeartbeat(): Promise<{ ok: boolean }> {
  const fingerprint = getDeviceFingerprint()
  if (!fingerprint) return { ok: false }
  try {
    const res = await fetch("/api/device/heartbeat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fingerprint }),
    })
    return { ok: res.ok }
  } catch {
    return { ok: false }
  }
}

export function startHeartbeat(onLost?: () => void) {
  const interval = setInterval(async () => {
    const { ok } = await sendHeartbeat()
    if (!ok) onLost?.()
  }, HEARTBEAT_INTERVAL)

  sendHeartbeat()

  return () => clearInterval(interval)
}

export async function checkActiveDevice(): Promise<{
  allowed: boolean
  activeDeviceName?: string
  activeDeviceId?: string
  reason?: string
}> {
  const fingerprint = getDeviceFingerprint()
  if (!fingerprint) return { allowed: false, reason: "DEVICE_NOT_IDENTIFIED" }

  try {
    const res = await fetch("/api/device/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fingerprint }),
    })
    return res.json()
  } catch {
    return { allowed: false, reason: "NETWORK_ERROR" }
  }
}

export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false
  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || navigator.maxTouchPoints > 0
}

export function isPWA(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(display-mode: standalone)").matches
}
