/**
 * Vector Memory - Indexation vectorielle de la mémoire collective
 * 
 * Permet la recherche sémantique dans :
 * - Les décisions passées
 * - Les discussions importantes
 * - Les patterns cognitifs récurrents
 * - Les erreurs et apprentissages
 */

import { invokeLLM } from "./_core/llm";

// ============================================================================
// TYPES
// ============================================================================

export interface MemoryItem {
  id: string;
  type: "decision" | "discussion" | "pattern" | "learning" | "error";
  content: string;
  summary: string;
  /** Vecteur d'embedding (simplifié - en production utiliser un vrai service d'embedding) */
  embedding?: number[];
  /** Mots-clés extraits */
  keywords: string[];
  /** Score de pertinence (0-1) */
  relevanceScore: number;
  /** Métadonnées */
  metadata: {
    projectId: number;
    teamId: number;
    createdAt: Date;
    participants?: string[];
    biasesDetected?: string[];
    outcome?: "success" | "failure" | "pending" | "unknown";
  };
}

export interface SearchResult {
  item: MemoryItem;
  score: number;
  matchType: "semantic" | "keyword" | "pattern";
  highlights: string[];
}

export interface PatternMatch {
  patternType: string;
  description: string;
  occurrences: number;
  examples: MemoryItem[];
  recommendation: string;
}

// ============================================================================
// EXTRACTION DE MOTS-CLÉS (sans embedding externe)
// ============================================================================

const STOP_WORDS = new Set([
  "le", "la", "les", "un", "une", "des", "de", "du", "et", "ou", "mais", "donc",
  "car", "ni", "que", "qui", "quoi", "dont", "où", "ce", "cette", "ces", "mon",
  "ton", "son", "notre", "votre", "leur", "je", "tu", "il", "elle", "nous", "vous",
  "ils", "elles", "on", "se", "en", "y", "ne", "pas", "plus", "moins", "très",
  "bien", "mal", "aussi", "encore", "toujours", "jamais", "rien", "tout", "tous",
  "the", "a", "an", "and", "or", "but", "is", "are", "was", "were", "be", "been",
  "being", "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "must", "shall", "can", "to", "of", "in", "for", "on",
  "with", "at", "by", "from", "as", "into", "through", "during", "before", "after",
  "above", "below", "between", "under", "again", "further", "then", "once", "here",
  "there", "when", "where", "why", "how", "all", "each", "few", "more", "most",
  "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than",
  "too", "very", "just", "it", "its", "this", "that", "these", "those",
]);

/**
 * Extrait les mots-clés d'un texte
 */
export function extractKeywords(text: string, maxKeywords: number = 10): string[] {
  // Normaliser et tokeniser
  const words = text
    .toLowerCase()
    .replace(/[^\w\sàâäéèêëïîôùûüç-]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));

  // Compter les occurrences
  const wordCounts = new Map<string, number>();
  for (const word of words) {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  }

  // Trier par fréquence et retourner les top N
  return Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

/**
 * Calcule la similarité entre deux ensembles de mots-clés (Jaccard)
 */
export function keywordSimilarity(keywords1: string[], keywords2: string[]): number {
  const set1 = new Set(keywords1);
  const set2 = new Set(keywords2);
  
  const intersection = Array.from(set1).filter(x => set2.has(x));
  const union = new Set([...Array.from(set1), ...Array.from(set2)]);
  
  return union.size > 0 ? intersection.length / union.size : 0;
}

// ============================================================================
// GÉNÉRATION DE RÉSUMÉ ET EMBEDDING SIMPLIFIÉ
// ============================================================================

/**
 * Génère un résumé et des mots-clés pour un contenu
 */
