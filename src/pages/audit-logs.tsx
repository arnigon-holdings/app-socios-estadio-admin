import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { AuditLog, Pagination } from '@/types'

export function AuditLogsPage() {
  const [page, setPage] = useState(1)
  const [actionFilter, setActionFilter] = useState('')
  const [resourceTypeFilter, setResourceTypeFilter] = useState('')

  const { data, isLoading } = useQuery<{ logs: AuditLog[]; pagination: Pagination }>({
    queryKey: ['audit-logs', page, actionFilter, resourceTypeFilter],
    queryFn: () =>
      api.get('/api/v1/admin/audit_logs', {
        params: {
          page,
          per_page: 20,
          action: actionFilter || undefined,
          resource_type: resourceTypeFilter || undefined,
        },
      }),
  })

  const logs = data?.logs ?? []
  const pagination = data?.pagination

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create':
        return <Badge variant="success">Creado</Badge>
      case 'update':
        return <Badge variant="warning">Actualizado</Badge>
      case 'delete':
        return <Badge variant="destructive">Eliminado</Badge>
      case 'login':
        return <Badge variant="secondary">Login</Badge>
      default:
        return <Badge variant="outline">{action}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Logs de Auditoría</h1>
        <p className="text-muted-foreground">Registro de acciones de administradores</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex gap-4">
            <div className="space-y-1">
              <Label htmlFor="action" className="text-xs">Acción</Label>
              <Input
                id="action"
                placeholder="create, update..."
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value)
                  setPage(1)
                }}
                className="w-32"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="resource_type" className="text-xs">Recurso</Label>
              <Input
                id="resource_type"
                placeholder="User, Team..."
                value={resourceTypeFilter}
                onChange={(e) => {
                  setResourceTypeFilter(e.target.value)
                  setPage(1)
                }}
                className="w-32"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Acción</TableHead>
                <TableHead>Recurso</TableHead>
                <TableHead>ID Recurso</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No hay logs de auditoría
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.id}</TableCell>
                    <TableCell>{log.admin_id || '—'}</TableCell>
                    <TableCell>{getActionBadge(log.action)}</TableCell>
                    <TableCell>{log.resource_type}</TableCell>
                    <TableCell>{log.resource_id || '—'}</TableCell>
                    <TableCell className="text-muted-foreground">{log.ip}</TableCell>
                    <TableCell>{new Date(log.created_at).toLocaleString('es-CL')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between p-4">
              <p className="text-sm text-muted-foreground">
                Página {pagination.page} de {pagination.pages} ({pagination.total} logs)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= pagination.pages}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
