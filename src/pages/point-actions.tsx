import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Pencil, Trash2, Loader2, Zap } from 'lucide-react'
import type { PointAction } from '@/types'

interface PointActionForm {
  action_key: string
  description: string
  points: number
  active: boolean
}

const emptyForm: PointActionForm = { action_key: '', description: '', points: 0, active: true }

export function PointActionsPage() {
  const queryClient = useQueryClient()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAction, setEditingAction] = useState<PointAction | null>(null)
  const [deleteAction, setDeleteAction] = useState<PointAction | null>(null)
  const [form, setForm] = useState<PointActionForm>(emptyForm)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery<{ point_actions: PointAction[] }>({
    queryKey: ['point-actions'],
    queryFn: () => api.get('/api/v1/admin/point_actions'),
  })

  const pointActions = data?.point_actions ?? []

  const createMutation = useMutation({
    mutationFn: (action: PointActionForm) =>
      api.post<{ point_action: PointAction }>('/api/v1/admin/point_actions', { point_action: action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['point-actions'] })
      closeDialog()
    },
    onError: (err: Error) => setError(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: PointActionForm }) =>
      api.patch<{ point_action: PointAction }>(`/api/v1/admin/point_actions/${id}`, { point_action: action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['point-actions'] })
      closeDialog()
    },
    onError: (err: Error) => setError(err.message),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/v1/admin/point_actions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['point-actions'] })
      setDeleteAction(null)
    },
  })

  const openCreate = () => {
    setForm(emptyForm)
    setEditingAction(null)
    setError('')
    setIsDialogOpen(true)
  }

  const openEdit = (action: PointAction) => {
    setForm({
      action_key: action.action_key,
      description: action.description,
      points: action.points,
      active: action.active,
    })
    setEditingAction(action)
    setError('')
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingAction(null)
    setForm(emptyForm)
    setError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingAction) {
      updateMutation.mutate({ id: editingAction.id, action: form })
    } else {
      createMutation.mutate(form)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Acciones de Puntos</h1>
          <p className="text-muted-foreground">Configura las acciones que otorgan puntos</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Acción
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Clave</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Puntos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : pointActions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay acciones configuradas
                  </TableCell>
                </TableRow>
              ) : (
                pointActions.map((action) => (
                  <TableRow key={action.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        <code className="text-sm">{action.action_key}</code>
                      </div>
                    </TableCell>
                    <TableCell>{action.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{action.points} pts</Badge>
                    </TableCell>
                    <TableCell>
                      {action.active ? (
                        <Badge variant="success">Activa</Badge>
                      ) : (
                        <Badge variant="secondary">Inactiva</Badge>
                      )}
                    </TableCell>
                    <TableCell>{new Date(action.created_at).toLocaleDateString('es-CL')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(action)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteAction(action)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAction ? 'Editar Acción' : 'Nueva Acción'}</DialogTitle>
            <DialogDescription>
              {editingAction
                ? 'Modifica los datos de la acción'
                : 'Ingresa los datos de la nueva acción de puntos'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="action_key">Clave</Label>
              <Input
                id="action_key"
                value={form.action_key}
                onChange={(e) => setForm({ ...form, action_key: e.target.value })}
                placeholder="registration"
                required
                disabled={!!editingAction}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Registro completado"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">Puntos</Label>
              <Input
                id="points"
                type="number"
                min="0"
                value={form.points}
                onChange={(e) => setForm({ ...form, points: parseInt(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="rounded border-input"
              />
              <Label htmlFor="active">Acción activa</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingAction ? 'Guardar Cambios' : 'Crear Acción'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteAction} onOpenChange={() => setDeleteAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Acción</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar la acción "{deleteAction?.description}"? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteAction(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteAction && deleteMutation.mutate(deleteAction.id)}
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
