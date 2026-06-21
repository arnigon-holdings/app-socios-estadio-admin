export interface Admin {
  id: number
  email: string
  role: string
}

export interface User {
  id: number
  rut: string
  phone: string
  birth_month: number
  birth_year: number
  teams_ids: number[]
  photo_url: string
  referral_code: string
  created_at: string
  consents?: Record<string, boolean>
  metadata?: Record<string, unknown>
  points_balance?: number
  updated_at?: string
  phone_verified?: boolean
}

export interface Team {
  id: number
  name: string
  short_name: string
  logo_url: string | null
  active: boolean
  created_at: string
}

export interface PointAction {
  id: number
  action_key: string
  description: string
  points: number
  active: boolean
  created_at: string
}

export interface PointTransaction {
  id: number
  user_id: number
  point_action_id: number
  amount: number
  reference_id: string | null
  metadata: Record<string, unknown>
  created_at: string
  user?: User
  point_action?: PointAction
}

export interface AuditLog {
  id: number
  admin_id: number
  action: string
  resource_type: string
  resource_id: number | null
  metadata: Record<string, unknown>
  ip: string
  created_at: string
  admin?: Admin
}

export interface DashboardStats {
  users_total: number
  users_today: number
  users_this_week: number
  teams_total: number
  teams_active: number
  point_actions_total: number
  point_actions_active: number
}

export interface Pagination {
  page: number
  per_page: number
  total: number
  pages: number
}

export interface ApiError {
  error: string | string[]
}
