import fs from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

export type UserRole = 'customer' | 'agent' | 'admin' | 'staff'
export type UserLevel =
  | 'customer_normal'
  | 'customer_vip'
  | 'agent_2'
  | 'agent_1'
  | 'agent_general'

export type ReferralBindType = 'register' | 'first_order'

export interface User {
  id: string
  phone: string
  nickname: string
  role: UserRole
  level: UserLevel
  inviteCode?: string
  createdAt: string
}

export interface Address {
  id: string
  userId: string
  receiverName: string
  receiverPhone: string
  region: string
  detail: string
  createdAt: string
}

export interface Product {
  id: string
  title: string
  subtitle: string
  coverColor: string
  coverImageUrl?: string
  status: 'active' | 'inactive'
  createdAt: string
}

export interface ProductSku {
  id: string
  productId: string
  skuName: string
  stockQty: number
  publicPriceCents: number
}

export interface PriceRule {
  id: string
  skuId: string
  role: UserRole
  level: UserLevel
  priceCents: number
  startsAt?: string
  endsAt?: string
}

export type OrderStatus = 'pending_confirm' | 'confirmed' | 'completed' | 'cancelled'

export interface OrderItem {
  id: string
  orderId: string
  skuId: string
  titleSnapshot: string
  skuNameSnapshot: string
  qty: number
  itemPriceCents: number
}

export interface Shipment {
  id: string
  orderId: string
  carrier: string
  trackingNo: string
  shippedAt: string
}

export interface Order {
  id: string
  userId: string
  status: OrderStatus
  totalCents: number
  priceSnapshot: {
    role: UserRole
    level: UserLevel
  }
  addressSnapshot: {
    receiverName: string
    receiverPhone: string
    region: string
    detail: string
  }
  referralAgentUserId?: string
  createdAt: string
  confirmedAt?: string
  completedAt?: string
}

export interface Referral {
  id: string
  agentUserId: string
  customerUserId: string
  bindType: ReferralBindType
  boundAt: string
  expiresAt?: string
}

export type RadarPeriod = 'week' | 'month'

export interface RadarTemplate {
  id: string
  key: string
  title: string
  maxScore: number
}

export interface RadarAssessment {
  id: string
  userId: string
  period: RadarPeriod
  scores: Record<string, number>
  note: string
  createdAt: string
}

export interface AgentCase {
  id: string
  userId: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  solution: string
  likeCount: number
  createdAt: string
}

export interface Db {
  users: User[]
  addresses: Address[]
  products: Product[]
  skus: ProductSku[]
  priceRules: PriceRule[]
  referrals: Referral[]
  orders: Order[]
  orderItems: OrderItem[]
  shipments: Shipment[]
  radarTemplate: RadarTemplate[]
  radarAssessments: RadarAssessment[]
  agentCases: AgentCase[]
}

const dataDir = path.join(process.cwd(), 'api', 'data')
const dbFile = path.join(dataDir, 'db.json')

const nowIso = () => new Date().toISOString()
const toImageUrl = (prompt: string, imageSize: string) =>
  `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${encodeURIComponent(imageSize)}`

const ensureDir = async () => {
  await fs.mkdir(dataDir, { recursive: true })
}

const createEmptyDb = (): Db => ({
  users: [],
  addresses: [],
  products: [],
  skus: [],
  priceRules: [],
  referrals: [],
  orders: [],
  orderItems: [],
  shipments: [],
  radarTemplate: [],
  radarAssessments: [],
  agentCases: [],
})

