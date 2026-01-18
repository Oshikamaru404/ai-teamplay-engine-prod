import { invokeLLM } from "./_core/llm";

// Types for bias detection
export interface BiasIndicator {
  type: BiasType;
  confidence: number;
  evidence: string[];
  severity: "low" | "medium" | "high";
  recommendation: string;
}

export type BiasType =
  | "confirmation"
  | "groupthink"
  | "sunk_cost"
  | "overconfidence"
  | "authority"
  | "anchoring"
  | "halo_effect"
  | "availability"
  | "bandwagon";

export interface MessageAnalysis {
  sentiment: number; // -1 to 1
  cognitivePatterns: string[];
  biasIndicators: BiasIndicator[];
  diversityScore: number;
  criticalThinkingScore: number;
}

export interface ConversationContext {
  messages: Array<{
    content: string;
    userId: number;
    userName?: string;
    timestamp: Date;
  }>;
  decisionHistory: Array<{
    title: string;
    outcome?: string;
    biasesDetected?: string[];
  }>;
  teamSize: number;
}

// Bias detection patterns and keywords
const BIAS_PATTERNS: Record<BiasType, {
  keywords: string[];
  phrases: string[];
  behavioralSignals: string[];
  description: string;
  mitigation: string;
}> = {
  confirmation: {
    keywords: ["évidemment", "clairement", "comme prévu", "je savais", "confirme", "prouve"],
    phrases: [
      "ça confirme ce que je pensais",
      "comme je l'avais dit",
      "c'est exactement ce que",
      "on avait raison",
    ],
    behavioralSignals: [
      "ignore_contrary_evidence",
      "selective_information_seeking",
      "repeated_same_arguments",
    ],
    description: "Tendance à favoriser les informations qui confirment les croyances existantes",
    mitigation: "Cherchez activement des preuves contradictoires et désignez un avocat du diable",
  },
  groupthink: {
    keywords: ["tous d'accord", "unanime", "consensus", "personne ne conteste", "évident pour tous"],
    phrases: [
      "on est tous d'accord",
      "personne n'a d'objection",
      "c'est unanime",
      "tout le monde pense",
    ],
    behavioralSignals: [
      "no_dissenting_opinions",
      "pressure_to_conform",
      "illusion_of_unanimity",
    ],
    description: "Pression vers le conformisme au détriment de la pensée critique",
    mitigation: "Encouragez les opinions divergentes et utilisez le vote anonyme",
  },
  sunk_cost: {
    keywords: ["déjà investi", "trop tard", "on a commencé", "pas abandonner", "tout ce temps"],
    phrases: [
      "on a déjà trop investi",
      "on ne peut pas abandonner maintenant",
      "après tout ce travail",
      "ce serait du gâchis",
    ],
    behavioralSignals: [
      "resistance_to_pivot",
      "justifying_past_decisions",
      "ignoring_future_costs",
    ],
    description: "Continuer un projet à cause des investissements passés plutôt que des perspectives futures",
    mitigation: "Évaluez les décisions uniquement sur les coûts et bénéfices futurs",
  },
  overconfidence: {
    keywords: ["certain", "sûr", "garanti", "impossible que", "100%", "aucun doute"],
    phrases: [
      "je suis absolument certain",
      "c'est garanti",
      "il n'y a aucun risque",
      "ça va forcément marcher",
    ],
    behavioralSignals: [
      "underestimating_risks",
      "overestimating_abilities",
      "ignoring_uncertainty",
    ],
    description: "Surestimation de ses propres capacités ou de la probabilité de succès",
    mitigation: "Demandez des estimations de probabilité et considérez les scénarios d'échec",
  },
  authority: {
    keywords: ["expert dit", "chef pense", "direction veut", "senior recommande"],
    phrases: [
      "le boss a dit",
      "l'expert recommande",
      "la direction préfère",
      "les seniors pensent",
    ],
    behavioralSignals: [
      "deferring_to_authority",
      "not_questioning_leaders",
      "hierarchy_over_merit",
    ],
    description: "Accepter une opinion simplement parce qu'elle vient d'une figure d'autorité",
    mitigation: "Évaluez les arguments sur leur mérite, pas sur leur source",
  },
  anchoring: {
    keywords: ["premier chiffre", "estimation initiale", "point de départ", "référence"],
    phrases: [
      "basé sur l'estimation initiale",
      "par rapport au premier chiffre",
      "en partant de",
    ],
    behavioralSignals: [
      "fixation_on_initial_value",
      "insufficient_adjustment",
      "first_impression_bias",
    ],
    description: "Se fier excessivement à la première information reçue",
    mitigation: "Générez plusieurs estimations indépendantes avant de comparer",
  },
  halo_effect: {
    keywords: ["toujours réussi", "jamais échoué", "excellent track record", "star"],
    phrases: [
      "il a toujours raison",
      "elle ne se trompe jamais",
      "c'est notre meilleur",
    ],
    behavioralSignals: [
      "generalizing_from_one_trait",
      "ignoring_specific_weaknesses",
      "celebrity_worship",
    ],
    description: "Laisser une impression positive dans un domaine influencer le jugement dans d'autres",
    mitigation: "Évaluez chaque compétence ou décision indépendamment",
  },
  availability: {
    keywords: ["récemment", "dernièrement", "exemple frais", "on vient de voir"],
    phrases: [
      "ça vient d'arriver",
      "on a vu récemment",
      "l'exemple le plus récent",
    ],
    behavioralSignals: [
      "recency_bias",
      "vivid_examples_over_statistics",
      "media_influence",
    ],
    description: "Surestimer la probabilité d'événements facilement rappelés",
    mitigation: "Consultez des données statistiques plutôt que des anecdotes",
  },
  bandwagon: {
    keywords: ["tout le monde fait", "tendance", "populaire", "mainstream", "hype"],
    phrases: [
      "tout le monde utilise",
      "c'est la tendance",
      "les autres font pareil",
      "on ne peut pas ignorer",
    ],
    behavioralSignals: [
      "following_trends_blindly",
      "fear_of_missing_out",
      "popularity_over_merit",
    ],
    description: "Adopter une idée parce qu'elle est populaire",
    mitigation: "Évaluez si la solution répond à vos besoins spécifiques",
  },
};

