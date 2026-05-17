import { useEffect, useState } from 'react'
import { apiGet, formatMoney } from '@/lib/api'

type Overview = {
  inviteCode: string
  customerCount: number
  orderCount: number
  orderTotalCents: number
}

type Income = {
  rate: number
  sumBaseIncomeCents: number
}

export default function AgentOverview() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [income, setIncome] = useState<Income | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([apiGet<Overview>('/api/agent/overview'), apiGet<Income>('/api/agent/income')])
      .then(([o, i]) => {
        setOverview(o)
        setIncome(i)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="h-48 animate-pulse rounded-3xl border border-white/10 bg-white/5" />
  }

  if (!overview) {
    return <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">加载失败</div>
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 lg:col-span-2">
        <div className="text-xs text-white/60">我的推荐码</div>
        <div className="mt-2 font-display text-4xl tracking-widest">{overview.inviteCode || '未设置'}</div>
        <div className="mt-3 text-sm text-white/70">客户注册/下单时填写推荐码，可建立关系归属</div>
        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[rgb(var(--panel-2))]/60 p-4">
            <div className="text-xs text-white/60">客户数</div>
            <div className="mt-1 font-display text-2xl">{overview.customerCount}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[rgb(var(--panel-2))]/60 p-4">
            <div className="text-xs text-white/60">归属订单</div>
            <div className="mt-1 font-display text-2xl">{overview.orderCount}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[rgb(var(--panel-2))]/60 p-4">
            <div className="text-xs text-white/60">归属金额</div>
            <div className="mt-1 font-display text-2xl">{formatMoney(overview.orderTotalCents)}</div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="text-sm text-white/85">基础收益（关系收入）</div>
        <div className="mt-2 text-xs text-white/60">作为客户归属的基础回报，不作为主要收益叙事</div>
        <div className="mt-5 rounded-2xl border border-white/10 bg-[rgb(var(--panel-2))]/60 p-4">
          <div className="text-xs text-white/60">累计</div>
          <div className="mt-1 font-display text-3xl">{formatMoney(income?.sumBaseIncomeCents ?? 0)}</div>
          <div className="mt-2 text-xs text-white/60">当前比率：{Math.round((income?.rate ?? 0) * 100)}%</div>
        </div>
      </div>
    </div>
  )
}

