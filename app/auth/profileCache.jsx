// app/auth/profileCache.js


const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const STORAGE_KEY = "profile_cache"

let cache = null
let cacheTimestamp = 0
let inFlightRequest = null

function readStorage() {
  if (typeof window === "undefined") return null

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const getCachedProfile = () => {
  // 1. in-memory (fast path)
  if (cache && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cache
  }

  // 2. localStorage (survives refresh)
  const stored = readStorage()

  if (stored && Date.now() - stored.timestamp < CACHE_TTL) {
    cache = stored.data
    cacheTimestamp = stored.timestamp
    return cache
  }

  if (stored) localStorage.removeItem(STORAGE_KEY)

  return null
}

export const setCachedProfile = (data) => {
  cache = data
  cacheTimestamp = Date.now()

  if (typeof window === "undefined") return

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ data, timestamp: cacheTimestamp })
    )
  } catch {
    // storage full or unavailable, memory cache still works
  }
}

export const clearProfileCache = () => {
  cache = null
  cacheTimestamp = 0

  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
  }
}


// Dedupes concurrent calls — if ProfilePage mounts twice quickly,
// only one network request goes out
export const fetchProfileDeduped = async (fetcher) => {
  const cached = getCachedProfile()
  if (cached) return cached

  if (inFlightRequest) return inFlightRequest

  inFlightRequest = fetcher().finally(() => {
    inFlightRequest = null
  })

  return inFlightRequest
}