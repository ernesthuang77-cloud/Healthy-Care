import { useMemo } from 'react'
import { cn } from '@/lib/utils'

export type RadarDim = { key: string; title: string; maxScore: number }

export default function RadarChart({
  dims,
  scores,
  size = 320,
}: {
  dims: RadarDim[]
  scores: Record<string, number>
  size?: number
}) {
  const { points, gridRings } = useMemo(() => {
    const cx = size / 2
    const cy = size / 2
    const r = (size / 2) * 0.78
    const n = Math.max(3, dims.length)
    const angle0 = -Math.PI / 2

    const axis = dims.map((d, i) => {
      const a = angle0 + (2 * Math.PI * i) / n
      const x = cx + Math.cos(a) * r
      const y = cy + Math.sin(a) * r
      return { key: d.key, title: d.title, a, x, y, max: d.maxScore }
    })

    const polygon = axis.map((ax) => {
      const v = Number(scores[ax.key] ?? 0)
      const t = Math.max(0, Math.min(1, ax.max ? v / ax.max : 0))
      return {
        x: cx + Math.cos(ax.a) * r * t,
        y: cy + Math.sin(ax.a) * r * t,
      }
    })

    const rings = [0.25, 0.5, 0.75, 1].map((t) =>
      axis.map((ax) => ({
        x: cx + Math.cos(ax.a) * r * t,
        y: cy + Math.sin(ax.a) * r * t,
      })),
    )

    return {
      points: { cx, cy, r, axis, polygon },
      gridRings: rings,
    }
  }, [dims, scores, size])

  const polygonD = points.polygon.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <radialGradient id="yc_radar_fill" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgba(25,121,97,0.35)" />
            <stop offset="100%" stopColor="rgba(25,121,97,0.05)" />
          </radialGradient>
          <filter id="yc_shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="rgba(0,0,0,0.35)" />
          </filter>
        </defs>

        {gridRings.map((ring, idx) => {
          const d = ring.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z'
          return <path key={idx} d={d} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        })}

        {points.axis.map((ax) => (
          <line
            key={ax.key}
            x1={points.cx}
            y1={points.cy}
            x2={ax.x}
            y2={ax.y}
            stroke="rgba(255,255,255,0.10)"
            strokeWidth="1"
          />
        ))}

        <path d={polygonD} fill="url(#yc_radar_fill)" stroke="rgba(25,121,97,0.9)" strokeWidth="2" filter="url(#yc_shadow)" />

        {points.polygon.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="rgba(201,170,99,0.95)" stroke="rgba(0,0,0,0.35)" />
        ))}
      </svg>

      {points.axis.map((ax) => {
        const offsetX = (ax.x - points.cx) * 0.08
        const offsetY = (ax.y - points.cy) * 0.08
        const left = ax.x + offsetX
        const top = ax.y + offsetY
        const anchor =
          Math.abs(ax.x - points.cx) < 2 ? 'text-center' : ax.x > points.cx ? 'text-left' : 'text-right'
        return (
          <div
            key={ax.key}
            className={cn('absolute -translate-x-1/2 -translate-y-1/2 text-[11px] text-white/70', anchor)}
            style={{ left, top }}
          >
            {ax.title}
          </div>
        )
      })}
    </div>
  )
}

