import { useState, useEffect } from "react";
import { Plus, Users, Briefcase, Theater, UsersRound, FileText, MapPin, Trash2, Edit, Settings as SettingsIcon, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ReportHeader from "@/components/ReportHeader";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { 
  Act, Department, LocationType, Location, ArtistGroup, Artist, Technician, ReportTemplate, SafeUser 
} from "@shared/schema";

type SimpleItem = {
  id: string;
  name: string;
  sortOrder: number;
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState("acts");
  const [actDialogOpen, setActDialogOpen] = useState(false);
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [locationTypeDialogOpen, setLocationTypeDialogOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [artistDialogOpen, setArtistDialogOpen] = useState(false);
  const [techDialogOpen, setTechDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null);
  const [editTarget, setEditTarget] = useState<{ type: string; id: string; data: any } | null>(null);
  const [selectedLocationTypeId, setSelectedLocationTypeId] = useState<string | undefined>(undefined);

  const { toast } = useToast();

  // Fetch all settings data
  const { data: acts = [] } = useQuery<Act[]>({ queryKey: ["/api/acts"] });
  const { data: departments = [] } = useQuery<Department[]>({ queryKey: ["/api/departments"] });
  const { data: locationTypes = [] } = useQuery<LocationType[]>({ queryKey: ["/api/location-types"] });
  const { data: locations = [] } = useQuery<Location[]>({ queryKey: ["/api/locations"] });
  const { data: artistGroups = [] } = useQuery<ArtistGroup[]>({ queryKey: ["/api/artist-groups"] });
  const { data: artists = [] } = useQuery<Artist[]>({ queryKey: ["/api/artists"] });
  const { data: technicians = [] } = useQuery<Technician[]>({ queryKey: ["/api/technicians"] });
  const { data: reportTemplate } = useQuery<ReportTemplate | null>({ queryKey: ["/api/report-template"] });
  const { data: users = [] } = useQuery<SafeUser[]>({ queryKey: ["/api/users"] });

  // Report Template state
  const [leftImage, setLeftImage] = useState(reportTemplate?.leftImageUrl || "");
  const [title, setTitle] = useState(reportTemplate?.title || "Training Report");
  const [rightImage, setRightImage] = useState(reportTemplate?.rightImageUrl || "");

  // Sync report template state with query data
  useEffect(() => {
    if (reportTemplate) {
      setLeftImage(reportTemplate.leftImageUrl || "");
      setTitle(reportTemplate.title || "Training Report");
      setRightImage(reportTemplate.rightImageUrl || "");
    }
  }, [reportTemplate]);

  // Create mutations
  const createActMutation = useMutation({
    mutationFn: async (data: { name: string; sortOrder: number }) => {
      return await apiRequest("POST", "/api/acts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acts"] });
      setActDialogOpen(false);
      toast({ title: "Act created successfully" });
    },
  });

  const createDeptMutation = useMutation({
    mutationFn: async (data: { name: string; sortOrder: number }) => {
      return await apiRequest("POST", "/api/departments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setDeptDialogOpen(false);
      toast({ title: "Department created successfully" });
    },
  });

  const createLocationTypeMutation = useMutation({
    mutationFn: async (data: { name: string; sortOrder: number }) => {
      return await apiRequest("POST", "/api/location-types", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/location-types"] });
      setLocationTypeDialogOpen(false);
      toast({ title: "Location type created successfully" });
    },
  });

  const createLocationMutation = useMutation({
    mutationFn: async (data: { name: string; locationTypeId: string | null; sortOrder: number }) => {
      return await apiRequest("POST", "/api/locations", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      setLocationDialogOpen(false);
      setSelectedLocationTypeId(undefined);
      toast({ title: "Location created successfully" });
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; sortOrder: number }) => {
      return await apiRequest("POST", "/api/artist-groups", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artist-groups"] });
      setGroupDialogOpen(false);
      toast({ title: "Artist group created successfully" });
    },
  });

  const createArtistMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; stageName?: string; artistGroupId?: string }) => {
      return await apiRequest("POST", "/api/artists", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artists"] });
      setArtistDialogOpen(false);
      toast({ title: "Artist created successfully" });
    },
  });

  const createTechMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; role?: string; departmentId?: string }) => {
      return await apiRequest("POST", "/api/technicians", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technicians"] });
      setTechDialogOpen(false);
      toast({ title: "Technician created successfully" });
    },
  });

  // Update mutations
  const updateActMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; sortOrder: number }) => {
      return await apiRequest("PATCH", `/api/acts/${data.id}`, { name: data.name, sortOrder: data.sortOrder });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acts"] });
      setActDialogOpen(false);
      setEditTarget(null);
      toast({ title: "Act updated successfully" });
    },
  });

  const updateDeptMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; sortOrder: number }) => {
      return await apiRequest("PATCH", `/api/departments/${data.id}`, { name: data.name, sortOrder: data.sortOrder });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      setDeptDialogOpen(false);
      setEditTarget(null);
      toast({ title: "Department updated successfully" });
    },
  });

  const updateLocationTypeMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; sortOrder: number }) => {
      return await apiRequest("PATCH", `/api/location-types/${data.id}`, { name: data.name, sortOrder: data.sortOrder });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/location-types"] });
      setLocationTypeDialogOpen(false);
      setEditTarget(null);
      toast({ title: "Location type updated successfully" });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; locationTypeId: string | null; sortOrder: number }) => {
      return await apiRequest("PATCH", `/api/locations/${data.id}`, { 
        name: data.name, 
        locationTypeId: data.locationTypeId,
        sortOrder: data.sortOrder 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      setLocationDialogOpen(false);
      setEditTarget(null);
      setSelectedLocationTypeId(undefined);
      toast({ title: "Location updated successfully" });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; sortOrder: number }) => {
      return await apiRequest("PATCH", `/api/artist-groups/${data.id}`, { name: data.name, sortOrder: data.sortOrder });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artist-groups"] });
      setGroupDialogOpen(false);
      setEditTarget(null);
      toast({ title: "Artist group updated successfully" });
    },
  });

  const updateArtistMutation = useMutation({
    mutationFn: async (data: { id: string; firstName: string; lastName: string; stageName?: string; artistGroupId?: string }) => {
      return await apiRequest("PATCH", `/api/artists/${data.id}`, {
        firstName: data.firstName,
        lastName: data.lastName,
        stageName: data.stageName,
        artistGroupId: data.artistGroupId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artists"] });
      setArtistDialogOpen(false);
      setEditTarget(null);
      toast({ title: "Artist updated successfully" });
    },
  });

  const updateTechMutation = useMutation({
    mutationFn: async (data: { id: string; firstName: string; lastName: string; role?: string; departmentId?: string }) => {
      return await apiRequest("PATCH", `/api/technicians/${data.id}`, {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        departmentId: data.departmentId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technicians"] });
      setTechDialogOpen(false);
      setEditTarget(null);
      toast({ title: "Technician updated successfully" });
    },
  });

  // Delete mutations
  const deleteActMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/acts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acts"] });
      toast({ title: "Act deleted successfully" });
    },
  });

  const deleteDeptMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({ title: "Department deleted successfully" });
    },
  });

  const deleteLocationTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/location-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/location-types"] });
      toast({ title: "Location type deleted successfully" });
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/locations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      toast({ title: "Location deleted successfully" });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/artist-groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artist-groups"] });
      toast({ title: "Artist group deleted successfully" });
    },
  });

  const deleteArtistMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/artists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artists"] });
      toast({ title: "Artist deleted successfully" });
    },
  });

  const deleteTechMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/technicians/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technicians"] });
      toast({ title: "Technician deleted successfully" });
    },
  });

  // User update mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: string; active: number }) => {
      return await apiRequest("PATCH", `/api/users/${data.id}`, { active: data.active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User status updated successfully" });
    },
  });

  // Report Template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PUT", "/api/report-template", {
        title,
        leftImageUrl: leftImage || null,
        rightImageUrl: rightImage || null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/report-template"] });
      toast({ title: "Report template saved successfully" });
    },
  });

  const handleDelete = () => {
    if (!deleteTarget) return;

    const mutations: Record<string, any> = {
      act: deleteActMutation,
      department: deleteDeptMutation,
      "location-type": deleteLocationTypeMutation,
      location: deleteLocationMutation,
      group: deleteGroupMutation,
      artist: deleteArtistMutation,
      technician: deleteTechMutation,
    };

    mutations[deleteTarget.type]?.mutate(deleteTarget.id);
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const renderSimpleList = (items: SimpleItem[], type: string) => (
    <div className="space-y-2">
      {items.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          <p>No items yet. Click "Add" to create one.</p>
        </Card>
      ) : (
        items.map((item) => (
          <Card key={item.id} className="p-3 flex items-center justify-between hover-elevate" data-testid={`card-${type}-${item.id}`}>
            <p className="font-medium">{item.name}</p>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setEditTarget({ type, id: item.id, data: item });
                  if (type === "act") setActDialogOpen(true);
                  else if (type === "department") setDeptDialogOpen(true);
                  else if (type === "location-type") setLocationTypeDialogOpen(true);
                  else if (type === "location") setLocationDialogOpen(true);
                  else if (type === "group") setGroupDialogOpen(true);
                }}
                data-testid={`button-edit-${type}-${item.id}`}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setDeleteTarget({ type, id: item.id });
                  setDeleteDialogOpen(true);
                }}
                data-testid={`button-delete-${type}-${item.id}`}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );

  return (
    <div className="flex-1 overflow-auto pb-20 md:pb-4">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage acts, departments, artists, technicians, locations, and report template
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-7 mb-6">
            <TabsTrigger value="report-template" data-testid="tab-report-template">
              <FileText className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Template</span>
            </TabsTrigger>
            <TabsTrigger value="acts" data-testid="tab-acts">
              <Theater className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Acts</span>
            </TabsTrigger>
            <TabsTrigger value="departments" data-testid="tab-departments">
              <Briefcase className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Departments</span>
            </TabsTrigger>
            <TabsTrigger value="locations" data-testid="tab-locations">
              <MapPin className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Locations</span>
            </TabsTrigger>
            <TabsTrigger value="artist-groups" data-testid="tab-artist-groups">
              <UsersRound className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Groups</span>
            </TabsTrigger>
            <TabsTrigger value="people" data-testid="tab-people">
              <Users className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">People</span>
            </TabsTrigger>
            <TabsTrigger value="users" data-testid="tab-users">
              <Shield className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Users</span>
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
                <Button
                  onClick={() => saveTemplateMutation.mutate()}
                  disabled={saveTemplateMutation.isPending}
                  data-testid="button-save-template"
                >
                  {saveTemplateMutation.isPending ? "Saving..." : "Save Template"}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="acts" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Acts</h2>
              <Dialog 
                open={actDialogOpen} 
                onOpenChange={(open) => {
                  setActDialogOpen(open);
                  if (!open) setEditTarget(null);
                }}
              >
                <DialogTrigger asChild>
                  <Button data-testid="button-add-act">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Act
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const name = formData.get("name") as string;
                      
                      if (editTarget?.type === "act") {
                        updateActMutation.mutate({
                          id: editTarget.id,
                          name,
                          sortOrder: editTarget.data.sortOrder,
                        });
                      } else {
                        createActMutation.mutate({
                          name,
                          sortOrder: acts.length,
                        });
                      }
                    }}
                  >
                    <DialogHeader>
                      <DialogTitle>{editTarget?.type === "act" ? "Edit Act" : "Add Act"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="act-name">Act Name</Label>
                        <Input
                          id="act-name"
                          name="name"
                          placeholder="Enter act name"
                          required
                          defaultValue={editTarget?.type === "act" ? editTarget.data.name : ""}
                          data-testid="input-act-name"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={createActMutation.isPending || updateActMutation.isPending} 
                        data-testid="button-save-act"
                      >
                        {(createActMutation.isPending || updateActMutation.isPending) ? "Saving..." : editTarget?.type === "act" ? "Update Act" : "Save Act"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            {renderSimpleList(acts, "act")}
          </TabsContent>

          <TabsContent value="departments" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Departments</h2>
              <Dialog 
                open={deptDialogOpen} 
                onOpenChange={(open) => {
                  setDeptDialogOpen(open);
                  if (!open) setEditTarget(null);
                }}
              >
                <DialogTrigger asChild>
                  <Button data-testid="button-add-department">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Department
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const name = formData.get("name") as string;
                      
                      if (editTarget?.type === "department") {
                        updateDeptMutation.mutate({
                          id: editTarget.id,
                          name,
                          sortOrder: editTarget.data.sortOrder,
                        });
                      } else {
                        createDeptMutation.mutate({
                          name,
                          sortOrder: departments.length,
                        });
                      }
                    }}
                  >
                    <DialogHeader>
                      <DialogTitle>{editTarget?.type === "department" ? "Edit Department" : "Add Department"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="dept-name">Department Name</Label>
                        <Input
                          id="dept-name"
                          name="name"
                          placeholder="Enter department name"
                          required
                          defaultValue={editTarget?.type === "department" ? editTarget.data.name : ""}
                          data-testid="input-department-name"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={createDeptMutation.isPending || updateDeptMutation.isPending} 
                        data-testid="button-save-department"
                      >
                        {(createDeptMutation.isPending || updateDeptMutation.isPending) ? "Saving..." : editTarget?.type === "department" ? "Update Department" : "Save Department"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            {renderSimpleList(departments, "department")}
          </TabsContent>

          <TabsContent value="locations" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Training Locations</h2>
              <div className="flex items-center gap-2">
                <Dialog 
                  open={locationTypeDialogOpen} 
                  onOpenChange={(open) => {
                    setLocationTypeDialogOpen(open);
                    if (!open) setEditTarget(null);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" data-testid="button-manage-location-types">
                      <SettingsIcon className="w-4 h-4 mr-2" />
                      Location Types
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Manage Location Types</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const name = formData.get("type-name") as string;
                          
                          if (editTarget?.type === "location-type") {
                            updateLocationTypeMutation.mutate({
                              id: editTarget.id,
                              name,
                              sortOrder: editTarget.data.sortOrder,
                            });
                          } else {
                            createLocationTypeMutation.mutate({
                              name,
                              sortOrder: locationTypes.length,
                            });
                          }
                          e.currentTarget.reset();
                        }}
                      >
                        <div className="flex gap-2">
                          <Input
                            id="type-name"
                            name="type-name"
                            placeholder={editTarget?.type === "location-type" ? "Update type name" : "e.g., Onstage, Rehearsal Room"}
                            required
                            defaultValue={editTarget?.type === "location-type" ? editTarget.data.name : ""}
                            data-testid="input-location-type-name"
                          />
                          <Button 
                            type="submit" 
                            disabled={createLocationTypeMutation.isPending || updateLocationTypeMutation.isPending}
                            data-testid="button-save-location-type"
                          >
                            {editTarget?.type === "location-type" ? "Update" : "Add"}
                          </Button>
                        </div>
                      </form>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {locationTypes.map((locType) => (
                          <Card key={locType.id} className="p-3 flex items-center justify-between" data-testid={`card-location-type-${locType.id}`}>
                            <p className="font-medium">{locType.name}</p>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditTarget({ type: "location-type", id: locType.id, data: locType });
                                }}
                                data-testid={`button-edit-location-type-${locType.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setDeleteTarget({ type: "location-type", id: locType.id });
                                  setDeleteDialogOpen(true);
                                }}
                                data-testid={`button-delete-location-type-${locType.id}`}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </Card>
                        ))}
                        {locationTypes.length === 0 && (
                          <Card className="p-6 text-center text-muted-foreground">
                            <p>No location types yet. Add one above.</p>
                          </Card>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog 
                  open={locationDialogOpen} 
                  onOpenChange={(open) => {
                    setLocationDialogOpen(open);
                    if (!open) {
                      setEditTarget(null);
                      setSelectedLocationTypeId(undefined);
                    } else if (open && editTarget?.type === "location") {
                      setSelectedLocationTypeId(editTarget.data.locationTypeId || undefined);
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-location">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Location
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const name = formData.get("name") as string;
                          
                          if (editTarget?.type === "location") {
                            updateLocationMutation.mutate({
                              id: editTarget.id,
                              name,
                              locationTypeId: selectedLocationTypeId || null,
                              sortOrder: editTarget.data.sortOrder,
                            });
                          } else {
                            createLocationMutation.mutate({
                              name,
                              locationTypeId: selectedLocationTypeId || null,
                              sortOrder: locations.length,
                            });
                          }
                        }}
                      >
                        <DialogHeader>
                          <DialogTitle>{editTarget?.type === "location" ? "Edit Training Location" : "Add Training Location"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="location-name">Location Name</Label>
                            <Input
                              id="location-name"
                              name="name"
                              placeholder="e.g., Main Stage, Rehearsal Hall A"
                              required
                              defaultValue={editTarget?.type === "location" ? editTarget.data.name : ""}
                              data-testid="input-location-name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="location-type">Location Type (Optional)</Label>
                            <Select
                              value={selectedLocationTypeId || "none"}
                              onValueChange={(value) => setSelectedLocationTypeId(value === "none" ? undefined : value)}
                            >
                              <SelectTrigger id="location-type" data-testid="select-location-type">
                                <SelectValue placeholder="Select a type..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {locationTypes.map((type) => (
                                  <SelectItem key={type.id} value={type.id}>
                                    {type.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            type="submit" 
                            disabled={createLocationMutation.isPending || updateLocationMutation.isPending} 
                            data-testid="button-save-location"
                          >
                            {(createLocationMutation.isPending || updateLocationMutation.isPending) ? "Saving..." : editTarget?.type === "location" ? "Update Location" : "Save Location"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
            </div>
            {renderSimpleList(locations, "location")}
          </TabsContent>

          <TabsContent value="artist-groups" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Artist Groups</h2>
              <Dialog 
                open={groupDialogOpen} 
                onOpenChange={(open) => {
                  setGroupDialogOpen(open);
                  if (!open) setEditTarget(null);
                }}
              >
                <DialogTrigger asChild>
                  <Button data-testid="button-add-artist-group">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Group
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const formData = new FormData(e.currentTarget);
                      const name = formData.get("name") as string;
                      
                      if (editTarget?.type === "group") {
                        updateGroupMutation.mutate({
                          id: editTarget.id,
                          name,
                          sortOrder: editTarget.data.sortOrder,
                        });
                      } else {
                        createGroupMutation.mutate({
                          name,
                          sortOrder: artistGroups.length,
                        });
                      }
                    }}
                  >
                    <DialogHeader>
                      <DialogTitle>{editTarget?.type === "group" ? "Edit Artist Group" : "Add Artist Group"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="group-name">Group Name</Label>
                        <Input
                          id="group-name"
                          name="name"
                          placeholder="Enter group name"
                          required
                          defaultValue={editTarget?.type === "group" ? editTarget.data.name : ""}
                          data-testid="input-group-name"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        type="submit" 
                        disabled={createGroupMutation.isPending || updateGroupMutation.isPending} 
                        data-testid="button-save-group"
                      >
                        {(createGroupMutation.isPending || updateGroupMutation.isPending) ? "Saving..." : editTarget?.type === "group" ? "Update Group" : "Save Group"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            {renderSimpleList(artistGroups, "group")}
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
                  <Dialog 
                    open={artistDialogOpen} 
                    onOpenChange={(open) => {
                      setArtistDialogOpen(open);
                      if (!open) setEditTarget(null);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button data-testid="button-add-artist">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Artist
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const firstName = formData.get("firstName") as string;
                          const lastName = formData.get("lastName") as string;
                          const stageName = (formData.get("stageName") as string) || undefined;
                          const artistGroupId = (formData.get("groupId") as string) || undefined;

                          if (editTarget?.type === "artist") {
                            updateArtistMutation.mutate({
                              id: editTarget.id,
                              firstName,
                              lastName,
                              stageName,
                              artistGroupId,
                            });
                          } else {
                            createArtistMutation.mutate({
                              firstName,
                              lastName,
                              stageName,
                              artistGroupId,
                            });
                          }
                        }}
                      >
                        <DialogHeader>
                          <DialogTitle>{editTarget?.type === "artist" ? "Edit Artist" : "Add Artist"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>First Name</Label>
                              <Input 
                                name="firstName" 
                                placeholder="First name" 
                                required 
                                defaultValue={editTarget?.type === "artist" ? editTarget.data.firstName : ""}
                                data-testid="input-artist-firstname" 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Last Name</Label>
                              <Input 
                                name="lastName" 
                                placeholder="Last name" 
                                required 
                                defaultValue={editTarget?.type === "artist" ? editTarget.data.lastName : ""}
                                data-testid="input-artist-lastname" 
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Stage Name (Optional)</Label>
                            <Input 
                              name="stageName" 
                              placeholder="Stage name" 
                              defaultValue={editTarget?.type === "artist" ? editTarget.data.stageName || "" : ""}
                              data-testid="input-artist-stagename" 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Group (Optional)</Label>
                            <Select 
                              name="groupId" 
                              defaultValue={editTarget?.type === "artist" ? editTarget.data.artistGroupId || "" : ""}
                            >
                              <SelectTrigger data-testid="select-artist-group">
                                <SelectValue placeholder="Select a group" />
                              </SelectTrigger>
                              <SelectContent>
                                {artistGroups.map((group) => (
                                  <SelectItem key={group.id} value={group.id}>
                                    {group.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            type="submit" 
                            disabled={createArtistMutation.isPending || updateArtistMutation.isPending} 
                            data-testid="button-save-artist"
                          >
                            {(createArtistMutation.isPending || updateArtistMutation.isPending) ? "Saving..." : editTarget?.type === "artist" ? "Update Artist" : "Save Artist"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="space-y-2">
                  {artists.length === 0 ? (
                    <Card className="p-6 text-center text-muted-foreground">
                      <p>No artists yet. Click "Add Artist" to create one.</p>
                    </Card>
                  ) : (
                    artists.map((artist) => (
                      <Card key={artist.id} className="p-3 flex items-center justify-between hover-elevate" data-testid={`card-artist-${artist.id}`}>
                        <div>
                          <p className="font-medium">{artist.firstName} {artist.lastName}</p>
                          {artist.stageName && <p className="text-sm text-muted-foreground">{artist.stageName}</p>}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditTarget({ type: "artist", id: artist.id, data: artist });
                              setArtistDialogOpen(true);
                            }}
                            data-testid={`button-edit-artist-${artist.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeleteTarget({ type: "artist", id: artist.id });
                              setDeleteDialogOpen(true);
                            }}
                            data-testid={`button-delete-artist-${artist.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
              <TabsContent value="technicians" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Technicians</h2>
                  <Dialog 
                    open={techDialogOpen} 
                    onOpenChange={(open) => {
                      setTechDialogOpen(open);
                      if (!open) setEditTarget(null);
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button data-testid="button-add-technician">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Technician
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.currentTarget);
                          const firstName = formData.get("firstName") as string;
                          const lastName = formData.get("lastName") as string;
                          const role = (formData.get("role") as string) || undefined;
                          const departmentId = (formData.get("departmentId") as string) || undefined;

                          if (editTarget?.type === "technician") {
                            updateTechMutation.mutate({
                              id: editTarget.id,
                              firstName,
                              lastName,
                              role,
                              departmentId,
                            });
                          } else {
                            createTechMutation.mutate({
                              firstName,
                              lastName,
                              role,
                              departmentId,
                            });
                          }
                        }}
                      >
                        <DialogHeader>
                          <DialogTitle>{editTarget?.type === "technician" ? "Edit Technician" : "Add Technician"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>First Name</Label>
                              <Input 
                                name="firstName" 
                                placeholder="First name" 
                                required 
                                defaultValue={editTarget?.type === "technician" ? editTarget.data.firstName : ""}
                                data-testid="input-tech-firstname" 
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Last Name</Label>
                              <Input 
                                name="lastName" 
                                placeholder="Last name" 
                                required 
                                defaultValue={editTarget?.type === "technician" ? editTarget.data.lastName : ""}
                                data-testid="input-tech-lastname" 
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Role (Optional)</Label>
                            <Input 
                              name="role" 
                              placeholder="Role" 
                              defaultValue={editTarget?.type === "technician" ? editTarget.data.role || "" : ""}
                              data-testid="input-tech-role" 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Department (Optional)</Label>
                            <Select 
                              name="departmentId" 
                              defaultValue={editTarget?.type === "technician" ? editTarget.data.departmentId || "" : ""}
                            >
                              <SelectTrigger data-testid="select-tech-department">
                                <SelectValue placeholder="Select a department" />
                              </SelectTrigger>
                              <SelectContent>
                                {departments.map((dept) => (
                                  <SelectItem key={dept.id} value={dept.id}>
                                    {dept.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button 
                            type="submit" 
                            disabled={createTechMutation.isPending || updateTechMutation.isPending} 
                            data-testid="button-save-technician"
                          >
                            {(createTechMutation.isPending || updateTechMutation.isPending) ? "Saving..." : editTarget?.type === "technician" ? "Update Technician" : "Save Technician"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="space-y-2">
                  {technicians.length === 0 ? (
                    <Card className="p-6 text-center text-muted-foreground">
                      <p>No technicians yet. Click "Add Technician" to create one.</p>
                    </Card>
                  ) : (
                    technicians.map((tech) => (
                      <Card key={tech.id} className="p-3 flex items-center justify-between hover-elevate" data-testid={`card-technician-${tech.id}`}>
                        <div>
                          <p className="font-medium">{tech.firstName} {tech.lastName}</p>
                          {tech.role && <p className="text-sm text-muted-foreground">{tech.role}</p>}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditTarget({ type: "technician", id: tech.id, data: tech });
                              setTechDialogOpen(true);
                            }}
                            data-testid={`button-edit-technician-${tech.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setDeleteTarget({ type: "technician", id: tech.id });
                              setDeleteDialogOpen(true);
                            }}
                            data-testid={`button-delete-technician-${tech.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">User Management</h2>
            </div>
            <div className="space-y-2">
              {users.map((user) => (
                <Card key={user.id} className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-medium" data-testid={`text-user-name-${user.id}`}>
                        {user.name || "Unnamed User"}
                      </p>
                      <p className="text-sm text-muted-foreground" data-testid={`text-user-email-${user.id}`}>
                        {user.email}
                      </p>
                      {user.position && (
                        <p className="text-sm text-muted-foreground" data-testid={`text-user-position-${user.id}`}>
                          {user.position}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm ${user.active === 1 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {user.active === 1 ? 'Active' : 'Inactive'}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updateUserMutation.mutate({
                            id: user.id,
                            active: user.active === 1 ? 0 : 1,
                          });
                        }}
                        disabled={updateUserMutation.isPending}
                        data-testid={`button-toggle-user-${user.id}`}
                      >
                        {user.active === 1 ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
              {users.length === 0 && (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No users found</p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this item.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
