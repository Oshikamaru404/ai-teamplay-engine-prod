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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Brain,
  Users,
  Search,
  LogOut,
  Plus,
  Activity,
  FolderKanban,
  MoreVertical,
  Trash2,
  Settings,
  User,
  ArrowLeft,
  UserPlus,
  Copy,
  Link,
  Loader2,
} from "lucide-react";
import { CSSProperties, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const menuItems = [
  { icon: Activity, label: "Dashboard", path: "/dashboard" },
  { icon: Users, label: "Équipes", path: "/teams" },
  { icon: Search, label: "Memory Explorer", path: "/memory" },
  { icon: User, label: "Profil", path: "/profile" },
];

export default function Teams() {
  const { user, loading, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [sidebarWidth] = useState(280);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteTeamId, setInviteTeamId] = useState<number | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const { data: teams, isLoading: teamsLoading } = trpc.team.list.useQuery(undefined, {
    enabled: !!user,
  });

  const { data: projects, isLoading: projectsLoading } = trpc.project.list.useQuery(
    { teamId: selectedTeam! },
    { enabled: !!selectedTeam }
  );

  const createTeamMutation = trpc.team.create.useMutation({
    onSuccess: () => {
      utils.team.list.invalidate();
      setIsCreateTeamOpen(false);
      setNewTeamName("");
      setNewTeamDescription("");
      toast.success("Équipe créée avec succès");
    },
    onError: (error) => {
      toast.error("Erreur lors de la création: " + error.message);
    },
  });

  const createProjectMutation = trpc.project.create.useMutation({
    onSuccess: () => {
      utils.project.list.invalidate();
      setIsCreateProjectOpen(false);
      setNewProjectName("");
      setNewProjectDescription("");
      toast.success("Projet créé avec succès");
    },
    onError: (error) => {
      toast.error("Erreur lors de la création: " + error.message);
    },
  });

  const deleteTeamMutation = trpc.team.delete.useMutation({
    onSuccess: () => {
      utils.team.list.invalidate();
      setSelectedTeam(null);
      toast.success("Équipe supprimée");
    },
  });

  const createInvitationMutation = trpc.team.createInvitation.useMutation({
    onSuccess: (data) => {
      const fullUrl = `${window.location.origin}${data.inviteUrl}`;
      setGeneratedInviteLink(fullUrl);
      toast.success("Lien d'invitation généré");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  if (loading) {
    return <TeamsSkeleton />;
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
          </div>
          <Button onClick={() => (window.location.href = getLoginUrl())} size="lg" className="w-full">
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  const handleCreateTeam = () => {
    if (!newTeamName.trim()) {
      toast.error("Le nom de l'équipe est requis");
      return;
    }
    createTeamMutation.mutate({
      name: newTeamName,
      description: newTeamDescription || undefined,
    });
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim() || !selectedTeam) {
      toast.error("Le nom du projet est requis");
      return;
    }
    createProjectMutation.mutate({
      teamId: selectedTeam,
      name: newProjectName,
      description: newProjectDescription || undefined,
    });
  };

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
            {selectedTeam ? (
              <Button variant="ghost" size="sm" onClick={() => setSelectedTeam(null)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour aux équipes
              </Button>
            ) : (
              <div>
                <h1 className="text-xl font-semibold">Équipes & Projets</h1>
                <p className="text-sm text-muted-foreground">Gérez vos équipes et leurs projets</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            {selectedTeam ? (
              <Dialog open={isCreateProjectOpen} onOpenChange={setIsCreateProjectOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouveau Projet
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer un nouveau projet</DialogTitle>
                    <DialogDescription>
                      Ajoutez un projet à votre équipe pour commencer à collaborer.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="projectName">Nom du projet</Label>
                      <Input
                        id="projectName"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        placeholder="Ex: Hackathon 2025"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="projectDesc">Description</Label>
                      <Textarea
                        id="projectDesc"
                        value={newProjectDescription}
                        onChange={(e) => setNewProjectDescription(e.target.value)}
                        placeholder="Décrivez les objectifs du projet..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateProjectOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleCreateProject} disabled={createProjectMutation.isPending}>
                      {createProjectMutation.isPending ? "Création..." : "Créer"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : (
              <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle Équipe
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Créer une nouvelle équipe</DialogTitle>
                    <DialogDescription>
                      Créez une équipe pour commencer à collaborer avec vos collègues.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="teamName">Nom de l'équipe</Label>
                      <Input
                        id="teamName"
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        placeholder="Ex: Équipe Innovation"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="teamDesc">Description</Label>
                      <Textarea
                        id="teamDesc"
                        value={newTeamDescription}
                        onChange={(e) => setNewTeamDescription(e.target.value)}
                        placeholder="Décrivez l'objectif de l'équipe..."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateTeamOpen(false)}>
                      Annuler
                    </Button>
                    <Button onClick={handleCreateTeam} disabled={createTeamMutation.isPending}>
                      {createTeamMutation.isPending ? "Création..." : "Créer"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </header>

        <main className="flex-1 p-6">
          {selectedTeam ? (
            // Projects View
            <div className="space-y-6">
              {projectsLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))}
                </div>
              ) : projects && projects.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {projects.map((project) => (
                    <Card
                      key={project.id}
                      className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
                      onClick={() => setLocation(`/project/${project.id}`)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FolderKanban className="h-6 w-6 text-primary" />
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              project.status === "active"
                                ? "bg-cognitive-success/20 text-cognitive-success"
                                : project.status === "completed"
                                ? "bg-chart-2/20 text-chart-2"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {project.status === "active"
                              ? "Actif"
                              : project.status === "completed"
                              ? "Terminé"
                              : project.status === "planning"
                              ? "Planification"
                              : project.status}
                          </span>
                        </div>
                        <CardTitle className="mt-4">{project.name}</CardTitle>
                        <CardDescription>
                          {project.description || "Aucune description"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-muted-foreground">Santé cognitive</span>
                              <span className="font-medium">
                                {Math.round(
                                  ((project.cognitiveHealth?.diversityIndex || 0.5) +
                                    (project.cognitiveHealth?.criticalThinkingScore || 0.5)) *
                                    50
                                )}
                                %
                              </span>
                            </div>
                            <Progress
                              value={
                                ((project.cognitiveHealth?.diversityIndex || 0.5) +
                                  (project.cognitiveHealth?.criticalThinkingScore || 0.5)) *
                                50
                              }
                              className="h-2"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <FolderKanban className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Aucun projet</h3>
                  <p className="text-muted-foreground mb-6">
                    Créez votre premier projet pour commencer à collaborer.
                  </p>
                  <Button onClick={() => setIsCreateProjectOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Créer un projet
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // Teams View
            <div className="space-y-6">
              {teamsLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))}
                </div>
              ) : teams && teams.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {teams.map((team) => (
                    <Card
                      key={team.id}
                      className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div
                            className="flex-1"
                            onClick={() => setSelectedTeam(team.id)}
                          >
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                              <Users className="h-6 w-6 text-primary" />
                            </div>
                            <CardTitle>{team.name}</CardTitle>
                            <CardDescription className="mt-2">
                              {team.description || "Aucune description"}
                            </CardDescription>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => {
                                  setInviteTeamId(team.id);
                                  setGeneratedInviteLink(null);
                                  setInviteEmail("");
                                  setIsInviteDialogOpen(true);
                                }}
                              >
                                <UserPlus className="mr-2 h-4 w-4" />
                                Inviter des membres
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Settings className="mr-2 h-4 w-4" />
                                Paramètres
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => deleteTeamMutation.mutate({ id: team.id })}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent onClick={() => setSelectedTeam(team.id)}>
                        <Button variant="outline" className="w-full">
                          Voir les projets
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Aucune équipe</h3>
                  <p className="text-muted-foreground mb-6">
                    Créez votre première équipe pour commencer à collaborer.
                  </p>
                  <Button onClick={() => setIsCreateTeamOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Créer une équipe
                  </Button>
                </div>
              )}
            </div>
          )}
        </main>
      </SidebarInset>

      {/* Invitation Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Inviter des membres</DialogTitle>
            <DialogDescription>
              Générez un lien d'invitation ou envoyez une invitation par email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inviteEmail">Email (optionnel)</Label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="collegue@example.com"
              />
              <p className="text-xs text-muted-foreground">
                Laissez vide pour générer un lien d'invitation générique.
              </p>
            </div>

            {generatedInviteLink && (
              <div className="space-y-2">
                <Label>Lien d'invitation</Label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={generatedInviteLink}
                    className="font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedInviteLink);
                      toast.success("Lien copié dans le presse-papier");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ce lien expire dans 7 jours.
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsInviteDialogOpen(false)}
            >
              Fermer
            </Button>
            <Button
              onClick={() => {
                if (inviteTeamId) {
                  createInvitationMutation.mutate({
                    teamId: inviteTeamId,
                    email: inviteEmail || undefined,
                  });
                }
              }}
              disabled={createInvitationMutation.isPending}
            >
              {createInvitationMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Link className="mr-2 h-4 w-4" />
                  Générer le lien
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

function TeamsSkeleton() {
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
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
