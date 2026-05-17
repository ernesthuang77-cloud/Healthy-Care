import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { apiGet, formatMoney } from '@/lib/api'
import { useAuth } from '@/stores/auth'

type OrderItem = {
  id: string
  titleSnapshot: string
  skuNameSnapshot: string
  qty: number
  itemPriceCents: number
}

type OrderDetail = {
  id: string
  status: string
  totalCents: number
  createdAt: string
  addressSnapshot: {
    receiverName: string
    receiverPhone: string
    region: string
    detail: string
  }
  items: OrderItem[]
}

const statusText: Record<string, string> = {
  pending_confirm: '已提交',
  confirmed: '已确认',
  completed: '已完成',
  cancelled: '已取消',
}

export default function OrderDetail() {
  const nav = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const [data, setData] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!user) {
      nav('/login', { state: { from: `/orders/${id}` } })
      return
    }
    if (!id) return
    setLoading(true)
    apiGet<OrderDetail>(`/api/orders/${id}`)
      .then(setData)
      .catch(() => setErr('订单不存在或无权限查看'))
      .finally(() => setLoading(false))
  }, [user, id, nav])

  return (
    <AppShell>
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => nav(-1)}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/10"
        >
          <ArrowLeft size={16} />
          返回
        </button>
        <Link to="/orders" className="text-sm text-white/70 hover:text-white">
          订单列表
        </Link>
      </div>

      {loading ? (
        <div className="mt-5 h-64 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
      ) : data ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-5">
          <div className="grid gap-4 lg:col-span-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-white/90">订单号：{data.id.slice(0, 8).toUpperCase()}</div>
                <span className="rounded-full border border-white/10 bg-[rgb(var(--panel-2))]/60 px-3 py-1 text-xs text-white/70">
                  {statusText[data.status] ?? data.status}
                </span>
              </div>
              <div className="mt-3 text-xs text-white/60">{new Date(data.createdAt).toLocaleString()}</div>
              <div className="mt-4 font-display text-2xl">{formatMoney(data.totalCents)}</div>

              <div className="mt-6 border-t border-white/10 pt-5">
                <div className="text-sm text-white/80">收货信息</div>
                <div className="mt-2 text-sm text-white/70">
                  {data.addressSnapshot.receiverName} · {data.addressSnapshot.receiverPhone}
                </div>
                <div className="mt-1 text-xs text-white/60">
                  {data.addressSnapshot.region} {data.addressSnapshot.detail}
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-white/80">商品</div>
              <div className="mt-4 grid gap-3">
                {data.items.map((it) => (
                  <div key={it.id} className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm text-white/90">{it.titleSnapshot}</div>
                      <div className="mt-1 text-xs text-white/60">
                        {it.skuNameSnapshot} · {formatMoney(it.itemPriceCents)} × {it.qty}
                      </div>
                    </div>
                    <div className="text-sm text-white/80">{formatMoney(it.itemPriceCents * it.qty)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-white/80">订单状态</div>
              <div className="mt-4 rounded-2xl border border-white/10 bg-[rgb(var(--panel-2))]/60 p-4">
                <div className="text-sm text-white/90">{statusText[data.status] ?? data.status}</div>
                <div className="mt-2 text-xs text-white/60">本版本不展示物流轨迹</div>
              </div>

              {err ? <div className="mt-4 text-sm text-[rgb(var(--danger))]">{err}</div> : null}
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">订单不存在</div>
      )}
    </AppShell>
  )
}
