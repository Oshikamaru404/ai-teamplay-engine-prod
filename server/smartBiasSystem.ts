/**
 * Smart Bias System - Système intelligent de détection de biais
 * 
 * Objectifs:
 * - Vulgariser les biais en langage simple avec exemples concrets
 * - Alerter uniquement sur les biais importants (seuils intelligents)
 * - Guider positivement l'utilisateur (suggestions constructives)
 * - Réduire le bruit (regrouper, prioriser, ne pas submerger)
 */

import type { BiasType, BiasIndicator } from "./biasDetection";
import { BIAS_PATTERNS } from "./biasDetection";

// ============================================================================
// VULGARISATION DES BIAIS - Langage simple et exemples concrets
// ============================================================================

export interface VulgarizedBias {
  type: BiasType;
  /** Nom simple et mémorable */
  simpleName: string;
  /** Explication en une phrase simple */
  simpleExplanation: string;
  /** Exemple concret du quotidien */
  everydayExample: string;
  /** Emoji représentatif */
  emoji: string;
  /** Question de réflexion pour l'équipe */
  reflectionQuestion: string;
  /** Action concrète suggérée */
  actionableTip: string;
  /** Niveau de gravité pour l'équipe (1-5) */
  teamImpactLevel: number;
}

export const VULGARIZED_BIASES: Record<BiasType, VulgarizedBias> = {
  confirmation: {
    type: "confirmation",
    simpleName: "Le filtre invisible",
    simpleExplanation: "On ne voit que ce qui confirme ce qu'on pense déjà.",
    everydayExample: "Comme quand on cherche des avis sur un produit qu'on veut acheter et qu'on ne lit que les avis positifs.",
    emoji: "🔍",
    reflectionQuestion: "Avez-vous cherché des arguments CONTRE cette idée ?",
    actionableTip: "Demandez à quelqu'un de jouer l'avocat du diable pendant 5 minutes.",
    teamImpactLevel: 4,
  },
  groupthink: {
    type: "groupthink",
    simpleName: "L'effet mouton",
    simpleExplanation: "Tout le monde dit oui pour ne pas faire de vagues.",
    everydayExample: "Comme quand personne n'ose dire que le restaurant choisi par le chef n'est pas bon.",
    emoji: "🐑",
    reflectionQuestion: "Est-ce que tout le monde est VRAIMENT d'accord, ou juste silencieux ?",
    actionableTip: "Faites un vote anonyme rapide avant de valider.",
    teamImpactLevel: 5,
  },
  sunk_cost: {
    type: "sunk_cost",
    simpleName: "Le piège du 'trop tard'",
    simpleExplanation: "On continue parce qu'on a déjà trop investi, même si ça ne marche pas.",
    everydayExample: "Comme finir un mauvais film au cinéma parce qu'on a payé la place.",
    emoji: "🕳️",
    reflectionQuestion: "Si on recommençait de zéro aujourd'hui, ferait-on le même choix ?",
    actionableTip: "Oubliez le passé : évaluez uniquement les bénéfices FUTURS.",
    teamImpactLevel: 4,
  },
  overconfidence: {
    type: "overconfidence",
    simpleName: "L'excès d'optimisme",
    simpleExplanation: "On surestime nos chances de succès et sous-estime les risques.",
    everydayExample: "Comme penser qu'on peut finir un projet en 2 jours alors qu'il en faut 5.",
    emoji: "🎯",
    reflectionQuestion: "Que se passe-t-il si ça ne marche PAS comme prévu ?",
    actionableTip: "Multipliez vos estimations de temps par 1.5 et listez 3 risques possibles.",
    teamImpactLevel: 3,
  },
  authority: {
    type: "authority",
    simpleName: "L'effet 'le chef a dit'",
    simpleExplanation: "On accepte une idée juste parce qu'elle vient d'une personne importante.",
    everydayExample: "Comme suivre un conseil santé d'une célébrité plutôt que d'un médecin.",
    emoji: "👔",
    reflectionQuestion: "Cette idée serait-elle aussi bonne si elle venait d'un junior ?",
    actionableTip: "Évaluez l'argument, pas la personne qui le dit.",
    teamImpactLevel: 3,
  },
  anchoring: {
    type: "anchoring",
    simpleName: "L'effet premier chiffre",
    simpleExplanation: "Le premier nombre qu'on entend influence tous les autres.",
    everydayExample: "Comme quand un vendeur annonce un prix élevé pour que la 'remise' paraisse énorme.",
    emoji: "⚓",
    reflectionQuestion: "D'où vient ce chiffre de départ ? Est-il vraiment pertinent ?",
    actionableTip: "Faites 3 estimations indépendantes AVANT de les comparer.",
    teamImpactLevel: 2,
  },
  halo_effect: {
    type: "halo_effect",
    simpleName: "L'effet star",
    simpleExplanation: "Quelqu'un qui réussit dans un domaine est vu comme bon partout.",
    everydayExample: "Comme penser qu'un bon développeur sera forcément un bon manager.",
    emoji: "✨",
    reflectionQuestion: "Cette personne a-t-elle vraiment de l'expertise sur CE sujet précis ?",
    actionableTip: "Séparez les compétences : évaluez chaque domaine indépendamment.",
    teamImpactLevel: 2,
  },
  availability: {
    type: "availability",
    simpleName: "L'effet 'vu récemment'",
    simpleExplanation: "On pense que ce qu'on a vu récemment arrive plus souvent.",
    everydayExample: "Comme avoir peur de l'avion après avoir vu un crash aux infos, alors que c'est très rare.",
    emoji: "📰",
    reflectionQuestion: "Cette situation est-elle vraiment fréquente, ou juste récente/marquante ?",
    actionableTip: "Cherchez des statistiques réelles plutôt que des exemples isolés.",
    teamImpactLevel: 2,
  },
  bandwagon: {
    type: "bandwagon",
    simpleName: "L'effet mode",
    simpleExplanation: "On adopte une idée parce que tout le monde le fait.",
    everydayExample: "Comme utiliser une nouvelle app juste parce qu'elle est tendance, sans vérifier si elle répond à nos besoins.",
    emoji: "🚂",
    reflectionQuestion: "Cette solution est-elle adaptée à NOTRE contexte spécifique ?",
    actionableTip: "Listez VOS besoins d'abord, puis vérifiez si la solution y répond.",
    teamImpactLevel: 2,
  },
};

