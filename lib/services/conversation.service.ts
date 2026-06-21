import { prisma } from '@/lib/prisma';

export class ConversationService {
  static async getOrCreateConversation(userId: string, leadId: string, platform: string) {
    let conversation = await prisma.conversation.findFirst({
      where: { userId, leadId, platform },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          userId,
          leadId,
          platform,
          lastMessageAt: new Date(),
        },
      });
    }

    return conversation;
  }

  static async sendMessage(
    userId: string,
    conversationId: string,
    sender: 'user' | 'lead',
    content: string,
    isAiSuggested: boolean = false
  ) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) throw new Error('Conversation not found');

    const message = await prisma.message.create({
      data: {
        conversationId,
        sender,
        content,
        isAiSuggested,
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    });

    return message;
  }

  static async getConversationHistory(userId: string, conversationId: string, limit: number = 50) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: limit },
        lead: true,
      },
    });

    if (!conversation) throw new Error('Conversation not found');
    return conversation;
  }

  static async getUserConversations(userId: string, platform?: string) {
    return await prisma.conversation.findMany({
      where: {
        userId,
        ...(platform && { platform }),
      },
      include: {
        lead: true,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  static async markAsRead(userId: string, conversationId: string) {
    return await prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: 0 },
    });
  }

  static async incrementUnread(conversationId: string, count: number = 1) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) return;

    return await prisma.conversation.update({
      where: { id: conversationId },
      data: { unreadCount: (conversation.unreadCount || 0) + count },
    });
  }

  static async deleteConversation(userId: string, conversationId: string) {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) throw new Error('Conversation not found');

    await prisma.message.deleteMany({ where: { conversationId } });
    await prisma.conversation.delete({ where: { id: conversationId } });
  }

  static async searchConversations(userId: string, query: string) {
    return await prisma.conversation.findMany({
      where: {
        userId,
        lead: {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
      },
      include: { lead: true },
    });
  }

  static async getUnreadConversations(userId: string) {
    return await prisma.conversation.findMany({
      where: {
        userId,
        unreadCount: { gt: 0 },
      },
      include: { lead: true },
    });
  }
}
