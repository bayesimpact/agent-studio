// Global type definitions for browser APIs

interface CookieStore extends EventTarget {
  get(name: string): Promise<CookieListItem | null>
  getAll(name?: string): Promise<CookieListItem[]>
  set(name: string, value: string, options?: CookieStoreSetOptions): Promise<void>
  set(options: CookieStoreSetExtraOptions): Promise<void>
  delete(name: string): Promise<void>
  delete(options: CookieStoreDeleteOptions): Promise<void>
}

interface CookieListItem {
  name: string
  value: string
  domain: string | null
  path: string
  expires: number | Date | null
  secure: boolean
  sameSite: "strict" | "lax" | "none"
}

interface CookieStoreSetOptions {
  name?: string
  value?: string
  domain?: string | null
  path?: string
  expires?: number | Date | null
  secure?: boolean
  sameSite?: "strict" | "lax" | "none"
}

interface CookieStoreSetExtraOptions {
  name: string
  value: string
  expires?: number | Date | null
  domain?: string | null
  path?: string
  secure?: boolean
  sameSite?: "strict" | "lax" | "none"
}

interface CookieStoreDeleteOptions {
  name: string
  domain?: string | null
  path?: string
}

declare const cookieStore: CookieStore
