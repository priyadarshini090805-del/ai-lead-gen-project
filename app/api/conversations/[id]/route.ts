import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { ConversationService } from '@/lib/services/conversation.service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json(errorResponse('Unauthorized'), { status: 401 });
    }

    const { id } = await params;
    const result = await ConversationService.getConversationMessages(auth.id, id);

    return NextResponse.json(successResponse('Conversation retrieved', result));
  } catch (error: any) {
    console.error('GET /api/conversations/:id error:', error);
    return NextResponse.json(errorResponse(error.message), { status: 500 });
  }
}
