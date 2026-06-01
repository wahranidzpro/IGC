export const coachResponses: Record<string, string> = {}

export interface MemberContext {
  firstName: string
  fitnessGoal?: string
  experienceLevel?: string
  sessionsLeft?: number
}

export function getCoachResponse(message: string, context?: MemberContext, lang?: string): string {
  return "Désolé, l'assistant IA n'est pas encore configuré."
}

export function getAIResponse(message: string): string {
  return "Désolé, l'assistant IA n'est pas encore configuré."
}

export function getInitialCoachMessage(member?: MemberContext): { ar: string; fr: string } {
  const name = member?.firstName || 'cher membre'
  return {
    fr: `Bonjour ${name} ! Je suis votre coach IA. Comment puis-je vous aider aujourd'hui ?`,
    ar: `مرحباً ${name} ! أنا مدربك الذكي. كيف يمكنني مساعدتك اليوم؟`,
  }
}
