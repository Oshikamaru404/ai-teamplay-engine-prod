/**
 * Templates Cognitifs - Configurations prédéfinies pour différents contextes d'équipe
 * 
 * Chaque template ajuste automatiquement :
 * - Les seuils de détection de biais
 * - Les types de pings prioritaires
 * - Les recommandations contextuelles
 * - Les métriques de santé cognitive
 */

import type { BiasType } from "./biasDetection";

// ============================================================================
// TYPES DE TEMPLATES
// ============================================================================

export type TemplateType = 
  | "startup"           // Startup early-stage
  | "product_tech"      // Équipe produit tech
  | "consulting"        // Cabinet de conseil
  | "creative"          // Agence créative
  | "research"          // Équipe R&D
  | "operations"        // Équipe opérations
  | "custom";           // Personnalisé

export interface CognitiveTemplate {
  id: TemplateType;
  name: string;
  description: string;
  emoji: string;
  
  /** Configuration des seuils de biais */
  biasConfig: {
    /** Biais prioritaires à surveiller */
    priorityBiases: BiasType[];
    /** Biais à ignorer ou minimiser */
    ignoredBiases: BiasType[];
    /** Seuil de confiance pour alerter (0-1) */
    alertThreshold: number;
    /** Tolérance au risque (0-1, 1 = très tolérant) */
    riskTolerance: number;
  };
  
  /** Configuration des Smart Pings */
  pingConfig: {
    /** Pings activés */
    enabledPings: string[];
    /** Fréquence max par heure */
    maxPingsPerHour: number;
    /** Délai minimum entre pings similaires (minutes) */
    cooldownMinutes: number;
  };
  
  /** Métriques cibles */
  targetMetrics: {
    /** Indice de diversité cible */
    diversityIndex: number;
    /** Score de pensée critique cible */
    criticalThinkingScore: number;
    /** Taux de convergence acceptable */
    convergenceRate: { min: number; max: number };
    /** Niveau de risque de biais acceptable */
    biasRiskLevel: number;
  };
  
  /** Messages et recommandations personnalisés */
  customMessages: {
    /** Message de bienvenue */
    welcome: string;
    /** Conseils spécifiques au contexte */
    tips: string[];
    /** Célébrations contextuelles */
    celebrations: string[];
  };
}

// ============================================================================
// TEMPLATES PRÉDÉFINIS
// ============================================================================

