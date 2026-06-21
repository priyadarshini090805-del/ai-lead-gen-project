import { prisma } from '@/lib/prisma';
import { addOutreachJob } from '@/lib/queue';

export class WorkflowExecutor {
  static async executeWorkflowStep(
    workflowId: string,
    stepNumber: number,
    leadId: string,
    campaignLeadId: string
  ) {
    try {
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
        include: { steps: { where: { stepNumber } } },
      });

      if (!workflow || workflow.steps.length === 0) {
        throw new Error('Workflow or step not found');
      }

      const step = workflow.steps[0];

      switch (step.type) {
        case 'MESSAGE':
          return await this.executeMessageStep(
            campaignLeadId,
            leadId,
            step.messageTemplate || 'Default message'
          );

        case 'DELAY':
          return await this.executeDelayStep(step.delayMinutes || 0);

        case 'CONDITION':
          return await this.executeConditionStep(step.condition || '');

        case 'BRANCH':
          return await this.executeBranchStep(leadId);

        default:
          throw new Error('Unknown step type');
      }
    } catch (error) {
      console.error('Error executing workflow step:', error);
      throw error;
    }
  }

  private static async executeMessageStep(
    campaignLeadId: string,
    leadId: string,
    message: string
  ) {
    // Resolve the campaignId from the campaignLead so we can enqueue a
    // correctly-shaped OutreachJobData object (the previous 4-positional-arg
    // call did not match addOutreachJob's signature).
    const campaignLead = await prisma.campaignLead.findUnique({
      where: { id: campaignLeadId },
      select: { campaignId: true },
    });
    if (!campaignLead) {
      throw new Error('CampaignLead not found');
    }
    await addOutreachJob({ campaignId: campaignLead.campaignId, leadId, message });
    return { type: 'MESSAGE', executed: true };
  }

  private static async executeDelayStep(delayMinutes: number) {
    const delayMs = delayMinutes * 60 * 1000;
    return { type: 'DELAY', delayMs, executed: true };
  }

  private static async executeConditionStep(condition: string) {
    // Evaluate condition logic
    const canProceed = this.evaluateCondition(condition);
    return { type: 'CONDITION', canProceed, executed: true };
  }

  private static async executeBranchStep(leadId: string) {
    // Check lead status to determine branch
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    return {
      type: 'BRANCH',
      status: lead?.status,
      executed: true,
    };
  }

  private static evaluateCondition(condition: string): boolean {
    // Basic condition evaluation
    if (condition.includes('replied')) return true;
    if (condition.includes('opened')) return true;
    if (condition.includes('qualified')) return true;
    return false;
  }

  static async getNextStep(workflowId: string, currentStep: number) {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: { steps: { orderBy: { stepNumber: 'asc' } } },
    });

    if (!workflow) return null;

    const nextStep = workflow.steps.find(s => s.stepNumber > currentStep);
    return nextStep || null;
  }

  static async completeWorkflowForLead(
    workflowId: string,
    leadId: string,
    campaignId: string
  ) {
    const campaignLead = await prisma.campaignLead.findUnique({
      where: { campaignId_leadId: { campaignId, leadId } },
    });

    if (campaignLead) {
      await prisma.campaignLead.update({
        where: { id: campaignLead.id },
        data: { status: 'REPLIED' },
      });
    }

    return { success: true, leadId, campaignId };
  }
}
