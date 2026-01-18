/**
 * Notifications Temps Réel - Système de notification non-intrusif
 * 
 * Utilise Server-Sent Events (SSE) pour les notifications push
 * Plus simple que WebSocket et suffisant pour les notifications unidirectionnelles
 */

import { Response } from "express";
import type { SmartBiasSummary } from "./smartBiasSystem";

// ============================================================================
// TYPES DE NOTIFICATIONS
// ============================================================================

export type NotificationType = 
  | "bias_alert"        // Alerte de biais cognitif
  | "ping_triggered"    // Smart Ping déclenché
  | "decision_made"     // Décision prise
  | "member_joined"     // Nouveau membre
  | "cognitive_insight" // Insight cognitif
  | "celebration"       // Célébration (bonne pratique)
  | "reminder";         // Rappel doux

export interface Notification {
  id: string;
  type: NotificationType;
  /** Priorité: 1 = critique, 2 = important, 3 = info, 4 = subtil */
  priority: 1 | 2 | 3 | 4;
  /** Titre court */
  title: string;
  /** Message principal */
  message: string;
  /** Action suggérée (optionnel) */
  action?: {
    label: string;
    url?: string;
    handler?: string; // Nom de la fonction à appeler côté client
  };
  /** Données additionnelles */
  data?: Record<string, unknown>;
  /** Timestamp */
  timestamp: Date;
  /** Durée d'affichage en ms (0 = persistant) */
  duration: number;
  /** Style visuel */
  style: "toast" | "banner" | "subtle" | "modal";
}

// ============================================================================
// GESTIONNAIRE DE CONNEXIONS SSE
// ============================================================================

interface SSEClient {
  id: string;
  userId: number;
  projectId?: number;
  response: Response;
  lastActivity: Date;
}

class NotificationManager {
  private clients: Map<string, SSEClient> = new Map();
  private notificationQueue: Map<number, Notification[]> = new Map(); // userId -> notifications

  /**
   * Enregistre un nouveau client SSE
   */
  registerClient(clientId: string, userId: number, projectId: number | undefined, res: Response): void {
    // Configurer les headers SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Pour nginx

    // Envoyer un heartbeat initial
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: new Date() })}\n\n`);

    this.clients.set(clientId, {
      id: clientId,
      userId,
      projectId,
      response: res,
      lastActivity: new Date(),
    });

    // Envoyer les notifications en attente
    const pendingNotifications = this.notificationQueue.get(userId) || [];
    for (const notification of pendingNotifications) {
      this.sendToClient(clientId, notification);
    }
    this.notificationQueue.delete(userId);

    // Nettoyer à la déconnexion
    res.on("close", () => {
      this.clients.delete(clientId);
    });
  }

  /**
   * Envoie une notification à un client spécifique
   */
  private sendToClient(clientId: string, notification: Notification): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;

    try {
      client.response.write(`event: notification\ndata: ${JSON.stringify(notification)}\n\n`);
      client.lastActivity = new Date();
      return true;
    } catch {
      this.clients.delete(clientId);
      return false;
    }
  }

  /**
   * Envoie une notification à un utilisateur (tous ses clients)
   */
  sendToUser(userId: number, notification: Notification): number {
    let sentCount = 0;
    
    for (const [clientId, client] of Array.from(this.clients.entries())) {
      if (client.userId === userId) {
        if (this.sendToClient(clientId, notification)) {
          sentCount++;
        }
      }
    }

    // Si l'utilisateur n'est pas connecté, mettre en file d'attente
    if (sentCount === 0) {
      const queue = this.notificationQueue.get(userId) || [];
      queue.push(notification);
      // Limiter la file d'attente à 10 notifications
      if (queue.length > 10) queue.shift();
      this.notificationQueue.set(userId, queue);
    }

    return sentCount;
  }

  /**
   * Envoie une notification à tous les membres d'un projet
   */
  sendToProject(projectId: number, notification: Notification): number {
    let sentCount = 0;
    
    for (const [clientId, client] of Array.from(this.clients.entries())) {
      if (client.projectId === projectId) {
        if (this.sendToClient(clientId, notification)) {
          sentCount++;
        }
      }
    }

    return sentCount;
  }

  /**
   * Envoie un heartbeat à tous les clients (pour maintenir la connexion)
   */
  sendHeartbeat(): void {
    const now = new Date();
    for (const [clientId, client] of Array.from(this.clients.entries())) {
      try {
        client.response.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: now })}\n\n`);
      } catch {
        this.clients.delete(clientId);
      }
    }
  }

  /**
   * Nombre de clients connectés
   */
  getClientCount(): number {
    return this.clients.size;
  }
}

