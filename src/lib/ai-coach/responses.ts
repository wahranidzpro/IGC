export interface MemberContext {
  firstName: string
  fitnessGoal?: string
  experienceLevel?: string
  sessionsLeft?: number
}

const topicMap: Record<string, string> = {
  'pectoraux': 'Exercices', 'poitrine': 'Exercices', 'pecs': 'Exercices',
  'dos': 'Exercices', 'tractions': 'Exercices', 'rowing': 'Exercices',
  'jambes': 'Exercices', 'squat': 'Exercices', 'fentes': 'Exercices',
  'epaules': 'Exercices', 'developpe militaire': 'Exercices', 'elevations': 'Exercices',
  'biceps': 'Exercices', 'curl': 'Exercices',
  'triceps': 'Exercices', 'dips': 'Exercices', 'extension': 'Exercices',
  'abdos': 'Exercices', 'gainage': 'Exercices', 'crunch': 'Exercices',
  'cardio': 'Cardio', 'course': 'Cardio', 'velo': 'Cardio', 'endurance': 'Cardio',
  'nutrition': 'Nutrition', 'manger': 'Nutrition', 'proteine': 'Nutrition', 'repas': 'Nutrition',
  'regime': 'Nutrition', 'calories': 'Nutrition', 'perte de poids': 'Nutrition',
  'maison': 'Maison', 'domicile': 'Maison', 'sans materiel': 'Maison',
  'objectif': 'Objectif', 'motivation': 'Motivation', 'progression': 'Objectif',
  'etirement': 'Recuperation', 'recuperation': 'Recuperation', 'repos': 'Recuperation',
  'blessure': 'Blessure', 'douleur': 'Blessure', 'mal': 'Blessure',
}

const coachResponses: Record<string, (ctx?: MemberContext) => string> = {
  'Exercices': (ctx) => `Excellent choix ${ctx?.firstName || ''} ! 💪\n\nVoici quelques conseils pour tes exercices :\n1. Commence par un échauffement de 5-10 min\n2. 3 séries de 10-12 répétitions\n3. Repos de 60s entre les séries\n4. Augmente progressivement la charge\n\nPour un programme personnalisé adapté à ton objectif "${ctx?.fitnessGoal || 'fitness'}", je te recommande d'en parler avec ton coach lors de ta prochaine séance.`,
  'Cardio': (ctx) => `Le cardio est essentiel ${ctx?.firstName || ''} ! 🏃\n\nIdées de séance cardio :\n• 20 min de course à pied\n• 15 min de vélo\n• 10 min de corde à sauter\n• 5 min de montées de genoux\n\nObjectif : maintenir ton rythme cardiaque entre 120-150 BPM pendant l'effort.\n\nTu veux un programme cardio plus spécifique ? Parle-en à ton coach !`,
  'Nutrition': (ctx) => `Bonne question nutrition ${ctx?.firstName || ''} ! 🥗\n\nQuelques principes de base :\n• Protéines : 1.6-2g par kg de poids\n• Glucides : adaptés à ton activité\n• Lipides : 0.8-1g par kg de poids\n• Hydratation : 2-3L d'eau par jour\n\nExemple repas équilibré :\n• Petit-déjeuner : Œufs + avoine + fruits\n• Déjeuner : Poulet + riz complet + légumes\n• Dîner : Poisson + quinoa + salade\n\nPour un plan nutritionnel personnalisé, consulte ton coach !`,
  'Maison': (ctx) => `Pas de problème ${ctx?.firstName || ''} ! 🏠\n\nEntraînement maison sans matériel :\n1. Pompes : 3×15\n2. Squats : 3×20\n3. Fentes : 3×12/jambe\n4. Gainage : 3×45s\n5. Burpees : 3×10\n6. Mountain climbers : 3×30s\n\nÀ faire en circuit, 30s repos entre chaque exercice.\n\nTu veux un programme maison plus avancé ? Ton coach peut t'en créer un sur mesure !`,
  'Objectif': (ctx) => `Super objectif ${ctx?.firstName || ''} ! 🎯\n\nPour atteindre ton but "${ctx?.fitnessGoal || 'fitness'}" :\n• Reste régulier (min 3 séances/semaine)\n• Note tes progrès\n• Augmente progressivement l'intensité\n• Hydrate-toi bien\n• Dors 7-8h\n\nTu as ${ctx?.sessionsLeft || 0} séances restantes cette semaine. Utilise-les pour rester sur la bonne voie !\n\nBesoin d'un programme dédié ? Ton coach est là pour t'aider !`,
  'Recuperation': (ctx) => `La récupération est cruciale ${ctx?.firstName || ''} ! 😌\n\nConseils récupération :\n• Étirements doux après l'effort\n• 1 jour de repos entre les séances intenses\n• Massage ou foam roller\n• Hydratation + protéines post-workout\n• Sommeil de qualité (7-8h)\n\nN'oublie pas : le muscle se construit pendant le repos, pas pendant l'entraînement !`,
  'Blessure': (ctx) => `⚠️ Important ${ctx?.firstName || ''} !\n\nSi tu ressens une douleur ou une blessure :\n1. Arrête immédiatement l'exercice\n2. Applique du glace (15 min)\n3. Consulte ton coach pour adapter ton programme\n4. Si la douleur persiste, vois un médecin\n\nNe force jamais sur une douleur. Ta santé passe avant tout !\n\nContacte ton coach pour ajuster ta séance.`,
  'Motivation': (ctx) => `Tu peux le faire ${ctx?.firstName || ''} ! 🔥\n\nRappelle-toi pourquoi tu as commencé :\n• Chaque séance te rapproche de ton objectif\n• Les résultats viennent avec la constance\n• Tu es plus fort(te) que tu ne le penses\n• Visualise ton objectif final\n\n${ctx?.sessionsLeft && ctx.sessionsLeft > 0 ? `Il te reste ${ctx.sessionsLeft} séances cette semaine. Ne les laisse pas passer ! 💪` : 'Prends rendez-vous avec ton coach pour planifier tes prochaines séances !'}\n\nTu as des questions plus spécifiques ? Ton coach est disponible pour t'accompagner !`,
}

