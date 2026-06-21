import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/services/notification.service';

/**
 * LinkedIn webhook — receives Lead Gen Form notifications and engagement events.
 * Requires LinkedIn Marketing Developer Platform approval for lead sync.
 * GET handles LinkedIn's challenge verification.
 */
export async function GET(request: NextRequest) {
  const challengeCode = request.nextUrl.searchParams.get('challengeCode');
  if (challengeCode) {
    const secret = process.env.LINKEDIN_CLIENT_SECRET || '';
    const challengeResponse = crypto.createHmac('sha256', secret).update(challengeCode).digest('hex');
    return NextResponse.json({ challengeCode, challengeResponse });
  }
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const event = JSON.parse(body || '{}');

    // Find the owning user: single-tenant default = first active LinkedIn integration
    const integration = await prisma.integration.findFirst({
      where: { provider: 'LINKEDIN', status: 'ACTIVE' },
    });
    if (!integration) {
      return NextResponse.json({ ok: true, note: 'no active linkedin integration' });
    }

    await prisma.webhookEvent.create({
      data: {
        integrationId: integration.id,
        eventType: event.type || event.eventType || 'LINKEDIN_EVENT',
        payload: body.slice(0, 60000),
      },
    });

    // Lead Gen Form response notification
    const leadData = extractLead(event);
    if (leadData?.email || leadData?.name) {
      const [firstName, ...rest] = (leadData.name || 'LinkedIn Lead').split(/\s+/);
      const externalId = leadData.externalId ? `linkedin:${leadData.externalId}` : undefined;

      const existing = externalId
        ? await prisma.lead.findFirst({ where: { userId: integration.userId, externalId } })
        : leadData.email
          ? await prisma.lead.findFirst({ where: { userId: integration.userId, email: leadData.email } })
          : null;

      if (!existing) {
        const lead = await prisma.lead.create({
          data: {
            userId: integration.userId,
            firstName: firstName || 'LinkedIn',
            lastName: rest.join(' ') || 'Lead',
            email: leadData.email || `unknown+${Date.now()}@linkedin.lead`,
            company: leadData.company,
            jobTitle: leadData.jobTitle,
            source: 'LINKEDIN',
            externalId,
            status: 'NEW',
            notes: leadData.notes,
          },
        });
        await NotificationService.create(integration.userId, {
          type: 'NEW_LEAD',
          title: `New LinkedIn lead: ${leadData.name || leadData.email}`,
          body: leadData.notes || 'Captured from LinkedIn',
          link: '/dashboard/leads',
          metadata: { leadId: lead.id, source: 'LINKEDIN' },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('LinkedIn webhook error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

function extractLead(event: any): { name?: string; email?: string; company?: string; jobTitle?: string; notes?: string; externalId?: string } | null {
  // LinkedIn Lead Notification format
  if (event?.leadGenFormResponse || event?.formResponse) {
    const r = event.leadGenFormResponse || event.formResponse;
    const answers: Record<string, string> = {};
    for (const a of r.answers || []) {
      answers[(a.question || a.name || '').toLowerCase()] = a.answer || a.value || '';
    }
    return {
      name: answers['full name'] || [answers['first name'], answers['last name']].filter(Boolean).join(' '),
      email: answers['email'] || answers['email address'],
      company: answers['company'] || answers['company name'],
      jobTitle: answers['job title'],
      notes: JSON.stringify(answers).slice(0, 1000),
      externalId: r.id || r.responseId,
    };
  }
  // Engagement event (comment/reaction on a post)
  if (event?.type === 'SOCIAL_ACTION' || event?.comment || event?.reaction) {
    const actor = event.actor || event.comment?.actor || {};
    return {
      name: actor.name || 'LinkedIn engagement',
      email: undefined,
      notes: `Engaged with your post: ${event.comment?.message || event.reaction?.type || 'interaction'}`,
      externalId: event.id,
    };
  }
  // Simple/custom format
  if (event?.lead) {
    return {
      name: event.lead.name,
      email: event.lead.email,
      company: event.lead.company,
      notes: event.lead.message,
      externalId: event.lead.id,
    };
  }
  return null;
}
