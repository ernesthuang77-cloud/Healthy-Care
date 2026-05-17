import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2 } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { apiGet, formatMoney } from '@/lib/api'
import { useAuth } from '@/stores/auth'
import { useCart } from '@/stores/cart'

type Sku = {
  id: string
  skuName: string
  priceCents: number
}

type Product = {
  id: string
  title: string
  skus: Sku[]
}

export default function Cart() {
  const nav = useNavigate()
  const { user } = useAuth()
  const { items, setQty, remove } = useCart()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    apiGet<Product[]>('/api/products')
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [])

  const skuMap = useMemo(() => {
    const m = new Map<string, { title: string; skuName: string; priceCents: number }>()
    for (const p of products) {
      for (const s of p.skus) {
        m.set(s.id, { title: p.title, skuName: s.skuName, priceCents: s.priceCents })
      }
    }
    return m
  }, [products])

  const lines = useMemo(() => {
    return items
      .map((it) => {
        const sku = skuMap.get(it.skuId)
        if (!sku) return null
        return {
          skuId: it.skuId,
          qty: it.qty,
          ...sku,
          lineCents: sku.priceCents * it.qty,
        }
      })
      .filter(Boolean)
  }, [items, skuMap])

  const totalCents = useMemo(() => lines.reduce((s, x) => s + x.lineCents, 0), [lines])

  return (
    <AppShell>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl tracking-wide">购物车</h1>
          <div className="mt-1 text-sm text-white/60">确认商品与数量后进入结算</div>
        </div>
        <Link to="/products" className="text-sm text-white/70 hover:text-white">
          继续逛逛
        </Link>
      </div>

      {loading ? (
        <div className="mt-5 h-40 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
      ) : lines.length ? (
        <div className="mt-5 grid gap-3">
          {lines.map((l) => (
            <div key={l.skuId} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm text-white/90">{l.title}</div>
                  <div className="mt-1 text-xs text-white/60">
                    {l.skuName} · {formatMoney(l.priceCents)}
                  </div>
                </div>
                <button
                  onClick={() => remove(l.skuId)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 hover:bg-white/10"
                >
                  <Trash2 size={14} />
                  移除
                </button>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[rgb(var(--panel-2))]/60 p-1">
                  <button
                    onClick={() => setQty(l.skuId, Math.max(1, l.qty - 1))}
                    className="grid h-8 w-8 place-items-center rounded-full text-white/80 hover:bg-white/10"
                  >
                    <Minus size={16} />
                  </button>
                  <div className="min-w-10 text-center text-sm">{l.qty}</div>
                  <button
                    onClick={() => setQty(l.skuId, l.qty + 1)}
                    className="grid h-8 w-8 place-items-center rounded-full text-white/80 hover:bg-white/10"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <div className="font-display text-lg">{formatMoney(l.lineCents)}</div>
              </div>
            </div>
          ))}

          <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs text-white/60">合计</div>
                <div className="mt-1 font-display text-2xl">{formatMoney(totalCents)}</div>
              </div>
              <button
                onClick={() => {
                  if (!user) {
                    nav('/login', { state: { from: '/checkout' } })
                    return
                  }
                  nav('/checkout')
                }}
                className="h-11 rounded-2xl bg-[rgb(var(--brand))] px-6 text-sm font-medium text-white hover:brightness-110"
              >
                去结算
              </button>
            </div>
            {!user ? <div className="mt-3 text-xs text-white/60">结算前需要登录</div> : null}
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
          购物车还是空的
        </div>
      )}
    </AppShell>
  )
}
