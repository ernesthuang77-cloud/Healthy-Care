/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express'
import { loadDb, saveDb, generateId, now, type User } from '../db.js'
import { createSessionToken, deleteSessionToken } from '../session.js'

const router = Router()

/**
 * User Login
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  const phone = String(req.body?.phone ?? '').trim()
  const nickname = String(req.body?.nickname ?? '').trim() || '新用户'
  const inviteCode = String(req.body?.inviteCode ?? '').trim()

  if (!phone) {
    res.status(400).json({ success: false, error: 'PHONE_REQUIRED' })
    return
  }

  const db = await loadDb()
  let user = db.users.find((u) => u.phone === phone)

  if (!user) {
    const created: User = {
      id: generateId(),
      phone,
      nickname,
      role: 'customer',
      level: 'customer_normal',
      createdAt: now(),
    }
    db.users.push(created)
    user = created

    const agent = db.users.find((u) => u.inviteCode && u.inviteCode.toUpperCase() === inviteCode.toUpperCase())
    if (agent && agent.role === 'agent') {
      const already = db.referrals.find((r) => r.customerUserId === created.id)
      if (!already) {
        db.referrals.push({
          id: generateId(),
          agentUserId: agent.id,
          customerUserId: created.id,
          bindType: 'register',
          boundAt: now(),
        })
      }
    }
    await saveDb(db)
  }

  const token = createSessionToken(user.id)
  res.status(200).json({
    success: true,
    data: {
      token,
      user,
    },
  })
})

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const phone = String(req.body?.phone ?? '').trim()
  const inviteCode = String(req.body?.inviteCode ?? '').trim()

  if (!phone) {
    res.status(400).json({ success: false, error: 'PHONE_REQUIRED' })
    return
  }

  const db = await loadDb()
  let user = db.users.find((u) => u.phone === phone)
  if (!user) {
    const created: User = {
      id: generateId(),
      phone,
      nickname: '新用户',
      role: 'customer',
      level: 'customer_normal',
      createdAt: now(),
    }
    db.users.push(created)
    user = created

    const agent = db.users.find((u) => u.inviteCode && u.inviteCode.toUpperCase() === inviteCode.toUpperCase())
    if (agent && agent.role === 'agent') {
      const already = db.referrals.find((r) => r.customerUserId === created.id)
      if (!already) {
        db.referrals.push({
          id: generateId(),
          agentUserId: agent.id,
          customerUserId: created.id,
          bindType: 'register',
          boundAt: now(),
        })
      }
    }
    await saveDb(db)
  }

  const token = createSessionToken(user.id)
  res.status(200).json({
    success: true,
    data: {
      token,
      user,
    },
  })
})

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  const auth = req.headers.authorization
  const token = auth?.startsWith('Bearer ') ? auth.slice('Bearer '.length) : ''
  if (token) deleteSessionToken(token)
  res.status(200).json({ success: true })
})

export default router