// ============================================================================
// SEUILS INTELLIGENTS - Alerter uniquement si biais important
// ============================================================================

export interface BiasThresholds {
  /** Seuil de confiance minimum pour alerter (0-1) */
  minConfidence: number;
  /** Seuil de sévérité minimum ('low' | 'medium' | 'high') */
  minSeverity: "low" | "medium" | "high";
  /** Nombre minimum de preuves pour alerter */
  minEvidenceCount: number;
  /** Délai minimum entre deux alertes du même type (en minutes) */
  cooldownMinutes: number;
  /** Nombre maximum d'alertes par session */
  maxAlertsPerSession: number;
}

export const DEFAULT_THRESHOLDS: BiasThresholds = {
  minConfidence: 0.6,        // Alerter seulement si confiance > 60%
  minSeverity: "medium",     // Ignorer les biais "low"
  minEvidenceCount: 2,       // Au moins 2 preuves
  cooldownMinutes: 30,       // Pas plus d'une alerte du même type toutes les 30 min
  maxAlertsPerSession: 3,    // Maximum 3 alertes par session de travail
};

// Seuils adaptatifs selon le contexte
export const CONTEXT_THRESHOLDS: Record<string, Partial<BiasThresholds>> = {
  // Décision critique = seuils plus bas (plus d'alertes)
  critical_decision: {
    minConfidence: 0.4,
    minSeverity: "low",
    minEvidenceCount: 1,
  },
  // Brainstorming = seuils plus hauts (moins d'interruptions)
  brainstorming: {
    minConfidence: 0.8,
    minSeverity: "high",
    minEvidenceCount: 3,
    cooldownMinutes: 60,
  },
  // Équipe nouvelle = seuils moyens avec plus d'explications
  new_team: {
    minConfidence: 0.5,
    minSeverity: "medium",
    maxAlertsPerSession: 5,
  },
  // Équipe expérimentée = seuils plus stricts
  experienced_team: {
    minConfidence: 0.7,
    minSeverity: "high",
    minEvidenceCount: 3,
    maxAlertsPerSession: 2,
  },
};

