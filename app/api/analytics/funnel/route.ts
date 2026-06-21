import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { AnalyticsService } from '@/lib/services/analytics.service';

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });
    }

    const funnel = await AnalyticsService.getLeadFunnel(auth.id);

    return NextResponse.json(
      successResponse('Lead funnel retrieved', funnel)
    );
  } catch (error: any) {
    console.error('GET /api/analytics/funnel error:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