export function detectTopic(message: string): string {
  const lower = message.toLowerCase()
  for (const [keyword, topic] of Object.entries(topicMap)) {
    if (lower.includes(keyword)) return topic
  }
  return 'General'
}

export function needsCoachRedirect(topic: string, message: string): boolean {
  const urgentKeywords = ['douleur intense', 'blessure grave', 'operation', 'hospitalisation', 'vertige', 'cardiaque']
  const lower = message.toLowerCase()
  if (urgentKeywords.some(k => lower.includes(k))) return true
  if (topic === 'Blessure') return true
  return false
}

export function getCoachResponse(message: string, context?: MemberContext, lang?: string): string {
  const topic = detectTopic(message)
  const responder = coachResponses[topic]

  if (needsCoachRedirect(topic, message)) {
    const baseResponse = responder ? responder(context) : `Bonjour ${context?.firstName || ''} ! Comment puis-je t'aider ?`
    return `${baseResponse}\n\n---\n🔴 **Question importante détectée** — J'ai transmis ta question à ton coach qui te recontactera rapidement pour un suivi personnalisé.`
  }

  if (responder) return responder(context)

  return `Bonjour ${context?.firstName || ''} ! 👋\n\nJe suis ton coach AI Infinity Gym. Pose-moi des questions sur :\n• 💪 Exercices (pectoraux, dos, jambes...)\n• 🏃 Cardio et endurance\n• 🥗 Nutrition et alimentation\n• 🏠 Entraînement à la maison\n• 🎯 Objectifs et motivation\n• 😌 Récupération et étirements\n\nComment puis-je t'aider aujourd'hui ?`
}

export function getAIResponse(message: string): string {
  return getCoachResponse(message)
}

export function getInitialCoachMessage(member?: MemberContext): { ar: string; fr: string } {
  const name = member?.firstName || 'cher membre'
  return {
    fr: `Bonjour ${name} ! Je suis votre coach AI Infinity Gym. Je peux vous aider avec les exercices, la nutrition, la motivation et plus encore. Posez-moi vos questions !`,
    ar: `مرحباً ${name} ! أنا مدربك الذكي Infinity Gym. يمكنني مساعدتك في التمارين والتغذية والتحفيز والمزيد. اطرح أسئلتك!`,
  }
}
