import { NextRequest } from 'next/server';
import { verifyAuth } from '@/lib/auth/verify';
import { successResponse, errorResponse } from '@/lib/response';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/campaigns/outreach-history
 * Query params:
 *  - campaignId?: filter by specific campaign
 *  - leadId?: filter by specific lead
 *  - status?: SENT | DELIVERED | OPENED | REPLIED | FAILED | SKIPPED
 *  - page?: number (default 1)
 *  - limit?: number (default 25, max 100)
 *
 * Returns paginated CampaignWorkflowJob records with campaign + lead info
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request);
    const sp = request.nextUrl.searchParams;

    const campaignId = sp.get('campaignId') || undefined;
    const leadId = sp.get('leadId') || undefined;
    const status = sp.get('status') || undefined;
    const page = Math.max(1, parseInt(sp.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') || '25', 10)));
    const skip = (page - 1) * limit;

    // Verify ownership via campaign
    const where: any = {
      campaign: { userId: auth.id },
    };
    if (campaignId) where.campaignId = campaignId;
    if (leadId) where.leadId = leadId;
    if (status) where.status = status;

    const [jobs, total] = await Promise.all([
      prisma.campaignWorkflowJob.findMany({
        where,
        include: {
          campaign: { select: { id: true, name: true, status: true } },
          lead: { select: { id: true, firstName: true, lastName: true, email: true, company: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.campaignWorkflowJob.count({ where }),
    ]);

    // Aggregate stats per campaign
    const statsByStatus = await prisma.campaignWorkflowJob.groupBy({
      by: ['status'],
      where: { campaign: { userId: auth.id }, ...(campaignId ? { campaignId } : {}) },
      _count: true,
    });

    const summary: Record<string, number> = {};
    statsByStatus.forEach((s) => { summary[s.status] = s._count; });

    return successResponse({
      jobs,
      summary,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    });
  } catch (e: any) {
    return errorResponse(e.message, 500);
  }
}
