import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Loader2, Users, CheckCircle, XCircle, Clock } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

export default function Invite() {
  const { inviteCode } = useParams<{ inviteCode: string }>();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: inviteData, isLoading } = trpc.team.getInvitationByCode.useQuery(
    { inviteCode: inviteCode || "" },
    { enabled: !!inviteCode }
  );

  const acceptMutation = trpc.team.acceptInvitation.useMutation({
    onSuccess: (data) => {
      toast.success("Invitation acceptée ! Vous avez rejoint l'équipe.");
      setLocation(`/teams`);
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de l'acceptation de l'invitation");
    },
  });

  const declineMutation = trpc.team.declineInvitation.useMutation({
    onSuccess: () => {
      toast.info("Invitation déclinée");
      setLocation("/");
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors du refus de l'invitation");
    },
  });

  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!inviteData || !inviteData.invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle>Invitation invalide</CardTitle>
            <CardDescription>
              Cette invitation n'existe pas ou a été supprimée.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button variant="outline" onClick={() => setLocation("/")}>
              Retour à l'accueil
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const { invitation, team } = inviteData;

  // Check if invitation is expired
  const isExpired = new Date() > new Date(invitation.expiresAt);
  const isAlreadyUsed = invitation.status !== "pending";

  if (isExpired || isAlreadyUsed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle>
              {isExpired ? "Invitation expirée" : "Invitation déjà utilisée"}
            </CardTitle>
            <CardDescription>
              {isExpired
                ? "Cette invitation a expiré. Demandez une nouvelle invitation à l'administrateur de l'équipe."
                : `Cette invitation a déjà été ${invitation.status === "accepted" ? "acceptée" : "déclinée"}.`}
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button variant="outline" onClick={() => setLocation("/")}>
              Retour à l'accueil
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Users className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle>Invitation à rejoindre {team?.name}</CardTitle>
            <CardDescription>
              Vous avez été invité à rejoindre l'équipe en tant que{" "}
              <span className="font-medium">
                {invitation.role === "admin" ? "administrateur" : "membre"}
              </span>
              . Connectez-vous pour accepter l'invitation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {team?.description && (
              <p className="text-sm text-muted-foreground text-center">
                {team.description}
              </p>
            )}
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button className="w-full" asChild>
              <a href={getLoginUrl()}>Se connecter pour accepter</a>
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Expire le {new Date(invitation.expiresAt).toLocaleDateString("fr-FR")}
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Authenticated user can accept or decline
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Users className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle>Rejoindre {team?.name}</CardTitle>
          <CardDescription>
            Vous avez été invité à rejoindre cette équipe en tant que{" "}
            <span className="font-medium">
              {invitation.role === "admin" ? "administrateur" : "membre"}
            </span>
            .
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {team?.description && (
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">{team.description}</p>
            </div>
          )}
          <div className="text-center text-sm text-muted-foreground">
            Connecté en tant que <span className="font-medium">{user?.name || user?.email}</span>
          </div>
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => declineMutation.mutate({ inviteCode: inviteCode! })}
            disabled={declineMutation.isPending}
          >
            {declineMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <XCircle className="h-4 w-4 mr-2" />
            )}
            Décliner
          </Button>
          <Button
            className="flex-1"
            onClick={() => acceptMutation.mutate({ inviteCode: inviteCode! })}
            disabled={acceptMutation.isPending}
          >
            {acceptMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Accepter
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