// Simple keyword-based bias detection (fast, no LLM)
export function detectBiasKeywords(text: string): BiasIndicator[] {
  const indicators: BiasIndicator[] = [];
  const lowerText = text.toLowerCase();

  for (const [biasType, patterns] of Object.entries(BIAS_PATTERNS)) {
    const matchedKeywords: string[] = [];
    const matchedPhrases: string[] = [];

    // Check keywords
    for (const keyword of patterns.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
      }
    }

    // Check phrases
    for (const phrase of patterns.phrases) {
      if (lowerText.includes(phrase.toLowerCase())) {
        matchedPhrases.push(phrase);
      }
    }

    const totalMatches = matchedKeywords.length + matchedPhrases.length * 2;
    if (totalMatches > 0) {
      const confidence = Math.min(0.3 + totalMatches * 0.15, 0.9);
      indicators.push({
        type: biasType as BiasType,
        confidence,
        evidence: [...matchedKeywords, ...matchedPhrases],
        severity: confidence > 0.7 ? "high" : confidence > 0.4 ? "medium" : "low",
        recommendation: patterns.mitigation,
      });
    }
  }

  return indicators.sort((a, b) => b.confidence - a.confidence);
}

// Advanced LLM-based bias detection
export async function detectBiasWithLLM(
  context: ConversationContext
): Promise<{
  biases: BiasIndicator[];
  cognitiveHealth: {
    diversityIndex: number;
    criticalThinkingScore: number;
    convergenceRate: number;
    biasRiskLevel: number;
  };
  recommendations: string[];
}> {
  const recentMessages = context.messages.slice(-20);
  const conversationText = recentMessages
    .map((m) => `[${m.userName || "User"}]: ${m.content}`)
    .join("\n");

  const systemPrompt = `Tu es un expert en psychologie cognitive et en détection de biais. Analyse la conversation suivante et identifie les biais cognitifs présents.

Types de biais à détecter:
- confirmation: Favoriser les informations confirmant les croyances existantes
- groupthink: Pression vers le conformisme
- sunk_cost: Continuer à cause des investissements passés
- overconfidence: Surestimation des capacités
- authority: Accepter sans questionner les figures d'autorité
- anchoring: Se fier à la première information
- halo_effect: Généraliser une impression positive
- availability: Surestimer les événements facilement rappelés
- bandwagon: Suivre la tendance populaire

Réponds en JSON avec le format suivant:
{
  "biases": [
    {
      "type": "nom_du_biais",
      "confidence": 0.0-1.0,
      "evidence": ["citation ou comportement observé"],
      "severity": "low|medium|high",
      "recommendation": "conseil pour mitiger"
    }
  ],
  "cognitiveHealth": {
    "diversityIndex": 0.0-1.0,
    "criticalThinkingScore": 0.0-1.0,
    "convergenceRate": 0.0-1.0,
    "biasRiskLevel": 0.0-1.0
  },
  "recommendations": ["recommandation stratégique"]
}`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Conversation à analyser:\n${conversationText}\n\nContexte: Équipe de ${context.teamSize} personnes.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "bias_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              biases: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    confidence: { type: "number" },
                    evidence: { type: "array", items: { type: "string" } },
                    severity: { type: "string", enum: ["low", "medium", "high"] },
                    recommendation: { type: "string" },
                  },
                  required: ["type", "confidence", "evidence", "severity", "recommendation"],
                  additionalProperties: false,
                },
              },
              cognitiveHealth: {
                type: "object",
                properties: {
                  diversityIndex: { type: "number" },
                  criticalThinkingScore: { type: "number" },
                  convergenceRate: { type: "number" },
                  biasRiskLevel: { type: "number" },
                },
                required: ["diversityIndex", "criticalThinkingScore", "convergenceRate", "biasRiskLevel"],
                additionalProperties: false,
              },
              recommendations: { type: "array", items: { type: "string" } },
            },
            required: ["biases", "cognitiveHealth", "recommendations"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (content && typeof content === 'string') {
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("[BiasDetection] LLM analysis failed:", error);
  }

  // Fallback to keyword detection
  const keywordBiases = detectBiasKeywords(
    context.messages.map((m) => m.content).join(" ")
  );

  return {
    biases: keywordBiases,
    cognitiveHealth: {
      diversityIndex: 0.5,
      criticalThinkingScore: 0.5,
      convergenceRate: 0.5,
      biasRiskLevel: keywordBiases.length > 0 ? 0.6 : 0.3,
    },
    recommendations: keywordBiases.map((b) => b.recommendation),
  };
}

