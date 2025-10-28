import { useState } from "react";
import { ChevronLeft, ChevronRight, Download, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, eachDayOfInterval, getWeek } from "date-fns";

// Mock schedule data
const mockArtists = [
  { id: "1", name: "Khrystsina", role: "Pearl Girl" },
  { id: "2", name: "Kleber", role: "Antar" },
  { id: "3", name: "Martin", role: "King" },
  { id: "4", name: "Carlos", role: "Clown Prince" },
  { id: "5", name: "Phu", role: "Lion Front" },
  { id: "6", name: "Hung", role: "Lion Back" },
  { id: "7", name: "Erik", role: "Fisherman" },
  { id: "8", name: "Aleksei", role: "King's Guard" },
];

const mockCalls = [
  {
    artistId: "1",
    date: "2025-10-29",
    startTime: "18:30",
    endTime: "23:00",
    title: "Show 21:00",
    callType: "show",
    color: "bg-blue-500/20 border-blue-500/50",
  },
  {
    artistId: "1",
    date: "2025-10-30",
    startTime: "18:30",
    endTime: "23:00",
    title: "Show 21:00",
    callType: "show",
    color: "bg-blue-500/20 border-blue-500/50",
  },
  {
    artistId: "2",
    date: "2025-10-29",
    startTime: "09:00",
    endTime: "11:00",
    title: "Dry Rehearsal",
    callType: "rehearsal",
    color: "bg-green-500/20 border-green-500/50",
  },
  {
    artistId: "2",
    date: "2025-10-29",
    startTime: "18:30",
    endTime: "23:00",
    title: "Show 21:00",
    callType: "show",
    color: "bg-blue-500/20 border-blue-500/50",
  },
  {
    artistId: "3",
    date: "2025-10-29",
    startTime: "14:00",
    endTime: "15:00",
    title: "Costume Fitting",
    callType: "fitting",
    color: "bg-purple-500/20 border-purple-500/50",
  },
  {
    artistId: "3",
    date: "2025-10-29",
    startTime: "18:30",
    endTime: "23:00",
    title: "Show 21:00",
    callType: "show",
    color: "bg-blue-500/20 border-blue-500/50",
  },
  {
    artistId: "4",
    date: "2025-10-30",
    startTime: "10:00",
    endTime: "11:30",
    title: "Company Meeting",
    callType: "meeting",
    color: "bg-yellow-500/20 border-yellow-500/50",
  },
  {
    artistId: "5",
    date: "2025-10-29",
    startTime: "18:30",
    endTime: "23:00",
    title: "Show 21:00",
    callType: "show",
    color: "bg-blue-500/20 border-blue-500/50",
  },
  {
    artistId: "5",
    date: "2025-10-31",
    startTime: "16:00",
    endTime: "20:30",
    title: "Show 18:00",
    callType: "show",
    color: "bg-blue-500/20 border-blue-500/50",
  },
];

// Generate 15-minute time slots from 7:00 to 23:45
const generateTimeSlots = () => {
  const slots: string[] = [];
  for (let hour = 7; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(time);
    }
  }
  return slots;
};

const timeSlots = generateTimeSlots();

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function getCallPosition(startTime: string, endTime: string) {
  const startMinutes = timeToMinutes(startTime) - timeToMinutes('07:00');
  const duration = timeToMinutes(endTime) - timeToMinutes(startTime);
  const slotHeight = 20; // pixels per 15-minute slot
  
  return {
    top: (startMinutes / 15) * slotHeight,
    height: (duration / 15) * slotHeight,
  };
}

export default function WeeklySchedule() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date('2025-10-29'), { weekStartsOn: 3 }) // Week starting Wednesday
  );

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 3 });
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
  const weekNumber = getWeek(currentWeekStart);

  const prevWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const nextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Weekly Schedule</h1>
            <p className="text-muted-foreground mt-1">
              Week {weekNumber} · {format(currentWeekStart, 'MMMM d')} - {format(weekEnd, 'MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" data-testid="button-export-schedule">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button data-testid="button-new-call">
              <Plus className="w-4 h-4 mr-2" />
              Add Call
            </Button>
          </div>
        </div>

        {/* Week Navigator */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={prevWeek}
            data-testid="button-prev-week"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Badge variant="outline" className="text-base px-4 py-2">
            Week {weekNumber}
          </Badge>
          <Button
            variant="outline"
            size="icon"
            onClick={nextWeek}
            data-testid="button-next-week"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Schedule Grid */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                {/* Header Row - Days */}
                <div className="flex border-b sticky top-0 bg-card z-10">
                  <div className="w-40 flex-shrink-0 p-4 border-r">
                    <div className="text-sm font-semibold">Artist</div>
                  </div>
                  {weekDays.map((day) => (
                    <div
                      key={day.toISOString()}
                      className="flex-1 min-w-[150px] p-4 border-r last:border-r-0"
                    >
                      <div className="text-sm font-semibold">
                        {format(day, 'EEE')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(day, 'MMM d')}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Artist Rows */}
                <ScrollArea className="h-[600px]">
                  {mockArtists.map((artist) => (
                    <div key={artist.id} className="flex border-b hover:bg-accent/50 transition-colors">
                      {/* Artist Name */}
                      <div className="w-40 flex-shrink-0 p-4 border-r">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="text-xs">
                              {artist.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                              {artist.name}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {artist.role}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Day Cells */}
                      {weekDays.map((day) => {
                        const dayStr = format(day, 'yyyy-MM-dd');
                        const calls = mockCalls.filter(
                          (call) => call.artistId === artist.id && call.date === dayStr
                        );

                        return (
                          <div
                            key={day.toISOString()}
                            className="flex-1 min-w-[150px] p-2 border-r last:border-r-0 relative min-h-[80px]"
                          >
                            <div className="space-y-1">
                              {calls.map((call, idx) => (
                                <div
                                  key={idx}
                                  className={`p-2 rounded border text-xs ${call.color}`}
                                  data-testid={`call-${artist.id}-${dayStr}-${idx}`}
                                >
                                  <div className="font-semibold truncate">{call.title}</div>
                                  <div className="text-muted-foreground">
                                    {call.startTime} - {call.endTime}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-sm font-semibold">Call Types:</div>
          <Badge variant="outline" className="bg-blue-500/20 border-blue-500/50">Show</Badge>
          <Badge variant="outline" className="bg-green-500/20 border-green-500/50">Rehearsal</Badge>
          <Badge variant="outline" className="bg-purple-500/20 border-purple-500/50">Fitting</Badge>
          <Badge variant="outline" className="bg-yellow-500/20 border-yellow-500/50">Meeting</Badge>
        </div>
      </div>
    </div>
  );
}
