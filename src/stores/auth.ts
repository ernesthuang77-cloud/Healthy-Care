import { create } from 'zustand'
import { apiGet, apiPost } from '@/lib/api'

export type UserRole = 'customer' | 'agent' | 'admin' | 'staff'
export type UserLevel =
  | 'customer_normal'
  | 'customer_vip'
  | 'agent_2'
  | 'agent_1'
  | 'agent_general'

export interface User {
  id: string
  phone: string
  nickname: string
  role: UserRole
  level: UserLevel
  inviteCode?: string
  createdAt: string
}

interface AuthState {
  token: string
  user: User | null
  isReady: boolean
  loadFromStorage: () => void
  login: (phone: string, inviteCode?: string) => Promise<void>
  logout: () => Promise<void>
  refreshMe: () => Promise<void>
}

export const useAuth = create<AuthState>((set, get) => ({
  token: '',
  user: null,
  isReady: false,
  loadFromStorage: () => {
    const token = localStorage.getItem('yc_token') || ''
    set({ token, isReady: true })
  },
  login: async (phone: string, inviteCode?: string) => {
    const data = await apiPost<{ token: string; user: User }>('/api/auth/login', { phone, inviteCode })
    localStorage.setItem('yc_token', data.token)
    set({ token: data.token, user: data.user })
  },
  logout: async () => {
    const token = get().token
    if (token) {
      await apiPost('/api/auth/logout', {}).catch(() => null)
    }
    localStorage.removeItem('yc_token')
    set({ token: '', user: null })
  },
  refreshMe: async () => {
    const token = get().token
    if (!token) {
      set({ user: null })
      return
    }
    const user = await apiGet<User>('/api/users/me')
    set({ user })
  },
}))

