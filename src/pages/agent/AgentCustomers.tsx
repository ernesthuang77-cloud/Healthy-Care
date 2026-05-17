import { useEffect, useState } from 'react'
import { apiGet, formatMoney } from '@/lib/api'

type CustomerRow = {
  referral: { boundAt: string; bindType: string }
  customer: { id: string; nickname: string; phone: string; level: string; createdAt: string }
  stats: { orderCount: number; totalCents: number; lastOrderAt: string | null }
}

export default function AgentCustomers() {
  const [items, setItems] = useState<CustomerRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    apiGet<CustomerRow[]>('/api/agent/customers')
      .then(setItems)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="h-56 animate-pulse rounded-3xl border border-white/10 bg-white/5" />

  if (!items.length) {
    return <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">暂无归属客户</div>
  }

  return (
    <div className="grid gap-3">
      {items.map((row) => (
        <div key={row.customer.id} className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="font-display text-xl">{row.customer.nickname}</div>
              <div className="mt-1 text-sm text-white/60">{row.customer.phone}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/60">累计购买</div>
              <div className="mt-1 font-display text-2xl">{formatMoney(row.stats.totalCents)}</div>
            </div>
          </div>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[rgb(var(--panel-2))]/60 p-4">
              <div className="text-xs text-white/60">订单数</div>
              <div className="mt-1 font-display text-xl">{row.stats.orderCount}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[rgb(var(--panel-2))]/60 p-4">
              <div className="text-xs text-white/60">最近下单</div>
              <div className="mt-1 text-sm text-white/80">
                {row.stats.lastOrderAt ? new Date(row.stats.lastOrderAt).toLocaleString() : '—'}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[rgb(var(--panel-2))]/60 p-4">
              <div className="text-xs text-white/60">绑定时间</div>
              <div className="mt-1 text-sm text-white/80">{new Date(row.referral.boundAt).toLocaleString()}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

