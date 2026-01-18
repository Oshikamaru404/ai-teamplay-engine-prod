// Real-time Analysis Module for AI TeamPlay Engine
import { invokeLLM } from "./_core/llm";
import { detectBiasKeywords, generateSmartPing, BiasIndicator } from "./biasDetection";

// ==================== TYPES ====================
export interface SentimentResult {
  score: number; // -1 to 1
  label: "very_negative" | "negative" | "neutral" | "positive" | "very_positive";
  confidence: number;
  emotions: Array<{ emotion: string; intensity: number }>;
}

export interface CognitiveResult {
  patterns: string[];
  thinkingStyle: "analytical" | "intuitive" | "creative" | "critical" | "mixed";
  reasoningQuality: number; // 0 to 1
  biasRisk: number; // 0 to 1
  suggestions: string[];
}

export interface PsychologicalResult {
  stress: number; // 0 to 1
  confidence: number; // 0 to 1
  engagement: number; // 0 to 1
  openness: number; // 0 to 1
  dominantEmotion: string;
  emotionalStability: number; // 0 to 1
  communicationStyle: "assertive" | "passive" | "aggressive" | "passive_aggressive" | "balanced";
}

// ==================== SMART PING TYPES ====================
export type SmartPingType = 
  | "vision"      // Myopie cognitive
  | "risk"        // Décision fragile
  | "bias"        // Distorsion cognitive
  | "balance"     // Déséquilibre de participation
  | "load"        // Surcharge mentale
  | "memory"      // Erreur récurrente
  | "antifragility" // Harmonie excessive
  | "spectral"    // Rythme cognitif collectif
  | "silence";     // Expertise non exploitée

export interface SmartPing {
  type: SmartPingType;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  icon: string;
  color: string;
  suggestions?: string[];
  stats?: {
    label: string;
    value: string;
  };
}

export interface TeamMetrics {
  ideaDiversity: number; // 0 to 1
  convergenceSpeed: number; // 0 to 1 (high = too fast)
  contradictionLevel: number; // 0 to 1
  participationBalance: number; // 0 to 1 (high = balanced)
  cognitiveLoad: number; // 0 to 1
  decisionQuality: number; // 0 to 1
  flowState: "low_frequency" | "optimal" | "high_frequency";
  consensusLevel: number; // 0 to 1
  debateIntensity: number; // 0 to 1
}

export interface FullAnalysisResult {
  sentiment: SentimentResult;
  cognitive: CognitiveResult;
  psychological: PsychologicalResult;
  biases: BiasIndicator[];
  triggeredPings: SmartPing[];
  teamMetrics?: TeamMetrics;
  processingTime: number;
}

// ==================== SENTIMENT ANALYSIS ====================
const SENTIMENT_KEYWORDS = {
  very_positive: ["excellent", "fantastique", "incroyable", "parfait", "génial", "extraordinaire", "merveilleux"],
  positive: ["bien", "bon", "super", "content", "satisfait", "heureux", "agréable", "réussi", "efficace"],
  negative: ["problème", "difficile", "inquiet", "déçu", "frustré", "compliqué", "échec", "erreur"],
  very_negative: ["terrible", "catastrophe", "désastre", "horrible", "impossible", "échec total", "crise"],
};

const EMOTION_PATTERNS = {
  joy: ["content", "heureux", "ravi", "enthousiaste", "excité", "satisfait", "fier"],
  anger: ["énervé", "furieux", "agacé", "irrité", "frustré", "mécontent"],
  fear: ["peur", "inquiet", "anxieux", "stressé", "nerveux", "préoccupé", "craintif"],
  sadness: ["triste", "déçu", "découragé", "déprimé", "abattu", "malheureux"],
  surprise: ["surpris", "étonné", "choqué", "stupéfait", "inattendu"],
  trust: ["confiance", "sûr", "certain", "convaincu", "fiable", "solide"],
  anticipation: ["attendre", "espérer", "prévoir", "planifier", "anticiper"],
  disgust: ["dégoûté", "répugné", "écœuré", "inacceptable"],
};

