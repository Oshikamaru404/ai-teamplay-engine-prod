import { describe, expect, it } from "vitest";

// Tests pour smartBiasSystem
import {
  VULGARIZED_BIASES,
  DEFAULT_THRESHOLDS,
  prioritizeBiases,
  groupSimilarBiases,
} from "./smartBiasSystem";

// Tests pour cognitiveTemplates
import {
  COGNITIVE_TEMPLATES,
  getTemplate,
  listTemplates,
  suggestTemplate,
  customizeTemplate,
  evaluateMetricsAgainstTemplate,
} from "./cognitiveTemplates";

// Tests pour vectorMemory
import {
  extractKeywords,
  keywordSimilarity,
  detectPatterns,
} from "./vectorMemory";

// Tests pour notifications
import {
  createPingNotification,
  createCelebrationNotification,
  createInsightNotification,
  shouldSendNotification,
  DEFAULT_PREFERENCES,
} from "./notifications";

// ============================================================================
// TESTS SMART BIAS SYSTEM
// ============================================================================

describe("smartBiasSystem", () => {
  describe("VULGARIZED_BIASES", () => {
    it("contient les infos vulgarisées pour confirmation", () => {
      const info = VULGARIZED_BIASES.confirmation;
      expect(info).toBeDefined();
      expect(info.simpleName).toBe("Le filtre invisible");
      expect(info.emoji).toBe("🔍");
    });

    it("contient les infos vulgarisées pour groupthink", () => {
      const info = VULGARIZED_BIASES.groupthink;
      expect(info).toBeDefined();
      expect(info.simpleName).toBe("L'effet mouton");
    });

    it("a un niveau d'impact pour chaque biais", () => {
      for (const bias of Object.values(VULGARIZED_BIASES)) {
        expect(bias.teamImpactLevel).toBeGreaterThanOrEqual(1);
        expect(bias.teamImpactLevel).toBeLessThanOrEqual(5);
      }
    });
  });

  describe("DEFAULT_THRESHOLDS", () => {
    it("a des seuils de confiance définis", () => {
      expect(DEFAULT_THRESHOLDS.minConfidence).toBeDefined();
      expect(DEFAULT_THRESHOLDS.minConfidence).toBeGreaterThan(0);
      expect(DEFAULT_THRESHOLDS.minConfidence).toBeLessThan(1);
    });
  });

  describe("prioritizeBiases", () => {
    it("retourne les biais dans un ordre", () => {
      const biases = [
        { type: "confirmation" as const, confidence: 0.5, indicators: [], count: 1 },
        { type: "groupthink" as const, confidence: 0.9, indicators: [], count: 2 },
        { type: "anchoring" as const, confidence: 0.7, indicators: [], count: 1 },
      ];
      const prioritized = prioritizeBiases(biases);
      expect(prioritized.length).toBe(3);
    });
  });

  describe("groupSimilarBiases", () => {
    it("groupe les biais par type", () => {
      const biases = [
        { type: "confirmation" as const, confidence: 0.6, indicators: [], count: 1 },
        { type: "confirmation" as const, confidence: 0.7, indicators: [], count: 2 },
        { type: "groupthink" as const, confidence: 0.5, indicators: [], count: 1 },
      ];
      const grouped = groupSimilarBiases(biases);
      expect(grouped.get("confirmation")?.length).toBe(2);
      expect(grouped.get("groupthink")?.length).toBe(1);
    });
  });
});

// ============================================================================
// TESTS COGNITIVE TEMPLATES
// ============================================================================

describe("cognitiveTemplates", () => {
  describe("getTemplate", () => {
    it("retourne le template startup", () => {
      const template = getTemplate("startup");
      expect(template.id).toBe("startup");
      expect(template.name).toBe("Startup Early-Stage");
      expect(template.biasConfig.riskTolerance).toBe(0.8);
    });

    it("retourne le template custom par défaut pour un ID inconnu", () => {
      const template = getTemplate("unknown" as any);
      expect(template.id).toBe("custom");
    });
  });

  describe("listTemplates", () => {
    it("retourne tous les templates disponibles", () => {
      const templates = listTemplates();
      expect(templates.length).toBe(7);
      expect(templates.map(t => t.id)).toContain("startup");
      expect(templates.map(t => t.id)).toContain("product_tech");
    });
  });

  describe("suggestTemplate", () => {
    it("suggère startup pour une petite équipe early-stage", () => {
      const suggestion = suggestTemplate({ teamSize: 3, phase: "early" });
      expect(suggestion).toBe("startup");
    });

    it("suggère product_tech pour une équipe tech", () => {
      const suggestion = suggestTemplate({ teamSize: 10, industry: "Software Tech" });
      expect(suggestion).toBe("product_tech");
    });

    it("suggère creative pour une agence design", () => {
      const suggestion = suggestTemplate({ teamSize: 8, industry: "Design Agency" });
      expect(suggestion).toBe("creative");
    });
  });

  describe("customizeTemplate", () => {
    it("fusionne les personnalisations avec le template de base", () => {
      const customized = customizeTemplate("startup", {
        biasConfig: { alertThreshold: 0.9 },
      });
      
      expect(customized.id).toBe("custom");
      expect(customized.biasConfig.alertThreshold).toBe(0.9);
      expect(customized.biasConfig.riskTolerance).toBe(0.8); // Conservé du template de base
    });
  });

  describe("evaluateMetricsAgainstTemplate", () => {
    it("évalue les métriques comme bonnes si dans les cibles", () => {
      const template = getTemplate("startup");
      const evaluation = evaluateMetricsAgainstTemplate(template, {
        diversityIndex: 0.65,
        criticalThinkingScore: 0.55,
        convergenceRate: 0.5,
        biasRiskLevel: 0.4,
      });
      
      expect(evaluation.overall).toBe("good");
    });

    it("évalue comme critical si métriques très basses", () => {
      const template = getTemplate("product_tech");
      const evaluation = evaluateMetricsAgainstTemplate(template, {
        diversityIndex: 0.3,
        criticalThinkingScore: 0.3,
        convergenceRate: 0.9,
        biasRiskLevel: 0.8,
      });
      
      expect(evaluation.overall).toBe("critical");
    });
  });
});

