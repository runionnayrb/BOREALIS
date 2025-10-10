import { FileText, Plus, Clock, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";

export default function MobileNav() {
  const [location] = useLocation();

  const tabs = [
    { icon: FileText, label: "Reports", path: "/" },
    { icon: Plus, label: "New Report", path: "/new-report" },
    { icon: Clock, label: "Today", path: "/today" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-card-border backdrop-blur-md z-50 pb-safe">
      <div className="grid grid-cols-4 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location === tab.path || (tab.path === "/settings" && location.startsWith("/settings"));
          
          return (
            <Link
              key={tab.path}
              href={tab.path}
              data-testid={`tab-${tab.label.toLowerCase().replace(" ", "-")}`}
              className={`flex flex-col items-center justify-center gap-1 hover-elevate transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