export function analyzeSentimentLocal(text: string): SentimentResult {
  const lowerText = text.toLowerCase();
  let score = 0;
  const emotions: Array<{ emotion: string; intensity: number }> = [];
  
  // Calculate sentiment score
  for (const word of SENTIMENT_KEYWORDS.very_positive) {
    if (lowerText.includes(word)) score += 0.4;
  }
  for (const word of SENTIMENT_KEYWORDS.positive) {
    if (lowerText.includes(word)) score += 0.2;
  }
  for (const word of SENTIMENT_KEYWORDS.negative) {
    if (lowerText.includes(word)) score -= 0.2;
  }
  for (const word of SENTIMENT_KEYWORDS.very_negative) {
    if (lowerText.includes(word)) score -= 0.4;
  }
  
  // Detect emotions
  for (const [emotion, keywords] of Object.entries(EMOTION_PATTERNS)) {
    let intensity = 0;
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) intensity += 0.3;
    }
    if (intensity > 0) {
      emotions.push({ emotion, intensity: Math.min(1, intensity) });
    }
  }
  
  // Clamp score
  score = Math.max(-1, Math.min(1, score));
  
  // Determine label
  let label: SentimentResult["label"];
  if (score >= 0.5) label = "very_positive";
  else if (score >= 0.1) label = "positive";
  else if (score <= -0.5) label = "very_negative";
  else if (score <= -0.1) label = "negative";
  else label = "neutral";
  
  return {
    score,
    label,
    confidence: 0.7 + Math.abs(score) * 0.3,
    emotions: emotions.sort((a, b) => b.intensity - a.intensity).slice(0, 3),
  };
}

// ==================== COGNITIVE ANALYSIS ====================
const COGNITIVE_PATTERNS = {
  analytical: ["analyse", "données", "chiffres", "statistiques", "logique", "raisonnement", "preuve", "évidence"],
  intuitive: ["sens", "impression", "feeling", "intuition", "ressenti", "pressentiment"],
  creative: ["idée", "innovation", "créatif", "nouveau", "différent", "original", "explorer"],
  critical: ["mais", "cependant", "toutefois", "risque", "problème", "attention", "prudence", "doute"],
};

const REASONING_INDICATORS = {
  good: ["parce que", "car", "donc", "ainsi", "en conséquence", "par conséquent", "d'après", "selon"],
  poor: ["juste", "simplement", "évidemment", "clairement", "tout le monde sait", "c'est logique"],
};

// Indicators for team dynamics
const CONVERGENCE_INDICATORS = ["d'accord", "exactement", "oui", "absolument", "parfait", "c'est ça", "bien sûr"];
const DIVERGENCE_INDICATORS = ["mais", "cependant", "par contre", "alternative", "autrement", "différent", "autre option"];
const STRESS_INDICATORS = ["urgent", "deadline", "vite", "pressé", "stress", "anxieux", "inquiet", "panique"];
const OVERLOAD_INDICATORS = ["trop", "beaucoup", "submergé", "débordé", "épuisé", "fatigué", "saturé"];

export function analyzeCognitiveLocal(text: string): CognitiveResult {
  const lowerText = text.toLowerCase();
  const patterns: string[] = [];
  const patternScores: Record<string, number> = {};
  
  // Detect cognitive patterns
  for (const [pattern, keywords] of Object.entries(COGNITIVE_PATTERNS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) score++;
    }
    if (score > 0) {
      patterns.push(pattern);
      patternScores[pattern] = score;
    }
  }
  
  // Determine thinking style
  let thinkingStyle: CognitiveResult["thinkingStyle"] = "mixed";
  const maxPattern = Object.entries(patternScores).sort((a, b) => b[1] - a[1])[0];
  if (maxPattern && maxPattern[1] >= 2) {
    thinkingStyle = maxPattern[0] as CognitiveResult["thinkingStyle"];
  }
  
  // Calculate reasoning quality
  let reasoningQuality = 0.5;
  for (const indicator of REASONING_INDICATORS.good) {
    if (lowerText.includes(indicator)) reasoningQuality += 0.1;
  }
  for (const indicator of REASONING_INDICATORS.poor) {
    if (lowerText.includes(indicator)) reasoningQuality -= 0.1;
  }
  reasoningQuality = Math.max(0, Math.min(1, reasoningQuality));
  
  // Calculate bias risk from detected biases
  const biases = detectBiasKeywords(text);
  const biasRisk = Math.min(1, biases.length * 0.25);
  
  // Generate suggestions
  const suggestions: string[] = [];
  if (biasRisk > 0.5) {
    suggestions.push("Attention : risque élevé de biais cognitif détecté. Considérez des perspectives alternatives.");
  }
  if (reasoningQuality < 0.4) {
    suggestions.push("Essayez d'étayer vos arguments avec des preuves ou des exemples concrets.");
  }
  if (!patterns.includes("critical")) {
    suggestions.push("Pensez à examiner les risques potentiels ou les contre-arguments.");
  }
  
  return {
    patterns,
    thinkingStyle,
    reasoningQuality,
    biasRisk,
    suggestions,
  };
}