// ============================================================================
// SYSTÈME DE GUIDAGE POSITIF
// ============================================================================

export interface GuidanceMessage {
  /** Type de message */
  type: "insight" | "suggestion" | "celebration" | "reminder";
  /** Titre court */
  title: string;
  /** Message principal */
  message: string;
  /** Action suggérée (optionnel) */
  action?: string;
  /** Priorité (1 = haute, 5 = basse) */
  priority: number;
}

/**
 * Génère un message de guidage positif basé sur le biais détecté
 * Au lieu d'alerter négativement, on guide positivement
 */
export function generatePositiveGuidance(
  bias: BiasIndicator,
  context: { teamSize: number; sessionDuration: number; previousAlerts: number }
): GuidanceMessage | null {
  const vulgarized = VULGARIZED_BIASES[bias.type];
  
  // Si trop d'alertes déjà, on ne génère pas de nouveau message
  if (context.previousAlerts >= DEFAULT_THRESHOLDS.maxAlertsPerSession) {
    return null;
  }

  // Adapter le ton selon le contexte
  const isNewTeam = context.teamSize <= 3;
  const isLongSession = context.sessionDuration > 60; // Plus d'une heure

  // Message positif plutôt qu'alarmiste
  const positiveFraming: Record<BiasType, GuidanceMessage> = {
    confirmation: {
      type: "suggestion",
      title: `${vulgarized.emoji} Enrichissez votre réflexion`,
      message: `Votre équipe semble alignée sur une direction. C'est bien ! Pour renforcer cette décision, ${vulgarized.reflectionQuestion.toLowerCase()}`,
      action: vulgarized.actionableTip,
      priority: 2,
    },
    groupthink: {
      type: "insight",
      title: `${vulgarized.emoji} Moment de vérification`,
      message: `Belle harmonie dans l'équipe ! Pour s'assurer que tout le monde s'exprime vraiment : ${vulgarized.actionableTip.toLowerCase()}`,
      action: "Prenez 2 minutes pour un tour de table rapide.",
      priority: 1,
    },
    sunk_cost: {
      type: "reminder",
      title: `${vulgarized.emoji} Prenez du recul`,
      message: `${vulgarized.simpleExplanation} ${vulgarized.reflectionQuestion}`,
      action: vulgarized.actionableTip,
      priority: 2,
    },
    overconfidence: {
      type: "suggestion",
      title: `${vulgarized.emoji} Sécurisez votre plan`,
      message: `L'enthousiasme est contagieux ! Pour transformer cet élan en succès : ${vulgarized.actionableTip.toLowerCase()}`,
      action: "Identifiez un plan B en 2 minutes.",
      priority: 3,
    },
    authority: {
      type: "insight",
      title: `${vulgarized.emoji} Diversifiez les perspectives`,
      message: `${vulgarized.reflectionQuestion} ${vulgarized.actionableTip}`,
      priority: 3,
    },
    anchoring: {
      type: "suggestion",
      title: `${vulgarized.emoji} Élargissez le champ`,
      message: `${vulgarized.simpleExplanation} ${vulgarized.actionableTip}`,
      priority: 4,
    },
    halo_effect: {
      type: "reminder",
      title: `${vulgarized.emoji} Focus sur le sujet`,
      message: `${vulgarized.reflectionQuestion}`,
      action: vulgarized.actionableTip,
      priority: 4,
    },
    availability: {
      type: "insight",
      title: `${vulgarized.emoji} Vérifiez les données`,
      message: `${vulgarized.simpleExplanation} ${vulgarized.actionableTip}`,
      priority: 4,
    },
    bandwagon: {
      type: "suggestion",
      title: `${vulgarized.emoji} Personnalisez votre approche`,
      message: `${vulgarized.reflectionQuestion}`,
      action: vulgarized.actionableTip,
      priority: 4,
    },
  };

  return positiveFraming[bias.type];
}