// Instance singleton
export const notificationManager = new NotificationManager();

// Heartbeat toutes les 30 secondes
setInterval(() => {
  notificationManager.sendHeartbeat();
}, 30000);

// ============================================================================
// FACTORY DE NOTIFICATIONS
// ============================================================================

let notificationIdCounter = 0;

function generateNotificationId(): string {
  return `notif_${Date.now()}_${++notificationIdCounter}`;
}

/**
 * Crée une notification de biais (non-intrusive)
 */
export function createBiasNotification(summary: SmartBiasSummary): Notification | null {
  if (!summary.shouldAlert || !summary.topPriority) {
    return null;
  }

  const { bias, guidance } = summary.topPriority;

  return {
    id: generateNotificationId(),
    type: "bias_alert",
    priority: guidance.priority as 1 | 2 | 3 | 4,
    title: guidance.title,
    message: guidance.message,
    action: guidance.action ? {
      label: "Voir le conseil",
      handler: "showBiasDetail",
    } : undefined,
    data: {
      biasType: bias.type,
      cognitiveHealthScore: summary.cognitiveHealthScore,
    },
    timestamp: new Date(),
    // Durée basée sur la priorité (plus important = plus long)
    duration: guidance.priority <= 2 ? 10000 : 5000,
    // Style basé sur la priorité
    style: guidance.priority === 1 ? "banner" : "toast",
  };
}

/**
 * Crée une notification de Smart Ping
 */
export function createPingNotification(
  pingType: string,
  message: string,
  severity: "info" | "warning" | "critical"
): Notification {
  const priorityMap = { info: 3, warning: 2, critical: 1 } as const;
  const styleMap = { info: "subtle", warning: "toast", critical: "banner" } as const;

  return {
    id: generateNotificationId(),
    type: "ping_triggered",
    priority: priorityMap[severity],
    title: `Smart Ping: ${pingType}`,
    message,
    timestamp: new Date(),
    duration: severity === "critical" ? 15000 : severity === "warning" ? 8000 : 5000,
    style: styleMap[severity],
  };
}

/**
 * Crée une notification de célébration (renforcement positif)
 */
export function createCelebrationNotification(
  achievement: string,
  details?: string
): Notification {
  return {
    id: generateNotificationId(),
    type: "celebration",
    priority: 4,
    title: "🎉 Bravo !",
    message: achievement,
    data: details ? { details } : undefined,
    timestamp: new Date(),
    duration: 4000,
    style: "subtle",
  };
}

/**
 * Crée une notification d'insight cognitif
 */
export function createInsightNotification(
  insight: string,
  actionLabel?: string
): Notification {
  return {
    id: generateNotificationId(),
    type: "cognitive_insight",
    priority: 3,
    title: "💡 Insight",
    message: insight,
    action: actionLabel ? {
      label: actionLabel,
      handler: "showInsightDetail",
    } : undefined,
    timestamp: new Date(),
    duration: 6000,
    style: "toast",
  };
}

// ============================================================================
// PRÉFÉRENCES UTILISATEUR
// ============================================================================

export interface NotificationPreferences {
  /** Activer les notifications */
  enabled: boolean;
  /** Types de notifications à recevoir */
  allowedTypes: NotificationType[];
  /** Priorité minimale (1-4, 1 = tout, 4 = critique seulement) */
  minPriority: 1 | 2 | 3 | 4;
  /** Mode silencieux (pas de son) */
  silent: boolean;
  /** Heures de non-dérangement (format "HH:MM-HH:MM") */
  quietHours?: string;
}

export const DEFAULT_PREFERENCES: NotificationPreferences = {
  enabled: true,
  allowedTypes: ["bias_alert", "ping_triggered", "decision_made", "celebration", "cognitive_insight"],
  minPriority: 3,
  silent: false,
};

/**
 * Filtre une notification selon les préférences utilisateur
 */
export function shouldSendNotification(
  notification: Notification,
  preferences: NotificationPreferences
): boolean {
  if (!preferences.enabled) return false;
  if (!preferences.allowedTypes.includes(notification.type)) return false;
  if (notification.priority > preferences.minPriority) return false;

  // Vérifier les heures de non-dérangement
  if (preferences.quietHours) {
    const [start, end] = preferences.quietHours.split("-");
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    
    if (start && end && currentTime >= start && currentTime <= end) {
      // En heures de non-dérangement, n'autoriser que les notifications critiques
      if (notification.priority > 1) return false;
    }
  }

  return true;
}
