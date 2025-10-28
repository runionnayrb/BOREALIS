import { useState } from "react";
import { ChevronLeft, ChevronRight, Download, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";

// Mock full schedule data matching the PDF format
const mockScheduleActivities = {
  "2025-10-29": [ // Wednesday
    {
      id: "1",
      title: "ARTIST CALL - Individual Rehearsal",
      startTime: "09:00",
      endTime: "11:00",
      location: "Pool",
      participants: "Aleksei, Kleber",
      color: "bg-green-500/20 border-green-500",
      type: "rehearsal"
    },
    {
      id: "2",
      title: "COSTUME FITTING",
      startTime: "14:00",
      endTime: "15:30",
      location: "Wardrobe",
      participants: "Martin, Carlos",
      color: "bg-purple-500/20 border-purple-500",
      type: "fitting"
    },
    {
      id: "3",
      title: "ARTIST CALL - Show 21:00",
      startTime: "18:30",
      endTime: "19:30",
      location: "Theatre",
      participants: "Full Cast",
      color: "bg-blue-500/20 border-blue-500",
      type: "call"
    },
    {
      id: "4",
      title: "SHOW #3445",
      startTime: "21:00",
      endTime: "22:30",
      location: "Theatre",
      participants: "Full Cast",
      color: "bg-cyan-500/20 border-cyan-500",
      type: "show"
    },
  ],
  "2025-10-30": [ // Thursday
    {
      id: "5",
      title: "COMPANY MEETING",
      startTime: "10:00",
      endTime: "11:30",
      location: "Green Room",
      participants: "All Staff",
      color: "bg-yellow-500/20 border-yellow-500",
      type: "meeting"
    },
    {
      id: "6",
      title: "DRY STAGE REHEARSAL",
      startTime: "14:00",
      endTime: "17:00",
      location: "Dry Stage",
      participants: "Acrobats Group",
      color: "bg-green-500/20 border-green-500",
      type: "rehearsal"
    },
    {
      id: "7",
      title: "ARTIST CALL - Show 21:00",
      startTime: "18:30",
      endTime: "19:30",
      location: "Theatre",
      participants: "Full Cast",
      color: "bg-blue-500/20 border-blue-500",
      type: "call"
    },
    {
      id: "8",
      title: "SHOW #3446",
      startTime: "21:00",
      endTime: "22:30",
      location: "Theatre",
      participants: "Full Cast",
      color: "bg-cyan-500/20 border-cyan-500",
      type: "show"
    },
  ],
  "2025-10-31": [ // Friday
    {
      id: "9",
      title: "WET REHEARSAL - Desert Flower",
      startTime: "10:00",
      endTime: "12:00",
      location: "Pool",
      participants: "Pearl Girl, Antar, King",
      color: "bg-green-500/20 border-green-500",
      type: "rehearsal"
    },
    {
      id: "10",
      title: "ARTIST CALL - Show 18:00",
      startTime: "16:00",
      endTime: "17:00",
      location: "Theatre",
      participants: "Full Cast",
      color: "bg-blue-500/20 border-blue-500",
      type: "call"
    },
    {
      id: "11",
      title: "SHOW #3447",
      startTime: "18:00",
      endTime: "19:30",
      location: "Theatre",
      participants: "Full Cast",
      color: "bg-cyan-500/20 border-cyan-500",
      type: "show"
    },
    {
      id: "12",
      title: "ARTIST CALL - Show 21:00",
      startTime: "19:30",
      endTime: "20:30",
      location: "Theatre",
      participants: "Full Cast",
      color: "bg-blue-500/20 border-blue-500",
      type: "call"
    },
    {
      id: "13",
      title: "SHOW #3448",
      startTime: "21:00",
      endTime: "22:30",
      location: "Theatre",
      participants: "Full Cast",
      color: "bg-cyan-500/20 border-cyan-500",
      type: "show"
    },
  ],
  "2025-11-01": [ // Saturday
    {
      id: "14",
      title: "ARTIST CALL - Show 18:00",
      startTime: "16:00",
      endTime: "17:00",
      location: "Theatre",
      participants: "Full Cast",
      color: "bg-blue-500/20 border-blue-500",
      type: "call"
    },
    {
      id: "15",
      title: "SHOW #3449",
      startTime: "18:00",
      endTime: "19:30",
      location: "Theatre",
      participants: "Full Cast",
      color: "bg-cyan-500/20 border-cyan-500",
      type: "show"
    },
    {
      id: "16",
      title: "ARTIST CALL - Show 21:00",
      startTime: "19:30",
      endTime: "20:30",
      location: "Theatre",
      participants: "Full Cast",
      color: "bg-blue-500/20 border-blue-500",
      type: "call"
    },
    {
      id: "17",
      title: "SHOW #3450",
      startTime: "21:00",
      endTime: "22:30",
      location: "Theatre",
      participants: "Full Cast",
      color: "bg-cyan-500/20 border-cyan-500",
      type: "show"
    },
  ],
  "2025-11-02": [ // Sunday
    {
      id: "18",
      title: "DAY OFF",
      startTime: "00:00",
      endTime: "23:59",
      location: "",
      participants: "",
      color: "bg-muted/20 border-muted",
      type: "off"
    },
  ],
};

// Generate 15-minute time slots
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

function getActivityPosition(startTime: string, endTime: string) {
  const startMinutes = timeToMinutes(startTime) - timeToMinutes('07:00');
  const duration = timeToMinutes(endTime) - timeToMinutes(startTime);
  const slotWidth = 40; // pixels per 15-minute slot
  
  return {
    left: (startMinutes / 15) * slotWidth,
    width: (duration / 15) * slotWidth,
  };
}

export default function FullSchedule() {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date('2025-10-29'), { weekStartsOn: 3 }) // Week starting Wednesday
  );

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 3 });
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
  const [activeDay, setActiveDay] = useState(format(weekDays[0], 'yyyy-MM-dd'));

  const prevWeek = () => setCurrentWeekStart((prev) => addDays(prev, -7));
  const nextWeek = () => setCurrentWeekStart((prev) => addDays(prev, 7));

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
          <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
            {weekDays.map((day) => (
              <TabsTrigger
                key={day.toISOString()}
                value={format(day, 'yyyy-MM-dd')}
                data-testid={`tab-day-${format(day, 'yyyy-MM-dd')}`}
              >
                <div className="flex flex-col items-center gap-1">
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
                      {/* Time Header */}
                      <div className="flex border-b sticky top-0 bg-card z-10">
                        <div className="w-48 flex-shrink-0 p-4 border-r">
                          <div className="text-sm font-semibold">
                            {format(day, 'EEEE, MMMM d, yyyy')}
                          </div>
                        </div>
                        <div className="flex-1 flex">
                          {timeSlots.filter((_, idx) => idx % 4 === 0).map((time) => (
                            <div
                              key={time}
                              className="min-w-[160px] p-2 border-r text-center"
                            >
                              <div className="text-sm font-semibold">{time}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Timeline */}
                      <ScrollArea className="h-[500px]">
                        <div className="relative" style={{ minHeight: '400px' }}>
                          {/* Time Grid Lines */}
                          <div className="absolute inset-0 flex">
                            <div className="w-48 flex-shrink-0 border-r" />
                            <div className="flex-1 flex">
                              {timeSlots.map((time) => (
                                <div
                                  key={time}
                                  className="min-w-[40px] border-r border-dashed border-border/50"
                                />
                              ))}
                            </div>
                          </div>

                          {/* Activities */}
                          <div className="relative pt-4 pb-4">
                            {dayActivities.map((activity, idx) => {
                              const position = getActivityPosition(activity.startTime, activity.endTime);
                              return (
                                <div
                                  key={activity.id}
                                  className={`absolute border-l-4 rounded-md p-3 ${activity.color}`}
                                  style={{
                                    left: `${192 + position.left}px`, // 192px = w-48 offset
                                    top: `${idx * 80 + 16}px`,
                                    width: `${position.width}px`,
                                    minWidth: '200px',
                                  }}
                                  data-testid={`activity-${activity.id}`}
                                >
                                  <div className="font-semibold text-sm mb-1">
                                    {activity.title}
                                  </div>
                                  <div className="text-xs text-muted-foreground mb-1">
                                    {activity.startTime} - {activity.endTime}
                                  </div>
                                  {activity.location && (
                                    <div className="text-xs text-muted-foreground">
                                      📍 {activity.location}
                                    </div>
                                  )}
                                  {activity.participants && (
                                    <div className="text-xs mt-1">
                                      {activity.participants}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
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
