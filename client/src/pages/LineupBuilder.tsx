import { useState } from "react";
import { ArrowLeft, Download, Save, Users, AlertCircle, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useLocation, useParams } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mock data matching the PDF
const mockShowData = {
  showNumber: "#3445",
  showDate: "2025-10-17",
  showTime: "21:00",
  showcaller: "Pamela",
  notes: "Full Show:\n- Projector 11 is OUT\n- Fixture 3004 is OUT\n\nHeaven/ Bungee Straps:\n- Drystage Bungee Choreo is CUT",
  technicalNotes: "Ladder: 16m\nFinale: 16m",
  diveHeights: {
    ladder: "16 m",
    finale: "16 m",
  },
  emTeam: [
    { role: "DOD", name: "Benoit", location: "" },
    { role: "CFW", name: "Mary", location: "" },
    { role: "PWD", name: "Mo", location: "" },
    { role: "SR PWD", name: "", location: "Vom 4" },
    { role: "CARPS", name: "Shabbir", location: "" },
    { role: "WARD", name: "Rachel", location: "" },
    { role: "RIG", name: "Liam", location: "" },
    { role: "AQX", name: "Dawson", location: "" },
    { role: "SM", name: "Precious", location: "" },
  ],
  outArtists: [
    { name: "Monster", status: "OUT" },
    { name: "Carolina", status: "OUT" },
    { name: "Maiander", status: "OUT" },
  ],
};

const mockScenes = [
  {
    id: "1",
    name: "Show Info",
    positions: [],
  },
  {
    id: "2",
    name: "Prologue / Desert Flower",
    positions: [
      { id: "p1", name: "Pearl Girl", artistName: "Khrystsina", artistNumber: "114", section: "Characters" },
      { id: "p2", name: "Antar", artistName: "Kleber", artistNumber: "115", section: "Characters" },
      { id: "p3", name: "King", artistName: "Martin", artistNumber: "91", section: "Characters" },
      { id: "p4", name: "Clown Prince", artistName: "Carlos", artistNumber: "183", section: "Characters" },
      { id: "p5", name: "Lion Front", artistName: "Phu", artistNumber: "106", section: "Characters" },
      { id: "p6", name: "Lion Back", artistName: "Hung", artistNumber: "24", section: "Characters" },
      { id: "p7", name: "Fisherman", artistName: "Erik", artistNumber: "181", section: "Characters" },
      { id: "p8", name: "King's Guard", artistName: "Aleksei", artistNumber: "158", section: "Characters" },
    ],
  },
  {
    id: "3",
    name: "City",
    positions: [
      { id: "c1", label: "9", artistName: "Alexane", artistNumber: "206", section: "VOM 5 ENTRY" },
      { id: "c2", label: "", artistName: "Alla", artistNumber: "192", section: "VOM 5 ENTRY" },
      { id: "c3", label: "1", artistName: "", artistNumber: "", section: "VOM 5 ENTRY" },
      { id: "c4", label: "10", artistName: "Kirill", artistNumber: "207", section: "DOOR ENTRY" },
      { id: "c5", label: "7", artistName: "Maksym", artistNumber: "87", section: "DOOR ENTRY" },
      { id: "c6", label: "6", artistName: "Pavel", artistNumber: "190", section: "DOOR ENTRY" },
      { id: "c7", label: "", artistName: "Romero", artistNumber: "177", section: "VOM 1 ENTRY" },
      { id: "c8", label: "", artistName: "Ricardo", artistNumber: "187", section: "VOM 1 ENTRY" },
      { id: "c9", label: "", artistName: "Danish", artistNumber: "174", section: "VOM 1 ENTRY" },
      { id: "c10", label: "1", artistName: "Marion", artistNumber: "175", section: "VOM 1 ENTRY" },
      { id: "c11", label: "2", artistName: "Oleksandra", artistNumber: "193", section: "VOM 1 ENTRY" },
      { id: "c12", label: "5", artistName: "Elyor", artistNumber: "130", section: "VOM 1 ENTRY" },
    ],
  },
  {
    id: "4",
    name: "Spaceship / Tower Bridge",
    positions: [
      { id: "s1", label: "1", artistName: "Hung", artistNumber: "24", section: "BICYCLE" },
      { id: "s2", name: "V4 ZOMBIES", artistName: "Phu", artistNumber: "106", section: "ZOMBIES" },
      { id: "s3", name: "V4 ZOMBIES", artistName: "Merayo", artistNumber: "42", section: "ZOMBIES" },
      { id: "s4", name: "V4 ZOMBIES", artistName: "Hung", artistNumber: "24", section: "ZOMBIES" },
      { id: "s5", name: "V4 ZOMBIES", artistName: "Pichichi", artistNumber: "52", section: "ZOMBIES" },
      { id: "s6", name: "V2 ZOMBIES", artistName: "Elyor", artistNumber: "130", section: "ZOMBIES" },
      { id: "s7", name: "V2 ZOMBIES", artistName: "Kirill", artistNumber: "207", section: "ZOMBIES" },
      { id: "s8", name: "V2 ZOMBIES", artistName: "Maksym", artistNumber: "87", section: "ZOMBIES" },
    ],
  },
];

