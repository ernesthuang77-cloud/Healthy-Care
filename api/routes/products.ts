import { Router, type Request, type Response } from 'express'
import { loadDb } from '../db.js'
import { computeSkuPriceCents } from '../pricing.js'
import { getOptionalUser } from '../optionalUser.js'

const router = Router()

router.get('/', async (req: Request, res: Response) => {
  const db = await loadDb()
  const user = await getOptionalUser(req)
  const products = db.products
    .filter((p) => p.status === 'active')
    .map((p) => {
      const skus = db.skus.filter((s) => s.productId === p.id)
      const prices = skus.map((s) => computeSkuPriceCents(db, s, user))
      const minPriceCents = prices.length ? Math.min(...prices) : 0
      return {
        ...p,
        skus: skus.map((s) => ({
          ...s,
          priceCents: computeSkuPriceCents(db, s, user),
        })),
        minPriceCents,
      }
    })
  res.status(200).json({ success: true, data: products })
})

router.get('/:id', async (req: Request, res: Response) => {
  const id = String(req.params.id)
  const db = await loadDb()
  const user = await getOptionalUser(req)
  const product = db.products.find((p) => p.id === id && p.status === 'active')
  if (!product) {
    res.status(404).json({ success: false, error: 'NOT_FOUND' })
    return
  }
  const skus = db.skus
    .filter((s) => s.productId === product.id)
    .map((s) => ({ ...s, priceCents: computeSkuPriceCents(db, s, user) }))
  res.status(200).json({ success: true, data: { ...product, skus } })
})

export default router

