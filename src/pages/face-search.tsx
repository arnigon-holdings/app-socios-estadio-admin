import { useState, useRef } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScanFace, Upload, Loader2, AlertCircle, CheckCircle2, User, Images } from 'lucide-react'
import type { FaceSearchMatch, FaceSearchResponse } from '@/types'

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED_TYPES = ['image/jpeg', 'image/png']

export function FaceSearchPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [result, setResult] = useState<FaceSearchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<FaceSearchMatch | null>(null)

  const reset = () => {
    setPreview(null)
    setResult(null)
    setError(null)
    setSelectedMatch(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleFile = async (file: File) => {
    setError(null)
    setResult(null)
    setSelectedMatch(null)

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Formato no soportado. Usa JPEG o PNG.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('Imagen demasiado grande (máx 5MB).')
      return
    }

    const dataUri = await readFileAsDataUri(file)
    setPreview(dataUri)

    setIsLoading(true)
    try {
      const response = await api.searchFace<FaceSearchResponse>(dataUri)
      setResult(response)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en búsqueda facial')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ScanFace className="h-6 w-6" />
          Búsqueda Facial
        </h1>
        <p className="text-muted-foreground">
          Sube una foto para identificar al socio registrado.
        </p>
      </div>

      <Dialog open={!!selectedMatch} onOpenChange={(open) => !open && setSelectedMatch(null)}>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFile(file)
                  }}
                />

                {!preview ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-secondary/30 px-6 py-10 transition-colors hover:bg-secondary/60 disabled:opacity-50"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Upload className="h-6 w-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Subir imagen</p>
                      <p className="text-xs text-muted-foreground">JPEG o PNG · máx 5MB</p>
                    </div>
                  </button>
                ) : (
                  <div className="space-y-4">
                    <div className="relative aspect-square w-full overflow-hidden rounded-xl border bg-muted">
                      <img
                        src={preview}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                      {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <Loader2 className="h-8 w-8 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex justify-center gap-2">
                      <Button variant="outline" onClick={reset} disabled={isLoading}>
                        Limpiar
                      </Button>
                      <Button onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                        Cambiar imagen
                      </Button>
                    </div>
                  </div>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </aside>

          <section>
            {!result && !isLoading && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center text-muted-foreground">
                  <ScanFace className="h-10 w-10 opacity-30" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      Esperando imagen de consulta
                    </p>
                    <p className="text-xs">
                      Sube una foto en el panel izquierdo para buscar coincidencias.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {isLoading && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Buscando coincidencias…
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {[0, 1].map((i) => (
                    <Card key={i}>
                      <CardContent className="flex gap-4 p-4">
                        <Skeleton className="h-32 w-32 flex-shrink-0 rounded-lg" />
                        <div className="flex min-w-0 flex-1 flex-col gap-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1 space-y-1.5">
                              <Skeleton className="h-2.5 w-8" />
                              <Skeleton className="h-5 w-3/5" />
                            </div>
                            <div className="space-y-1.5 text-right">
                              <Skeleton className="ml-auto h-2.5 w-16" />
                              <Skeleton className="ml-auto h-7 w-14" />
                              <Skeleton className="ml-auto h-5 w-16 rounded-full" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <Skeleton className="h-2.5 w-14" />
                            <Skeleton className="h-4 w-2/5" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {result && !isLoading && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {result.matches.length > 0 ? (
                      <>
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        {result.matches.length} coincidencia{result.matches.length === 1 ? '' : 's'}
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-muted-foreground" />
                        Sin coincidencias
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {result.matches.length === 0 ? (
                    <div className="space-y-2 text-sm">
                      <p className="text-muted-foreground">
                        No se encontraron socios con rostro similar.
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        El socio puede no haber completado el registro facial aún.
                        Verifica en <span className="font-mono">Usuarios</span> que tenga <code>indexed_at</code> poblado.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {result.matches.map((match) => {
                        const pct = Math.round(match.confidence)
                        const band = confidenceBand(pct)
                        const firstPhoto = match.photo_urls[0]
                        return (
                          <button
                            type="button"
                            key={match.user_id}
                            onClick={() => setSelectedMatch(match)}
                            className="flex gap-4 rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent/30 focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <div className="h-32 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                              {firstPhoto ? (
                                <img
                                  src={firstPhoto}
                                  alt={`Foto de ${match.rut}`}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                  <User className="h-8 w-8" />
                                </div>
                              )}
                            </div>

                            <div className="flex min-w-0 flex-1 flex-col gap-3">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 space-y-1">
                                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                    RUT
                                  </p>
                                  <p className="truncate font-mono text-base font-semibold">
                                    {match.rut}
                                  </p>
                                </div>
                                <div className="space-y-1.5 text-right">
                                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                    Coincidencia
                                  </p>
                                  <p className="font-mono text-2xl font-bold tabular-nums">
                                    {pct}%
                                  </p>
                                  <div className="flex justify-end">
                                    <Badge variant={band.variant}>{band.label}</Badge>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                                  Teléfono
                                </p>
                                <p className="font-mono text-sm text-muted-foreground">
                                  {match.phone}
                                </p>
                              </div>

                              <div className="mt-auto flex items-center gap-2">
                                <Badge variant="outline" className="gap-1">
                                  <Images className="h-3 w-3" />
                                  {match.faces_count} cara{match.faces_count === 1 ? '' : 's'} indexada{match.faces_count === 1 ? '' : 's'}
                                </Badge>
                              </div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </section>
        </div>

        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedMatch?.rut} — {selectedMatch?.faces_count} caras encontradas
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3">
            {selectedMatch?.photo_urls.map((url, i) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
                <img
                  src={url}
                  alt={`Cara ${i + 1} de ${selectedMatch.rut}`}
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function confidenceBand(pct: number): { label: string; variant: 'success' | 'warning' | 'destructive' } {
  if (pct >= 98) return { label: 'Muy alta', variant: 'success' }
  if (pct >= 95) return { label: 'Alta', variant: 'success' }
  if (pct >= 85) return { label: 'Media', variant: 'warning' }
  if (pct >= 70) return { label: 'Baja', variant: 'warning' }
  return { label: 'Muy baja', variant: 'destructive' }
}

function readFileAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('No se pudo leer la imagen'))
    reader.readAsDataURL(file)
  })
}
