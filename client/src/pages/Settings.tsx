import { useState } from "react";
import { Plus, Users, Briefcase, Theater, UsersRound, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DraggableList from "@/components/DraggableList";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ReportHeader from "@/components/ReportHeader";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("acts");

  //todo: remove mock functionality
  const [acts, setActs] = useState<Array<{ id: string; content: React.ReactNode }>>([
    { id: '1', content: <Card className="p-3 flex-1"><p className="font-medium">High Dive</p></Card> },
    { id: '2', content: <Card className="p-3 flex-1"><p className="font-medium">Wheel</p></Card> },
    { id: '3', content: <Card className="p-3 flex-1"><p className="font-medium">House Sync</p></Card> },
    { id: '4', content: <Card className="p-3 flex-1"><p className="font-medium">Finale</p></Card> },
  ]);

  const [departments, setDepartments] = useState<Array<{ id: string; content: React.ReactNode }>>([
    { id: '1', content: <Card className="p-3 flex-1"><p className="font-medium">Rigging</p></Card> },
    { id: '2', content: <Card className="p-3 flex-1"><p className="font-medium">Automation</p></Card> },
    { id: '3', content: <Card className="p-3 flex-1"><p className="font-medium">Lighting</p></Card> },
    { id: '4', content: <Card className="p-3 flex-1"><p className="font-medium">Sound</p></Card> },
  ]);

  const [artistGroups, setArtistGroups] = useState<Array<{ id: string; content: React.ReactNode }>>([
    { id: '1', content: <Card className="p-3 flex-1"><p className="font-medium">Flyers</p></Card> },
    { id: '2', content: <Card className="p-3 flex-1"><p className="font-medium">Divers</p></Card> },
    { id: '3', content: <Card className="p-3 flex-1"><p className="font-medium">Wheel Team</p></Card> },
  ]);

  const [leftImage, setLeftImage] = useState("");
  const [title, setTitle] = useState("Training Report");
  const [rightImage, setRightImage] = useState("");

  return (
    <div className="flex-1 overflow-auto pb-20 md:pb-4">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage acts, departments, artists, technicians, and report template
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="report-template" data-testid="tab-report-template">
              <FileText className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Template</span>
            </TabsTrigger>
            <TabsTrigger value="acts" data-testid="tab-acts">
              <Theater className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Acts</span>
            </TabsTrigger>
            <TabsTrigger value="departments" data-testid="tab-departments">
              <Briefcase className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Departments</span>
            </TabsTrigger>
            <TabsTrigger value="artist-groups" data-testid="tab-artist-groups">
              <UsersRound className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Groups</span>
            </TabsTrigger>
            <TabsTrigger value="people" data-testid="tab-people">
              <Users className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">People</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="report-template" className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-2">Report Template</h2>
              <p className="text-sm text-muted-foreground mb-4">
                This header design will be used for all training reports
              </p>
              <ReportHeader
                leftImageUrl={leftImage}
                middleTitle={title}
                rightImageUrl={rightImage}
                dateString="Thursday, October 9, 2025"
                onLeftImageChange={setLeftImage}
                onMiddleTitleChange={setTitle}
                onRightImageChange={setRightImage}
              />
              <div className="mt-4">
                <Button data-testid="button-save-template">
                  Save Template
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="acts" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Acts</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-act">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Act
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Act</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="act-name">Act Name</Label>
                      <Input
                        id="act-name"
                        placeholder="Enter act name"
                        data-testid="input-act-name"
                      />
                    </div>
                    <Button className="w-full" data-testid="button-save-act">
                      Save Act
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <DraggableList items={acts} onReorder={setActs} />
          </TabsContent>

          <TabsContent value="departments" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Departments</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-department">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Department
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Department</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="dept-name">Department Name</Label>
                      <Input
                        id="dept-name"
                        placeholder="Enter department name"
                        data-testid="input-department-name"
                      />
                    </div>
                    <Button className="w-full" data-testid="button-save-department">
                      Save Department
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <DraggableList items={departments} onReorder={setDepartments} />
          </TabsContent>

          <TabsContent value="artist-groups" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Artist Groups</h2>
              <Dialog>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-artist-group">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Group
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Artist Group</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="group-name">Group Name</Label>
                      <Input
                        id="group-name"
                        placeholder="Enter group name"
                        data-testid="input-group-name"
                      />
                    </div>
                    <Button className="w-full" data-testid="button-save-group">
                      Save Group
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <DraggableList items={artistGroups} onReorder={setArtistGroups} />
          </TabsContent>

          <TabsContent value="people" className="space-y-4">
            <Tabs defaultValue="artists">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="artists">Artists</TabsTrigger>
                <TabsTrigger value="technicians">Technicians</TabsTrigger>
              </TabsList>
              <TabsContent value="artists" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Artists</h2>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button data-testid="button-add-artist">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Artist
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Artist</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>First Name</Label>
                            <Input placeholder="First name" data-testid="input-artist-firstname" />
                          </div>
                          <div className="space-y-2">
                            <Label>Last Name</Label>
                            <Input placeholder="Last name" data-testid="input-artist-lastname" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Stage Name (Optional)</Label>
                          <Input placeholder="Stage name" data-testid="input-artist-stagename" />
                        </div>
                        <Button className="w-full" data-testid="button-save-artist">
                          Save Artist
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </TabsContent>
              <TabsContent value="technicians" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Technicians</h2>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button data-testid="button-add-technician">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Technician
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Technician</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>First Name</Label>
                            <Input placeholder="First name" data-testid="input-tech-firstname" />
                          </div>
                          <div className="space-y-2">
                            <Label>Last Name</Label>
                            <Input placeholder="Last name" data-testid="input-tech-lastname" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Role (Optional)</Label>
                          <Input placeholder="Role" data-testid="input-tech-role" />
                        </div>
                        <Button className="w-full" data-testid="button-save-technician">
                          Save Technician
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
