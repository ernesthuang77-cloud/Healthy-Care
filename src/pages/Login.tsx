import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AppShell from '@/components/AppShell'
import { useAuth } from '@/stores/auth'

const quick = [
  { label: '管理员', phone: '18800000000' },
  { label: '二级代理', phone: '18800000001' },
  { label: '一级代理', phone: '18800000002' },
  { label: '总代', phone: '18800000003' },
]

export default function Login() {
  const nav = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  const from = useMemo(() => {
    const state = location.state as { from?: string } | null
    return state?.from || '/'
  }, [location.state])

  const [phone, setPhone] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const onSubmit = async () => {
    setErr('')
    if (!phone.trim()) {
      setErr('请输入手机号')
      return
    }
    setLoading(true)
    try {
      await login(phone.trim(), inviteCode.trim() || undefined)
      nav(from, { replace: true })
    } catch {
      setErr('登录失败，请检查手机号或稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-lg">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h1 className="font-display text-2xl tracking-wide">登录</h1>
            <span className="text-xs text-white/60">支持推荐码绑定关系</span>
          </div>

          <div className="mt-5 grid gap-3">
            <label className="grid gap-1">
              <span className="text-xs text-white/60">手机号</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-11 rounded-2xl border border-white/10 bg-[rgb(var(--panel-2))] px-4 text-sm outline-none ring-1 ring-transparent focus:ring-[rgb(var(--ring))]"
                placeholder="例如：13800000000"
                inputMode="tel"
              />
            </label>

            <label className="grid gap-1">
              <span className="text-xs text-white/60">推荐码（可选）</span>
              <input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="h-11 rounded-2xl border border-white/10 bg-[rgb(var(--panel-2))] px-4 text-sm outline-none ring-1 ring-transparent focus:ring-[rgb(var(--ring))]"
                placeholder="例如：YC2"
              />
            </label>

            {err ? <div className="text-sm text-[rgb(var(--danger))]">{err}</div> : null}

            <button
              onClick={onSubmit}
              disabled={loading}
              className="mt-2 h-11 rounded-2xl bg-[rgb(var(--brand))] text-sm font-medium text-white hover:brightness-110 disabled:opacity-60"
            >
              {loading ? '登录中…' : '登录'}
            </button>
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="text-xs text-white/60">快速体验账号</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {quick.map((q) => (
                <button
                  key={q.phone}
                  onClick={() => setPhone(q.phone)}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
                >
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

