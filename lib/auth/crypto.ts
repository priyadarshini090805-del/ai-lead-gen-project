import bcryptjs from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'

const SALT_ROUNDS = 10

export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcryptjs.compare(password, hash)
}

export interface TokenPayload {
  id: string
  email: string
  role: string
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '15m',
    algorithm: 'HS256',
  })
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '7d',
    algorithm: 'HS256',
  })
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload
    return decoded
  } catch {
    return null
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  return authHeader.slice(7)
}

export function generateVerificationToken(): string {
  return jwt.sign(
    { timestamp: Date.now() },
    process.env.JWT_SECRET!,
    {
      expiresIn: '24h',
      algorithm: 'HS256',
    }
  )
}

export function generatePasswordResetToken(): string {
  return jwt.sign(
    { timestamp: Date.now() },
    process.env.JWT_SECRET!,
    {
      expiresIn: '1h',
      algorithm: 'HS256',
    }
  )
}
