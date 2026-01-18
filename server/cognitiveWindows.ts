/**
 * CSAW - Cognitive Sliding Analysis Windows
 * Multi-scale temporal analysis for cognitive patterns
 * Analyzes team dynamics across short, medium, and long-term windows
 */

// ==================== TYPES ====================

export interface TimeWindow {
  id: string;
  name: string;
  duration: number; // in minutes
  weight: number; // recency weight (higher = more recent matters more)
}

export interface WindowedMetrics {
  windowId: string;
  windowName: string;
  startTime: Date;
  endTime: Date;
  messageCount: number;
  participantCount: number;
  metrics: CognitiveMetrics;
  trends: TrendAnalysis;
}

export interface CognitiveMetrics {
  diversityIndex: number; // 0-1
  criticalThinkingScore: number; // 0-1
  convergenceRate: number; // 0-1
  biasRiskLevel: number; // 0-1
  participationBalance: number; // 0-1
  decisionQuality: number; // 0-1
  cognitiveLoad: number; // 0-1
  emotionalTone: number; // -1 to 1
}

export interface TrendAnalysis {
  direction: "improving" | "stable" | "declining";
  velocity: number; // rate of change
  confidence: number; // 0-1
  prediction: string;
}

export interface CSAWResult {
  projectId: number;
  analyzedAt: Date;
  windows: WindowedMetrics[];
  crossWindowAnalysis: CrossWindowAnalysis;
  adaptiveThresholds: AdaptiveThresholds;
  recommendations: string[];
  alerts: CSAWAlert[];
}

export interface CrossWindowAnalysis {
  shortTermTrend: TrendAnalysis;
  mediumTermTrend: TrendAnalysis;
  longTermTrend: TrendAnalysis;
  divergenceScore: number; // How different are short vs long term patterns
  cyclicalPatterns: CyclicalPattern[];
  anomalies: Anomaly[];
}

export interface CyclicalPattern {
  type: string;
  frequency: string; // e.g., "daily", "weekly"
  description: string;
  confidence: number;
}

export interface Anomaly {
  timestamp: Date;
  type: string;
  severity: "low" | "medium" | "high";
  description: string;
  affectedMetrics: string[];
}

export interface AdaptiveThresholds {
  teamMaturity: "new" | "developing" | "mature" | "expert";
  adjustedBiasThreshold: number;
  adjustedConvergenceThreshold: number;
  adjustedParticipationThreshold: number;
  rationale: string;
}

export interface CSAWAlert {
  type: "trend" | "anomaly" | "threshold" | "pattern";
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  windowId: string;
  metric: string;
  value: number;
  threshold: number;
}

// ==================== WINDOW DEFINITIONS ====================

export const DEFAULT_WINDOWS: TimeWindow[] = [
  { id: "immediate", name: "Immédiat", duration: 15, weight: 1.0 },
  { id: "short", name: "Court terme", duration: 60, weight: 0.8 },
  { id: "medium", name: "Moyen terme", duration: 480, weight: 0.5 }, // 8 hours
  { id: "long", name: "Long terme", duration: 2880, weight: 0.3 }, // 48 hours
  { id: "historical", name: "Historique", duration: 10080, weight: 0.1 }, // 7 days
];

// ==================== MESSAGE INTERFACE ====================

export interface AnalyzableMessage {
  id: number;
  content: string;
  userId: number | null;
  createdAt: Date;
  metadata?: {
    sentiment?: number;
    cognitivePatterns?: string[];
    biasIndicators?: Array<{ type: string; confidence: number }>;
    ctValue?: number;
  } | null;
}

// ==================== MAIN ANALYSIS FUNCTION ====================