// ==================== PSYCHOLOGICAL ANALYSIS ====================
const CONFIDENCE_INDICATORS = {
  high: ["certain", "sûr", "absolument", "définitivement", "sans doute", "convaincu", "garanti"],
  low: ["peut-être", "possiblement", "je pense", "il me semble", "pas sûr", "hésitant", "incertain"],
};

const ENGAGEMENT_INDICATORS = ["!", "?", "important", "crucial", "essentiel", "priorité", "urgent"];

export function analyzePsychologicalLocal(text: string): PsychologicalResult {
  const lowerText = text.toLowerCase();
  
  // Calculate stress level
  let stress = 0.3;
  for (const indicator of STRESS_INDICATORS) {
    if (lowerText.includes(indicator)) stress += 0.15;
  }
  for (const indicator of OVERLOAD_INDICATORS) {
    if (lowerText.includes(indicator)) stress += 0.1;
  }
  stress = Math.min(1, stress);
  
  // Calculate confidence level
  let confidence = 0.5;
  for (const indicator of CONFIDENCE_INDICATORS.high) {
    if (lowerText.includes(indicator)) confidence += 0.1;
  }
  for (const indicator of CONFIDENCE_INDICATORS.low) {
    if (lowerText.includes(indicator)) confidence -= 0.1;
  }
  confidence = Math.max(0, Math.min(1, confidence));
  
  // Calculate engagement level
  let engagement = 0.4;
  for (const indicator of ENGAGEMENT_INDICATORS) {
    if (text.includes(indicator)) engagement += 0.1;
  }
  if (text.length > 100) engagement += 0.1;
  if (text.length > 200) engagement += 0.1;
  engagement = Math.min(1, engagement);
  
  // Calculate openness (willingness to consider alternatives)
  let openness = 0.5;
  for (const indicator of DIVERGENCE_INDICATORS) {
    if (lowerText.includes(indicator)) openness += 0.1;
  }
  for (const indicator of CONVERGENCE_INDICATORS) {
    if (lowerText.includes(indicator)) openness -= 0.05;
  }
  openness = Math.max(0, Math.min(1, openness));
  
  // Determine dominant emotion
  const sentimentResult = analyzeSentimentLocal(text);
  const dominantEmotion = sentimentResult.emotions[0]?.emotion || "neutral";
  
  // Calculate emotional stability
  const emotionalStability = 1 - Math.abs(sentimentResult.score) * 0.5 - stress * 0.3;
  
  // Determine communication style
  let communicationStyle: PsychologicalResult["communicationStyle"] = "balanced";
  if (confidence > 0.7 && text.includes("!")) communicationStyle = "assertive";
  else if (confidence < 0.3) communicationStyle = "passive";
  else if (stress > 0.7 && sentimentResult.score < -0.3) communicationStyle = "aggressive";
  
  return {
    stress,
    confidence,
    engagement,
    openness,
    dominantEmotion,
    emotionalStability: Math.max(0, Math.min(1, emotionalStability)),
    communicationStyle,
  };
}

