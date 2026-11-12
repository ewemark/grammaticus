import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

// Augment Express Request with auth payload fields
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: number
      username?: string
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || ''
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET 环境变量未设置。请在 .env 中添加 JWT_SECRET=your-random-string')
}

export interface AuthPayload {
  userId: number
  username: string
}

/** Attach req.userId if valid token present, but don't block if absent */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return next()
  }
  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload
    req.userId = payload.userId
    req.username = payload.username
  } catch {
    // Token invalid, just don't set userId
  }
  next()
}

/** Require valid token — 401 if missing or invalid */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: '请先登录' })
    return
  }
  const token = header.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload
    req.userId = payload.userId
    req.username = payload.username
    next()
  } catch {
    res.status(401).json({ error: '登录已过期，请重新登录' })
  }
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}
