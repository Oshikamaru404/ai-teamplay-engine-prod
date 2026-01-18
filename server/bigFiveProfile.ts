/**
 * Big Five / OCEAN Personality Profile System
 * 
 * Système de profilage psychologique basé sur le modèle Big Five :
 * - Openness (Ouverture à l'expérience)
 * - Conscientiousness (Conscienciosité)
 * - Extraversion
 * - Agreeableness (Agréabilité)
 * - Neuroticism (Névrosisme / Stabilité émotionnelle)
 */

export interface BigFiveScores {
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
}

export interface BigFiveProfile extends BigFiveScores {
  source: 'quiz' | 'analysis' | 'combined';
  confidence: number;
  lastUpdated: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  textFr: string;
  trait: keyof BigFiveScores;
  reversed: boolean;
  category: string;
}

export interface QuizAnswer {
  questionId: string;
  score: number;
}

// 15 questions concises pour le quiz Big Five
export const BIG_FIVE_QUIZ: QuizQuestion[] = [
  { id: "o1", text: "I enjoy exploring new ideas", textFr: "J'aime explorer de nouvelles idées et concepts", trait: "openness", reversed: false, category: "curiosity" },
  { id: "o2", text: "I prefer routine", textFr: "Je préfère la routine et les approches familières", trait: "openness", reversed: true, category: "tradition" },
  { id: "o3", text: "I'm drawn to creative activities", textFr: "Je suis attiré(e) par les activités créatives", trait: "openness", reversed: false, category: "creativity" },
  { id: "c1", text: "I complete tasks on time", textFr: "Je termine toujours mes tâches à temps", trait: "conscientiousness", reversed: false, category: "organization" },
  { id: "c2", text: "I tend to be disorganized", textFr: "J'ai tendance à être désorganisé(e)", trait: "conscientiousness", reversed: true, category: "order" },
  { id: "c3", text: "I pay attention to details", textFr: "Je fais attention aux détails", trait: "conscientiousness", reversed: false, category: "precision" },
  { id: "e1", text: "I feel energized after social interactions", textFr: "Je me sens énergisé(e) après des interactions sociales", trait: "extraversion", reversed: false, category: "sociability" },
  { id: "e2", text: "I prefer working alone", textFr: "Je préfère travailler seul(e) plutôt qu'en groupe", trait: "extraversion", reversed: true, category: "solitude" },
  { id: "e3", text: "I usually start conversations", textFr: "C'est généralement moi qui initie les conversations", trait: "extraversion", reversed: false, category: "initiative" },
  { id: "a1", text: "I try to understand others' perspectives", textFr: "J'essaie de comprendre le point de vue des autres", trait: "agreeableness", reversed: false, category: "empathy" },
  { id: "a2", text: "I'm skeptical of others' intentions", textFr: "J'ai tendance à être sceptique des intentions des autres", trait: "agreeableness", reversed: true, category: "trust" },
  { id: "a3", text: "I prioritize harmony in discussions", textFr: "Je privilégie l'harmonie dans les discussions d'équipe", trait: "agreeableness", reversed: false, category: "cooperation" },
  { id: "n1", text: "I often feel stressed or anxious", textFr: "Je me sens souvent stressé(e) ou anxieux(se)", trait: "neuroticism", reversed: false, category: "anxiety" },
  { id: "n2", text: "I stay calm under pressure", textFr: "Je reste calme sous pression", trait: "neuroticism", reversed: true, category: "stability" },
  { id: "n3", text: "My mood can change quickly", textFr: "Mon humeur peut changer rapidement", trait: "neuroticism", reversed: false, category: "volatility" }
];