export const COGNITIVE_TEMPLATES: Record<TemplateType, CognitiveTemplate> = {
  startup: {
    id: "startup",
    name: "Startup Early-Stage",
    description: "Pour les équipes en phase de création, où la prise de risque et l'itération rapide sont essentielles.",
    emoji: "🚀",
    
    biasConfig: {
      // En startup, on surveille surtout l'excès de confiance et le sunk cost
      priorityBiases: ["overconfidence", "sunk_cost", "groupthink"],
      // On tolère plus le bandwagon (suivre les tendances peut être stratégique)
      ignoredBiases: ["bandwagon"],
      alertThreshold: 0.7, // Seuil plus haut = moins d'alertes
      riskTolerance: 0.8,  // Haute tolérance au risque
    },
    
    pingConfig: {
      enabledPings: ["bias", "dominance", "spectral", "silence"],
      maxPingsPerHour: 3,
      cooldownMinutes: 20,
    },
    
    targetMetrics: {
      diversityIndex: 0.6,
      criticalThinkingScore: 0.5,
      convergenceRate: { min: 0.3, max: 0.7 }, // Convergence rapide OK
      biasRiskLevel: 0.5, // Tolérance modérée
    },
    
    customMessages: {
      welcome: "Mode Startup activé ! On privilégie la vitesse et l'audace, tout en gardant un œil sur les pièges classiques.",
      tips: [
        "En startup, pivoter n'est pas un échec - c'est de l'apprentissage.",
        "Attention au 'founder bias' : votre vision est précieuse mais pas infaillible.",
        "Validez vos hypothèses avec des données, pas juste avec votre intuition.",
      ],
      celebrations: [
        "Belle prise de décision rapide ! L'agilité est votre force.",
        "Vous avez challengé une hypothèse - c'est ça l'esprit startup !",
        "Pivot détecté et assumé - vous apprenez vite !",
      ],
    },
  },

  product_tech: {
    id: "product_tech",
    name: "Équipe Produit Tech",
    description: "Pour les équipes produit et tech qui doivent équilibrer innovation et fiabilité.",
    emoji: "⚙️",
    
    biasConfig: {
      // Focus sur les biais qui impactent la qualité produit
      priorityBiases: ["confirmation", "anchoring", "authority", "halo_effect"],
      ignoredBiases: [],
      alertThreshold: 0.5, // Seuil plus bas = plus vigilant
      riskTolerance: 0.4,  // Moins tolérant au risque
    },
    
    pingConfig: {
      enabledPings: ["bias", "groupthink", "cognitivelock", "spectral", "silence", "momentum"],
      maxPingsPerHour: 5,
      cooldownMinutes: 15,
    },
    
    targetMetrics: {
      diversityIndex: 0.7,
      criticalThinkingScore: 0.7,
      convergenceRate: { min: 0.4, max: 0.6 }, // Équilibre débat/décision
      biasRiskLevel: 0.3, // Faible tolérance
    },
    
    customMessages: {
      welcome: "Mode Produit Tech activé ! On vise l'excellence technique avec une réflexion structurée.",
      tips: [
        "Les specs initiales sont un point de départ, pas une vérité absolue.",
        "Impliquez les utilisateurs tôt - leur feedback vaut de l'or.",
        "La dette technique est un biais de disponibilité : on la voit quand il est trop tard.",
      ],
      celebrations: [
        "Excellent travail de revue critique !",
        "Vous avez identifié un edge case important - belle rigueur !",
        "Discussion technique équilibrée - tous les points de vue comptent.",
      ],
    },
  },

  consulting: {
    id: "consulting",
    name: "Cabinet de Conseil",
    description: "Pour les équipes de conseil qui doivent challenger les clients tout en restant constructives.",
    emoji: "💼",
    
    biasConfig: {
      priorityBiases: ["authority", "confirmation", "halo_effect", "bandwagon"],
      ignoredBiases: [],
      alertThreshold: 0.45,
      riskTolerance: 0.3,
    },
    
    pingConfig: {
      enabledPings: ["bias", "groupthink", "dominance", "silence", "spectral"],
      maxPingsPerHour: 4,
      cooldownMinutes: 20,
    },
    
    targetMetrics: {
      diversityIndex: 0.8,
      criticalThinkingScore: 0.8,
      convergenceRate: { min: 0.3, max: 0.5 },
      biasRiskLevel: 0.25,
    },
    
    customMessages: {
      welcome: "Mode Conseil activé ! Objectivité et rigueur analytique sont vos meilleurs atouts.",
      tips: [
        "Le client a toujours une vision - votre rôle est de l'enrichir, pas de la remplacer.",
        "Les benchmarks sont utiles mais chaque contexte est unique.",
        "Attention au biais de confirmation quand vous défendez une recommandation.",
      ],
      celebrations: [
        "Analyse multi-perspectives excellente !",
        "Vous avez challengé une hypothèse client de manière constructive.",
        "Belle synthèse de points de vue divergents.",
      ],
    },
  },

  creative: {
    id: "creative",
    name: "Agence Créative",
    description: "Pour les équipes créatives où l'exploration et la divergence sont valorisées.",
    emoji: "🎨",
    
    biasConfig: {
      // En créatif, on surveille surtout le groupthink et l'autorité
      priorityBiases: ["groupthink", "authority", "bandwagon"],
      // On tolère plus l'overconfidence (la créativité demande de l'audace)
      ignoredBiases: ["overconfidence", "availability"],
      alertThreshold: 0.75,
      riskTolerance: 0.9,
    },
    
    pingConfig: {
      enabledPings: ["groupthink", "dominance", "silence", "spectral"],
      maxPingsPerHour: 2,
      cooldownMinutes: 30,
    },
    
    targetMetrics: {
      diversityIndex: 0.9,
      criticalThinkingScore: 0.5,
      convergenceRate: { min: 0.2, max: 0.5 }, // Divergence encouragée
      biasRiskLevel: 0.6,
    },
    
    customMessages: {
      welcome: "Mode Créatif activé ! Place à l'exploration et aux idées audacieuses.",
      tips: [
        "Les 'mauvaises' idées mènent souvent aux meilleures.",
        "Évitez le 'oui mais' - essayez le 'oui et' !",
        "Le silence d'un créatif peut cacher une pépite.",
      ],
      celebrations: [
        "Explosion d'idées ! La diversité créative est au top.",
        "Vous avez osé proposer quelque chose de différent - bravo !",
        "Belle énergie collaborative !",
      ],
    },
  },

  research: {
    id: "research",
    name: "Équipe R&D",
    description: "Pour les équipes de recherche qui doivent maintenir rigueur scientifique et ouverture.",
    emoji: "🔬",
    
    biasConfig: {
      priorityBiases: ["confirmation", "availability", "anchoring", "halo_effect"],
      ignoredBiases: [],
      alertThreshold: 0.4,
      riskTolerance: 0.3,
    },
    
    pingConfig: {
      enabledPings: ["bias", "cognitivelock", "spectral", "silence", "momentum"],
      maxPingsPerHour: 4,
      cooldownMinutes: 25,
    },
    
    targetMetrics: {
      diversityIndex: 0.75,
      criticalThinkingScore: 0.85,
      convergenceRate: { min: 0.3, max: 0.5 },
      biasRiskLevel: 0.2,
    },
    
    customMessages: {
      welcome: "Mode R&D activé ! Rigueur méthodologique et ouverture d'esprit sont vos guides.",
      tips: [
        "Une hypothèse n'est pas une conclusion - testez-la !",
        "Les résultats négatifs sont aussi des résultats.",
        "Attention au biais de publication : ce qui ne marche pas mérite aussi d'être documenté.",
      ],
      celebrations: [
        "Excellente rigueur méthodologique !",
        "Vous avez remis en question une hypothèse établie - c'est ça la science !",
        "Belle revue de littérature contradictoire.",
      ],
    },
  },

  operations: {
    id: "operations",
    name: "Équipe Opérations",
    description: "Pour les équipes opérationnelles qui doivent optimiser processus et efficacité.",
    emoji: "📊",
    
    biasConfig: {
      priorityBiases: ["sunk_cost", "anchoring", "availability", "authority"],
      ignoredBiases: ["bandwagon"],
      alertThreshold: 0.55,
      riskTolerance: 0.35,
    },
    
    pingConfig: {
      enabledPings: ["bias", "dominance", "cognitivelock", "momentum"],
      maxPingsPerHour: 4,
      cooldownMinutes: 20,
    },
    
    targetMetrics: {
      diversityIndex: 0.6,
      criticalThinkingScore: 0.65,
      convergenceRate: { min: 0.5, max: 0.7 },
      biasRiskLevel: 0.35,
    },
    
    customMessages: {
      welcome: "Mode Opérations activé ! Efficacité et amélioration continue sont vos mantras.",
      tips: [
        "Les processus existants ont une raison d'être, mais peuvent évoluer.",
        "Les KPIs sont des indicateurs, pas des objectifs absolus.",
        "Attention au 'on a toujours fait comme ça'.",
      ],
      celebrations: [
        "Optimisation validée par les données !",
        "Vous avez identifié un goulot d'étranglement - belle analyse !",
        "Amélioration continue en action.",
      ],
    },
  },

  custom: {
    id: "custom",
    name: "Personnalisé",
    description: "Configuration personnalisée selon vos besoins spécifiques.",
    emoji: "⚡",
    
    biasConfig: {
      priorityBiases: ["confirmation", "groupthink", "overconfidence"],
      ignoredBiases: [],
      alertThreshold: 0.5,
      riskTolerance: 0.5,
    },
    
    pingConfig: {
      enabledPings: ["bias", "groupthink", "dominance", "spectral", "silence"],
      maxPingsPerHour: 4,
      cooldownMinutes: 20,
    },
    
    targetMetrics: {
      diversityIndex: 0.7,
      criticalThinkingScore: 0.7,
      convergenceRate: { min: 0.4, max: 0.6 },
      biasRiskLevel: 0.4,
    },
    
    customMessages: {
      welcome: "Configuration personnalisée activée !",
      tips: [
        "Adaptez les seuils selon votre contexte.",
        "Observez les patterns de votre équipe pour affiner.",
      ],
      celebrations: [
        "Belle progression !",
        "Votre équipe s'améliore.",
      ],
    },
  },
};

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Récupère un template par son ID
 */
