import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserCircle2, CheckCircle, XCircle, LogOut, Calendar, ClipboardCheck } from "lucide-react";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, getWeek } from "date-fns";
import { Link } from "wouter";
import type { Artist } from "@shared/schema";

interface AttendanceRecord {
  artistId: string;
  date: string;
  signInTime: string | null;
  signOutTime: string | null;
  signedInBy: string;
  latitude: number;
  longitude: number;
  isLate?: boolean; // Server-provided flag for late sign-ins (after 17:00 Dubai time)
}

interface AttendanceStatus {
  artist: Artist;
  record: AttendanceRecord | null;
  isSignedIn: boolean;
}

interface WeekRecord {
  artist: Artist;
  records: (AttendanceRecord | null)[];
}

function getArtistDisplayName(artist: Artist): string {
  return artist.preferredName || `${artist.firstName} ${artist.lastName}`;
}

export default function AttendanceDashboard() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const { toast } = useToast();

  const { data: todayStatus = [], isLoading: isLoadingToday } = useQuery<AttendanceStatus[]>({
    queryKey: ["/api/attendance/today"],
  });

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
  const weekStartFormatted = format(currentWeekStart, 'yyyy-MM-dd');
  const weekEndFormatted = format(weekEnd, 'yyyy-MM-dd');

  const { data: weekRecords = [], isLoading: isLoadingWeek } = useQuery<WeekRecord[]>({
    queryKey: ["/api/attendance/week", weekStartFormatted, weekEndFormatted],
    queryFn: async () => {
      const response = await fetch(
        `/api/attendance/week?startDate=${weekStartFormatted}&endDate=${weekEndFormatted}`,
        { credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch week records");
      return response.json();
    },
  });

  const manualSignOutMutation = useMutation({
    mutationFn: async (artistId: string) => {
      return apiRequest("POST", "/api/attendance/manual-sign-out", { artistId });
    },
    onSuccess: () => {
      toast({
        title: "Signed Out",
        description: "Artist has been manually signed out.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/today"], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/week"], refetchType: 'all' });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to sign out artist.",
        variant: "destructive",
      });
    },
  });

  const manualSignInMutation = useMutation({
    mutationFn: async (artistId: string) => {
      return apiRequest("POST", "/api/attendance/manual-sign-in", { artistId });
    },
    onSuccess: () => {
      toast({
        title: "Signed In",
        description: "Artist has been manually signed in.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/today"], refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/week"], refetchType: 'all' });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in artist.",
        variant: "destructive",
      });
    },
  });

  // WebSocket connection for real-time updates
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      console.log("WebSocket connected for attendance dashboard");
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === "attendance_update" || message.type === "artist_status_update") {
          queryClient.invalidateQueries({ queryKey: ["/api/attendance/today"], refetchType: 'all' });
          queryClient.invalidateQueries({ queryKey: ["/api/attendance/week"], refetchType: 'all' });
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
  }, []);

  const signedInArtists = todayStatus
    .filter(s => s.isSignedIn && s.artist.status === "active")
    .sort((a, b) => getArtistDisplayName(a.artist).localeCompare(getArtistDisplayName(b.artist)));
  
  const signedOutArtists = todayStatus
    .filter(s => !s.isSignedIn && s.artist.status === "active")
    .sort((a, b) => getArtistDisplayName(a.artist).localeCompare(getArtistDisplayName(b.artist)));
  
  const outArtists = todayStatus
    .filter(s => s.artist.status === "out")
    .sort((a, b) => getArtistDisplayName(a.artist).localeCompare(getArtistDisplayName(b.artist)));
  
  const longTermOutArtists = todayStatus
    .filter(s => s.artist.status === "long_term_out")
    .sort((a, b) => getArtistDisplayName(a.artist).localeCompare(getArtistDisplayName(b.artist)));

  const handlePreviousWeek = () => {
    setCurrentWeekStart(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => addWeeks(prev, 1));
  };

  const handleThisWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  if (isLoadingToday) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Attendance Dashboard</h1>
        <p className="text-muted-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
      </div>

      <Tabs defaultValue="today" className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <TabsList data-testid="tabs-dashboard">
            <TabsTrigger value="today" data-testid="tab-today">
              <CheckCircle className="w-4 h-4 mr-2" />
              Today
            </TabsTrigger>
            <TabsTrigger value="week" data-testid="tab-week">
              <Calendar className="w-4 h-4 mr-2" />
              Week View
            </TabsTrigger>
          </TabsList>
          <Button asChild data-testid="button-tick-off">
            <Link href="/attendance/tickoff" className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" />
              Tick Off
            </Link>
          </Button>
        </div>

        <TabsContent value="today" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Signed In</CardTitle>
                <CheckCircle className="w-4 h-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-signed-in-count">{signedInArtists.length}</div>
                <p className="text-xs text-muted-foreground">Currently on site</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Signed Out</CardTitle>
                <XCircle className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-signed-out-count">{signedOutArtists.length}</div>
                <p className="text-xs text-muted-foreground">Not on site</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">OUT</CardTitle>
                <XCircle className="w-4 h-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-out-count">{outArtists.length}</div>
                <p className="text-xs text-muted-foreground">Out of the Show</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Long-Term OUT</CardTitle>
                <XCircle className="w-4 h-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-long-term-out-count">{longTermOutArtists.length}</div>
                <p className="text-xs text-muted-foreground">Extended absence</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Signed In Artists</CardTitle>
                <CardDescription>{signedInArtists.length} artists currently on site</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {signedInArtists.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No artists signed in</p>
                ) : (
                  signedInArtists.map(status => (
                    <div
                      key={status.artist.id}
                      data-testid={`row-signed-in-${status.artist.id}`}
                      className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          {status.artist.photoUrl ? (
                            <AvatarImage src={status.artist.photoUrl} alt={getArtistDisplayName(status.artist)} />
                          ) : null}
                          <AvatarFallback>
                            <UserCircle2 className="w-6 h-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{getArtistDisplayName(status.artist)}</p>
                          {status.record?.signInTime && (
                            <p className="text-xs text-muted-foreground">
                              Signed in at {new Date(status.record.signInTime).toLocaleTimeString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => manualSignOutMutation.mutate(status.artist.id)}
                        disabled={manualSignOutMutation.isPending}
                        data-testid={`button-sign-out-${status.artist.id}`}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Signed Out Artists</CardTitle>
                <CardDescription>{signedOutArtists.length} artists not on site</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {signedOutArtists.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">All artists signed in</p>
                ) : (
                  signedOutArtists.map(status => (
                    <div
                      key={status.artist.id}
                      data-testid={`row-signed-out-${status.artist.id}`}
                      className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          {status.artist.photoUrl ? (
                            <AvatarImage src={status.artist.photoUrl} alt={getArtistDisplayName(status.artist)} />
                          ) : null}
                          <AvatarFallback>
                            <UserCircle2 className="w-6 h-6" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{getArtistDisplayName(status.artist)}</p>
                          {status.record?.signOutTime ? (
                            <p className="text-xs text-muted-foreground">
                              Signed out at {new Date(status.record.signOutTime).toLocaleTimeString()}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">Not signed in today</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => manualSignInMutation.mutate(status.artist.id)}
                        disabled={manualSignInMutation.isPending}
                        data-testid={`button-sign-in-${status.artist.id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Sign In
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>OUT Artists</CardTitle>
                <CardDescription>{outArtists.length} artists Out of the Show</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {outArtists.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No artists marked as OUT</p>
                ) : (
                  outArtists.map(status => (
                    <div
                      key={status.artist.id}
                      data-testid={`row-out-${status.artist.id}`}
                      className="flex items-center gap-3 p-3 rounded-md bg-orange-500/10 border border-orange-500/20"
                    >
                      <Avatar className="w-10 h-10">
                        {status.artist.photoUrl ? (
                          <AvatarImage src={status.artist.photoUrl} alt={getArtistDisplayName(status.artist)} />
                        ) : null}
                        <AvatarFallback>
                          <UserCircle2 className="w-6 h-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{getArtistDisplayName(status.artist)}</p>
                        <p className="text-xs text-muted-foreground">Out of the Show</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Long-Term OUT Artists</CardTitle>
                <CardDescription>{longTermOutArtists.length} artists on extended absence</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {longTermOutArtists.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No artists marked as Long-Term OUT</p>
                ) : (
                  longTermOutArtists.map(status => (
                    <div
                      key={status.artist.id}
                      data-testid={`row-long-term-out-${status.artist.id}`}
                      className="flex items-center gap-3 p-3 rounded-md bg-red-500/10 border border-red-500/20"
                    >
                      <Avatar className="w-10 h-10">
                        {status.artist.photoUrl ? (
                          <AvatarImage src={status.artist.photoUrl} alt={getArtistDisplayName(status.artist)} />
                        ) : null}
                        <AvatarFallback>
                          <UserCircle2 className="w-6 h-6" />
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{getArtistDisplayName(status.artist)}</p>
                        <p className="text-xs text-muted-foreground">Extended absence</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="week" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <CardTitle>Weekly Attendance</CardTitle>
                  <CardDescription>
                    Week {getWeek(currentWeekStart)}: {format(currentWeekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handlePreviousWeek} data-testid="button-prev-week">
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleThisWeek} data-testid="button-this-week">
                    This Week
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleNextWeek} data-testid="button-next-week">
                    Next
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingWeek ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-border" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium">Artist</th>
                        {weekDays.map((day, i) => (
                          <th key={i} className="text-center p-2 font-medium min-w-[80px]">
                            <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
                            <div>{format(day, 'd')}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {weekRecords
                        .filter(weekRecord => weekRecord?.artist?.id)
                        .sort((a, b) => getArtistDisplayName(a.artist).localeCompare(getArtistDisplayName(b.artist)))
                        .map(weekRecord => (
                        <tr key={weekRecord.artist.id} className="border-b" data-testid={`row-week-${weekRecord.artist.id}`}>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="w-8 h-8">
                                {weekRecord.artist.photoUrl ? (
                                  <AvatarImage src={weekRecord.artist.photoUrl} alt={getArtistDisplayName(weekRecord.artist)} />
                                ) : null}
                                <AvatarFallback>
                                  <UserCircle2 className="w-4 h-4" />
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">{getArtistDisplayName(weekRecord.artist)}</span>
                            </div>
                          </td>
                          {weekRecord.records.map((record, i) => {
                            return (
                              <td key={i} className="text-center p-2">
                                {record && record.signInTime ? (
                                  record.isLate ? (
                                    <Badge variant="destructive" className="text-xs" data-testid={`badge-late-${weekRecord.artist.id}-${i}`}>
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Late
                                    </Badge>
                                  ) : (
                                    <Badge variant="default" className="text-xs" data-testid={`badge-present-${weekRecord.artist.id}-${i}`}>
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Present
                                    </Badge>
                                  )
                                ) : (
                                  <Badge variant="outline" className="text-xs" data-testid={`badge-absent-${weekRecord.artist.id}-${i}`}>
                                    <XCircle className="w-3 h-3 mr-1" />
                                    Absent
                                  </Badge>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
