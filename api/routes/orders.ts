import { Router, type Request, type Response } from 'express'
import { loadDb, saveDb, generateId, now, type Order, type OrderItem } from '../db.js'
import { requireUser, type AuthedRequest } from '../middleware.js'
import { computeSkuPriceCents } from '../pricing.js'

const router = Router()

router.get('/', requireUser, async (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user
  const db = await loadDb()
  const items = user.role === 'admin' ? db.orders : db.orders.filter((o) => o.userId === user.id)
  const sorted = [...items].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  res.status(200).json({ success: true, data: sorted })
})

router.get('/:id', requireUser, async (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user
  const id = String(req.params.id)
  const db = await loadDb()
  const order = db.orders.find((o) => o.id === id)
  if (!order) {
    res.status(404).json({ success: false, error: 'NOT_FOUND' })
    return
  }
  if (user.role !== 'admin' && order.userId !== user.id) {
    res.status(403).json({ success: false, error: 'FORBIDDEN' })
    return
  }
  const orderItems = db.orderItems.filter((it) => it.orderId === order.id)
  res.status(200).json({ success: true, data: { ...order, items: orderItems } })
})

router.post('/', requireUser, async (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user
  const rawItems = Array.isArray(req.body?.items) ? req.body.items : []
  const addressId = String(req.body?.addressId ?? '').trim()
  if (!rawItems.length) {
    res.status(400).json({ success: false, error: 'ITEMS_REQUIRED' })
    return
  }
  if (!addressId) {
    res.status(400).json({ success: false, error: 'ADDRESS_REQUIRED' })
    return
  }

  const db = await loadDb()
  const address = db.addresses.find((a) => a.id === addressId && a.userId === user.id)
  if (!address) {
    res.status(404).json({ success: false, error: 'ADDRESS_NOT_FOUND' })
    return
  }

  const orderId = generateId()
  const createdAt = now()

  let totalCents = 0
  const orderItems: OrderItem[] = []

  for (const raw of rawItems) {
    const skuId = String(raw?.skuId ?? '').trim()
    const qty = Math.max(1, Number(raw?.qty ?? 1) || 1)
    const sku = db.skus.find((s) => s.id === skuId)
    if (!sku) {
      res.status(400).json({ success: false, error: `SKU_INVALID:${skuId}` })
      return
    }
    if (sku.stockQty < qty) {
      res.status(409).json({ success: false, error: `OUT_OF_STOCK:${skuId}` })
      return
    }
    const product = db.products.find((p) => p.id === sku.productId)
    const itemPriceCents = computeSkuPriceCents(db, sku, user)
    totalCents += itemPriceCents * qty
    orderItems.push({
      id: generateId(),
      orderId,
      skuId: sku.id,
      titleSnapshot: product?.title ?? '商品',
      skuNameSnapshot: sku.skuName,
      qty,
      itemPriceCents,
    })
  }

  for (const it of orderItems) {
    const sku = db.skus.find((s) => s.id === it.skuId)
    if (sku) sku.stockQty = Math.max(0, sku.stockQty - it.qty)
  }

  const referral = db.referrals.find((r) => r.customerUserId === user.id) ?? null

  const order: Order = {
    id: orderId,
    userId: user.id,
    status: 'pending_confirm',
    totalCents,
    priceSnapshot: { role: user.role, level: user.level },
    addressSnapshot: {
      receiverName: address.receiverName,
      receiverPhone: address.receiverPhone,
      region: address.region,
      detail: address.detail,
    },
    referralAgentUserId: referral?.agentUserId,
    createdAt,
  }

  db.orders.push(order)
  db.orderItems.push(...orderItems)
  await saveDb(db)

  res.status(200).json({ success: true, data: { ...order, items: orderItems } })
})

router.post('/:id/cancel', requireUser, async (req: Request, res: Response) => {
  const user = (req as AuthedRequest).user
  const id = String(req.params.id)
  const db = await loadDb()
  const order = db.orders.find((o) => o.id === id)
  if (!order) {
    res.status(404).json({ success: false, error: 'NOT_FOUND' })
    return
  }
  if (user.role !== 'admin' && order.userId !== user.id) {
    res.status(403).json({ success: false, error: 'FORBIDDEN' })
    return
  }
  if (order.status !== 'pending_confirm') {
    res.status(409).json({ success: false, error: 'CANNOT_CANCEL' })
    return
  }
  order.status = 'cancelled'
  await saveDb(db)
  res.status(200).json({ success: true, data: order })
})

export default router
