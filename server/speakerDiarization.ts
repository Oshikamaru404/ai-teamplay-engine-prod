/**
 * Speaker Diarization Module
 * Identifies and tracks different speakers in audio conversations
 * Uses voice characteristics analysis to distinguish participants
 */

import { invokeLLM } from "./_core/llm";

// ==================== TYPES ====================

export interface SpeakerSegment {
  speakerId: string;
  speakerLabel: string;
  startTime: number; // seconds
  endTime: number; // seconds
  duration: number; // seconds
  text: string;
  confidence: number; // 0 to 1
  voiceCharacteristics?: VoiceCharacteristics;
}

export interface VoiceCharacteristics {
  pitch: "low" | "medium" | "high";
  pace: "slow" | "normal" | "fast";
  energy: "calm" | "moderate" | "energetic";
  dominance: number; // 0 to 1 - how much they dominate the conversation
}

export interface DiarizationResult {
  totalSpeakers: number;
  speakers: SpeakerProfile[];
  segments: SpeakerSegment[];
  conversationMetrics: ConversationMetrics;
  dominanceAnalysis: DominanceAnalysis;
}

export interface SpeakerProfile {
  id: string;
  label: string;
  totalSpeakingTime: number; // seconds
  segmentCount: number;
  averageSegmentDuration: number;
  speakingPercentage: number; // 0 to 100
  voiceCharacteristics: VoiceCharacteristics;
  participationScore: number; // 0 to 1
}

export interface ConversationMetrics {
  totalDuration: number;
  totalSpeakingTime: number;
  silenceTime: number;
  silencePercentage: number;
  turnTakingRate: number; // turns per minute
  averageTurnDuration: number;
  interruptionCount: number;
  overlapPercentage: number;
}

export interface DominanceAnalysis {
  dominantSpeaker: string | null;
  dominanceScore: number; // 0 to 1
  balanceScore: number; // 0 to 1 (1 = perfectly balanced)
  silentParticipants: string[];
  recommendations: string[];
}

// ==================== SPEAKER IDENTIFICATION ====================

/**
 * Analyze transcribed text to identify different speakers
 * Uses linguistic patterns, turn-taking, and contextual cues
 */
export async function identifySpeakers(
  transcription: string,
  expectedSpeakers?: number
): Promise<DiarizationResult> {
  // Parse transcription to identify speaker changes
  const segments = await parseTranscriptionForSpeakers(transcription);
  
  // Build speaker profiles
  const speakers = buildSpeakerProfiles(segments);
  
  // Calculate conversation metrics
  const conversationMetrics = calculateConversationMetrics(segments);
  
  // Analyze dominance patterns
  const dominanceAnalysis = analyzeDominance(speakers, conversationMetrics);
  
  return {
    totalSpeakers: speakers.length,
    speakers,
    segments,
    conversationMetrics,
    dominanceAnalysis,
  };
}

/**
 * Parse transcription text to identify speaker segments
 * Looks for patterns like "Speaker 1:", "[Person A]", timestamps, etc.
 */
