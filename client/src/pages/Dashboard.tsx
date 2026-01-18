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
import { Progress } from "@/components/ui/progress";
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
  FolderKanban,
  Search,
  Bell,
  LogOut,
  PanelLeft,
  Plus,
  Activity,
  TrendingUp,
  AlertTriangle,
  Target,
  MessageSquare,
  Lightbulb,
  User,
} from "lucide-react";
import { CSSProperties, useState } from "react";
import { useLocation } from "wouter";
import CognitiveMap, { DEMO_COGNITIVE_MAP } from "@/components/CognitiveMap";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  AreaChart,
  Area,
} from "recharts";

const menuItems = [
  { icon: Activity, label: "Dashboard", path: "/dashboard" },
  { icon: Users, label: "Équipes", path: "/teams" },
  { icon: Search, label: "Memory Explorer", path: "/memory" },
  { icon: User, label: "Profil", path: "/profile" },
];

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [sidebarWidth] = useState(280);

  const { data: teams, isLoading: teamsLoading } = trpc.team.list.useQuery(undefined, {
    enabled: !!user,
  });

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <Brain className="h-16 w-16 text-primary" />
          <div className="flex flex-col items-center gap-4">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Connectez-vous pour continuer
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Accédez à votre dashboard d'intelligence collective et commencez à améliorer vos décisions d'équipe.
            </p>
          </div>
          <Button
            onClick={() => (window.location.href = getLoginUrl())}
            size="lg"
            className="w-full"
          >
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  // Mock data for charts
  const cognitiveMetricsHistory = [
    { time: "Lun", diversity: 65, critical: 70, convergence: 45, bias: 30 },
    { time: "Mar", diversity: 68, critical: 72, convergence: 48, bias: 28 },
    { time: "Mer", diversity: 72, critical: 68, convergence: 52, bias: 35 },
    { time: "Jeu", diversity: 70, critical: 75, convergence: 50, bias: 25 },
    { time: "Ven", diversity: 75, critical: 78, convergence: 55, bias: 22 },
    { time: "Sam", diversity: 78, critical: 80, convergence: 48, bias: 20 },
    { time: "Dim", diversity: 80, critical: 82, convergence: 45, bias: 18 },
  ];

  const radarData = [
    { metric: "Diversité", value: 78, fullMark: 100 },
    { metric: "Pensée Critique", value: 82, fullMark: 100 },
    { metric: "Qualité Décision", value: 75, fullMark: 100 },
    { metric: "Engagement", value: 88, fullMark: 100 },
    { metric: "Exploration", value: 65, fullMark: 100 },
    { metric: "Consensus", value: 70, fullMark: 100 },
  ];

  const recentAlerts = [
    {
      id: 1,
      type: "bias_critical",
      title: "Biais de confirmation détecté",
      severity: "high",
      time: "Il y a 2h",
    },
    {
      id: 2,
      type: "convergence_warning",
      title: "Convergence prématurée possible",
      severity: "medium",
      time: "Il y a 5h",
    },
    {
      id: 3,
      type: "diversity_alert",
      title: "Diversité d'opinions en baisse",
      severity: "low",
      time: "Hier",
    },
  ];

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <Sidebar collapsible="icon" className="border-r-0">
        <SidebarHeader className="h-16 justify-center">
          <div className="flex items-center gap-3 px-2">
            <Brain className="h-8 w-8 text-primary shrink-0" />
            <span className="font-bold text-lg group-data-[collapsible=icon]:hidden">
              TeamPlay
            </span>
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
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b px-6 bg-background/95 backdrop-blur sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="h-9 w-9 rounded-lg" />
            <div>
              <h1 className="text-xl font-semibold">Dashboard Cognitif</h1>
              <p className="text-sm text-muted-foreground">Vue d'ensemble de votre intelligence collective</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] text-white flex items-center justify-center">
                3
              </span>
            </Button>
            <Button onClick={() => setLocation("/teams")}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle Équipe
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 space-y-6">
          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="cognitive-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Indice de Diversité
                </CardTitle>
                <Users className="h-4 w-4 text-chart-1" />
              </CardHeader>
              <CardContent>
                <div className="cognitive-metric text-chart-1">78%</div>
                <Progress value={78} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-2">+5% vs semaine dernière</p>
              </CardContent>
            </Card>

            <Card className="cognitive-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Pensée Critique
                </CardTitle>
                <Lightbulb className="h-4 w-4 text-chart-2" />
              </CardHeader>
              <CardContent>
                <div className="cognitive-metric text-chart-2">82%</div>
                <Progress value={82} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-2">+8% vs semaine dernière</p>
              </CardContent>
            </Card>

            <Card className="cognitive-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Risque de Biais
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-cognitive-warning" />
              </CardHeader>
              <CardContent>
                <div className="cognitive-metric text-cognitive-warning">18%</div>
                <Progress value={18} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-2">-12% vs semaine dernière</p>
              </CardContent>
            </Card>

            <Card className="cognitive-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Qualité Décisionnelle
                </CardTitle>
                <Target className="h-4 w-4 text-cognitive-success" />
              </CardHeader>
              <CardContent>
                <div className="cognitive-metric text-cognitive-success">75%</div>
                <Progress value={75} className="mt-2 h-2" />
                <p className="text-xs text-muted-foreground mt-2">+3% vs semaine dernière</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Metrics Evolution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Évolution des Métriques
                </CardTitle>
                <CardDescription>Tendances cognitives sur 7 jours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={cognitiveMetricsHistory}>
                      <defs>
                        <linearGradient id="colorDiversity" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.7 0.15 200)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="oklch(0.7 0.15 200)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorCritical" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="oklch(0.65 0.18 230)" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="oklch(0.65 0.18 230)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="time" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="diversity"
                        stroke="oklch(0.7 0.15 200)"
                        fill="url(#colorDiversity)"
                        name="Diversité"
                      />
                      <Area
                        type="monotone"
                        dataKey="critical"
                        stroke="oklch(0.65 0.18 230)"
                        fill="url(#colorCritical)"
                        name="Pensée Critique"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Profil Cognitif
                </CardTitle>
                <CardDescription>Vue radar de vos capacités collectives</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid className="stroke-border" />
                      <PolarAngleAxis dataKey="metric" className="text-xs" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} className="text-xs" />
                      <Radar
                        name="Score"
                        dataKey="value"
                        stroke="oklch(0.55 0.2 270)"
                        fill="oklch(0.55 0.2 270)"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Recent Alerts */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  Alertes Récentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentAlerts.map((alert, index) => (
                  <div
                    key={alert.id}
                    className={`bias-alert ${
                      alert.severity === "high"
                        ? "bias-alert-high"
                        : alert.severity === "medium"
                        ? "bias-alert-medium"
                        : "bias-alert-low"
                    } animate-in fade-in slide-in-from-left duration-300`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        alert.severity === "high"
                          ? "bg-red-500/10"
                          : alert.severity === "medium"
                          ? "bg-orange-500/10"
                          : "bg-blue-500/10"
                      }`}>
                        <AlertTriangle
                          className={`h-4 w-4 ${
                            alert.severity === "high"
                              ? "text-cognitive-danger"
                              : alert.severity === "medium"
                              ? "text-cognitive-warning"
                              : "text-cognitive-info"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{alert.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{alert.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-2">
                  Voir toutes les alertes
                </Button>
              </CardContent>
            </Card>

            {/* Cognitive Map */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Carte Cognitive Interactive
                </CardTitle>
                <CardDescription>
                  Visualisez les relations entre membres, idées, décisions et biais
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <CognitiveMap 
                  data={DEMO_COGNITIVE_MAP}
                  onNodeClick={(node) => console.log('Node clicked:', node)}
                  className="border-0 shadow-none"
                />
              </CardContent>
            </Card>

            {/* Teams */}
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Vos Équipes
                  </CardTitle>
                  <CardDescription>Accédez rapidement à vos projets</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setLocation("/teams")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer
                </Button>
              </CardHeader>
              <CardContent>
                {teamsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : teams && teams.length > 0 ? (
                  <div className="space-y-3">
                    {teams.slice(0, 4).map((team) => (
                      <div
                        key={team.id}
                        className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => setLocation(`/teams`)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{team.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {team.description || "Aucune description"}
                            </p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          Ouvrir
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">Aucune équipe pour le moment</p>
                    <Button onClick={() => setLocation("/teams")}>
                      <Plus className="mr-2 h-4 w-4" />
                      Créer une équipe
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function DashboardSkeleton() {
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
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-[400px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    </div>
  );
}
