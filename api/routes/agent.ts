import { Router, type Request, type Response } from 'express'
import { loadDb, saveDb, generateId, now, type RadarPeriod, type UserLevel } from '../db.js'
import { requireRole, type AuthedRequest } from '../middleware.js'

const router = Router()

const baseRateByLevel: Record<UserLevel, number> = {
  customer_normal: 0,
  customer_vip: 0,
  agent_2: 0.05,
  agent_1: 0.07,
  agent_general: 0.1,
}

router.get('/overview', requireRole(['agent', 'admin']), async (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user
  const db = await loadDb()
  const myReferrals = db.referrals.filter((r) => r.agentUserId === user.id)
  const customerIds = new Set(myReferrals.map((r) => r.customerUserId))
  const customerCount = customerIds.size
  const orders = db.orders.filter((o) => o.referralAgentUserId === user.id)
  const orderCount = orders.length
  const orderTotalCents = orders.reduce((sum, o) => sum + o.totalCents, 0)
  res.status(200).json({
    success: true,
    data: {
      inviteCode: user.inviteCode ?? '',
      customerCount,
      orderCount,
      orderTotalCents,
    },
  })
})

router.get('/customers', requireRole(['agent', 'admin']), async (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user
  const db = await loadDb()
  const myReferrals = db.referrals.filter((r) => r.agentUserId === user.id)
  const customers = myReferrals
    .map((r) => {
      const c = db.users.find((u) => u.id === r.customerUserId)
      if (!c) return null
      const orders = db.orders.filter((o) => o.userId === c.id)
      const lastOrderAt = orders.length ? orders.map((o) => o.createdAt).sort().at(-1) ?? null : null
      const totalCents = orders.reduce((s, o) => s + o.totalCents, 0)
      return {
        referral: r,
        customer: c,
        stats: { orderCount: orders.length, totalCents, lastOrderAt },
      }
    })
    .filter(Boolean)
  res.status(200).json({ success: true, data: customers })
})

router.get('/income', requireRole(['agent', 'admin']), async (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user
  const db = await loadDb()
  const orders = db.orders.filter((o) => o.referralAgentUserId === user.id)
  const rate = baseRateByLevel[user.level] ?? 0
  const lines = orders
    .map((o) => ({
      orderId: o.id,
      totalCents: o.totalCents,
      baseIncomeCents: Math.round(o.totalCents * rate),
      createdAt: o.createdAt,
    }))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  const sumBaseIncomeCents = lines.reduce((s, x) => s + x.baseIncomeCents, 0)
  res.status(200).json({ success: true, data: { rate, sumBaseIncomeCents, lines } })
})

router.get('/radar/template', requireRole(['agent', 'admin']), async (req: Request, res: Response) => {
  const db = await loadDb()
  res.status(200).json({ success: true, data: db.radarTemplate })
})

router.get('/radar/assessments', requireRole(['agent', 'admin']), async (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user
  const db = await loadDb()
  const items = db.radarAssessments
    .filter((a) => a.userId === user.id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  res.status(200).json({ success: true, data: items })
})

router.post('/radar/assessments', requireRole(['agent', 'admin']), async (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user
  const period = String(req.body?.period ?? 'week') as RadarPeriod
  const scoresRaw = (req.body?.scores ?? {}) as Record<string, unknown>
  const note = String(req.body?.note ?? '').trim()

  const db = await loadDb()
  const templateKeys = new Set(db.radarTemplate.map((d) => d.key))
  const scores: Record<string, number> = {}

  for (const key of templateKeys) {
    const value = Number(scoresRaw[key] ?? 0)
    const dim = db.radarTemplate.find((d) => d.key === key)
    const max = dim?.maxScore ?? 10
    scores[key] = Math.max(0, Math.min(max, Number.isFinite(value) ? value : 0))
  }

  const assessment = {
    id: generateId(),
    userId: user.id,
    period: period === 'month' ? 'month' : 'week',
    scores,
    note,
    createdAt: now(),
  } as const

  db.radarAssessments.push(assessment)
  await saveDb(db)
  res.status(200).json({ success: true, data: assessment })
})

router.get('/library/cases', requireRole(['agent', 'admin']), async (req: Request, res: Response) => {
  const db = await loadDb()
  const items = [...db.agentCases].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  res.status(200).json({ success: true, data: items })
})

router.post('/library/cases', requireRole(['agent', 'admin']), async (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user
  const title = String(req.body?.title ?? '').trim()
  const difficulty = String(req.body?.difficulty ?? 'medium')
  const solution = String(req.body?.solution ?? '').trim()
  if (!title || !solution) {
    res.status(400).json({ success: false, error: 'FIELDS_REQUIRED' })
    return
  }
  const db = await loadDb()
  const item = {
    id: generateId(),
    userId: user.id,
    title,
    difficulty: difficulty === 'easy' || difficulty === 'hard' ? difficulty : 'medium',
    solution,
    likeCount: 0,
    createdAt: now(),
  } as const
  db.agentCases.push(item)
  await saveDb(db)
  res.status(200).json({ success: true, data: item })
})

export default router

