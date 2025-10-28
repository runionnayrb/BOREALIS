import { useState } from "react";
import { ChevronLeft, ChevronRight, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import type { Location } from "@shared/schema";

// Mock full schedule data matching the PDF format
const mockScheduleActivities = {
  "2025-10-29": [ // Wednesday
    {
      id: "1",
      title: "Individual Rehearsal",
      startTime: "09:00",
      endTime: "11:00",
      locationName: "Pool",
      participants: "Aleksei, Kleber",
      color: "bg-green-500/20 border-green-500",
      type: "rehearsal"
    },
    {
      id: "2",
      title: "Costume Fitting",
      startTime: "14:00",
      endTime: "15:30",
      locationName: "B2 Wardrobe",
      participants: "Martin, Carlos",
      color: "bg-purple-500/20 border-purple-500",
      type: "fitting"
    },
    {
      id: "3",
      title: "Artist Call",
      startTime: "18:30",
      endTime: "19:30",
      locationName: "FULL STAGE",
      participants: "Full Cast",
      color: "bg-blue-500/20 border-blue-500",
      type: "call"
    },
    {
      id: "4",
      title: "SHOW #3445",
      startTime: "21:00",
      endTime: "22:30",
      locationName: "FULL STAGE",
      participants: "Full Cast",
      color: "bg-cyan-500/20 border-cyan-500",
      type: "show"
    },
  ],
  "2025-10-30": [ // Thursday
    {
      id: "5",
      title: "Company Meeting",
      startTime: "10:00",
      endTime: "11:30",
      locationName: "B2 Stage Management",
      participants: "All Staff",
      color: "bg-yellow-500/20 border-yellow-500",
      type: "meeting"
    },
    {
      id: "6",
      title: "Dry Stage Rehearsal",
      startTime: "14:00",
      endTime: "17:00",
      locationName: "Drystage",
      participants: "Acrobats Group",
      color: "bg-green-500/20 border-green-500",
      type: "rehearsal"
    },
    {
      id: "7",
      title: "Artist Call",
      startTime: "18:30",
      endTime: "19:30",
      locationName: "FULL STAGE",
      participants: "Full Cast",
      color: "bg-blue-500/20 border-blue-500",
      type: "call"
    },
    {
      id: "8",
      title: "SHOW #3446",
      startTime: "21:00",
      endTime: "22:30",
      locationName: "FULL STAGE",
      participants: "Full Cast",
      color: "bg-cyan-500/20 border-cyan-500",
      type: "show"
    },
  ],
  "2025-10-31": [ // Friday
    {
      id: "9",
      title: "Wet Rehearsal - Desert Flower",
      startTime: "10:00",
      endTime: "12:00",
      locationName: "Pool",
      participants: "Pearl Girl, Antar, King",
      color: "bg-green-500/20 border-green-500",
      type: "rehearsal"
    },
    {
      id: "10",
      title: "Artist Call",
      startTime: "16:00",
      endTime: "17:00",
      locationName: "FULL STAGE",
      participants: "Full Cast",
      color: "bg-blue-500/20 border-blue-500",
      type: "call"
    },
    {
      id: "11",
      title: "SHOW #3447",
      startTime: "18:00",
      endTime: "19:30",
      locationName: "FULL STAGE",
      participants: "Full Cast",
      color: "bg-cyan-500/20 border-cyan-500",
      type: "show"
    },
    {
      id: "12",
      title: "Artist Call",
      startTime: "19:30",
      endTime: "20:30",
      locationName: "FULL STAGE",
      participants: "Full Cast",
      color: "bg-blue-500/20 border-blue-500",
      type: "call"
    },
    {
      id: "13",
      title: "SHOW #3448",
      startTime: "21:00",
      endTime: "22:30",
      locationName: "FULL STAGE",
      participants: "Full Cast",
      color: "bg-cyan-500/20 border-cyan-500",
      type: "show"
    },
  ],
  "2025-11-01": [ // Saturday
    {
      id: "14",
      title: "Artist Call",
      startTime: "16:00",
      endTime: "17:00",
      locationName: "FULL STAGE",
      participants: "Full Cast",
      color: "bg-blue-500/20 border-blue-500",
      type: "call"
    },
    {
      id: "15",
      title: "SHOW #3449",
      startTime: "18:00",
      endTime: "19:30",
      locationName: "FULL STAGE",
      participants: "Full Cast",
      color: "bg-cyan-500/20 border-cyan-500",
      type: "show"
    },
    {
      id: "16",
      title: "Artist Call",
      startTime: "19:30",
      endTime: "20:30",
      locationName: "FULL STAGE",
      participants: "Full Cast",
      color: "bg-blue-500/20 border-blue-500",
      type: "call"
    },
    {
      id: "17",
      title: "SHOW #3450",
      startTime: "21:00",
      endTime: "22:30",
      locationName: "FULL STAGE",
      participants: "Full Cast",
      color: "bg-cyan-500/20 border-cyan-500",
      type: "show"
    },
  ],
  "2025-11-02": [ // Sunday
  ],
};

// Generate time slots based on increment
const generateTimeSlots = (increment: number) => {
  const slots: string[] = [];
  for (let hour = 7; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += increment) {
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      slots.push(time);
    }
  }
  return slots;
};

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function getActivityPosition(startTime: string, endTime: string, increment: number) {
  const startMinutes = timeToMinutes(startTime) - timeToMinutes('07:00');
  const duration = timeToMinutes(endTime) - timeToMinutes(startTime);
  const slotWidth = 40; // pixels per slot
  
  return {
    left: (startMinutes / increment) * slotWidth,
    width: (duration / increment) * slotWidth,
  };
}

