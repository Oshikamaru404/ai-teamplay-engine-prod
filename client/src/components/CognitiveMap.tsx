/**
 * CognitiveMap - Interactive Cognitive Graph Component
 * Visualizes relationships between team members, ideas, decisions, and biases
 * Uses React Flow for interactive graph rendering
 */

import React, { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  MarkerType,
  BackgroundVariant,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Users,
  Lightbulb,
  AlertTriangle,
  Target,
  MessageSquare,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
} from "lucide-react";

// ==================== TYPES ====================

export interface CognitiveNode {
  id: string;
  type: "member" | "idea" | "decision" | "bias" | "ping" | "topic";
  label: string;
  data: {
    description?: string;
    score?: number;
    severity?: "low" | "medium" | "high";
    status?: string;
    timestamp?: Date;
    metadata?: Record<string, unknown>;
  };
}

export interface CognitiveEdge {
  source: string;
  target: string;
  type: "influence" | "agreement" | "contradiction" | "creates" | "triggers" | "relates";
  weight: number; // 0 to 1
  label?: string;
}

export interface CognitiveMapData {
  nodes: CognitiveNode[];
  edges: CognitiveEdge[];
}

interface CognitiveMapProps {
  data: CognitiveMapData;
  onNodeClick?: (node: CognitiveNode) => void;
  onEdgeClick?: (edge: CognitiveEdge) => void;
  className?: string;
}

// ==================== NODE STYLES ====================

const nodeColors: Record<CognitiveNode["type"], { bg: string; border: string; text: string }> = {
  member: { bg: "#3B82F6", border: "#2563EB", text: "#FFFFFF" },
  idea: { bg: "#10B981", border: "#059669", text: "#FFFFFF" },
  decision: { bg: "#8B5CF6", border: "#7C3AED", text: "#FFFFFF" },
  bias: { bg: "#EF4444", border: "#DC2626", text: "#FFFFFF" },
  ping: { bg: "#F59E0B", border: "#D97706", text: "#FFFFFF" },
  topic: { bg: "#6366F1", border: "#4F46E5", text: "#FFFFFF" },
};

const nodeIcons: Record<CognitiveNode["type"], typeof Brain> = {
  member: Users,
  idea: Lightbulb,
  decision: Target,
  bias: AlertTriangle,
  ping: MessageSquare,
  topic: Brain,
};

const edgeColors: Record<CognitiveEdge["type"], string> = {
  influence: "#3B82F6",
  agreement: "#10B981",
  contradiction: "#EF4444",
  creates: "#8B5CF6",
  triggers: "#F59E0B",
  relates: "#6B7280",
};

// ==================== CUSTOM NODE COMPONENT ====================

function CustomNode({ data }: { data: { label: string; nodeType: CognitiveNode["type"]; description?: string; score?: number; severity?: string } }) {
  const colors = nodeColors[data.nodeType];
  const Icon = nodeIcons[data.nodeType];
  
  return (
    <div
      className="px-4 py-3 rounded-lg shadow-lg border-2 min-w-[120px] max-w-[200px] transition-all hover:shadow-xl hover:scale-105"
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.text,
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-4 w-4" />
        <span className="font-semibold text-sm truncate">{data.label}</span>
      </div>
      {data.description && (
        <p className="text-xs opacity-90 line-clamp-2">{data.description}</p>
      )}
      {data.score !== undefined && (
        <div className="mt-2 flex items-center gap-1">
          <div className="h-1.5 flex-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${data.score * 100}%` }}
            />
          </div>
          <span className="text-xs font-medium">{Math.round(data.score * 100)}%</span>
        </div>
      )}
      {data.severity && (
        <Badge
          variant="outline"
          className={`mt-2 text-xs ${
            data.severity === "high"
              ? "border-red-300 text-red-100"
              : data.severity === "medium"
              ? "border-yellow-300 text-yellow-100"
              : "border-green-300 text-green-100"
          }`}
        >
          {data.severity}
        </Badge>
      )}
    </div>
  );
}

const nodeTypes = {
  cognitive: CustomNode,
};

// ==================== MAIN COMPONENT ====================

