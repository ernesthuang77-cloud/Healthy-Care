import { Router, type Request, type Response } from 'express'
import { loadDb, saveDb, generateId, now, type Address } from '../db.js'
import { requireUser, type AuthedRequest } from '../middleware.js'

const router = Router()

router.get('/me', requireUser, async (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user
  res.status(200).json({ success: true, data: user })
})

router.patch('/me', requireUser, async (req: Request, res: Response) => {
  const authed = req as AuthedRequest
  const nickname = String(req.body?.nickname ?? '').trim()
  if (!nickname) {
    res.status(400).json({ success: false, error: 'NICKNAME_REQUIRED' })
    return
  }
  const db = await loadDb()
  const u = db.users.find((x) => x.id === authed.user.id)
  if (!u) {
    res.status(404).json({ success: false, error: 'NOT_FOUND' })
    return
  }
  u.nickname = nickname
  await saveDb(db)
  res.status(200).json({ success: true, data: u })
})

router.get('/addresses', requireUser, async (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user
  const db = await loadDb()
  const items = db.addresses.filter((a) => a.userId === user.id)
  res.status(200).json({ success: true, data: items })
})

router.post('/addresses', requireUser, async (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user
  const receiverName = String(req.body?.receiverName ?? '').trim()
  const receiverPhone = String(req.body?.receiverPhone ?? '').trim()
  const region = String(req.body?.region ?? '').trim()
  const detail = String(req.body?.detail ?? '').trim()

  if (!receiverName || !receiverPhone || !region || !detail) {
    res.status(400).json({ success: false, error: 'ADDRESS_FIELDS_REQUIRED' })
    return
  }

  const db = await loadDb()
  const address: Address = {
    id: generateId(),
    userId: user.id,
    receiverName,
    receiverPhone,
    region,
    detail,
    createdAt: now(),
  }
  db.addresses.push(address)
  await saveDb(db)
  res.status(200).json({ success: true, data: address })
})

router.patch('/addresses/:id', requireUser, async (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user
  const id = String(req.params.id)
  const db = await loadDb()
  const address = db.addresses.find((a) => a.id === id && a.userId === user.id)
  if (!address) {
    res.status(404).json({ success: false, error: 'NOT_FOUND' })
    return
  }
  const receiverName = String(req.body?.receiverName ?? '').trim()
  const receiverPhone = String(req.body?.receiverPhone ?? '').trim()
  const region = String(req.body?.region ?? '').trim()
  const detail = String(req.body?.detail ?? '').trim()
  if (receiverName) address.receiverName = receiverName
  if (receiverPhone) address.receiverPhone = receiverPhone
  if (region) address.region = region
  if (detail) address.detail = detail
  await saveDb(db)
  res.status(200).json({ success: true, data: address })
})

router.delete('/addresses/:id', requireUser, async (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user
  const id = String(req.params.id)
  const db = await loadDb()
  const idx = db.addresses.findIndex((a) => a.id === id && a.userId === user.id)
  if (idx < 0) {
    res.status(404).json({ success: false, error: 'NOT_FOUND' })
    return
  }
  db.addresses.splice(idx, 1)
  await saveDb(db)
  res.status(200).json({ success: true })
})

export default router

