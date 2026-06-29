import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Search, ChevronLeft, ChevronRight, Eye, Trash2, Loader2, CheckCircle, XCircle, ScanFace } from 'lucide-react'
import type { User, Pagination, FaceRecord } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

const STATUS_LABELS: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' }> = {
  pending_verification: { label: 'Pendiente', variant: 'warning' },
  verified: { label: 'Verificado', variant: 'success' },
  rejected: { label: 'Rechazado', variant: 'destructive' },
}

export function UsersPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [rutFilter, setRutFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [deleteUser, setDeleteUser] = useState<User | null>(null)

  const { data, isLoading } = useQuery<{ users: User[]; pagination: Pagination }>({
    queryKey: ['users', page, rutFilter],
    queryFn: () =>
      api.get('/api/v1/admin/users', {
        params: { page, per_page: 20, rut: rutFilter || undefined },
      }),
  })

  const deleteMutation = useMutation({
    mutationFn: (userId: number) => api.delete(`/api/v1/admin/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setDeleteUser(null)
    },
  })

  const verifyMutation = useMutation({
    mutationFn: ({ userId, status }: { userId: number; status: string }) =>
      api.patch(`/api/v1/admin/users/${userId}`, { user: { registration_status: status } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setSelectedUser(null)
    },
  })

  const faceRecordsQuery = useQuery<{ face_records: FaceRecord[] }>({
    queryKey: ['face-records', selectedUser?.id],
    queryFn: () => api.get(`/api/v1/admin/users/${selectedUser!.id}/face_records`),
    enabled: !!selectedUser,
  })

  const users = data?.users ?? []
  const pagination = data?.pagination

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
        <p className="text-muted-foreground">Gestiona los usuarios registrados</p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por RUT..."
                value={rutFilter}
                onChange={(e) => {
                  setRutFilter(e.target.value)
                  setPage(1)
                }}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Foto</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>RUT</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Equipos</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <img
                        src={`${API_BASE_URL}${user.photo_url}`}
                        alt="Foto"
                        className="h-10 w-10 rounded-full object-cover bg-muted"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + user.rut + '&background=random'
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{user.id}</TableCell>
                    <TableCell>{user.rut}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_LABELS[user.registration_status]?.variant || 'secondary'}>
                        {STATUS_LABELS[user.registration_status]?.label || user.registration_status}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.teams_ids?.length ?? 0}</TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString('es-CL')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteUser(user)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Página {pagination.page} de {pagination.pages} ({pagination.total} usuarios)
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

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle de Usuario</DialogTitle>
            <DialogDescription>Información del usuario registrado</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <img
                  src={`${API_BASE_URL}${selectedUser.photo_url}`}
                  alt="Foto"
                  className="h-32 w-32 rounded-xl object-cover bg-muted"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=' + selectedUser.rut + '&background=random&size=128'
                  }}
                />
                <div className="space-y-2">
                  <div>
                    <Label className="text-muted-foreground">Estado de registro</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={STATUS_LABELS[selectedUser.registration_status]?.variant || 'secondary'} className="text-sm">
                        {STATUS_LABELS[selectedUser.registration_status]?.label || selectedUser.registration_status}
                      </Badge>
                      {selectedUser.points_balance !== undefined && (
                        <span className="text-sm font-medium">
                          • {selectedUser.points_balance} puntos
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {selectedUser.registration_status !== 'verified' && (
                      <Button
                        size="sm"
                        onClick={() => verifyMutation.mutate({ userId: selectedUser.id, status: 'verified' })}
                        disabled={verifyMutation.isPending}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Verificar
                      </Button>
                    )}
                    {selectedUser.registration_status !== 'rejected' && selectedUser.registration_status !== 'verified' && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => verifyMutation.mutate({ userId: selectedUser.id, status: 'rejected' })}
                        disabled={verifyMutation.isPending}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Rechazar
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-muted-foreground">ID</Label>
                  <p className="font-medium">{selectedUser.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">RUT</Label>
                  <p className="font-medium">{selectedUser.rut}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Teléfono</Label>
                  <p className="font-medium">{selectedUser.phone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Verificación biométrica</Label>
                  <p className="font-medium capitalize">{selectedUser.biometric_status || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha de registro</Label>
                  <p className="font-medium">
                    {new Date(selectedUser.created_at).toLocaleString('es-CL')}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Código de referido</Label>
                  <p className="font-medium">{selectedUser.referral_code || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Equipos seleccionados</Label>
                  <p className="font-medium">{selectedUser.teams_ids?.length ?? 0}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Mes de nacimiento</Label>
                  <p className="font-medium">{selectedUser.birth_month}/{selectedUser.birth_year}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <ScanFace className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-muted-foreground">Caras registradas</Label>
                  {faceRecordsQuery.data && (
                    <Badge variant="secondary" className="text-xs">
                      {faceRecordsQuery.data.face_records.length}
                    </Badge>
                  )}
                </div>
                {faceRecordsQuery.isLoading ? (
                  <div className="grid grid-cols-3 gap-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="aspect-square w-full rounded-lg" />
                    ))}
                  </div>
                ) : faceRecordsQuery.data?.face_records.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg border-dashed">
                    Sin caras indexadas
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {faceRecordsQuery.data?.face_records.map((face) => (
                      <a
                        key={face.id}
                        href={face.photo_url || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative block aspect-square overflow-hidden rounded-lg border bg-muted"
                      >
                        {face.photo_url ? (
                          <img
                            src={face.photo_url}
                            alt={`Cara ${face.face_type ?? 'registrada'}`}
                            className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                            Sin imagen
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
                          <p className="text-xs font-medium text-white capitalize">
                            {face.face_type ?? 'referencia'}
                          </p>
                          <p className="text-[10px] text-white/80">
                            {new Date(face.indexed_at).toLocaleDateString('es-CL')}
                          </p>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Usuario</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar al usuario {deleteUser?.rut}? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUser(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteUser && deleteMutation.mutate(deleteUser.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
