import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Leaf, ShieldCheck, Sparkles } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { apiGet, formatMoney } from '@/lib/api'
import { useAuth } from '@/stores/auth'
import { cn } from '@/lib/utils'
import BindAgentBanner from '@/components/BindAgentBanner'

const buildImageUrl = (prompt: string, imageSize: string) =>
  `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${encodeURIComponent(imageSize)}`

const heroSlides = [
  {
    kicker: '植萃原生 · 体验为先',
    title: '轻盈洗护',
    subtitle: '从香气、泡沫到发丝触感，把“好用”落到每一次日常。',
    imageUrl: buildImageUrl(
      'high-end monochrome fashion beauty banner, soft film grain, minimal typography space, premium skincare aesthetic, studio photography, realistic',
      'portrait_16_9',
    ),
  },
  {
    kicker: '专属价 · 绑定推荐',
    title: '价格清晰',
    subtitle: '按身份展示价格，结算再校验；新客绑定推荐码即可解锁专属价。',
    imageUrl: buildImageUrl(
      'minimal botanical background, black and white, soft light, elegant premium cosmetics advertising banner, realistic',
      'portrait_16_9',
    ),
  },
  {
    kicker: '订单闭环 · 状态可查',
    title: '下单更省心',
    subtitle: '提交订单后随时查看状态与明细，流程更简洁。',
    imageUrl: buildImageUrl(
      'premium abstract botanical texture background, dark emerald and ivory, soft gradient, high-end cosmetic advertising banner, realistic',
      'portrait_16_9',
    ),
  },
]

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
  coverImageUrl?: string
  minPriceCents: number
  skus: Sku[]
}

export default function Home() {
  const { user, isReady, loadFromStorage, refreshMe } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const heroRef = useRef<HTMLDivElement | null>(null)
  const [heroIndex, setHeroIndex] = useState(0)

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

  const onHeroScroll = () => {
    const el = heroRef.current
    if (!el) return
    const first = el.firstElementChild as HTMLElement | null
    const itemWidth = first?.offsetWidth ?? el.clientWidth
    const gap = 16
    const idx = Math.round(el.scrollLeft / (itemWidth + gap))
    const next = Math.max(0, Math.min(heroSlides.length - 1, idx))
    setHeroIndex(next)
  }

  return (
    <AppShell>
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-display text-2xl tracking-wide">御承美</div>
            <div className="mt-1 text-xs text-white/60">植萃原生 · 体验为先</div>
          </div>
          {badge ? <span className={cn('rounded-full px-3 py-1 text-xs', badge.tone)}>{badge.label}</span> : null}
        </div>

        <div
          ref={heroRef}
          onScroll={onHeroScroll}
          className="mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {heroSlides.map((s) => (
            <div
              key={s.title}
              className="relative aspect-[3/4] w-[84%] shrink-0 snap-start overflow-hidden rounded-[28px] border border-white/10 bg-white/5 sm:w-[56%]"
            >
              <img src={s.imageUrl} alt={s.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="text-xs text-white/70">{s.kicker}</div>
                <div className="mt-1 font-display text-2xl tracking-wide">{s.title}</div>
                <div className="mt-1 text-sm text-white/80">{s.subtitle}</div>
                <div className="mt-4 flex flex-wrap gap-2">
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
              </div>
            </div>
          ))}
        </div>

        <div className="mt-1 flex items-center justify-center gap-2">
          {heroSlides.map((_, i) => (
            <div
              key={i}
              className={cn('h-1.5 w-1.5 rounded-full bg-white/25 transition', i === heroIndex && 'bg-white/70')}
            />
          ))}
        </div>
      </section>

      <section className="mt-6">
        <BindAgentBanner onBound={reloadProducts} />
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <Link to="/products" className="group rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10">
          <div className="flex items-center gap-2 text-sm">
            <Leaf size={18} className="text-[rgb(var(--brand-2))]" />
            洗护推荐
          </div>
          <div className="mt-2 text-xs text-white/60">从香气与触感出发，找到更适合你的组合。</div>
        </Link>
        <Link to="/products" className="group rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10">
          <div className="flex items-center gap-2 text-sm">
            <Sparkles size={18} className="text-[rgb(var(--brand-2))]" />
            专属价权益
          </div>
          <div className="mt-2 text-xs text-white/60">按身份展示价格，绑定推荐码解锁专属价。</div>
        </Link>
        <Link
          to={user ? '/orders' : '/login'}
          state={!user ? { from: '/orders' } : undefined}
          className="group rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10"
        >
          <div className="flex items-center gap-2 text-sm">
            <ShieldCheck size={18} className="text-[rgb(var(--brand-2))]" />
            订单管理
          </div>
          <div className="mt-2 text-xs text-white/60">提交后随时查看状态与明细，流程更省心。</div>
        </Link>
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
            {products.slice(0, 4).map((p) => (
              <Link
                key={p.id}
                to={`/products/${p.id}`}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10"
              >
                <div
                  className="absolute -right-14 -top-12 h-40 w-40 rounded-full blur-2xl"
                  style={{ background: `${p.coverColor}55` }}
                />
                <div className="relative flex items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-white/60">起</div>
                    <div className="mt-1 font-display text-2xl">{formatMoney(p.minPriceCents)}</div>
                    <div className="mt-3 truncate text-sm text-white/90">{p.title}</div>
                    <div className="mt-1 line-clamp-2 text-xs text-white/60">{p.subtitle}</div>
                    <div className="mt-4 inline-flex items-center gap-2 text-xs text-white/70 group-hover:text-white">
                      查看详情 <ArrowRight size={14} />
                    </div>
                  </div>
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                    {p.coverImageUrl ? (
                      <img src={p.coverImageUrl} alt={p.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full" style={{ background: `${p.coverColor}55` }} />
                    )}
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
