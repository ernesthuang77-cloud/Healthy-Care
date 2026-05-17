import type { NextFunction, Request, Response } from 'express'
import { loadDb, type User, type UserRole } from './db.js'
import { getSessionUserId } from './session.js'

export type AuthedRequest = Request & { user: User }

export const requireUser = async (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization
  const token = auth?.startsWith('Bearer ') ? auth.slice('Bearer '.length) : ''
  if (!token) {
    res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    return
  }
  const userId = getSessionUserId(token)
  if (!userId) {
    res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    return
  }
  const db = await loadDb()
  const user = db.users.find((u) => u.id === userId)
  if (!user) {
    res.status(401).json({ success: false, error: 'UNAUTHORIZED' })
    return
  }
  ;(req as AuthedRequest).user = user
  next()
}

export const requireRole = (roles: UserRole[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await requireUser(req, res, () => {
      const user = (req as AuthedRequest).user
      if (!roles.includes(user.role)) {
        res.status(403).json({ success: false, error: 'FORBIDDEN' })
        return
      }
      next()
    })
  }
}