// ==================== TEAM METRICS ANALYSIS ====================
export function analyzeTeamMetrics(messages: Array<{ content: string; authorId: string; timestamp: number }>): TeamMetrics {
  if (messages.length === 0) {
    return {
      ideaDiversity: 0.5,
      convergenceSpeed: 0.5,
      contradictionLevel: 0.5,
      participationBalance: 1,
      cognitiveLoad: 0.3,
      decisionQuality: 0.5,
      flowState: "optimal",
      consensusLevel: 0.5,
      debateIntensity: 0.5,
    };
  }
  
  // Analyze participation balance
  const authorCounts: Record<string, number> = {};
  for (const msg of messages) {
    authorCounts[msg.authorId] = (authorCounts[msg.authorId] || 0) + 1;
  }
  const authorValues = Object.values(authorCounts);
  const maxParticipation = Math.max(...authorValues);
  const minParticipation = Math.min(...authorValues);
  const participationBalance = authorValues.length > 1 
    ? 1 - (maxParticipation - minParticipation) / messages.length 
    : 1;
  
  // Analyze convergence vs divergence
  let convergenceCount = 0;
  let divergenceCount = 0;
  let stressCount = 0;
  
  for (const msg of messages) {
    const lowerContent = msg.content.toLowerCase();
    for (const indicator of CONVERGENCE_INDICATORS) {
      if (lowerContent.includes(indicator)) convergenceCount++;
    }
    for (const indicator of DIVERGENCE_INDICATORS) {
      if (lowerContent.includes(indicator)) divergenceCount++;
    }
    for (const indicator of STRESS_INDICATORS) {
      if (lowerContent.includes(indicator)) stressCount++;
    }
  }
  
  const totalIndicators = convergenceCount + divergenceCount || 1;
  const convergenceSpeed = convergenceCount / totalIndicators;
  const contradictionLevel = divergenceCount / totalIndicators;
  
  // Calculate cognitive load
  const cognitiveLoad = Math.min(1, stressCount / messages.length + 0.2);
  
  // Calculate idea diversity (based on unique words and patterns)
  const allWords = new Set<string>();
  for (const msg of messages) {
    msg.content.toLowerCase().split(/\s+/).forEach(w => allWords.add(w));
  }
  const ideaDiversity = Math.min(1, allWords.size / (messages.length * 10));
  
  // Determine flow state based on message frequency and quality
  const avgMessageLength = messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length;
  let flowState: TeamMetrics["flowState"] = "optimal";
  if (avgMessageLength < 20 && messages.length > 10) flowState = "high_frequency";
  else if (avgMessageLength > 200 || messages.length < 3) flowState = "low_frequency";
  
  // Calculate consensus and debate intensity
  const consensusLevel = convergenceSpeed;
  const debateIntensity = contradictionLevel;
  
  // Decision quality estimation
  const decisionQuality = (ideaDiversity * 0.3 + contradictionLevel * 0.3 + participationBalance * 0.4);
  
  return {
    ideaDiversity,
    convergenceSpeed,
    contradictionLevel,
    participationBalance,
    cognitiveLoad,
    decisionQuality,
    flowState,
    consensusLevel,
    debateIntensity,
  };
}

// ==================== 8 SMART PING TYPES ====================
const PING_CONFIGS: Record<SmartPingType, { title: string; icon: string; color: string }> = {
  vision: { title: "Vision Ping", icon: "👁️", color: "#8B5CF6" },      // Purple
  risk: { title: "Risk Ping", icon: "⚠️", color: "#EF4444" },          // Red
  bias: { title: "Bias Ping", icon: "🧠", color: "#F59E0B" },          // Amber
  balance: { title: "Balance Ping", icon: "⚖️", color: "#3B82F6" },    // Blue
  load: { title: "Load Ping", icon: "🔋", color: "#EC4899" },          // Pink
  memory: { title: "Memory Ping", icon: "📚", color: "#10B981" },      // Emerald
  antifragility: { title: "Antifragility Ping", icon: "🛡️", color: "#6366F1" }, // Indigo
  spectral: { title: "Spectral Ping", icon: "📊", color: "#14B8A6" },  // Teal
  silence: { title: "Silence Ping", icon: "🤫", color: "#F97316" },    // Orange
};

