import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import {
  detectBiasKeywords,
  detectBiasWithLLM,
  analyzeMessage,
  generateSmartPing,
  calculateCognitiveMetrics,
  BIAS_PATTERNS,
} from "./biasDetection";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { transcribeAudio } from "./_core/voiceTranscription";
import { analyzeQuick, analyzeWithLLM, FullAnalysisResult } from "./realtimeAnalysis";
import {
  generateSmartSummary,
  filterSignificantBiases,
  VULGARIZED_BIASES,
  DEFAULT_THRESHOLDS,
  CONTEXT_THRESHOLDS,
  type SmartBiasSummary,
} from "./smartBiasSystem";
import {
  BIG_FIVE_QUIZ,
  TRAIT_DESCRIPTIONS,
  calculateQuizProfile,
  getTeamRole,
  type QuizAnswer,
  type BigFiveProfile,
} from "./bigFiveProfile";
import {
  extractFromCVText,
  calculateProfileCompleteness,
  type ProfessionalProfile,
} from "./professionalProfile";

// ==================== COGNITIVE TOKENS SYSTEM ====================

// CT Thresholds for triggering different ping types
const CT_THRESHOLDS = {
  bias: { min: 120, max: 200 },           // Biais cognitifs
  groupthink: { min: 150, max: 250 },     // Groupthink
  dominance: { min: 80, max: 150 },       // Dominance
  cognitivelock: { min: 200, max: 300 },  // Verrouillage cognitif
};

// Calculate Cognitive Tokens based on message complexity
function calculateCognitiveTokens(text: string): number {
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  const lineCount = text.split('\n').filter(l => l.trim().length > 0).length;
  const hasStructure = /^[-*\d]+\.?\s/m.test(text); // Lists, numbered points
  const hasQuestions = (text.match(/\?/g) || []).length;
  const hasConclusion = /donc|ainsi|en conclusion|par conséquent|finalement/i.test(text);
  const hasArguments = /parce que|car|puisque|en effet|d'une part|d'autre part/i.test(text);
  const isDecision = /décidé|décision|validé|approuvé|rejeté|adopté/i.test(text);
  const isAgreement = /^(ok|d'accord|oui|non|je suis d'accord|parfait|entendu)$/i.test(text.trim());

  // Simple agreement = 1 CT
  if (isAgreement || wordCount <= 5) {
    return 1;
  }

  // Base CT calculation
  let ct = Math.ceil(wordCount / 15); // ~1 CT per 15 words

  // Bonuses for complexity
  if (hasStructure) ct += 2;
  if (hasQuestions >= 2) ct += 1;
  if (hasConclusion) ct += 2;
  if (hasArguments) ct += 2;
  if (isDecision) ct += 4;
  if (lineCount >= 5) ct += Math.floor(lineCount / 5);

  // Cap based on message type
  if (isDecision) {
    return Math.min(Math.max(ct, 6), 10); // 6-10 CT for decisions
  } else if (lineCount >= 10 || wordCount >= 150) {
    return Math.min(Math.max(ct, 8), 12); // 8-12 CT for long strategic analysis
  } else if (lineCount >= 5 || wordCount >= 50) {
    return Math.min(Math.max(ct, 4), 6); // 4-6 CT for structured arguments
  }

  return Math.min(ct, 12); // Max 12 CT per message
}

