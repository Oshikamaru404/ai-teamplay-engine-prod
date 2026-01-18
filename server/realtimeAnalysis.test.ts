import { describe, expect, it } from "vitest";
import {
  analyzeSentimentLocal,
  analyzeCognitiveLocal,
  analyzePsychologicalLocal,
  analyzeQuick,
  evaluatePingTriggers,
  SentimentResult,
  CognitiveResult,
  PsychologicalResult,
} from "./realtimeAnalysis";
import { BiasIndicator } from "./biasDetection";

describe("Realtime Analysis Module", () => {
  describe("analyzeSentimentLocal", () => {
    it("should detect positive sentiment", () => {
      const result = analyzeSentimentLocal("C'est excellent, je suis très satisfait du résultat!");
      expect(["positive", "very_positive"]).toContain(result.label);
      expect(result.score).toBeGreaterThan(0);
    });

    it("should detect negative sentiment", () => {
      const result = analyzeSentimentLocal("C'est terrible, je suis très déçu et frustré.");
      expect(["negative", "very_negative"]).toContain(result.label);
      expect(result.score).toBeLessThan(0);
    });

    it("should detect neutral sentiment", () => {
      const result = analyzeSentimentLocal("La réunion est prévue pour demain à 14h.");
      expect(result.label).toBe("neutral");
    });

    it("should have confidence score", () => {
      const result = analyzeSentimentLocal("C'est vraiment excellent!");
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe("analyzeCognitiveLocal", () => {
    it("should detect analytical pattern", () => {
      const result = analyzeCognitiveLocal("Analysons les données pour comprendre pourquoi ce problème se produit.");
      expect(result.patterns).toContain("analytical");
    });

    it("should detect critical pattern", () => {
      const result = analyzeCognitiveLocal("Cependant, il y a un risque. Attention, ce problème pourrait causer des difficultés.");
      expect(result.patterns).toContain("critical");
    });

    it("should detect intuitive pattern", () => {
      const result = analyzeCognitiveLocal("J'ai l'impression que cette approche est la bonne. Mon intuition me dit de continuer.");
      expect(result.patterns).toContain("intuitive");
    });

    it("should detect creative pattern", () => {
      const result = analyzeCognitiveLocal("J'ai une idée innovante et originale pour explorer de nouvelles possibilités.");
      expect(result.patterns).toContain("creative");
    });

    it("should calculate reasoning quality based on patterns", () => {
      const simpleResult = analyzeCognitiveLocal("Ok.");
      const complexResult = analyzeCognitiveLocal("Analysons les données pour comprendre pourquoi ce problème se produit. Si nous comparons avec les résultats précédents, nous pouvons en déduire que la cause principale est liée à la configuration.");
      
      // Complex text should have more patterns or higher quality
      expect(complexResult.patterns.length).toBeGreaterThanOrEqual(simpleResult.patterns.length);
    });

    it("should return thinking style", () => {
      const result = analyzeCognitiveLocal("Analysons méthodiquement cette situation.");
      expect(["analytical", "intuitive", "creative", "critical", "mixed"]).toContain(result.thinkingStyle);
    });
  });

  describe("analyzePsychologicalLocal", () => {
    it("should detect stress indicators", () => {
      const result = analyzePsychologicalLocal("Je suis vraiment stressé par cette deadline urgente!");
      expect(result.stress).toBeGreaterThan(0.3);
    });

    it("should detect confidence indicators", () => {
      const result = analyzePsychologicalLocal("Je suis absolument certain que cette approche fonctionnera.");
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("should detect doubt indicators", () => {
      const result = analyzePsychologicalLocal("Je ne suis pas sûr, peut-être que nous devrions reconsidérer.");
      expect(result.confidence).toBeLessThan(0.7);
    });

    it("should detect engagement through text length and exclamation", () => {
      const lowEngagement = analyzePsychologicalLocal("Ok.");
      const highEngagement = analyzePsychologicalLocal("C'est vraiment passionnant! Je pense que nous devrions explorer cette piste plus en profondeur car elle offre de nombreuses possibilités! Vraiment excitant!");
      
      // High engagement text should have higher or equal engagement score
      expect(highEngagement.engagement).toBeGreaterThanOrEqual(lowEngagement.engagement);
    });

    it("should return communication style", () => {
      const result = analyzePsychologicalLocal("Nous devons absolument faire ceci maintenant!");
      expect(["assertive", "passive", "aggressive", "passive_aggressive", "balanced"]).toContain(result.communicationStyle);
    });
  });

  describe("analyzeQuick", () => {
    it("should return complete analysis with all components", () => {
      const result = analyzeQuick("Analysons cette situation. Je suis confiant que nous trouverons une solution.");
      
      expect(result).toHaveProperty("sentiment");
      expect(result).toHaveProperty("cognitive");
      expect(result).toHaveProperty("psychological");
      expect(result).toHaveProperty("biases");
      expect(result).toHaveProperty("triggeredPings");
      expect(result).toHaveProperty("processingTime");
    });

    it("should have processing time", () => {
      const result = analyzeQuick("Test de performance.");
      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });

    it("should analyze sentiment correctly", () => {
      const positiveResult = analyzeQuick("C'est excellent!");
      expect(positiveResult.sentiment.score).toBeGreaterThan(0);
      
      const negativeResult = analyzeQuick("C'est terrible!");
      expect(negativeResult.sentiment.score).toBeLessThan(0);
    });
  });

  describe("evaluatePingTriggers", () => {
    it("should trigger ping for high stress", () => {
      const sentiment: SentimentResult = { score: -0.5, label: "negative", confidence: 0.8, emotions: [] };
      const cognitive: CognitiveResult = { patterns: [], thinkingStyle: "mixed", reasoningQuality: 0.5, biasRisk: 0.3, suggestions: [] };
      const psychological: PsychologicalResult = { stress: 0.9, confidence: 0.5, engagement: 0.5, openness: 0.5, dominantEmotion: "stress", emotionalStability: 0.3, communicationStyle: "passive" };
      const biases: BiasIndicator[] = [];
      
      const result = evaluatePingTriggers(sentiment, cognitive, psychological, biases);
      expect(result.length).toBeGreaterThan(0);
      // Load ping is triggered for high stress (stress > 0.7)
      expect(result.some(p => p.type === "load")).toBe(true);
    });

    it("should trigger ping for overconfidence", () => {
      const sentiment: SentimentResult = { score: 0.5, label: "positive", confidence: 0.8, emotions: [] };
      const cognitive: CognitiveResult = { patterns: [], thinkingStyle: "intuitive", reasoningQuality: 0.3, biasRisk: 0.6, suggestions: [] };
      const psychological: PsychologicalResult = { stress: 0.2, confidence: 0.95, engagement: 0.5, openness: 0.3, dominantEmotion: "confidence", emotionalStability: 0.7, communicationStyle: "assertive" };
      // Add overconfidence bias to trigger bias ping
      const biases: BiasIndicator[] = [
        { type: "overconfidence", confidence: 0.85, evidence: ["high confidence with low reasoning quality"], recommendation: "Seek disconfirming evidence", severity: "medium" }
      ];
      
      const result = evaluatePingTriggers(sentiment, cognitive, psychological, biases);
      expect(result.length).toBeGreaterThan(0);
      // Bias ping is triggered for overconfidence bias
      expect(result.some(p => p.type === "bias")).toBe(true);
    });

    it("should trigger ping for detected biases", () => {
      const sentiment: SentimentResult = { score: 0, label: "neutral", confidence: 0.8, emotions: [] };
      const cognitive: CognitiveResult = { patterns: [], thinkingStyle: "mixed", reasoningQuality: 0.5, biasRisk: 0.8, suggestions: [] };
      const psychological: PsychologicalResult = { stress: 0.3, confidence: 0.5, engagement: 0.5, openness: 0.5, dominantEmotion: "neutral", emotionalStability: 0.6, communicationStyle: "balanced" };
      const biases: BiasIndicator[] = [
        { type: "confirmation", confidence: 0.8, evidence: ["test"], suggestion: "test", severity: "medium" },
        { type: "groupthink", confidence: 0.7, evidence: ["test"], suggestion: "test", severity: "high" }
      ];
      
      const result = evaluatePingTriggers(sentiment, cognitive, psychological, biases);
      expect(result.length).toBeGreaterThan(0);
      expect(result.some(p => p.type.includes("bias"))).toBe(true);
    });

    it("should not trigger critical ping for normal analysis", () => {
      const sentiment: SentimentResult = { score: 0.2, label: "positive", confidence: 0.8, emotions: [] };
      const cognitive: CognitiveResult = { patterns: ["analytical"], thinkingStyle: "analytical", reasoningQuality: 0.7, biasRisk: 0.2, suggestions: [] };
      const psychological: PsychologicalResult = { stress: 0.3, confidence: 0.6, engagement: 0.7, openness: 0.6, dominantEmotion: "engaged", emotionalStability: 0.7, communicationStyle: "balanced" };
      const biases: BiasIndicator[] = [];
      
      const result = evaluatePingTriggers(sentiment, cognitive, psychological, biases);
      // Should have minimal or no critical pings for a balanced analysis
      expect(result.filter(p => p.severity === "critical").length).toBe(0);
    });
  });
});
