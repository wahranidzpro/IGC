const SECRET = process.env.COOKIE_SECRET;
if (!SECRET) throw new Error('COOKIE_SECRET environment variable is required');

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw', new TextEncoder().encode(SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign', 'verify']
  );
}

export async function signCookie(obj: Record<string, unknown>): Promise<string> {
  const key = await getKey();
  const json = JSON.stringify(obj);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(json));
  return `${btoa(json)}.${btoa(String.fromCharCode(...new Uint8Array(sig)))}`;
}

export async function verifyCookie(value: string): Promise<Record<string, unknown> | null> {
  const dot = value.lastIndexOf('.');
  if (dot === -1) return null;
  try {
    const json = atob(value.slice(0, dot));
    const key = await getKey();
    const valid = await crypto.subtle.verify(
      'HMAC', key,
      Uint8Array.from(atob(value.slice(dot + 1)), c => c.charCodeAt(0)),
      new TextEncoder().encode(json)
    );
    return valid ? JSON.parse(json) : null;
  } catch { return null; }
}
