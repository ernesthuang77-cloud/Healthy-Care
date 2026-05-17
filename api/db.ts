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
  if (db.users.length > 0) return db

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

  const productA: Product = {
    id: randomUUID(),
    title: '御承美·植萃净润洗发露',
    subtitle: '草本原生气息，清爽不紧绷，发根更轻盈',
    coverColor: '#0B2B21',
    status: 'active',
    createdAt: nowIso(),
  }
  const productB: Product = {
    id: randomUUID(),
    title: '御承美·植萃顺泽护发乳',
    subtitle: '柔润顺滑，触感更细腻，发丝更服帖',
    coverColor: '#1F3A2E',
    status: 'active',
    createdAt: nowIso(),
  }
  db.products.push(productA, productB)

  const skuA1: ProductSku = {
    id: randomUUID(),
    productId: productA.id,
    skuName: '300ml',
    stockQty: 999,
    publicPriceCents: 7900,
  }
  const skuB1: ProductSku = {
    id: randomUUID(),
    productId: productB.id,
    skuName: '300ml',
    stockQty: 999,
    publicPriceCents: 8900,
  }
  db.skus.push(skuA1, skuB1)

  const mkRule = (skuId: string, role: UserRole, level: UserLevel, cents: number): PriceRule => ({
    id: randomUUID(),
    skuId,
    role,
    level,
    priceCents: cents,
  })

  db.priceRules.push(
    mkRule(skuA1.id, 'customer', 'customer_vip', 6900),
    mkRule(skuB1.id, 'customer', 'customer_vip', 7900),
    mkRule(skuA1.id, 'agent', 'agent_2', 5900),
    mkRule(skuB1.id, 'agent', 'agent_2', 6900),
    mkRule(skuA1.id, 'agent', 'agent_1', 5200),
    mkRule(skuB1.id, 'agent', 'agent_1', 6200),
    mkRule(skuA1.id, 'agent', 'agent_general', 4700),
    mkRule(skuB1.id, 'agent', 'agent_general', 5700),
  )

  db.radarTemplate.push(
    { id: randomUUID(), key: 'acquire', title: '获客', maxScore: 10 },
    { id: randomUUID(), key: 'convert', title: '转化', maxScore: 10 },
    { id: randomUUID(), key: 'repurchase', title: '复购', maxScore: 10 },
    { id: randomUUID(), key: 'content', title: '内容分享', maxScore: 10 },
    { id: randomUUID(), key: 'team', title: '团队协作', maxScore: 10 },
  )

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
