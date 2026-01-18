import { eq, and, desc, sql, like, or, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  InsertTeam, teams,
  InsertTeamMember, teamMembers,
  InsertTeamInvitation, teamInvitations,
  InsertProject, projects,
  InsertDecision, decisions,
  InsertVote, votes,
  InsertMessage, messages,
  InsertCognitiveEvent, cognitiveEvents,
  InsertBiasPattern, biasPatterns,
  InsertCognitiveMemory, cognitiveMemories,
  InsertTask, tasks,
  InsertDocument, documents,
  InsertCognitiveMetric, cognitiveMetrics,
  InsertAlert, alerts,
  InsertAudioRecording, audioRecordings,
  InsertRealtimeAnalysis, realtimeAnalysis,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ==================== USER QUERIES ====================
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod", "avatarUrl", "bio"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.expertise !== undefined) {
      values.expertise = user.expertise;
      updateSet.expertise = user.expertise;
    }
    if (user.cognitiveProfile !== undefined) {
      values.cognitiveProfile = user.cognitiveProfile;
      updateSet.cognitiveProfile = user.cognitiveProfile;
    }
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserProfile(userId: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function updateUserBigFiveProfile(userId: number, bigFiveProfile: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ bigFiveProfile }).where(eq(users.id, userId));
}

export async function updateUserProfessionalProfile(userId: number, professionalProfile: any) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ professionalProfile }).where(eq(users.id, userId));
}

// ==================== TEAM QUERIES ====================
export async function createTeam(team: InsertTeam) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(teams).values(team);
  return result[0].insertId;
}

export async function getTeamById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getTeamsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const memberTeams = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.userId, userId));
  if (memberTeams.length === 0) return [];
  const teamIds = memberTeams.map(m => m.teamId);
  return db.select().from(teams).where(sql`${teams.id} IN (${sql.join(teamIds, sql`, `)})`);
}

export async function updateTeam(id: number, data: Partial<InsertTeam>) {
  const db = await getDb();
  if (!db) return;
  await db.update(teams).set(data).where(eq(teams.id, id));
}

export async function deleteTeam(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(teams).where(eq(teams.id, id));
}

// ==================== TEAM MEMBER QUERIES ====================
export async function addTeamMember(member: InsertTeamMember) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(teamMembers).values(member);
}

export async function getTeamMembers(teamId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      member: teamMembers,
      user: users,
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(teamMembers.teamId, teamId));
}

export async function removeTeamMember(teamId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(teamMembers).where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
}

export async function updateTeamMemberRole(teamId: number, userId: number, role: "owner" | "admin" | "member") {
  const db = await getDb();
  if (!db) return;
  await db.update(teamMembers).set({ role }).where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)));
}

// ==================== PROJECT QUERIES ====================
export async function createProject(project: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projects).values(project);
  return result[0].insertId;
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProjectsByTeamId(teamId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).where(eq(projects.teamId, teamId)).orderBy(desc(projects.createdAt));
}

export async function updateProject(id: number, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) return;
  await db.update(projects).set(data).where(eq(projects.id, id));
}

export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(projects).where(eq(projects.id, id));
}

// ==================== DECISION QUERIES ====================
export async function createDecision(decision: InsertDecision) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(decisions).values(decision);
  return result[0].insertId;
}

export async function getDecisionById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(decisions).where(eq(decisions.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getDecisionsByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(decisions).where(eq(decisions.projectId, projectId)).orderBy(desc(decisions.createdAt));
}

export async function updateDecision(id: number, data: Partial<InsertDecision>) {
  const db = await getDb();
  if (!db) return;
  await db.update(decisions).set(data).where(eq(decisions.id, id));
}

// ==================== VOTE QUERIES ====================
export async function createVote(vote: InsertVote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(votes).values(vote);
}

export async function getVotesByDecisionId(decisionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ vote: votes, user: users })
    .from(votes)
    .innerJoin(users, eq(votes.userId, users.id))
    .where(eq(votes.decisionId, decisionId));
}

// ==================== MESSAGE QUERIES ====================
export async function createMessage(message: InsertMessage) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(messages).values(message);
  return result[0].insertId;
}

export async function getMessagesByProjectId(projectId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  // Get messages ordered by creation time (oldest first for chat display)
  const result = await db
    .select({ message: messages, user: users })
    .from(messages)
    .leftJoin(users, eq(messages.userId, users.id))
    .where(eq(messages.projectId, projectId))
    .orderBy(desc(messages.createdAt))
    .limit(limit);
  // Reverse to show oldest first (natural chat order)
  return result.reverse();
}

export async function getRecentMessages(projectId: number, since: Date) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(messages)
    .where(and(eq(messages.projectId, projectId), gte(messages.createdAt, since)))
    .orderBy(messages.createdAt);
}

export async function updateMessage(messageId: number, data: Partial<InsertMessage>) {
  const db = await getDb();
  if (!db) return;
  await db.update(messages).set(data).where(eq(messages.id, messageId));
}

