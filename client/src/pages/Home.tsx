import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import {
  Brain,
  Users,
  Target,
  Lightbulb,
  Shield,
  TrendingUp,
  MessageSquare,
  Database,
  ArrowRight,
  Sparkles,
  Activity,
  Eye,
} from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: Brain,
      title: "Détection de Biais Cognitifs",
      description:
        "Identification automatique des biais comme le Groupthink, Confirmation Bias, Sunk Cost Fallacy en temps réel.",
    },
    {
      icon: MessageSquare,
      title: "Chat Augmenté par IA",
      description:
        "Analyse NLP en temps réel des conversations avec interventions intelligentes et Smart Pings contextuels.",
    },
    {
      icon: Activity,
      title: "Dashboard Cognitif",
      description:
        "Visualisation des constantes vitales de votre équipe : diversité cognitive, qualité décisionnelle, santé collective.",
    },
    {
      icon: Database,
      title: "Mémoire Collective",
      description:
        "Stockage et recherche d'expériences cognitives passées pour éviter de répéter les erreurs.",
    },
    {
      icon: Target,
      title: "Timeline des Décisions",
      description:
        "Cartographie automatique du raisonnement collectif et historique des choix stratégiques.",
    },
    {
      icon: Shield,
      title: "Alertes Intelligentes",
      description:
        "Notifications proactives lors de dérives cognitives critiques ou franchissement de seuils.",
    },
  ];

  const biasTypes = [
    { name: "Confirmation Bias", color: "bg-chart-1" },
    { name: "Groupthink", color: "bg-chart-2" },
    { name: "Sunk Cost Fallacy", color: "bg-chart-3" },
    { name: "Overconfidence", color: "bg-chart-4" },
    { name: "Authority Bias", color: "bg-chart-5" },
    { name: "Anchoring", color: "bg-primary" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold gradient-text">AI TeamPlay Engine</span>
          </div>
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
            ) : user ? (
              <Button onClick={() => setLocation("/dashboard")}>
                Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => (window.location.href = getLoginUrl())}>
                Se connecter
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-5/5" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-chart-3/10 rounded-full blur-3xl" />
        
        <div className="container relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-8">
              <Sparkles className="h-4 w-4" />
              Intelligence Collective Augmentée
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Le{" "}
              <span className="gradient-text">Cerveau Collectif</span>
              <br />
              de Votre Équipe
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              AI TeamPlay Engine amplifie la qualité de réflexion de votre équipe en détectant
              les biais cognitifs en temps réel et en optimisant vos décisions collectives.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Button size="lg" onClick={() => setLocation("/dashboard")} className="text-lg px-8">
                  Accéder au Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <Button size="lg" onClick={() => (window.location.href = getLoginUrl())} className="text-lg px-8">
                  Commencer Gratuitement
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
              <Button size="lg" variant="outline" className="text-lg px-8">
                <Eye className="mr-2 h-5 w-5" />
                Voir la Démo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Bias Detection Preview */}
      <section className="py-20 border-y bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Biais Cognitifs Détectés</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Notre moteur d'IA identifie automatiquement les patterns cognitifs qui détériorent
              la qualité de vos décisions.
            </p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
            {biasTypes.map((bias) => (
              <div
                key={bias.name}
                className={`px-4 py-2 rounded-full ${bias.color} text-white font-medium text-sm shadow-lg`}
              >
                {bias.name}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Fonctionnalités Clés</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Une suite complète d'outils pour transformer votre équipe en machine à décisions de qualité.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="group hover:shadow-lg transition-all hover:border-primary/50">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Comment Ça Marche</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Un processus simple pour augmenter l'intelligence collective de votre équipe.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Créez Votre Équipe</h3>
              <p className="text-muted-foreground">
                Invitez vos collaborateurs et configurez vos projets en quelques clics.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-chart-3 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Collaborez Normalement</h3>
              <p className="text-muted-foreground">
                Utilisez le chat, prenez des décisions, gérez vos tâches comme d'habitude.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-chart-5 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Recevez des Insights</h3>
              <p className="text-muted-foreground">
                L'IA analyse en continu et vous alerte des biais et dérives cognitives.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">9+</div>
              <div className="text-muted-foreground">Types de Biais Détectés</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-chart-3 mb-2">Temps Réel</div>
              <div className="text-muted-foreground">Analyse Continue</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-chart-4 mb-2">100%</div>
              <div className="text-muted-foreground">Confidentialité</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-chart-5 mb-2">IA</div>
              <div className="text-muted-foreground">Recommandations Personnalisées</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-chart-5/10">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">
              Prêt à Augmenter l'Intelligence de Votre Équipe ?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Rejoignez les équipes qui utilisent AI TeamPlay Engine pour prendre de meilleures décisions.
            </p>
            {user ? (
              <Button size="lg" onClick={() => setLocation("/dashboard")} className="text-lg px-10">
                Aller au Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            ) : (
              <Button size="lg" onClick={() => (window.location.href = getLoginUrl())} className="text-lg px-10">
                Démarrer Maintenant
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <span className="font-semibold">AI TeamPlay Engine</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 AI TeamPlay Engine. Plateforme d'Intelligence Collective Augmentée.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
