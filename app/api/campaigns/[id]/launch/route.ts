import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { CampaignService } from '@/lib/services/campaign.service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(
        errorResponse('Unauthorized'),
        { status: 401 }
      );
    }

    const result = await CampaignService.launchCampaign(params.id, auth.id);

    return NextResponse.json(
      successResponse('Campaign launched successfully', { result })
    );
  } catch (error: any) {
    console.error('POST /api/campaigns/:id/launch error:', error);
    return NextResponse.json(
      errorResponse(error.message),
      { status: 400 }
    );
  }
}
