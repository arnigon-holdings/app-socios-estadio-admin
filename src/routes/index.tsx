import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/hooks/use-auth'
import { Sidebar } from '@/components/layout'
import { LoginPage } from '@/pages/login'
import { DashboardPage } from '@/pages/dashboard'
import { UsersPage } from '@/pages/users'
import { TeamsPage } from '@/pages/teams'
import { PointActionsPage } from '@/pages/point-actions'
import { TransactionsPage } from '@/pages/transactions'
import { AuditLogsPage } from '@/pages/audit-logs'
import { FaceSearchPage } from '@/pages/face-search'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function LayoutWithSidebar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  )
}

const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <PublicRoute>
        <LoginPage />
      </PublicRoute>
    ),
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <LayoutWithSidebar>
          <DashboardPage />
        </LayoutWithSidebar>
      </ProtectedRoute>
    ),
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <LayoutWithSidebar>
          <DashboardPage />
        </LayoutWithSidebar>
      </ProtectedRoute>
    ),
  },
  {
    path: '/users',
    element: (
      <ProtectedRoute>
        <LayoutWithSidebar>
          <UsersPage />
        </LayoutWithSidebar>
      </ProtectedRoute>
    ),
  },
  {
    path: '/teams',
    element: (
      <ProtectedRoute>
        <LayoutWithSidebar>
          <TeamsPage />
        </LayoutWithSidebar>
      </ProtectedRoute>
    ),
  },
  {
    path: '/point-actions',
    element: (
      <ProtectedRoute>
        <LayoutWithSidebar>
          <PointActionsPage />
        </LayoutWithSidebar>
      </ProtectedRoute>
    ),
  },
  {
    path: '/transactions',
    element: (
      <ProtectedRoute>
        <LayoutWithSidebar>
          <TransactionsPage />
        </LayoutWithSidebar>
      </ProtectedRoute>
    ),
  },
  {
    path: '/audit-logs',
    element: (
      <ProtectedRoute>
        <LayoutWithSidebar>
          <AuditLogsPage />
        </LayoutWithSidebar>
      </ProtectedRoute>
    ),
  },
  {
    path: '/face-search',
    element: (
      <ProtectedRoute>
        <LayoutWithSidebar>
          <FaceSearchPage />
        </LayoutWithSidebar>
      </ProtectedRoute>
    ),
  },
])

export function AppRouter() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