export default function LineupBuilder() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const [activeScene, setActiveScene] = useState(mockScenes[1].id);
  const [draggedArtist, setDraggedArtist] = useState<string | null>(null);

  const selectedScene = mockScenes.find((s) => s.id === activeScene) || mockScenes[0];

  // Group positions by section
  const positionsBySection = selectedScene.positions.reduce((acc, pos) => {
    const section = pos.section || "Other";
    if (!acc[section]) acc[section] = [];
    acc[section].push(pos);
    return acc;
  }, {} as Record<string, typeof selectedScene.positions>);

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/lineups")}
              data-testid="button-back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Show {mockShowData.showNumber}
              </h1>
              <p className="text-muted-foreground mt-1">
                {new Date(mockShowData.showDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })} · {mockShowData.showTime}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" data-testid="button-export">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button data-testid="button-save">
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Lineup View */}
          <div className="lg:col-span-2 space-y-4">
            <Tabs value={activeScene} onValueChange={setActiveScene}>
              <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
                {mockScenes.map((scene) => (
                  <TabsTrigger
                    key={scene.id}
                    value={scene.id}
                    data-testid={`tab-scene-${scene.id}`}
                  >
                    {scene.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {mockScenes.map((scene) => (
                <TabsContent key={scene.id} value={scene.id} className="mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>{scene.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {scene.id === "1" ? (
                        // Show Info Panel
                        <div className="space-y-6">
                          <div>
                            <Label className="text-sm font-semibold mb-2 block">
                              OUT Artists
                            </Label>
                            <div className="flex flex-wrap gap-2">
                              {mockShowData.outArtists.map((artist, idx) => (
                                <Badge key={idx} variant="destructive">
                                  {artist.name}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-semibold mb-2 block">
                              Show Notes
                            </Label>
                            <Textarea
                              value={mockShowData.notes}
                              rows={6}
                              className="font-mono text-sm"
                              data-testid="textarea-show-notes"
                            />
                          </div>

                          <div>
                            <Label className="text-sm font-semibold mb-2 block">
                              Dive Heights
                            </Label>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label className="text-xs text-muted-foreground">Ladder</Label>
                                <Input
                                  value={mockShowData.diveHeights.ladder}
                                  className="mt-1"
                                  data-testid="input-dive-ladder"
                                />
                              </div>
                              <div>
                                <Label className="text-xs text-muted-foreground">Finale</Label>
                                <Input
                                  value={mockShowData.diveHeights.finale}
                                  className="mt-1"
                                  data-testid="input-dive-finale"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Stage Positions Layout
                        <div className="space-y-6">
                          {Object.entries(positionsBySection).map(([section, positions]) => (
                            <div key={section}>
                              <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
                                {section}
                              </h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {positions.map((position) => (
                                  <div
                                    key={position.id}
                                    className="border rounded-lg p-3 hover-elevate transition-all cursor-move bg-card"
                                    data-testid={`position-${position.id}`}
                                    onDragOver={(e) => e.preventDefault()}
                                  >
                                    <div className="flex items-start gap-2">
                                      {position.label && (
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                                          {position.label}
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        {position.name && (
                                          <div className="text-xs font-semibold text-muted-foreground mb-1">
                                            {position.name}
                                          </div>
                                        )}
                                        {position.artistName ? (
                                          <div className="flex items-center gap-2">
                                            <Avatar className="w-6 h-6">
                                              <AvatarFallback className="text-xs">
                                                {position.artistName.split(' ').map(n => n[0]).join('')}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                              <div className="text-sm font-medium truncate">
                                                {position.artistName}
                                              </div>
                                              {position.name && (
                                                <div className="text-xs text-muted-foreground">
                                                  {position.name}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="text-sm text-muted-foreground italic">
                                            Drag artist here
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </div>

          {/* Sidebar - EM Team & Artists */}
          <div className="space-y-4">
            {/* EM Team */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">EM Team</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {mockShowData.emTeam.map((member, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-md border"
                        data-testid={`em-team-${member.role}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-primary">
                            {member.role}
                          </div>
                          <div className="text-sm truncate">
                            {member.name || <span className="text-muted-foreground italic">Unassigned</span>}
                          </div>
                          {member.location && (
                            <div className="text-xs text-muted-foreground">
                              {member.location}
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Settings className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Showcaller */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Showcaller</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-3 rounded-md bg-accent/50">
                  <Avatar>
                    <AvatarFallback>{mockShowData.showcaller[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{mockShowData.showcaller}</div>
                    <div className="text-sm text-muted-foreground">Stage Manager</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Available Artists (for drag-drop) */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Artists</CardTitle>
                  <Badge variant="outline">28 total</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="Search artists..."
                  className="mb-3"
                  data-testid="input-search-artists"
                />
                <ScrollArea className="h-[300px]">
                  <div className="space-y-1">
                    {[
                      { name: "Khrystsina", role: "Pearl Girl" },
                      { name: "Kleber", role: "Antar" },
                      { name: "Martin", role: "King" },
                      { name: "Carlos", role: "Clown Prince" },
                      { name: "Phu", role: "Lion Front" },
                      { name: "Hung", role: "Lion Back" },
                      { name: "Erik", role: "Fisherman" },
                      { name: "Aleksei", role: "King's Guard" }
                    ].map((artist, idx) => (
                      <div
                        key={idx}
                        draggable
                        onDragStart={() => setDraggedArtist(artist.name)}
                        className="flex items-center gap-2 p-2 rounded-md hover-elevate cursor-move transition-all"
                        data-testid={`artist-${artist.name}`}
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {artist.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{artist.name}</div>
                          <div className="text-xs text-muted-foreground">{artist.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