const seedDb = (db: Db): Db => {
  if (db.users.length === 0) {
    const adminUser: User = {
      id: randomUUID(),
      phone: '18800000000',
      nickname: '运营管理员',
      role: 'admin',
      level: 'customer_normal',
      inviteCode: 'ADMIN',
      createdAt: nowIso(),
    }
    const agent2: User = {
      id: randomUUID(),
      phone: '18800000001',
      nickname: '二级代理示例',
      role: 'agent',
      level: 'agent_2',
      inviteCode: 'YC2',
      createdAt: nowIso(),
    }
    const agent1: User = {
      id: randomUUID(),
      phone: '18800000002',
      nickname: '一级代理示例',
      role: 'agent',
      level: 'agent_1',
      inviteCode: 'YC1',
      createdAt: nowIso(),
    }
    const general: User = {
      id: randomUUID(),
      phone: '18800000003',
      nickname: '总代示例',
      role: 'agent',
      level: 'agent_general',
      inviteCode: 'YCG',
      createdAt: nowIso(),
    }
    db.users.push(adminUser, agent2, agent1, general)
  }

  const ensureProduct = (input: Omit<Product, 'id' | 'createdAt'>): Product => {
    const existing = db.products.find((p) => p.title === input.title)
    if (existing) {
      if (!existing.coverImageUrl && input.coverImageUrl) existing.coverImageUrl = input.coverImageUrl
      if (!existing.coverColor && input.coverColor) existing.coverColor = input.coverColor
      if ((!existing.subtitle || existing.subtitle.trim() === '') && input.subtitle) existing.subtitle = input.subtitle
      return existing
    }
    const created: Product = { id: randomUUID(), ...input, createdAt: nowIso() }
    db.products.push(created)
    return created
  }

  const ensureSku = (input: {
    productTitle: string
    skuName: string
    stockQty: number
    publicPriceCents: number
  }): ProductSku | null => {
    const productId = db.products.find((p) => p.title === input.productTitle)?.id ?? null
    if (!productId) return null
    const existing = db.skus.find((s) => s.productId === productId && s.skuName === input.skuName)
    if (existing) return existing
    const created: ProductSku = {
      id: randomUUID(),
      productId,
      skuName: input.skuName,
      stockQty: input.stockQty,
      publicPriceCents: input.publicPriceCents,
    }
    db.skus.push(created)
    return created
  }

  const ensurePriceRule = (skuId: string, role: UserRole, level: UserLevel, cents: number): void => {
    const existing = db.priceRules.find((r) => r.skuId === skuId && r.role === role && r.level === level)
    if (existing) return
    db.priceRules.push({ id: randomUUID(), skuId, role, level, priceCents: cents })
  }

  const ensurePricingForSku = (sku: ProductSku): void => {
    const vip = Math.max(100, sku.publicPriceCents - 1000)
    ensurePriceRule(sku.id, 'customer', 'customer_vip', vip)
    ensurePriceRule(sku.id, 'agent', 'agent_2', Math.max(100, vip - 1000))
    ensurePriceRule(sku.id, 'agent', 'agent_1', Math.max(100, vip - 1700))
    ensurePriceRule(sku.id, 'agent', 'agent_general', Math.max(100, vip - 2200))
  }

  ;[
    {
      title: '御承美·植萃净润洗发露',
      subtitle: '草本原生气息，清爽不紧绷，发根更轻盈',
      coverColor: '#0B2B21',
      coverImageUrl: toImageUrl(
        'premium herbal shampoo pump bottle, dark emerald label, minimal off-white studio background, soft diffused lighting, high-end cosmetic photography, realistic',
        'square_hd',
      ),
      status: 'active' as const,
    },
    {
      title: '御承美·植萃顺泽护发乳',
      subtitle: '柔润顺滑，触感更细腻，发丝更服帖',
      coverColor: '#1F3A2E',
      coverImageUrl: toImageUrl(
        'premium herbal hair conditioner pump bottle, dark emerald label, minimal off-white studio background, soft diffused lighting, high-end cosmetic photography, realistic',
        'square_hd',
      ),
      status: 'active' as const,
    },
    {
      title: '御承美·植萃沁润头皮精华液',
      subtitle: '清透质地，轻盈不黏，日常护理更舒适',
      coverColor: '#12362B',
      coverImageUrl: toImageUrl(
        'premium scalp essence amber dropper bottle, dark emerald label, minimal off-white studio background, soft diffused lighting, high-end cosmetic photography, realistic',
        'square_hd',
      ),
      status: 'active' as const,
    },
    {
      title: '御承美·植萃柔顺发膜',
      subtitle: '细腻柔润，发丝更服帖，触感更顺滑',
      coverColor: '#163B31',
      coverImageUrl: toImageUrl(
        'premium hair mask jar with lid, dark emerald label, minimal off-white studio background, soft diffused lighting, high-end cosmetic photography, realistic',
        'square_hd',
      ),
      status: 'active' as const,
    },
  ].forEach((p) => ensureProduct(p))

  ;[
    { productTitle: '御承美·植萃净润洗发露', skuName: '300ml', stockQty: 999, publicPriceCents: 7900 },
    { productTitle: '御承美·植萃顺泽护发乳', skuName: '300ml', stockQty: 999, publicPriceCents: 8900 },
    { productTitle: '御承美·植萃沁润头皮精华液', skuName: '60ml', stockQty: 999, publicPriceCents: 9900 },
    { productTitle: '御承美·植萃柔顺发膜', skuName: '200g', stockQty: 999, publicPriceCents: 10900 },
  ].forEach((s) => ensureSku(s))

  for (const sku of db.skus) {
    ensurePricingForSku(sku)
  }

  if (db.radarTemplate.length === 0) {
    db.radarTemplate.push(
      { id: randomUUID(), key: 'acquire', title: '获客', maxScore: 10 },
      { id: randomUUID(), key: 'convert', title: '转化', maxScore: 10 },
      { id: randomUUID(), key: 'repurchase', title: '复购', maxScore: 10 },
      { id: randomUUID(), key: 'content', title: '内容分享', maxScore: 10 },
      { id: randomUUID(), key: 'team', title: '团队协作', maxScore: 10 },
    )
  }

  if (db.agentCases.length === 0) {
    const agent = db.users.find((u) => u.role === 'agent') ?? null
    if (agent) {
      db.agentCases.push(
        {
          id: randomUUID(),
          userId: agent.id,
          title: '客户想要更清爽触感时如何推荐组合？',
          difficulty: 'medium',
          solution:
            '先问清使用频率与头皮感受，再建议洗发露用量分区控制，搭配护发乳只涂发中发尾；强调“触感更轻盈、顺滑不压塌”。',
          likeCount: 0,
          createdAt: nowIso(),
        },
        {
          id: randomUUID(),
          userId: agent.id,
          title: '客户对价格敏感时怎么引导体验？',
          difficulty: 'hard',
          solution:
            '不直接谈功效，先让客户描述当前困扰与想要的“手感/香气/清爽度”；给出一套可执行的使用方法与周期建议，用体验结果替代承诺式话术。',
          likeCount: 0,
          createdAt: nowIso(),
        },
      )
    }
  }

  return db
}

let cached: Db | null = null

export const loadDb = async (): Promise<Db> => {
  if (cached) return cached
  await ensureDir()
  try {
    const raw = await fs.readFile(dbFile, 'utf-8')
    const parsed = JSON.parse(raw) as Db
    cached = seedDb(parsed)
  } catch {
    cached = seedDb(createEmptyDb())
  }
  await saveDb(cached)
  return cached
}

export const saveDb = async (db: Db): Promise<void> => {
  await ensureDir()
  await fs.writeFile(dbFile, JSON.stringify(db, null, 2), 'utf-8')
}

export const generateId = () => randomUUID()
export const now = () => nowIso()
