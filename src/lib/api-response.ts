import { NextResponse } from 'next/server'

export function success<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function error(message: string, status = 500, code = 'INTERNAL_ERROR') {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}

export function ok(data?: Record<string, unknown>) {
  return NextResponse.json({ success: true, ...data })
}