export async function analyzeWithCSAW(
  messages: AnalyzableMessage[],
  projectId: number,
  teamCreatedAt?: Date
): Promise<CSAWResult> {
  const now = new Date();
  const windows: WindowedMetrics[] = [];
  
  // Analyze each time window
  for (const windowDef of DEFAULT_WINDOWS) {
    const windowStart = new Date(now.getTime() - windowDef.duration * 60 * 1000);
    const windowMessages = messages.filter(m => 
      m.createdAt >= windowStart && m.createdAt <= now
    );
    
    const metrics = calculateWindowMetrics(windowMessages, windowDef.weight);
    const trends = analyzeTrends(windowMessages, windowDef);
    
    windows.push({
      windowId: windowDef.id,
      windowName: windowDef.name,
      startTime: windowStart,
      endTime: now,
      messageCount: windowMessages.length,
      participantCount: new Set(windowMessages.filter(m => m.userId).map(m => m.userId)).size,
      metrics,
      trends
    });
  }
  
  // Cross-window analysis
  const crossWindowAnalysis = performCrossWindowAnalysis(windows);
  
  // Calculate adaptive thresholds based on team maturity
  const adaptiveThresholds = calculateAdaptiveThresholds(
    messages,
    teamCreatedAt || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // Default 30 days ago
  );
  
  // Generate recommendations and alerts
  const { recommendations, alerts } = generateRecommendationsAndAlerts(
    windows,
    crossWindowAnalysis,
    adaptiveThresholds
  );
  
  return {
    projectId,
    analyzedAt: now,
    windows,
    crossWindowAnalysis,
    adaptiveThresholds,
    recommendations,
    alerts
  };
}

// ==================== METRICS CALCULATION ====================

function calculateWindowMetrics(
  messages: AnalyzableMessage[],
  recencyWeight: number
): CognitiveMetrics {
  if (messages.length === 0) {
    return {
      diversityIndex: 0.5,
      criticalThinkingScore: 0.5,
      convergenceRate: 0,
      biasRiskLevel: 0,
      participationBalance: 1,
      decisionQuality: 0.5,
      cognitiveLoad: 0,
      emotionalTone: 0
    };
  }
  
  // Calculate diversity index based on unique contributors and idea variety
  const uniqueUsers = new Set(messages.filter(m => m.userId).map(m => m.userId));
  const userDiversity = Math.min(1, uniqueUsers.size / 5); // Normalize to 5 users
  
  // Analyze cognitive patterns
  const allPatterns: string[] = [];
  let totalSentiment = 0;
  let sentimentCount = 0;
  let totalBiasRisk = 0;
  let biasCount = 0;
  let totalCT = 0;
  
  for (const msg of messages) {
    if (msg.metadata?.cognitivePatterns) {
      allPatterns.push(...msg.metadata.cognitivePatterns);
    }
    if (msg.metadata?.sentiment !== undefined) {
      totalSentiment += msg.metadata.sentiment;
      sentimentCount++;
    }
    if (msg.metadata?.biasIndicators) {
      const avgBias = msg.metadata.biasIndicators.reduce((sum, b) => sum + b.confidence, 0) / 
                      Math.max(1, msg.metadata.biasIndicators.length);
      totalBiasRisk += avgBias;
      biasCount++;
    }
    if (msg.metadata?.ctValue) {
      totalCT += msg.metadata.ctValue;
    }
  }
  
  // Pattern diversity
  const uniquePatterns = new Set(allPatterns);
  const patternDiversity = Math.min(1, uniquePatterns.size / 10);
  
  // Combined diversity
  const diversityIndex = (userDiversity * 0.6 + patternDiversity * 0.4) * recencyWeight;
  
  // Critical thinking score based on CT values and pattern quality
  const avgCT = totalCT / Math.max(1, messages.length);
  const criticalThinkingScore = Math.min(1, avgCT / 8) * recencyWeight;
  
  // Convergence rate (how quickly opinions align)
  const convergenceRate = calculateConvergenceRate(messages);
  
  // Bias risk level
  const biasRiskLevel = biasCount > 0 ? totalBiasRisk / biasCount : 0;
  
  // Participation balance (Gini coefficient inverse)
  const participationBalance = calculateParticipationBalance(messages);
  
  // Decision quality (composite metric)
  const decisionQuality = (
    diversityIndex * 0.25 +
    criticalThinkingScore * 0.25 +
    (1 - biasRiskLevel) * 0.25 +
    participationBalance * 0.25
  );
  
  // Cognitive load (based on message frequency and complexity)
  const cognitiveLoad = calculateCognitiveLoad(messages);
  
  // Emotional tone
  const emotionalTone = sentimentCount > 0 ? totalSentiment / sentimentCount : 0;
  
  return {
    diversityIndex,
    criticalThinkingScore,
    convergenceRate,
    biasRiskLevel,
    participationBalance,
    decisionQuality,
    cognitiveLoad,
    emotionalTone
  };
}

