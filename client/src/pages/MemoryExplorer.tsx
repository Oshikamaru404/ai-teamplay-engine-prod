import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Brain,
  Users,
  Search,
  LogOut,
  Activity,
  Database,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  User,
  UserCircle,
  Sparkles,
  RefreshCw,
  BookOpen,
} from "lucide-react";
import { CSSProperties, useState } from "react";
import { useLocation } from "wouter";
import { Streamdown } from "streamdown";

const menuItems = [
  { icon: Activity, label: "Dashboard", path: "/dashboard" },
  { icon: Users, label: "Équipes", path: "/teams" },
  { icon: Search, label: "Memory Explorer", path: "/memory" },
  { icon: User, label: "Profil", path: "/profile" },
  { icon: UserCircle, label: "Profil 360°", path: "/profile360" },
];

export default function MemoryExplorer() {
  const { user, loading, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [sidebarWidth] = useState(280);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchContext, setSearchContext] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  const { data: globalMemories, isLoading: globalLoading } = trpc.memory.getGlobal.useQuery(
    { limit: 50 },
    { enabled: !!user }
  );

  const searchMutation = trpc.memory.searchWithAI.useMutation();

  if (loading) {
    return <MemorySkeleton />;
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

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    searchMutation.mutate({
      query: searchQuery,
      context: searchContext || undefined,
    });
  };

  const getOutcomeIcon = (outcome: string | null) => {
    switch (outcome) {
      case "success":
        return <CheckCircle2 className="h-5 w-5 text-cognitive-success" />;
      case "failure":
        return <XCircle className="h-5 w-5 text-cognitive-danger" />;
      case "neutral":
        return <Clock className="h-5 w-5 text-muted-foreground" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "decision_outcome":
        return "Résultat de décision";
      case "error_pattern":
        return "Pattern d'erreur";
      case "success_pattern":
        return "Pattern de succès";
      case "strategy":
        return "Stratégie";
      case "lesson_learned":
        return "Leçon apprise";
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "decision_outcome":
        return "bg-chart-1/20 text-chart-1";
      case "error_pattern":
        return "bg-cognitive-danger/20 text-cognitive-danger";
      case "success_pattern":
        return "bg-cognitive-success/20 text-cognitive-success";
      case "strategy":
        return "bg-chart-3/20 text-chart-3";
      case "lesson_learned":
        return "bg-chart-4/20 text-chart-4";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredMemories = globalMemories?.filter((m) =>
    filterType === "all" ? true : m.type === filterType
  );

  return (
    <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}>
      <Sidebar collapsible="icon" className="border-r-0">
        <SidebarHeader className="h-16 justify-center">
          <div className="flex items-center gap-3 px-2">
            <Brain className="h-8 w-8 text-primary shrink-0" />
            <span className="font-bold text-lg group-data-[collapsible=icon]:hidden">TeamPlay</span>
          </div>
        </SidebarHeader>

        <SidebarContent className="gap-0">
          <SidebarMenu className="px-2 py-1">
            {menuItems.map((item) => {
              const isActive = location === item.path;
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={isActive}
                    onClick={() => setLocation(item.path)}
                    tooltip={item.label}
                    className="h-10"
                  >
                    <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center">
                <Avatar className="h-9 w-9 border shrink-0">
                  <AvatarFallback className="text-xs font-medium bg-primary text-primary-foreground">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                  <p className="text-sm font-medium truncate">{user?.name || "Utilisateur"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email || ""}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={logout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-16 items-center justify-between border-b px-6 bg-background/95 backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="h-9 w-9 rounded-lg" />
            <div>
              <h1 className="text-xl font-semibold">Memory Explorer</h1>
              <p className="text-sm text-muted-foreground">
                Recherchez dans l'intelligence collective mondiale
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 space-y-6">
          {/* Search Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-primary" />
                Recherche Sémantique
              </CardTitle>
              <CardDescription>
                Trouvez des expériences passées, erreurs évitées et stratégies gagnantes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ex: échecs dus à un mauvais choix de stack technique"
                  className="flex-1"
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={searchMutation.isPending}>
                  {searchMutation.isPending ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="mr-2 h-4 w-4" />
                  )}
                  Rechercher
                </Button>
              </div>
              <Input
                value={searchContext}
                onChange={(e) => setSearchContext(e.target.value)}
                placeholder="Contexte additionnel (optionnel): type de projet, secteur, contraintes..."
              />
            </CardContent>
          </Card>

          {/* Search Results */}
          {searchMutation.data && (
            <div className="space-y-6">
              {/* AI Insights */}
              {searchMutation.data.aiInsights && (
                <Card className="border-primary/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Insights IA
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <Streamdown>{searchMutation.data.aiInsights}</Streamdown>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Memory Results */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-primary" />
                    Mémoires Trouvées ({searchMutation.data.memories.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {searchMutation.data.memories.length > 0 ? (
                    <div className="space-y-4">
                      {searchMutation.data.memories.map((memory) => (
                        <div
                          key={memory.id}
                          className="p-4 rounded-lg border hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                                  memory.type
                                )}`}
                              >
                                {getTypeLabel(memory.type)}
                              </span>
                              {getOutcomeIcon(memory.outcome)}
                            </div>
                            {memory.impactScore && (
                              <span className="text-sm text-muted-foreground">
                                Impact: {Math.round(memory.impactScore * 100)}%
                              </span>
                            )}
                          </div>
                          <h4 className="font-semibold mb-2">{memory.title}</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            {memory.content.substring(0, 200)}
                            {memory.content.length > 200 && "..."}
                          </p>
                          {memory.tags && memory.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {memory.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Aucune mémoire trouvée pour cette recherche</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Global Memories */}
          {!searchMutation.data && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Mémoire Collective Globale
                </h2>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrer par type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="decision_outcome">Résultats de décision</SelectItem>
                    <SelectItem value="error_pattern">Patterns d'erreur</SelectItem>
                    <SelectItem value="success_pattern">Patterns de succès</SelectItem>
                    <SelectItem value="strategy">Stratégies</SelectItem>
                    <SelectItem value="lesson_learned">Leçons apprises</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {globalLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-48" />
                  ))}
                </div>
              ) : filteredMemories && filteredMemories.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {filteredMemories.map((memory) => (
                    <Card key={memory.id} className="hover:shadow-lg transition-all">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                              memory.type
                            )}`}
                          >
                            {getTypeLabel(memory.type)}
                          </span>
                          {getOutcomeIcon(memory.outcome)}
                        </div>
                        <CardTitle className="text-base mt-2">{memory.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">
                          {memory.content.substring(0, 150)}
                          {memory.content.length > 150 && "..."}
                        </p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {memory.usageCount || 0} utilisations
                          </span>
                          {memory.impactScore && (
                            <span>Impact: {Math.round(memory.impactScore * 100)}%</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Database className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Mémoire collective vide</h3>
                  <p className="text-muted-foreground">
                    Les expériences cognitives seront stockées ici au fil du temps.
                  </p>
                </div>
              )}
            </div>
          )}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function MemorySkeleton() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="w-[280px] border-r p-4 space-y-4">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-6 space-y-6">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
