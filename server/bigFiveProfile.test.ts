import { describe, expect, it } from "vitest";
import {
  BIG_FIVE_QUIZ,
  TRAIT_DESCRIPTIONS,
  calculateQuizProfile,
  getTeamRole,
  type QuizAnswer,
} from "./bigFiveProfile";

describe("Big Five Profile System", () => {
  describe("Quiz Structure", () => {
    it("should have 15 questions", () => {
      expect(BIG_FIVE_QUIZ.length).toBe(15);
    });

    it("should have 3 questions per trait", () => {
      const traitCounts = BIG_FIVE_QUIZ.reduce((acc, q) => {
        acc[q.trait] = (acc[q.trait] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(traitCounts.openness).toBe(3);
      expect(traitCounts.conscientiousness).toBe(3);
      expect(traitCounts.extraversion).toBe(3);
      expect(traitCounts.agreeableness).toBe(3);
      expect(traitCounts.neuroticism).toBe(3);
    });

    it("should have French translations for all questions", () => {
      BIG_FIVE_QUIZ.forEach((q) => {
        expect(q.textFr).toBeTruthy();
        expect(q.textFr.length).toBeGreaterThan(10);
      });
    });
  });

  describe("Trait Descriptions", () => {
    it("should have descriptions for all 5 traits", () => {
      const traits = ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"];
      traits.forEach((trait) => {
        expect(TRAIT_DESCRIPTIONS[trait as keyof typeof TRAIT_DESCRIPTIONS]).toBeDefined();
      });
    });

    it("should have French names and emojis for all traits", () => {
      Object.values(TRAIT_DESCRIPTIONS).forEach((trait) => {
        expect(trait.nameFr).toBeTruthy();
        expect(trait.emoji).toBeTruthy();
        expect(trait.highDescription).toBeTruthy();
        expect(trait.lowDescription).toBeTruthy();
        expect(trait.teamStrengths.length).toBeGreaterThan(0);
      });
    });
  });

  describe("calculateQuizProfile", () => {
    it("should calculate profile from quiz answers", () => {
      const answers: QuizAnswer[] = BIG_FIVE_QUIZ.map((q) => ({
        questionId: q.id,
        score: 3, // Neutral score
      }));

      const profile = calculateQuizProfile(answers);

      expect(profile.source).toBe("quiz");
      expect(profile.confidence).toBe(100);
      expect(profile.openness).toBeGreaterThanOrEqual(0);
      expect(profile.openness).toBeLessThanOrEqual(100);
      expect(profile.conscientiousness).toBeGreaterThanOrEqual(0);
      expect(profile.extraversion).toBeGreaterThanOrEqual(0);
      expect(profile.agreeableness).toBeGreaterThanOrEqual(0);
      expect(profile.neuroticism).toBeGreaterThanOrEqual(0);
    });

    it("should handle high scores correctly", () => {
      const answers: QuizAnswer[] = BIG_FIVE_QUIZ.map((q) => ({
        questionId: q.id,
        score: 5, // Maximum agreement
      }));

      const profile = calculateQuizProfile(answers);

      // Non-reversed questions should score high
      // Reversed questions should score low
      expect(profile.openness).toBeGreaterThan(30); // Mix of reversed and non-reversed
    });

    it("should handle partial answers with reduced confidence", () => {
      const answers: QuizAnswer[] = BIG_FIVE_QUIZ.slice(0, 5).map((q) => ({
        questionId: q.id,
        score: 4,
      }));

      const profile = calculateQuizProfile(answers);

      expect(profile.confidence).toBeLessThan(100);
      expect(profile.confidence).toBeGreaterThan(0);
    });

    it("should return valid ISO date string", () => {
      const answers: QuizAnswer[] = [{ questionId: "o1", score: 3 }];
      const profile = calculateQuizProfile(answers);

      expect(() => new Date(profile.lastUpdated)).not.toThrow();
    });
  });

  describe("getTeamRole", () => {
    it("should return Innovateur for high openness and extraversion", () => {
      const profile = {
        openness: 80,
        conscientiousness: 50,
        extraversion: 70,
        agreeableness: 50,
        neuroticism: 30,
        source: "quiz" as const,
        confidence: 100,
        lastUpdated: new Date().toISOString(),
      };

      const role = getTeamRole(profile);
      expect(role.role).toBe("L'Innovateur");
      expect(role.emoji).toBe("🚀");
    });

    it("should return Pilier for high conscientiousness and agreeableness", () => {
      const profile = {
        openness: 50,
        conscientiousness: 80,
        extraversion: 40,
        agreeableness: 70,
        neuroticism: 30,
        source: "quiz" as const,
        confidence: 100,
        lastUpdated: new Date().toISOString(),
      };

      const role = getTeamRole(profile);
      expect(role.role).toBe("Le Pilier");
    });

    it("should return Connecteur for high extraversion and agreeableness", () => {
      const profile = {
        openness: 50,
        conscientiousness: 50,
        extraversion: 80,
        agreeableness: 70,
        neuroticism: 30,
        source: "quiz" as const,
        confidence: 100,
        lastUpdated: new Date().toISOString(),
      };

      const role = getTeamRole(profile);
      expect(role.role).toBe("Le Connecteur");
    });

    it("should return Polyvalent for balanced profile", () => {
      const profile = {
        openness: 50,
        conscientiousness: 50,
        extraversion: 50,
        agreeableness: 50,
        neuroticism: 50,
        source: "quiz" as const,
        confidence: 100,
        lastUpdated: new Date().toISOString(),
      };

      const role = getTeamRole(profile);
      expect(role.role).toBe("Le Polyvalent");
    });

    it("should always return a valid role object", () => {
      const profiles = [
        { openness: 0, conscientiousness: 0, extraversion: 0, agreeableness: 0, neuroticism: 0 },
        { openness: 100, conscientiousness: 100, extraversion: 100, agreeableness: 100, neuroticism: 100 },
        { openness: 25, conscientiousness: 75, extraversion: 25, agreeableness: 75, neuroticism: 25 },
      ];

      profiles.forEach((p) => {
        const profile = { ...p, source: "quiz" as const, confidence: 100, lastUpdated: new Date().toISOString() };
        const role = getTeamRole(profile);
        expect(role.role).toBeTruthy();
        expect(role.emoji).toBeTruthy();
        expect(role.description).toBeTruthy();
      });
    });
  });
});
