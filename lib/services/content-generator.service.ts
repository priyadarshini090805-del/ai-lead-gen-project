import { prisma } from '@/lib/prisma';

export class ContentGenerator {
  static async generateLinkedInPost(topic: string, tone: string): Promise<string> {
    const templates: Record<string, string> = {
      PROFESSIONAL: `🎯 ${topic}

Key insights from recent work:
- Building sustainable solutions
- Driving meaningful impact
- Collaborating across teams

Excited to share more details. What's your take?

#${topic.replace(/ /g, '')}`,

      FRIENDLY: `Hey everyone! 👋

Just finished working on something interesting about ${topic}. 

Learned some great lessons along the way and would love to hear your thoughts!

Drop a comment below 👇`,

      CONSULTATIVE: `Question for the community:

How do you approach ${topic}?

I've been exploring different strategies and found that the best approach depends on:
1. Your specific context
2. Available resources
3. Team capabilities

Curious to hear your experiences!`,
    };

    return templates[tone] || templates['PROFESSIONAL'];
  }

  static async generateInstagramCaption(topic: string, tone: string): Promise<string> {
    const templates: Record<string, string> = {
      PROFESSIONAL: `Exploring ${topic} 📸

New post up on the blog! Link in bio.`,

      FRIENDLY: `OMG have you seen this? 😍

${topic} is absolutely 🔥

Tag someone you'd share this with! 👇`,

      CONSULTATIVE: `What do YOU think about ${topic}? 🤔

Drop your thoughts in the comments!`,
    };

    return templates[tone] || templates['PROFESSIONAL'];
  }

  static async generateJobPost(position: string, company: string): Promise<string> {
    return `${company} is hiring!

Position: ${position}

About the role:
- Lead transformative projects
- Work with talented teams
- Grow your skills

Ready to make an impact? Apply now!

#Hiring #${position.replace(/ /g, '')}`;
  }

  static async generateVideoScript(topic: string): Promise<string> {
    return `[INTRO - 0-5s]
"Hey everyone! Today we're diving into ${topic}."

[MAIN - 5-45s]
"The key points are...
First: Understanding the basics
Second: Implementation
Third: Best practices"

[OUTRO - 45-60s]
"Drop a comment if you found this helpful!
Don't forget to subscribe!"`;
  }

  static async generateSalesContent(
    productName: string,
    valueProposition: string
  ): Promise<string> {
    return `Introducing ${productName}

Transform your workflow with:
${valueProposition}

Key Benefits:
✅ Save time
✅ Reduce costs
✅ Improve quality

Ready to get started? Schedule a demo today!`;
  }

  static async generateCompanyAnnouncement(
    announcement: string,
    details: string
  ): Promise<string> {
    return `📢 COMPANY ANNOUNCEMENT

${announcement}

${details}

We're excited about this development and look forward to sharing more updates soon!

Thank you for your continued support.`;
  }

  static async generateContentSeries(topic: string, count: number): Promise<string[]> {
    const series: string[] = [];

    for (let i = 1; i <= Math.min(count, 5); i++) {
      series.push(`Part ${i}: ${topic} - Deep dive into aspect ${i}

Content here...`);
    }

    return series;
  }
}
