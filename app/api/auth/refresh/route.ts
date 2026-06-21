import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken, generateAccessToken, getTokenFromRequest } from '@/lib/auth/crypto'
import { unauthorizedResponse, successResponse, internalErrorResponse } from '@/lib/api-response'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from body or cookie
    const body = await request.json().catch(() => ({}))
    const refreshTokenFromBody = body.refreshToken

    const cookieStore = await cookies()
    const refreshTokenFromCookie = cookieStore.get('refreshToken')?.value

    const refreshToken = refreshTokenFromBody || refreshTokenFromCookie

    if (!refreshToken) {
      return unauthorizedResponse('No refresh token provided')
    }

    // Verify refresh token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    })

    if (!storedToken || storedToken.revokedAt) {
      return unauthorizedResponse('Invalid or revoked refresh token')
    }

    // Check if token has expired
    if (new Date() > storedToken.expiresAt) {
      return unauthorizedResponse('Refresh token has expired')
    }

    // Verify token signature
    const decoded = verifyToken(refreshToken)
    if (!decoded) {
      return unauthorizedResponse('Invalid refresh token')
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: storedToken.userId },
    })

    if (!user || !user.isActive) {
      return unauthorizedResponse('User not found or inactive')
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    })

    // Set new access token cookie
    const newCookieStore = await cookies()
    newCookieStore.set('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
    })

    return successResponse(
      {
        accessToken: newAccessToken,
        refreshToken,
      },
      'Token refreshed successfully'
    )
  } catch (error) {
    console.error('Token refresh error:', error)
    return internalErrorResponse('Failed to refresh token')
  }
}
