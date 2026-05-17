import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AppShell from '@/components/AppShell'
import { apiGet, formatMoney } from '@/lib/api'
import { useAuth } from '@/stores/auth'

type Order = {
  id: string
  status: string
  totalCents: number
  createdAt: string
}

const statusText: Record<string, string> = {
  pending_confirm: '已提交',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消',
}

export default function Orders() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [items, setItems] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      nav('/login', { state: { from: '/orders' } })
      return
    }
    setLoading(true)
    apiGet<Order[]>('/api/orders')
      .then(setItems)
      .finally(() => setLoading(false))
  }, [user, nav])

  const emptyText = useMemo(() => (user?.role === 'admin' ? '暂无订单（管理员视角）' : '暂无订单'), [user])

  return (
    <AppShell>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl tracking-wide">订单</h1>
          <div className="mt-1 text-sm text-white/60">查看订单状态与购买明细</div>
        </div>
        <Link to="/products" className="text-sm text-white/70 hover:text-white">
          去购物
        </Link>
      </div>

      {loading ? (
        <div className="mt-5 h-40 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
      ) : items.length ? (
        <div className="mt-5 grid gap-3">
          {items.map((o) => (
            <Link key={o.id} to={`/orders/${o.id}`} className="rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-white/90">订单号：{o.id.slice(0, 8).toUpperCase()}</div>
                <span className="rounded-full border border-white/10 bg-[rgb(var(--panel-2))]/60 px-3 py-1 text-xs text-white/70">
                  {statusText[o.status] ?? o.status}
                </span>
              </div>
              <div className="mt-3 flex items-end justify-between gap-4">
                <div className="text-xs text-white/60">{new Date(o.createdAt).toLocaleString()}</div>
                <div className="font-display text-xl">{formatMoney(o.totalCents)}</div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">{emptyText}</div>
      )}
    </AppShell>
  )
}
