import type { Request } from 'express'
import { loadDb, type User } from './db.js'
import { getSessionUserId } from './session.js'

export const getOptionalUser = async (req: Request): Promise<User | null> => {
  const auth = req.headers.authorization
  const token = auth?.startsWith('Bearer ') ? auth.slice('Bearer '.length) : ''
  if (!token) return null
  const userId = getSessionUserId(token)
  if (!userId) return null
  const db = await loadDb()
  return db.users.find((u) => u.id === userId) ?? null
}

