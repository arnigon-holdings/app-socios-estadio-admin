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

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    try {
      const data = await api.get<{ admin: Admin }>('/api/v1/admin/dashboard')
      setAdmin(data.admin || null)
    } catch {
      setAdmin(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const data = await api.post<{ admin: Admin }>('/api/v1/admin/login', {
      session: { email, password }
    })
    setAdmin(data.admin)
  }

  const logout = async () => {
    await api.delete('/api/v1/admin/logout')
    setAdmin(null)
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
