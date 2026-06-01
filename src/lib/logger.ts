const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  debug: (msg: string, data?: unknown) => isDev && console.log(`[DEBUG] ${msg}`, data),
  info: (msg: string, data?: unknown) => isDev && console.log(`[INFO] ${msg}`, data),
  warn: (msg: string, data?: unknown) => isDev && console.warn(`[WARN] ${msg}`, data),
  error: (msg: string, error?: unknown) => console.error(`[ERROR] ${msg}`, error),
};
