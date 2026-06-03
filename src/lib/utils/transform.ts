function toCamelCase(key: string): string {
  return key.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function deepConvert(v: unknown): unknown {
  if (v === null || v === undefined) return v
  if (Array.isArray(v)) return v.map(deepConvert)
  if (typeof v === "object") return mapRow<Record<string, unknown>>(v as Record<string, unknown>)
  return v
}

export function mapRow<T>(row: Record<string, unknown> | null): T | null {
  if (!row) return null
  const result: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(row)) {
    result[toCamelCase(k)] = deepConvert(v)
  }
  return result as T
}

export function mapRows<T>(rows: Record<string, unknown>[] | null): T[] {
  if (!rows) return []
  return rows.map((row) => mapRow<T>(row)!)
}
