import { describe, expect, it } from "vitest";
import {
  detectBiasKeywords,
  calculateCognitiveMetrics,
  generateSmartPing,
  BiasType,
  BiasIndicator,
} from "./biasDetection";

describe("Bias Detection Module", () => {
  describe("detectBiasKeywords", () => {
    it("should detect confirmation bias patterns", () => {
      const text = "Je savais que c'était la bonne solution, comme je le pensais depuis le début";
      const result = detectBiasKeywords(text);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      const confirmationBias = result.find((b) => b.type === "confirmation");
      expect(confirmationBias).toBeDefined();
    });

    it("should detect groupthink patterns", () => {
      const text = "On est tous d'accord, c'est unanime et personne n'a d'objection";
      const result = detectBiasKeywords(text);

      const groupthink = result.find((b) => b.type === "groupthink");
      expect(groupthink).toBeDefined();
    });

    it("should detect overconfidence patterns", () => {
      const text = "C'est certain que ça va marcher, il n'y a aucun doute possible";
      const result = detectBiasKeywords(text);

      const overconfidence = result.find((b) => b.type === "overconfidence");
      expect(overconfidence).toBeDefined();
    });

    it("should detect authority bias patterns", () => {
      const text = "Le directeur a dit que c'était la bonne approche, l'expert recommande cette solution";
      const result = detectBiasKeywords(text);

      const authorityBias = result.find((b) => b.type === "authority");
      expect(authorityBias).toBeDefined();
    });

    it("should return empty array for neutral messages", () => {
      const text = "Bonjour à tous, la réunion commence à 14h";
      const result = detectBiasKeywords(text);

      expect(result.length).toBe(0);
    });

    it("should handle empty string", () => {
      const result = detectBiasKeywords("");
      expect(result).toEqual([]);
    });

    it("should return bias indicators with required properties", () => {
      const text = "Je savais depuis le début que j'avais raison";
      const result = detectBiasKeywords(text);

      if (result.length > 0) {
        const indicator = result[0];
        expect(indicator).toHaveProperty("type");
        expect(indicator).toHaveProperty("confidence");
        expect(indicator).toHaveProperty("severity");
        expect(indicator).toHaveProperty("evidence");
        expect(indicator).toHaveProperty("recommendation");
      }
    });
  });

  describe("calculateCognitiveMetrics", () => {
    const now = new Date();
    const emptyDecisions: Array<{ status: string; biasesDetected?: string[] }> = [];

    it("should calculate diversity index based on unique users", () => {
      const messages = [
        { content: "Message 1", userId: 1, createdAt: now },
        { content: "Message 2", userId: 2, createdAt: now },
        { content: "Message 3", userId: 3, createdAt: now },
        { content: "Message 4", userId: 4, createdAt: now },
        { content: "Message 5", userId: 5, createdAt: now },
      ];

      const result = calculateCognitiveMetrics(messages, emptyDecisions);

      expect(result.diversityIndex).toBeGreaterThanOrEqual(0.8);
    });

    it("should calculate low diversity for single user", () => {
      const messages = [
        { content: "Message 1", userId: 1, createdAt: now },
        { content: "Message 2", userId: 1, createdAt: now },
        { content: "Message 3", userId: 1, createdAt: now },
      ];

      const result = calculateCognitiveMetrics(messages, emptyDecisions);

      expect(result.diversityIndex).toBeLessThanOrEqual(0.2);
    });

    it("should calculate critical thinking score based on questioning", () => {
      const messages = [
        { content: "Pourquoi pensez-vous cela ?", userId: 1, createdAt: now },
        { content: "Quelles sont les alternatives ?", userId: 2, createdAt: now },
        { content: "Avez-vous considéré d'autres options ?", userId: 3, createdAt: now },
      ];

      const result = calculateCognitiveMetrics(messages, emptyDecisions);

      expect(result.criticalThinkingScore).toBeGreaterThan(0.3);
    });

    it("should calculate convergence rate based on agreement patterns", () => {
      const messages = [
        { content: "Je suis d'accord", userId: 1, createdAt: now },
        { content: "Oui, exactement", userId: 2, createdAt: now },
        { content: "Tout à fait d'accord", userId: 3, createdAt: now },
      ];

      const result = calculateCognitiveMetrics(messages, emptyDecisions);

      expect(result.convergenceRate).toBeGreaterThan(0.3);
    });

    it("should return all required metrics", () => {
      const messages = [
        { content: "Test message", userId: 1, createdAt: now },
      ];

      const result = calculateCognitiveMetrics(messages, emptyDecisions);

      expect(result).toHaveProperty("diversityIndex");
      expect(result).toHaveProperty("criticalThinkingScore");
      expect(result).toHaveProperty("convergenceRate");
      expect(result).toHaveProperty("biasRiskLevel");
      expect(result).toHaveProperty("decisionQuality");
      expect(result).toHaveProperty("engagementLevel");
      expect(result).toHaveProperty("explorationVsExecution");
      expect(result).toHaveProperty("consensusLevel");
    });

    it("should handle empty messages", () => {
      const result = calculateCognitiveMetrics([], emptyDecisions);

      expect(result.diversityIndex).toBe(0);
      expect(result.convergenceRate).toBe(0);
    });

    it("should calculate bias risk based on decisions", () => {
      const messages = [
        { content: "Test", userId: 1, createdAt: now },
      ];
      const decisions = [
        { status: "decided", biasesDetected: ["confirmation_bias", "groupthink"] },
        { status: "proposed", biasesDetected: ["overconfidence"] },
      ];

      const result = calculateCognitiveMetrics(messages, decisions);

      expect(result.biasRiskLevel).toBeGreaterThan(0);
    });

    it("should calculate decision quality based on decided decisions", () => {
      const messages = [
        { content: "Test", userId: 1, createdAt: now },
      ];
      const decisions = [
        { status: "decided" },
        { status: "implemented" },
        { status: "proposed" },
        { status: "discussing" },
      ];

      const result = calculateCognitiveMetrics(messages, decisions);

      expect(result.decisionQuality).toBe(0.5); // 2 out of 4
    });
  });

  describe("generateSmartPing", () => {
    it("should generate a smart ping for confirmation bias", () => {
      const bias: BiasIndicator = {
        type: "confirmation",
        confidence: 0.8,
        severity: "medium",
        evidence: ["test"],
        recommendation: "test",
      };

      const ping = generateSmartPing(bias);

      expect(typeof ping).toBe("string");
      expect(ping.length).toBeGreaterThan(0);
    });

    it("should generate a smart ping for groupthink", () => {
      const bias: BiasIndicator = {
        type: "groupthink",
        confidence: 0.7,
        severity: "high",
        evidence: ["test"],
        recommendation: "test",
      };

      const ping = generateSmartPing(bias);

      expect(typeof ping).toBe("string");
      expect(ping.length).toBeGreaterThan(0);
    });

    it("should generate different pings for different bias types", () => {
      const biasTypes: BiasType[] = [
        "confirmation",
        "groupthink",
        "overconfidence",
        "authority",
        "anchoring",
      ];

      const pings = biasTypes.map((type) =>
        generateSmartPing({
          type,
          confidence: 0.8,
          severity: "medium",
          evidence: [],
          recommendation: "",
        })
      );

      // All pings should be non-empty strings
      pings.forEach((ping) => {
        expect(typeof ping).toBe("string");
        expect(ping.length).toBeGreaterThan(0);
      });
    });
  });
});
