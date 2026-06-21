import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyAuth(request);
    const { id } = await params;

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: payload.id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        lead: true,
      },
    });

    if (!conversation) {
      return errorResponse('Conversation not found', 404);
    }

    return successResponse(conversation);
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await verifyAuth(request);
    const { id } = await params;
    const body = await request.json();

    const conversation = await prisma.conversation.findFirst({
      where: { id, userId: payload.id },
    });

    if (!conversation) {
      return errorResponse('Conversation not found', 404);
    }

    const message = await prisma.message.create({
      data: {
        conversationId: id,
        sender: body.sender,
        content: body.content,
        isAiSuggested: body.isAiSuggested || false,
      },
    });

    return successResponse(message, 'Message sent');
  } catch (error: any) {
    return errorResponse(error.message, 500);
  }
}
