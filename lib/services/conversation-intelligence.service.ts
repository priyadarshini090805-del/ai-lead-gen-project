export type LeadIntent = 'INTERESTED' | 'OBJECTION' | 'READY_TO_BUY' | 'NOT_INTERESTED' | 'NEUTRAL';

export class ConversationIntelligence {
  detectLeadIntent(message: string): LeadIntent {
    const lowerMessage = message.toLowerCase();

    const interestedKeywords = ['interested', 'tell me more', 'how much', 'pricing', 'demo', 'trial'];
    const objectionKeywords = ['but', 'however', 'concerned', 'worried', 'problem', 'issue'];
    const readyKeywords = ['buy', 'purchase', 'sign up', 'let\'s do it', 'yes', 'absolutely', 'ready'];
    const notInterestedKeywords = ['not interested', 'no thanks', 'not now', 'not relevant', 'unsubscribe'];

    let interestedCount = interestedKeywords.filter(kw => lowerMessage.includes(kw)).length;
    let objectionCount = objectionKeywords.filter(kw => lowerMessage.includes(kw)).length;
    let readyCount = readyKeywords.filter(kw => lowerMessage.includes(kw)).length;
    let notInterestedCount = notInterestedKeywords.filter(kw => lowerMessage.includes(kw)).length;

    if (readyCount > 0) return 'READY_TO_BUY';
    if (notInterestedCount > 0) return 'NOT_INTERESTED';
    if (objectionCount > interestedCount) return 'OBJECTION';
    if (interestedCount > 0) return 'INTERESTED';

    return 'NEUTRAL';
  }

  analyzeSentiment(message: string): number {
    const lowerMessage = message.toLowerCase();

    const positiveKeywords = ['great', 'excellent', 'amazing', 'love', 'perfect', 'happy', 'good'];
    const negativeKeywords = ['bad', 'terrible', 'awful', 'hate', 'poor', 'disappointed', 'frustrated'];

    const positiveCount = positiveKeywords.filter(kw => lowerMessage.includes(kw)).length;
    const negativeCount = negativeKeywords.filter(kw => lowerMessage.includes(kw)).length;

    if (positiveCount === 0 && negativeCount === 0) return 0;

    return (positiveCount - negativeCount) / (positiveCount + negativeCount);
  }

  suggestNextAction(leadId: string, lastMessage: string, history: string): string[] {
    const intent = this.detectLeadIntent(lastMessage);

    let suggestions: string[] = [];

    switch (intent) {
      case 'INTERESTED':
        suggestions = [
          'Schedule a demo call',
          'Send pricing information',
          'Offer a free trial',
        ];
        break;
      case 'OBJECTION':
        suggestions = [
          'Address the specific concern',
          'Provide case studies',
          'Offer a different solution',
        ];
        break;
      case 'READY_TO_BUY':
        suggestions = [
          'Send contract for review',
          'Schedule onboarding call',
          'Complete the sale',
        ];
        break;
      case 'NOT_INTERESTED':
        suggestions = [
          'Ask for feedback',
          'Schedule follow-up in 3 months',
          'Remove from campaign',
        ];
        break;
      default:
        suggestions = [
          'Send more information',
          'Schedule a call',
          'Ask clarifying questions',
        ];
    }

    return suggestions;
  }

  summarizeConversation(messages: string[]): string {
    if (messages.length === 0) return 'No conversation history';

    const summary = messages.slice(-3).join(' ');
    if (summary.length > 200) {
      return summary.substring(0, 200) + '...';
    }

    return summary;
  }

  generateContextBriefing(leadId: string, lastMessage: string): string {
    const intent = this.detectLeadIntent(lastMessage);
    const sentiment = this.analyzeSentiment(lastMessage);

    return `Lead Intent: ${intent}\nSentiment: ${sentiment > 0 ? 'Positive' : sentiment < 0 ? 'Negative' : 'Neutral'}\nNext steps: Review the suggested actions`;
  }
}