// Analyze a single message for cognitive patterns
export async function analyzeMessage(
  content: string,
  context?: { previousMessages?: string[]; userName?: string }
): Promise<MessageAnalysis> {
  // Quick keyword-based analysis
  const biasIndicators = detectBiasKeywords(content);

  // Sentiment analysis (simplified)
  const positiveWords = ["bien", "excellent", "super", "génial", "parfait", "réussi", "succès"];
  const negativeWords = ["mal", "problème", "échec", "difficile", "impossible", "risque", "danger"];

  let sentimentScore = 0;
  const lowerContent = content.toLowerCase();
  positiveWords.forEach((w) => {
    if (lowerContent.includes(w)) sentimentScore += 0.1;
  });
  negativeWords.forEach((w) => {
    if (lowerContent.includes(w)) sentimentScore -= 0.1;
  });
  sentimentScore = Math.max(-1, Math.min(1, sentimentScore));

  // Cognitive patterns detection
  const cognitivePatterns: string[] = [];
  if (content.includes("?")) cognitivePatterns.push("questioning");
  if (content.match(/mais|cependant|toutefois|néanmoins/i)) cognitivePatterns.push("critical_thinking");
  if (content.match(/et si|peut-être|possiblement/i)) cognitivePatterns.push("exploration");
  if (content.match(/décidons|faisons|allons-y/i)) cognitivePatterns.push("action_oriented");
  if (content.match(/je pense|à mon avis|selon moi/i)) cognitivePatterns.push("opinion_sharing");
  if (content.match(/données|chiffres|statistiques|mesure/i)) cognitivePatterns.push("data_driven");

  // Calculate scores
  const diversityScore = cognitivePatterns.length / 6;
  const criticalThinkingScore = cognitivePatterns.includes("critical_thinking") ||
    cognitivePatterns.includes("questioning")
    ? 0.7
    : 0.4;

  return {
    sentiment: sentimentScore,
    cognitivePatterns,
    biasIndicators,
    diversityScore,
    criticalThinkingScore,
  };
}

