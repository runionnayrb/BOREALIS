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
import ArtistSignIn from "@/pages/attendance/ArtistSignIn";
import AttendanceDashboard from "@/pages/attendance/Dashboard";
import TickSheetPage from "@/pages/attendance/TickSheet";
import LineupsList from "@/pages/LineupsList";
import LineupBuilder from "@/pages/LineupBuilder";
import TrainingPrograms from "@/pages/lineups/TrainingPrograms";
import Competencies from "@/pages/lineups/Competencies";
import Positions from "@/pages/lineups/Positions";
import RulesAutomation from "@/pages/lineups/RulesAutomation";
import Restrictions from "@/pages/lineups/Restrictions";
import WeeklySchedule from "@/pages/WeeklySchedule";
import FullSchedule from "@/pages/FullSchedule";
import ChangePassword from "@/pages/ChangePassword";
import AdminDashboard from "@/pages/AdminDashboard";
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

  // Redirect to change password if required
  useEffect(() => {
    if (user && (user as any).mustChangePassword === 1 && location !== "/change-password") {
      setLocation("/change-password");
    }
  }, [user, location, setLocation]);

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

  // Show change password page if required (without sidebar/topbar)
  if ((user as any).mustChangePassword === 1 && location === "/change-password") {
    return <ChangePassword />;
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
              <Route path="/change-password" component={ChangePassword} />
              <Route path="/admin" component={AdminDashboard} />
              <Route path="/" component={ReportsList} />
              <Route path="/new-report" component={ReportEditor} />
              <Route path="/report/:id" component={ReportEditor} />
              <Route path="/attendance/dashboard" component={AttendanceDashboard} />
              <Route path="/attendance/tickoff" component={TickSheetPage} />
              <Route path="/lineups/training-programs" component={TrainingPrograms} />
              <Route path="/lineups/competencies" component={Competencies} />
              <Route path="/lineups/positions" component={Positions} />
              <Route path="/lineups/rules" component={RulesAutomation} />
              <Route path="/lineups/restrictions" component={Restrictions} />
              <Route path="/lineups" component={LineupsList} />
              <Route path="/lineups/new" component={LineupBuilder} />
              <Route path="/lineups/:id" component={LineupBuilder} />
              <Route path="/schedule/full" component={FullSchedule} />
              <Route path="/schedule/artists" component={WeeklySchedule} />
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
            <Route path="/attendance/sign-in" component={ArtistSignIn} />
            <Route component={AuthenticatedApp} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
