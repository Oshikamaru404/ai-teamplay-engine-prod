import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Brain,
  MessageSquare,
  Send,
  AlertTriangle,
  Target,
  Clock,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Users,
  TrendingUp,
  ArrowLeft,
  Plus,
  FileText,
  Vote,
  Activity,
  Sparkles,
  RefreshCw,
  Upload,
  File,
  Image,
  Mic,
  MicOff,
  Square,
  Play,
  Trash2,
  Download,
  Loader2,
  Paperclip,
  X,
  Eye,
  EyeOff,
  Zap,
  Shield,
  Scale,
  Battery,
  BookOpen,
  Waves,
  AlertCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Streamdown } from "streamdown";

// Audio Message Component to avoid TypeScript issues with unknown types
function AudioMessageContent({ message }: { message: any }) {
  const metadata = message.metadata || {};
  const duration = metadata.duration as number | undefined;
  const audioUrl = metadata.audioUrl as string | undefined;
  const transcription = metadata.transcription as string | undefined;
  const transcriptionStatus = metadata.transcriptionStatus as string | undefined;
  const analysisResult = metadata.analysisResult as any;
  const biases = analysisResult?.biases as any[] | undefined;

  return (
    <div className="space-y-2">
      {/* Audio Player */}
      <div className="flex items-center gap-3 p-2 bg-primary/5 rounded-lg">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Mic className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Message vocal</p>
          <p className="text-xs text-muted-foreground">
            {duration ? `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}` : 'N/A'}
          </p>
        </div>
        {audioUrl && (
          <audio controls className="h-8 max-w-[200px]" src={audioUrl} />
        )}
      </div>
      {/* Transcription */}
      {transcriptionStatus === "completed" && transcription ? (
        <div className="p-3 bg-muted/50 rounded-lg border-l-2 border-primary">
          <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
            <FileText className="h-3 w-3" />
            Transcription
          </p>
          <p className="text-sm">{transcription}</p>
        </div>
      ) : transcriptionStatus === "processing" ? (
        <div className="p-2 bg-muted/30 rounded-lg flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Transcription en cours...
        </div>
      ) : transcriptionStatus === "failed" ? (
        <div className="p-2 bg-destructive/10 rounded-lg text-sm text-destructive">
          Échec de la transcription
        </div>
      ) : null}
      {/* Analysis indicators */}
      {biases && biases.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {biases.map((b: any, i: number) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-full text-xs bg-cognitive-warning/20 text-cognitive-warning"
            >
              {b.type} ({Math.round(b.confidence * 100)}%)
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Smart Ping type configuration
const PING_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string; title: string }> = {
  vision: { icon: <Eye className="h-5 w-5" />, color: "text-purple-600", bgColor: "bg-purple-100", title: "Vision Ping" },
  risk: { icon: <AlertTriangle className="h-5 w-5" />, color: "text-red-600", bgColor: "bg-red-100", title: "Risk Ping" },
  bias: { icon: <Brain className="h-5 w-5" />, color: "text-amber-600", bgColor: "bg-amber-100", title: "Bias Ping" },
  balance: { icon: <Scale className="h-5 w-5" />, color: "text-blue-600", bgColor: "bg-blue-100", title: "Balance Ping" },
  load: { icon: <Battery className="h-5 w-5" />, color: "text-pink-600", bgColor: "bg-pink-100", title: "Load Ping" },
  memory: { icon: <BookOpen className="h-5 w-5" />, color: "text-emerald-600", bgColor: "bg-emerald-100", title: "Memory Ping" },
  antifragility: { icon: <Shield className="h-5 w-5" />, color: "text-indigo-600", bgColor: "bg-indigo-100", title: "Antifragility Ping" },
  spectral: { icon: <Waves className="h-5 w-5" />, color: "text-teal-600", bgColor: "bg-teal-100", title: "Spectral Ping" },
};

export default function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id || "0");
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [messageInput, setMessageInput] = useState("");
  const [isDecisionDialogOpen, setIsDecisionDialogOpen] = useState(false);
  const [newDecisionTitle, setNewDecisionTitle] = useState("");
  const [newDecisionDescription, setNewDecisionDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState<string | null>(null);
  const [showPingsPanel, setShowPingsPanel] = useState(true);
  const [activePings, setActivePings] = useState<any[]>([]);
  
  // Audio recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // File attachment states
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utils = trpc.useUtils();

  const { data: project, isLoading: projectLoading } = trpc.project.get.useQuery(
    { id: projectId },
    { enabled: !!projectId && !!user }
  );

  const { data: messagesData, isLoading: messagesLoading } = trpc.chat.getMessages.useQuery(
    { projectId, limit: 100 },
    { enabled: !!projectId && !!user, refetchInterval: 5000 }
  );

  const { data: decisions } = trpc.decision.list.useQuery(
    { projectId },
    { enabled: !!projectId && !!user }
  );

  const { data: cognitiveEvents } = trpc.cognitiveEvent.list.useQuery(
    { projectId, limit: 20 },
    { enabled: !!projectId && !!user }
  );

  const { data: metricsHistory } = trpc.metrics.getHistory.useQuery(
    { projectId, limit: 50 },
    { enabled: !!projectId && !!user }
  );

  const sendMessageMutation = trpc.chat.send.useMutation({
    onSuccess: (data) => {
      utils.chat.getMessages.invalidate();
      setMessageInput("");
      setAttachedFiles([]);
      setAudioBlob(null);
      setRecordingTime(0);
      
      // Check for high-confidence bias indicators
      const biasIndicators = data.analysis?.biasIndicators || [];
      const highConfidenceBiases = biasIndicators.filter((b: any) => b.confidence > 0.5);
      if (highConfidenceBiases.length > 0) {
        const pings = highConfidenceBiases.map((b: any) => ({
          type: 'bias',
          message: `Biais de ${b.type} détecté avec ${Math.round(b.confidence * 100)}% de confiance`,
          severity: b.confidence > 0.7 ? 'critical' : 'warning',
          suggestions: [b.recommendation || 'Analysez les arguments de manière critique'],
        }));
        setActivePings(prev => [...pings, ...prev].slice(0, 10));
        toast.warning(`${highConfidenceBiases.length} biais cognitif(s) détecté(s)`, {
          duration: 5000,
        });
      }
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const analyzeConversationMutation = trpc.chat.analyzeConversation.useMutation({
    onSuccess: (data) => {
      utils.metrics.getHistory.invalidate();
      utils.project.get.invalidate();
      toast.success("Analyse cognitive terminée");
      setIsAnalyzing(false);
      
      // Create pings from detected biases
      const biases = data.biases || [];
      if (biases.length > 0) {
        const pings = biases.map((b: any) => ({
          type: 'bias',
          message: `Biais de ${b.type} détecté: ${b.evidence?.join(', ') || 'Pattern identifié'}`,
          severity: b.severity === 'high' ? 'critical' : 'warning',
          suggestions: [b.recommendation || 'Examinez les arguments de manière critique'],
        }));
        setActivePings(prev => [...pings, ...prev].slice(0, 10));
      }
      
      // Check cognitive health for additional pings
      const health = data.cognitiveHealth;
      if (health) {
        const newPings: any[] = [];
        if (health.diversityIndex < 0.3) {
          newPings.push({
            type: 'vision',
            message: 'Vision Ping : L\'espace de solutions exploré se rétrécit. Diversité d\'idées faible.',
            severity: 'warning',
            suggestions: ['Explorez des perspectives alternatives', 'Invitez des voix différentes'],
            stats: { label: 'Diversité', value: `${Math.round(health.diversityIndex * 100)}%` },
          });
        }
        if (health.convergenceRate > 0.8) {
          newPings.push({
            type: 'risk',
            message: 'Risk Ping : Consensus rapide détecté avec faible débat critique.',
            severity: 'warning',
            suggestions: ['Testez les hypothèses clés', 'Cherchez les contre-arguments'],
            stats: { label: 'Convergence', value: `${Math.round(health.convergenceRate * 100)}%` },
          });
        }
        if (health.biasRiskLevel > 0.6) {
          newPings.push({
            type: 'bias',
            message: 'Bias Ping : Risque élevé de distorsion cognitive détecté.',
            severity: 'critical',
            suggestions: ['Réalignez la rationalité collective', 'Examinez les biais potentiels'],
            stats: { label: 'Risque biais', value: `${Math.round(health.biasRiskLevel * 100)}%` },
          });
        }
        if (newPings.length > 0) {
          setActivePings(prev => [...newPings, ...prev].slice(0, 10));
        }
      }
    },
    onError: () => {
      toast.error("Erreur lors de l'analyse");
      setIsAnalyzing(false);
    },
  });

  const createDecisionMutation = trpc.decision.create.useMutation({
    onSuccess: () => {
      utils.decision.list.invalidate();
      setIsDecisionDialogOpen(false);
      setNewDecisionTitle("");
      setNewDecisionDescription("");
      toast.success("Décision créée");
    },
  });

  const getRecommendationsMutation = trpc.ai.getStrategicRecommendations.useMutation({
    onSuccess: (data) => {
      setAiRecommendations(data.recommendations);
    },
  });

  const uploadAudioMutation = trpc.audio.upload.useMutation({
    onSuccess: (data) => {
      utils.audio.list.invalidate();
      toast.success("Audio envoyé, transcription en cours...");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const uploadDocumentMutation = trpc.document.upload.useMutation({
    onSuccess: () => {
      utils.document.list.invalidate();
      toast.success("Document uploadé");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const extractDecisionsMutation = trpc.chat.extractDecisions.useMutation({
    onSuccess: (data) => {
      utils.decision.list.invalidate();
      if (data.decisions.length > 0) {
        toast.success(data.message);
      } else {
        toast.info("Aucune décision identifiée dans la conversation");
      }
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesData]);

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      toast.error("Impossible d'accéder au microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading || projectLoading) {
    return <ProjectSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <Brain className="h-16 w-16 text-primary" />
          <Button onClick={() => (window.location.href = getLoginUrl())} size="lg" className="w-full">
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Projet non trouvé</h1>
          <Button onClick={() => setLocation("/teams")}>Retour aux équipes</Button>
        </div>
      </div>
    );
  }

  const handleSendMessage = async () => {
    if (!messageInput.trim() && !audioBlob && attachedFiles.length === 0) return;
    
    // Handle audio upload first if exists
    if (audioBlob) {
      const base64 = await blobToBase64(audioBlob);
      await uploadAudioMutation.mutateAsync({
        projectId,
        content: base64,
        mimeType: "audio/webm",
        duration: recordingTime,
      });
    }
    
    // Handle file uploads
    for (const file of attachedFiles) {
      const base64 = await fileToBase64(file);
      const type = getDocumentType(file.type);
      await uploadDocumentMutation.mutateAsync({
        projectId,
        name: file.name,
        type,
        content: base64,
        mimeType: file.type,
      });
    }
    
    // Send text message
    if (messageInput.trim()) {
      sendMessageMutation.mutate({
        projectId,
        content: messageInput,
      });
    }
    
    // Clear all inputs after sending
    setMessageInput("");
    setAttachedFiles([]);
    setAudioBlob(null);
    setRecordingTime(0);
    
    // Refresh messages to show new content
    setTimeout(() => {
      utils.chat.getMessages.invalidate();
    }, 500);
  };

  const handleAnalyze = () => {
    setIsAnalyzing(true);
    analyzeConversationMutation.mutate({ projectId });
  };

  const handleGetRecommendations = () => {
    getRecommendationsMutation.mutate({ projectId });
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;
    const newFiles = Array.from(files).filter(f => f.size <= 10 * 1024 * 1024);
    setAttachedFiles(prev => [...prev, ...newFiles]);
  };

  const removeAttachedFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const dismissPing = (index: number) => {
    setActivePings(prev => prev.filter((_, i) => i !== index));
  };

  const cognitiveHealth = project.cognitiveHealth || {
    diversityIndex: 0.5,
    criticalThinkingScore: 0.5,
    convergenceRate: 0.3,
    biasRiskLevel: 0.2,
    decisionQuality: 0.5,
  };

  const chartData = metricsHistory?.slice().reverse().map((m, i) => ({
    time: `T${i + 1}`,
    diversity: Math.round((m.diversityIndex || 0) * 100),
    critical: Math.round((m.criticalThinkingScore || 0) * 100),
    bias: Math.round((m.biasRiskLevel || 0) * 100),
  })) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/teams")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{project.name}</h1>
              <p className="text-sm text-muted-foreground">
                {project.description || "Projet d'intelligence collective"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={showPingsPanel ? "default" : "outline"}
              size="sm"
              onClick={() => setShowPingsPanel(!showPingsPanel)}
              className="relative"
            >
              <Zap className="h-4 w-4 mr-2" />
              Smart Pings
              {activePings.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                  {activePings.length}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
            >
              {isAnalyzing ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Brain className="mr-2 h-4 w-4" />
              )}
              Analyser
            </Button>
            <Dialog open={isDecisionDialogOpen} onOpenChange={setIsDecisionDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle Décision
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Proposer une décision</DialogTitle>
                  <DialogDescription>
                    Créez une nouvelle décision pour votre équipe
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre</Label>
                    <Input
                      id="title"
                      value={newDecisionTitle}
                      onChange={(e) => setNewDecisionTitle(e.target.value)}
                      placeholder="Ex: Choix de la stack technique"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newDecisionDescription}
                      onChange={(e) => setNewDecisionDescription(e.target.value)}
                      placeholder="Décrivez le contexte et les options..."
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={() =>
                      createDecisionMutation.mutate({
                        projectId,
                        title: newDecisionTitle,
                        description: newDecisionDescription,
                      })
                    }
                    disabled={!newDecisionTitle.trim()}
                  >
                    Créer
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Smart Pings Panel - Floating */}
      {showPingsPanel && activePings.length > 0 && (
        <div className="fixed top-20 right-4 z-40 w-96 max-h-[60vh] overflow-y-auto space-y-3">
          {activePings.map((ping, index) => {
            const config = PING_CONFIG[ping.type] || PING_CONFIG.bias;
            return (
              <div
                key={index}
                className={`smart-ping-card ${config.bgColor} border-l-4 animate-slide-in`}
                style={{ borderLeftColor: config.color.replace('text-', '').replace('-600', '') }}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${config.bgColor} ${config.color}`}>
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-semibold ${config.color}`}>{config.title}</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => dismissPing(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{ping.message}</p>
                    {ping.suggestions && ping.suggestions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-medium text-gray-500">Suggestions :</p>
                        <ul className="text-xs text-gray-600 space-y-0.5">
                          {ping.suggestions.slice(0, 3).map((s: string, i: number) => (
                            <li key={i} className="flex items-start gap-1">
                              <span className="text-primary">•</span>
                              <span>{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {ping.stats && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="text-gray-500">{ping.stats.label}:</span>
                        <span className={`font-semibold ${config.color}`}>{ping.stats.value}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Content */}
      <div className="container py-6">
        <Tabs defaultValue="chat" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="decisions" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Décisions
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Métriques
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Fichiers
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              IA
            </TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-0">
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Chat Area */}
              <Card className="lg:col-span-2 flex flex-col h-[calc(100vh-220px)]">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Conversation d'équipe
                  </CardTitle>
                  <CardDescription>
                    Analyse cognitive en temps réel de vos échanges
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-0">
                  {/* Messages Area */}
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messagesLoading ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-3">
                              <Skeleton className="h-8 w-8 rounded-full" />
                              <Skeleton className="h-16 flex-1 rounded-lg" />
                            </div>
                          ))}
                        </div>
                      ) : messagesData && messagesData.length > 0 ? (
                        messagesData.map((item) => (
                          <div
                            key={item.message.id}
                            className={`flex gap-3 ${
                              item.message.type === "user" || item.message.type === "audio" ? "" : "flex-row-reverse"
                            }`}
                          >
                            {(item.message.type === "user" || item.message.type === "audio") && (
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                  {item.user?.name?.charAt(0) || "U"}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div
                              className={`chat-message max-w-[80%] ${
                                item.message.type === "user"
                                  ? "chat-message-user"
                                  : item.message.type === "audio"
                                  ? "chat-message-audio"
                                  : item.message.type === "smart_ping" ||
                                    item.message.type === "bias_alert"
                                  ? "chat-message-alert"
                                  : "chat-message-ai"
                              }`}
                            >
                              {item.message.type === "audio" ? (
                                <AudioMessageContent message={item.message} />
                              ) : (
                                /* Regular Messages */
                                <>
                                  {item.message.type !== "user" && (
                                    <div className="flex items-center gap-2 mb-1">
                                      {item.message.type === "smart_ping" ? (
                                        <AlertTriangle className="h-4 w-4 text-cognitive-warning" />
                                      ) : item.message.type === "ai_insight" ? (
                                        <Lightbulb className="h-4 w-4 text-primary" />
                                      ) : (
                                        <Brain className="h-4 w-4 text-primary" />
                                      )}
                                      <span className="text-xs font-medium">
                                        {item.message.type === "smart_ping"
                                          ? "Smart Ping"
                                          : "AI Assistant"}
                                      </span>
                                    </div>
                                  )}
                                  <p className="text-sm whitespace-pre-wrap">{item.message.content}</p>
                                  {item.message.metadata?.biasIndicators &&
                                    item.message.metadata.biasIndicators.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {item.message.metadata.biasIndicators.map((b: any, i: number) => (
                                          <span
                                            key={i}
                                            className="px-2 py-0.5 rounded-full text-xs bg-cognitive-warning/20 text-cognitive-warning"
                                          >
                                            {b.type} ({Math.round(b.confidence * 100)}%)
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                </>
                              )}
                              <span className="text-[10px] text-muted-foreground mt-1 block">
                                {new Date(item.message.createdAt).toLocaleTimeString("fr-FR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Aucun message. Commencez la conversation !</p>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Attached Files Preview */}
                  {(attachedFiles.length > 0 || audioBlob) && (
                    <div className="px-4 py-2 border-t bg-muted/30">
                      <div className="flex flex-wrap gap-2">
                        {attachedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-full border text-sm"
                          >
                            {file.type.startsWith("image/") ? (
                              <Image className="h-4 w-4 text-primary" />
                            ) : (
                              <File className="h-4 w-4 text-primary" />
                            )}
                            <span className="max-w-[120px] truncate">{file.name}</span>
                            <button
                              onClick={() => removeAttachedFile(index)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                        {audioBlob && (
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-full border text-sm">
                            <Mic className="h-4 w-4 text-primary" />
                            <span>Audio {formatTime(recordingTime)}</span>
                            <button
                              onClick={() => {
                                setAudioBlob(null);
                                setRecordingTime(0);
                              }}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Chat Input Bar - WhatsApp/ClickUp Style */}
                  <div className="p-4 border-t bg-background">
                    <div className="flex items-end gap-2">
                      {/* Attachment Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip className="h-5 w-5" />
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files)}
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.svg,.md"
                      />

                      {/* Audio Button */}
                      {isRecording ? (
                        <Button
                          variant="destructive"
                          size="icon"
                          className="shrink-0 animate-pulse"
                          onClick={stopRecording}
                        >
                          <Square className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={startRecording}
                        >
                          <Mic className="h-5 w-5" />
                        </Button>
                      )}

                      {/* Recording Indicator */}
                      {isRecording && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-200">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-sm font-mono text-red-600">
                            {formatTime(recordingTime)}
                          </span>
                        </div>
                      )}

                      {/* Text Input */}
                      <div className="flex-1 relative">
                        <Textarea
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          placeholder="Tapez votre message..."
                          className="min-h-[44px] max-h-[120px] resize-none pr-12"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                      </div>

                      {/* Send Button */}
                      <Button
                        onClick={handleSendMessage}
                        disabled={
                          sendMessageMutation.isPending ||
                          (!messageInput.trim() && !audioBlob && attachedFiles.length === 0)
                        }
                        className="shrink-0"
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cognitive Health Sidebar */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Santé Cognitive</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Diversité</span>
                        <span className="font-medium">
                          {Math.round(cognitiveHealth.diversityIndex * 100)}%
                        </span>
                      </div>
                      <Progress value={cognitiveHealth.diversityIndex * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Pensée Critique</span>
                        <span className="font-medium">
                          {Math.round(cognitiveHealth.criticalThinkingScore * 100)}%
                        </span>
                      </div>
                      <Progress value={cognitiveHealth.criticalThinkingScore * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Risque de Biais</span>
                        <span className="font-medium text-cognitive-warning">
                          {Math.round(cognitiveHealth.biasRiskLevel * 100)}%
                        </span>
                      </div>
                      <Progress
                        value={cognitiveHealth.biasRiskLevel * 100}
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Qualité Décision</span>
                        <span className="font-medium text-cognitive-success">
                          {Math.round(cognitiveHealth.decisionQuality * 100)}%
                        </span>
                      </div>
                      <Progress value={cognitiveHealth.decisionQuality * 100} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-cognitive-warning" />
                      Événements Récents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {cognitiveEvents && cognitiveEvents.length > 0 ? (
                      <div className="space-y-3">
                        {cognitiveEvents.slice(0, 5).map((event) => (
                          <div
                            key={event.id}
                            className={`p-2 rounded-lg text-sm ${
                              event.severity === "critical"
                                ? "bg-cognitive-danger/10 border-l-2 border-cognitive-danger"
                                : event.severity === "warning"
                                ? "bg-cognitive-warning/10 border-l-2 border-cognitive-warning"
                                : "bg-muted"
                            }`}
                          >
                            <p className="font-medium">{event.type}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {event.description?.substring(0, 80)}...
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aucun événement récent
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Decisions Tab */}
          <TabsContent value="decisions" className="space-y-6">
            {/* Header with Extract Button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Décisions du Projet</h2>
                <p className="text-sm text-muted-foreground">
                  {decisions?.length || 0} décision(s) enregistrée(s)
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => extractDecisionsMutation.mutate({ projectId })}
                  disabled={extractDecisionsMutation.isPending}
                >
                  {extractDecisionsMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Extraire des discussions
                </Button>
                <Button onClick={() => setIsDecisionDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvelle Décision
                </Button>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {decisions && decisions.length > 0 ? (
                decisions.map((decision) => (
                  <Card key={decision.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">{decision.title}</CardTitle>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            decision.status === "decided" || decision.status === "implemented"
                              ? "bg-cognitive-success/20 text-cognitive-success"
                              : decision.status === "revised"
                              ? "bg-cognitive-danger/20 text-cognitive-danger"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {decision.status === "decided"
                            ? "Décidée"
                            : decision.status === "implemented"
                            ? "Implémentée"
                            : decision.status === "revised"
                            ? "Révisée"
                            : decision.status === "voting"
                            ? "En vote"
                            : decision.status === "discussing"
                            ? "En discussion"
                            : "Proposée"}
                        </span>
                      </div>
                      <CardDescription>{decision.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {new Date(decision.createdAt).toLocaleDateString("fr-FR")}
                        </div>
                        {decision.confidenceLevel && (
                          <div className="flex items-center gap-1">
                            <Brain className="h-4 w-4" />
                            {Math.round(decision.confidenceLevel * 100)}%
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune décision enregistrée</p>
                  <Button className="mt-4" onClick={() => setIsDecisionDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Créer une décision
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Évolution des Métriques Cognitives
                </CardTitle>
                <CardDescription>
                  Suivi en temps réel de la santé cognitive de l'équipe
                </CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorDiv" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="oklch(0.65 0.18 150)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="oklch(0.65 0.18 150)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="colorCrit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="oklch(0.65 0.18 230)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="oklch(0.65 0.18 230)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="time" className="text-xs" />
                        <YAxis domain={[0, 100]} className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="diversity"
                          stroke="oklch(0.65 0.18 150)"
                          fill="url(#colorDiv)"
                          name="Diversité"
                        />
                        <Area
                          type="monotone"
                          dataKey="critical"
                          stroke="oklch(0.65 0.18 230)"
                          fill="url(#colorCrit)"
                          name="Pensée Critique"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Pas encore de données. Lancez une analyse pour commencer.</p>
                      <Button className="mt-4" onClick={handleAnalyze}>
                        <Brain className="mr-2 h-4 w-4" />
                        Analyser maintenant
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <DocumentsSection projectId={projectId} />
              <AudioSection projectId={projectId} />
            </div>
          </TabsContent>

          {/* AI Insights Tab */}
          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Recommandations Stratégiques IA
                </CardTitle>
                <CardDescription>
                  Obtenez des insights personnalisés basés sur l'analyse de votre projet
                </CardDescription>
              </CardHeader>
              <CardContent>
                {aiRecommendations ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <Streamdown>{aiRecommendations}</Streamdown>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Cliquez pour obtenir des recommandations stratégiques personnalisées
                    </p>
                    <Button
                      onClick={handleGetRecommendations}
                      disabled={getRecommendationsMutation.isPending}
                    >
                      {getRecommendationsMutation.isPending ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      Obtenir des recommandations
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function ProjectSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container h-16 flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
      <div className="container py-6 space-y-6">
        <Skeleton className="h-10 w-96" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[500px] lg:col-span-2" />
          <div className="space-y-4">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    </div>
  );
}


// ==================== DOCUMENTS SECTION ====================
function DocumentsSection({ projectId }: { projectId: number }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const { data: documents, isLoading } = trpc.document.list.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  const uploadMutation = trpc.document.upload.useMutation({
    onSuccess: () => {
      utils.document.list.invalidate();
      toast.success("Document uploadé avec succès");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const deleteMutation = trpc.document.delete.useMutation({
    onSuccess: () => {
      utils.document.list.invalidate();
      toast.success("Document supprimé");
    },
  });

  const handleFileSelect = async (files: FileList | null) => {
    if (!files) return;

    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} dépasse la limite de 10MB`);
        continue;
      }

      setUploadingFiles((prev) => [...prev, file.name]);

      try {
        const base64 = await fileToBase64(file);
        const type = getDocumentType(file.type);

        await uploadMutation.mutateAsync({
          projectId,
          name: file.name,
          type,
          content: base64,
          mimeType: file.type,
        });
      } catch (error) {
        console.error("Upload error:", error);
      } finally {
        setUploadingFiles((prev) => prev.filter((n) => n !== file.name));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Documents
        </CardTitle>
        <CardDescription>
          {documents?.length || 0} document(s) partagé(s)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Zone */}
        <div
          className={`upload-zone ${isDragging ? "upload-zone-active" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">
            {isDragging ? "Déposez ici" : "Glissez-déposez ou cliquez"}
          </p>
          <p className="text-xs text-muted-foreground">PDF, Word, Images (max 10MB)</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.svg,.md"
          />
        </div>

        {uploadingFiles.length > 0 && (
          <div className="space-y-2">
            {uploadingFiles.map((name) => (
              <div key={name} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm truncate">{name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Documents List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : documents && documents.length > 0 ? (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {documents.map((item) => (
              <div
                key={item.document.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    {item.document.type === "image" ? (
                      <Image className="h-4 w-4 text-primary" />
                    ) : (
                      <File className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{item.document.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.document.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => window.open(item.document.url, "_blank")}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => deleteMutation.mutate({ id: item.document.id })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Aucun document</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== AUDIO SECTION ====================
function AudioSection({ projectId }: { projectId: number }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const utils = trpc.useUtils();

  const { data: audioRecordings, isLoading } = trpc.audio.list.useQuery(
    { projectId },
    { enabled: !!projectId }
  );

  const uploadMutation = trpc.audio.upload.useMutation({
    onSuccess: (data) => {
      utils.audio.list.invalidate();
      toast.success("Audio uploadé, transcription en cours...");
      transcribeMutation.mutate({ audioId: data.id });
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
      setIsUploading(false);
    },
  });

  const transcribeMutation = trpc.audio.transcribe.useMutation({
    onSuccess: (data) => {
      utils.audio.list.invalidate();
      toast.success("Transcription terminée");
      
      if (data.analysis?.triggeredPings?.length > 0) {
        toast.warning(`${data.analysis.triggeredPings.length} alerte(s) cognitive(s) détectée(s)`);
      }
    },
    onError: () => {
      toast.error("Erreur de transcription");
    },
  });

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      toast.error("Impossible d'accéder au microphone");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const uploadRecording = async () => {
    if (!audioBlob) return;

    setIsUploading(true);
    try {
      const base64 = await blobToBase64(audioBlob);
      await uploadMutation.mutateAsync({
        projectId,
        content: base64,
        mimeType: "audio/webm",
        duration: recordingTime,
      });
      setAudioBlob(null);
      setRecordingTime(0);
    } finally {
      setIsUploading(false);
    }
  };

  const discardRecording = () => {
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5 text-primary" />
          Enregistrements Audio
        </CardTitle>
        <CardDescription>
          {audioRecordings?.length || 0} enregistrement(s)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Audio Recorder */}
        <div className="audio-recorder p-4 bg-muted/50 rounded-lg">
          {isRecording ? (
            <div className="flex items-center gap-4">
              <div className="recording-indicator" />
              <span className="text-lg font-mono">{formatTime(recordingTime)}</span>
              <span className="text-sm text-muted-foreground flex-1">Enregistrement...</span>
              <Button variant="destructive" size="sm" onClick={stopRecording}>
                <Square className="h-4 w-4 mr-2" />
                Arrêter
              </Button>
            </div>
          ) : audioBlob ? (
            <div className="flex items-center gap-4">
              <Play className="h-5 w-5 text-primary" />
              <span className="text-lg font-mono">{formatTime(recordingTime)}</span>
              <span className="text-sm text-muted-foreground flex-1">Prêt à envoyer</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={discardRecording}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={uploadRecording} disabled={isUploading}>
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Envoyer
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <MicOff className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground flex-1">Cliquez pour enregistrer</span>
              <Button size="sm" onClick={startRecording}>
                <Mic className="h-4 w-4 mr-2" />
                Enregistrer
              </Button>
            </div>
          )}
        </div>

        {/* Audio Recordings List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : audioRecordings && audioRecordings.length > 0 ? (
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {audioRecordings.map((item) => (
              <div
                key={item.audio.id}
                className="p-3 bg-muted/50 rounded-lg space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Mic className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {new Date(item.audio.createdAt).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.audio.duration ? formatTime(item.audio.duration) : "N/A"}
                      </p>
                    </div>
                  </div>
                  {item.audio.transcriptionStatus === "processing" && (
                    <span className="analysis-indicator analysis-info">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Transcription...
                    </span>
                  )}
                  {item.audio.transcriptionStatus === "completed" && (
                    <span className="analysis-indicator analysis-positive">
                      <CheckCircle2 className="h-3 w-3" />
                      Analysé
                    </span>
                  )}
                </div>

                {item.audio.transcription && (
                  <div className="p-2 bg-background rounded text-sm">
                    <p className="text-muted-foreground line-clamp-2">
                      {item.audio.transcription}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <Mic className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Aucun enregistrement</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== UTILITY FUNCTIONS ====================
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
  });
}

function getDocumentType(mimeType: string): "document" | "diagram" | "prototype" | "image" | "other" {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.includes("pdf") || mimeType.includes("word") || mimeType.includes("document")) return "document";
  if (mimeType.includes("svg") || mimeType.includes("draw")) return "diagram";
  return "other";
}
