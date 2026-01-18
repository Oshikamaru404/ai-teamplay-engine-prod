import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, json, float, boolean } from "drizzle-orm/mysql-core";

// ==================== USERS ====================
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  avatarUrl: text("avatarUrl"),
  bio: text("bio"),
  expertise: json("expertise").$type<string[]>(),
  cognitiveProfile: json("cognitiveProfile").$type<{
    thinkingStyle: string;
    decisionSpeed: string;
    riskTolerance: string;
    collaborationPreference: string;
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ==================== TEAMS ====================
export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  ownerId: int("ownerId").notNull(),
  avatarUrl: text("avatarUrl"),
  settings: json("settings").$type<{
    biasAlertThreshold: number;
    diversityTarget: number;
    convergenceWarningLevel: number;
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

// ==================== TEAM MEMBERS ====================
export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  userId: int("userId").notNull(),
  role: mysqlEnum("memberRole", ["owner", "admin", "member"]).default("member").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

// ==================== TEAM INVITATIONS ====================
export const teamInvitations = mysqlTable("team_invitations", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  invitedByUserId: int("invitedByUserId").notNull(),
  email: varchar("email", { length: 320 }),
  inviteCode: varchar("inviteCode", { length: 64 }).notNull().unique(),
  role: mysqlEnum("inviteRole", ["admin", "member"]).default("member").notNull(),
  status: mysqlEnum("inviteStatus", ["pending", "accepted", "declined", "expired"]).default("pending").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  acceptedByUserId: int("acceptedByUserId"),
  acceptedAt: timestamp("acceptedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TeamInvitation = typeof teamInvitations.$inferSelect;
export type InsertTeamInvitation = typeof teamInvitations.$inferInsert;

// ==================== PROJECTS ====================
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  teamId: int("teamId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["planning", "active", "review", "completed", "archived"]).default("planning").notNull(),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  goals: json("goals").$type<string[]>(),
  cognitiveHealth: json("cognitiveHealth").$type<{
    diversityIndex: number;
    criticalThinkingScore: number;
    convergenceRate: number;
    biasRiskLevel: number;
    decisionQuality: number;
  }>(),
  cognitiveTokens: int("cognitiveTokens").default(0).notNull(),
  lastPingCT: int("lastPingCT").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// ==================== DECISIONS ====================
export const decisions = mysqlTable("decisions", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  type: mysqlEnum("decisionType", ["strategic", "tactical", "operational", "technical"]).default("tactical").notNull(),
  status: mysqlEnum("decisionStatus", ["proposed", "discussing", "voting", "decided", "implemented", "revised"]).default("proposed").notNull(),
  outcome: text("outcome"),
  rationale: text("rationale"),
  alternatives: json("alternatives").$type<{ option: string; pros: string[]; cons: string[] }[]>(),
  proposedBy: int("proposedBy").notNull(),
  decidedAt: timestamp("decidedAt"),
  impactScore: float("impactScore"),
  confidenceLevel: float("confidenceLevel"),
  biasesDetected: json("biasesDetected").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Decision = typeof decisions.$inferSelect;
export type InsertDecision = typeof decisions.$inferInsert;

// ==================== VOTES ====================
export const votes = mysqlTable("votes", {
  id: int("id").autoincrement().primaryKey(),
  decisionId: int("decisionId").notNull(),
  userId: int("userId").notNull(),
  choice: varchar("choice", { length: 255 }).notNull(),
  reasoning: text("reasoning"),
  confidence: float("confidence"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Vote = typeof votes.$inferSelect;
export type InsertVote = typeof votes.$inferInsert;

// ==================== MESSAGES (Chat) ====================
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId"),
  content: text("content").notNull(),
  type: mysqlEnum("messageType", ["user", "system", "ai_insight", "bias_alert", "smart_ping", "audio", "document"]).default("user").notNull(),
  metadata: json("metadata").$type<{
    sentiment?: number;
    cognitivePatterns?: string[];
    biasIndicators?: { type: string; confidence: number }[];
    referencedDecisions?: number[];
    pingType?: string;
    severity?: string;
    analysisResult?: Record<string, unknown>;
    // Audio-specific metadata
    audioId?: number;
    audioUrl?: string;
    duration?: number;
    transcription?: string;
    transcriptionStatus?: "pending" | "processing" | "completed" | "failed";
    // Document-specific metadata
    documentId?: number;
    documentUrl?: string;
    documentName?: string;
    documentType?: string;
    // CT-specific metadata
    ctTrigger?: number;
    ctValue?: number;
  }>(),
  parentId: int("parentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;

// ==================== COGNITIVE EVENTS ====================
export const cognitiveEvents = mysqlTable("cognitive_events", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  type: mysqlEnum("eventType", [
    "bias_detected",
    "convergence_warning",
    "diversity_alert",
    "decision_quality_change",
    "pattern_recognized",
    "intervention_triggered",
    "milestone_reached"
  ]).notNull(),
  severity: mysqlEnum("severity", ["info", "warning", "critical"]).default("info").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  data: json("data").$type<Record<string, unknown>>(),
  sourceMessageId: int("sourceMessageId"),
  sourceDecisionId: int("sourceDecisionId"),
  acknowledged: boolean("acknowledged").default(false),
  acknowledgedBy: int("acknowledgedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CognitiveEvent = typeof cognitiveEvents.$inferSelect;
export type InsertCognitiveEvent = typeof cognitiveEvents.$inferInsert;

// ==================== BIAS PATTERNS ====================
export const biasPatterns = mysqlTable("bias_patterns", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  category: mysqlEnum("biasCategory", [
    "confirmation",
    "groupthink",
    "sunk_cost",
    "overconfidence",
    "authority",
    "anchoring",
    "halo_effect",
    "availability",
    "bandwagon"
  ]).notNull(),
  description: text("description"),
  indicators: json("indicators").$type<string[]>(),
  mitigationStrategies: json("mitigationStrategies").$type<string[]>(),
  detectionPatterns: json("detectionPatterns").$type<{
    keywords: string[];
    sentimentThresholds: { min: number; max: number };
    behavioralSignals: string[];
  }>(),
  severity: mysqlEnum("patternSeverity", ["low", "medium", "high"]).default("medium").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BiasPattern = typeof biasPatterns.$inferSelect;
export type InsertBiasPattern = typeof biasPatterns.$inferInsert;

// ==================== COGNITIVE MEMORIES (Vector-like storage) ====================
export const cognitiveMemories = mysqlTable("cognitive_memories", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId"),
  teamId: int("teamId"),
  type: mysqlEnum("memoryType", ["decision_outcome", "error_pattern", "success_pattern", "strategy", "lesson_learned"]).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(),
  context: text("context"),
  tags: json("tags").$type<string[]>(),
  embedding: json("embedding").$type<number[]>(),
  outcome: mysqlEnum("outcomeType", ["success", "failure", "neutral", "pending"]).default("pending"),
  impactScore: float("impactScore"),
  usageCount: int("usageCount").default(0),
  isGlobal: boolean("isGlobal").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CognitiveMemory = typeof cognitiveMemories.$inferSelect;
export type InsertCognitiveMemory = typeof cognitiveMemories.$inferInsert;

// ==================== TASKS ====================
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  status: mysqlEnum("taskStatus", ["todo", "in_progress", "review", "completed", "blocked"]).default("todo").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  assigneeId: int("assigneeId"),
  dueDate: timestamp("dueDate"),
  relatedDecisionId: int("relatedDecisionId"),
  cognitiveLoad: float("cognitiveLoad"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// ==================== DOCUMENTS ====================
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  uploadedBy: int("uploadedBy").notNull(),
  name: varchar("name", { length: 500 }).notNull(),
  type: mysqlEnum("docType", ["document", "diagram", "prototype", "image", "other"]).default("document").notNull(),
  url: text("url").notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  size: int("size"),
  version: int("version").default(1).notNull(),
  parentId: int("parentId"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// ==================== COGNITIVE METRICS (Time series) ====================
export const cognitiveMetrics = mysqlTable("cognitive_metrics", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  diversityIndex: float("diversityIndex"),
  criticalThinkingScore: float("criticalThinkingScore"),
  convergenceRate: float("convergenceRate"),
  biasRiskLevel: float("biasRiskLevel"),
  decisionQuality: float("decisionQuality"),
  engagementLevel: float("engagementLevel"),
  explorationVsExecution: float("explorationVsExecution"),
  consensusLevel: float("consensusLevel"),
});

export type CognitiveMetric = typeof cognitiveMetrics.$inferSelect;
export type InsertCognitiveMetric = typeof cognitiveMetrics.$inferInsert;

// ==================== ALERTS ====================
export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId"),
  type: mysqlEnum("alertType", ["bias_critical", "performance_threshold", "cognitive_drift", "deadline_risk", "team_health"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  severity: mysqlEnum("alertSeverity", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  isRead: boolean("isRead").default(false),
  isDismissed: boolean("isDismissed").default(false),
  actionUrl: text("actionUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

// ==================== AUDIO RECORDINGS ====================
export const audioRecordings = mysqlTable("audio_recordings", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  userId: int("userId").notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  duration: int("duration"), // in seconds
  transcription: text("transcription"),
  transcriptionStatus: mysqlEnum("transcriptionStatus", ["pending", "processing", "completed", "failed"]).default("pending").notNull(),
  analysis: json("analysis").$type<{
    sentiment: { score: number; label: string };
    emotions: { emotion: string; confidence: number }[];
    cognitivePatterns: string[];
    biasIndicators: { type: string; confidence: number; evidence: string }[];
    psychologicalState: { stress: number; confidence: number; engagement: number };
    keyTopics: string[];
  }>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AudioRecording = typeof audioRecordings.$inferSelect;
export type InsertAudioRecording = typeof audioRecordings.$inferInsert;

// ==================== REAL-TIME ANALYSIS ====================
export const realtimeAnalysis = mysqlTable("realtime_analysis", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  messageId: int("messageId"),
  audioId: int("audioId"),
  analysisType: mysqlEnum("analysisType", ["sentiment", "cognitive", "psychological", "bias"]).notNull(),
  result: json("result").$type<{
    score: number;
    label: string;
    details: Record<string, unknown>;
    triggeredPings: string[];
  }>().notNull(),
  processingTime: int("processingTime"), // in ms
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RealtimeAnalysis = typeof realtimeAnalysis.$inferSelect;
export type InsertRealtimeAnalysis = typeof realtimeAnalysis.$inferInsert;
