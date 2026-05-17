import type { Db, ProductSku, User } from './db.js'

export const computeSkuPriceCents = (db: Db, sku: ProductSku, user: User | null) => {
  if (!user) return sku.publicPriceCents
  let role = user.role
  let level = user.level

  if (user.role === 'customer' && user.level === 'customer_normal') {
    const hasReferral = db.referrals.some((r) => r.customerUserId === user.id)
    if (hasReferral) level = 'customer_vip'
  }
  const now = Date.now()
  const rule = db.priceRules.find((r) => {
    if (r.skuId !== sku.id) return false
    if (r.role !== role) return false
    if (r.level !== level) return false
    if (r.startsAt && Date.parse(r.startsAt) > now) return false
    if (r.endsAt && Date.parse(r.endsAt) < now) return false
    return true
  })
  return rule?.priceCents ?? sku.publicPriceCents
}
