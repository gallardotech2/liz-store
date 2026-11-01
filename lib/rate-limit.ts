import { createClient, type SupabaseClient } from "@supabase/supabase-js"

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt?: string
}

const memoryLimits = new Map<string, { count: number; resetTime: number }>()
let rpcClient: SupabaseClient | null = null
let rpcWarningLogged = false

function checkMemory(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now()
  const windowMs = windowSeconds * 1000
  const record = memoryLimits.get(key)

  if (!record || now >= record.resetTime) {
    memoryLimits.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: Math.max(0, limit - 1), resetAt: new Date(now + windowMs).toISOString() }
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: new Date(record.resetTime).toISOString() }
  }

  record.count++
  return { allowed: true, remaining: Math.max(0, limit - record.count), resetAt: new Date(record.resetTime).toISOString() }
}

function getRpcClient(): SupabaseClient | null {
  if (rpcClient) return rpcClient
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return null

  rpcClient = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return rpcClient
}

export async function checkRateLimit(
  key: string,
  limit = 10,
  windowSeconds = 60,
): Promise<RateLimitResult> {
  const client = getRpcClient()
  if (!client) return checkMemory(key, limit, windowSeconds)

  try {
    const { data, error } = await client.rpc("check_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    })

    if (error) {
      if (!rpcWarningLogged) {
        rpcWarningLogged = true
        console.warn("[rate-limit] RPC no disponible, usando memoria:", error.message)
      }
      return checkMemory(key, limit, windowSeconds)
    }

    const row = (Array.isArray(data) ? data[0] : data) as
      | { allowed?: boolean; remaining?: number; reset_at?: string }
      | null

    if (!row) return checkMemory(key, limit, windowSeconds)

    return {
      allowed: Boolean(row.allowed),
      remaining: Number(row.remaining ?? 0),
      resetAt: row.reset_at,
    }
  } catch (error) {
    if (!rpcWarningLogged) {
      rpcWarningLogged = true
      console.warn("[rate-limit] Error usando RPC, usando memoria:", error)
    }
    return checkMemory(key, limit, windowSeconds)
  }
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  if (!result.resetAt) return {}
  const seconds = Math.max(1, Math.ceil((new Date(result.resetAt).getTime() - Date.now()) / 1000))
  return { "Retry-After": String(seconds) }
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()

  const cloudflare = request.headers.get("cf-connecting-ip")
  if (cloudflare) return cloudflare.trim()

  const realIp = request.headers.get("x-real-ip")
  if (realIp) return realIp.trim()

  return "unknown"
}
