import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { authApi } from '../api'
import { clearToken, getToken, setToken } from '../api/client'
import type { User } from '../api/types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, nickname: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // 首次进入用本地 token 换用户信息，token 失效时静默降级为未登录
  useEffect(() => {
    let active = true
    const token = getToken()
    if (!token) {
      setLoading(false)
      return
    }
    authApi
      .me()
      .then((me) => active && setUser(me))
      .catch(() => clearToken())
      .finally(() => active && setLoading(false))

    return () => {
      active = false
    }
  }, [])

  // 任意接口返回 401 时，统一在这里把登录态清掉
  useEffect(() => {
    const onExpired = () => setUser(null)
    window.addEventListener('wf:auth-expired', onExpired)
    return () => window.removeEventListener('wf:auth-expired', onExpired)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login({ email, password })
    setToken(result.access_token)
    setUser(result.user)
  }, [])

  const register = useCallback(async (email: string, nickname: string, password: string) => {
    const result = await authApi.register({ email, nickname, password })
    setToken(result.access_token)
    setUser(result.user)
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth 必须在 AuthProvider 内使用')
  return ctx
}