export default function FullSchedule() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date('2025-10-29'), { weekStartsOn: 3 }) // Week starting Wednesday
  );
  const [timeIncrement, setTimeIncrement] = useState(15); // 15, 30, or 60 minutes

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 3 });
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
  const [activeDay, setActiveDay] = useState(format(weekDays[0], 'yyyy-MM-dd'));

  const prevWeek = () => setCurrentWeekStart((prev) => addDays(prev, -7));
  const nextWeek = () => setCurrentWeekStart((prev) => addDays(prev, 7));
  
  const timeSlots = generateTimeSlots(timeIncrement);

  // Fetch locations from database
  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const activeDayActivities = mockScheduleActivities[activeDay as keyof typeof mockScheduleActivities] || [];

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Full Schedule</h1>
            <p className="text-muted-foreground mt-1">
              {format(currentWeekStart, 'MMMM d')} - {format(weekEnd, 'MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 border rounded-lg p-1">
              <Button
                variant={timeIncrement === 15 ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeIncrement(15)}
                data-testid="button-increment-15"
              >
                15 min
              </Button>
              <Button
                variant={timeIncrement === 30 ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeIncrement(30)}
                data-testid="button-increment-30"
              >
                30 min
              </Button>
              <Button
                variant={timeIncrement === 60 ? "default" : "ghost"}
                size="sm"
                onClick={() => setTimeIncrement(60)}
                data-testid="button-increment-60"
              >
                60 min
              </Button>
            </div>
            <Button variant="outline" data-testid="button-export-full-schedule">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button data-testid="button-new-activity">
              <Plus className="w-4 h-4 mr-2" />
              Add Activity
            </Button>
          </div>
        </div>

        {/* Week Navigator */}
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={prevWeek}
            data-testid="button-prev-week-full"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Badge variant="outline" className="text-base px-4 py-2">
            Week 44
          </Badge>
          <Button
            variant="outline"
            size="icon"
            onClick={nextWeek}
            data-testid="button-next-week-full"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Day Tabs */}
        <Tabs value={activeDay} onValueChange={setActiveDay}>
          <TabsList className="w-full grid grid-cols-7 gap-1 h-auto bg-transparent p-0">
            {weekDays.map((day) => (
              <TabsTrigger
                key={day.toISOString()}
                value={format(day, 'yyyy-MM-dd')}
                className="flex-1 hover-elevate transition-all"
                data-testid={`tab-day-${format(day, 'yyyy-MM-dd')}`}
              >
                <div className="flex flex-col items-center gap-1 py-2">
                  <div className="text-xs font-semibold">
                    {format(day, 'EEE')}
                  </div>
                  <div className="text-sm">
                    {format(day, 'MMM d')}
                  </div>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {weekDays.map((day) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const dayActivities = mockScheduleActivities[dayStr as keyof typeof mockScheduleActivities] || [];

            return (
              <TabsContent key={dayStr} value={dayStr} className="mt-4">
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      {/* Header Row - Date and Time Slots */}
                      <div className="flex border-b sticky top-0 bg-card z-10">
                        <div className="w-48 flex-shrink-0 p-3 border-r">
                          <div className="text-sm font-semibold">
                            {format(day, 'EEEE')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {format(day, 'MMMM d, yyyy')}
                          </div>
                        </div>
                        <div className="flex" style={{ minWidth: `${timeSlots.length * 40}px` }}>
                          {timeSlots.filter((_, idx) => {
                            // Show hourly labels regardless of increment
                            if (timeIncrement === 15) return idx % 4 === 0; // Every hour (4 x 15min)
                            if (timeIncrement === 30) return idx % 2 === 0; // Every hour (2 x 30min)
                            return true; // Every slot for 60min
                          }).map((time) => {
                            const slotWidth = timeIncrement === 15 ? 160 : timeIncrement === 30 ? 80 : 40;
                            return (
                              <div
                                key={time}
                                className="p-2 border-r text-center"
                                style={{ minWidth: `${slotWidth}px` }}
                              >
                                <div className="text-xs font-semibold">{time}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Location Rows */}
                      <ScrollArea className="h-[600px]">
                        {locations.map((location) => {
                          const locationActivities = dayActivities.filter(
                            (act) => act.locationName === location.name
                          );

                          // Calculate row height based on content
                          const rowHeight = locationActivities.length > 0 ? 'auto' : '60px';
                          
                          return (
                            <div key={location.id} className="flex border-b hover:bg-accent/50 transition-colors" style={{ minHeight: rowHeight }}>
                              {/* Location Name */}
                              <div className="w-48 flex-shrink-0 p-3 border-r bg-muted/30">
                                <div className="text-sm font-medium">
                                  {location.name}
                                </div>
                              </div>

                              {/* Time Grid */}
                              <div className="relative py-2" style={{ minHeight: rowHeight, minWidth: `${timeSlots.length * 40}px` }}>
                                {/* Grid Lines */}
                                <div className="absolute inset-0 flex">
                                  {timeSlots.map((time) => (
                                    <div
                                      key={time}
                                      className="border-r border-dashed border-border/30"
                                      style={{ minWidth: '40px' }}
                                    />
                                  ))}
                                </div>

                                {/* Activities for this location */}
                                {locationActivities.map((activity) => {
                                  const position = getActivityPosition(activity.startTime, activity.endTime, timeIncrement);
                                  return (
                                    <div
                                      key={activity.id}
                                      className={`absolute border-l-4 rounded-md p-2 ${activity.color} my-1`}
                                      style={{
                                        left: `${position.left}px`,
                                        width: `${position.width}px`,
                                        minWidth: '120px',
                                      }}
                                      data-testid={`activity-${activity.id}`}
                                    >
                                      <div className="font-semibold text-xs mb-1 truncate">
                                        {activity.title}
                                      </div>
                                      <div className="text-xs text-muted-foreground truncate">
                                        {activity.startTime} - {activity.endTime}
                                      </div>
                                      {activity.participants && (
                                        <div className="text-xs mt-1 truncate">
                                          {activity.participants}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </ScrollArea>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="text-sm font-semibold">Activity Types:</div>
          <Badge variant="outline" className="bg-cyan-500/20 border-cyan-500">Show</Badge>
          <Badge variant="outline" className="bg-blue-500/20 border-blue-500">Artist Call</Badge>
          <Badge variant="outline" className="bg-green-500/20 border-green-500">Rehearsal</Badge>
          <Badge variant="outline" className="bg-purple-500/20 border-purple-500">Fitting</Badge>
          <Badge variant="outline" className="bg-yellow-500/20 border-yellow-500">Meeting</Badge>
        </div>
      </div>
    </div>
  );
}
