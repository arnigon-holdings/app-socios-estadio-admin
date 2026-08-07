const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
const FACE_SEARCH_URL = import.meta.env.VITE_FACE_SEARCH_URL || 'http://localhost:8081'
const FACE_SEARCH_TOKEN = import.meta.env.VITE_FACE_SEARCH_TOKEN || ''
export const isLocalBackend =
  !API_BASE_URL ||
  API_BASE_URL.includes('localhost') ||
  (API_BASE_URL.includes('://') && !API_BASE_URL.split('://')[1].includes('.'))
const isLocalFaceSearch =
  !FACE_SEARCH_URL ||
  FACE_SEARCH_URL.includes('localhost') ||
  (FACE_SEARCH_URL.includes('://') && !FACE_SEARCH_URL.split('://')[1].includes('.'))

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | undefined>
}

async function fetchApi<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options

  const base = isLocalBackend ? '' : API_BASE_URL
  let url = `${base}${endpoint}`

  if (params) {
    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value))
      }
    })
    const queryString = searchParams.toString()
    if (queryString) {
      url += `?${queryString}`
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(Array.isArray(error.error) ? error.error.join(', ') : error.error)
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

async function searchFaceRequest(imageBase64: string): Promise<unknown> {
  if (!FACE_SEARCH_TOKEN) {
    throw new Error('VITE_FACE_SEARCH_TOKEN no configurado')
  }

  const image = imageBase64.startsWith('data:')
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`

  const base = isLocalFaceSearch ? '' : FACE_SEARCH_URL
  const response = await fetch(`${base}/search-face`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FACE_SEARCH_TOKEN}`,
    },
    body: JSON.stringify({ image }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Face search failed' }))
    throw new Error(Array.isArray(error.error) ? error.error.join(', ') : error.error)
  }

  return response.json()
}

export const api = {
  get: <T>(endpoint: string, options?: FetchOptions) =>
    fetchApi<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, options?: FetchOptions) =>
    fetchApi<T>(endpoint, { ...options, method: 'POST', body: JSON.stringify(data) }),

  patch: <T>(endpoint: string, data?: unknown, options?: FetchOptions) =>
    fetchApi<T>(endpoint, { ...options, method: 'PATCH', body: JSON.stringify(data) }),

  delete: <T>(endpoint: string, options?: FetchOptions) =>
    fetchApi<T>(endpoint, { ...options, method: 'DELETE' }),

  searchFace: <T = unknown>(imageBase64: string) => searchFaceRequest(imageBase64) as Promise<T>,
}
