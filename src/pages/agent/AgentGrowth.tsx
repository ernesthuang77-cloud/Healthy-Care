import { useEffect, useMemo, useState } from 'react'
import RadarChart, { type RadarDim } from '@/components/RadarChart'
import { apiGet, apiPost } from '@/lib/api'

type TemplateDim = { id: string; key: string; title: string; maxScore: number }
type Assessment = { id: string; period: 'week' | 'month'; scores: Record<string, number>; note: string; createdAt: string }

export default function AgentGrowth() {
  const [dims, setDims] = useState<RadarDim[]>([])
  const [scores, setScores] = useState<Record<string, number>>({})
  const [note, setNote] = useState('')
  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const [history, setHistory] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([apiGet<TemplateDim[]>('/api/agent/radar/template'), apiGet<Assessment[]>('/api/agent/radar/assessments')])
      .then(([t, h]) => {
        const d = t.map((x) => ({ key: x.key, title: x.title, maxScore: x.maxScore }))
        setDims(d)
        const init: Record<string, number> = {}
        for (const dim of d) init[dim.key] = Math.round(dim.maxScore * 0.6)
        setScores(init)
        setHistory(h)
      })
      .finally(() => setLoading(false))
  }, [])

  const latest = useMemo(() => history[0] ?? null, [history])
  const chartScores = useMemo(() => (latest ? latest.scores : scores), [latest, scores])

  const submit = async () => {
    setErr('')
    setSaving(true)
    try {
      const saved = await apiPost<Assessment>('/api/agent/radar/assessments', { period, scores, note })
      setHistory((prev) => [saved, ...prev])
      setNote('')
    } catch {
      setErr('提交失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="h-64 animate-pulse rounded-3xl border border-white/10 bg-white/5" />

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 lg:col-span-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm text-white/90">能力雷达</div>
            <div className="mt-1 text-xs text-white/60">{latest ? `最近评估：${new Date(latest.createdAt).toLocaleString()}` : '尚未评估'}</div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPeriod('week')}
              className={[
                'rounded-full border px-3 py-1.5 text-xs',
                period === 'week' ? 'border-[rgb(var(--ring))] bg-[rgb(var(--brand))]/10 text-white' : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10',
              ].join(' ')}
            >
              周评
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={[
                'rounded-full border px-3 py-1.5 text-xs',
                period === 'month' ? 'border-[rgb(var(--ring))] bg-[rgb(var(--brand))]/10 text-white' : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10',
              ].join(' ')}
            >
              月评
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
          <RadarChart dims={dims} scores={chartScores} size={320} />

          <div className="w-full max-w-sm">
            <div className="text-xs text-white/60">本次自评（0-10）</div>
            <div className="mt-3 grid gap-3">
              {dims.map((d) => (
                <label key={d.key} className="grid gap-1">
                  <div className="flex items-center justify-between text-xs text-white/70">
                    <span>{d.title}</span>
                    <span className="font-display text-sm text-white">{scores[d.key] ?? 0}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={d.maxScore}
                    value={scores[d.key] ?? 0}
                    onChange={(e) => setScores((prev) => ({ ...prev, [d.key]: Number(e.target.value) }))}
                    className="accent-[rgb(var(--brand))]"
                  />
                </label>
              ))}
            </div>

            <div className="mt-4 grid gap-2">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-24 rounded-2xl border border-white/10 bg-[rgb(var(--panel-2))]/60 px-4 py-3 text-sm text-white/85 outline-none ring-1 ring-transparent focus:ring-[rgb(var(--ring))]"
                placeholder="记录你在推广中遇到的难处、尝试过的办法、以及你认为可复用的解决思路"
              />
              {err ? <div className="text-sm text-[rgb(var(--danger))]">{err}</div> : null}
              <button
                onClick={() => submit().catch(() => null)}
                disabled={saving}
                className="h-11 rounded-2xl bg-[rgb(var(--brand))] text-sm font-medium text-white hover:brightness-110 disabled:opacity-60"
              >
                {saving ? '提交中…' : '提交评估'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 lg:col-span-2">
        <div className="text-sm text-white/90">历史记录</div>
        <div className="mt-4 grid gap-2">
          {history.length ? (
            history.slice(0, 8).map((h) => (
              <div key={h.id} className="rounded-2xl border border-white/10 bg-[rgb(var(--panel-2))]/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs text-white/60">{h.period === 'month' ? '月评' : '周评'}</div>
                  <div className="text-xs text-white/60">{new Date(h.createdAt).toLocaleString()}</div>
                </div>
                {h.note ? <div className="mt-2 text-sm text-white/80">{h.note}</div> : <div className="mt-2 text-sm text-white/50">—</div>}
              </div>
            ))
          ) : (
            <div className="text-sm text-white/60">暂无记录</div>
          )}
        </div>
      </div>
    </div>
  )
}

