import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { IntegrationService } from '@/lib/services/integration.service';
import { z } from 'zod';

const connectSchema = z.object({
  provider: z.enum(['LINKEDIN', 'INSTAGRAM']),
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });
    }

    const body = await request.json();
    const { provider, accessToken, refreshToken, expiresIn } = connectSchema.parse(body);

    let result;

    if (provider === 'LINKEDIN') {
      result = await IntegrationService.connectLinkedIn(
        auth.id,
        accessToken,
        refreshToken,
        expiresIn
      );
    } else {
      result = await IntegrationService.connectInstagram(
        auth.id,
        accessToken,
        refreshToken,
        expiresIn
      );
    }

    return NextResponse.json(
      successResponse(`${provider} connected successfully`, result)
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse('Validation error', error.errors),
        { status: 400 }
      );
    }
    console.error('POST /api/integrations/connect error:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
