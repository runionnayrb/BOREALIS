import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCircle2, RotateCcw, Users } from "lucide-react";
import type { Artist, ArtistGroup } from "@shared/schema";

interface TickSheet {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Date;
  resetAt: Date | null;
}

interface TickSheetMark {
  tickSheetId: string;
  artistId: string;
  markedBy: string;
  markedAt: Date;
}

function getArtistDisplayName(artist: Artist): string {
  return artist.stageName || `${artist.firstName} ${artist.lastName}`;
}

export default function TickSheetPage() {
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const { toast } = useToast();

  // Get all artists and groups
  const { data: artists = [] } = useQuery<Artist[]>({
    queryKey: ["/api/artists"],
  });

  const { data: groups = [] } = useQuery<ArtistGroup[]>({
    queryKey: ["/api/artist-groups"],
  });

  // Get or create active tick sheet
  const { data: activeSheets = [], isLoading: isLoadingSheet } = useQuery<TickSheet[]>({
    queryKey: ["/api/tick-sheets"],
    queryFn: async () => {
      const response = await fetch("/api/tick-sheets?active=true", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch tick sheets");
      return response.json();
    },
  });

  // Get tick sheet marks
  const { data: marks = [] } = useQuery<TickSheetMark[]>({
    queryKey: ["/api/tick-sheets", activeSheetId, "marks"],
    enabled: !!activeSheetId,
  });

  // Create tick sheet mutation
  const createSheetMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/tick-sheets", {
        name: `Meeting ${new Date().toLocaleDateString()}`,
      });
    },
    onSuccess: (sheet: TickSheet) => {
      setActiveSheetId(sheet.id);
      queryClient.invalidateQueries({ queryKey: ["/api/tick-sheets"] });
      toast({
        title: "Tick Sheet Created",
        description: "New tick sheet ready for use.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create tick sheet.",
        variant: "destructive",
      });
    },
  });

  // Toggle mark mutation with optimistic updates
  const toggleMarkMutation = useMutation({
    mutationFn: async ({ artistId, isMarked }: { artistId: string; isMarked: boolean }) => {
      if (!activeSheetId) throw new Error("No active tick sheet");
      
      if (isMarked) {
        // Unmark
        return apiRequest("DELETE", `/api/tick-sheets/${activeSheetId}/marks/${artistId}`, undefined);
      } else {
        // Mark
        return apiRequest("POST", `/api/tick-sheets/${activeSheetId}/marks`, { artistId });
      }
    },
    onMutate: async ({ artistId, isMarked }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/tick-sheets", activeSheetId, "marks"] });
      
      // Snapshot the previous value
      const previousMarks = queryClient.getQueryData<TickSheetMark[]>(["/api/tick-sheets", activeSheetId, "marks"]);
      
      // Optimistically update the UI
      queryClient.setQueryData<TickSheetMark[]>(["/api/tick-sheets", activeSheetId, "marks"], (old = []) => {
        if (isMarked) {
          // Remove the mark
          return old.filter(m => m.artistId !== artistId);
        } else {
          // Add the mark
          return [...old, {
            tickSheetId: activeSheetId!,
            artistId,
            markedBy: "", // Will be set by server
            markedAt: new Date(),
          }];
        }
      });
      
      // Return context with the snapshot
      return { previousMarks };
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousMarks) {
        queryClient.setQueryData(["/api/tick-sheets", activeSheetId, "marks"], context.previousMarks);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update tick sheet.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Refetch to ensure we're in sync with server
      queryClient.invalidateQueries({ queryKey: ["/api/tick-sheets", activeSheetId, "marks"] });
    },
  });

  // Reset tick sheet mutation with optimistic updates
  const resetSheetMutation = useMutation({
    mutationFn: async () => {
      if (!activeSheetId) throw new Error("No active tick sheet");
      return apiRequest("POST", `/api/tick-sheets/${activeSheetId}/reset`, undefined);
    },
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/tick-sheets", activeSheetId, "marks"] });
      
      // Snapshot the previous value
      const previousMarks = queryClient.getQueryData<TickSheetMark[]>(["/api/tick-sheets", activeSheetId, "marks"]);
      
      // Optimistically clear all marks
      queryClient.setQueryData<TickSheetMark[]>(["/api/tick-sheets", activeSheetId, "marks"], []);
      
      // Return context with the snapshot
      return { previousMarks };
    },
    onSuccess: () => {
      toast({
        title: "Tick Sheet Reset",
        description: "All marks have been cleared.",
      });
    },
    onError: (error: any, variables, context) => {
      // Rollback on error
      if (context?.previousMarks) {
        queryClient.setQueryData(["/api/tick-sheets", activeSheetId, "marks"], context.previousMarks);
      }
      toast({
        title: "Error",
        description: error.message || "Failed to reset tick sheet.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Refetch to ensure we're in sync with server
      queryClient.invalidateQueries({ queryKey: ["/api/tick-sheets", activeSheetId, "marks"] });
    },
  });

  // Set active sheet when sheets are loaded
  useEffect(() => {
    if (activeSheets.length > 0 && !activeSheetId) {
      setActiveSheetId(activeSheets[0].id);
    }
  }, [activeSheets, activeSheetId]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    if (!activeSheetId) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      console.log("WebSocket connected for tick sheet");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === "tick_sheet_update") {
          queryClient.invalidateQueries({ queryKey: ["/api/tick-sheets", activeSheetId, "marks"] });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };

    return () => {
      ws.close();
    };
  }, [activeSheetId]);

  // Filter active artists only (not OUT or Long-Term OUT)
  const activeArtists = artists.filter(a => a.status === 'active');

  const markedArtistIds = new Set(marks.map(m => m.artistId));

  // Filter out marked artists - they disappear when ticked
  const unmarkedArtists = activeArtists.filter(a => !markedArtistIds.has(a.id));

  // Group unmarked artists by their groups
  const groupedArtists = groups.map(group => ({
    group,
    artists: unmarkedArtists.filter(a => a.artistGroupId === group.id),
  })).filter(g => g.artists.length > 0);

  // Unmarked artists without a group
  const ungroupedArtists = unmarkedArtists.filter(a => !a.artistGroupId);

  const handleToggleMark = (artistId: string) => {
    const isMarked = markedArtistIds.has(artistId);
    toggleMarkMutation.mutate({ artistId, isMarked });
  };

  if (isLoadingSheet) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // No active tick sheet - show create button
  if (activeSheets.length === 0) {
    return (
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <Card className="p-12 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">No Active Tick Sheet</h2>
          <p className="text-muted-foreground mb-6">
            Create a new tick sheet to start tracking artist attendance for today's meeting.
          </p>
          <Button
            onClick={() => createSheetMutation.mutate()}
            disabled={createSheetMutation.isPending}
            data-testid="button-create-tick-sheet"
          >
            {createSheetMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create Tick Sheet
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-4xl">
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold mb-2">Tick Sheet</h1>
          <p className="text-muted-foreground">Mark artists present for today's meeting</p>
        </div>
        <Button
          variant="outline"
          onClick={() => resetSheetMutation.mutate()}
          disabled={resetSheetMutation.isPending || marks.length === 0}
          data-testid="button-reset-tick-sheet"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset All
        </Button>
      </div>

      <div className="space-y-6">
        {groupedArtists.map(({ group, artists: groupArtists }) => (
          <Card key={group.id}>
            <CardHeader>
              <CardTitle>{group.name}</CardTitle>
              <CardDescription>
                {groupArtists.length} {groupArtists.length === 1 ? 'artist' : 'artists'} remaining
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {groupArtists.map(artist => (
                <div
                  key={artist.id}
                  data-testid={`row-artist-${artist.id}`}
                  className="flex items-center gap-3 p-3 rounded-md hover-elevate cursor-pointer"
                  onClick={() => handleToggleMark(artist.id)}
                >
                  <Checkbox
                    checked={false}
                    onCheckedChange={() => handleToggleMark(artist.id)}
                    data-testid={`checkbox-artist-${artist.id}`}
                  />
                  <Avatar className="w-10 h-10">
                    {artist.photoUrl ? (
                      <AvatarImage src={artist.photoUrl} alt={getArtistDisplayName(artist)} />
                    ) : null}
                    <AvatarFallback>
                      <UserCircle2 className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{getArtistDisplayName(artist)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {ungroupedArtists.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Other Artists</CardTitle>
              <CardDescription>
                {ungroupedArtists.length} {ungroupedArtists.length === 1 ? 'artist' : 'artists'} remaining
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {ungroupedArtists.map(artist => (
                <div
                  key={artist.id}
                  data-testid={`row-artist-${artist.id}`}
                  className="flex items-center gap-3 p-3 rounded-md hover-elevate cursor-pointer"
                  onClick={() => handleToggleMark(artist.id)}
                >
                  <Checkbox
                    checked={false}
                    onCheckedChange={() => handleToggleMark(artist.id)}
                    data-testid={`checkbox-artist-${artist.id}`}
                  />
                  <Avatar className="w-10 h-10">
                    {artist.photoUrl ? (
                      <AvatarImage src={artist.photoUrl} alt={getArtistDisplayName(artist)} />
                    ) : null}
                    <AvatarFallback>
                      <UserCircle2 className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">{getArtistDisplayName(artist)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {unmarkedArtists.length === 0 && activeArtists.length > 0 && (
          <Card className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-2">All Artists Marked!</h2>
            <p className="text-muted-foreground">Everyone has been ticked off the list.</p>
          </Card>
        )}

        {activeArtists.length === 0 && (
          <Card className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No active artists available</p>
          </Card>
        )}
      </div>
    </div>
  );
}
