import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageContext } from "./lib/i18n";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import ProjectView from "./pages/ProjectView";
import MemoryExplorer from "./pages/MemoryExplorer";
import Teams from "./pages/Teams";
import Profile from "./pages/Profile";
import Profile360 from "./pages/Profile360";
import Onboarding from "./pages/Onboarding";
import Invite from "./pages/Invite";
import { useState } from "react";
import type { Language } from "./lib/i18n";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/project/:id" component={ProjectView} />
      <Route path="/memory" component={MemoryExplorer} />
      <Route path="/teams" component={Teams} />
      <Route path="/profile" component={Profile} />
      <Route path="/profile360" component={Profile360} />
      <Route path="/onboarding" component={Onboarding} />
      <Route path="/invite/:inviteCode" component={Invite} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [language, setLanguage] = useState<Language>('fr');

  return (
    <ErrorBoundary>
      <LanguageContext.Provider value={{ language, setLanguage }}>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </LanguageContext.Provider>
    </ErrorBoundary>
  );
}

export default App;