// Generate smart ping message based on detected bias
export function generateSmartPing(bias: BiasIndicator): string {
  const templates: Record<BiasType, string[]> = {
    confirmation: [
      "🔍 Attention: Votre équipe semble favoriser les informations confirmant une position existante. Avez-vous considéré des perspectives alternatives?",
      "⚠️ Pattern de biais de confirmation détecté. Suggestion: Désignez un avocat du diable pour challenger cette hypothèse.",
    ],
    groupthink: [
      "🤝 Alerte consensus: L'unanimité apparente peut masquer des opinions divergentes importantes. Encouragez les voix dissidentes.",
      "⚠️ Risque de pensée de groupe détecté. Suggestion: Utilisez un vote anonyme pour recueillir les vraies opinions.",
    ],
    sunk_cost: [
      "💰 Attention aux coûts irrécupérables: Les investissements passés ne devraient pas influencer les décisions futures.",
      "⚠️ Pattern de sunk cost détecté. Évaluez cette décision uniquement sur ses mérites futurs.",
    ],
    overconfidence: [
      "📊 Alerte surconfiance: Les estimations semblent très optimistes. Avez-vous considéré les scénarios d'échec?",
      "⚠️ Niveau de certitude élevé détecté. Suggestion: Demandez une analyse des risques.",
    ],
    authority: [
      "👔 Biais d'autorité potentiel: Les arguments devraient être évalués sur leur mérite, pas sur leur source.",
      "⚠️ Déférence excessive à l'autorité détectée. Encouragez le questionnement constructif.",
    ],
    anchoring: [
      "⚓ Effet d'ancrage possible: La première estimation influence-t-elle trop les discussions?",
      "⚠️ Ancrage détecté. Suggestion: Générez des estimations indépendantes.",
    ],
    halo_effect: [
      "✨ Effet de halo potentiel: Le succès passé ne garantit pas le succès futur dans ce contexte.",
      "⚠️ Généralisation excessive détectée. Évaluez cette compétence spécifique indépendamment.",
    ],
    availability: [
      "📰 Biais de disponibilité: Les événements récents ou marquants peuvent fausser l'évaluation des probabilités.",
      "⚠️ Suggestion: Consultez des données statistiques plutôt que des anecdotes récentes.",
    ],
    bandwagon: [
      "🚂 Effet de mode détecté: La popularité d'une solution ne garantit pas son adéquation à vos besoins.",
      "⚠️ Suivre la tendance? Vérifiez si cette approche répond vraiment à votre contexte spécifique.",
    ],
  };

  const biasTemplates = templates[bias.type];
  return biasTemplates[Math.floor(Math.random() * biasTemplates.length)];
}

// Calculate cognitive health metrics for a project
export function calculateCognitiveMetrics(
  messages: Array<{ content: string; userId: number; createdAt: Date }>,
  decisions: Array<{ status: string; biasesDetected?: string[] }>
): {
  diversityIndex: number;
  criticalThinkingScore: number;
  convergenceRate: number;
  biasRiskLevel: number;
  decisionQuality: number;
  engagementLevel: number;
  explorationVsExecution: number;
  consensusLevel: number;
} {
  // Diversity: How many unique contributors
  const uniqueUsers = new Set(messages.map((m) => m.userId)).size;
  const diversityIndex = Math.min(uniqueUsers / 5, 1); // Normalize to max 5 contributors

  // Critical thinking: Questions and counter-arguments
  const criticalMessages = messages.filter(
    (m) =>
      m.content.includes("?") ||
      m.content.match(/mais|cependant|pourquoi|comment/i)
  ).length;
  const criticalThinkingScore = Math.min(criticalMessages / messages.length, 1);

  // Convergence: Agreement patterns
  const agreementPatterns = messages.filter((m) =>
    m.content.match(/d'accord|oui|exactement|bien sûr|absolument/i)
  ).length;
  const convergenceRate = agreementPatterns / Math.max(messages.length, 1);

  // Bias risk: Based on detected biases in decisions
  const totalBiases = decisions.reduce(
    (sum, d) => sum + (d.biasesDetected?.length || 0),
    0
  );
  const biasRiskLevel = Math.min(totalBiases / Math.max(decisions.length * 2, 1), 1);

  // Decision quality: Ratio of decided/implemented decisions
  const decidedDecisions = decisions.filter(
    (d) => d.status === "decided" || d.status === "implemented"
  ).length;
  const decisionQuality = decidedDecisions / Math.max(decisions.length, 1);

  // Engagement: Messages per day (simplified)
  const engagementLevel = Math.min(messages.length / 20, 1);

  // Exploration vs Execution
  const explorationMessages = messages.filter((m) =>
    m.content.match(/et si|peut-être|explorer|idée|hypothèse/i)
  ).length;
  const executionMessages = messages.filter((m) =>
    m.content.match(/faire|implémenter|livrer|deadline|tâche/i)
  ).length;
  const explorationVsExecution =
    explorationMessages / Math.max(explorationMessages + executionMessages, 1);

  // Consensus level
  const consensusLevel = convergenceRate * 0.7 + (1 - diversityIndex) * 0.3;

  return {
    diversityIndex,
    criticalThinkingScore,
    convergenceRate,
    biasRiskLevel,
    decisionQuality,
    engagementLevel,
    explorationVsExecution,
    consensusLevel,
  };
}

export { BIAS_PATTERNS };
