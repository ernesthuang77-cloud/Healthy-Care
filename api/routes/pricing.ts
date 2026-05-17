import { Router, type Request, type Response } from 'express'
import { loadDb } from '../db.js'
import { getOptionalUser } from '../optionalUser.js'
import { computeSkuPriceCents } from '../pricing.js'

const router = Router()

router.get('/quote', async (req: Request, res: Response) => {
  const skuId = String(req.query.skuId ?? '').trim()
  if (!skuId) {
    res.status(400).json({ success: false, error: 'SKU_REQUIRED' })
    return
  }
  const db = await loadDb()
  const sku = db.skus.find((s) => s.id === skuId)
  if (!sku) {
    res.status(404).json({ success: false, error: 'NOT_FOUND' })
    return
  }
  const user = await getOptionalUser(req)
  const priceCents = computeSkuPriceCents(db, sku, user)
  res.status(200).json({
    success: true,
    data: {
      skuId,
      priceCents,
      role: user?.role ?? null,
      level: user?.level ?? null,
    },
  })
})

export default router