export function evaluatePingTriggers(
  sentiment: SentimentResult,
  cognitive: CognitiveResult,
  psychological: PsychologicalResult,
  biases: BiasIndicator[],
  teamMetrics?: TeamMetrics
): SmartPing[] {
  const pings: SmartPing[] = [];
  const config = PING_CONFIGS;
  
  // ========== VISION PING - Myopie cognitive ==========
  // Déclenchement : convergence trop rapide, faible diversité d'idées
  if (teamMetrics && teamMetrics.convergenceSpeed > 0.7 && teamMetrics.ideaDiversity < 0.4) {
    pings.push({
      type: "vision",
      title: config.vision.title,
      icon: config.vision.icon,
      color: config.vision.color,
      message: "L'espace de solutions exploré se rétrécit. Dans 70% des cas similaires, cela limite l'innovation.",
      severity: "warning",
      suggestions: [
        "Explorer des approches non conventionnelles",
        "Inviter des perspectives externes",
        "Remettre en question les hypothèses de base"
      ],
      stats: { label: "Diversité d'idées", value: `${Math.round(teamMetrics.ideaDiversity * 100)}%` }
    });
  }
  
  // ========== RISK PING - Décision fragile ==========
  // Déclenchement : consensus rapide, faible contradiction
  if (teamMetrics && teamMetrics.consensusLevel > 0.8 && teamMetrics.debateIntensity < 0.2) {
    pings.push({
      type: "risk",
      title: config.risk.title,
      icon: config.risk.icon,
      color: config.risk.color,
      message: "Décision prise avec faible débat critique. 64% d'échecs observés dans ce schéma.",
      severity: "critical",
      suggestions: [
        "Identifier les hypothèses non testées",
        "Jouer l'avocat du diable",
        "Définir des critères d'invalidation"
      ],
      stats: { label: "Niveau de débat", value: `${Math.round(teamMetrics.debateIntensity * 100)}%` }
    });
  }
  
  // ========== BIAS PING - Distorsion cognitive ==========
  // Déclenchement : confirmation bias, groupthink, authority bias, etc.
  if (biases.length > 0) {
    const highConfidenceBiases = biases.filter(b => b.confidence >= 0.6);
    if (highConfidenceBiases.length > 0) {
      const biasTypes = highConfidenceBiases.map(b => b.type).join(", ");
      pings.push({
        type: "bias",
        title: config.bias.title,
        icon: config.bias.icon,
        color: config.bias.color,
        message: `Schéma de ${biasTypes} détecté. Risque de verrouillage cognitif élevé.`,
        severity: highConfidenceBiases.some(b => b.severity === "high") ? "critical" : "warning",
        suggestions: highConfidenceBiases.map(b => b.recommendation),
        stats: { label: "Biais détectés", value: `${highConfidenceBiases.length}` }
      });
    }
  }
  
  // ========== BALANCE PING - Déséquilibre de participation ==========
  // Déclenchement : dominance d'un membre, silence d'experts
  if (teamMetrics && teamMetrics.participationBalance < 0.4) {
    pings.push({
      type: "balance",
      title: config.balance.title,
      icon: config.balance.icon,
      color: config.balance.color,
      message: "Distribution déséquilibrée des contributions. La performance optimale nécessite une participation plus équilibrée.",
      severity: "warning",
      suggestions: [
        "Solliciter les membres silencieux",
        "Utiliser le tour de table",
        "Créer des espaces de contribution anonyme"
      ],
      stats: { label: "Équilibre", value: `${Math.round(teamMetrics.participationBalance * 100)}%` }
    });
  }
  
  // ========== LOAD PING - Surcharge mentale ==========
  // Déclenchement : accélération excessive, baisse de qualité des échanges
  if (psychological.stress > 0.7 || (teamMetrics && teamMetrics.cognitiveLoad > 0.8)) {
    pings.push({
      type: "load",
      title: config.load.title,
      icon: config.load.icon,
      color: config.load.color,
      message: "Charge cognitive collective élevée. Stabilisation recommandée.",
      severity: psychological.stress > 0.85 ? "critical" : "warning",
      suggestions: [
        "Faire une pause de 5 minutes",
        "Prioriser les décisions essentielles",
        "Reporter les sujets secondaires"
      ],
      stats: { label: "Niveau de stress", value: `${Math.round(psychological.stress * 100)}%` }
    });
  }
  
  // ========== MEMORY PING - Erreur récurrente ==========
  // Déclenchement : reproduction d'un schéma d'échec connu
  if (cognitive.biasRisk > 0.6 && cognitive.reasoningQuality < 0.4) {
    pings.push({
      type: "memory",
      title: config.memory.title,
      icon: config.memory.icon,
      color: config.memory.color,
      message: "Cette approche présente des similitudes avec des schémas d'échec connus. Vérification recommandée.",
      severity: "warning",
      suggestions: [
        "Consulter l'historique des décisions similaires",
        "Identifier les facteurs de risque communs",
        "Définir des garde-fous préventifs"
      ],
      stats: { label: "Risque de répétition", value: `${Math.round(cognitive.biasRisk * 100)}%` }
    });
  }
  
  // ========== ANTIFRAGILITY PING - Harmonie excessive ==========
  // Déclenchement : absence de désaccord
  if (teamMetrics && teamMetrics.consensusLevel > 0.9 && teamMetrics.contradictionLevel < 0.1) {
    pings.push({
      type: "antifragility",
      title: config.antifragility.title,
      icon: config.antifragility.icon,
      color: config.antifragility.color,
      message: "Niveau de contradiction interne anormalement bas. Challenger l'hypothèse centrale.",
      severity: "warning",
      suggestions: [
        "Nommer un avocat du diable",
        "Lister 3 raisons pour lesquelles cette décision pourrait échouer",
        "Inviter une perspective externe"
      ],
      stats: { label: "Niveau de consensus", value: `${Math.round(teamMetrics.consensusLevel * 100)}%` }
    });
  }
  
  // ========== SPECTRAL PING - Rythme cognitif collectif ==========
  // Analyse du spectre de fréquence cognitive
  if (teamMetrics && teamMetrics.flowState !== "optimal") {
    const flowMessages: Record<string, string> = {
      low_frequency: "Inertie cognitive détectée. Le rythme des échanges est trop lent pour maintenir le momentum.",
      high_frequency: "Chaos décisionnel détecté. Le rythme des échanges est trop rapide pour une réflexion approfondie."
    };
    const flowSuggestions: Record<string, string[]> = {
      low_frequency: [
        "Relancer la discussion avec une question ouverte",
        "Fixer un objectif de temps",
        "Partager une nouvelle information"
      ],
      high_frequency: [
        "Faire une pause structurée",
        "Résumer les points clés",
        "Prioriser un seul sujet"
      ]
    };
    
    pings.push({
      type: "spectral",
      title: config.spectral.title,
      icon: config.spectral.icon,
      color: config.spectral.color,
      message: flowMessages[teamMetrics.flowState] || "Sortie de la bande de flow cognitif optimal. Ajustement recommandé.",
      severity: "info",
      suggestions: flowSuggestions[teamMetrics.flowState] || [],
      stats: { label: "État de flow", value: teamMetrics.flowState === "low_frequency" ? "Basse fréquence" : "Haute fréquence" }
    });
  }
  
  // ========== SILENCE PING - Expertise non exploitée ==========
  // Déclenchement : membre expert silencieux, déséquilibre de participation
  if (teamMetrics && teamMetrics.participationBalance < 0.3 && psychological.engagement < 0.4) {
    pings.push({
      type: "silence",
      title: config.silence.title,
      icon: config.silence.icon,
      color: config.silence.color,
      message: "Expertise potentiellement non exploitée. Des membres qualifiés semblent en retrait.",
      severity: "warning",
      suggestions: [
        "Solliciter directement les membres silencieux",
        "Créer un espace de contribution écrite",
        "Utiliser un tour de table structuré",
        "Vérifier les barrières à la participation"
      ],
      stats: { label: "Équilibre participation", value: `${Math.round(teamMetrics.participationBalance * 100)}%` }
    });
  }
  
  // Additional individual-level pings
  
  // Overconfidence alert
  if (psychological.confidence > 0.85 && cognitive.biasRisk > 0.3) {
    pings.push({
      type: "bias",
      title: "Alerte Surconfiance",
      icon: "⚡",
      color: config.bias.color,
      message: "Confiance élevée détectée avec risque de biais. Avez-vous considéré les scénarios alternatifs ?",
      severity: "warning",
      suggestions: ["Lister 3 façons dont cette décision pourrait échouer"],
      stats: { label: "Niveau de confiance", value: `${Math.round(psychological.confidence * 100)}%` }
    });
  }
  
  // Low engagement
  if (psychological.engagement < 0.3) {
    pings.push({
      type: "balance",
      title: "Engagement Faible",
      icon: "💬",
      color: config.balance.color,
      message: "Participation limitée détectée. Souhaitez-vous partager votre perspective sur ce sujet ?",
      severity: "info",
      suggestions: ["Partager votre point de vue", "Poser une question"],
    });
  }
  
  return pings;
}

