import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, Radar, Settings2 } from 'lucide-react'
import AppShell from '@/components/AppShell'
import { useAuth } from '@/stores/auth'
import { cn } from '@/lib/utils'

const levelLabel: Record<string, string> = {
  customer_normal: '普通客户',
  customer_vip: 'VIP客户',
  agent_2: '二级代理',
  agent_1: '一级代理',
  agent_general: '总代',
}

export default function Me() {
  const nav = useNavigate()
  const { user, token, isReady, loadFromStorage, refreshMe, logout } = useAuth()

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  useEffect(() => {
    if (!isReady) return
    refreshMe().catch(() => null)
  }, [isReady, refreshMe])

  return (
    <AppShell>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl tracking-wide">我的</h1>
          <div className="mt-1 text-sm text-white/60">个人信息与身份权限</div>
        </div>
        {!user ? (
          <button
            onClick={() => nav('/login', { state: { from: '/me' } })}
            className="h-10 rounded-full bg-[rgb(var(--brand))] px-5 text-sm font-medium text-white hover:brightness-110"
          >
            去登录
          </button>
        ) : null}
      </div>

      {user ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-5">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 lg:col-span-3">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="font-display text-2xl">{user.nickname}</div>
                <div className="mt-2 text-sm text-white/70">{user.phone}</div>
              </div>
              <span className={cn('rounded-full px-3 py-1 text-xs', 'bg-white/10 text-white/80')}>
                {levelLabel[user.level] ?? user.level}
              </span>
            </div>

            {user.role === 'agent' ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-[rgb(var(--panel-2))]/60 p-4">
                <div className="text-xs text-white/60">我的推荐码</div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                  <div className="font-display text-2xl tracking-wide">{user.inviteCode ?? '未设置'}</div>
                  <div className="text-xs text-white/60">客户注册可填写推荐码建立关系</div>
                </div>
              </div>
            ) : null}

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <Link
                to="/orders"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85 hover:bg-white/10"
              >
                我的订单
              </Link>
              <Link
                to="/cart"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/85 hover:bg-white/10"
              >
                购物车
              </Link>
            </div>
          </div>

          <div className="grid gap-3 lg:col-span-2">
            {user.role === 'agent' ? (
              <Link
                to="/agent"
                className="inline-flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-5 hover:bg-white/10"
              >
                <div>
                  <div className="text-sm text-white/90">代理工作台</div>
                  <div className="mt-1 text-xs text-white/60">客户、基础收益、雷达图与案例库</div>
                </div>
                <Radar size={18} className="text-[rgb(var(--brand-2))]" />
              </Link>
            ) : null}

            {user.role === 'admin' || user.role === 'staff' ? (
              <Link
                to="/admin"
                className="inline-flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-5 hover:bg-white/10"
              >
                <div>
                  <div className="text-sm text-white/90">管理后台</div>
                  <div className="mt-1 text-xs text-white/60">用户/价格/订单/发货</div>
                </div>
                <Settings2 size={18} className="text-[rgb(var(--brand-2))]" />
              </Link>
            ) : null}

            <button
              onClick={() => logout().then(() => nav('/')).catch(() => null)}
              disabled={!token}
              className="inline-flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 p-5 text-left hover:bg-white/10 disabled:opacity-60"
            >
              <div>
                <div className="text-sm text-white/90">退出登录</div>
                <div className="mt-1 text-xs text-white/60">清除本地登录状态</div>
              </div>
              <LogOut size={18} className="text-white/70" />
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
          登录后可查看订单、地址管理与代理权益
        </div>
      )}
    </AppShell>
  )
}