// ============================================================================
// FILTRAGE ET PRIORISATION DES ALERTES
// ============================================================================

export interface AlertState {
  lastAlertTimes: Record<BiasType, number>;
  alertCount: number;
  sessionStart: number;
}

/**
 * Filtre les biais pour ne garder que ceux qui méritent une alerte
 */
export function filterSignificantBiases(
  biases: BiasIndicator[],
  thresholds: BiasThresholds = DEFAULT_THRESHOLDS,
  alertState?: AlertState
): BiasIndicator[] {
  const now = Date.now();
  const severityOrder = { low: 0, medium: 1, high: 2 };
  const minSeverityValue = severityOrder[thresholds.minSeverity];

  return biases.filter((bias) => {
    // Vérifier la confiance
    if (bias.confidence < thresholds.minConfidence) {
      return false;
    }

    // Vérifier la sévérité
    if (severityOrder[bias.severity] < minSeverityValue) {
      return false;
    }

    // Vérifier le nombre de preuves
    if (bias.evidence.length < thresholds.minEvidenceCount) {
      return false;
    }

    // Vérifier le cooldown si on a l'état des alertes
    if (alertState) {
      const lastAlert = alertState.lastAlertTimes[bias.type];
      if (lastAlert) {
        const minutesSinceLastAlert = (now - lastAlert) / (1000 * 60);
        if (minutesSinceLastAlert < thresholds.cooldownMinutes) {
          return false;
        }
      }
    }

    return true;
  });
}

/**
 * Priorise les biais par impact sur l'équipe
 */
export function prioritizeBiases(biases: BiasIndicator[]): BiasIndicator[] {
  return biases.sort((a, b) => {
    // D'abord par sévérité
    const severityOrder = { high: 3, medium: 2, low: 1 };
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    if (severityDiff !== 0) return severityDiff;

    // Ensuite par impact sur l'équipe
    const impactA = VULGARIZED_BIASES[a.type].teamImpactLevel;
    const impactB = VULGARIZED_BIASES[b.type].teamImpactLevel;
    if (impactA !== impactB) return impactB - impactA;

    // Enfin par confiance
    return b.confidence - a.confidence;
  });
}

/**
 * Regroupe les biais similaires pour éviter la redondance
 */
export function groupSimilarBiases(biases: BiasIndicator[]): Map<BiasType, BiasIndicator[]> {
  const groups = new Map<BiasType, BiasIndicator[]>();
  
  for (const bias of biases) {
    const existing = groups.get(bias.type) || [];
    existing.push(bias);
    groups.set(bias.type, existing);
  }

  return groups;
}

// ============================================================================
// GÉNÉRATION DE RÉSUMÉ INTELLIGENT
// ============================================================================

export interface SmartBiasSummary {
  /** Nombre total de biais détectés (avant filtrage) */
  totalDetected: number;
  /** Nombre de biais significatifs (après filtrage) */
  significantCount: number;
  /** Biais le plus important à adresser */
  topPriority: {
    bias: VulgarizedBias;
    guidance: GuidanceMessage;
  } | null;
  /** Score de santé cognitive (0-100) */
  cognitiveHealthScore: number;
  /** Message résumé pour l'utilisateur */
  summaryMessage: string;
  /** Doit-on afficher une alerte ? */
  shouldAlert: boolean;
}

/**
 * Génère un résumé intelligent des biais détectés
 * Conçu pour ne pas submerger l'utilisateur
 */