function calculateConvergenceRate(messages: AnalyzableMessage[]): number {
  if (messages.length < 3) return 0;
  
  // Look for agreement patterns
  const agreementKeywords = ["d'accord", "oui", "exactement", "parfait", "ok", "validé", "approuvé"];
  const disagreementKeywords = ["non", "pas d'accord", "mais", "cependant", "problème", "attention"];
  
  let agreements = 0;
  let disagreements = 0;
  
  for (const msg of messages) {
    const lowerContent = msg.content.toLowerCase();
    if (agreementKeywords.some(k => lowerContent.includes(k))) agreements++;
    if (disagreementKeywords.some(k => lowerContent.includes(k))) disagreements++;
  }
  
  const total = agreements + disagreements;
  if (total === 0) return 0.5;
  
  return agreements / total;
}

function calculateParticipationBalance(messages: AnalyzableMessage[]): number {
  const userMessageCounts = new Map<number, number>();
  
  for (const msg of messages) {
    if (msg.userId) {
      userMessageCounts.set(msg.userId, (userMessageCounts.get(msg.userId) || 0) + 1);
    }
  }
  
  if (userMessageCounts.size <= 1) return 1;
  
  const counts = Array.from(userMessageCounts.values());
  const total = counts.reduce((a, b) => a + b, 0);
  const idealShare = total / counts.length;
  
  const deviations = counts.map(c => Math.abs(c - idealShare));
  const avgDeviation = deviations.reduce((a, b) => a + b, 0) / counts.length;
  
  return Math.max(0, 1 - (avgDeviation / idealShare));
}

function calculateCognitiveLoad(messages: AnalyzableMessage[]): number {
  if (messages.length === 0) return 0;
  
  // Calculate message frequency
  const timeSpan = messages.length > 1 
    ? (messages[messages.length - 1].createdAt.getTime() - messages[0].createdAt.getTime()) / 60000
    : 1;
  
  const messagesPerMinute = messages.length / Math.max(1, timeSpan);
  
  // Calculate average message complexity
  const avgLength = messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length;
  const complexityScore = Math.min(1, avgLength / 500);
  
  // Combined load
  const frequencyLoad = Math.min(1, messagesPerMinute / 5); // Normalize to 5 msg/min
  
  return (frequencyLoad * 0.6 + complexityScore * 0.4);
}

// ==================== TREND ANALYSIS ====================

