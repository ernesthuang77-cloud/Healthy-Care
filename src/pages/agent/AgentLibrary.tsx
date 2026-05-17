import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '@/lib/api'

type AgentCase = {
  id: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  solution: string
  likeCount: number
  createdAt: string
}

export default function AgentLibrary() {
  const [items, setItems] = useState<AgentCase[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [solution, setSolution] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    setLoading(true)
    apiGet<AgentCase[]>('/api/agent/library/cases')
      .then(setItems)
      .finally(() => setLoading(false))
  }, [])

  const submit = async () => {
    setErr('')
    if (!title.trim() || !solution.trim()) {
      setErr('请填写标题与解决方案')
      return
    }
    setSaving(true)
    try {
      const saved = await apiPost<AgentCase>('/api/agent/library/cases', { title, difficulty, solution })
      setItems((prev) => [saved, ...prev])
      setTitle('')
      setSolution('')
    } catch {
      setErr('提交失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 lg:col-span-2">
        <div className="text-sm text-white/90">提交难题与解决方案</div>
        <div className="mt-2 text-xs text-white/60">把一线经验沉淀成组织资产，方便复用与协同</div>

        <div className="mt-5 grid gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-11 rounded-2xl border border-white/10 bg-[rgb(var(--panel-2))]/60 px-4 text-sm outline-none ring-1 ring-transparent focus:ring-[rgb(var(--ring))]"
            placeholder="例如：客户对价格敏感时如何引导体验"
          />
          <div className="flex flex-wrap gap-2">
            {(['easy', 'medium', 'hard'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty(d)}
                className={[
                  'rounded-full border px-4 py-2 text-xs',
                  difficulty === d ? 'border-[rgb(var(--ring))] bg-[rgb(var(--brand))]/10 text-white' : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10',
                ].join(' ')}
              >
                {d === 'easy' ? '简单' : d === 'hard' ? '困难' : '一般'}
              </button>
            ))}
          </div>
          <textarea
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            className="min-h-32 rounded-2xl border border-white/10 bg-[rgb(var(--panel-2))]/60 px-4 py-3 text-sm outline-none ring-1 ring-transparent focus:ring-[rgb(var(--ring))]"
            placeholder="描述你的做法、话术思路、注意点与可复用的步骤"
          />
          {err ? <div className="text-sm text-[rgb(var(--danger))]">{err}</div> : null}
          <button
            onClick={() => submit().catch(() => null)}
            disabled={saving}
            className="h-11 rounded-2xl bg-[rgb(var(--brand))] text-sm font-medium text-white hover:brightness-110 disabled:opacity-60"
          >
            {saving ? '提交中…' : '提交'}
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 lg:col-span-3">
        <div className="text-sm text-white/90">案例库</div>
        <div className="mt-2 text-xs text-white/60">按时间排序（演示版），后续可加入标签/搜索/置顶</div>

        {loading ? (
          <div className="mt-4 h-56 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
        ) : items.length ? (
          <div className="mt-4 grid gap-3">
            {items.map((c) => (
              <div key={c.id} className="rounded-2xl border border-white/10 bg-[rgb(var(--panel-2))]/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-white/90">{c.title}</div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                    {c.difficulty === 'easy' ? '简单' : c.difficulty === 'hard' ? '困难' : '一般'}
                  </span>
                </div>
                <div className="mt-2 text-xs text-white/60">{new Date(c.createdAt).toLocaleString()}</div>
                <div className="mt-3 whitespace-pre-wrap text-sm text-white/80">{c.solution}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">暂无内容</div>
        )}
      </div>
    </div>
  )
}

