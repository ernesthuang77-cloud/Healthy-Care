import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '@/lib/api'
import { useAuth } from '@/stores/auth'

type ReferralMe = {
  bound: boolean
  agent: { id: string; nickname: string; inviteCode: string } | null
}

export default function BindAgentBanner({ onBound }: { onBound?: () => void }) {
  const { user, refreshMe } = useAuth()
  const [loading, setLoading] = useState(true)
  const [bound, setBound] = useState(false)
  const [inviteCode, setInviteCode] = useState('')
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'customer') {
      setLoading(false)
      return
    }
    setLoading(true)
    apiGet<ReferralMe>('/api/referrals/me')
      .then((d) => setBound(Boolean(d.bound)))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [user])

  if (!user || user.role !== 'customer') return null
  if (loading) return null
  if (bound) return null

  const submit = async () => {
    setErr('')
    const code = inviteCode.trim()
    if (!code) {
      setErr('请输入推荐码')
      return
    }
    setSaving(true)
    try {
      await apiPost('/api/referrals/bind', { inviteCode: code, bindType: 'register' })
      await refreshMe().catch(() => null)
      setBound(true)
      onBound?.()
    } catch {
      setErr('绑定失败，请检查推荐码')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-3xl border border-[rgb(var(--brand-2))]/25 bg-[rgb(var(--brand-2))]/10 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm text-white/90">新客户提示</div>
          <div className="mt-1 text-xs text-white/70">填写对应代理推荐码，可获得专属价格折扣</div>
        </div>
        <div className="text-xs text-white/60">可在登录时填写，也可在这里补填</div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          className="h-11 flex-1 min-w-[220px] rounded-2xl border border-white/10 bg-[rgb(var(--panel-2))]/60 px-4 text-sm outline-none ring-1 ring-transparent focus:ring-[rgb(var(--ring))]"
          placeholder="输入推荐码，例如：YC2"
        />
        <button
          onClick={() => submit().catch(() => null)}
          disabled={saving}
          className="h-11 rounded-2xl bg-[rgb(var(--brand))] px-6 text-sm font-medium text-white hover:brightness-110 disabled:opacity-60"
        >
          {saving ? '绑定中…' : '立即绑定'}
        </button>
      </div>
      {err ? <div className="mt-3 text-sm text-[rgb(var(--danger))]">{err}</div> : null}
    </div>
  )
}