// ============================================================================
// TESTS VECTOR MEMORY
// ============================================================================

describe("vectorMemory", () => {
  describe("extractKeywords", () => {
    it("extrait les mots-clés d'un texte", () => {
      const keywords = extractKeywords("L'équipe a décidé de lancer le nouveau produit rapidement");
      expect(keywords.length).toBeGreaterThan(0);
      expect(keywords).toContain("équipe");
      expect(keywords).toContain("produit");
    });

    it("ignore les stop words", () => {
      const keywords = extractKeywords("le la les un une des de du et ou mais");
      expect(keywords.length).toBe(0);
    });

    it("limite le nombre de mots-clés", () => {
      const text = "innovation technologie développement produit équipe projet stratégie marché client utilisateur";
      const keywords = extractKeywords(text, 5);
      expect(keywords.length).toBeLessThanOrEqual(5);
    });
  });

  describe("keywordSimilarity", () => {
    it("retourne 1 pour des ensembles identiques", () => {
      const similarity = keywordSimilarity(["a", "b", "c"], ["a", "b", "c"]);
      expect(similarity).toBe(1);
    });

    it("retourne 0 pour des ensembles disjoints", () => {
      const similarity = keywordSimilarity(["a", "b"], ["c", "d"]);
      expect(similarity).toBe(0);
    });

    it("retourne une valeur intermédiaire pour des ensembles partiellement similaires", () => {
      const similarity = keywordSimilarity(["a", "b", "c"], ["a", "b", "d"]);
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(1);
    });
  });

  describe("detectPatterns", () => {
    it("détecte les biais récurrents", () => {
      const memories = [
        { id: "1", type: "decision" as const, content: "", summary: "", keywords: [], relevanceScore: 0.5, metadata: { projectId: 1, teamId: 1, createdAt: new Date(), biasesDetected: ["confirmation"] } },
        { id: "2", type: "decision" as const, content: "", summary: "", keywords: [], relevanceScore: 0.5, metadata: { projectId: 1, teamId: 1, createdAt: new Date(), biasesDetected: ["confirmation"] } },
        { id: "3", type: "decision" as const, content: "", summary: "", keywords: [], relevanceScore: 0.5, metadata: { projectId: 1, teamId: 1, createdAt: new Date(), biasesDetected: ["confirmation"] } },
      ];
      
      const patterns = detectPatterns(memories);
      const biasPattern = patterns.find(p => p.patternType === "recurring_bias");
      expect(biasPattern).toBeDefined();
      expect(biasPattern?.occurrences).toBe(3);
    });

    it("retourne un tableau vide si pas de patterns", () => {
      const patterns = detectPatterns([]);
      expect(patterns).toEqual([]);
    });
  });
});

// ============================================================================
// TESTS NOTIFICATIONS
// ============================================================================

describe("notifications", () => {
  describe("createPingNotification", () => {
    it("crée une notification de ping avec la bonne priorité", () => {
      const notification = createPingNotification("bias", "Biais détecté", "warning");
      expect(notification.type).toBe("ping_triggered");
      expect(notification.priority).toBe(2);
      expect(notification.style).toBe("toast");
    });

    it("utilise le style banner pour les alertes critiques", () => {
      const notification = createPingNotification("bias", "Alerte critique", "critical");
      expect(notification.style).toBe("banner");
      expect(notification.priority).toBe(1);
    });
  });

  describe("createCelebrationNotification", () => {
    it("crée une notification de célébration subtile", () => {
      const notification = createCelebrationNotification("Bravo pour cette décision !");
      expect(notification.type).toBe("celebration");
      expect(notification.priority).toBe(4);
      expect(notification.style).toBe("subtle");
    });
  });

  describe("createInsightNotification", () => {
    it("crée une notification d'insight", () => {
      const notification = createInsightNotification("Votre équipe progresse !");
      expect(notification.type).toBe("cognitive_insight");
      expect(notification.priority).toBe(3);
    });

    it("ajoute une action si un label est fourni", () => {
      const notification = createInsightNotification("Insight", "Voir plus");
      expect(notification.action).toBeDefined();
      expect(notification.action?.label).toBe("Voir plus");
    });
  });

  describe("shouldSendNotification", () => {
    it("bloque les notifications si désactivées", () => {
      const notification = createPingNotification("bias", "Test", "critical");
      const prefs = { ...DEFAULT_PREFERENCES, enabled: false };
      expect(shouldSendNotification(notification, prefs)).toBe(false);
    });

    it("bloque les notifications de type non autorisé", () => {
      const notification = createCelebrationNotification("Test");
      const prefs = { ...DEFAULT_PREFERENCES, allowedTypes: ["bias_alert" as const] };
      expect(shouldSendNotification(notification, prefs)).toBe(false);
    });

    it("bloque les notifications de priorité trop basse", () => {
      const notification = createCelebrationNotification("Test"); // priority 4
      const prefs = { ...DEFAULT_PREFERENCES, minPriority: 2 as const };
      expect(shouldSendNotification(notification, prefs)).toBe(false);
    });

    it("autorise les notifications valides", () => {
      const notification = createPingNotification("bias", "Test", "warning");
      expect(shouldSendNotification(notification, DEFAULT_PREFERENCES)).toBe(true);
    });
  });
});