export function getTemplate(templateId: TemplateType): CognitiveTemplate {
  return COGNITIVE_TEMPLATES[templateId] || COGNITIVE_TEMPLATES.custom;
}

/**
 * Liste tous les templates disponibles
 */
export function listTemplates(): Array<{ id: TemplateType; name: string; emoji: string; description: string }> {
  return Object.values(COGNITIVE_TEMPLATES).map(t => ({
    id: t.id,
    name: t.name,
    emoji: t.emoji,
    description: t.description,
  }));
}

/**
 * Suggère un template basé sur les caractéristiques de l'équipe
 */
export function suggestTemplate(characteristics: {
  teamSize: number;
  industry?: string;
  phase?: "early" | "growth" | "mature";
  focus?: "innovation" | "quality" | "efficiency";
}): TemplateType {
  const { teamSize, industry, phase, focus } = characteristics;

  // Logique de suggestion basée sur les caractéristiques
  if (phase === "early" || (teamSize <= 5 && !industry)) {
    return "startup";
  }
  
  if (industry?.toLowerCase().includes("tech") || industry?.toLowerCase().includes("software")) {
    return "product_tech";
  }
  
  if (industry?.toLowerCase().includes("conseil") || industry?.toLowerCase().includes("consulting")) {
    return "consulting";
  }
  
  if (industry?.toLowerCase().includes("créa") || industry?.toLowerCase().includes("design") || industry?.toLowerCase().includes("marketing")) {
    return "creative";
  }
  
  if (industry?.toLowerCase().includes("r&d") || industry?.toLowerCase().includes("recherche")) {
    return "research";
  }
  
  if (focus === "efficiency" || industry?.toLowerCase().includes("ops")) {
    return "operations";
  }

  // Par défaut, product_tech est un bon équilibre
  return "product_tech";
}

