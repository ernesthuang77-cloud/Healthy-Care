import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '@/components/AppShell'
import { apiGet, apiPost, formatMoney } from '@/lib/api'
import { useAuth } from '@/stores/auth'
import { useCart } from '@/stores/cart'

type Address = {
  id: string
  receiverName: string
  receiverPhone: string
  region: string
  detail: string
}

type Product = {
  id: string
  title: string
  skus: { id: string; skuName: string; priceCents: number }[]
}

export default function Checkout() {
  const nav = useNavigate()
  const { user } = useAuth()
  const cart = useCart()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [products, setProducts] = useState<Product[]>([])

  const [receiverName, setReceiverName] = useState('')
  const [receiverPhone, setReceiverPhone] = useState('')
  const [region, setRegion] = useState('')
  const [detail, setDetail] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!user) {
      nav('/login', { state: { from: '/checkout' } })
      return
    }
    setLoading(true)
    Promise.all([apiGet<Address[]>('/api/users/addresses'), apiGet<Product[]>('/api/products')])
      .then(([a, p]) => {
        setAddresses(a)
        setProducts(p)
        setSelectedAddressId(a[0]?.id ?? '')
      })
      .finally(() => setLoading(false))
  }, [user, nav])

  const skuMap = useMemo(() => {
    const m = new Map<string, { title: string; skuName: string; priceCents: number }>()
    for (const p of products) {
      for (const s of p.skus) m.set(s.id, { title: p.title, skuName: s.skuName, priceCents: s.priceCents })
    }
    return m
  }, [products])

  const lines = useMemo(() => {
    return cart.items
      .map((it) => {
        const sku = skuMap.get(it.skuId)
        if (!sku) return null
        return { ...it, ...sku, lineCents: sku.priceCents * it.qty }
      })
      .filter(Boolean)
  }, [cart.items, skuMap])

  const totalCents = useMemo(() => lines.reduce((s, x) => s + x.lineCents, 0), [lines])

  const createAddress = async () => {
    setErr('')
    if (!receiverName || !receiverPhone || !region || !detail) {
      setErr('请完整填写收货信息')
      return null
    }
    const addr = await apiPost<Address>('/api/users/addresses', { receiverName, receiverPhone, region, detail })
    setAddresses((prev) => [addr, ...prev])
    setSelectedAddressId(addr.id)
    setReceiverName('')
    setReceiverPhone('')
    setRegion('')
    setDetail('')
    return addr
  }

  const placeOrder = async () => {
    setErr('')
    if (!lines.length) {
      setErr('购物车为空')
      return
    }
    let addrId = selectedAddressId
    if (!addrId) {
      const created = await createAddress()
      if (!created) return
      addrId = created.id
    }
    setPlacing(true)
    try {
      const order = await apiPost<{ id: string }>('/api/orders', {
        addressId: addrId,
        items: cart.items,
      })
      cart.clear()
      nav(`/orders/${order.id}`)
    } catch {
      setErr('下单失败，请稍后重试')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <AppShell>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl tracking-wide">结算</h1>
          <div className="mt-1 text-sm text-white/60">分层价格已计入订单价格快照</div>
        </div>
      </div>

      {loading ? (
        <div className="mt-5 h-56 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
      ) : (
        <div className="mt-5 grid gap-4 lg:grid-cols-5">
          <div className="grid gap-4 lg:col-span-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-white/80">收货地址</div>
              {addresses.length ? (
                <div className="mt-4 grid gap-2">
                  {addresses.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAddressId(a.id)}
                      className={[
                        'rounded-2xl border p-4 text-left transition',
                        a.id === selectedAddressId
                          ? 'border-[rgb(var(--ring))] bg-[rgb(var(--brand))]/10'
                          : 'border-white/10 bg-[rgb(var(--panel-2))]/60 hover:bg-white/10',
                      ].join(' ')}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm text-white/90">
                          {a.receiverName} · {a.receiverPhone}
                        </div>
                        <div className="text-xs text-white/60">点击选择</div>
                      </div>
                      <div className="mt-2 text-xs text-white/60">
                        {a.region} {a.detail}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-3 text-sm text-white/60">暂无地址，请先新增</div>
              )}

              <div className="mt-5 grid gap-2 rounded-2xl border border-white/10 bg-[rgb(var(--panel-2))]/50 p-4">
                <div className="text-xs text-white/60">新增地址</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="h-10 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm outline-none ring-1 ring-transparent focus:ring-[rgb(var(--ring))]"
                    placeholder="收货人"
                  />
                  <input
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    className="h-10 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm outline-none ring-1 ring-transparent focus:ring-[rgb(var(--ring))]"
                    placeholder="手机号"
                    inputMode="tel"
                  />
                </div>
                <input
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="h-10 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm outline-none ring-1 ring-transparent focus:ring-[rgb(var(--ring))]"
                  placeholder="省市区"
                />
                <input
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  className="h-10 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm outline-none ring-1 ring-transparent focus:ring-[rgb(var(--ring))]"
                  placeholder="详细地址"
                />
                <button
                  onClick={() => createAddress().catch(() => setErr('新增地址失败'))}
                  className="h-10 rounded-2xl border border-white/15 bg-white/5 text-sm text-white/85 hover:bg-white/10"
                >
                  保存地址
                </button>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-white/80">订单明细</div>
              <div className="mt-4 grid gap-3">
                {lines.map((l) => (
                  <div key={l.skuId} className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-sm text-white/90">{l.title}</div>
                      <div className="mt-1 text-xs text-white/60">
                        {l.skuName} · {formatMoney(l.priceCents)} × {l.qty}
                      </div>
                    </div>
                    <div className="font-display text-lg">{formatMoney(l.lineCents)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="sticky top-20 rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="text-xs text-white/60">合计</div>
              <div className="mt-1 font-display text-3xl">{formatMoney(totalCents)}</div>
              <div className="mt-4 text-xs text-white/60">提交后可在订单中查看状态与明细</div>
              {err ? <div className="mt-3 text-sm text-[rgb(var(--danger))]">{err}</div> : null}
              <button
                onClick={() => placeOrder().catch(() => setErr('下单失败'))}
                disabled={placing}
                className="mt-5 h-11 w-full rounded-2xl bg-[rgb(var(--brand))] text-sm font-medium text-white hover:brightness-110 disabled:opacity-60"
              >
                {placing ? '提交中…' : '提交订单'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
