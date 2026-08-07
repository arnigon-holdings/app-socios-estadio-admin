import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import {
  Users,
  Shield,
  Trophy,
  Activity,
  FileText,
  LayoutDashboard,
  LogOut,
  ScanFace,
  Menu,
  X,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/users', label: 'Usuarios', icon: Users },
  { href: '/face-search', label: 'Búsqueda Facial', icon: ScanFace },
  { href: '/teams', label: 'Equipos', icon: Trophy },
  { href: '/point-actions', label: 'Puntos', icon: Activity },
  { href: '/transactions', label: 'Transacciones', icon: FileText },
  { href: '/audit-logs', label: 'Auditoría', icon: Shield },
]

export function LayoutWithSidebar({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen">
      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-2 border-b bg-card px-4 md:hidden">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">
          <Menu className="h-5 w-5" />
        </Button>
        <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
          <Shield className="h-5 w-5" />
          <span>App Socios</span>
        </Link>
      </header>

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/80" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col border-r bg-card">
            <div className="flex h-14 items-center justify-between border-b px-4">
              <Link to="/dashboard" onClick={() => setSidebarOpen(false)} className="flex items-center gap-2 font-semibold">
                <Shield className="h-5 w-5" />
                <span>App Socios</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} aria-label="Cerrar menú">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <MobileNav onNavigate={() => setSidebarOpen(false)} />
            <div className="border-t p-4">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-muted-foreground"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r bg-card md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
            <Shield className="h-5 w-5" />
            <span>App Socios</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          <NavList />
        </nav>
        <div className="border-t p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-x-hidden pb-8">
        <div className="mx-auto w-full max-w-7xl px-4 pt-20 md:px-6 md:pt-6">{children}</div>
      </main>
    </div>
  )
}

function NavList() {
  const location = useLocation()
  return (
    <ul className="space-y-1">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = location.pathname === item.href
        return (
          <li key={item.href}>
            <Link
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function MobileNav({ onNavigate }: { onNavigate: () => void }) {
  return (
    <nav className="flex-1 overflow-y-auto p-4">
      <ul className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <li key={item.href}>
              <Link
                to={item.href}
                onClick={onNavigate}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
