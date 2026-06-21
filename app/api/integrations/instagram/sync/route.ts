import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { InstagramService } from '@/lib/services/instagram.service';
import { z } from 'zod';

const syncSchema = z.object({
  action: z.enum(['profile', 'media', 'analytics']).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });
    }

    const body = await request.json();
    const { action } = syncSchema.parse(body);

    const token = request.headers.get('x-instagram-token');
    if (!token) {
      return NextResponse.json(
        errorResponse('Instagram token required'),
        { status: 400 }
      );
    }

    let result;

    switch (action || 'profile') {
      case 'profile':
        result = await InstagramService.syncProfile(auth.id, token);
        break;
      case 'media':
        result = await InstagramService.syncMedia(auth.id, token);
        break;
      case 'analytics':
        result = await InstagramService.getAnalytics(auth.id, token);
        break;
      default:
        result = await InstagramService.syncProfile(auth.id, token);
    }

    return NextResponse.json(
      successResponse('Instagram sync completed', { result })
    );
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        errorResponse('Validation error', error.errors),
        { status: 400 }
      );
    }
    console.error('Instagram sync error:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
