import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '@/components/AppShell'
import { apiGet, apiPatch, formatMoney } from '@/lib/api'
import { useAuth, type UserLevel, type UserRole } from '@/stores/auth'
import { cn } from '@/lib/utils'

type AdminUser = {
  id: string
  phone: string
  nickname: string
  role: UserRole
  level: UserLevel
  inviteCode?: string
  createdAt: string
}

type AdminOrder = {
  id: string
  status: string
  totalCents: number
  createdAt: string
  itemCount: number
  buyer: { id: string; nickname: string; phone: string } | null
}

type PriceRow = {
  id: string
  skuId: string
  role: UserRole
  level: UserLevel
  priceCents: number
  sku: { id: string; skuName: string; publicPriceCents: number } | null
  product: { id: string; title: string } | null
}

const tabs = [
  { key: 'users', label: '用户' },
  { key: 'orders', label: '订单' },
  { key: 'prices', label: '价格' },
] as const

const roles: UserRole[] = ['customer', 'agent', 'staff', 'admin']
const levels: UserLevel[] = ['customer_normal', 'customer_vip', 'agent_2', 'agent_1', 'agent_general']

const levelText: Record<UserLevel, string> = {
  customer_normal: '普通客户',
  customer_vip: 'VIP客户',
  agent_2: '二级代理',
  agent_1: '一级代理',
  agent_general: '总代',
}

const roleText: Record<UserRole, string> = {
  customer: '客户',
  agent: '代理',
  staff: '仓配/客服',
  admin: '管理员',
}

const orderStatusText: Record<string, string> = {
  pending_confirm: '已提交',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消',
}

const nextStatusOptions: Record<string, string[]> = {
  pending_confirm: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

export default function Admin() {
  const nav = useNavigate()
  const { user } = useAuth()

  const [tab, setTab] = useState<(typeof tabs)[number]['key']>('users')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [prices, setPrices] = useState<PriceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!user) {
      nav('/login', { state: { from: '/admin' } })
      return
    }
    if (user.role !== 'admin' && user.role !== 'staff') {
      nav('/me', { replace: true })
      return
    }
    setLoading(true)
    Promise.all([apiGet<AdminUser[]>('/api/admin/users'), apiGet<AdminOrder[]>('/api/admin/orders'), apiGet<PriceRow[]>('/api/admin/prices')])
      .then(([u, o, p]) => {
        setUsers(u)
        setOrders(o)
        setPrices(p)
      })
      .catch(() => setErr('加载失败'))
      .finally(() => setLoading(false))
  }, [user, nav])


  const updateUser = async (u: AdminUser, patch: Partial<Pick<AdminUser, 'role' | 'level' | 'nickname' | 'inviteCode'>>) => {
    const next = await apiPatch<AdminUser>(`/api/admin/users/${u.id}/role`, patch)
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, ...next } : x)))
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    const next = await apiPatch<AdminOrder>(`/api/admin/orders/${orderId}/status`, { status })
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: next.status } : o)))
  }

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl tracking-wide">管理后台</h1>
          <div className="mt-1 text-sm text-white/60">用户 / 价格 / 订单（MVP）</div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10',
              tab === t.key && 'border-[rgb(var(--ring))] bg-[rgb(var(--brand))]/10 text-white',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {err ? <div className="mt-4 text-sm text-[rgb(var(--danger))]">{err}</div> : null}

      {loading ? (
        <div className="mt-5 h-64 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
      ) : tab === 'users' ? (
        <div className="mt-5 grid gap-3">
          {users.map((u) => (
            <div key={u.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="font-display text-xl">{u.nickname}</div>
                  <div className="mt-1 text-sm text-white/60">{u.phone}</div>
                  {u.inviteCode ? <div className="mt-2 text-xs text-white/60">推荐码：{u.inviteCode}</div> : null}
                </div>
                <div className="grid gap-2">
                  <select
                    value={u.role}
                    onChange={(e) => updateUser(u, { role: e.target.value as UserRole }).catch(() => setErr('更新失败'))}
                    className="h-10 rounded-2xl border border-white/10 bg-[rgb(var(--panel-2))]/60 px-3 text-sm text-white/85 outline-none"
                  >
                    {roles.map((r) => (
                      <option key={r} value={r} className="bg-[rgb(var(--panel))]">
                        {roleText[r]}
                      </option>
                    ))}
                  </select>
                  <select
                    value={u.level}
                    onChange={(e) => updateUser(u, { level: e.target.value as UserLevel }).catch(() => setErr('更新失败'))}
                    className="h-10 rounded-2xl border border-white/10 bg-[rgb(var(--panel-2))]/60 px-3 text-sm text-white/85 outline-none"
                  >
                    {levels.map((l) => (
                      <option key={l} value={l} className="bg-[rgb(var(--panel))]">
                        {levelText[l]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : tab === 'orders' ? (
        <div className="mt-5 grid gap-3">
          {orders.map((o) => (
            <div key={o.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-white/85">订单：{o.id.slice(0, 8).toUpperCase()}</div>
                  <div className="mt-1 text-xs text-white/60">{new Date(o.createdAt).toLocaleString()}</div>
                  <div className="mt-2 text-xs text-white/60">
                    买家：{o.buyer ? `${o.buyer.nickname}（${o.buyer.phone}）` : '—'} · 件数：{o.itemCount}
                  </div>
                  <div className="mt-2 text-xs text-white/60">状态：{orderStatusText[o.status] ?? o.status}</div>
                </div>
                <div className="text-right">
                  <div className="font-display text-2xl">{formatMoney(o.totalCents)}</div>
                  <div className="mt-3 flex items-center justify-end gap-2">
                    <select
                      value=""
                      onChange={(e) => {
                        const v = e.target.value
                        if (!v) return
                        updateOrderStatus(o.id, v).catch(() => setErr('更新失败'))
                      }}
                      className="h-9 rounded-2xl border border-white/10 bg-[rgb(var(--panel-2))]/60 px-3 text-xs text-white/85 outline-none"
                      disabled={!(nextStatusOptions[o.status] ?? []).length}
                    >
                      <option value="" className="bg-[rgb(var(--panel))]">
                        {nextStatusOptions[o.status]?.length ? '修改状态' : '不可修改'}
                      </option>
                      {(nextStatusOptions[o.status] ?? []).map((s) => (
                        <option key={s} value={s} className="bg-[rgb(var(--panel))]">
                          {orderStatusText[s] ?? s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {prices.map((p) => (
            <div key={p.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-sm text-white/90">{p.product?.title ?? '—'}</div>
                  <div className="mt-1 text-xs text-white/60">
                    {p.sku?.skuName ?? p.skuId} · {roleText[p.role]} · {levelText[p.level]}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-display text-xl">{formatMoney(p.priceCents)}</div>
                  <div className="mt-1 text-xs text-white/60">公开价：{formatMoney(p.sku?.publicPriceCents ?? 0)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}
