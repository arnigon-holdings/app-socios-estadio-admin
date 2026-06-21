import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, Trophy, Activity, Calendar, TrendingUp } from 'lucide-react'
import type { DashboardStats } from '@/types'

export function DashboardPage() {
  const { data, isLoading } = useQuery<{ stats: DashboardStats }>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/api/admin/dashboard'),
  })

  const stats = data?.stats

  const statCards = [
    {
      title: 'Total Usuarios',
      value: stats?.users_total ?? 0,
      icon: Users,
      description: 'Registrados en la plataforma',
    },
    {
      title: 'Usuarios Hoy',
      value: stats?.users_today ?? 0,
      icon: Calendar,
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
      description: 'Equipos en la plataforma',
    },
    {
      title: 'Acciones de Puntos',
      value: `${stats?.point_actions_active ?? 0}/${stats?.point_actions_total ?? 0}`,
      icon: Activity,
      description: 'Acciones configuradas',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Resumen de la plataforma</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
          : statCards.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.title}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">{stat.description}</p>
                  </CardContent>
                </Card>
              )
            })}
      </div>
    </div>
  )
}
