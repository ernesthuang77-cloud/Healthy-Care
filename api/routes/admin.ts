import { Router, type Request, type Response } from 'express'
import { loadDb, saveDb, generateId, now, type OrderStatus, type UserLevel, type UserRole } from '../db.js'
import { requireRole } from '../middleware.js'

const router = Router()

const maskPhone = (phone: string) => {
  if (phone.length < 7) return phone
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`
}

router.get('/users', requireRole(['admin', 'staff']), async (req: Request, res: Response) => {
  const q = String(req.query.q ?? '').trim()
  const db = await loadDb()
  const filtered = db.users.filter((u) => {
    if (!q) return true
    return u.phone.includes(q) || u.nickname.includes(q) || (u.inviteCode ?? '').includes(q)
  })
  const data = filtered.map((u) => ({
    ...u,
    phone: maskPhone(u.phone),
  }))
  res.status(200).json({ success: true, data })
})

router.patch('/users/:id/role', requireRole(['admin']), async (req: Request, res: Response) => {
  const id = String(req.params.id)
  const role = String(req.body?.role ?? '').trim() as UserRole
  const level = String(req.body?.level ?? '').trim() as UserLevel
  const nickname = String(req.body?.nickname ?? '').trim()
  const inviteCode = String(req.body?.inviteCode ?? '').trim()

  const db = await loadDb()
  const user = db.users.find((u) => u.id === id)
  if (!user) {
    res.status(404).json({ success: false, error: 'NOT_FOUND' })
    return
  }

  const allowedRoles: UserRole[] = ['customer', 'agent', 'admin', 'staff']
  const allowedLevels: UserLevel[] = ['customer_normal', 'customer_vip', 'agent_2', 'agent_1', 'agent_general']

  if (role && allowedRoles.includes(role)) user.role = role
  if (level && allowedLevels.includes(level)) user.level = level
  if (nickname) user.nickname = nickname

  if (inviteCode) {
    const dup = db.users.find((u) => u.inviteCode?.toUpperCase() === inviteCode.toUpperCase() && u.id !== user.id)
    if (dup) {
      res.status(409).json({ success: false, error: 'INVITE_CODE_DUPLICATE' })
      return
    }
    user.inviteCode = inviteCode
  }

  await saveDb(db)
  res.status(200).json({ success: true, data: user })
})

router.get('/orders', requireRole(['admin', 'staff']), async (req: Request, res: Response) => {
  const db = await loadDb()
  const data = [...db.orders]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .map((o) => {
      const items = db.orderItems.filter((it) => it.orderId === o.id)
      const buyer = db.users.find((u) => u.id === o.userId)
      return {
        ...o,
        itemCount: items.reduce((s, it) => s + it.qty, 0),
        buyer: buyer ? { id: buyer.id, nickname: buyer.nickname, phone: maskPhone(buyer.phone) } : null,
      }
    })
  res.status(200).json({ success: true, data })
})

router.patch('/orders/:id/status', requireRole(['admin', 'staff']), async (req: Request, res: Response) => {
  const id = String(req.params.id)
  const status = String(req.body?.status ?? '').trim() as OrderStatus

  const allowed: Record<OrderStatus, OrderStatus[]> = {
    pending_confirm: ['confirmed', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  }

  const db = await loadDb()
  const order = db.orders.find((o) => o.id === id)
  if (!order) {
    res.status(404).json({ success: false, error: 'ORDER_NOT_FOUND' })
    return
  }
  const next = allowed[order.status] ?? []
  if (!next.includes(status)) {
    res.status(409).json({ success: false, error: 'INVALID_STATUS_TRANSITION' })
    return
  }

  order.status = status
  if (status === 'confirmed') order.confirmedAt = now()
  if (status === 'completed') order.completedAt = now()

  await saveDb(db)
  res.status(200).json({ success: true, data: order })
})

router.get('/prices', requireRole(['admin', 'staff']), async (req: Request, res: Response) => {
  const db = await loadDb()
  const data = db.priceRules.map((r) => {
    const sku = db.skus.find((s) => s.id === r.skuId)
    const product = sku ? db.products.find((p) => p.id === sku.productId) : null
    return {
      ...r,
      sku,
      product,
    }
  })
  res.status(200).json({ success: true, data })
})

router.post('/prices', requireRole(['admin']), async (req: Request, res: Response) => {
  const skuId = String(req.body?.skuId ?? '').trim()
  const role = String(req.body?.role ?? '').trim() as UserRole
  const level = String(req.body?.level ?? '').trim() as UserLevel
  const priceCents = Number(req.body?.priceCents ?? NaN)
  if (!skuId || !role || !level || !Number.isFinite(priceCents)) {
    res.status(400).json({ success: false, error: 'FIELDS_REQUIRED' })
    return
  }
  const db = await loadDb()
  const sku = db.skus.find((s) => s.id === skuId)
  if (!sku) {
    res.status(404).json({ success: false, error: 'SKU_NOT_FOUND' })
    return
  }
  let rule = db.priceRules.find((r) => r.skuId === skuId && r.role === role && r.level === level)
  if (!rule) {
    rule = { id: generateId(), skuId, role, level, priceCents }
    db.priceRules.push(rule)
  } else {
    rule.priceCents = priceCents
  }
  await saveDb(db)
  res.status(200).json({ success: true, data: rule })
})

export default router