export const TRAIT_DESCRIPTIONS: Record<keyof BigFiveScores, {
  nameFr: string;
  emoji: string;
  highDescription: string;
  lowDescription: string;
  teamStrengths: string[];
}> = {
  openness: {
    nameFr: "Ouverture",
    emoji: "🎨",
    highDescription: "Curieux, créatif, ouvert aux nouvelles expériences",
    lowDescription: "Pragmatique, préfère les méthodes éprouvées",
    teamStrengths: ["Apporte des perspectives nouvelles", "Stimule l'innovation", "Adaptable aux changements"]
  },
  conscientiousness: {
    nameFr: "Conscienciosité",
    emoji: "📋",
    highDescription: "Organisé, fiable, attentif aux détails",
    lowDescription: "Flexible, spontané, adaptable",
    teamStrengths: ["Garantit la qualité", "Respecte les délais", "Structure les projets"]
  },
  extraversion: {
    nameFr: "Extraversion",
    emoji: "🗣️",
    highDescription: "Sociable, énergique, communicatif",
    lowDescription: "Réservé, réfléchi, indépendant",
    teamStrengths: ["Facilite la communication", "Dynamise les réunions", "Crée des liens"]
  },
  agreeableness: {
    nameFr: "Agréabilité",
    emoji: "🤝",
    highDescription: "Empathique, coopératif, harmonieux",
    lowDescription: "Direct, compétitif, assertif",
    teamStrengths: ["Résout les conflits", "Crée un climat de confiance", "Soutient l'équipe"]
  },
  neuroticism: {
    nameFr: "Stabilité émotionnelle",
    emoji: "⚖️",
    highDescription: "Sensible, vigilant, réactif au stress",
    lowDescription: "Calme, résilient, stable",
    teamStrengths: ["Détecte les problèmes tôt", "Sensible aux besoins des autres", "Vigilant aux risques"]
  }
};

export function calculateQuizProfile(answers: QuizAnswer[]): BigFiveProfile {
  const traitScores: Record<keyof BigFiveScores, number[]> = {
    openness: [], conscientiousness: [], extraversion: [], agreeableness: [], neuroticism: []
  };

  for (const answer of answers) {
    const question = BIG_FIVE_QUIZ.find(q => q.id === answer.questionId);
    if (!question) continue;
    let normalizedScore = ((answer.score - 1) / 4) * 100;
    if (question.reversed) normalizedScore = 100 - normalizedScore;
    traitScores[question.trait].push(normalizedScore);
  }

  const average = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 50;

  return {
    openness: Math.round(average(traitScores.openness)),
    conscientiousness: Math.round(average(traitScores.conscientiousness)),
    extraversion: Math.round(average(traitScores.extraversion)),
    agreeableness: Math.round(average(traitScores.agreeableness)),
    neuroticism: Math.round(average(traitScores.neuroticism)),
    source: 'quiz',
    confidence: Math.round((answers.length / BIG_FIVE_QUIZ.length) * 100),
    lastUpdated: new Date().toISOString()
  };
}

export function getTeamRole(profile: BigFiveProfile): { emoji: string; role: string; description: string } {
  if (profile.openness >= 70 && profile.extraversion >= 60) {
    return { emoji: "🚀", role: "L'Innovateur", description: "Génère des idées et inspire l'équipe" };
  }
  if (profile.conscientiousness >= 70 && profile.agreeableness >= 60) {
    return { emoji: "⚙️", role: "Le Pilier", description: "Garantit la qualité et maintient l'harmonie" };
  }
  if (profile.extraversion >= 70 && profile.agreeableness >= 60) {
    return { emoji: "🌉", role: "Le Connecteur", description: "Facilite la communication et crée des liens" };
  }
  if (profile.conscientiousness >= 70) {
    return { emoji: "📊", role: "L'Exécutant", description: "Transforme les plans en résultats concrets" };
  }
  if (profile.agreeableness >= 70) {
    return { emoji: "🤝", role: "Le Médiateur", description: "Résout les conflits et soutient l'équipe" };
  }
  return { emoji: "🎯", role: "Le Polyvalent", description: "S'adapte aux besoins de l'équipe" };
}
