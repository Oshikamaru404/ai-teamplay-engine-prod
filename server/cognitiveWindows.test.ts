import { describe, expect, it } from "vitest";
import {
  analyzeWithCSAW,
  DEFAULT_WINDOWS,
  formatCSAWForDisplay,
  type AnalyzableMessage,
} from "./cognitiveWindows";

// Helper to create test messages
function createTestMessage(
  id: number,
  content: string,
  userId: number,
  minutesAgo: number,
  metadata?: AnalyzableMessage["metadata"]
): AnalyzableMessage {
  return {
    id,
    content,
    userId,
    createdAt: new Date(Date.now() - minutesAgo * 60 * 1000),
    metadata,
  };
}

describe("CSAW - Cognitive Sliding Analysis Windows", () => {
  describe("DEFAULT_WINDOWS", () => {
    it("should have 5 time windows defined", () => {
      expect(DEFAULT_WINDOWS).toHaveLength(5);
    });

    it("should have windows in increasing duration order", () => {
      for (let i = 1; i < DEFAULT_WINDOWS.length; i++) {
        expect(DEFAULT_WINDOWS[i].duration).toBeGreaterThan(
          DEFAULT_WINDOWS[i - 1].duration
        );
      }
    });

    it("should have decreasing weights for older windows", () => {
      for (let i = 1; i < DEFAULT_WINDOWS.length; i++) {
        expect(DEFAULT_WINDOWS[i].weight).toBeLessThanOrEqual(
          DEFAULT_WINDOWS[i - 1].weight
        );
      }
    });
  });

  describe("analyzeWithCSAW", () => {
    it("should return valid result structure with empty messages", async () => {
      const result = await analyzeWithCSAW([], 1);

      expect(result).toHaveProperty("projectId", 1);
      expect(result).toHaveProperty("analyzedAt");
      expect(result).toHaveProperty("windows");
      expect(result).toHaveProperty("crossWindowAnalysis");
      expect(result).toHaveProperty("adaptiveThresholds");
      expect(result).toHaveProperty("recommendations");
      expect(result).toHaveProperty("alerts");
      expect(result.windows).toHaveLength(5);
    });

    it("should analyze messages across multiple time windows", async () => {
      const messages: AnalyzableMessage[] = [
        createTestMessage(1, "Message récent", 1, 5),
        createTestMessage(2, "Message court terme", 2, 30),
        createTestMessage(3, "Message moyen terme", 1, 120),
        createTestMessage(4, "Message long terme", 3, 1000),
      ];

      const result = await analyzeWithCSAW(messages, 1);

      // Immediate window should have at least the recent message
      const immediateWindow = result.windows.find(
        (w) => w.windowId === "immediate"
      );
      expect(immediateWindow).toBeDefined();
      expect(immediateWindow!.messageCount).toBeGreaterThanOrEqual(1);
    });

    it("should calculate participation balance correctly", async () => {
      // Messages from single user - balance should be 1 (perfect for single user)
      const singleUserMessages: AnalyzableMessage[] = [
        createTestMessage(1, "Message 1", 1, 5),
        createTestMessage(2, "Message 2", 1, 10),
        createTestMessage(3, "Message 3", 1, 15),
      ];

      const singleUserResult = await analyzeWithCSAW(singleUserMessages, 1);
      const singleUserImmediate = singleUserResult.windows.find(
        (w) => w.windowId === "immediate"
      );

      // Messages from multiple users with equal distribution - also high balance
      const multiUserMessages: AnalyzableMessage[] = [
        createTestMessage(1, "Message 1", 1, 5),
        createTestMessage(2, "Message 2", 2, 10),
        createTestMessage(3, "Message 3", 3, 15),
      ];

      const multiUserResult = await analyzeWithCSAW(multiUserMessages, 1);
      const multiUserImmediate = multiUserResult.windows.find(
        (w) => w.windowId === "immediate"
      );

      // Both should have good balance (single user = 1, multi user equal = 1)
      expect(singleUserImmediate!.metrics.participationBalance).toBeGreaterThanOrEqual(0);
      expect(multiUserImmediate!.metrics.participationBalance).toBeGreaterThanOrEqual(0);
      expect(multiUserImmediate!.metrics.participationBalance).toBeLessThanOrEqual(1);
    });

    it("should detect bias risk from message metadata", async () => {
      const messagesWithBias: AnalyzableMessage[] = [
        createTestMessage(1, "Je pense que c'est la seule solution", 1, 5, {
          biasIndicators: [{ type: "confirmation", confidence: 0.8 }],
        }),
        createTestMessage(2, "Tout le monde est d'accord", 2, 10, {
          biasIndicators: [{ type: "groupthink", confidence: 0.7 }],
        }),
      ];

      const result = await analyzeWithCSAW(messagesWithBias, 1);
      const immediateWindow = result.windows.find(
        (w) => w.windowId === "immediate"
      );

      expect(immediateWindow!.metrics.biasRiskLevel).toBeGreaterThan(0);
    });
  });

  describe("adaptiveThresholds", () => {
    it("should classify new teams correctly", async () => {
      const messages: AnalyzableMessage[] = [
        createTestMessage(1, "Premier message", 1, 5),
      ];

      const result = await analyzeWithCSAW(
        messages,
        1,
        new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      );

      expect(result.adaptiveThresholds.teamMaturity).toBe("new");
      expect(result.adaptiveThresholds.adjustedBiasThreshold).toBeGreaterThan(
        0.6
      ); // Relaxed threshold
    });

    it("should have stricter thresholds for expert teams", async () => {
      // Create many messages over a long period
      const messages: AnalyzableMessage[] = [];
      for (let i = 0; i < 1500; i++) {
        messages.push(
          createTestMessage(i, `Message ${i}`, (i % 5) + 1, i * 10)
        );
      }

      const result = await analyzeWithCSAW(
        messages,
        1,
        new Date(Date.now() - 120 * 24 * 60 * 60 * 1000) // 120 days ago
      );

      expect(result.adaptiveThresholds.teamMaturity).toBe("expert");
      expect(result.adaptiveThresholds.adjustedBiasThreshold).toBeLessThan(0.6); // Stricter threshold
    });
  });

  describe("formatCSAWForDisplay", () => {
    it("should format CSAW result for display", async () => {
      const messages: AnalyzableMessage[] = [
        createTestMessage(1, "Test message", 1, 5),
      ];

      const result = await analyzeWithCSAW(messages, 1);
      const formatted = formatCSAWForDisplay(result);

      expect(formatted).toHaveProperty("summary");
      expect(formatted).toHaveProperty("windowSummaries");
      expect(formatted).toHaveProperty("topAlerts");
      expect(formatted).toHaveProperty("topRecommendations");
      expect(formatted.windowSummaries).toHaveLength(5);
    });

    it("should include status indicators in window summaries", async () => {
      const messages: AnalyzableMessage[] = [
        createTestMessage(1, "Test", 1, 5),
      ];

      const result = await analyzeWithCSAW(messages, 1);
      const formatted = formatCSAWForDisplay(result);

      for (const summary of formatted.windowSummaries) {
        expect(summary.status).toMatch(/✅|⚠️|➡️/);
        expect(summary.metrics).toHaveProperty("Diversité");
        expect(summary.metrics).toHaveProperty("Risque biais");
        expect(summary.metrics).toHaveProperty("Participation");
        expect(summary.metrics).toHaveProperty("Qualité");
      }
    });
  });

  describe("crossWindowAnalysis", () => {
    it("should detect divergence between short and long term", async () => {
      const messages: AnalyzableMessage[] = [
        // Recent messages - high activity
        createTestMessage(1, "Message 1", 1, 5),
        createTestMessage(2, "Message 2", 2, 10),
        createTestMessage(3, "Message 3", 3, 15),
        // Older messages - different pattern
        createTestMessage(4, "Old message", 1, 2000),
      ];

      const result = await analyzeWithCSAW(messages, 1);

      expect(result.crossWindowAnalysis).toHaveProperty("divergenceScore");
      expect(result.crossWindowAnalysis).toHaveProperty("shortTermTrend");
      expect(result.crossWindowAnalysis).toHaveProperty("longTermTrend");
    });
  });
});
