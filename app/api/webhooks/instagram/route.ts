import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { NotificationService } from '@/lib/services/notification.service';

/** Instagram webhook: verification (GET) + comments/messages → leads (POST). */
export async function GET(request: NextRequest) {
  const mode = request.nextUrl.searchParams.get('hub.mode');
  const token = request.nextUrl.searchParams.get('hub.verify_token');
  const challenge = request.nextUrl.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.INSTAGRAM_WEBHOOK_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-hub-signature-256');
    const body = await request.text();

    if (process.env.INSTAGRAM_CLIENT_SECRET && signature) {
      const expected = 'sha256=' + crypto
        .createHmac('sha256', process.env.INSTAGRAM_CLIENT_SECRET)
        .update(body)
        .digest('hex');
      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const event = JSON.parse(body || '{}');
    const integration = await prisma.integration.findFirst({
      where: { provider: 'INSTAGRAM', status: 'ACTIVE' },
    });
    if (!integration) return NextResponse.json({ ok: true });

    await prisma.webhookEvent.create({
      data: {
        integrationId: integration.id,
        eventType: event.object || 'INSTAGRAM_EVENT',
        payload: body.slice(0, 60000),
      },
    });

    for (const entry of event.entry || []) {
      // Direct messages
      for (const m of entry.messaging || []) {
        if (m.message?.text) {
          await captureLead(integration.userId, {
            handle: String(m.sender?.id || ''),
            note: m.message.text,
            kind: 'DM',
          });
        }
      }
      // Comments
      for (const change of entry.changes || []) {
        if (change.field === 'comments' && change.value?.text) {
          await captureLead(integration.userId, {
            handle: change.value?.from?.username || String(change.value?.from?.id || ''),
            note: change.value.text,
            kind: 'comment',
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Instagram webhook error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

async function captureLead(userId: string, data: { handle: string; note: string; kind: string }) {
  if (!data.handle) return;
  const externalId = `instagram:${data.handle}`;
  const existing = await prisma.lead.findFirst({ where: { userId, externalId } });
  if (existing) {
    await prisma.leadActivity.create({
      data: {
        leadId: existing.id,
        activityType: 'NOTE_ADDED',
        description: `Instagram ${data.kind}: ${data.note.slice(0, 500)}`,
      },
    }).catch(() => null);
    return;
  }
  const lead = await prisma.lead.create({
    data: {
      userId,
      firstName: data.handle,
      lastName: '(Instagram)',
      email: `${data.handle.replace(/[^a-z0-9._-]/gi, '')}@instagram.lead`,
      instagramHandle: data.handle,
      source: 'INSTAGRAM',
      externalId,
      status: 'NEW',
      notes: `Instagram ${data.kind}: ${data.note.slice(0, 900)}`,
    },
  });
  await NotificationService.create(userId, {
    type: 'NEW_LEAD',
    title: `New Instagram lead: @${data.handle}`,
    body: data.note.slice(0, 200),
    link: '/dashboard/leads',
    metadata: { leadId: lead.id, source: 'INSTAGRAM' },
  });
}
