import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import TopBar from "@/components/TopBar";
import MobileNav from "@/components/MobileNav";
import ReportsList from "@/pages/ReportsList";
import ReportEditor from "@/pages/ReportEditor";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import AuthPage from "@/pages/AuthPage";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

function AuthenticatedApp() {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user && location !== "/auth") {
      setLocation("/auth");
    }
  }, [user, isLoading, location, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-auto">
            <Switch>
              <Route path="/" component={ReportsList} />
              <Route path="/new-report" component={ReportEditor} />
              <Route path="/report/:id" component={ReportEditor} />
              <Route path="/settings" component={Settings} />
              <Route path="/profile" component={Profile} />
            </Switch>
          </main>
          <MobileNav />
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Switch>
            <Route path="/auth" component={AuthPage} />
            <Route component={AuthenticatedApp} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
