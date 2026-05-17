import { PropsWithChildren, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import AppShell from '@/components/AppShell'
import { useAuth } from '@/stores/auth'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/agent', label: '概览' },
  { to: '/agent/customers', label: '客户' },
  { to: '/agent/growth', label: '成长' },
  { to: '/agent/library', label: '案例库' },
]

export default function AgentLayout({ children }: PropsWithChildren) {
  const nav = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      nav('/login', { state: { from: '/agent' } })
      return
    }
    if (user.role !== 'agent' && user.role !== 'admin') {
      nav('/me', { replace: true })
    }
  }, [user, nav])

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl tracking-wide">代理工作台</h1>
          <div className="mt-1 text-sm text-white/60">关系沉淀、基础收益、雷达图与组织经验</div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.to === '/agent'}
            className={({ isActive }) =>
              cn(
                'rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10',
                isActive && 'border-[rgb(var(--ring))] bg-[rgb(var(--brand))]/10 text-white',
              )
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>

      <div className="mt-5">{children ?? <Outlet />}</div>
    </AppShell>
  )
}

