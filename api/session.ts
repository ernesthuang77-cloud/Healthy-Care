import { randomBytes } from 'crypto'

const sessions = new Map<string, { userId: string; createdAt: number }>()

export const createSessionToken = (userId: string) => {
  const token = randomBytes(24).toString('hex')
  sessions.set(token, { userId, createdAt: Date.now() })
  return token
}

export const getSessionUserId = (token: string) => {
  const s = sessions.get(token)
  return s?.userId ?? null
}

export const deleteSessionToken = (token: string) => {
  sessions.delete(token)
}

