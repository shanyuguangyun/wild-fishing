import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { cityApi } from '../api'
import type { City } from '../api/types'

const CITY_KEY = 'wf_city'
const COORDS_KEY = 'wf_coords'

interface CityContextValue {
  city: City | null
  coords: { lat: number; lng: number } | null
  loading: boolean
  setCity: (city: City) => void
  relocalize: () => Promise<void>
}

const CityContext = createContext<CityContextValue | null>(null)

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

/**
 * 城市与坐标。
 *
 * 优先使用上次选择的城市（用户手动切换过就以用户为准）；
 * 否则尝试浏览器定位 → 反查最近城市；被拒绝或超时就退回后端默认城市。
 * 坐标同时供「距离」排序使用。
 */
export function CityProvider({ children }: { children: ReactNode }) {
  const [city, setCityState] = useState<City | null>(() => readJSON<City>(CITY_KEY))
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(() =>
    readJSON<{ lat: number; lng: number }>(COORDS_KEY)
  )
  const [loading, setLoading] = useState(!city)

  const persist = useCallback((nextCity: City, nextCoords?: { lat: number; lng: number } | null) => {
    setCityState(nextCity)
    localStorage.setItem(CITY_KEY, JSON.stringify(nextCity))
    if (nextCoords) {
      setCoords(nextCoords)
      localStorage.setItem(COORDS_KEY, JSON.stringify(nextCoords))
    }
  }, [])

  const geolocate = useCallback(async () => {
    return new Promise<{ lat: number; lng: number } | null>((resolve) => {
      if (!('geolocation' in navigator)) return resolve(null)
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 6000, maximumAge: 10 * 60 * 1000 }
      )
    })
  }, [])

  const relocalize = useCallback(async () => {
    setLoading(true)
    try {
      const position = await geolocate()
      const result = await cityApi.locate(position ?? undefined)
      persist(result.city, position)
    } catch {
      // 后端不可用时保持已有城市，不打断浏览
    } finally {
      setLoading(false)
    }
  }, [geolocate, persist])

  useEffect(() => {
    if (city) {
      setLoading(false)
      return
    }
    void relocalize()
    // 只在首次挂载、且没有缓存城市时定位一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setCity = useCallback((next: City) => persist(next), [persist])

  const value = useMemo(
    () => ({ city, coords, loading, setCity, relocalize }),
    [city, coords, loading, setCity, relocalize]
  )

  return <CityContext.Provider value={value}>{children}</CityContext.Provider>
}

export function useCity(): CityContextValue {
  const ctx = useContext(CityContext)
  if (!ctx) throw new Error('useCity 必须在 CityProvider 内使用')
  return ctx
}
