import { prisma } from '@/lib/prisma';

/**
 * Analytics service — reads engagement from CampaignLead (the real source of
 * truth: status PENDING/SENT/OPENED/REPLIED/FAILED/SKIPPED + sentAt/openedAt/repliedAt).
 * Campaign status comes from CampaignStatus enum (DRAFT/ACTIVE/PAUSED/COMPLETED/ARCHIVED).
 */
function round(n: number): number {
  return Math.round(n * 100) / 100;
}

export class AnalyticsService {
  static async getKPISummary(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [leads, campaigns, campaignLeads] = await Promise.all([
      prisma.lead.findMany({ where: { userId }, select: { status: true, createdAt: true } }),
      prisma.campaign.findMany({ where: { userId }, select: { status: true } }),
      prisma.campaignLead.findMany({
        where: { campaign: { userId } },
        select: { sentAt: true, openedAt: true, repliedAt: true },
      }),
    ]);

    const totalLeads = leads.length;
    const newLeadsToday = leads.filter((l) => l.createdAt >= today).length;
    const contactedLeads = leads.filter((l) => l.status === 'CONTACTED').length;
    const qualifiedLeads = leads.filter((l) => l.status === 'QUALIFIED').length;
    const convertedLeads = leads.filter((l) => l.status === 'CONVERTED').length;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE').length;
    const completedCampaigns = campaigns.filter((c) => c.status === 'COMPLETED').length;

    const messagesSent = campaignLeads.filter((m) => m.sentAt !== null).length;
    const messagesOpened = campaignLeads.filter((m) => m.openedAt !== null).length;
    const messagesReplied = campaignLeads.filter((m) => m.repliedAt !== null).length;
    const openRate = messagesSent > 0 ? (messagesOpened / messagesSent) * 100 : 0;
    const replyRate = messagesSent > 0 ? (messagesReplied / messagesSent) * 100 : 0;

    return {
      totalLeads, newLeadsToday, contactedLeads, qualifiedLeads, convertedLeads,
      conversionRate: round(conversionRate),
      activeCampaigns, completedCampaigns,
      messagesSent, messagesOpened, messagesReplied,
      openRate: round(openRate), replyRate: round(replyRate),
    };
  }

  static async getCampaignMetrics(userId: string) {
    const campaigns = await prisma.campaign.findMany({
      where: { userId },
      include: { leads: true },
      orderBy: { createdAt: 'desc' },
    });

    return campaigns.map((campaign) => {
      const sent = campaign.leads.filter((l) => l.sentAt !== null).length;
      const opened = campaign.leads.filter((l) => l.openedAt !== null).length;
      const replied = campaign.leads.filter((l) => l.repliedAt !== null).length;
      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        totalLeads: campaign.leads.length,
        messagesSent: sent,
        messagesOpened: opened,
        messagesReplied: replied,
        openRate: sent > 0 ? round((opened / sent) * 100) : 0,
        replyRate: sent > 0 ? round((replied / sent) * 100) : 0,
      };
    });
  }

  static async getLeadFunnel(userId: string) {
    const leads = await prisma.lead.findMany({ where: { userId }, select: { status: true } });
    const statuses = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST'] as const;
    return statuses.map((status) => {
      const count = leads.filter((l) => l.status === status).length;
      return { status, count, percentage: leads.length > 0 ? round((count / leads.length) * 100) : 0 };
    });
  }

  static async exportAnalytics(userId: string, dateFrom: Date, dateTo: Date): Promise<string> {
    const [leads, campaigns] = await Promise.all([
      prisma.lead.findMany({ where: { userId, createdAt: { gte: dateFrom, lte: dateTo } } }),
      prisma.campaign.findMany({
        where: { userId, createdAt: { gte: dateFrom, lte: dateTo } },
        include: { leads: true },
      }),
    ]);
    let csv = 'Type,Name/Email,Count,Status\n';
    leads.forEach((lead) => { csv += `Lead,"${lead.email}",1,${lead.status}\n`; });
    campaigns.forEach((c) => { csv += `Campaign,"${c.name}",${c.leads.length},${c.status}\n`; });
    return csv;
  }

  static async getAnalyticsRange(userId: string, dateFrom: Date, dateTo: Date) {
    const [leads, campaigns, generations] = await Promise.all([
      prisma.lead.findMany({ where: { userId, createdAt: { gte: dateFrom, lte: dateTo } } }),
      prisma.campaign.findMany({ where: { userId, createdAt: { gte: dateFrom, lte: dateTo } } }),
      prisma.aIGeneration.findMany({
        where: { userId, createdAt: { gte: dateFrom, lte: dateTo } },
        select: { tokensUsed: true },
      }),
    ]);
    return {
      period: { from: dateFrom, to: dateTo },
      totalLeads: leads.length,
      totalCampaigns: campaigns.length,
      messagesGenerated: generations.length,
      tokensUsed: generations.reduce((s, g) => s + g.tokensUsed, 0),
      convertedLeads: leads.filter((l) => l.status === 'CONVERTED').length,
    };
  }
}
