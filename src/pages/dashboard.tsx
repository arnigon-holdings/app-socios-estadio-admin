import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Users, Trophy, TrendingUp, Clock, CreditCard } from 'lucide-react'
import type { DashboardStats } from '@/types'

function StatCard({ title, value, icon: Icon, description }: {
  title: string
  value: string | number
  icon: React.ElementType
  description: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const { data, isLoading } = useQuery<{ stats: DashboardStats }>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/api/admin/dashboard'),
  })

  const stats = data?.stats

  const statCards = [
    {
      title: 'Total Usuarios',
      value: stats?.users_total?.toLocaleString() ?? 0,
      icon: Users,
      description: 'Registrados en la plataforma',
    },
    {
      title: 'Usuarios Hoy',
      value: stats?.users_today ?? 0,
      icon: Clock,
      description: 'Nuevos registros hoy',
    },
    {
      title: 'Esta Semana',
      value: stats?.users_this_week ?? 0,
      icon: TrendingUp,
      description: 'Nuevos esta semana',
    },
    {
      title: 'Equipos Activos',
      value: `${stats?.teams_active ?? 0}/${stats?.teams_total ?? 0}`,
      icon: Trophy,
      description: 'Equipos activos / total',
    },
    {
      title: 'Acciones de Puntos',
      value: `${stats?.point_actions_active ?? 0}/${stats?.point_actions_total ?? 0}`,
      icon: CreditCard,
      description: 'Acciones activas / total',
    },
  ]

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Resumen de la plataforma</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))
          : statCards.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Equipos</CardTitle>
            <CardDescription>Estado actual de equipos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Equipos activos</span>
              <Badge variant="secondary">{stats?.teams_active ?? 0}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm">Equipos inactivos</span>
              <Badge variant="outline">{(stats?.teams_total ?? 0) - (stats?.teams_active ?? 0)}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total</span>
              <span className="font-semibold">{stats?.teams_total ?? 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones de Puntos</CardTitle>
            <CardDescription>Estado de acciones configuradas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Acciones activas</span>
              <Badge variant="secondary">{stats?.point_actions_active ?? 0}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm">Acciones inactivas</span>
              <Badge variant="outline">{(stats?.point_actions_total ?? 0) - (stats?.point_actions_active ?? 0)}</Badge>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total</span>
              <span className="font-semibold">{stats?.point_actions_total ?? 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}