import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ArrowRight } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { apiGet, formatMoney } from '@/lib/api'
import { useCart } from '@/stores/cart'

type Sku = {
  id: string
  skuName: string
  stockQty: number
  priceCents: number
}

type Product = {
  id: string
  title: string
  subtitle: string
  coverColor: string
  coverImageUrl?: string
  minPriceCents: number
  skus: Sku[]
}

export default function Products() {
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const add = useCart((s) => s.add)

  useEffect(() => {
    setLoading(true)
    apiGet<Product[]>('/api/products')
      .then(setItems)
      .finally(() => setLoading(false))
  }, [])

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl tracking-wide">商城</h1>
          <div className="mt-1 text-sm text-white/60">按身份展示价格，结算再校验</div>
        </div>
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/10"
        >
          去购物车 <ArrowRight size={16} />
        </Link>
      </div>

      {loading ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {items.map((p) => {
            const defaultSku = p.skus[0]
            return (
              <div key={p.id} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5">
                <div
                  className="absolute -right-14 -top-14 h-48 w-48 rounded-full blur-3xl"
                  style={{ background: `${p.coverColor}55` }}
                />
                <div className="relative flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs text-white/60">起</div>
                        <div className="mt-1 font-display text-2xl">{formatMoney(p.minPriceCents)}</div>
                      </div>
                      {defaultSku ? (
                        <button
                          onClick={() => add(defaultSku.id, 1)}
                          className="inline-flex items-center gap-2 rounded-full bg-[rgb(var(--brand))] px-4 py-2 text-sm font-medium text-white hover:brightness-110"
                        >
                          <Plus size={16} />
                          加购
                        </button>
                      ) : null}
                    </div>

                    <div className="mt-4 truncate text-sm text-white/90">{p.title}</div>
                    <div className="mt-1 line-clamp-2 text-xs text-white/60">{p.subtitle}</div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {p.skus.map((s) => (
                        <span
                          key={s.id}
                          className="rounded-full border border-white/10 bg-[rgb(var(--panel-2))]/60 px-3 py-1 text-xs text-white/70"
                        >
                          {s.skuName} · {formatMoney(s.priceCents)}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5">
                      <Link to={`/products/${p.id}`} className="text-sm text-white/80 hover:text-white">
                        查看详情
                      </Link>
                    </div>
                  </div>

                  <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    {p.coverImageUrl ? (
                      <img src={p.coverImageUrl} alt={p.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full" style={{ background: `${p.coverColor}55` }} />
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppShell>
  )
}
