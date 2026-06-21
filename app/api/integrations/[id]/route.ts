import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { IntegrationService } from '@/lib/services/integration.service';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });
    }

    const { id } = await params;
    const result = await IntegrationService.disconnectIntegration(id);

    return NextResponse.json(
      successResponse('Integration disconnected', result)
    );
  } catch (error: any) {
    console.error('DELETE /api/integrations/:id error:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