export async function getMessageByAudioId(audioId: number) {
  const db = await getDb();
  if (!db) return null;
  // Find message with this audioId in metadata
  const result = await db
    .select()
    .from(messages)
    .where(eq(messages.type, "audio"));
  // Filter by audioId in metadata
  return result.find(m => (m.metadata as any)?.audioId === audioId) || null;
}

// ==================== COGNITIVE EVENT QUERIES ====================
export async function createCognitiveEvent(event: InsertCognitiveEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(cognitiveEvents).values(event);
  return result[0].insertId;
}

export async function getCognitiveEventsByProjectId(projectId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(cognitiveEvents)
    .where(eq(cognitiveEvents.projectId, projectId))
    .orderBy(desc(cognitiveEvents.createdAt))
    .limit(limit);
}

export async function acknowledgeEvent(eventId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(cognitiveEvents).set({ acknowledged: true, acknowledgedBy: userId }).where(eq(cognitiveEvents.id, eventId));
}

// ==================== BIAS PATTERN QUERIES ====================
export async function getAllBiasPatterns() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(biasPatterns);
}

export async function getBiasPatternByCategory(category: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(biasPatterns).where(eq(biasPatterns.category, category as any));
}

export async function createBiasPattern(pattern: InsertBiasPattern) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(biasPatterns).values(pattern);
}

// ==================== COGNITIVE MEMORY QUERIES ====================
export async function createCognitiveMemory(memory: InsertCognitiveMemory) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(cognitiveMemories).values(memory);
  return result[0].insertId;
}

export async function searchCognitiveMemories(query: string, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(cognitiveMemories)
    .where(or(
      like(cognitiveMemories.title, `%${query}%`),
      like(cognitiveMemories.content, `%${query}%`),
      like(cognitiveMemories.context, `%${query}%`)
    ))
    .orderBy(desc(cognitiveMemories.usageCount))
    .limit(limit);
}

export async function getGlobalMemories(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(cognitiveMemories)
    .where(eq(cognitiveMemories.isGlobal, true))
    .orderBy(desc(cognitiveMemories.impactScore))
    .limit(limit);
}

export async function incrementMemoryUsage(memoryId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(cognitiveMemories)
    .set({ usageCount: sql`${cognitiveMemories.usageCount} + 1` })
    .where(eq(cognitiveMemories.id, memoryId));
}

// ==================== TASK QUERIES ====================
export async function createTask(task: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(tasks).values(task);
  return result[0].insertId;
}

export async function getTasksByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ task: tasks, assignee: users })
    .from(tasks)
    .leftJoin(users, eq(tasks.assigneeId, users.id))
    .where(eq(tasks.projectId, projectId))
    .orderBy(tasks.priority, tasks.createdAt);
}

export async function updateTask(id: number, data: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) return;
  await db.update(tasks).set(data).where(eq(tasks.id, id));
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(tasks).where(eq(tasks.id, id));
}

// ==================== DOCUMENT QUERIES ====================
export async function createDocument(doc: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(documents).values(doc);
  return result[0].insertId;
}

export async function getDocumentsByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ document: documents, uploader: users })
    .from(documents)
    .innerJoin(users, eq(documents.uploadedBy, users.id))
    .where(eq(documents.projectId, projectId))
    .orderBy(desc(documents.createdAt));
}

export async function getDocumentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function deleteDocument(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(documents).where(eq(documents.id, id));
}

// ==================== COGNITIVE METRICS QUERIES ====================
export async function createCognitiveMetric(metric: InsertCognitiveMetric) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(cognitiveMetrics).values(metric);
}

export async function getCognitiveMetricsByProjectId(projectId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(cognitiveMetrics)
    .where(eq(cognitiveMetrics.projectId, projectId))
    .orderBy(desc(cognitiveMetrics.timestamp))
    .limit(limit);
}

export async function getLatestCognitiveMetric(projectId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(cognitiveMetrics)
    .where(eq(cognitiveMetrics.projectId, projectId))
    .orderBy(desc(cognitiveMetrics.timestamp))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ==================== ALERT QUERIES ====================
export async function createAlert(alert: InsertAlert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(alerts).values(alert);
  return result[0].insertId;
}

export async function getAlertsByUserId(userId: number, unreadOnly = false) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(alerts.userId, userId)];
  if (unreadOnly) {
    conditions.push(eq(alerts.isRead, false));
  }
  return db
    .select()
    .from(alerts)
    .where(and(...conditions))
    .orderBy(desc(alerts.createdAt));
}

export async function getAlertsByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(alerts)
    .where(eq(alerts.projectId, projectId))
    .orderBy(desc(alerts.createdAt));
}

export async function markAlertAsRead(alertId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(alerts).set({ isRead: true }).where(eq(alerts.id, alertId));
}

export async function dismissAlert(alertId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(alerts).set({ isDismissed: true }).where(eq(alerts.id, alertId));
}

