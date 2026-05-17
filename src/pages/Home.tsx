import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Leaf, ShieldCheck, Sparkles } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { apiGet, formatMoney } from '@/lib/api'
import { useAuth } from '@/stores/auth'
import { cn } from '@/lib/utils'
import BindAgentBanner from '@/components/BindAgentBanner'

type Sku = {
  id: string
  skuName: string
  stockQty: number
  publicPriceCents: number
  priceCents: number
}

type Product = {
  id: string
  title: string
  subtitle: string
  coverColor: string
  minPriceCents: number
  skus: Sku[]
}

export default function Home() {
  const { user, isReady, loadFromStorage, refreshMe } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  useEffect(() => {
    if (!isReady) return
    refreshMe().catch(() => null)
  }, [isReady, refreshMe])

  useEffect(() => {
    setLoading(true)
    apiGet<Product[]>('/api/products')
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [])

  const reloadProducts = () => {
    setLoading(true)
    apiGet<Product[]>('/api/products')
      .then(setProducts)
      .finally(() => setLoading(false))
  }

  const badge = useMemo(() => {
    if (!user) return null
    if (user.role === 'admin') return { label: '管理员', tone: 'bg-[rgb(var(--brand-2))]/15 text-[rgb(var(--brand-2))]' }
    if (user.role === 'agent') return { label: '代理身份', tone: 'bg-white/10 text-white/80' }
    if (user.level === 'customer_vip') return { label: 'VIP', tone: 'bg-[rgb(var(--brand-2))]/15 text-[rgb(var(--brand-2))]' }
    return { label: '普通客户', tone: 'bg-white/10 text-white/80' }
  }, [user])

  return (
    <AppShell>
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-6">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[rgb(var(--brand))]/20 blur-3xl" />
        <div className="absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-[rgb(var(--brand-2))]/15 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-display text-2xl tracking-wide">御承美</span>
              <span className="text-xs text-white/60">植萃原生 · 体验为先</span>
            </div>
            {badge ? <span className={cn('rounded-full px-3 py-1 text-xs', badge.tone)}>{badge.label}</span> : null}
          </div>

          <h1 className="mt-4 font-display text-3xl leading-tight tracking-wide sm:text-4xl">
            植萃原生
            <span className="block text-white/70">日常洗护的细腻质感</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/70">
            从香气、泡沫到发丝触感，用克制的配方语言，把“好用”落到每一次使用体验里。
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 rounded-full bg-[rgb(var(--brand))] px-5 py-2.5 text-sm font-medium text-white hover:brightness-110"
            >
              进入商城 <ArrowRight size={16} />
            </Link>
            <Link
              to={user ? '/orders' : '/login'}
              state={!user ? { from: '/orders' } : undefined}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm text-white/85 hover:bg-white/10"
            >
              查看订单
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-[rgb(var(--panel-2))]/60 p-4">
              <div className="flex items-center gap-2 text-sm">
                <Leaf size={18} className="text-[rgb(var(--brand-2))]" />
                草本原生气息
              </div>
              <div className="mt-2 text-xs text-white/60">从香气到触感，保持克制与真实。</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[rgb(var(--panel-2))]/60 p-4">
              <div className="flex items-center gap-2 text-sm">
                <Sparkles size={18} className="text-[rgb(var(--brand-2))]" />
                官方正价与专属价
              </div>
              <div className="mt-2 text-xs text-white/60">按身份展示价格，结算再校验，清晰不困扰。</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[rgb(var(--panel-2))]/60 p-4">
              <div className="flex items-center gap-2 text-sm">
                <ShieldCheck size={18} className="text-[rgb(var(--brand-2))]" />
                订单闭环
              </div>
              <div className="mt-2 text-xs text-white/60">下单、订单管理与权益说明一体化呈现。</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <BindAgentBanner onBound={reloadProducts} />
      </section>

      <section className="mt-10">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-xl tracking-wide">当前热卖</h2>
          <Link to="/products" className="text-sm text-white/70 hover:text-white">
            查看全部
          </Link>
        </div>

        {loading ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
            ))}
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {products.slice(0, 2).map((p) => (
              <Link
                key={p.id}
                to={`/products/${p.id}`}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10"
              >
                <div
                  className="absolute -right-14 -top-12 h-40 w-40 rounded-full blur-2xl"
                  style={{ background: `${p.coverColor}55` }}
                />
                <div className="relative">
                  <div className="text-xs text-white/60">起</div>
                  <div className="mt-1 font-display text-2xl">{formatMoney(p.minPriceCents)}</div>
                  <div className="mt-3 text-sm text-white/90">{p.title}</div>
                  <div className="mt-1 text-xs text-white/60">{p.subtitle}</div>
                  <div className="mt-4 inline-flex items-center gap-2 text-xs text-white/70 group-hover:text-white">
                    查看详情 <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  )
}