function analyzeTrends(
  messages: AnalyzableMessage[],
  windowDef: TimeWindow
): TrendAnalysis {
  if (messages.length < 5) {
    return {
      direction: "stable",
      velocity: 0,
      confidence: 0.3,
      prediction: "Données insuffisantes pour une analyse de tendance fiable."
    };
  }
  
  // Split messages into halves for comparison
  const midpoint = Math.floor(messages.length / 2);
  const firstHalf = messages.slice(0, midpoint);
  const secondHalf = messages.slice(midpoint);
  
  // Calculate metrics for each half
  const firstMetrics = calculateWindowMetrics(firstHalf, 1);
  const secondMetrics = calculateWindowMetrics(secondHalf, 1);
  
  // Calculate overall direction based on decision quality
  const qualityChange = secondMetrics.decisionQuality - firstMetrics.decisionQuality;
  const biasChange = secondMetrics.biasRiskLevel - firstMetrics.biasRiskLevel;
  
  // Determine direction
  let direction: TrendAnalysis["direction"];
  if (qualityChange > 0.1 && biasChange < 0) {
    direction = "improving";
  } else if (qualityChange < -0.1 || biasChange > 0.1) {
    direction = "declining";
  } else {
    direction = "stable";
  }
  
  // Calculate velocity (rate of change)
  const velocity = Math.abs(qualityChange) / (windowDef.duration / 60); // per hour
  
  // Confidence based on sample size
  const confidence = Math.min(1, messages.length / 20);
  
  // Generate prediction
  let prediction: string;
  if (direction === "improving") {
    prediction = `La qualité cognitive s'améliore. Maintenir les pratiques actuelles.`;
  } else if (direction === "declining") {
    prediction = `Tendance à la baisse détectée. Intervention recommandée dans les ${Math.round(windowDef.duration / 4)} prochaines minutes.`;
  } else {
    prediction = `Stabilité cognitive. Surveiller les indicateurs de biais.`;
  }
  
  return { direction, velocity, confidence, prediction };
}

// ==================== CROSS-WINDOW ANALYSIS ====================

function performCrossWindowAnalysis(windows: WindowedMetrics[]): CrossWindowAnalysis {
  const shortTerm = windows.find(w => w.windowId === "short");
  const mediumTerm = windows.find(w => w.windowId === "medium");
  const longTerm = windows.find(w => w.windowId === "long");
  
  // Calculate divergence between short and long term
  let divergenceScore = 0;
  if (shortTerm && longTerm) {
    const metricDiffs = [
      Math.abs(shortTerm.metrics.diversityIndex - longTerm.metrics.diversityIndex),
      Math.abs(shortTerm.metrics.biasRiskLevel - longTerm.metrics.biasRiskLevel),
      Math.abs(shortTerm.metrics.participationBalance - longTerm.metrics.participationBalance),
    ];
    divergenceScore = metricDiffs.reduce((a, b) => a + b, 0) / metricDiffs.length;
  }
  
  // Detect cyclical patterns
  const cyclicalPatterns = detectCyclicalPatterns(windows);
  
  // Detect anomalies
  const anomalies = detectAnomalies(windows);
  
  return {
    shortTermTrend: shortTerm?.trends || { direction: "stable", velocity: 0, confidence: 0, prediction: "" },
    mediumTermTrend: mediumTerm?.trends || { direction: "stable", velocity: 0, confidence: 0, prediction: "" },
    longTermTrend: longTerm?.trends || { direction: "stable", velocity: 0, confidence: 0, prediction: "" },
    divergenceScore,
    cyclicalPatterns,
    anomalies
  };
}

function detectCyclicalPatterns(windows: WindowedMetrics[]): CyclicalPattern[] {
  const patterns: CyclicalPattern[] = [];
  
  // Check for activity patterns
  const immediate = windows.find(w => w.windowId === "immediate");
  const historical = windows.find(w => w.windowId === "historical");
  
  if (immediate && historical) {
    // High activity in immediate vs historical
    if (immediate.messageCount > 0 && historical.messageCount > 0) {
      const activityRatio = immediate.messageCount / (historical.messageCount / 7 / 24); // Normalize to hourly
      
      if (activityRatio > 2) {
        patterns.push({
          type: "activity_spike",
          frequency: "ponctuel",
          description: "Pic d'activité détecté par rapport à la moyenne historique",
          confidence: 0.7
        });
      } else if (activityRatio < 0.3) {
        patterns.push({
          type: "activity_drop",
          frequency: "ponctuel",
          description: "Baisse d'activité significative par rapport à la moyenne",
          confidence: 0.7
        });
      }
    }
  }
  
  return patterns;
}