// Check CT thresholds and trigger appropriate pings
async function checkAndTriggerCTPings(
  projectId: number,
  totalCT: number,
  analysis?: FullAnalysisResult
): Promise<void> {
  const project = await db.getProjectById(projectId);
  if (!project) return;

  // Vérification CAT : au moins 3 membres doivent avoir participé
  const recentMessages = await db.getMessagesByProjectId(projectId, 50);
  const uniqueUserIds = new Set(recentMessages.filter(m => m.message.userId).map(m => m.message.userId));
  const participantCount = uniqueUserIds.size;
  
  // Ne pas déclencher de pings si moins de 3 membres impliqés
  if (participantCount < 3) {
    console.log(`[CAT] Ping bloqué : seulement ${participantCount} membre(s) impliqué(s), minimum 3 requis`);
    return;
  }

  const lastPingCT = (project as any).lastPingCT || 0;
  const triggeredPings: string[] = [];

  // Check each threshold
  for (const [pingType, threshold] of Object.entries(CT_THRESHOLDS)) {
    const shouldTrigger = totalCT >= threshold.min && 
                          totalCT <= threshold.max && 
                          lastPingCT < threshold.min;
    
    if (shouldTrigger) {
      let message = '';
      let severity: 'info' | 'warning' | 'critical' = 'warning';

      switch (pingType) {
        case 'bias':
          if (analysis?.biases && analysis.biases.length > 0) {
            message = `Bias Ping : Après ${totalCT} CT d'échanges, des schémas de biais cognitifs ont été détectés. Risque de verrouillage cognitif élevé.`;
            severity = 'critical';
            triggeredPings.push('bias');
          }
          break;
        case 'groupthink':
          message = `Antifragility Ping : Après ${totalCT} CT, niveau de contradiction interne anormalement bas. Challenger l'hypothèse centrale recommandé.`;
          severity = 'warning';
          triggeredPings.push('antifragility');
          break;
        case 'dominance':
          message = `Balance Ping : Après ${totalCT} CT d'échanges, vérifiez la distribution des contributions. La performance optimale nécessite une participation équilibrée.`;
          severity = 'info';
          triggeredPings.push('balance');
          break;
        case 'cognitivelock':
          message = `Vision Ping : Après ${totalCT} CT, l'espace de solutions exploré se rétrécit. Dans 70% des cas similaires, cela limite l'innovation.`;
          severity = 'warning';
          triggeredPings.push('vision');
          break;
      }

      if (message) {
        await db.createMessage({
          projectId,
          content: message,
          type: 'smart_ping',
          metadata: { pingType, severity, ctTrigger: totalCT },
        });
      }
    }
  }

  // Update last ping CT if any pings were triggered
  if (triggeredPings.length > 0) {
    await db.updateProjectLastPingCT(projectId, totalCT);
  }
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ==================== USER ROUTES ====================
  user: router({
    getProfile: protectedProcedure.query(async ({ ctx }) => {
      return ctx.user;
    }),

    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().optional(),
          bio: z.string().optional(),
          avatarUrl: z.string().optional(),
          expertise: z.array(z.string()).optional(),
          cognitiveProfile: z
            .object({
              thinkingStyle: z.string(),
              decisionSpeed: z.string(),
              riskTolerance: z.string(),
              collaborationPreference: z.string(),
            })
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateUserProfile(ctx.user.id, input);
        return { success: true };
      }),
  }),

  // ==================== TEAM ROUTES ====================
  team: router({
    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const teamId = await db.createTeam({
          name: input.name,
          description: input.description,
          ownerId: ctx.user.id,
        });
        await db.addTeamMember({
          teamId,
          userId: ctx.user.id,
          role: "owner",
        });
        return { id: teamId };
      }),

    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getTeamsByUserId(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getTeamById(input.id);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          settings: z
            .object({
              biasAlertThreshold: z.number(),
              diversityTarget: z.number(),
              convergenceWarningLevel: z.number(),
            })
            .optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTeam(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTeam(input.id);
        return { success: true };
      }),

    getMembers: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return db.getTeamMembers(input.teamId);
      }),

    addMember: protectedProcedure
      .input(
        z.object({
          teamId: z.number(),
          userId: z.number(),
          role: z.enum(["owner", "admin", "member"]).default("member"),
        })
      )
      .mutation(async ({ input }) => {
        await db.addTeamMember(input);
        return { success: true };
      }),

    removeMember: protectedProcedure
      .input(z.object({ teamId: z.number(), userId: z.number() }))
      .mutation(async ({ input }) => {
        await db.removeTeamMember(input.teamId, input.userId);
        return { success: true };
      }),

    // Invitation routes
    createInvitation: protectedProcedure
      .input(
        z.object({
          teamId: z.number(),
          email: z.string().email().optional(),
          role: z.enum(["admin", "member"]).default("member"),
          expiresInDays: z.number().default(7),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const inviteCode = nanoid(32);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

        const invitationId = await db.createTeamInvitation({
          teamId: input.teamId,
          invitedByUserId: ctx.user.id,
          email: input.email,
          inviteCode,
          role: input.role,
          expiresAt,
        });

        return {
          id: invitationId,
          inviteCode,
          inviteUrl: `/invite/${inviteCode}`,
          expiresAt,
        };
      }),

    getInvitations: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return db.getTeamInvitationsByTeamId(input.teamId);
      }),

    getMyInvitations: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user.email) return [];
      return db.getTeamInvitationsByEmail(ctx.user.email);
    }),

    acceptInvitation: protectedProcedure
      .input(z.object({ inviteCode: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const teamId = await db.acceptTeamInvitation(input.inviteCode, ctx.user.id);
        return { success: true, teamId };
      }),

    declineInvitation: protectedProcedure
      .input(z.object({ inviteCode: z.string() }))
      .mutation(async ({ input }) => {
        await db.declineTeamInvitation(input.inviteCode);
        return { success: true };
      }),

    deleteInvitation: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTeamInvitation(input.id);
        return { success: true };
      }),

    getInvitationByCode: publicProcedure
      .input(z.object({ inviteCode: z.string() }))
      .query(async ({ input }) => {
        const invitation = await db.getTeamInvitationByCode(input.inviteCode);
        if (!invitation) return null;
        const team = await db.getTeamById(invitation.teamId);
        return { invitation, team };
      }),
  }),

  // ==================== PROJECT ROUTES ====================
  project: router({
    create: protectedProcedure
      .input(
        z.object({
          teamId: z.number(),
          name: z.string().min(1).max(255),
          description: z.string().optional(),
          goals: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const projectId = await db.createProject({
          teamId: input.teamId,
          name: input.name,
          description: input.description,
          goals: input.goals,
          cognitiveHealth: {
            diversityIndex: 0.5,
            criticalThinkingScore: 0.5,
            convergenceRate: 0.3,
            biasRiskLevel: 0.2,
            decisionQuality: 0.5,
          },
        });
        return { id: projectId };
      }),

    list: protectedProcedure
      .input(z.object({ teamId: z.number() }))
      .query(async ({ input }) => {
        return db.getProjectsByTeamId(input.teamId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getProjectById(input.id);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          name: z.string().optional(),
          description: z.string().optional(),
          status: z
            .enum(["planning", "active", "review", "completed", "archived"])
            .optional(),
          goals: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateProject(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteProject(input.id);
        return { success: true };
      }),

    getCognitiveHealth: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const project = await db.getProjectById(input.projectId);
        const latestMetric = await db.getLatestCognitiveMetric(input.projectId);
        return {
          projectHealth: project?.cognitiveHealth,
          latestMetric,
        };
      }),
  }),

  // ==================== DECISION ROUTES ====================
  decision: router({
    create: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          title: z.string().min(1).max(500),
          description: z.string().optional(),
          type: z
            .enum(["strategic", "tactical", "operational", "technical"])
            .default("tactical"),
          alternatives: z
            .array(
              z.object({
                option: z.string(),
                pros: z.array(z.string()),
                cons: z.array(z.string()),
              })
            )
            .optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const decisionId = await db.createDecision({
          projectId: input.projectId,
          title: input.title,
          description: input.description,
          type: input.type,
          alternatives: input.alternatives,
          proposedBy: ctx.user.id,
        });
        return { id: decisionId };
      }),

    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getDecisionsByProjectId(input.projectId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const decision = await db.getDecisionById(input.id);
        const votes = await db.getVotesByDecisionId(input.id);
        return { decision, votes };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          status: z
            .enum([
              "proposed",
              "discussing",
              "voting",
              "decided",
              "implemented",
              "revised",
            ])
            .optional(),
          outcome: z.string().optional(),
          rationale: z.string().optional(),
          biasesDetected: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        if (data.status === "decided") {
          (data as any).decidedAt = new Date();
        }
        await db.updateDecision(id, data);
        return { success: true };
      }),

    vote: protectedProcedure
      .input(
        z.object({
          decisionId: z.number(),
          choice: z.string(),
          reasoning: z.string().optional(),
          confidence: z.number().min(0).max(1).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.createVote({
          decisionId: input.decisionId,
          userId: ctx.user.id,
          choice: input.choice,
          reasoning: input.reasoning,
          confidence: input.confidence,
        });
        return { success: true };
      }),
  }),

  // ==================== CHAT/MESSAGE ROUTES ====================
  chat: router({
    send: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          content: z.string().min(1),
          parentId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        // Analyze message for biases
        const analysis = await analyzeMessage(input.content);

        const messageId = await db.createMessage({
          projectId: input.projectId,
          userId: ctx.user.id,
          content: input.content,
          type: "user",
          parentId: input.parentId,
          metadata: {
            sentiment: analysis.sentiment,
            cognitivePatterns: analysis.cognitivePatterns,
            biasIndicators: analysis.biasIndicators.map((b) => ({
              type: b.type,
              confidence: b.confidence,
            })),
          },
        });

        // If high-confidence bias detected, create smart ping
        const highConfidenceBias = analysis.biasIndicators.find(
          (b) => b.confidence > 0.6
        );
        if (highConfidenceBias) {
          const smartPingContent = generateSmartPing(highConfidenceBias);
          await db.createMessage({
            projectId: input.projectId,
            content: smartPingContent,
            type: "smart_ping",
            metadata: {
              biasIndicators: [
                {
                  type: highConfidenceBias.type,
                  confidence: highConfidenceBias.confidence,
                },
              ],
            },
          });

          // Create cognitive event
          await db.createCognitiveEvent({
            projectId: input.projectId,
            type: "bias_detected",
            severity:
              highConfidenceBias.severity === "high" ? "critical" : "warning",
            title: `Biais de ${highConfidenceBias.type} détecté`,
            description: highConfidenceBias.recommendation,
            sourceMessageId: messageId,
            data: { bias: highConfidenceBias },
          });

          // Send alert if critical
          if (highConfidenceBias.severity === "high") {
            await db.createAlert({
              projectId: input.projectId,
              userId: ctx.user.id,
              type: "bias_critical",
              title: `Biais critique: ${highConfidenceBias.type}`,
              message: highConfidenceBias.recommendation,
              severity: "high",
            });
          }
        }

        // Calculate and update cognitive tokens
        const ctValue = calculateCognitiveTokens(input.content);
        const newTotalCT = await db.incrementProjectCognitiveTokens(input.projectId, ctValue);

        // Update message with CT value
        await db.updateMessage(messageId, {
          metadata: {
            sentiment: analysis.sentiment,
            cognitivePatterns: analysis.cognitivePatterns,
            biasIndicators: analysis.biasIndicators.map((b) => ({
              type: b.type,
              confidence: b.confidence,
            })),
            ctValue,
          },
        });

        // Check if we need to trigger pings based on CT thresholds
        if (newTotalCT) {
          // Perform full analysis for CT-based pings
          const fullAnalysis = await analyzeWithLLM(input.content);
          await checkAndTriggerCTPings(input.projectId, newTotalCT, fullAnalysis);
        }

        return { id: messageId, analysis, ctValue, totalCT: newTotalCT };
      }),

    getMessages: protectedProcedure
      .input(z.object({ projectId: z.number(), limit: z.number().default(100) }))
      .query(async ({ input }) => {
        return db.getMessagesByProjectId(input.projectId, input.limit);
      }),

    analyzeConversation: protectedProcedure
      .input(z.object({ 
        projectId: z.number(),
        contextType: z.enum(["critical_decision", "brainstorming", "new_team", "experienced_team"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const messagesData = await db.getMessagesByProjectId(input.projectId, 50);
        const decisionsData = await db.getDecisionsByProjectId(input.projectId);
        const teamMembers = await db.getTeamMembers(
          (await db.getProjectById(input.projectId))?.teamId || 0
        );

        const context = {
          messages: messagesData.map((m) => ({
            content: m.message.content,
            userId: m.message.userId || 0,
            userName: m.user?.name || undefined,
            timestamp: m.message.createdAt,
          })),
          decisionHistory: decisionsData.map((d) => ({
            title: d.title,
            outcome: d.outcome || undefined,
            biasesDetected: d.biasesDetected || undefined,
          })),
          teamSize: teamMembers.length,
        };

        const analysis = await detectBiasWithLLM(context);

        // Générer le résumé intelligent des biais (anti-overload)
        const smartSummary = generateSmartSummary(analysis.biases, {
          teamSize: teamMembers.length,
          sessionDuration: 30, // TODO: calculer depuis les timestamps
          previousAlerts: 0, // TODO: récupérer depuis la session
          contextType: input.contextType,
        });

        // Store metrics
        await db.createCognitiveMetric({
          projectId: input.projectId,
          ...analysis.cognitiveHealth,
        });

        // Update project cognitive health
        await db.updateProject(input.projectId, {
          cognitiveHealth: {
            ...analysis.cognitiveHealth,
            decisionQuality: analysis.cognitiveHealth.biasRiskLevel < 0.5 ? 0.7 : 0.4,
          },
        });

        // Retourner l'analyse avec le résumé intelligent
        return {
          ...analysis,
          smartSummary,
          // Enrichir les biais avec les descriptions vulgarisées
          vulgarizedBiases: analysis.biases.map(b => ({
            ...b,
            vulgarized: VULGARIZED_BIASES[b.type as keyof typeof VULGARIZED_BIASES],
          })),
        };
      }),

    extractDecisions: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const messagesData = await db.getMessagesByProjectId(input.projectId, 100);
        
        if (messagesData.length === 0) {
          return { decisions: [], message: "Aucun message à analyser" };
        }

        // Build conversation context
        const conversation = messagesData
          .filter(m => m.message.type === "user")
          .map(m => `${m.user?.name || "Utilisateur"}: ${m.message.content}`)
          .join("\n");

        // Use LLM to extract decisions
        const extractionPrompt = `Analyse cette conversation d'équipe et identifie les décisions prises ou proposées.

Conversation:
${conversation}

Pour chaque décision identifiée, retourne un objet JSON avec:
- title: titre court de la décision
- description: description détaillée
- type: "strategic" | "tactical" | "operational" | "technical"
- status: "proposed" si c'est une suggestion, "discussing" si en débat, "decided" si validée
- rationale: le raisonnement derrière la décision
- confidenceLevel: niveau de confiance (0-1) basé sur le consensus apparent

Retourne un tableau JSON de décisions. Si aucune décision n'est identifiée, retourne un tableau vide [].
Réponds UNIQUEMENT avec le JSON, sans texte supplémentaire.`;

        try {
          const llmResponse = await invokeLLM({
            messages: [
              { role: "system", content: "Tu es un assistant spécialisé dans l'analyse de conversations d'équipe et l'extraction de décisions. Tu réponds uniquement en JSON valide." },
              { role: "user", content: extractionPrompt }
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "decisions_extraction",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    decisions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          title: { type: "string" },
                          description: { type: "string" },
                          type: { type: "string", enum: ["strategic", "tactical", "operational", "technical"] },
                          status: { type: "string", enum: ["proposed", "discussing", "decided"] },
                          rationale: { type: "string" },
                          confidenceLevel: { type: "number" }
                        },
                        required: ["title", "description", "type", "status", "rationale", "confidenceLevel"],
                        additionalProperties: false
                      }
                    }
                  },
                  required: ["decisions"],
                  additionalProperties: false
                }
              }
            }
          });

          const content = (llmResponse.choices?.[0]?.message?.content as string) || "{}";
          const parsed = JSON.parse(content);
          const extractedDecisions = parsed.decisions || [];

          // Create decisions in database
          const createdDecisions = [];
          for (const decision of extractedDecisions) {
            const decisionId = await db.createDecision({
              projectId: input.projectId,
              title: decision.title,
              description: decision.description,
              type: decision.type,
              status: decision.status,
              rationale: decision.rationale,
              confidenceLevel: decision.confidenceLevel,
              proposedBy: ctx.user.id,
            });
            createdDecisions.push({ id: decisionId, ...decision });
          }

          return {
            decisions: createdDecisions,
            message: `${createdDecisions.length} décision(s) extraite(s) de la conversation`
          };
        } catch (error) {
          console.error("Error extracting decisions:", error);
          return { decisions: [], message: "Erreur lors de l'extraction des décisions" };
        }
      }),
  }),

  // ==================== COGNITIVE EVENT ROUTES ====================
  cognitiveEvent: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number(), limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return db.getCognitiveEventsByProjectId(input.projectId, input.limit);
      }),

    acknowledge: protectedProcedure
      .input(z.object({ eventId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.acknowledgeEvent(input.eventId, ctx.user.id);
        return { success: true };
      }),
  }),

  // ==================== MEMORY EXPLORER ROUTES ====================
  memory: router({
    create: protectedProcedure
      .input(
        z.object({
          projectId: z.number().optional(),
          teamId: z.number().optional(),
          type: z.enum([
            "decision_outcome",
            "error_pattern",
            "success_pattern",
            "strategy",
            "lesson_learned",
          ]),
          title: z.string().min(1).max(500),
          content: z.string(),
          context: z.string().optional(),
          tags: z.array(z.string()).optional(),
          outcome: z.enum(["success", "failure", "neutral", "pending"]).optional(),
          isGlobal: z.boolean().default(false),
        })
      )
      .mutation(async ({ input }) => {
        const memoryId = await db.createCognitiveMemory(input);
        return { id: memoryId };
      }),

    search: protectedProcedure
      .input(z.object({ query: z.string(), limit: z.number().default(20) }))
      .query(async ({ input }) => {
        return db.searchCognitiveMemories(input.query, input.limit);
      }),

    getGlobal: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ input }) => {
        return db.getGlobalMemories(input.limit);
      }),

    searchWithAI: protectedProcedure
      .input(z.object({ query: z.string(), context: z.string().optional() }))
      .mutation(async ({ input }) => {
        // First, do keyword search
        const memories = await db.searchCognitiveMemories(input.query, 30);

        if (memories.length === 0) {
          return { memories: [], aiInsights: "Aucune mémoire trouvée pour cette recherche." };
        }

        // Use LLM to provide insights
        const memorySummary = memories
          .slice(0, 10)
          .map(
            (m) =>
              `- [${m.type}] ${m.title}: ${m.content.substring(0, 200)}... (Outcome: ${m.outcome})`
          )
          .join("\n");

        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content:
                  "Tu es un expert en intelligence collective. Analyse les mémoires cognitives trouvées et fournis des insights pertinents pour l'utilisateur.",
              },
              {
                role: "user",
                content: `Recherche: "${input.query}"\n\nMémoires trouvées:\n${memorySummary}\n\nContexte additionnel: ${input.context || "Aucun"}\n\nFournis des insights et recommandations basés sur ces expériences passées.`,
              },
            ],
          });

          const aiInsights =
            typeof response.choices[0]?.message?.content === "string"
              ? response.choices[0].message.content
              : "Analyse non disponible";

          return { memories, aiInsights };
        } catch {
          return { memories, aiInsights: "Analyse IA non disponible" };
        }
      }),
  }),

  // ==================== TASK ROUTES ====================
  task: router({
    create: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          title: z.string().min(1).max(500),
          description: z.string().optional(),
          priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
          assigneeId: z.number().optional(),
          dueDate: z.date().optional(),
          relatedDecisionId: z.number().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const taskId = await db.createTask(input);
        return { id: taskId };
      }),

    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getTasksByProjectId(input.projectId);
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number(),
          title: z.string().optional(),
          description: z.string().optional(),
          status: z
            .enum(["todo", "in_progress", "review", "completed", "blocked"])
            .optional(),
          priority: z.enum(["low", "medium", "high", "critical"]).optional(),
          assigneeId: z.number().optional(),
          dueDate: z.date().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTask(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTask(input.id);
        return { success: true };
      }),
  }),

  // ==================== DOCUMENT ROUTES ====================
  document: router({
    upload: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          name: z.string(),
          type: z.enum(["document", "diagram", "prototype", "image", "other"]),
          content: z.string(), // Base64 encoded
          mimeType: z.string(),
          description: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.content, "base64");
        const fileKey = `projects/${input.projectId}/docs/${nanoid()}-${input.name}`;

        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        const docId = await db.createDocument({
          projectId: input.projectId,
          uploadedBy: ctx.user.id,
          name: input.name,
          type: input.type,
          url,
          fileKey,
          mimeType: input.mimeType,
          size: buffer.length,
          description: input.description,
        });

        return { id: docId, url };
      }),

    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getDocumentsByProjectId(input.projectId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getDocumentById(input.id);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteDocument(input.id);
        return { success: true };
      }),
  }),

  // ==================== METRICS ROUTES ====================
  metrics: router({
    getHistory: protectedProcedure
      .input(z.object({ projectId: z.number(), limit: z.number().default(100) }))
      .query(async ({ input }) => {
        return db.getCognitiveMetricsByProjectId(input.projectId, input.limit);
      }),

    getLatest: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getLatestCognitiveMetric(input.projectId);
      }),

    calculate: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .mutation(async ({ input }) => {
        const messagesData = await db.getMessagesByProjectId(input.projectId, 100);
        const decisions = await db.getDecisionsByProjectId(input.projectId);

        const messages = messagesData.map((m) => ({
          content: m.message.content,
          userId: m.message.userId || 0,
          createdAt: m.message.createdAt,
        }));

        const metrics = calculateCognitiveMetrics(
          messages,
          decisions.map((d) => ({
            status: d.status,
            biasesDetected: d.biasesDetected || undefined,
          }))
        );

        await db.createCognitiveMetric({
          projectId: input.projectId,
          ...metrics,
        });

        return metrics;
      }),
  }),

  // ==================== ALERT ROUTES ====================
  alert: router({
    list: protectedProcedure
      .input(z.object({ unreadOnly: z.boolean().default(false) }))
      .query(async ({ ctx, input }) => {
        return db.getAlertsByUserId(ctx.user.id, input.unreadOnly);
      }),

    listByProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getAlertsByProjectId(input.projectId);
      }),

    markAsRead: protectedProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(async ({ input }) => {
        await db.markAlertAsRead(input.alertId);
        return { success: true };
      }),

    dismiss: protectedProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(async ({ input }) => {
        await db.dismissAlert(input.alertId);
        return { success: true };
      }),

    notifyOwner: protectedProcedure
      .input(
        z.object({
          title: z.string(),
          content: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const success = await notifyOwner({
          title: input.title,
          content: input.content,
        });
        return { success };
      }),
  }),

  // ==================== BIAS PATTERNS ROUTES ====================
  biasPattern: router({
    list: publicProcedure.query(async () => {
      const patterns = await db.getAllBiasPatterns();
      if (patterns.length === 0) {
        // Return built-in patterns if none in DB
        return Object.entries(BIAS_PATTERNS).map(([key, value]) => ({
          id: 0,
          name: key,
          category: key,
          description: value.description,
          indicators: value.keywords,
          mitigationStrategies: [value.mitigation],
          detectionPatterns: {
            keywords: value.keywords,
            sentimentThresholds: { min: -1, max: 1 },
            behavioralSignals: value.behavioralSignals,
          },
          severity: "medium" as const,
          createdAt: new Date(),
        }));
      }
      return patterns;
    }),

    getByCategory: publicProcedure
      .input(z.object({ category: z.string() }))
      .query(async ({ input }) => {
        return db.getBiasPatternByCategory(input.category);
      }),
  }),

  // ==================== AUDIO/STT ROUTES ====================
  audio: router({
    upload: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          content: z.string(), // Base64 encoded audio
          mimeType: z.string(),
          duration: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const buffer = Buffer.from(input.content, "base64");
        const fileKey = `projects/${input.projectId}/audio/${nanoid()}.webm`;

        const { url } = await storagePut(fileKey, buffer, input.mimeType);

        const audioId = await db.createAudioRecording({
          projectId: input.projectId,
          userId: ctx.user.id,
          fileUrl: url,
          fileKey,
          duration: input.duration,
        });

        // Create a message in chat for the audio
        const messageId = await db.createMessage({
          projectId: input.projectId,
          userId: ctx.user.id,
          content: `[Audio - ${input.duration ? Math.floor(input.duration / 60) + ':' + (input.duration % 60).toString().padStart(2, '0') : 'N/A'}]`,
          type: "audio",
          metadata: {
            audioId,
            audioUrl: url,
            duration: input.duration,
            transcriptionStatus: "pending",
          },
        });

        // Automatically trigger transcription in background
        // We don't await to return quickly to the user
        (async () => {
          try {
            // Update status to processing
            await db.updateAudioRecording(audioId, { transcriptionStatus: "processing" });
            await db.updateMessage(messageId, {
              metadata: {
                audioId,
                audioUrl: url,
                duration: input.duration,
                transcriptionStatus: "processing",
              },
            });

            const result = await transcribeAudio({
              audioUrl: url,
              language: "fr",
            });

            if ('error' in result) {
              await db.updateAudioRecording(audioId, { transcriptionStatus: "failed" });
              await db.updateMessage(messageId, {
                metadata: {
                  audioId,
                  audioUrl: url,
                  duration: input.duration,
                  transcriptionStatus: "failed",
                },
              });
              return;
            }

            // Analyze the transcription
            const analysis = await analyzeWithLLM(result.text);

            // Update audio recording
            await db.updateAudioRecording(audioId, {
              transcription: result.text,
              transcriptionStatus: "completed",
              analysis: {
                sentiment: analysis.sentiment,
                emotions: analysis.sentiment.emotions.map((e) => ({
                  emotion: e.emotion,
                  confidence: e.intensity,
                })),
                cognitivePatterns: analysis.cognitive.patterns,
                biasIndicators: analysis.biases.map((b) => ({
                  type: b.type,
                  confidence: b.confidence,
                  evidence: b.evidence.join(", "),
                })),
                psychologicalState: {
                  stress: analysis.psychological.stress,
                  confidence: analysis.psychological.confidence,
                  engagement: analysis.psychological.engagement,
                },
                keyTopics: [],
              },
            });

            // Update the chat message with transcription
            await db.updateMessage(messageId, {
              content: result.text,
              metadata: {
                audioId,
                audioUrl: url,
                duration: input.duration,
                transcription: result.text,
                transcriptionStatus: "completed",
                analysisResult: {
                  sentiment: analysis.sentiment,
                  biases: analysis.biases,
                  cognitivePatterns: analysis.cognitive.patterns,
                },
              },
            });

            // Calculate and update cognitive tokens
            const ctValue = calculateCognitiveTokens(result.text);
            await db.incrementProjectCognitiveTokens(input.projectId, ctValue);

            // Check if we need to trigger pings based on CT thresholds
            const project = await db.getProjectById(input.projectId);
            if (project) {
              const totalCT = (project.cognitiveTokens || 0) + ctValue;
              await checkAndTriggerCTPings(input.projectId, totalCT, analysis);
            }

          } catch (error) {
            console.error("Auto-transcription error:", error);
            await db.updateAudioRecording(audioId, { transcriptionStatus: "failed" });
          }
        })();

        return { id: audioId, url, messageId };
      }),

    transcribe: protectedProcedure
      .input(z.object({ audioId: z.number() }))
      .mutation(async ({ input }) => {
        const audio = await db.getAudioRecordingById(input.audioId);
        if (!audio) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Audio not found" });
        }

        await db.updateAudioRecording(input.audioId, {
          transcriptionStatus: "processing",
        });

        try {
          const result = await transcribeAudio({
            audioUrl: audio.fileUrl,
            language: "fr",
          });

          // Check if transcription failed
          if ('error' in result) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: result.error,
            });
          }

          // Analyze the transcription
          const analysis = await analyzeWithLLM(result.text);

          await db.updateAudioRecording(input.audioId, {
            transcription: result.text,
            transcriptionStatus: "completed",
            analysis: {
              sentiment: analysis.sentiment,
              emotions: analysis.sentiment.emotions.map((e) => ({
                emotion: e.emotion,
                confidence: e.intensity,
              })),
              cognitivePatterns: analysis.cognitive.patterns,
              biasIndicators: analysis.biases.map((b) => ({
                type: b.type,
                confidence: b.confidence,
                evidence: b.evidence.join(", "),
              })),
              psychologicalState: {
                stress: analysis.psychological.stress,
                confidence: analysis.psychological.confidence,
                engagement: analysis.psychological.engagement,
              },
              keyTopics: [],
            },
          });

          // Create cognitive event if biases detected
          if (analysis.biases.length > 0) {
            const project = await db.getProjectById(audio.projectId);
            await db.createCognitiveEvent({
              projectId: audio.projectId,
              type: "bias_detected",
              severity: analysis.biases.some((b) => b.severity === "high")
                ? "critical"
                : "warning",
              title: `Biais détecté dans enregistrement vocal`,
              description: `${analysis.biases.length} biais cognitif(s) détecté(s) dans la transcription`,
              data: { biases: analysis.biases, audioId: input.audioId },
            });
          }

          // Trigger smart pings if needed
          if (analysis.triggeredPings.length > 0) {
            for (const ping of analysis.triggeredPings) {
              await db.createMessage({
                projectId: audio.projectId,
                content: ping.message,
                type: "smart_ping",
                metadata: { pingType: ping.type, severity: ping.severity },
              });
            }
          }

          // Update the chat message with transcription
          const audioMessage = await db.getMessageByAudioId(input.audioId);
          if (audioMessage) {
            await db.updateMessage(audioMessage.id, {
              content: result.text,
              metadata: {
                ...(audioMessage.metadata || {}),
                transcription: result.text,
                transcriptionStatus: "completed",
                analysisResult: {
                  sentiment: analysis.sentiment,
                  biases: analysis.biases,
                  cognitivePatterns: analysis.cognitive.patterns,
                },
              },
            });
          }

          return {
            transcription: result.text,
            language: result.language,
            duration: result.duration,
            analysis,
          };
        } catch (error) {
          await db.updateAudioRecording(input.audioId, {
            transcriptionStatus: "failed",
          });
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Transcription failed",
          });
        }
      }),

    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return db.getAudioRecordingsByProjectId(input.projectId);
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getAudioRecordingById(input.id);
      }),
  }),

  // ==================== REAL-TIME ANALYSIS ROUTES ====================
  realtime: router({
    analyzeText: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          text: z.string(),
          messageId: z.number().optional(),
          useLLM: z.boolean().default(false),
        })
      )
      .mutation(async ({ input }) => {
        const analysis = input.useLLM
          ? await analyzeWithLLM(input.text)
          : analyzeQuick(input.text);

        // Store analysis results
        const analysisTypes = ["sentiment", "cognitive", "psychological", "bias"] as const;
        for (const type of analysisTypes) {
          let result;
          switch (type) {
            case "sentiment":
              result = {
                score: analysis.sentiment.score,
                label: analysis.sentiment.label,
                details: { emotions: analysis.sentiment.emotions },
                triggeredPings: [],
              };
              break;
            case "cognitive":
              result = {
                score: analysis.cognitive.reasoningQuality,
                label: analysis.cognitive.thinkingStyle,
                details: {
                  patterns: analysis.cognitive.patterns,
                  biasRisk: analysis.cognitive.biasRisk,
                },
                triggeredPings: [],
              };
              break;
            case "psychological":
              result = {
                score: analysis.psychological.engagement,
                label: analysis.psychological.communicationStyle,
                details: {
                  stress: analysis.psychological.stress,
                  confidence: analysis.psychological.confidence,
                  openness: analysis.psychological.openness,
                },
                triggeredPings: [],
              };
              break;
            case "bias":
              result = {
                score: analysis.biases.length > 0 ? analysis.biases[0].confidence : 0,
                label: analysis.biases.length > 0 ? analysis.biases[0].type : "none",
                details: { biases: analysis.biases },
                triggeredPings: analysis.triggeredPings.map((p) => p.type),
              };
              break;
          }

          await db.createRealtimeAnalysis({
            projectId: input.projectId,
            messageId: input.messageId,
            analysisType: type,
            result,
            processingTime: analysis.processingTime,
          });
        }

        // Create smart pings in chat
        if (analysis.triggeredPings.length > 0) {
          for (const ping of analysis.triggeredPings) {
            await db.createMessage({
              projectId: input.projectId,
              content: ping.message,
              type: "smart_ping",
              metadata: { pingType: ping.type, severity: ping.severity },
            });
          }

          // Create cognitive events for critical pings
          const criticalPings = analysis.triggeredPings.filter(
            (p) => p.severity === "critical"
          );
          if (criticalPings.length > 0) {
            await db.createCognitiveEvent({
              projectId: input.projectId,
              type: "intervention_triggered",
              severity: "critical",
              title: "Intervention cognitive déclenchée",
              description: criticalPings.map((p) => p.message).join(" | "),
              data: { pings: criticalPings },
              sourceMessageId: input.messageId,
            });

            // Notify owner for critical events
            await notifyOwner({
              title: "Alerte cognitive critique",
              content: `${criticalPings.length} intervention(s) critique(s) déclenchée(s) dans le projet.`,
            });
          }
        }

        return analysis;
      }),

    getHistory: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          analysisType: z.enum(["sentiment", "cognitive", "psychological", "bias"]).optional(),
          limit: z.number().default(100),
        })
      )
      .query(async ({ input }) => {
        return db.getRealtimeAnalysisByProjectId(
          input.projectId,
          input.analysisType,
          input.limit
        );
      }),
  }),

  // ==================== AI ANALYSIS ROUTES ====================
  ai: router({
    analyzeText: protectedProcedure
      .input(z.object({ text: z.string(), context: z.string().optional() }))
      .mutation(async ({ input }) => {
        const analysis = await analyzeMessage(input.text);
        return analysis;
      }),

    getStrategicRecommendations: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          question: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const project = await db.getProjectById(input.projectId);
        const decisions = await db.getDecisionsByProjectId(input.projectId);
        const messagesData = await db.getMessagesByProjectId(input.projectId, 30);
        const events = await db.getCognitiveEventsByProjectId(input.projectId, 20);

        const projectContext = `
Projet: ${project?.name}
Description: ${project?.description || "Non spécifiée"}
Statut: ${project?.status}
Objectifs: ${project?.goals?.join(", ") || "Non définis"}

Décisions récentes:
${decisions.slice(0, 5).map((d) => `- ${d.title} (${d.status})`).join("\n")}

Événements cognitifs récents:
${events.slice(0, 5).map((e) => `- ${e.title} (${e.severity})`).join("\n")}

Santé cognitive actuelle:
${JSON.stringify(project?.cognitiveHealth, null, 2)}
`;

        try {
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `Tu es un conseiller stratégique expert en intelligence collective et en prise de décision. Analyse le contexte du projet et fournis des recommandations stratégiques personnalisées pour améliorer la qualité cognitive de l'équipe.`,
              },
              {
                role: "user",
                content: `${projectContext}\n\n${input.question ? `Question spécifique: ${input.question}` : "Fournis des recommandations stratégiques générales pour améliorer la performance cognitive de cette équipe."}`,
              },
            ],
          });

          const recommendations =
            typeof response.choices[0]?.message?.content === "string"
              ? response.choices[0].message.content
              : "Recommandations non disponibles";

          return { recommendations };
        } catch (error) {
          return {
            recommendations:
              "Service d'analyse temporairement indisponible. Veuillez réessayer.",
          };
        }
      }),
  }),

  // ==================== PROFILE 360 ROUTES ====================
  profile360: router({
    // Get Big Five quiz questions
    getQuiz: publicProcedure.query(() => {
      return {
        questions: BIG_FIVE_QUIZ,
        traitDescriptions: TRAIT_DESCRIPTIONS,
      };
    }),

    // Submit quiz answers and calculate profile
    submitQuiz: protectedProcedure
      .input(
        z.object({
          answers: z.array(
            z.object({
              questionId: z.string(),
              score: z.number().min(1).max(5),
            })
          ),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const profile = calculateQuizProfile(input.answers);
        const teamRole = getTeamRole(profile);

        // Update user's Big Five profile in database
        await db.updateUserBigFiveProfile(ctx.user.id, profile);

        return {
          profile,
          teamRole,
          traitDescriptions: TRAIT_DESCRIPTIONS,
        };
      }),

    // Get current user's Big Five profile
    getBigFiveProfile: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user?.bigFiveProfile) {
        return { hasProfile: false, profile: null, teamRole: null };
      }
      const profile = user.bigFiveProfile as BigFiveProfile;
      return {
        hasProfile: true,
        profile,
        teamRole: getTeamRole(profile),
        traitDescriptions: TRAIT_DESCRIPTIONS,
      };
    }),

    // Extract professional profile from CV text
    extractFromCV: protectedProcedure
      .input(z.object({ cvText: z.string().min(50) }))
      .mutation(async ({ ctx, input }) => {
        const result = await extractFromCVText(input.cvText);
        if (result.success && result.profile) {
          await db.updateUserProfessionalProfile(ctx.user.id, result.profile);
        }
        return result;
      }),

    // Get current user's professional profile
    getProfessionalProfile: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      const profile = user?.professionalProfile as ProfessionalProfile | null;
      return {
        hasProfile: !!profile,
        profile,
        completeness: calculateProfileCompleteness(profile),
      };
    }),

    // Update professional profile manually
    updateProfessionalProfile: protectedProcedure
      .input(
        z.object({
          currentRole: z.string().optional(),
          company: z.string().optional(),
          yearsExperience: z.number().optional(),
          industries: z.array(z.string()).optional(),
          skills: z.array(z.string()).optional(),
          languages: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUserById(ctx.user.id);
        const existingProfile = (user?.professionalProfile as ProfessionalProfile) || {
          industries: [],
          skills: [],
          education: [],
          experiences: [],
          certifications: [],
          languages: [],
          source: 'manual' as const,
          lastUpdated: new Date().toISOString(),
        };

        const updatedProfile: ProfessionalProfile = {
          ...existingProfile,
          ...input,
          source: 'manual',
          lastUpdated: new Date().toISOString(),
        };

        await db.updateUserProfessionalProfile(ctx.user.id, updatedProfile);
        return {
          profile: updatedProfile,
          completeness: calculateProfileCompleteness(updatedProfile),
        };
      }),

    // Get full 360 profile summary
    getFullProfile: protectedProcedure.query(async ({ ctx }) => {
      const user = await db.getUserById(ctx.user.id);
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      const bigFiveProfile = user.bigFiveProfile as BigFiveProfile | null;
      const professionalProfile = user.professionalProfile as ProfessionalProfile | null;

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          bio: user.bio,
          expertise: user.expertise,
        },
        bigFive: bigFiveProfile
          ? {
              profile: bigFiveProfile,
              teamRole: getTeamRole(bigFiveProfile),
              traitDescriptions: TRAIT_DESCRIPTIONS,
            }
          : null,
        professional: professionalProfile
          ? {
              profile: professionalProfile,
              completeness: calculateProfileCompleteness(professionalProfile),
            }
          : null,
        profileCompleteness: calculateOverallCompleteness(user, bigFiveProfile, professionalProfile),
      };
    }),
  }),
});

// Helper function to calculate overall profile completeness
function calculateOverallCompleteness(
  user: any,
  bigFive: BigFiveProfile | null,
  professional: ProfessionalProfile | null
): number {
  let score = 0;
  // Basic info (30%)
  if (user.name) score += 10;
  if (user.email) score += 5;
  if (user.avatarUrl) score += 5;
  if (user.bio) score += 10;
  // Big Five (35%)
  if (bigFive) {
    score += 25;
    if (bigFive.confidence >= 80) score += 10;
  }
  // Professional (35%)
  if (professional) {
    score += Math.round(calculateProfileCompleteness(professional) * 0.35);
  }
  return Math.min(100, score);
}

export type AppRouter = typeof appRouter;
