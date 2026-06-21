import { prisma } from '@/lib/prisma';
import { addOutreachJob, addFollowupJob } from '@/lib/queue';

export interface WorkflowExecutionContext {
  campaignId: string;
  leadId: string;
  workflowId: string;
  executionId: string;
  variables: Record<string, any>;
  startTime: Date;
  state: 'running' | 'paused' | 'completed' | 'failed';
}

export class WorkflowRuntimeService {
  static async executeWorkflow(
    campaignId: string,
    leadId: string,
    workflowId: string
  ): Promise<string> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
      include: {
        steps: { orderBy: { stepNumber: 'asc' } },
      },
    });

    if (!workflow || workflow.steps.length === 0) {
      throw new Error('Workflow not found or has no steps');
    }

    const context: WorkflowExecutionContext = {
      campaignId,
      leadId,
      workflowId,
      executionId,
      variables: {},
      startTime: new Date(),
      state: 'running',
    };

    for (const step of workflow.steps) {
      try {
        await this.executeStep(context, step);
      } catch (error) {
        context.state = 'failed';
        throw error;
      }
    }

    context.state = 'completed';
    return executionId;
  }

  static async executeStep(context: WorkflowExecutionContext, step: any): Promise<void> {
    switch (step.type) {
      case 'MESSAGE':
        await this.executeMessageStep(context, step);
        break;
      case 'DELAY':
        await this.executeDelayStep(context, step);
        break;
      case 'CONDITION':
        await this.executeConditionStep(context, step);
        break;
      case 'BRANCH':
        await this.executeBranchStep(context, step);
        break;
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  static async executeMessageStep(context: WorkflowExecutionContext, step: any): Promise<void> {
    const messageContent = step.content?.message || 'Hello, {{firstName}}!';
    const substitutedMessage = messageContent
      .replace('{{firstName}}', context.variables.firstName || '')
      .replace('{{lastName}}', context.variables.lastName || '')
      .replace('{{company}}', context.variables.company || '');

    const lead = await prisma.lead.findUnique({
      where: { id: context.leadId },
    });

    if (!lead) {
      throw new Error('Lead not found');
    }

    // ScheduledMessage is keyed to a CampaignLead; resolve (or create) it first.
    const campaignLead = await prisma.campaignLead.upsert({
      where: { campaignId_leadId: { campaignId: context.campaignId, leadId: context.leadId } },
      update: {},
      create: { campaignId: context.campaignId, leadId: context.leadId, status: 'PENDING' },
    });
    await prisma.scheduledMessage.create({
      data: {
        campaignLeadId: campaignLead.id,
        leadId: context.leadId,
        messageContent: substitutedMessage,
        scheduledFor: new Date(),
      },
    });

    await addOutreachJob({
      campaignId: context.campaignId,
      leadId: context.leadId,
      workflowId: context.workflowId,
    });
  }

  static async executeDelayStep(context: WorkflowExecutionContext, step: any): Promise<void> {
    const delayMs = step.delayMs || 0;
    context.variables.lastDelay = delayMs;
    
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, Math.min(delayMs, 1000)));
    }
  }

  static async executeConditionStep(context: WorkflowExecutionContext, step: any): Promise<void> {
    const condition = step.condition || '';
    const conditionMet = await this.evaluateCondition(context, condition);
    
    if (!conditionMet) {
      context.variables.lastConditionMet = false;
      return;
    }

    context.variables.lastConditionMet = true;
  }

  static async executeBranchStep(context: WorkflowExecutionContext, step: any): Promise<void> {
    const conditionMet = context.variables.lastConditionMet ?? false;
    const nextStepId = conditionMet ? step.branchTrue : step.branchFalse;
    context.variables.nextStepId = nextStepId;
  }

  static async evaluateCondition(context: WorkflowExecutionContext, condition: string): Promise<boolean> {
    try {
      if (condition.includes('{{variable}}')) {
        return context.variables.variable === true;
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  static async pauseExecution(executionId: string): Promise<void> {
    // Update execution state in database
  }

  static async resumeExecution(executionId: string): Promise<void> {
    // Resume execution from pause point
  }

  static async cancelExecution(executionId: string): Promise<void> {
    // Cancel execution and cleanup
  }

  static async getExecutionStatus(executionId: string): Promise<any> {
    // Return execution status and current state
    return {
      id: executionId,
      state: 'completed',
      startTime: new Date(),
      endTime: new Date(),
    };
  }

  static async retryExecution(executionId: string, stepNumber: number): Promise<string> {
    const newExecutionId = `exec_retry_${Date.now()}`;
    // Retry execution from specific step
    return newExecutionId;
  }
}
