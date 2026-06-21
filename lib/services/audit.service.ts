import { prisma } from '@/lib/prisma';

export class AuditService {
  static async logAction(
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    details?: Record<string, any>,
    status: string = 'SUCCESS'
  ) {
    const auditLog = await prisma.auditLog.create({
      data: {
        userId,
        action,
        resource,
        resourceId,
        details: details || {},
        status,
        ipAddress: '0.0.0.0',
        userAgent: '',
      },
    });

    return auditLog;
  }

  static async getAuditLogs(userId: string, filters?: { resource?: string; action?: string }) {
    return await prisma.auditLog.findMany({
      where: {
        userId,
        ...(filters?.resource && { resource: filters.resource }),
        ...(filters?.action && { action: filters.action }),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  static async getResourceAuditHistory(userId: string, resource: string, resourceId: string) {
    return await prisma.auditLog.findMany({
      where: {
        userId,
        resource,
        resourceId,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async logSecurityEvent(
    userId: string,
    eventType: string,
    details: Record<string, any>,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM'
  ) {
    return await prisma.securityEvent.create({
      data: {
        userId,
        type: eventType,
        details,
        severity,
      },
    });
  }

  static async getSecurityEvents(userId: string, days: number = 7) {
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);

    return await prisma.securityEvent.findMany({
      where: {
        userId,
        createdAt: { gte: dateFrom },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
