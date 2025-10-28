import { useState } from "react";
import { Plus, Search, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

// Mock data for demonstration - sorted by most recent first
const mockLineups = [
  {
    id: "3",
    showNumber: "#3447",
    showDate: "2025-10-19",
    showTime: "18:00",
    showcaller: "Precious",
    status: "draft",
  },
  {
    id: "2",
    showNumber: "#3446",
    showDate: "2025-10-18",
    showTime: "21:00",
    showcaller: "Pamela",
    status: "published",
  },
  {
    id: "1",
    showNumber: "#3445",
    showDate: "2025-10-17",
    showTime: "21:00",
    showcaller: "Pamela",
    status: "published",
  },
];

export default function LineupsList() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLineups = mockLineups.filter(
    (lineup) =>
      lineup.showNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lineup.showcaller.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Show Lineups</h1>
            <p className="text-muted-foreground mt-1">
              Manage stage positions and artist assignments for shows
            </p>
          </div>
          <Button onClick={() => setLocation("/lineups/new")} data-testid="button-create-lineup">
            <Plus className="w-4 h-4 mr-2" />
            New Lineup
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by show number or showcaller..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-lineups"
          />
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredLineups.map((lineup) => (
                <div
                  key={lineup.id}
                  className="flex items-start justify-between p-4 hover-elevate cursor-pointer transition-all"
                  onClick={() => setLocation(`/lineups/${lineup.id}`)}
                  data-testid={`card-lineup-${lineup.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        Show {lineup.showNumber}
                      </h3>
                      <Badge
                        variant={lineup.status === "published" ? "default" : "secondary"}
                        data-testid={`badge-status-${lineup.id}`}
                      >
                        {lineup.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>
                            {new Date(lineup.showDate).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{lineup.showTime}</span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Showcaller: {lineup.showcaller}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {filteredLineups.length === 0 && (
          <Card className="p-12">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">No lineups found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or create a new lineup
              </p>
              <Button onClick={() => setLocation("/lineups/new")}>
                <Plus className="w-4 h-4 mr-2" />
                Create Lineup
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
