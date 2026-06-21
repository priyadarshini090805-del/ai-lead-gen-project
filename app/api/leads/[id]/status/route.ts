import { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth/crypto'
import { verifyAuth } from '@/lib/auth/verify'
import { leadService } from '@/lib/services/lead.service'
import { successResponse, unauthorizedResponse, internalErrorResponse, notFoundResponse, validationErrorResponse } from '@/lib/api-response'
import { ZodError } from 'zod'
import { z } from 'zod'

const statusSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST']),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get token from header
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

    const decoded = await verifyAuth(request).catch(() => null)
    if (!decoded) {
      return unauthorizedResponse('Invalid token')
    }

    const body = await request.json()

    // Validate input
    let validatedData
    try {
      validatedData = statusSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        return validationErrorResponse(error.flatten().fieldErrors as Record<string, string[]>)
      }
      throw error
    }

    const lead = await leadService.changeStatus(decoded.id, params.id, validatedData.status, request)

    return successResponse({ lead }, 'Lead status updated successfully')
  } catch (error: any) {
    if (error.message === 'Lead not found or unauthorized') {
      return notFoundResponse('Lead not found')
    }
    console.error('Change status error:', error)
    return internalErrorResponse('Failed to update lead status')
  }
}