// ==================== AUDIO RECORDING QUERIES ====================
export async function createAudioRecording(audio: InsertAudioRecording) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(audioRecordings).values(audio);
  return result[0].insertId;
}

export async function getAudioRecordingById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(audioRecordings).where(eq(audioRecordings.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAudioRecordingsByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ audio: audioRecordings, user: users })
    .from(audioRecordings)
    .innerJoin(users, eq(audioRecordings.userId, users.id))
    .where(eq(audioRecordings.projectId, projectId))
    .orderBy(desc(audioRecordings.createdAt));
}

export async function updateAudioRecording(id: number, data: Partial<InsertAudioRecording>) {
  const db = await getDb();
  if (!db) return;
  await db.update(audioRecordings).set(data).where(eq(audioRecordings.id, id));
}

// ==================== REALTIME ANALYSIS QUERIES ====================
export async function createRealtimeAnalysis(analysis: InsertRealtimeAnalysis) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(realtimeAnalysis).values(analysis);
  return result[0].insertId;
}

export async function getRealtimeAnalysisByProjectId(
  projectId: number,
  analysisType?: "sentiment" | "cognitive" | "psychological" | "bias",
  limit = 100
) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(realtimeAnalysis.projectId, projectId)];
  if (analysisType) {
    conditions.push(eq(realtimeAnalysis.analysisType, analysisType));
  }
  return db
    .select()
    .from(realtimeAnalysis)
    .where(and(...conditions))
    .orderBy(desc(realtimeAnalysis.createdAt))
    .limit(limit);
}

export async function getRealtimeAnalysisByMessageId(messageId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(realtimeAnalysis)
    .where(eq(realtimeAnalysis.messageId, messageId));
}

// ==================== COGNITIVE TOKENS QUERIES ====================
export async function incrementProjectCognitiveTokens(projectId: number, ctValue: number) {
  const db = await getDb();
  if (!db) return;
  const project = await getProjectById(projectId);
  if (!project) return;
  const newTotal = (project.cognitiveTokens || 0) + ctValue;
  await db.update(projects).set({ cognitiveTokens: newTotal }).where(eq(projects.id, projectId));
  return newTotal;
}

export async function updateProjectLastPingCT(projectId: number, ctValue: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(projects).set({ lastPingCT: ctValue }).where(eq(projects.id, projectId));
}

export async function getProjectCognitiveTokens(projectId: number) {
  const project = await getProjectById(projectId);
  return project?.cognitiveTokens || 0;
}

// ==================== TEAM INVITATION QUERIES ====================
export async function createTeamInvitation(invitation: InsertTeamInvitation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(teamInvitations).values(invitation);
  return result[0].insertId;
}

export async function getTeamInvitationByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(teamInvitations)
    .where(eq(teamInvitations.inviteCode, code))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getTeamInvitationsByTeamId(teamId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ invitation: teamInvitations, invitedBy: users })
    .from(teamInvitations)
    .leftJoin(users, eq(teamInvitations.invitedByUserId, users.id))
    .where(eq(teamInvitations.teamId, teamId))
    .orderBy(desc(teamInvitations.createdAt));
}

export async function getTeamInvitationsByEmail(email: string) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({ invitation: teamInvitations, team: teams })
    .from(teamInvitations)
    .innerJoin(teams, eq(teamInvitations.teamId, teams.id))
    .where(and(
      eq(teamInvitations.email, email),
      eq(teamInvitations.status, "pending")
    ))
    .orderBy(desc(teamInvitations.createdAt));
}

export async function updateTeamInvitation(id: number, data: Partial<InsertTeamInvitation>) {
  const db = await getDb();
  if (!db) return;
  await db.update(teamInvitations).set(data).where(eq(teamInvitations.id, id));
}

export async function acceptTeamInvitation(inviteCode: string, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const invitation = await getTeamInvitationByCode(inviteCode);
  if (!invitation) throw new Error("Invitation not found");
  if (invitation.status !== "pending") throw new Error("Invitation already used");
  if (new Date() > invitation.expiresAt) throw new Error("Invitation expired");
  
  // Update invitation status
  await db.update(teamInvitations).set({
    status: "accepted",
    acceptedByUserId: userId,
    acceptedAt: new Date(),
  }).where(eq(teamInvitations.id, invitation.id));
  
  // Add user to team
  await db.insert(teamMembers).values({
    teamId: invitation.teamId,
    userId: userId,
    role: invitation.role,
  });
  
  return invitation.teamId;
}

export async function declineTeamInvitation(inviteCode: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const invitation = await getTeamInvitationByCode(inviteCode);
  if (!invitation) throw new Error("Invitation not found");
  
  await db.update(teamInvitations).set({
    status: "declined",
  }).where(eq(teamInvitations.id, invitation.id));
}

export async function deleteTeamInvitation(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(teamInvitations).where(eq(teamInvitations.id, id));
}
