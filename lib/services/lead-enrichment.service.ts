import { prisma } from '@/lib/prisma';

export interface EnrichedLeadData {
  company?: string;
  industry?: string;
  companySize?: string;
  location?: string;
  linkedinUrl?: string;
  linkedinHeadline?: string;
  phone?: string;
  website?: string;
  technologies?: string[];
  emailDomain?: string;
}

export class LeadEnrichmentService {
  static async enrichFromLinkedIn(linkedinUrl: string): Promise<EnrichedLeadData> {
    if (!linkedinUrl.includes('linkedin.com')) {
      throw new Error('Invalid LinkedIn URL');
    }

    const enrichmentKey = process.env.ENRICHMENT_API_KEY;
    if (!enrichmentKey) {
      return { linkedinUrl };
    }

    try {
      const response = await fetch('https://api.hunter.io/v2/linkedin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkedin_url: linkedinUrl,
          api_key: enrichmentKey,
        }),
      });

      if (!response.ok) {
        return { linkedinUrl };
      }

      const data: any = await response.json();
      return {
        linkedinUrl,
        linkedinHeadline: data.headline,
        company: data.company?.name,
        industry: data.company?.industry,
        location: data.location,
        emailDomain: data.email_domain,
      };
    } catch (error) {
      console.error('LinkedIn enrichment failed:', error);
      return { linkedinUrl };
    }
  }

  static async enrichEmail(email: string): Promise<EnrichedLeadData> {
    const emailDomain = email.split('@')[1];
    if (!emailDomain) {
      throw new Error('Invalid email');
    }

    try {
      const response = await fetch(`https://api.hunter.io/v2/domain-search?domain=${emailDomain}`);
      if (!response.ok) {
        return { emailDomain };
      }

      const data: any = await response.json();
      return {
        emailDomain,
        company: data.domain,
        website: `https://${emailDomain}`,
        technologies: data.technologies?.map((t: any) => t.name),
      };
    } catch (error) {
      console.error('Email enrichment failed:', error);
      return { emailDomain };
    }
  }

  static async enrichCompany(company: string): Promise<EnrichedLeadData> {
    if (!company || company.length < 2) {
      throw new Error('Company name too short');
    }

    try {
      const response = await fetch(
        `https://api.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(company)}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.CLEARBIT_API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        return {};
      }

      const data: any = await response.json();
      if (!data.results?.[0]) {
        return {};
      }

      const company_data = data.results[0];
      return {
        company: company_data.name,
        industry: company_data.industry,
        companySize: company_data.employeeCount,
        website: company_data.website,
        location: `${company_data.city}, ${company_data.state}, ${company_data.country}`,
      };
    } catch (error) {
      console.error('Company enrichment failed:', error);
      return {};
    }
  }

  static async detectDuplicates(
    userId: string,
    email?: string,
    phone?: string,
    linkedinUrl?: string
  ): Promise<string[]> {
    const duplicates: string[] = [];

    if (email) {
      const existingEmail = await prisma.lead.findFirst({
        where: { userId, email },
        select: { id: true },
      });
      if (existingEmail) {
        duplicates.push(existingEmail.id);
      }
    }

    if (phone) {
      const existingPhone = await prisma.lead.findFirst({
        where: { userId, phone },
        select: { id: true },
      });
      if (existingPhone) {
        duplicates.push(existingPhone.id);
      }
    }

    if (linkedinUrl) {
      const leads = await prisma.lead.findMany({
        where: { userId },
        select: { id: true, tags: true },
      });

      duplicates.push(
        ...leads
          .filter(l => l.tags?.some(t => t.includes(linkedinUrl)))
          .map(l => l.id)
      );
    }

    return [...new Set(duplicates)];
  }

  static async mergeDuplicates(userId: string, primaryLeadId: string, duplicateIds: string[]) {
    const primary = await prisma.lead.findFirst({
      where: { id: primaryLeadId, userId },
    });

    if (!primary) {
      throw new Error('Primary lead not found');
    }

    const duplicates = await prisma.lead.findMany({
      where: { id: { in: duplicateIds }, userId },
    });

    const merged = {
      ...primary,
      phone: primary.phone || duplicates[0]?.phone,
      location: primary.location || duplicates[0]?.location,
      tags: [
        ...new Set([
          ...(primary.tags || []),
          ...duplicates.flatMap(d => d.tags || []),
        ]),
      ],
    };

    await prisma.lead.deleteMany({
      where: { id: { in: duplicateIds } },
    });

    return await prisma.lead.update({
      where: { id: primaryLeadId },
      data: merged,
    });
  }

  static async validateEmail(email: string): Promise<boolean> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }

    try {
      const response = await fetch(`https://api.hunter.io/v2/email-verifier?email=${email}`);
      if (!response.ok) {
        return emailRegex.test(email);
      }

      const data: any = await response.json();
      return data.result === 'deliverable';
    } catch {
      return emailRegex.test(email);
    }
  }

  static async validatePhone(phone: string): Promise<boolean> {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\D/g, ''));
  }
}