function detectAnomalies(windows: WindowedMetrics[]): Anomaly[] {
  const anomalies: Anomaly[] = [];
  
  for (const window of windows) {
    // Bias spike
    if (window.metrics.biasRiskLevel > 0.7) {
      anomalies.push({
        timestamp: window.endTime,
        type: "bias_spike",
        severity: window.metrics.biasRiskLevel > 0.85 ? "high" : "medium",
        description: `Niveau de risque de biais anormalement élevé (${Math.round(window.metrics.biasRiskLevel * 100)}%)`,
        affectedMetrics: ["biasRiskLevel", "decisionQuality"]
      });
    }
    
    // Participation imbalance
    if (window.metrics.participationBalance < 0.3 && window.participantCount > 2) {
      anomalies.push({
        timestamp: window.endTime,
        type: "participation_imbalance",
        severity: "medium",
        description: "Déséquilibre significatif dans la participation des membres",
        affectedMetrics: ["participationBalance", "diversityIndex"]
      });
    }
    
    // Cognitive overload
    if (window.metrics.cognitiveLoad > 0.8) {
      anomalies.push({
        timestamp: window.endTime,
        type: "cognitive_overload",
        severity: window.metrics.cognitiveLoad > 0.9 ? "high" : "medium",
        description: "Charge cognitive collective élevée détectée",
        affectedMetrics: ["cognitiveLoad", "decisionQuality"]
      });
    }
  }
  
  return anomalies;
}

// ==================== ADAPTIVE THRESHOLDS ====================

function calculateAdaptiveThresholds(
  messages: AnalyzableMessage[],
  teamCreatedAt: Date
): AdaptiveThresholds {
  const now = new Date();
  const teamAgeInDays = (now.getTime() - teamCreatedAt.getTime()) / (1000 * 60 * 60 * 24);
  const totalMessages = messages.length;
  
  // Determine team maturity
  let teamMaturity: AdaptiveThresholds["teamMaturity"];
  let rationale: string;
  
  if (teamAgeInDays < 7 || totalMessages < 50) {
    teamMaturity = "new";
    rationale = "Équipe nouvelle - seuils relaxés pour permettre l'exploration";
  } else if (teamAgeInDays < 30 || totalMessages < 200) {
    teamMaturity = "developing";
    rationale = "Équipe en développement - seuils modérés pour encourager les bonnes pratiques";
  } else if (teamAgeInDays < 90 || totalMessages < 1000) {
    teamMaturity = "mature";
    rationale = "Équipe mature - seuils standards pour maintenir la qualité";
  } else {
    teamMaturity = "expert";
    rationale = "Équipe experte - seuils stricts pour l'excellence cognitive";
  }
  
  // Calculate adjusted thresholds
  const maturityMultipliers: Record<AdaptiveThresholds["teamMaturity"], number> = {
    new: 1.3,
    developing: 1.15,
    mature: 1.0,
    expert: 0.85
  };
  
  const multiplier = maturityMultipliers[teamMaturity];
  
  return {
    teamMaturity,
    adjustedBiasThreshold: Math.min(1, 0.6 * multiplier),
    adjustedConvergenceThreshold: Math.min(1, 0.7 * multiplier),
    adjustedParticipationThreshold: Math.max(0.2, 0.4 / multiplier),
    rationale
  };
}

// ==================== RECOMMENDATIONS & ALERTS ====================

