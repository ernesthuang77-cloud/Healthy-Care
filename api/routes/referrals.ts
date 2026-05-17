import { Router, type Request, type Response } from 'express'
import { loadDb, saveDb, generateId, now } from '../db.js'
import { requireUser, type AuthedRequest } from '../middleware.js'

const router = Router()

router.get('/me', requireUser, async (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user
  const db = await loadDb()
  const referral = db.referrals.find((r) => r.customerUserId === user.id) ?? null
  if (!referral) {
    res.status(200).json({ success: true, data: { bound: false, referral: null, agent: null } })
    return
  }
  const agent = db.users.find((u) => u.id === referral.agentUserId) ?? null
  res.status(200).json({
    success: true,
    data: {
      bound: true,
      referral,
      agent: agent ? { id: agent.id, nickname: agent.nickname, inviteCode: agent.inviteCode ?? '' } : null,
    },
  })
})

router.post('/bind', requireUser, async (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user
  const inviteCode = String(req.body?.inviteCode ?? '').trim()
  const bindType = String(req.body?.bindType ?? 'register')

  if (!inviteCode) {
    res.status(400).json({ success: false, error: 'INVITE_CODE_REQUIRED' })
    return
  }
  if (user.role !== 'customer') {
    res.status(400).json({ success: false, error: 'ONLY_CUSTOMER_CAN_BIND' })
    return
  }

  const db = await loadDb()
  const agent = db.users.find((u) => u.inviteCode && u.inviteCode.toUpperCase() === inviteCode.toUpperCase())
  if (!agent || agent.role !== 'agent') {
    res.status(404).json({ success: false, error: 'AGENT_NOT_FOUND' })
    return
  }

  const existed = db.referrals.find((r) => r.customerUserId === user.id)
  if (existed) {
    res.status(409).json({ success: false, error: 'ALREADY_BOUND' })
    return
  }

  const referral = {
    id: generateId(),
    agentUserId: agent.id,
    customerUserId: user.id,
    bindType: bindType === 'first_order' ? 'first_order' : 'register',
    boundAt: now(),
  } as const

  db.referrals.push(referral)
  await saveDb(db)
  res.status(200).json({ success: true, data: referral })
})

export default router