export default function CognitiveMap({
  data,
  onNodeClick,
  onEdgeClick,
  className = "",
}: CognitiveMapProps) {
  const [filter, setFilter] = useState<CognitiveNode["type"] | "all">("all");
  
  // Convert cognitive nodes to React Flow nodes
  const initialNodes: Node[] = useMemo(() => {
    const filteredNodes = filter === "all" 
      ? data.nodes 
      : data.nodes.filter(n => n.type === filter);
    
    // Calculate positions using force-directed layout simulation
    const positions = calculateNodePositions(filteredNodes, data.edges);
    
    return filteredNodes.map((node, index) => ({
      id: node.id,
      type: "cognitive",
      position: positions[index] || { x: 100 + (index % 5) * 200, y: 100 + Math.floor(index / 5) * 150 },
      data: {
        label: node.label,
        nodeType: node.type,
        description: node.data.description,
        score: node.data.score,
        severity: node.data.severity,
      },
    }));
  }, [data.nodes, filter]);
  
  // Convert cognitive edges to React Flow edges
  const initialEdges: Edge[] = useMemo(() => {
    const nodeIds = new Set(initialNodes.map(n => n.id));
    
    return data.edges
      .filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target))
      .map((edge, index) => ({
        id: `e-${index}`,
        source: edge.source,
        target: edge.target,
        type: "smoothstep",
        animated: edge.type === "triggers" || edge.type === "influence",
        style: {
          stroke: edgeColors[edge.type],
          strokeWidth: Math.max(1, edge.weight * 3),
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: edgeColors[edge.type],
        },
        label: edge.label,
        labelStyle: { fill: edgeColors[edge.type], fontWeight: 500 },
        data: { ...edge } as Record<string, unknown>,
      }));
  }, [data.edges, initialNodes]);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  
  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );
  
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const cognitiveNode = data.nodes.find(n => n.id === node.id);
      if (cognitiveNode && onNodeClick) {
        onNodeClick(cognitiveNode);
      }
    },
    [data.nodes, onNodeClick]
  );
  
  const handleEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      if (edge.data && onEdgeClick) {
        onEdgeClick(edge.data as unknown as CognitiveEdge);
      }
    },
    [onEdgeClick]
  );
  
  // Node type counts for legend
  const nodeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const node of data.nodes) {
      counts[node.type] = (counts[node.type] || 0) + 1;
    }
    return counts;
  }, [data.nodes]);
  
  return (
    <Card className={`${className} overflow-hidden`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Carte Cognitive
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              Tous
            </Button>
            {Object.keys(nodeCounts).map((type) => (
              <Button
                key={type}
                variant={filter === type ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(type as CognitiveNode["type"])}
                className="gap-1"
              >
                {React.createElement(nodeIcons[type as CognitiveNode["type"]], { className: "h-3 w-3" })}
                {nodeCounts[type]}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[500px] w-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                const nodeType = (node.data as { nodeType?: CognitiveNode["type"] })?.nodeType;
                return nodeType ? nodeColors[nodeType].bg : "#6B7280";
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
            />
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
            
            {/* Legend Panel */}
            <Panel position="bottom-right" className="bg-background/95 backdrop-blur p-3 rounded-lg border shadow-lg">
              <div className="text-xs font-medium mb-2">Légende des relations</div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(edgeColors).map(([type, color]) => (
                  <div key={type} className="flex items-center gap-2">
                    <div
                      className="w-4 h-0.5 rounded"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs capitalize">{type}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== LAYOUT CALCULATION ====================

function calculateNodePositions(
  nodes: CognitiveNode[],
  edges: CognitiveEdge[]
): Array<{ x: number; y: number }> {
  // Simple force-directed layout simulation
  const positions: Array<{ x: number; y: number }> = [];
  const width = 800;
  const height = 500;
  const padding = 100;
  
  // Group nodes by type
  const nodesByType: Record<string, CognitiveNode[]> = {};
  for (const node of nodes) {
    if (!nodesByType[node.type]) {
      nodesByType[node.type] = [];
    }
    nodesByType[node.type].push(node);
  }
  
  // Position nodes in clusters by type
  const types = Object.keys(nodesByType);
  const angleStep = (2 * Math.PI) / Math.max(1, types.length);
  const centerX = width / 2;
  const centerY = height / 2;
  const clusterRadius = Math.min(width, height) / 3;
  
  let nodeIndex = 0;
  types.forEach((type, typeIndex) => {
    const typeNodes = nodesByType[type];
    const clusterAngle = angleStep * typeIndex;
    const clusterCenterX = centerX + Math.cos(clusterAngle) * clusterRadius;
    const clusterCenterY = centerY + Math.sin(clusterAngle) * clusterRadius;
    
    // Arrange nodes within cluster
    const nodeRadius = Math.min(100, 300 / Math.max(1, typeNodes.length));
    typeNodes.forEach((_, i) => {
      const nodeAngle = (2 * Math.PI * i) / Math.max(1, typeNodes.length);
      positions[nodeIndex] = {
        x: clusterCenterX + Math.cos(nodeAngle) * nodeRadius,
        y: clusterCenterY + Math.sin(nodeAngle) * nodeRadius,
      };
      nodeIndex++;
    });
  });
  
  return positions;
}

// ==================== DATA GENERATION HELPERS ====================

export function generateCognitiveMapFromProject(
  members: Array<{ id: number; name: string }>,
  messages: Array<{ id: number; userId: number; content: string; metadata?: { biasIndicators?: Array<{ type: string; confidence: number }> } }>,
  decisions: Array<{ id: number; title: string; status: string }>,
  biases: Array<{ type: string; confidence: number; messageId: number }>
): CognitiveMapData {
  const nodes: CognitiveNode[] = [];
  const edges: CognitiveEdge[] = [];
  
  // Add member nodes
  for (const member of members) {
    nodes.push({
      id: `member-${member.id}`,
      type: "member",
      label: member.name,
      data: {},
    });
  }
  
  // Add decision nodes
  for (const decision of decisions) {
    nodes.push({
      id: `decision-${decision.id}`,
      type: "decision",
      label: decision.title,
      data: { status: decision.status },
    });
  }
  
  // Add bias nodes and edges
  const biasMap = new Map<string, { count: number; totalConfidence: number; messageIds: number[] }>();
  for (const bias of biases) {
    const existing = biasMap.get(bias.type);
    if (existing) {
      existing.count++;
      existing.totalConfidence += bias.confidence;
      existing.messageIds.push(bias.messageId);
    } else {
      biasMap.set(bias.type, { count: 1, totalConfidence: bias.confidence, messageIds: [bias.messageId] });
    }
  }
  
  biasMap.forEach((data, biasType) => {
    const avgConfidence = data.totalConfidence / data.count;
    nodes.push({
      id: `bias-${biasType}`,
      type: "bias",
      label: biasType.replace(/_/g, " "),
      data: {
        score: avgConfidence,
        severity: avgConfidence > 0.7 ? "high" : avgConfidence > 0.4 ? "medium" : "low",
        description: `Détecté ${data.count} fois`,
      },
    });
  });
  
  // Create edges based on message authorship and bias detection
  const userMessageCounts = new Map<number, number>();
  for (const msg of messages) {
    userMessageCounts.set(msg.userId, (userMessageCounts.get(msg.userId) || 0) + 1);
    
    // Link members to biases they triggered
    if (msg.metadata?.biasIndicators) {
      for (const bias of msg.metadata.biasIndicators) {
        if (bias.confidence > 0.5) {
          edges.push({
            source: `member-${msg.userId}`,
            target: `bias-${bias.type}`,
            type: "triggers",
            weight: bias.confidence,
          });
        }
      }
    }
  }
  
  // Link members to decisions (simplified - in real app would track who proposed/voted)
  for (const member of members) {
    for (const decision of decisions) {
      if (Math.random() > 0.5) { // Simplified random connection
        edges.push({
          source: `member-${member.id}`,
          target: `decision-${decision.id}`,
          type: "influence",
          weight: 0.5 + Math.random() * 0.5,
        });
      }
    }
  }
  
  return { nodes, edges };
}

// ==================== DEMO DATA ====================

export const DEMO_COGNITIVE_MAP: CognitiveMapData = {
  nodes: [
    { id: "member-1", type: "member", label: "Alice", data: { description: "Product Manager" } },
    { id: "member-2", type: "member", label: "Bob", data: { description: "Tech Lead" } },
    { id: "member-3", type: "member", label: "Charlie", data: { description: "Designer" } },
    { id: "idea-1", type: "idea", label: "Refonte UX", data: { score: 0.8, description: "Améliorer l'expérience utilisateur" } },
    { id: "idea-2", type: "idea", label: "API v2", data: { score: 0.6, description: "Nouvelle version de l'API" } },
    { id: "decision-1", type: "decision", label: "Sprint Planning", data: { status: "decided" } },
    { id: "bias-1", type: "bias", label: "Confirmation", data: { score: 0.7, severity: "medium" } },
    { id: "bias-2", type: "bias", label: "Groupthink", data: { score: 0.5, severity: "low" } },
    { id: "ping-1", type: "ping", label: "Vision Ping", data: { description: "Diversité d'idées faible" } },
  ],
  edges: [
    { source: "member-1", target: "idea-1", type: "creates", weight: 0.9 },
    { source: "member-2", target: "idea-2", type: "creates", weight: 0.8 },
    { source: "member-3", target: "idea-1", type: "agreement", weight: 0.7 },
    { source: "idea-1", target: "decision-1", type: "influence", weight: 0.8 },
    { source: "member-1", target: "bias-1", type: "triggers", weight: 0.6 },
    { source: "bias-1", target: "ping-1", type: "triggers", weight: 0.7 },
    { source: "member-2", target: "member-3", type: "contradiction", weight: 0.4, label: "Désaccord UX" },
  ],
};