export function generateSmartSummary(
  biases: BiasIndicator[],
  context: {
    teamSize: number;
    sessionDuration: number;
    previousAlerts: number;
    contextType?: keyof typeof CONTEXT_THRESHOLDS;
  }
): SmartBiasSummary {
  // Appliquer les seuils contextuels
  const baseThresholds = { ...DEFAULT_THRESHOLDS };
  if (context.contextType && CONTEXT_THRESHOLDS[context.contextType]) {
    Object.assign(baseThresholds, CONTEXT_THRESHOLDS[context.contextType]);
  }

  // Filtrer et prioriser
  const significantBiases = filterSignificantBiases(biases, baseThresholds);
  const prioritized = prioritizeBiases(significantBiases);

  // Calculer le score de santé cognitive
  const cognitiveHealthScore = calculateCognitiveHealthScore(biases);

  // Déterminer si on doit alerter
  const shouldAlert = 
    prioritized.length > 0 && 
    context.previousAlerts < baseThresholds.maxAlertsPerSession;

  // Générer le message résumé
  let summaryMessage: string;
  let topPriority: SmartBiasSummary["topPriority"] = null;

  if (prioritized.length === 0) {
    summaryMessage = "✅ Votre réflexion collective semble équilibrée. Continuez comme ça !";
  } else if (prioritized.length === 1) {
    const topBias = prioritized[0];
    const vulgarized = VULGARIZED_BIASES[topBias.type];
    const guidance = generatePositiveGuidance(topBias, context);
    
    topPriority = guidance ? { bias: vulgarized, guidance } : null;
    summaryMessage = `${vulgarized.emoji} Point d'attention : ${vulgarized.simpleName}. ${vulgarized.simpleExplanation}`;
  } else {
    const topBias = prioritized[0];
    const vulgarized = VULGARIZED_BIASES[topBias.type];
    const guidance = generatePositiveGuidance(topBias, context);
    
    topPriority = guidance ? { bias: vulgarized, guidance } : null;
    summaryMessage = `${vulgarized.emoji} ${prioritized.length} points d'attention détectés. Le plus important : ${vulgarized.simpleName}.`;
  }

  return {
    totalDetected: biases.length,
    significantCount: prioritized.length,
    topPriority,
    cognitiveHealthScore,
    summaryMessage,
    shouldAlert,
  };
}

/**
 * Calcule un score de santé cognitive (0-100)
 */
function calculateCognitiveHealthScore(biases: BiasIndicator[]): number {
  if (biases.length === 0) return 100;

  // Pénalité par biais selon sévérité
  const penalties = biases.reduce((total, bias) => {
    const severityPenalty = { low: 5, medium: 15, high: 25 };
    return total + severityPenalty[bias.severity] * bias.confidence;
  }, 0);

  return Math.max(0, Math.round(100 - penalties));
}

// ============================================================================
// INTÉGRATION PROFIL BIG FIVE - Calibration personnalisée
// ============================================================================

import type { BigFiveProfile } from "./bigFiveProfile";

/**
 * Ajuste les seuils de détection de biais selon le profil Big Five de l'utilisateur
 * Cela permet une détection plus précise et moins de faux positifs
 */
export function adjustThresholdsForProfile(
  baseThresholds: BiasThresholds,
  profile: BigFiveProfile
): BiasThresholds {
  const adjusted = { ...baseThresholds };

  // Haute conscienciosité = plus rigoureux, moins tolérant aux biais
  if (profile.conscientiousness >= 70) {
    adjusted.minConfidence = Math.max(0.3, adjusted.minConfidence - 0.1);
    adjusted.maxAlertsPerSession = Math.min(5, adjusted.maxAlertsPerSession + 1);
  }

  // Haute ouverture = plus tolérant à l'exploration, moins d'alertes sur confirmation
  if (profile.openness >= 70) {
    adjusted.cooldownMinutes = Math.min(60, adjusted.cooldownMinutes + 10);
  }

  // Haute agréabilité = plus sensible au groupthink
  if (profile.agreeableness >= 70) {
    adjusted.minConfidence = Math.max(0.4, adjusted.minConfidence - 0.1);
  }

  // Haut névrosisme = moins d'alertes pour ne pas stresser
  if (profile.neuroticism >= 70) {
    adjusted.maxAlertsPerSession = Math.max(1, adjusted.maxAlertsPerSession - 1);
    adjusted.minSeverity = "high";
  }

  return adjusted;
}