function generateRecommendationsAndAlerts(
  windows: WindowedMetrics[],
  crossAnalysis: CrossWindowAnalysis,
  thresholds: AdaptiveThresholds
): { recommendations: string[]; alerts: CSAWAlert[] } {
  const recommendations: string[] = [];
  const alerts: CSAWAlert[] = [];
  
  const immediate = windows.find(w => w.windowId === "immediate");
  const short = windows.find(w => w.windowId === "short");
  
  // Check immediate window for urgent issues
  if (immediate) {
    if (immediate.metrics.biasRiskLevel > thresholds.adjustedBiasThreshold) {
      alerts.push({
        type: "threshold",
        severity: "warning",
        title: "Risque de biais élevé",
        message: `Le niveau de risque de biais (${Math.round(immediate.metrics.biasRiskLevel * 100)}%) dépasse le seuil adapté à votre équipe.`,
        windowId: "immediate",
        metric: "biasRiskLevel",
        value: immediate.metrics.biasRiskLevel,
        threshold: thresholds.adjustedBiasThreshold
      });
      recommendations.push("Prendre du recul et challenger les hypothèses actuelles");
    }
    
    if (immediate.metrics.participationBalance < thresholds.adjustedParticipationThreshold) {
      alerts.push({
        type: "threshold",
        severity: "info",
        title: "Participation déséquilibrée",
        message: "Certains membres sont sous-représentés dans la discussion récente.",
        windowId: "immediate",
        metric: "participationBalance",
        value: immediate.metrics.participationBalance,
        threshold: thresholds.adjustedParticipationThreshold
      });
      recommendations.push("Solliciter l'avis des membres silencieux");
    }
  }
  
  // Check trends
  if (crossAnalysis.shortTermTrend.direction === "declining") {
    alerts.push({
      type: "trend",
      severity: "warning",
      title: "Tendance à la baisse",
      message: "La qualité cognitive montre une tendance déclinante à court terme.",
      windowId: "short",
      metric: "decisionQuality",
      value: short?.metrics.decisionQuality || 0,
      threshold: 0.5
    });
    recommendations.push("Faire une pause et réévaluer l'approche actuelle");
  }
  
  // Check divergence
  if (crossAnalysis.divergenceScore > 0.3) {
    alerts.push({
      type: "pattern",
      severity: "info",
      title: "Divergence temporelle",
      message: "Les patterns court terme diffèrent significativement des tendances long terme.",
      windowId: "short",
      metric: "divergenceScore",
      value: crossAnalysis.divergenceScore,
      threshold: 0.3
    });
    recommendations.push("Analyser les causes de ce changement de dynamique");
  }
  
  // Add anomaly-based alerts
  for (const anomaly of crossAnalysis.anomalies) {
    alerts.push({
      type: "anomaly",
      severity: anomaly.severity === "high" ? "critical" : anomaly.severity === "medium" ? "warning" : "info",
      title: `Anomalie: ${anomaly.type.replace(/_/g, " ")}`,
      message: anomaly.description,
      windowId: "immediate",
      metric: anomaly.affectedMetrics[0],
      value: 0,
      threshold: 0
    });
  }
  
  // Team maturity-based recommendations
  if (thresholds.teamMaturity === "new") {
    recommendations.push("Établir des rituels de rétrospective pour améliorer la collaboration");
  } else if (thresholds.teamMaturity === "expert") {
    recommendations.push("Maintenir l'excellence en partageant les bonnes pratiques avec d'autres équipes");
  }
  
  return { recommendations, alerts };
}

// ==================== EXPORT HELPER ====================

export function formatCSAWForDisplay(result: CSAWResult): {
  summary: string;
  windowSummaries: Array<{ name: string; status: string; metrics: Record<string, string> }>;
  topAlerts: CSAWAlert[];
  topRecommendations: string[];
} {
  const summary = `Analyse CSAW complète sur ${result.windows.length} fenêtres temporelles. ` +
    `Maturité équipe: ${result.adaptiveThresholds.teamMaturity}. ` +
    `${result.alerts.length} alertes, ${result.recommendations.length} recommandations.`;
  
  const windowSummaries = result.windows.map(w => ({
    name: w.windowName,
    status: w.trends.direction === "improving" ? "✅" : w.trends.direction === "declining" ? "⚠️" : "➡️",
    metrics: {
      "Diversité": `${Math.round(w.metrics.diversityIndex * 100)}%`,
      "Risque biais": `${Math.round(w.metrics.biasRiskLevel * 100)}%`,
      "Participation": `${Math.round(w.metrics.participationBalance * 100)}%`,
      "Qualité": `${Math.round(w.metrics.decisionQuality * 100)}%`
    }
  }));
  
  return {
    summary,
    windowSummaries,
    topAlerts: result.alerts.slice(0, 3),
    topRecommendations: result.recommendations.slice(0, 3)
  };
}
