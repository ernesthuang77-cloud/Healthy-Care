import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, ShoppingCart } from 'lucide-react'
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
  skus: Sku[]
}

export default function ProductDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const add = useCart((s) => s.add)

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSkuId, setSelectedSkuId] = useState<string>('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    apiGet<Product>(`/api/products/${id}`)
      .then((p) => {
        setProduct(p)
        setSelectedSkuId(p.skus[0]?.id ?? '')
      })
      .finally(() => setLoading(false))
  }, [id])

  const selectedSku = useMemo(() => product?.skus.find((s) => s.id === selectedSkuId) ?? null, [product, selectedSkuId])

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
        <Link
          to="/cart"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/85 hover:bg-white/10"
        >
          <ShoppingCart size={16} />
          购物车
        </Link>
      </div>

      {loading ? (
        <div className="mt-5 h-64 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
      ) : product ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-5">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 lg:col-span-3">
            <div
              className="absolute -right-24 -top-24 h-80 w-80 rounded-full blur-3xl"
              style={{ background: `${product.coverColor}55` }}
            />
            <div className="relative">
              <div className="mb-5 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <div className="aspect-square w-full">
                  {product.coverImageUrl ? (
                    <img src={product.coverImageUrl} alt={product.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full" style={{ background: `${product.coverColor}55` }} />
                  )}
                </div>
              </div>
              <h1 className="font-display text-3xl tracking-wide">{product.title}</h1>
              <div className="mt-2 text-sm text-white/70">{product.subtitle}</div>

              <div className="mt-6 grid gap-2">
                <div className="text-xs text-white/60">规格</div>
                <div className="flex flex-wrap gap-2">
                  {product.skus.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSkuId(s.id)}
                      className={[
                        'rounded-full border px-4 py-2 text-sm transition',
                        s.id === selectedSkuId
                          ? 'border-[rgb(var(--ring))] bg-[rgb(var(--brand))]/15 text-white'
                          : 'border-white/10 bg-[rgb(var(--panel-2))]/60 text-white/80 hover:bg-white/10',
                      ].join(' ')}
                    >
                      {s.skuName}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-[rgb(var(--panel-2))]/60 p-4">
                <div className="text-xs text-white/60">当前到手价</div>
                <div className="mt-1 font-display text-3xl">{formatMoney(selectedSku?.priceCents ?? 0)}</div>
                <div className="mt-2 text-xs text-white/60">结算时由服务端再次校验价格</div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 lg:col-span-2">
            <div className="text-sm text-white/80">体验提示</div>
            <ul className="mt-3 grid gap-2 text-sm text-white/70">
              <li>建议按头皮与发丝状态选择使用频率</li>
              <li>更关注“触感与顺滑”，不追求强刺激香精</li>
              <li>坚持使用，记录变化与感受，便于复购选择</li>
            </ul>

            <div className="mt-6 grid gap-2">
              <button
                onClick={() => {
                  if (selectedSku) add(selectedSku.id, 1)
                }}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[rgb(var(--brand))] text-sm font-medium text-white hover:brightness-110"
              >
                <Plus size={16} />
                加入购物车
              </button>
              <Link
                to="/cart"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 text-sm text-white/85 hover:bg-white/10"
              >
                去结算
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">商品不存在</div>
      )}
    </AppShell>
  )
}