/**
 * Détermine les biais auxquels un utilisateur est le plus susceptible
 * selon son profil Big Five
 */
export function getProbableBiasesForProfile(profile: BigFiveProfile): BiasType[] {
  const probableBiases: BiasType[] = [];

  // Basse ouverture = plus susceptible au biais de confirmation
  if (profile.openness < 40) {
    probableBiases.push("confirmation");
  }

  // Haute agréabilité = plus susceptible au groupthink et biais d'autorité
  if (profile.agreeableness >= 70) {
    probableBiases.push("groupthink", "authority");
  }

  // Haute extraversion = plus susceptible à l'effet bandwagon
  if (profile.extraversion >= 70) {
    probableBiases.push("bandwagon");
  }

  // Basse conscienciosité = plus susceptible à l'excès de confiance
  if (profile.conscientiousness < 40) {
    probableBiases.push("overconfidence");
  }

  // Haut névrosisme = plus susceptible au sunk cost (peur de perdre)
  if (profile.neuroticism >= 60) {
    probableBiases.push("sunk_cost");
  }

  return probableBiases;
}

/**
 * Génère des conseils personnalisés basés sur le profil Big Five
 */
export function getPersonalizedBiasAdvice(
  biasType: BiasType,
  profile: BigFiveProfile
): string {
  const vulgarized = VULGARIZED_BIASES[biasType];
  const baseAdvice = vulgarized.actionableTip;

  // Adapter le conseil selon le profil
  const personalizations: Record<BiasType, (p: BigFiveProfile) => string> = {
    confirmation: (p) => {
      if (p.openness < 50) {
        return `${baseAdvice} Votre profil suggère que vous pourriez bénéficier particulièrement de chercher activement des points de vue différents.`;
      }
      return baseAdvice;
    },
    groupthink: (p) => {
      if (p.agreeableness >= 60) {
        return `${baseAdvice} Votre nature collaborative est une force, mais n'hésitez pas à exprimer vos doutes - votre équipe appréciera votre honnêteté.`;
      }
      return baseAdvice;
    },
    sunk_cost: (p) => {
      if (p.conscientiousness >= 60) {
        return `${baseAdvice} Votre sens des responsabilités est admirable, mais parfois la meilleure décision est de pivoter.`;
      }
      return baseAdvice;
    },
    overconfidence: (p) => {
      if (p.extraversion >= 60) {
        return `${baseAdvice} Votre enthousiasme est contagieux ! Canalisez-le en préparant aussi un plan B.`;
      }
      return baseAdvice;
    },
    authority: (p) => {
      if (p.agreeableness >= 60) {
        return `${baseAdvice} Votre respect pour les autres est une qualité, mais vos idées ont autant de valeur.`;
      }
      return baseAdvice;
    },
    anchoring: () => baseAdvice,
    halo_effect: () => baseAdvice,
    availability: (p) => {
      if (p.neuroticism >= 50) {
        return `${baseAdvice} Prenez du recul : les événements récents ne reflètent pas toujours la réalité statistique.`;
      }
      return baseAdvice;
    },
    bandwagon: (p) => {
      if (p.extraversion >= 60) {
        return `${baseAdvice} Votre sociabilité est un atout, mais vérifiez que les tendances correspondent à vos besoins réels.`;
      }
      return baseAdvice;
    },
  };

  return personalizations[biasType](profile);
}

// ============================================================================
// EXPORT DES FONCTIONS UTILITAIRES
// ============================================================================

export {
  BiasType,
  BiasIndicator,
};
