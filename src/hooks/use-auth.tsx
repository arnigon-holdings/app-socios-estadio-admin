import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { api } from '@/lib/api'
import type { Admin } from '@/types'

interface AuthContextType {
  admin: Admin | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

const STORAGE_KEY = 'admin_session'

const AuthContext = createContext<AuthContextType | null>(null)

function loadStoredAdmin(): Admin | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as Admin) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(loadStoredAdmin)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    const storedAdmin = loadStoredAdmin()
    if (!storedAdmin) {
      setIsLoading(false)
      return
    }
    try {
      await api.get('/api/admin/dashboard')
      setAdmin(storedAdmin)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(storedAdmin))
    } catch {
      setAdmin(null)
      localStorage.removeItem(STORAGE_KEY)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const data = await api.post<{ admin: Admin }>('/api/admin/login', {
      session: { email, password }
    })
    setAdmin(data.admin)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.admin))
  }

  const logout = async () => {
    await api.delete('/api/admin/logout')
    setAdmin(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return (
    <AuthContext.Provider
      value={{
        admin,
        isLoading,
        isAuthenticated: !!admin,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
