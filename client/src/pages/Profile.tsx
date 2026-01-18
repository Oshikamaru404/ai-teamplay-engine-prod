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
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import {
  Brain,
  Users,
  Search,
  LogOut,
  Activity,
  User,
  Save,
  Shield,
  Lightbulb,
  Target,
  Zap,
  Heart,
} from "lucide-react";
import { CSSProperties, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const menuItems = [
  { icon: Activity, label: "Dashboard", path: "/dashboard" },
  { icon: Users, label: "Équipes", path: "/teams" },
  { icon: Search, label: "Memory Explorer", path: "/memory" },
  { icon: User, label: "Profil", path: "/profile" },
];

export default function Profile() {
  const { user, loading, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [sidebarWidth] = useState(280);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [expertise, setExpertise] = useState<string[]>([]);
  const [newExpertise, setNewExpertise] = useState("");
  const [thinkingStyle, setThinkingStyle] = useState("analytical");
  const [decisionSpeed, setDecisionSpeed] = useState("moderate");
  const [riskTolerance, setRiskTolerance] = useState("moderate");
  const [collaborationPreference, setCollaborationPreference] = useState("balanced");

  const utils = trpc.useUtils();

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
      toast.success("Profil mis à jour avec succès");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setBio(user.bio || "");
      setExpertise(user.expertise || []);
      if (user.cognitiveProfile) {
        setThinkingStyle(user.cognitiveProfile.thinkingStyle || "analytical");
        setDecisionSpeed(user.cognitiveProfile.decisionSpeed || "moderate");
        setRiskTolerance(user.cognitiveProfile.riskTolerance || "moderate");
        setCollaborationPreference(user.cognitiveProfile.collaborationPreference || "balanced");
      }
    }
  }, [user]);

  if (loading) {
    return <ProfileSkeleton />;
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

  const handleSave = () => {
    updateProfileMutation.mutate({
      name,
      bio,
      expertise,
      cognitiveProfile: {
        thinkingStyle,
        decisionSpeed,
        riskTolerance,
        collaborationPreference,
      },
    });
  };

  const handleAddExpertise = () => {
    if (newExpertise.trim() && !expertise.includes(newExpertise.trim())) {
      setExpertise([...expertise, newExpertise.trim()]);
      setNewExpertise("");
    }
  };

  const handleRemoveExpertise = (item: string) => {
    setExpertise(expertise.filter((e) => e !== item));
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
            <div>
              <h1 className="text-xl font-semibold">Mon Profil</h1>
              <p className="text-sm text-muted-foreground">
                Configurez votre profil cognitif
              </p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={updateProfileMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {updateProfileMutation.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </header>

        <main className="flex-1 p-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Informations de base
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                      {name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{user?.email || "Non défini"}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Rôle: {user?.role === "admin" ? "Administrateur" : "Utilisateur"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">Nom</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Votre nom"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Décrivez-vous en quelques mots..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Expertise */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Domaines d'expertise
                </CardTitle>
                <CardDescription>
                  Ajoutez vos compétences pour améliorer la diversité cognitive des équipes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newExpertise}
                    onChange={(e) => setNewExpertise(e.target.value)}
                    placeholder="Ex: Machine Learning, UX Design..."
                    onKeyDown={(e) => e.key === "Enter" && handleAddExpertise()}
                  />
                  <Button onClick={handleAddExpertise} variant="outline">
                    Ajouter
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {expertise.map((item) => (
                    <span
                      key={item}
                      className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm flex items-center gap-2"
                    >
                      {item}
                      <button
                        onClick={() => handleRemoveExpertise(item)}
                        className="hover:text-destructive"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {expertise.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Aucune expertise ajoutée
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Cognitive Profile */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Profil Cognitif
                </CardTitle>
                <CardDescription>
                  Ces informations aident l'IA à mieux comprendre votre style de pensée
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Style de pensée
                    </Label>
                    <Select value={thinkingStyle} onValueChange={setThinkingStyle}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="analytical">Analytique</SelectItem>
                        <SelectItem value="creative">Créatif</SelectItem>
                        <SelectItem value="practical">Pratique</SelectItem>
                        <SelectItem value="strategic">Stratégique</SelectItem>
                        <SelectItem value="intuitive">Intuitif</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Comment abordez-vous généralement les problèmes ?
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      Vitesse de décision
                    </Label>
                    <Select value={decisionSpeed} onValueChange={setDecisionSpeed}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fast">Rapide</SelectItem>
                        <SelectItem value="moderate">Modérée</SelectItem>
                        <SelectItem value="deliberate">Délibérée</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      À quelle vitesse prenez-vous des décisions ?
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Tolérance au risque
                    </Label>
                    <Select value={riskTolerance} onValueChange={setRiskTolerance}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Faible (prudent)</SelectItem>
                        <SelectItem value="moderate">Modérée</SelectItem>
                        <SelectItem value="high">Élevée (audacieux)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Quel niveau de risque acceptez-vous ?
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Heart className="h-4 w-4" />
                      Préférence de collaboration
                    </Label>
                    <Select value={collaborationPreference} onValueChange={setCollaborationPreference}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="independent">Indépendant</SelectItem>
                        <SelectItem value="balanced">Équilibré</SelectItem>
                        <SelectItem value="collaborative">Collaboratif</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Préférez-vous travailler seul ou en équipe ?
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

function ProfileSkeleton() {
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
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full lg:col-span-2" />
        </div>
      </div>
    </div>
  );
}