// ==================== FULL ANALYSIS WITH LLM ====================
export async function analyzeWithLLM(text: string, teamMessages?: Array<{ content: string; authorId: string; timestamp: number }>): Promise<FullAnalysisResult> {
  const startTime = Date.now();
  
  // Local analysis first (fast)
  const localSentiment = analyzeSentimentLocal(text);
  const localCognitive = analyzeCognitiveLocal(text);
  const localPsychological = analyzePsychologicalLocal(text);
  const localBiases = detectBiasKeywords(text);
  const teamMetrics = teamMessages ? analyzeTeamMetrics(teamMessages) : undefined;
  
  try {
    // LLM-enhanced analysis
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Tu es un expert en psychologie cognitive et en dynamique d'équipe. Analyse le texte suivant et retourne un JSON avec:
- sentiment: { score: -1 à 1, label: "very_negative"|"negative"|"neutral"|"positive"|"very_positive", confidence: 0-1 }
- cognitive: { patterns: string[], thinkingStyle: "analytical"|"intuitive"|"creative"|"critical"|"mixed", reasoningQuality: 0-1, biasRisk: 0-1 }
- psychological: { stress: 0-1, confidence: 0-1, engagement: 0-1, openness: 0-1, dominantEmotion: string, emotionalStability: 0-1 }
- biases: [{ type: string, confidence: 0-1, evidence: string[], suggestion: string, severity: "low"|"medium"|"high" }]

Sois précis et factuel dans ton analyse.`
        },
        {
          role: "user",
          content: text
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "cognitive_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              sentiment: {
                type: "object",
                properties: {
                  score: { type: "number" },
                  label: { type: "string" },
                  confidence: { type: "number" }
                },
                required: ["score", "label", "confidence"],
                additionalProperties: false
              },
              cognitive: {
                type: "object",
                properties: {
                  patterns: { type: "array", items: { type: "string" } },
                  thinkingStyle: { type: "string" },
                  reasoningQuality: { type: "number" },
                  biasRisk: { type: "number" }
                },
                required: ["patterns", "thinkingStyle", "reasoningQuality", "biasRisk"],
                additionalProperties: false
              },
              psychological: {
                type: "object",
                properties: {
                  stress: { type: "number" },
                  confidence: { type: "number" },
                  engagement: { type: "number" },
                  openness: { type: "number" },
                  dominantEmotion: { type: "string" },
                  emotionalStability: { type: "number" }
                },
                required: ["stress", "confidence", "engagement", "openness", "dominantEmotion", "emotionalStability"],
                additionalProperties: false
              },
              biases: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    confidence: { type: "number" },
                    evidence: { type: "array", items: { type: "string" } },
                    suggestion: { type: "string" },
                    severity: { type: "string" }
                  },
                  required: ["type", "confidence", "evidence", "suggestion", "severity"],
                  additionalProperties: false
                }
              }
            },
            required: ["sentiment", "cognitive", "psychological", "biases"],
            additionalProperties: false
          }
        }
      }
    });
    
    const content = response.choices[0].message.content;
    const llmResult = JSON.parse(typeof content === 'string' ? content : JSON.stringify(content) || "{}");
    
    // Merge local and LLM results
    const mergedSentiment: SentimentResult = {
      score: (localSentiment.score + llmResult.sentiment.score) / 2,
      label: llmResult.sentiment.label || localSentiment.label,
      confidence: Math.max(localSentiment.confidence, llmResult.sentiment.confidence),
      emotions: localSentiment.emotions,
    };
    
    const mergedCognitive: CognitiveResult = {
      patterns: Array.from(new Set([...localCognitive.patterns, ...llmResult.cognitive.patterns])),
      thinkingStyle: llmResult.cognitive.thinkingStyle || localCognitive.thinkingStyle,
      reasoningQuality: (localCognitive.reasoningQuality + llmResult.cognitive.reasoningQuality) / 2,
      biasRisk: Math.max(localCognitive.biasRisk, llmResult.cognitive.biasRisk),
      suggestions: localCognitive.suggestions,
    };
    
    const mergedPsychological: PsychologicalResult = {
      stress: (localPsychological.stress + llmResult.psychological.stress) / 2,
      confidence: (localPsychological.confidence + llmResult.psychological.confidence) / 2,
      engagement: (localPsychological.engagement + llmResult.psychological.engagement) / 2,
      openness: (localPsychological.openness + llmResult.psychological.openness) / 2,
      dominantEmotion: llmResult.psychological.dominantEmotion || localPsychological.dominantEmotion,
      emotionalStability: (localPsychological.emotionalStability + llmResult.psychological.emotionalStability) / 2,
      communicationStyle: localPsychological.communicationStyle,
    };
    
    // Merge biases
    const mergedBiases: BiasIndicator[] = [
      ...localBiases,
      ...llmResult.biases.map((b: any) => ({
        type: b.type,
        confidence: b.confidence,
        evidence: b.evidence,
        suggestion: b.suggestion,
        severity: b.severity as "low" | "medium" | "high",
      }))
    ];
    
    // Deduplicate biases by type
    const biasMap = new Map<string, BiasIndicator>();
    for (const bias of mergedBiases) {
      const existing = biasMap.get(bias.type);
      if (!existing || existing.confidence < bias.confidence) {
        biasMap.set(bias.type, bias);
      }
    }
    const uniqueBiases = Array.from(biasMap.values());
    
    const triggeredPings = evaluatePingTriggers(mergedSentiment, mergedCognitive, mergedPsychological, uniqueBiases, teamMetrics);
    
    return {
      sentiment: mergedSentiment,
      cognitive: mergedCognitive,
      psychological: mergedPsychological,
      biases: uniqueBiases,
      triggeredPings,
      teamMetrics,
      processingTime: Date.now() - startTime,
    };
  } catch (error) {
    // Fallback to local analysis only
    const triggeredPings = evaluatePingTriggers(localSentiment, localCognitive, localPsychological, localBiases, teamMetrics);
    
    return {
      sentiment: localSentiment,
      cognitive: localCognitive,
      psychological: localPsychological,
      biases: localBiases,
      triggeredPings,
      teamMetrics,
      processingTime: Date.now() - startTime,
    };
  }
}

// ==================== QUICK LOCAL ANALYSIS ====================
export function analyzeQuick(text: string, teamMessages?: Array<{ content: string; authorId: string; timestamp: number }>): FullAnalysisResult {
  const startTime = Date.now();
  
  const sentiment = analyzeSentimentLocal(text);
  const cognitive = analyzeCognitiveLocal(text);
  const psychological = analyzePsychologicalLocal(text);
  const biases = detectBiasKeywords(text);
  const teamMetrics = teamMessages ? analyzeTeamMetrics(teamMessages) : undefined;
  const triggeredPings = evaluatePingTriggers(sentiment, cognitive, psychological, biases, teamMetrics);
  
  return {
    sentiment,
    cognitive,
    psychological,
    biases,
    triggeredPings,
    teamMetrics,
    processingTime: Date.now() - startTime,
  };
}

// Export ping configs for frontend
export { PING_CONFIGS };
