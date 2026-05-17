import { PropsWithChildren, useEffect, useMemo } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { LayoutGrid, ShoppingBag, UserRound, Radar, Settings2 } from 'lucide-react'
import { useAuth } from '@/stores/auth'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/', label: '首页', icon: LayoutGrid },
  { to: '/products', label: '商城', icon: ShoppingBag },
  { to: '/me', label: '我的', icon: UserRound },
]

export default function AppShell({ children }: PropsWithChildren) {
  const { pathname } = useLocation()
  const { user, token, isReady, loadFromStorage, refreshMe } = useAuth()

  const showBottom = !pathname.startsWith('/admin') && !pathname.startsWith('/login')
  const showAgent = user?.role === 'agent'
  const showAdmin = user?.role === 'admin' || user?.role === 'staff'

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  useEffect(() => {
    if (!isReady) return
    refreshMe().catch(() => null)
  }, [isReady, refreshMe])

  const identity = useMemo(() => {
    if (!token) return { label: '游客', tone: 'bg-white/10 text-white/80' }
    if (!user) return { label: '已登录', tone: 'bg-white/10 text-white/80' }
    if (user.role === 'admin') return { label: '管理员', tone: 'bg-[rgb(var(--brand-2))]/15 text-[rgb(var(--brand-2))]' }
    if (user.role === 'staff') return { label: '仓配/客服', tone: 'bg-white/10 text-white/80' }
    if (user.role === 'agent') return { label: '代理', tone: 'bg-white/10 text-white/80' }
    if (user.level === 'customer_vip') return { label: 'VIP', tone: 'bg-[rgb(var(--brand-2))]/15 text-[rgb(var(--brand-2))]' }
    return { label: '客户', tone: 'bg-white/10 text-white/80' }
  }, [token, user])

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgb(var(--bg))]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/" className="group flex items-baseline gap-2">
            <span className="font-display text-lg tracking-wide">御承美</span>
            <span className="text-xs text-[rgb(var(--muted))]">官方商城</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className={cn('hidden rounded-full px-3 py-1 text-xs sm:inline-flex', identity.tone)}>{identity.label}</span>
            {showAgent ? (
              <Link
                to="/agent"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/90 hover:bg-white/10"
              >
                <Radar size={16} />
                代理工作台
              </Link>
            ) : null}
            {showAdmin ? (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/90 hover:bg-white/10"
              >
                <Settings2 size={16} />
                管理后台
              </Link>
            ) : null}
            <Link
              to={user ? '/me' : '/login'}
              state={!user ? { from: pathname } : undefined}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white/90 hover:bg-white/10"
            >
              <UserRound size={16} />
              <span className="hidden sm:inline">{user ? '我的' : '登录'}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className={cn('mx-auto max-w-6xl px-4 pb-24 pt-6', !showBottom && 'pb-6')}>
        {children}
      </main>

      {showBottom ? (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[rgb(var(--bg))]/85 backdrop-blur sm:hidden">
          <div className="mx-auto grid max-w-6xl grid-cols-3 px-2 py-2">
            {tabs.map((t) => {
              const Icon = t.icon
              return (
                <NavLink
                  key={t.to}
                  to={t.to}
                  className={({ isActive }) =>
                    cn(
                      'flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs text-white/70',
                      isActive && 'bg-white/5 text-white',
                    )
                  }
                >
                  <Icon size={18} />
                  {t.label}
                </NavLink>
              )
            })}
          </div>
        </nav>
      ) : null}
    </div>
  )
}