async function parseTranscriptionForSpeakers(
  transcription: string
): Promise<SpeakerSegment[]> {
  const segments: SpeakerSegment[] = [];
  
  // Try to use LLM for intelligent speaker identification
  try {
    const llmResult = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Tu es un expert en analyse de conversations. Analyse le texte suivant et identifie les différents intervenants.
          
Pour chaque segment de parole, retourne un JSON avec:
- speakerId: identifiant unique (speaker_1, speaker_2, etc.)
- speakerLabel: label descriptif si détectable (ex: "Modérateur", "Expert technique")
- text: le texte prononcé
- estimatedDuration: durée estimée en secondes basée sur le nombre de mots (~150 mots/minute)
- confidence: confiance dans l'identification (0-1)
- voiceCharacteristics: { pitch, pace, energy } basé sur le style d'écriture

Retourne un tableau JSON de segments.`
        },
        {
          role: "user",
          content: transcription.substring(0, 4000) // Limit for API
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "speaker_segments",
          strict: true,
          schema: {
            type: "object",
            properties: {
              segments: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    speakerId: { type: "string" },
                    speakerLabel: { type: "string" },
                    text: { type: "string" },
                    estimatedDuration: { type: "number" },
                    confidence: { type: "number" },
                    pitch: { type: "string", enum: ["low", "medium", "high"] },
                    pace: { type: "string", enum: ["slow", "normal", "fast"] },
                    energy: { type: "string", enum: ["calm", "moderate", "energetic"] }
                  },
                  required: ["speakerId", "speakerLabel", "text", "estimatedDuration", "confidence", "pitch", "pace", "energy"],
                  additionalProperties: false
                }
              }
            },
            required: ["segments"],
            additionalProperties: false
          }
        }
      }
    });

    const content = llmResult.choices[0].message.content;
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const parsed = JSON.parse(contentStr || "{}");
    let currentTime = 0;
    
    if (parsed.segments && Array.isArray(parsed.segments)) {
      for (const seg of parsed.segments) {
        const duration = seg.estimatedDuration || estimateDuration(seg.text);
        segments.push({
          speakerId: seg.speakerId || "unknown",
          speakerLabel: seg.speakerLabel || "Intervenant",
          startTime: currentTime,
          endTime: currentTime + duration,
          duration,
          text: seg.text,
          confidence: seg.confidence || 0.7,
          voiceCharacteristics: {
            pitch: seg.pitch || "medium",
            pace: seg.pace || "normal",
            energy: seg.energy || "moderate",
            dominance: 0 // Will be calculated later
          }
        });
        currentTime += duration;
      }
    }
  } catch (error) {
    console.error("[SpeakerDiarization] LLM analysis failed, using fallback:", error);
    // Fallback: simple pattern-based parsing
    return parseTranscriptionFallback(transcription);
  }
  
  return segments.length > 0 ? segments : parseTranscriptionFallback(transcription);
}

/**
 * Fallback parser using regex patterns
 */
function parseTranscriptionFallback(transcription: string): SpeakerSegment[] {
  const segments: SpeakerSegment[] = [];
  
  // Common patterns for speaker identification
  const patterns = [
    /(?:^|\n)(?:Speaker|Intervenant|Participant)\s*(\d+)\s*[:\-]\s*(.+?)(?=(?:\n(?:Speaker|Intervenant|Participant)\s*\d+)|$)/gi,
    /(?:^|\n)\[([^\]]+)\]\s*[:\-]?\s*(.+?)(?=(?:\n\[[^\]]+\])|$)/gi,
    /(?:^|\n)([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s*:\s*(.+?)(?=(?:\n[A-Z][a-z]+(?:\s[A-Z][a-z]+)?\s*:)|$)/gi,
  ];
  
  let matched = false;
  let currentTime = 0;
  
  for (const pattern of patterns) {
    const matches: RegExpExecArray[] = [];
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(transcription)) !== null) {
      matches.push(match);
    }
    if (matches.length > 0) {
      matched = true;
      for (const match of matches) {
        const speakerLabel = match[1].trim();
        const text = match[2].trim();
        const duration = estimateDuration(text);
        
        segments.push({
          speakerId: `speaker_${speakerLabel.toLowerCase().replace(/\s+/g, '_')}`,
          speakerLabel,
          startTime: currentTime,
          endTime: currentTime + duration,
          duration,
          text,
          confidence: 0.6,
          voiceCharacteristics: {
            pitch: "medium",
            pace: "normal",
            energy: "moderate",
            dominance: 0
          }
        });
        currentTime += duration;
      }
      break;
    }
  }
  
  // If no patterns matched, treat as single speaker
  if (!matched && transcription.trim()) {
    const duration = estimateDuration(transcription);
    segments.push({
      speakerId: "speaker_1",
      speakerLabel: "Intervenant principal",
      startTime: 0,
      endTime: duration,
      duration,
      text: transcription.trim(),
      confidence: 0.5,
      voiceCharacteristics: {
        pitch: "medium",
        pace: "normal",
        energy: "moderate",
        dominance: 1
      }
    });
  }
  
  return segments;
}

/**
 * Estimate speech duration based on word count
 * Average speaking rate: ~150 words per minute
 */
function estimateDuration(text: string): number {
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  return Math.max(1, (wordCount / 150) * 60); // Convert to seconds
}

// ==================== SPEAKER PROFILES ====================

function buildSpeakerProfiles(segments: SpeakerSegment[]): SpeakerProfile[] {
  const speakerMap = new Map<string, {
    segments: SpeakerSegment[];
    totalTime: number;
  }>();
  
  // Group segments by speaker
  for (const segment of segments) {
    const existing = speakerMap.get(segment.speakerId);
    if (existing) {
      existing.segments.push(segment);
      existing.totalTime += segment.duration;
    } else {
      speakerMap.set(segment.speakerId, {
        segments: [segment],
        totalTime: segment.duration
      });
    }
  }
  
  // Calculate total speaking time
  const totalSpeakingTime = segments.reduce((sum, s) => sum + s.duration, 0);
  
  // Build profiles
  const profiles: SpeakerProfile[] = [];
  
  speakerMap.forEach((data, speakerId) => {
    const avgCharacteristics = calculateAverageCharacteristics(data.segments);
    const speakingPercentage = (data.totalTime / totalSpeakingTime) * 100;
    
    profiles.push({
      id: speakerId,
      label: data.segments[0].speakerLabel,
      totalSpeakingTime: data.totalTime,
      segmentCount: data.segments.length,
      averageSegmentDuration: data.totalTime / data.segments.length,
      speakingPercentage,
      voiceCharacteristics: {
        ...avgCharacteristics,
        dominance: speakingPercentage / 100
      },
      participationScore: calculateParticipationScore(data.segments, segments)
    });
  });
  
  // Sort by speaking time (most to least)
  return profiles.sort((a, b) => b.totalSpeakingTime - a.totalSpeakingTime);
}

function calculateAverageCharacteristics(segments: SpeakerSegment[]): Omit<VoiceCharacteristics, 'dominance'> {
  const pitchCounts = { low: 0, medium: 0, high: 0 };
  const paceCounts = { slow: 0, normal: 0, fast: 0 };
  const energyCounts = { calm: 0, moderate: 0, energetic: 0 };
  
  for (const seg of segments) {
    if (seg.voiceCharacteristics) {
      pitchCounts[seg.voiceCharacteristics.pitch]++;
      paceCounts[seg.voiceCharacteristics.pace]++;
      energyCounts[seg.voiceCharacteristics.energy]++;
    }
  }
  
  const getMostCommon = <T extends string>(counts: Record<T, number>): T => {
    return Object.entries(counts).reduce((a, b) => 
      (b[1] as number) > (a[1] as number) ? b : a
    )[0] as T;
  };
  
  return {
    pitch: getMostCommon(pitchCounts),
    pace: getMostCommon(paceCounts),
    energy: getMostCommon(energyCounts)
  };
}

function calculateParticipationScore(
  speakerSegments: SpeakerSegment[],
  allSegments: SpeakerSegment[]
): number {
  // Score based on:
  // - Speaking time ratio
  // - Number of turns
  // - Distribution throughout conversation
  
  const totalSegments = allSegments.length;
  const speakerSegmentCount = speakerSegments.length;
  const turnRatio = speakerSegmentCount / totalSegments;
  
  // Check distribution (are segments spread throughout?)
  const totalDuration = allSegments[allSegments.length - 1]?.endTime || 1;
  const speakerStartTimes = speakerSegments.map(s => s.startTime);
  const distribution = calculateDistributionScore(speakerStartTimes, totalDuration);
  
  return (turnRatio * 0.5 + distribution * 0.5);
}

function calculateDistributionScore(times: number[], totalDuration: number): number {
  if (times.length <= 1) return 0.5;
  
  // Divide conversation into quartiles and check presence
  const quartiles = [0, 0, 0, 0];
  for (const time of times) {
    const quartile = Math.min(3, Math.floor((time / totalDuration) * 4));
    quartiles[quartile]++;
  }
  
  // Score based on how many quartiles have participation
  const activeQuartiles = quartiles.filter(q => q > 0).length;
  return activeQuartiles / 4;
}

// ==================== CONVERSATION METRICS ====================

function calculateConversationMetrics(segments: SpeakerSegment[]): ConversationMetrics {
  if (segments.length === 0) {
    return {
      totalDuration: 0,
      totalSpeakingTime: 0,
      silenceTime: 0,
      silencePercentage: 0,
      turnTakingRate: 0,
      averageTurnDuration: 0,
      interruptionCount: 0,
      overlapPercentage: 0
    };
  }
  
  const totalDuration = segments[segments.length - 1].endTime;
  const totalSpeakingTime = segments.reduce((sum, s) => sum + s.duration, 0);
  
  // Calculate silence (gaps between segments)
  let silenceTime = 0;
  for (let i = 1; i < segments.length; i++) {
    const gap = segments[i].startTime - segments[i - 1].endTime;
    if (gap > 0) silenceTime += gap;
  }
  
  // Count speaker changes (turn-taking)
  let turnCount = 1;
  let interruptionCount = 0;
  for (let i = 1; i < segments.length; i++) {
    if (segments[i].speakerId !== segments[i - 1].speakerId) {
      turnCount++;
      // Check for interruption (overlap or very short gap)
      const gap = segments[i].startTime - segments[i - 1].endTime;
      if (gap < 0.5) interruptionCount++;
    }
  }
  
  // Calculate overlap
  let overlapTime = 0;
  for (let i = 1; i < segments.length; i++) {
    const overlap = segments[i - 1].endTime - segments[i].startTime;
    if (overlap > 0) overlapTime += overlap;
  }
  
  return {
    totalDuration,
    totalSpeakingTime,
    silenceTime,
    silencePercentage: (silenceTime / totalDuration) * 100,
    turnTakingRate: (turnCount / totalDuration) * 60, // turns per minute
    averageTurnDuration: totalSpeakingTime / turnCount,
    interruptionCount,
    overlapPercentage: (overlapTime / totalDuration) * 100
  };
}

// ==================== DOMINANCE ANALYSIS ====================

function analyzeDominance(
  speakers: SpeakerProfile[],
  metrics: ConversationMetrics
): DominanceAnalysis {
  const recommendations: string[] = [];
  
  if (speakers.length === 0) {
    return {
      dominantSpeaker: null,
      dominanceScore: 0,
      balanceScore: 1,
      silentParticipants: [],
      recommendations: ["Aucun intervenant détecté dans l'enregistrement"]
    };
  }
  
  // Find dominant speaker
  const dominantSpeaker = speakers[0];
  const dominanceScore = dominantSpeaker.speakingPercentage / 100;
  
  // Calculate balance score (Gini coefficient inverse)
  const idealShare = 100 / speakers.length;
  const deviations = speakers.map(s => Math.abs(s.speakingPercentage - idealShare));
  const avgDeviation = deviations.reduce((a, b) => a + b, 0) / speakers.length;
  const balanceScore = Math.max(0, 1 - (avgDeviation / idealShare));
  
  // Identify silent participants (< 10% of ideal share)
  const silentThreshold = idealShare * 0.1;
  const silentParticipants = speakers
    .filter(s => s.speakingPercentage < silentThreshold)
    .map(s => s.label);
  
  // Generate recommendations
  if (dominanceScore > 0.6) {
    recommendations.push(
      `${dominantSpeaker.label} domine la conversation (${Math.round(dominantSpeaker.speakingPercentage)}%). ` +
      `Encourager les autres participants à s'exprimer.`
    );
  }
  
  if (balanceScore < 0.5) {
    recommendations.push(
      "Déséquilibre significatif dans la participation. " +
      "Considérer un tour de table structuré."
    );
  }
  
  if (silentParticipants.length > 0) {
    recommendations.push(
      `Participants silencieux détectés: ${silentParticipants.join(", ")}. ` +
      `Solliciter leur expertise directement.`
    );
  }
  
  if (metrics.interruptionCount > metrics.turnTakingRate * 0.3) {
    recommendations.push(
      "Nombre élevé d'interruptions détecté. " +
      "Établir des règles de prise de parole plus claires."
    );
  }
  
  if (metrics.silencePercentage > 30) {
    recommendations.push(
      "Temps de silence important. " +
      "Vérifier l'engagement des participants ou relancer la discussion."
    );
  }
  
  return {
    dominantSpeaker: dominantSpeaker.label,
    dominanceScore,
    balanceScore,
    silentParticipants,
    recommendations
  };
}

