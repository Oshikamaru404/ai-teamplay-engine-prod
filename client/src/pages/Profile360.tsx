import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  User, Brain, Briefcase, Upload, ChevronRight, ChevronLeft, 
  CheckCircle2, Sparkles, Target, Users, Loader2
} from "lucide-react";
import { Link } from "wouter";

export default function Profile360() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [cvText, setCvText] = useState("");

  const { data: fullProfile, isLoading: profileLoading, refetch: refetchProfile } = 
    trpc.profile360.getFullProfile.useQuery(undefined, { enabled: !!user });
  
  const { data: quizData } = trpc.profile360.getQuiz.useQuery();
  
  const submitQuizMutation = trpc.profile360.submitQuiz.useMutation({
    onSuccess: () => {
      toast.success("Profil Big Five calculé avec succès !");
      refetchProfile();
      setActiveTab("bigfive");
      setQuizStep(0);
      setQuizAnswers({});
    },
    onError: () => toast.error("Erreur lors du calcul du profil"),
  });

  const extractCVMutation = trpc.profile360.extractFromCV.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Profil extrait avec ${data.confidence}% de confiance`);
        refetchProfile();
        setActiveTab("professional");
        setCvText("");
      } else {
        toast.error(data.error || "Erreur lors de l'extraction");
      }
    },
    onError: () => toast.error("Erreur lors de l'extraction du CV"),
  });

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Brain className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Profil 360°</h1>
        <p className="text-muted-foreground">Connectez-vous pour accéder à votre profil</p>
        <Link href="/">
          <Button>Retour à l'accueil</Button>
        </Link>
      </div>
    );
  }

  const questions = quizData?.questions || [];
  const currentQuestion = questions[quizStep];
  const quizProgress = questions.length > 0 ? ((quizStep + 1) / questions.length) * 100 : 0;

  const handleQuizAnswer = (score: number) => {
    if (!currentQuestion) return;
    setQuizAnswers(prev => ({ ...prev, [currentQuestion.id]: score }));
    if (quizStep < questions.length - 1) {
      setQuizStep(quizStep + 1);
    }
  };

  const handleSubmitQuiz = () => {
    const answers = Object.entries(quizAnswers).map(([questionId, score]) => ({
      questionId,
      score,
    }));
    submitQuizMutation.mutate({ answers });
  };

  const bigFive = fullProfile?.bigFive;
  const professional = fullProfile?.professional;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" /> Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <span className="font-semibold">Profil 360°</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Complétude:</span>
            <Progress value={fullProfile?.profileCompleteness || 0} className="w-24 h-2" />
            <span className="text-sm font-medium">{fullProfile?.profileCompleteness || 0}%</span>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="overview" className="gap-2">
              <User className="h-4 w-4" /> Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="bigfive" className="gap-2">
              <Brain className="h-4 w-4" /> Big Five
            </TabsTrigger>
            <TabsTrigger value="professional" className="gap-2">
              <Briefcase className="h-4 w-4" /> Expérience
            </TabsTrigger>
            <TabsTrigger value="quiz" className="gap-2">
              <Sparkles className="h-4 w-4" /> Quiz
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* User Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" /> Informations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                      {fullProfile?.user.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="font-semibold">{fullProfile?.user.name || "Nom non défini"}</p>
                      <p className="text-sm text-muted-foreground">{fullProfile?.user.email}</p>
                    </div>
                  </div>
                  {fullProfile?.user.bio && (
                    <p className="text-sm text-muted-foreground">{fullProfile.user.bio}</p>
                  )}
                </CardContent>
              </Card>

              {/* Big Five Summary */}
              <Card className={!bigFive ? "border-dashed" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" /> Personnalité
                  </CardTitle>
                  <CardDescription>Profil Big Five / OCEAN</CardDescription>
                </CardHeader>
                <CardContent>
                  {bigFive ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{bigFive.teamRole?.emoji}</span>
                        <div>
                          <p className="font-semibold">{bigFive.teamRole?.role}</p>
                          <p className="text-xs text-muted-foreground">{bigFive.teamRole?.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="outline">Confiance: {bigFive.profile.confidence}%</Badge>
                        <Badge variant="secondary">{bigFive.profile.source}</Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-3">Profil non complété</p>
                      <Button size="sm" onClick={() => setActiveTab("quiz")}>
                        <Sparkles className="h-4 w-4 mr-2" /> Faire le quiz
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Professional Summary */}
              <Card className={!professional?.profile ? "border-dashed" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" /> Expérience
                  </CardTitle>
                  <CardDescription>Profil professionnel</CardDescription>
                </CardHeader>
                <CardContent>
                  {professional?.profile ? (
                    <div className="space-y-2">
                      <p className="font-semibold">{professional.profile.currentRole || "Poste non défini"}</p>
                      <p className="text-sm text-muted-foreground">{professional.profile.company}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {professional.profile.skills.slice(0, 4).map((skill, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                        ))}
                        {professional.profile.skills.length > 4 && (
                          <Badge variant="outline" className="text-xs">+{professional.profile.skills.length - 4}</Badge>
                        )}
                      </div>
                      <Progress value={professional.completeness} className="h-1 mt-2" />
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-3">Profil non complété</p>
                      <Button size="sm" onClick={() => setActiveTab("professional")}>
                        <Upload className="h-4 w-4 mr-2" /> Importer CV
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Team Impact */}
            {bigFive && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" /> Impact sur l'équipe
                  </CardTitle>
                  <CardDescription>Comment votre profil contribue à la dynamique collective</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    {bigFive.teamRole && (
                      <>
                        <div className="p-4 rounded-lg bg-primary/5 border">
                          <div className="flex items-center gap-2 mb-2">
                            <Target className="h-5 w-5 text-primary" />
                            <span className="font-medium">Forces</span>
                          </div>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {Object.entries(bigFive.traitDescriptions || {})
                              .filter(([key]) => (bigFive.profile as any)[key] >= 60)
                              .slice(0, 3)
                              .map(([key, trait]) => (
                                <li key={key}>• {(trait as any).teamStrengths[0]}</li>
                              ))}
                          </ul>
                        </div>
                        <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-5 w-5 text-amber-500" />
                            <span className="font-medium">Zones de croissance</span>
                          </div>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {Object.entries(bigFive.traitDescriptions || {})
                              .filter(([key]) => (bigFive.profile as any)[key] < 40)
                              .slice(0, 3)
                              .map(([key, trait]) => (
                                <li key={key}>• Développer: {(trait as any).nameFr}</li>
                              ))}
                          </ul>
                        </div>
                        <div className="p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span className="font-medium">Recommandations</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            En tant que <strong>{bigFive.teamRole.role}</strong>, vous excellez à {bigFive.teamRole.description.toLowerCase()}.
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Big Five Tab */}
          <TabsContent value="bigfive" className="space-y-6">
            {bigFive ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Votre profil Big Five / OCEAN</CardTitle>
                    <CardDescription>
                      Basé sur {bigFive.profile.source === 'quiz' ? 'le quiz' : bigFive.profile.source === 'analysis' ? "l'analyse de vos discussions" : 'une combinaison des deux méthodes'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {Object.entries(bigFive.traitDescriptions || {}).map(([key, trait]) => {
                      const score = (bigFive.profile as any)[key] as number;
                      const traitInfo = trait as any;
                      return (
                        <div key={key} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{traitInfo.emoji}</span>
                              <span className="font-medium">{traitInfo.nameFr}</span>
                            </div>
                            <span className="font-bold text-lg">{score}%</span>
                          </div>
                          <Progress value={score} className="h-3" />
                          <p className="text-sm text-muted-foreground">
                            {score >= 60 ? traitInfo.highDescription : traitInfo.lowDescription}
                          </p>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{bigFive.teamRole?.emoji}</span>
                      {bigFive.teamRole?.role}
                    </CardTitle>
                    <CardDescription>{bigFive.teamRole?.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="font-medium mb-2">Vos forces dans l'équipe</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {Object.entries(bigFive.traitDescriptions || {})
                            .filter(([key]) => (bigFive.profile as any)[key] >= 60)
                            .flatMap(([, trait]) => (trait as any).teamStrengths)
                            .slice(0, 5)
                            .map((strength, i) => (
                              <li key={i} className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                {strength}
                              </li>
                            ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Conseils de collaboration</h4>
                        <p className="text-sm text-muted-foreground">
                          Votre profil suggère que vous travaillez mieux dans des environnements qui valorisent 
                          {(bigFive.profile as any).openness >= 60 ? " la créativité et l'innovation" : " la structure et les méthodes éprouvées"}.
                          {(bigFive.profile as any).extraversion >= 60 
                            ? " Vous êtes énergisé par les interactions sociales." 
                            : " Vous appréciez le temps de réflexion individuelle."}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-center">
                  <Button variant="outline" onClick={() => setActiveTab("quiz")}>
                    <Sparkles className="h-4 w-4 mr-2" /> Refaire le quiz
                  </Button>
                </div>
              </>
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Découvrez votre profil de personnalité</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Le modèle Big Five (OCEAN) est le standard scientifique pour comprendre la personnalité.
                    Répondez à 15 questions rapides pour découvrir votre profil.
                  </p>
                  <Button onClick={() => setActiveTab("quiz")}>
                    <Sparkles className="h-4 w-4 mr-2" /> Commencer le quiz
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Professional Tab */}
          <TabsContent value="professional" className="space-y-6">
            {professional?.profile ? (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Profil Professionnel</CardTitle>
                    <CardDescription>
                      Complétude: {professional.completeness}% • Source: {professional.profile.source}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-muted-foreground">Poste actuel</Label>
                        <p className="font-medium">{professional.profile.currentRole || "Non défini"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Entreprise</Label>
                        <p className="font-medium">{professional.profile.company || "Non définie"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Années d'expérience</Label>
                        <p className="font-medium">{professional.profile.yearsExperience || "Non défini"}</p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Langues</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {professional.profile.languages.map((lang, i) => (
                            <Badge key={i} variant="outline">{lang}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-muted-foreground">Compétences</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {professional.profile.skills.map((skill, i) => (
                          <Badge key={i} variant="secondary">{skill}</Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-muted-foreground">Industries</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {professional.profile.industries.map((ind, i) => (
                          <Badge key={i} variant="outline">{ind}</Badge>
                        ))}
                      </div>
                    </div>

                    {professional.profile.experiences.length > 0 && (
                      <div>
                        <Label className="text-muted-foreground">Expériences</Label>
                        <div className="space-y-3 mt-2">
                          {professional.profile.experiences.map((exp, i) => (
                            <div key={i} className="p-3 rounded-lg border">
                              <p className="font-medium">{exp.title}</p>
                              <p className="text-sm text-muted-foreground">{exp.company} • {exp.duration}</p>
                              {exp.description && <p className="text-sm mt-1">{exp.description}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {professional.profile.education.length > 0 && (
                      <div>
                        <Label className="text-muted-foreground">Formation</Label>
                        <div className="space-y-2 mt-2">
                          {professional.profile.education.map((edu, i) => (
                            <div key={i} className="p-3 rounded-lg border">
                              <p className="font-medium">{edu.degree} en {edu.field}</p>
                              <p className="text-sm text-muted-foreground">{edu.institution}{edu.year ? ` (${edu.year})` : ''}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : null}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" /> Importer votre CV
                </CardTitle>
                <CardDescription>
                  Collez le texte de votre CV pour extraire automatiquement vos informations professionnelles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Collez le contenu de votre CV ici (texte brut)..."
                  className="min-h-[200px]"
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                />
                <Button 
                  onClick={() => extractCVMutation.mutate({ cvText })}
                  disabled={cvText.length < 50 || extractCVMutation.isPending}
                >
                  {extractCVMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Extraction en cours...</>
                  ) : (
                    <><Sparkles className="h-4 w-4 mr-2" /> Extraire les informations</>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Minimum 50 caractères requis. L'IA analysera le texte pour extraire vos compétences, expériences et formations.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quiz Tab */}
          <TabsContent value="quiz" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Big Five</CardTitle>
                <CardDescription>
                  15 questions pour découvrir votre profil de personnalité OCEAN
                </CardDescription>
                <Progress value={quizProgress} className="mt-2" />
              </CardHeader>
              <CardContent>
                {currentQuestion ? (
                  <div className="space-y-6">
                    <div className="text-center py-4">
                      <Badge variant="outline" className="mb-4">
                        Question {quizStep + 1} / {questions.length}
                      </Badge>
                      <h3 className="text-xl font-medium">{currentQuestion.textFr}</h3>
                    </div>

                    <div className="flex justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <Button
                          key={score}
                          variant={quizAnswers[currentQuestion.id] === score ? "default" : "outline"}
                          className="w-16 h-16 text-lg"
                          onClick={() => handleQuizAnswer(score)}
                        >
                          {score}
                        </Button>
                      ))}
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground px-4">
                      <span>Pas du tout d'accord</span>
                      <span>Tout à fait d'accord</span>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button
                        variant="ghost"
                        onClick={() => setQuizStep(Math.max(0, quizStep - 1))}
                        disabled={quizStep === 0}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" /> Précédent
                      </Button>
                      
                      {quizStep === questions.length - 1 && Object.keys(quizAnswers).length === questions.length ? (
                        <Button onClick={handleSubmitQuiz} disabled={submitQuizMutation.isPending}>
                          {submitQuizMutation.isPending ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Calcul...</>
                          ) : (
                            <>Voir mon profil <ChevronRight className="h-4 w-4 ml-1" /></>
                          )}
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          onClick={() => setQuizStep(Math.min(questions.length - 1, quizStep + 1))}
                          disabled={!quizAnswers[currentQuestion.id]}
                        >
                          Suivant <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="mt-2 text-muted-foreground">Chargement du quiz...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