/**
 * Fusionne un template avec des personnalisations
 */
export function customizeTemplate(
  baseTemplateId: TemplateType,
  customizations: Partial<CognitiveTemplate>
): CognitiveTemplate {
  const base = getTemplate(baseTemplateId);
  
  return {
    ...base,
    ...customizations,
    id: "custom",
    biasConfig: {
      ...base.biasConfig,
      ...(customizations.biasConfig || {}),
    },
    pingConfig: {
      ...base.pingConfig,
      ...(customizations.pingConfig || {}),
    },
    targetMetrics: {
      ...base.targetMetrics,
      ...(customizations.targetMetrics || {}),
    },
    customMessages: {
      ...base.customMessages,
      ...(customizations.customMessages || {}),
    },
  };
}

/**
 * Évalue si les métriques actuelles sont dans les cibles du template
 */
export function evaluateMetricsAgainstTemplate(
  template: CognitiveTemplate,
  currentMetrics: {
    diversityIndex: number;
    criticalThinkingScore: number;
    convergenceRate: number;
    biasRiskLevel: number;
  }
): {
  overall: "good" | "warning" | "critical";
  details: Array<{
    metric: string;
    current: number;
    target: number | { min: number; max: number };
    status: "good" | "warning" | "critical";
    suggestion?: string;
  }>;
} {
  const details: Array<{
    metric: string;
    current: number;
    target: number | { min: number; max: number };
    status: "good" | "warning" | "critical";
    suggestion?: string;
  }> = [];

  // Diversité
  const diversityDiff = currentMetrics.diversityIndex - template.targetMetrics.diversityIndex;
  details.push({
    metric: "Diversité des perspectives",
    current: currentMetrics.diversityIndex,
    target: template.targetMetrics.diversityIndex,
    status: diversityDiff >= -0.1 ? "good" : diversityDiff >= -0.2 ? "warning" : "critical",
    suggestion: diversityDiff < -0.1 ? "Encouragez plus de voix différentes à s'exprimer." : undefined,
  });

  // Pensée critique
  const criticalDiff = currentMetrics.criticalThinkingScore - template.targetMetrics.criticalThinkingScore;
  details.push({
    metric: "Pensée critique",
    current: currentMetrics.criticalThinkingScore,
    target: template.targetMetrics.criticalThinkingScore,
    status: criticalDiff >= -0.1 ? "good" : criticalDiff >= -0.2 ? "warning" : "critical",
    suggestion: criticalDiff < -0.1 ? "Posez plus de questions et challengez les hypothèses." : undefined,
  });

  // Convergence
  const { min, max } = template.targetMetrics.convergenceRate;
  const convergenceStatus = 
    currentMetrics.convergenceRate >= min && currentMetrics.convergenceRate <= max ? "good" :
    currentMetrics.convergenceRate >= min - 0.1 && currentMetrics.convergenceRate <= max + 0.1 ? "warning" : "critical";
  details.push({
    metric: "Taux de convergence",
    current: currentMetrics.convergenceRate,
    target: { min, max },
    status: convergenceStatus,
    suggestion: currentMetrics.convergenceRate < min 
      ? "L'équipe diverge beaucoup - essayez de synthétiser."
      : currentMetrics.convergenceRate > max 
        ? "Trop de consensus rapide - encouragez le débat."
        : undefined,
  });

  // Risque de biais
  const biasRiskDiff = template.targetMetrics.biasRiskLevel - currentMetrics.biasRiskLevel;
  details.push({
    metric: "Niveau de risque de biais",
    current: currentMetrics.biasRiskLevel,
    target: template.targetMetrics.biasRiskLevel,
    status: biasRiskDiff >= 0 ? "good" : biasRiskDiff >= -0.15 ? "warning" : "critical",
    suggestion: biasRiskDiff < 0 ? "Attention aux biais cognitifs détectés." : undefined,
  });

  // Calcul du statut global
  const criticalCount = details.filter(d => d.status === "critical").length;
  const warningCount = details.filter(d => d.status === "warning").length;
  
  const overall = criticalCount > 0 ? "critical" : warningCount >= 2 ? "warning" : "good";

  return { overall, details };
}
