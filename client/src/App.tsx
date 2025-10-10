import { Switch, Route } from "wouter";
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
import Today from "@/pages/Today";
import Settings from "@/pages/Settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={ReportsList} />
      <Route path="/new-report" component={ReportEditor} />
      <Route path="/report/:id" component={ReportEditor} />
      <Route path="/today" component={Today} />
      <Route path="/settings" component={Settings} />
    </Switch>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full">
            <AppSidebar />
            <div className="flex flex-col flex-1">
              <TopBar />
              <main className="flex-1 overflow-hidden">
                <Router />
              </main>
              <MobileNav />
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