export async function summarizeContent(content: string): Promise<{
  summary: string;
  keywords: string[];
  relevanceScore: number;
}> {
  // Extraction de mots-clés locale (rapide)
  const keywords = extractKeywords(content, 10);

  // Si le contenu est court, pas besoin de résumé LLM
  if (content.length < 200) {
    return {
      summary: content,
      keywords,
      relevanceScore: 0.5,
    };
  }

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Tu es un assistant qui résume des discussions d'équipe. 
Génère un résumé concis (max 100 mots) qui capture:
- Le sujet principal
- Les décisions ou conclusions
- Les points de désaccord importants
Réponds en JSON: {"summary": "...", "relevanceScore": 0.0-1.0}`
        },
        { role: "user", content: `Résume ce contenu:\n\n${content.slice(0, 2000)}` }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "summary_response",
          strict: true,
          schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              relevanceScore: { type: "number" },
            },
            required: ["summary", "relevanceScore"],
            additionalProperties: false,
          },
        },
      },
    });

    const messageContent = response.choices[0]?.message?.content;
    const result = JSON.parse(typeof messageContent === 'string' ? messageContent : "{}");
    return {
      summary: result.summary || content.slice(0, 200),
      keywords,
      relevanceScore: result.relevanceScore || 0.5,
    };
  } catch {
    // Fallback sans LLM
    return {
      summary: content.slice(0, 200) + (content.length > 200 ? "..." : ""),
      keywords,
      relevanceScore: 0.5,
    };
  }
}

// ============================================================================
// RECHERCHE SÉMANTIQUE
// ============================================================================

/**
 * Recherche sémantique dans la mémoire collective
 */
export async function searchMemory(
  query: string,
  memories: MemoryItem[],
  options: {
    maxResults?: number;
    minScore?: number;
    types?: MemoryItem["type"][];
    projectId?: number;
  } = {}
): Promise<SearchResult[]> {
  const { maxResults = 10, minScore = 0.2, types, projectId } = options;

  // Extraire les mots-clés de la requête
  const queryKeywords = extractKeywords(query, 10);

  // Filtrer par type et projet si spécifié
  let filteredMemories = memories;
  if (types && types.length > 0) {
    filteredMemories = filteredMemories.filter(m => types.includes(m.type));
  }
  if (projectId) {
    filteredMemories = filteredMemories.filter(m => m.metadata.projectId === projectId);
  }

  // Calculer les scores de similarité
  const results: SearchResult[] = [];

  for (const memory of filteredMemories) {
    // Score basé sur les mots-clés
    const keywordScore = keywordSimilarity(queryKeywords, memory.keywords);
    
    // Score basé sur la correspondance textuelle
    const queryLower = query.toLowerCase();
    const contentLower = memory.content.toLowerCase();
    const summaryLower = memory.summary.toLowerCase();
    
    let textScore = 0;
    const highlights: string[] = [];
    
    for (const keyword of queryKeywords) {
      if (contentLower.includes(keyword)) {
        textScore += 0.1;
        // Extraire le contexte autour du mot-clé
        const index = contentLower.indexOf(keyword);
        const start = Math.max(0, index - 30);
        const end = Math.min(memory.content.length, index + keyword.length + 30);
        highlights.push("..." + memory.content.slice(start, end) + "...");
      }
      if (summaryLower.includes(keyword)) {
        textScore += 0.15;
      }
    }

    // Score combiné
    const combinedScore = (keywordScore * 0.6 + textScore * 0.4) * memory.relevanceScore;

    if (combinedScore >= minScore) {
      results.push({
        item: memory,
        score: combinedScore,
        matchType: keywordScore > textScore ? "keyword" : "semantic",
        highlights: highlights.slice(0, 3),
      });
    }
  }

  // Trier par score et limiter
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

// ============================================================================
// DÉTECTION DE PATTERNS
// ============================================================================

/**
 * Détecte les patterns récurrents dans la mémoire collective
 */
export function detectPatterns(memories: MemoryItem[]): PatternMatch[] {
  const patterns: PatternMatch[] = [];

  // Pattern 1: Biais récurrents
  const biasOccurrences = new Map<string, MemoryItem[]>();
  for (const memory of memories) {
    for (const bias of memory.metadata.biasesDetected || []) {
      const existing = biasOccurrences.get(bias) || [];
      existing.push(memory);
      biasOccurrences.set(bias, existing);
    }
  }

  for (const [bias, items] of Array.from(biasOccurrences.entries())) {
    if (items.length >= 3) {
      patterns.push({
        patternType: "recurring_bias",
        description: `Le biais "${bias}" apparaît régulièrement dans vos discussions.`,
        occurrences: items.length,
        examples: items.slice(0, 3),
        recommendation: `Mettez en place une checklist anti-${bias} pour vos décisions importantes.`,
      });
    }
  }

  // Pattern 2: Décisions similaires
  const decisionMemories = memories.filter(m => m.type === "decision");
  const keywordGroups = new Map<string, MemoryItem[]>();
  
  for (const decision of decisionMemories) {
    const mainKeyword = decision.keywords[0];
    if (mainKeyword) {
      const existing = keywordGroups.get(mainKeyword) || [];
      existing.push(decision);
      keywordGroups.set(mainKeyword, existing);
    }
  }

  for (const [keyword, items] of Array.from(keywordGroups.entries())) {
    if (items.length >= 2) {
      const outcomes = items.map(i => i.metadata.outcome).filter(Boolean);
      const successRate = outcomes.filter(o => o === "success").length / outcomes.length;
      
      if (outcomes.length >= 2) {
        patterns.push({
          patternType: "decision_pattern",
          description: `Vous avez pris ${items.length} décisions similaires concernant "${keyword}".`,
          occurrences: items.length,
          examples: items.slice(0, 3),
          recommendation: successRate >= 0.7 
            ? `Bonne nouvelle : ${Math.round(successRate * 100)}% de succès sur ce type de décision !`
            : `Attention : seulement ${Math.round(successRate * 100)}% de succès. Analysez les échecs passés.`,
        });
      }
    }
  }

  // Pattern 3: Erreurs répétées
  const errorMemories = memories.filter(m => m.type === "error" || m.metadata.outcome === "failure");
  if (errorMemories.length >= 3) {
    // Trouver les mots-clés communs
    const commonKeywords = findCommonKeywords(errorMemories);
    if (commonKeywords.length > 0) {
      patterns.push({
        patternType: "recurring_error",
        description: `Des erreurs récurrentes sont liées à : ${commonKeywords.join(", ")}.`,
        occurrences: errorMemories.length,
        examples: errorMemories.slice(0, 3),
        recommendation: "Créez une checklist de vérification pour ces sujets sensibles.",
      });
    }
  }

  return patterns;
}

/**
 * Trouve les mots-clés communs entre plusieurs items
 */
function findCommonKeywords(items: MemoryItem[]): string[] {
  if (items.length === 0) return [];

  const keywordCounts = new Map<string, number>();
  for (const item of items) {
    for (const keyword of item.keywords) {
      keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
    }
  }

  // Retourner les mots-clés présents dans au moins la moitié des items
  const threshold = Math.ceil(items.length / 2);
  return Array.from(keywordCounts.entries())
    .filter(([, count]) => count >= threshold)
    .map(([keyword]) => keyword);
}

// ============================================================================
// CRÉATION D'ITEMS DE MÉMOIRE
// ============================================================================

/**
 * Crée un nouvel item de mémoire à partir d'une décision
 */
export async function createDecisionMemory(
  decision: {
    id: string;
    title: string;
    description: string;
    rationale?: string;
    outcome?: "success" | "failure" | "pending" | "unknown";
    biasesDetected?: string[];
  },
  metadata: {
    projectId: number;
    teamId: number;
    participants?: string[];
  }
): Promise<MemoryItem> {
  const content = `${decision.title}\n\n${decision.description}\n\nRaisonnement: ${decision.rationale || "Non spécifié"}`;
  const { summary, keywords, relevanceScore } = await summarizeContent(content);

  return {
    id: decision.id,
    type: "decision",
    content,
    summary,
    keywords,
    relevanceScore,
    metadata: {
      ...metadata,
      createdAt: new Date(),
      biasesDetected: decision.biasesDetected,
      outcome: decision.outcome,
    },
  };
}

/**
 * Crée un item de mémoire à partir d'une discussion importante
 */
export async function createDiscussionMemory(
  discussion: {
    id: string;
    messages: Array<{ author: string; content: string }>;
    topic?: string;
  },
  metadata: {
    projectId: number;
    teamId: number;
    biasesDetected?: string[];
  }
): Promise<MemoryItem> {
  const content = discussion.messages
    .map(m => `${m.author}: ${m.content}`)
    .join("\n");
  
  const { summary, keywords, relevanceScore } = await summarizeContent(content);

  return {
    id: discussion.id,
    type: "discussion",
    content,
    summary: discussion.topic ? `[${discussion.topic}] ${summary}` : summary,
    keywords,
    relevanceScore,
    metadata: {
      ...metadata,
      createdAt: new Date(),
      participants: Array.from(new Set(discussion.messages.map(m => m.author))),
      biasesDetected: metadata.biasesDetected,
    },
  };
}

/**
 * Crée un item de mémoire pour un apprentissage
 */
export async function createLearningMemory(
  learning: {
    id: string;
    title: string;
    description: string;
    source: "decision" | "error" | "feedback" | "retrospective";
  },
  metadata: {
    projectId: number;
    teamId: number;
  }
): Promise<MemoryItem> {
  const content = `${learning.title}\n\n${learning.description}\n\nSource: ${learning.source}`;
  const { summary, keywords, relevanceScore } = await summarizeContent(content);

  return {
    id: learning.id,
    type: "learning",
    content,
    summary,
    keywords,
    relevanceScore: Math.min(relevanceScore + 0.2, 1), // Boost pour les apprentissages
    metadata: {
      ...metadata,
      createdAt: new Date(),
    },
  };
}

// ============================================================================
// SUGGESTIONS BASÉES SUR LA MÉMOIRE
// ============================================================================

/**
 * Génère des suggestions basées sur la mémoire collective
 */
export async function generateMemorySuggestions(
  currentContext: string,
  memories: MemoryItem[]
): Promise<Array<{
  type: "similar_decision" | "past_error" | "learned_lesson" | "pattern_warning";
  title: string;
  description: string;
  relatedMemory?: MemoryItem;
  confidence: number;
}>> {
  const suggestions: Array<{
    type: "similar_decision" | "past_error" | "learned_lesson" | "pattern_warning";
    title: string;
    description: string;
    relatedMemory?: MemoryItem;
    confidence: number;
  }> = [];

  // Rechercher des décisions similaires
  const similarDecisions = await searchMemory(currentContext, memories, {
    types: ["decision"],
    maxResults: 3,
    minScore: 0.3,
  });

  for (const result of similarDecisions) {
    if (result.item.metadata.outcome === "failure") {
      suggestions.push({
        type: "past_error",
        title: "⚠️ Décision similaire ayant échoué",
        description: `Une décision similaire ("${result.item.summary.slice(0, 50)}...") n'a pas fonctionné. Analysez les différences.`,
        relatedMemory: result.item,
        confidence: result.score,
      });
    } else if (result.item.metadata.outcome === "success") {
      suggestions.push({
        type: "similar_decision",
        title: "✅ Décision similaire réussie",
        description: `Une décision similaire a bien fonctionné. Inspirez-vous de l'approche.`,
        relatedMemory: result.item,
        confidence: result.score,
      });
    }
  }

  // Rechercher des apprentissages pertinents
  const relevantLearnings = await searchMemory(currentContext, memories, {
    types: ["learning"],
    maxResults: 2,
    minScore: 0.25,
  });

  for (const result of relevantLearnings) {
    suggestions.push({
      type: "learned_lesson",
      title: "💡 Apprentissage pertinent",
      description: result.item.summary,
      relatedMemory: result.item,
      confidence: result.score,
    });
  }

  // Détecter les patterns et avertir
  const patterns = detectPatterns(memories);
  for (const pattern of patterns) {
    if (pattern.patternType === "recurring_error" || pattern.patternType === "recurring_bias") {
      suggestions.push({
        type: "pattern_warning",
        title: "🔄 Pattern récurrent détecté",
        description: pattern.description + " " + pattern.recommendation,
        confidence: 0.7,
      });
    }
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 5);
}