// ==================== INTEGRATION HELPERS ====================

/**
 * Analyze audio transcription and return diarization with cognitive insights
 */
export async function analyzeAudioWithDiarization(
  transcription: string,
  teamMemberCount?: number
): Promise<{
  diarization: DiarizationResult;
  cognitiveInsights: string[];
  smartPingTriggers: string[];
}> {
  const diarization = await identifySpeakers(transcription, teamMemberCount);
  
  const cognitiveInsights: string[] = [];
  const smartPingTriggers: string[] = [];
  
  // Generate cognitive insights
  if (diarization.dominanceAnalysis.dominanceScore > 0.5) {
    cognitiveInsights.push(
      `Dominance vocale détectée: ${diarization.dominanceAnalysis.dominantSpeaker} ` +
      `occupe ${Math.round(diarization.dominanceAnalysis.dominanceScore * 100)}% du temps de parole.`
    );
    smartPingTriggers.push("balance"); // Trigger Balance Ping
  }
  
  if (diarization.dominanceAnalysis.balanceScore < 0.4) {
    cognitiveInsights.push(
      "Participation déséquilibrée: certains membres sont sous-représentés dans la discussion."
    );
    smartPingTriggers.push("silence"); // Trigger Silence Ping
  }
  
  if (diarization.conversationMetrics.turnTakingRate < 2) {
    cognitiveInsights.push(
      "Faible dynamique d'échange: les tours de parole sont peu fréquents, " +
      "ce qui peut indiquer un manque d'interaction."
    );
  }
  
  if (diarization.dominanceAnalysis.silentParticipants.length > 0) {
    cognitiveInsights.push(
      `Expertise potentiellement non exploitée: ${diarization.dominanceAnalysis.silentParticipants.length} ` +
      `participant(s) silencieux identifié(s).`
    );
    smartPingTriggers.push("silence");
  }
  
  return {
    diarization,
    cognitiveInsights,
    smartPingTriggers
  };
}
