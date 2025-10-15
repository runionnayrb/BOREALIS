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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  Scene, Act, Department, LocationType, Location, ArtistGroup, Artist, Technician, ReportTemplate, SafeUser 
} from "@shared/schema";

type SimpleItem = {
  id: string;
  name: string;
  sortOrder: number;
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState("acts");
  const [sceneDialogOpen, setSceneDialogOpen] = useState(false);
  const [sceneFormOpen, setSceneFormOpen] = useState(false);
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
  
  // Admin password dialog for user deletion
  const [adminPasswordDialogOpen, setAdminPasswordDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [selectedLocationTypeId, setSelectedLocationTypeId] = useState<string | undefined>(undefined);
  const [selectedSceneId, setSelectedSceneId] = useState<string | undefined>(undefined);
  const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<string[]>([]);
  const [selectedArtistIds, setSelectedArtistIds] = useState<string[]>([]);
  const [selectedArtistGroupIds, setSelectedArtistGroupIds] = useState<string[]>([]);
  
  // Scene assignment states
  const [selectedSceneDepartmentIds, setSelectedSceneDepartmentIds] = useState<string[]>([]);
  const [selectedSceneArtistGroupIds, setSelectedSceneArtistGroupIds] = useState<string[]>([]);
  const [selectedSceneArtistIds, setSelectedSceneArtistIds] = useState<string[]>([]);
  
  // Technician department assignments
  const [selectedTechnicianDepartmentIds, setSelectedTechnicianDepartmentIds] = useState<string[]>([]);

  const { toast} = useToast();

  // Fetch all settings data
  const { data: scenes = [] } = useQuery<Scene[]>({ queryKey: ["/api/scenes"] });
  const { data: acts = [] } = useQuery<Act[]>({ queryKey: ["/api/acts"] });
  const { data: departments = [] } = useQuery<Department[]>({ queryKey: ["/api/departments"] });
  const { data: locationTypes = [] } = useQuery<LocationType[]>({ queryKey: ["/api/location-types"] });
  const { data: locations = [] } = useQuery<Location[]>({ queryKey: ["/api/locations"] });
  const { data: artistGroups = [] } = useQuery<ArtistGroup[]>({ queryKey: ["/api/artist-groups"] });
  const { data: artists = [] } = useQuery<Artist[]>({ queryKey: ["/api/artists"] });
  const { data: technicians = [] } = useQuery<Technician[]>({ queryKey: ["/api/technicians"] });
  const { data: reportTemplate } = useQuery<ReportTemplate | null>({ queryKey: ["/api/report-template"] });
  const { data: users = [] } = useQuery<SafeUser[]>({ queryKey: ["/api/users"] });
  
  // Fetch all technician-department assignments for grouping
  const { data: allTechnicianDepartments = [] } = useQuery<Array<{ technicianId: string; departmentId: string }>>({
    queryKey: ["/api/technician-departments/all"],
    queryFn: async () => {
      // Fetch department assignments for all technicians
      const assignments = await Promise.all(
        technicians.map(async (tech) => {
          const res = await fetch(`/api/technicians/${tech.id}/departments`, {
            credentials: "include"
          });
          if (!res.ok) return [];
          const depts = await res.json();
          return depts.map((d: any) => ({ technicianId: tech.id, departmentId: d.departmentId }));
        })
      );
      return assignments.flat();
    },
    enabled: technicians.length > 0
  });

  // Load act departments when editing an act
  useEffect(() => {
    if (editTarget?.type === "act" && editTarget.id) {
      fetch(`/api/acts/${editTarget.id}/departments`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      })
        .then(async res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          const contentType = res.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response is not JSON');
          }
          return res.json();
        })
        .then(data => {
          setSelectedDepartmentIds(data.map((ad: any) => ad.departmentId));
        })
        .catch(err => {
          console.error("Error loading act departments:", err);
          setSelectedDepartmentIds([]);
        });
    } else if (!editTarget || editTarget.type !== "act") {
      setSelectedDepartmentIds([]);
    }
  }, [editTarget]);

  // Load act artists when editing an act
  useEffect(() => {
    if (editTarget?.type === "act" && editTarget.id) {
      fetch(`/api/acts/${editTarget.id}/artists`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      })
        .then(async res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          const contentType = res.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            throw new Error('Response is not JSON');
          }
          return res.json();
        })
        .then(data => {
          setSelectedArtistIds(data.map((aa: any) => aa.artistId));
        })
        .catch(err => {
          console.error("Error loading act artists:", err);
          setSelectedArtistIds([]);
        });
    } else if (!editTarget || editTarget.type !== "act") {
      setSelectedArtistIds([]);
    }
  }, [editTarget]);

  // Load act artist groups when editing an act
  useEffect(() => {
    if (editTarget?.type === "act" && editTarget.id) {
      fetch(`/api/acts/${editTarget.id}/artist-groups`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      })
        .then(async res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          const contentType = res.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) throw new Error('Response is not JSON');
          return res.json();
        })
        .then(data => {
          setSelectedArtistGroupIds(data.map((aag: any) => aag.artistGroupId));
        })
        .catch(err => {
          console.error("Error loading act artist groups:", err);
          setSelectedArtistGroupIds([]);
        });
    } else if (!editTarget || editTarget.type !== "act") {
      setSelectedArtistGroupIds([]);
    }
  }, [editTarget]);

  // Load scene assignments when editing a scene
  useEffect(() => {
    if (editTarget?.type === "scene" && editTarget.id) {
      // Load departments
      fetch(`/api/scenes/${editTarget.id}/departments`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      })
        .then(async res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          const contentType = res.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) throw new Error('Response is not JSON');
          return res.json();
        })
        .then(data => {
          setSelectedSceneDepartmentIds(data.map((sd: any) => sd.departmentId));
        })
        .catch(err => {
          console.error("Error loading scene departments:", err);
          setSelectedSceneDepartmentIds([]);
        });

      // Load artist groups
      fetch(`/api/scenes/${editTarget.id}/artist-groups`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      })
        .then(async res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          const contentType = res.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) throw new Error('Response is not JSON');
          return res.json();
        })
        .then(data => {
          setSelectedSceneArtistGroupIds(data.map((sag: any) => sag.artistGroupId));
        })
        .catch(err => {
          console.error("Error loading scene artist groups:", err);
          setSelectedSceneArtistGroupIds([]);
        });

      // Load artists
      fetch(`/api/scenes/${editTarget.id}/artists`, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' }
      })
        .then(async res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          const contentType = res.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) throw new Error('Response is not JSON');
          return res.json();
        })
        .then(data => {
          setSelectedSceneArtistIds(data.map((sa: any) => sa.artistId));
        })
        .catch(err => {
          console.error("Error loading scene artists:", err);
          setSelectedSceneArtistIds([]);
        });
    } else if (!editTarget || editTarget.type !== "scene") {
      setSelectedSceneDepartmentIds([]);
      setSelectedSceneArtistGroupIds([]);
      setSelectedSceneArtistIds([]);
    }
  }, [editTarget]);

  // Load technician departments when editing a technician
  useEffect(() => {
    // Reset state immediately to prevent leaking old state when switching technicians
    setSelectedTechnicianDepartmentIds([]);
    
    if (editTarget?.type === "technician" && editTarget.id && techDialogOpen) {
      fetch(`/api/technicians/${editTarget.id}/departments`, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
        }
      })
        .then(async res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          const contentType = res.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) throw new Error('Response is not JSON');
          return res.json();
        })
        .then(data => {
          setSelectedTechnicianDepartmentIds(data.map((td: any) => td.departmentId));
        })
        .catch(err => {
          console.error("Error loading technician departments:", err);
          setSelectedTechnicianDepartmentIds([]);
        });
    }
  }, [editTarget, techDialogOpen]);

  // Report Template state
  const [leftImage, setLeftImage] = useState(reportTemplate?.leftImageUrl || "");
  const [title, setTitle] = useState(reportTemplate?.title || "Training Report");
  const [rightImage, setRightImage] = useState(reportTemplate?.rightImageUrl || "");
  const [emailTo, setEmailTo] = useState<string[]>(reportTemplate?.emailTo || []);
  const [emailCc, setEmailCc] = useState<string[]>(reportTemplate?.emailCc || []);
  const [emailBcc, setEmailBcc] = useState<string[]>(reportTemplate?.emailBcc || []);
  const [emailSubject, setEmailSubject] = useState(reportTemplate?.emailSubjectTemplate || "");
  const [emailBodyPrefix, setEmailBodyPrefix] = useState(reportTemplate?.emailBodyPrefix || "");

  // Sync report template state with query data (only on initial load, not during refetch)
  const [templateInitialized, setTemplateInitialized] = useState(false);
  useEffect(() => {
    if (reportTemplate && !templateInitialized) {
      setLeftImage(reportTemplate.leftImageUrl || "");
      setTitle(reportTemplate.title || "Training Report");
      setRightImage(reportTemplate.rightImageUrl || "");
      setEmailTo(reportTemplate.emailTo || []);
      setEmailCc(reportTemplate.emailCc || []);
      setEmailBcc(reportTemplate.emailBcc || []);
      setEmailSubject(reportTemplate.emailSubjectTemplate || "");
      setEmailBodyPrefix(reportTemplate.emailBodyPrefix || "");
      setTemplateInitialized(true);
    }
  }, [reportTemplate, templateInitialized]);

  // Create mutations
  const createSceneMutation = useMutation({
    mutationFn: async (data: { name: string; sortOrder: number; departmentIds: string[]; artistGroupIds: string[]; artistIds: string[] }) => {
      const scene = await apiRequest("POST", "/api/scenes", { name: data.name, sortOrder: data.sortOrder });
      await apiRequest("POST", `/api/scenes/${scene.id}/departments`, { departmentIds: data.departmentIds });
      await apiRequest("POST", `/api/scenes/${scene.id}/artist-groups`, { artistGroupIds: data.artistGroupIds });
      await apiRequest("POST", `/api/scenes/${scene.id}/artists`, { artistIds: data.artistIds });
      return scene;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scenes"] });
      setSceneFormOpen(false);
      setSelectedSceneDepartmentIds([]);
      setSelectedSceneArtistGroupIds([]);
      setSelectedSceneArtistIds([]);
      toast({ title: "Scene created successfully" });
    },
  });

  const createActMutation = useMutation({
    mutationFn: async (data: { name: string; sortOrder: number; sceneId?: string; departmentIds: string[]; artistGroupIds: string[]; artistIds: string[] }) => {
      const act = await apiRequest("POST", "/api/acts", { name: data.name, sortOrder: data.sortOrder, sceneId: data.sceneId });
      await apiRequest("POST", `/api/acts/${act.id}/departments`, { departmentIds: data.departmentIds });
      await apiRequest("POST", `/api/acts/${act.id}/artist-groups`, { artistGroupIds: data.artistGroupIds });
      await apiRequest("POST", `/api/acts/${act.id}/artists`, { artistIds: data.artistIds });
      return act;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acts"] });
      setActDialogOpen(false);
      setSelectedDepartmentIds([]);
      setSelectedArtistGroupIds([]);
      setSelectedArtistIds([]);
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
    mutationFn: async (data: { firstName: string; lastName: string; stageName?: string; role?: string; artistGroupId?: string }) => {
      return await apiRequest("POST", "/api/artists", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artists"] });
      setArtistDialogOpen(false);
      toast({ title: "Artist created successfully" });
    },
  });

  const createTechMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; technicianName?: string; role?: string; departmentIds: string[] }) => {
      const technician: any = await apiRequest("POST", "/api/technicians", {
        firstName: data.firstName,
        lastName: data.lastName,
        technicianName: data.technicianName,
        role: data.role,
      });
      // Set department assignments
      if (data.departmentIds.length > 0) {
        await apiRequest("PUT", `/api/technicians/${technician.id}/departments`, {
          departmentIds: data.departmentIds,
        });
      }
      return technician;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technicians"] });
      queryClient.invalidateQueries({ queryKey: ["/api/technician-departments/all"] });
      setTechDialogOpen(false);
      setSelectedTechnicianDepartmentIds([]);
      toast({ title: "Technician created successfully" });
    },
  });

  // Update mutations
  const updateActMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; sceneId?: string | null; sortOrder: number; departmentIds: string[]; artistGroupIds: string[]; artistIds: string[] }) => {
      const act = await apiRequest("PATCH", `/api/acts/${data.id}`, { name: data.name, sceneId: data.sceneId, sortOrder: data.sortOrder });
      await apiRequest("POST", `/api/acts/${data.id}/departments`, { departmentIds: data.departmentIds });
      await apiRequest("POST", `/api/acts/${data.id}/artist-groups`, { artistGroupIds: data.artistGroupIds });
      await apiRequest("POST", `/api/acts/${data.id}/artists`, { artistIds: data.artistIds });
      return act;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acts"] });
      setActDialogOpen(false);
      setEditTarget(null);
      setSelectedDepartmentIds([]);
      setSelectedArtistGroupIds([]);
      setSelectedArtistIds([]);
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

  const updateSceneMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; sortOrder: number; departmentIds: string[]; artistGroupIds: string[]; artistIds: string[] }) => {
      const scene = await apiRequest("PATCH", `/api/scenes/${data.id}`, { name: data.name, sortOrder: data.sortOrder });
      await apiRequest("POST", `/api/scenes/${data.id}/departments`, { departmentIds: data.departmentIds });
      await apiRequest("POST", `/api/scenes/${data.id}/artist-groups`, { artistGroupIds: data.artistGroupIds });
      await apiRequest("POST", `/api/scenes/${data.id}/artists`, { artistIds: data.artistIds });
      return scene;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scenes"] });
      setSceneFormOpen(false);
      setEditTarget(null);
      setSelectedSceneDepartmentIds([]);
      setSelectedSceneArtistGroupIds([]);
      setSelectedSceneArtistIds([]);
      toast({ title: "Scene updated successfully" });
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
    mutationFn: async (data: { id: string; firstName: string; lastName: string; stageName?: string; role?: string; artistGroupId?: string }) => {
      return await apiRequest("PATCH", `/api/artists/${data.id}`, {
        firstName: data.firstName,
        lastName: data.lastName,
        stageName: data.stageName,
        role: data.role,
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
    mutationFn: async (data: { id: string; firstName: string; lastName: string; technicianName?: string; role?: string; departmentIds: string[] }) => {
      const technician = await apiRequest("PATCH", `/api/technicians/${data.id}`, {
        firstName: data.firstName,
        lastName: data.lastName,
        technicianName: data.technicianName,
        role: data.role,
      });
      // Set department assignments
      await apiRequest("PUT", `/api/technicians/${data.id}/departments`, {
        departmentIds: data.departmentIds,
      });
      return technician;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technicians"] });
      queryClient.invalidateQueries({ queryKey: ["/api/technician-departments/all"] });
      setTechDialogOpen(false);
      setEditTarget(null);
      setSelectedTechnicianDepartmentIds([]);
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
    onError: (error: any) => {
      const errorMessage = error?.message || "This department is still assigned to technicians. Please reassign or remove the technicians first.";
      toast({ 
        title: "Cannot delete department", 
        description: errorMessage,
        variant: "destructive" 
      });
    },
  });

  const deleteSceneMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/scenes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scenes"] });
      toast({ title: "Scene deleted successfully" });
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

  // User delete mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (data: { id: string; adminUsername: string; adminPassword: string }) => {
      const response = await fetch(`/api/users/${data.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          adminUsername: data.adminUsername, 
          adminPassword: data.adminPassword 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to delete user" }));
        throw new Error(errorData.error || "Failed to delete user");
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User deleted successfully" });
      setAdminPasswordDialogOpen(false);
      setUserToDelete(null);
      setAdminUsername("");
      setAdminPassword("");
    },
    onError: (error: Error) => {
      toast({ 
        title: error.message || "Failed to delete user", 
        variant: "destructive" 
      });
    },
  });

  // Report Template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PUT", "/api/report-template", {
        title,
        leftImageUrl: leftImage || null,
        rightImageUrl: rightImage || null,
        emailTo: emailTo.length > 0 ? emailTo : null,
        emailCc: emailCc.length > 0 ? emailCc : null,
        emailBcc: emailBcc.length > 0 ? emailBcc : null,
        emailSubjectTemplate: emailSubject || null,
        emailBodyPrefix: emailBodyPrefix || null,
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
      scene: deleteSceneMutation,
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

  const renderGroupedLocations = () => {
    if (locations.length === 0) {
      return (
        <Card className="p-6 text-center text-muted-foreground">
          <p>No locations yet. Click "Add Location" to create one.</p>
        </Card>
      );
    }

    // Group locations by locationTypeId
    const grouped = locations.reduce((acc, location) => {
      const key = location.locationTypeId || 'no-type';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(location);
      return acc;
    }, {} as Record<string, Location[]>);

    // Sort location types by their sortOrder
    const sortedTypeIds = Object.keys(grouped).sort((a, b) => {
      if (a === 'no-type') return 1; // Always put "no-type" last
      if (b === 'no-type') return -1;
      
      const typeA = locationTypes.find(t => t.id === a);
      const typeB = locationTypes.find(t => t.id === b);
      
      return (typeA?.sortOrder || 0) - (typeB?.sortOrder || 0);
    });

    return (
      <div className="space-y-6">
        {sortedTypeIds.map((typeId) => {
          const locationsInGroup = grouped[typeId];
          const locationType = locationTypes.find(t => t.id === typeId);
          const typeName = typeId === 'no-type' ? 'No Type' : locationType?.name || 'Unknown';

          return (
            <div key={typeId} className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {typeName}
                </h3>
                <span className="text-xs text-muted-foreground">
                  ({locationsInGroup.length})
                </span>
              </div>
              <div className="space-y-2">
                {locationsInGroup.map((location) => (
                  <Card key={location.id} className="p-3 flex items-center justify-between hover-elevate" data-testid={`card-location-${location.id}`}>
                    <p className="font-medium">{location.name}</p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditTarget({ type: 'location', id: location.id, data: location });
                          setLocationDialogOpen(true);
                        }}
                        data-testid={`button-edit-location-${location.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeleteTarget({ type: 'location', id: location.id });
                          setDeleteDialogOpen(true);
                        }}
                        data-testid={`button-delete-location-${location.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderGroupedActs = () => {
    if (acts.length === 0) {
      return (
        <Card className="p-6 text-center text-muted-foreground">
          <p>No acts yet. Click "Add Act" to create one.</p>
        </Card>
      );
    }

    // Group acts by sceneId
    const grouped = acts.reduce((acc, act) => {
      const key = act.sceneId || 'no-scene';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(act);
      return acc;
    }, {} as Record<string, Act[]>);

    // Sort scenes by their sortOrder
    const sortedSceneIds = Object.keys(grouped).sort((a, b) => {
      if (a === 'no-scene') return 1; // Always put "no-scene" last
      if (b === 'no-scene') return -1;
      
      const sceneA = scenes.find(s => s.id === a);
      const sceneB = scenes.find(s => s.id === b);
      
      // Put FULL SHOW and RESCUE SCENARIOS at the bottom (but before "no-scene")
      const aIsFullShow = sceneA?.name === "FULL SHOW";
      const bIsFullShow = sceneB?.name === "FULL SHOW";
      const aIsRescue = sceneA?.name === "RESCUE SCENARIOS";
      const bIsRescue = sceneB?.name === "RESCUE SCENARIOS";
      
      // RESCUE SCENARIOS is last (among scenes)
      if (aIsRescue && !bIsRescue) return 1;
      if (!aIsRescue && bIsRescue) return -1;
      
      // FULL SHOW is second to last
      if (aIsFullShow && !bIsFullShow && !bIsRescue) return 1;
      if (!aIsFullShow && bIsFullShow && !aIsRescue) return -1;
      
      return (sceneA?.sortOrder || 0) - (sceneB?.sortOrder || 0);
    });

    return (
      <div className="space-y-6">
        {sortedSceneIds.map((sceneId) => {
          const actsInGroup = grouped[sceneId];
          const scene = scenes.find(s => s.id === sceneId);
          const sceneName = sceneId === 'no-scene' ? 'No Scene' : scene?.name || 'Unknown';

          return (
            <div key={sceneId} className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {sceneName}
                </h3>
                <span className="text-xs text-muted-foreground">
                  ({actsInGroup.length})
                </span>
              </div>
              <div className="space-y-2">
                {actsInGroup.map((act) => (
                  <Card key={act.id} className="p-3 flex items-center justify-between hover-elevate" data-testid={`card-act-${act.id}`}>
                    <p className="font-medium">{act.name}</p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditTarget({ type: "act", id: act.id, data: act });
                          setActDialogOpen(true);
                        }}
                        data-testid={`button-edit-act-${act.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setDeleteTarget({ type: "act", id: act.id });
                          setDeleteDialogOpen(true);
                        }}
                        data-testid={`button-delete-act-${act.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderGroupedArtists = () => {
    if (artists.length === 0) {
      return (
        <Card className="p-6 text-center text-muted-foreground">
          <p>No artists yet. Click "Add Artist" to create one.</p>
        </Card>
      );
    }

    // Group artists by artistGroupId
    const grouped = artists.reduce((acc, artist) => {
      const key = artist.artistGroupId || 'no-group';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(artist);
      return acc;
    }, {} as Record<string, Artist[]>);

    // Sort groups by their sortOrder
    const sortedGroupIds = Object.keys(grouped).sort((a, b) => {
      if (a === 'no-group') return 1; // Always put "no-group" last
      if (b === 'no-group') return -1;
      
      const groupA = artistGroups.find(g => g.id === a);
      const groupB = artistGroups.find(g => g.id === b);
      
      return (groupA?.sortOrder || 0) - (groupB?.sortOrder || 0);
    });

    return (
      <div className="space-y-6">
        {sortedGroupIds.map((groupId) => {
          const artistsInGroup = grouped[groupId];
          const group = artistGroups.find(g => g.id === groupId);
          const groupName = groupId === 'no-group' ? 'No Group' : group?.name || 'Unknown';

          return (
            <div key={groupId} className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {groupName}
                </h3>
                <span className="text-xs text-muted-foreground">
                  ({artistsInGroup.length})
                </span>
              </div>
              <div className="space-y-2">
                {artistsInGroup.map((artist) => (
                  <Card key={artist.id} className="p-3 flex items-center justify-between hover-elevate" data-testid={`card-artist-${artist.id}`}>
                    <div>
                      <p className="font-medium">{artist.stageName || `${artist.firstName} ${artist.lastName}`}</p>
                      {artist.role && <p className="text-sm text-muted-foreground">{artist.role}</p>}
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
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderGroupedTechnicians = () => {
    if (technicians.length === 0) {
      return (
        <Card className="p-6 text-center text-muted-foreground">
          <p>No technicians yet. Click "Add Technician" to create one.</p>
        </Card>
      );
    }

    // Group technicians by department
    const grouped = new Map<string, Technician[]>();
    
    // Add "No Department" group for technicians without any department
    const techniciansWithDepts = new Set<string>();
    
    allTechnicianDepartments.forEach(({ technicianId, departmentId }) => {
      techniciansWithDepts.add(technicianId);
      const tech = technicians.find(t => t.id === technicianId);
      if (!tech) return;
      
      if (!grouped.has(departmentId)) {
        grouped.set(departmentId, []);
      }
      grouped.get(departmentId)!.push(tech);
    });
    
    // Add technicians with no departments to "No Department" group
    const noDeptTechs = technicians.filter(t => !techniciansWithDepts.has(t.id));
    if (noDeptTechs.length > 0) {
      grouped.set('no-department', noDeptTechs);
    }
    
    // Sort departments alphabetically, with "no-department" first
    const sortedDeptIds = Array.from(grouped.keys()).sort((a, b) => {
      if (a === 'no-department') return -1;
      if (b === 'no-department') return 1;
      const deptA = departments.find(d => d.id === a);
      const deptB = departments.find(d => d.id === b);
      return (deptA?.name || '').localeCompare(deptB?.name || '');
    });
    
    return (
      <div className="space-y-6">
        {sortedDeptIds.map((deptId) => {
          const techsInDept = grouped.get(deptId) || [];
          const dept = departments.find(d => d.id === deptId);
          const isNoDept = deptId === 'no-department';
          
          // Sort technicians alphabetically within department
          const sortedTechs = [...techsInDept].sort((a, b) => {
            const nameA = a.technicianName || `${a.firstName} ${a.lastName}`;
            const nameB = b.technicianName || `${b.firstName} ${b.lastName}`;
            return nameA.localeCompare(nameB);
          });
          
          return (
            <div key={deptId} className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {isNoDept ? 'No Department' : dept?.name || 'Unknown'}
                </h3>
                <span className="text-xs text-muted-foreground">
                  ({techsInDept.length})
                </span>
              </div>
              <div className="space-y-2">
                {sortedTechs.map((tech) => (
                  <Card key={`${deptId}-${tech.id}`} className="p-3 flex items-center justify-between hover-elevate" data-testid={`card-technician-${tech.id}`}>
                    <div>
                      <p className="font-medium">{tech.technicianName || `${tech.firstName} ${tech.lastName}`}</p>
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
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

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
          <TabsList className="grid w-full grid-cols-6 mb-6">
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
              
              <div className="mt-8 space-y-6 border-t pt-6">
                <div>
                  <h3 className="text-md font-semibold mb-4">Email Settings</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure email distribution and content for sending reports
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Subject Line Template
                    </label>
                    <Input
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="e.g., La Perle Training Report - {{date}}"
                      data-testid="input-email-subject"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Use {'{{date}}'} to insert the report date
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Email Body Prefix
                    </label>
                    <Textarea
                      value={emailBodyPrefix}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEmailBodyPrefix(e.target.value)}
                      placeholder="Enter text that will appear before the training details..."
                      rows={4}
                      data-testid="textarea-email-body"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      This text will appear before the training details in the email
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      To Recipients
                    </label>
                    <div className="space-y-2">
                      {emailTo.map((email, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={email}
                            onChange={(e) => {
                              const newEmailTo = [...emailTo];
                              newEmailTo[index] = e.target.value;
                              setEmailTo(newEmailTo);
                            }}
                            placeholder="email@example.com"
                            type="email"
                            data-testid={`input-email-to-${index}`}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEmailTo(emailTo.filter((_, i) => i !== index))}
                            data-testid={`button-remove-to-${index}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEmailTo([...emailTo, ""])}
                        data-testid="button-add-to"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add To Recipient
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      CC Recipients
                    </label>
                    <div className="space-y-2">
                      {emailCc.map((email, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={email}
                            onChange={(e) => {
                              const newEmailCc = [...emailCc];
                              newEmailCc[index] = e.target.value;
                              setEmailCc(newEmailCc);
                            }}
                            placeholder="email@example.com"
                            type="email"
                            data-testid={`input-email-cc-${index}`}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEmailCc(emailCc.filter((_, i) => i !== index))}
                            data-testid={`button-remove-cc-${index}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEmailCc([...emailCc, ""])}
                        data-testid="button-add-cc"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add CC Recipient
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      BCC Recipients
                    </label>
                    <div className="space-y-2">
                      {emailBcc.map((email, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={email}
                            onChange={(e) => {
                              const newEmailBcc = [...emailBcc];
                              newEmailBcc[index] = e.target.value;
                              setEmailBcc(newEmailBcc);
                            }}
                            placeholder="email@example.com"
                            type="email"
                            data-testid={`input-email-bcc-${index}`}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEmailBcc(emailBcc.filter((_, i) => i !== index))}
                            data-testid={`button-remove-bcc-${index}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEmailBcc([...emailBcc, ""])}
                        data-testid="button-add-bcc"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add BCC Recipient
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
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
              <div className="flex gap-2">
                <Dialog
                  open={sceneDialogOpen}
                  onOpenChange={(open) => {
                    setSceneDialogOpen(open);
                    if (!open) {
                      setSceneFormOpen(false);
                      setEditTarget(null);
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" data-testid="button-scenes">
                      Scenes
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Manage Scenes</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <Button 
                        onClick={() => setSceneFormOpen(true)} 
                        className="w-full"
                        data-testid="button-add-scene"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Scene
                      </Button>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto">
                        {[...scenes].sort((a, b) => {
                          // Put RESCUE SCENARIOS and FULL SHOW at the bottom
                          const aIsBottom = a.name === "RESCUE SCENARIOS" || a.name === "FULL SHOW";
                          const bIsBottom = b.name === "RESCUE SCENARIOS" || b.name === "FULL SHOW";
                          
                          if (aIsBottom && !bIsBottom) return 1;
                          if (!aIsBottom && bIsBottom) return -1;
                          
                          // Otherwise maintain original sort order
                          return a.sortOrder - b.sortOrder;
                        }).map((scene) => (
                          <Card key={scene.id} className="p-3 flex items-center justify-between" data-testid={`card-scene-${scene.id}`}>
                            <p className="font-medium">{scene.name}</p>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditTarget({ type: "scene", id: scene.id, data: scene });
                                  setSceneFormOpen(true);
                                }}
                                data-testid={`button-edit-scene-${scene.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setDeleteTarget({ type: "scene", id: scene.id });
                                  setDeleteDialogOpen(true);
                                }}
                                data-testid={`button-delete-scene-${scene.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </Card>
                        ))}
                        {scenes.length === 0 && (
                          <Card className="p-6 text-center text-muted-foreground">
                            <p>No scenes yet. Add one above.</p>
                          </Card>
                        )}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Scene Add/Edit Form Dialog */}
                <Dialog
                  open={sceneFormOpen}
                  onOpenChange={(open) => {
                    setSceneFormOpen(open);
                    if (!open) setEditTarget(null);
                  }}
                >
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const name = formData.get("name") as string;
                        
                        if (editTarget?.type === "scene") {
                          updateSceneMutation.mutate({
                            id: editTarget.id,
                            name,
                            sortOrder: editTarget.data.sortOrder,
                            departmentIds: selectedSceneDepartmentIds,
                            artistGroupIds: selectedSceneArtistGroupIds,
                            artistIds: selectedSceneArtistIds,
                          });
                        } else {
                          createSceneMutation.mutate({
                            name,
                            sortOrder: scenes.length,
                            departmentIds: selectedSceneDepartmentIds,
                            artistGroupIds: selectedSceneArtistGroupIds,
                            artistIds: selectedSceneArtistIds,
                          });
                        }
                      }}
                    >
                      <DialogHeader>
                        <DialogTitle>{editTarget?.type === "scene" ? "Edit Scene" : "Add Scene"}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="scene-name">Scene Name</Label>
                          <Input
                            id="scene-name"
                            name="name"
                            placeholder="Enter scene name"
                            defaultValue={editTarget?.type === "scene" ? editTarget.data.name : ""}
                            required
                            data-testid="input-scene-name"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Departments</Label>
                          <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                            {departments.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No departments available</p>
                            ) : (
                              <>
                                {/* ALL DEPARTMENTS Checkbox */}
                                <div className="flex items-center space-x-2 pb-2 border-b-2">
                                  <Checkbox
                                    id="scene-all-departments"
                                    checked={departments.every(d => selectedSceneDepartmentIds.includes(d.id))}
                                    data-state={departments.some(d => selectedSceneDepartmentIds.includes(d.id)) && !departments.every(d => selectedSceneDepartmentIds.includes(d.id)) ? "indeterminate" : undefined}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedSceneDepartmentIds(departments.map(d => d.id));
                                      } else {
                                        setSelectedSceneDepartmentIds([]);
                                      }
                                    }}
                                    data-testid="checkbox-scene-all-departments"
                                  />
                                  <Label
                                    htmlFor="scene-all-departments"
                                    className="text-sm font-bold cursor-pointer flex-1 uppercase"
                                  >
                                    All Departments
                                  </Label>
                                </div>

                                {[...departments].sort((a, b) => a.name.localeCompare(b.name)).map((dept) => (
                                  <div key={dept.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`scene-dept-${dept.id}`}
                                      checked={selectedSceneDepartmentIds.includes(dept.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedSceneDepartmentIds([...selectedSceneDepartmentIds, dept.id]);
                                        } else {
                                          setSelectedSceneDepartmentIds(selectedSceneDepartmentIds.filter(id => id !== dept.id));
                                        }
                                      }}
                                      data-testid={`checkbox-scene-dept-${dept.id}`}
                                    />
                                    <Label
                                      htmlFor={`scene-dept-${dept.id}`}
                                      className="text-sm font-normal cursor-pointer flex-1"
                                    >
                                      {dept.name}
                                    </Label>
                                  </div>
                                ))}
                              </>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Artists</Label>
                          <div className="border rounded-md p-3 space-y-3 max-h-64 overflow-y-auto">
                            {artists.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No artists available</p>
                            ) : (
                              <>
                                {/* ALL ARTISTS Checkbox */}
                                <div className="flex items-center space-x-2 pb-2 border-b-2">
                                  <Checkbox
                                    id="scene-all-artists"
                                    checked={artists.every(a => selectedSceneArtistIds.includes(a.id))}
                                    data-state={artists.some(a => selectedSceneArtistIds.includes(a.id)) && !artists.every(a => selectedSceneArtistIds.includes(a.id)) ? "indeterminate" : undefined}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        // Select all artists and all artist groups
                                        setSelectedSceneArtistIds(artists.map(a => a.id));
                                        setSelectedSceneArtistGroupIds(artistGroups.map(g => g.id));
                                      } else {
                                        // Deselect all artists and all artist groups
                                        setSelectedSceneArtistIds([]);
                                        setSelectedSceneArtistGroupIds([]);
                                      }
                                    }}
                                    data-testid="checkbox-scene-all-artists"
                                  />
                                  <Label
                                    htmlFor="scene-all-artists"
                                    className="text-sm font-bold cursor-pointer flex-1 uppercase"
                                  >
                                    All Artists
                                  </Label>
                                </div>
                                
                                {artistGroups.map((group) => {
                                  const groupArtists = artists.filter(a => a.artistGroupId === group.id);
                                  if (groupArtists.length === 0) return null;
                                  
                                  const allArtistsSelected = groupArtists.every(a => selectedSceneArtistIds.includes(a.id));
                                  const someArtistsSelected = groupArtists.some(a => selectedSceneArtistIds.includes(a.id)) && !allArtistsSelected;
                                  
                                  return (
                                    <div key={group.id} className="space-y-2">
                                      <div className="flex items-center space-x-2 pb-1 border-b">
                                        <Checkbox
                                          id={`scene-artist-group-${group.id}`}
                                          checked={selectedSceneArtistGroupIds.includes(group.id) || allArtistsSelected}
                                          data-state={someArtistsSelected ? "indeterminate" : undefined}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              setSelectedSceneArtistGroupIds([...selectedSceneArtistGroupIds, group.id]);
                                              const groupArtistIds = groupArtists.map(a => a.id);
                                              setSelectedSceneArtistIds([...new Set([...selectedSceneArtistIds, ...groupArtistIds])]);
                                            } else {
                                              setSelectedSceneArtistGroupIds(selectedSceneArtistGroupIds.filter(id => id !== group.id));
                                              const groupArtistIds = groupArtists.map(a => a.id);
                                              setSelectedSceneArtistIds(selectedSceneArtistIds.filter(id => !groupArtistIds.includes(id)));
                                            }
                                          }}
                                          data-testid={`checkbox-scene-artist-group-${group.id}`}
                                        />
                                        <Label
                                          htmlFor={`scene-artist-group-${group.id}`}
                                          className="text-sm font-semibold cursor-pointer flex-1"
                                        >
                                          {group.name}
                                        </Label>
                                      </div>
                                      
                                      <div className="pl-6 space-y-2">
                                        {groupArtists.map((artist) => {
                                          const displayName = artist.stageName || `${artist.firstName} ${artist.lastName}`;
                                          return (
                                            <div key={artist.id} className="flex items-center space-x-2">
                                              <Checkbox
                                                id={`scene-artist-${artist.id}`}
                                                checked={selectedSceneArtistIds.includes(artist.id)}
                                                onCheckedChange={(checked) => {
                                                  if (checked) {
                                                    setSelectedSceneArtistIds([...selectedSceneArtistIds, artist.id]);
                                                  } else {
                                                    setSelectedSceneArtistIds(selectedSceneArtistIds.filter(id => id !== artist.id));
                                                    setSelectedSceneArtistGroupIds(selectedSceneArtistGroupIds.filter(id => id !== group.id));
                                                  }
                                                }}
                                                data-testid={`checkbox-scene-artist-${artist.id}`}
                                              />
                                              <Label
                                                htmlFor={`scene-artist-${artist.id}`}
                                                className="text-sm font-normal cursor-pointer flex-1"
                                              >
                                                <div>
                                                  <div>{displayName}</div>
                                                  {artist.role && (
                                                    <div className="text-xs text-muted-foreground">{artist.role}</div>
                                                  )}
                                                </div>
                                              </Label>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                                
                                {artists.filter(a => !a.artistGroupId).length > 0 && (
                                  <div className="space-y-2">
                                    <div className="text-sm font-semibold pb-1 border-b">No Group</div>
                                    <div className="space-y-2">
                                      {artists.filter(a => !a.artistGroupId).map((artist) => {
                                        const displayName = artist.stageName || `${artist.firstName} ${artist.lastName}`;
                                        return (
                                          <div key={artist.id} className="flex items-center space-x-2">
                                            <Checkbox
                                              id={`scene-artist-${artist.id}`}
                                              checked={selectedSceneArtistIds.includes(artist.id)}
                                              onCheckedChange={(checked) => {
                                                if (checked) {
                                                  setSelectedSceneArtistIds([...selectedSceneArtistIds, artist.id]);
                                                } else {
                                                  setSelectedSceneArtistIds(selectedSceneArtistIds.filter(id => id !== artist.id));
                                                }
                                              }}
                                              data-testid={`checkbox-scene-artist-${artist.id}`}
                                            />
                                            <Label
                                              htmlFor={`scene-artist-${artist.id}`}
                                              className="text-sm font-normal cursor-pointer flex-1"
                                            >
                                              <div>
                                                <div>{displayName}</div>
                                                {artist.role && (
                                                  <div className="text-xs text-muted-foreground">{artist.role}</div>
                                                )}
                                              </div>
                                            </Label>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button 
                          type="submit" 
                          disabled={createSceneMutation.isPending || updateSceneMutation.isPending}
                          data-testid="button-save-scene"
                        >
                          {editTarget?.type === "scene" ? "Update Scene" : "Add Scene"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
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
                          sceneId: editTarget.data.sceneId === "none" || !editTarget.data.sceneId ? null : editTarget.data.sceneId,
                          sortOrder: editTarget.data.sortOrder,
                          departmentIds: selectedDepartmentIds,
                          artistGroupIds: selectedArtistGroupIds,
                          artistIds: selectedArtistIds,
                        });
                      } else {
                        createActMutation.mutate({
                          name,
                          sceneId: selectedSceneId === "none" || !selectedSceneId ? undefined : selectedSceneId,
                          sortOrder: acts.length,
                          departmentIds: selectedDepartmentIds,
                          artistGroupIds: selectedArtistGroupIds,
                          artistIds: selectedArtistIds,
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
                      <div className="space-y-2">
                        <Label htmlFor="scene-select">Scene</Label>
                        <Select
                          name="sceneId"
                          required
                          value={editTarget?.type === "act" ? editTarget.data.sceneId : selectedSceneId}
                          onValueChange={(value) => {
                            if (editTarget?.type === "act") {
                              setEditTarget({ ...editTarget, data: { ...editTarget.data, sceneId: value } });
                            } else {
                              setSelectedSceneId(value);
                            }
                          }}
                        >
                          <SelectTrigger id="scene-select" data-testid="select-scene">
                            <SelectValue placeholder="Select a scene" />
                          </SelectTrigger>
                          <SelectContent>
                            {[...scenes].sort((a, b) => {
                              // Put RESCUE SCENARIOS and FULL SHOW at the bottom
                              const aIsBottom = a.name === "RESCUE SCENARIOS" || a.name === "FULL SHOW";
                              const bIsBottom = b.name === "RESCUE SCENARIOS" || b.name === "FULL SHOW";
                              
                              if (aIsBottom && !bIsBottom) return 1;
                              if (!aIsBottom && bIsBottom) return -1;
                              
                              // Otherwise maintain original sort order
                              return a.sortOrder - b.sortOrder;
                            }).map((scene) => (
                              <SelectItem key={scene.id} value={scene.id}>
                                {scene.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Departments</Label>
                        <div className="border rounded-md p-3 space-y-2 max-h-48 overflow-y-auto">
                          {departments.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No departments available</p>
                          ) : (
                            <>
                              {/* ALL DEPARTMENTS Checkbox */}
                              <div className="flex items-center space-x-2 pb-2 border-b-2">
                                <Checkbox
                                  id="act-all-departments"
                                  checked={departments.every(d => selectedDepartmentIds.includes(d.id))}
                                  data-state={departments.some(d => selectedDepartmentIds.includes(d.id)) && !departments.every(d => selectedDepartmentIds.includes(d.id)) ? "indeterminate" : undefined}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedDepartmentIds(departments.map(d => d.id));
                                    } else {
                                      setSelectedDepartmentIds([]);
                                    }
                                  }}
                                  data-testid="checkbox-act-all-departments"
                                />
                                <Label
                                  htmlFor="act-all-departments"
                                  className="text-sm font-bold cursor-pointer flex-1 uppercase"
                                >
                                  All Departments
                                </Label>
                              </div>

                              {[...departments].sort((a, b) => a.name.localeCompare(b.name)).map((dept) => (
                                <div key={dept.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`dept-${dept.id}`}
                                    checked={selectedDepartmentIds.includes(dept.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedDepartmentIds([...selectedDepartmentIds, dept.id]);
                                      } else {
                                        setSelectedDepartmentIds(selectedDepartmentIds.filter(id => id !== dept.id));
                                      }
                                    }}
                                    data-testid={`checkbox-dept-${dept.id}`}
                                  />
                                  <Label
                                    htmlFor={`dept-${dept.id}`}
                                    className="text-sm font-normal cursor-pointer flex-1"
                                  >
                                    {dept.name}
                                  </Label>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Artists</Label>
                        <div className="border rounded-md p-3 space-y-3 max-h-64 overflow-y-auto">
                          {artists.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No artists available</p>
                          ) : (
                            <>
                              {/* ALL ARTISTS Checkbox */}
                              <div className="flex items-center space-x-2 pb-2 border-b-2">
                                <Checkbox
                                  id="act-all-artists"
                                  checked={artists.every(a => selectedArtistIds.includes(a.id))}
                                  data-state={artists.some(a => selectedArtistIds.includes(a.id)) && !artists.every(a => selectedArtistIds.includes(a.id)) ? "indeterminate" : undefined}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      // Select all artists and all artist groups
                                      setSelectedArtistIds(artists.map(a => a.id));
                                      setSelectedArtistGroupIds(artistGroups.map(g => g.id));
                                    } else {
                                      // Deselect all artists and all artist groups
                                      setSelectedArtistIds([]);
                                      setSelectedArtistGroupIds([]);
                                    }
                                  }}
                                  data-testid="checkbox-act-all-artists"
                                />
                                <Label
                                  htmlFor="act-all-artists"
                                  className="text-sm font-bold cursor-pointer flex-1 uppercase"
                                >
                                  All Artists
                                </Label>
                              </div>
                              
                              {/* Group artists by artist group */}
                              {artistGroups.map((group) => {
                                const groupArtists = artists.filter(a => a.artistGroupId === group.id);
                                if (groupArtists.length === 0) return null;
                                
                                const allArtistsSelected = groupArtists.every(a => selectedArtistIds.includes(a.id));
                                const someArtistsSelected = groupArtists.some(a => selectedArtistIds.includes(a.id)) && !allArtistsSelected;
                                
                                return (
                                  <div key={group.id} className="space-y-2">
                                    {/* Artist Group Checkbox */}
                                    <div className="flex items-center space-x-2 pb-1 border-b">
                                      <Checkbox
                                        id={`artist-group-${group.id}`}
                                        checked={selectedArtistGroupIds.includes(group.id) || allArtistsSelected}
                                        data-state={someArtistsSelected ? "indeterminate" : undefined}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            // Add artist group and all its artists
                                            setSelectedArtistGroupIds([...selectedArtistGroupIds, group.id]);
                                            const groupArtistIds = groupArtists.map(a => a.id);
                                            setSelectedArtistIds([...new Set([...selectedArtistIds, ...groupArtistIds])]);
                                          } else {
                                            // Remove artist group and all its artists
                                            setSelectedArtistGroupIds(selectedArtistGroupIds.filter(id => id !== group.id));
                                            const groupArtistIds = groupArtists.map(a => a.id);
                                            setSelectedArtistIds(selectedArtistIds.filter(id => !groupArtistIds.includes(id)));
                                          }
                                        }}
                                        data-testid={`checkbox-artist-group-${group.id}`}
                                      />
                                      <Label
                                        htmlFor={`artist-group-${group.id}`}
                                        className="text-sm font-semibold cursor-pointer flex-1"
                                      >
                                        {group.name}
                                      </Label>
                                    </div>
                                    
                                    {/* Individual Artists */}
                                    <div className="pl-6 space-y-2">
                                      {groupArtists.map((artist) => {
                                        const displayName = artist.stageName || `${artist.firstName} ${artist.lastName}`;
                                        return (
                                          <div key={artist.id} className="flex items-center space-x-2">
                                            <Checkbox
                                              id={`artist-${artist.id}`}
                                              checked={selectedArtistIds.includes(artist.id)}
                                              onCheckedChange={(checked) => {
                                                if (checked) {
                                                  setSelectedArtistIds([...selectedArtistIds, artist.id]);
                                                } else {
                                                  setSelectedArtistIds(selectedArtistIds.filter(id => id !== artist.id));
                                                  setSelectedArtistGroupIds(selectedArtistGroupIds.filter(id => id !== group.id));
                                                }
                                              }}
                                              data-testid={`checkbox-artist-${artist.id}`}
                                            />
                                            <Label
                                              htmlFor={`artist-${artist.id}`}
                                              className="text-sm font-normal cursor-pointer flex-1"
                                            >
                                              <div>
                                                <div>{displayName}</div>
                                                {artist.role && (
                                                  <div className="text-xs text-muted-foreground">{artist.role}</div>
                                                )}
                                              </div>
                                            </Label>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                              
                              {/* Artists without a group */}
                              {artists.filter(a => !a.artistGroupId).length > 0 && (
                                <div className="space-y-2">
                                  <div className="text-sm font-semibold pb-1 border-b">No Group</div>
                                  <div className="space-y-2">
                                    {artists.filter(a => !a.artistGroupId).map((artist) => {
                                      const displayName = artist.stageName || `${artist.firstName} ${artist.lastName}`;
                                      return (
                                        <div key={artist.id} className="flex items-center space-x-2">
                                          <Checkbox
                                            id={`artist-${artist.id}`}
                                            checked={selectedArtistIds.includes(artist.id)}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                setSelectedArtistIds([...selectedArtistIds, artist.id]);
                                              } else {
                                                setSelectedArtistIds(selectedArtistIds.filter(id => id !== artist.id));
                                              }
                                            }}
                                            data-testid={`checkbox-artist-${artist.id}`}
                                          />
                                          <Label
                                            htmlFor={`artist-${artist.id}`}
                                            className="text-sm font-normal cursor-pointer flex-1"
                                          >
                                            <div>
                                              <div>{displayName}</div>
                                              {artist.role && (
                                                <div className="text-xs text-muted-foreground">{artist.role}</div>
                                              )}
                                            </div>
                                          </Label>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
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
            </div>
            {renderGroupedActs()}
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
            {renderSimpleList([...departments].sort((a, b) => a.name.localeCompare(b.name)), "department")}
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
            {renderGroupedLocations()}
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
                  <div className="flex gap-2">
                    <Dialog
                      open={groupDialogOpen}
                      onOpenChange={(open) => {
                        setGroupDialogOpen(open);
                        if (!open) setEditTarget(null);
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" data-testid="button-groups">
                          Groups
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Manage Groups</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
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
                              e.currentTarget.reset();
                            }}
                          >
                            <div className="flex gap-2">
                              <Input
                                id="group-name"
                                name="name"
                                placeholder="Enter group name"
                                defaultValue={editTarget?.type === "group" ? editTarget.data.name : ""}
                                required
                                data-testid="input-group-name"
                              />
                              <Button 
                                type="submit"
                                disabled={createGroupMutation.isPending || updateGroupMutation.isPending}
                                data-testid="button-save-group"
                              >
                                {editTarget?.type === "group" ? "Update" : "Add"}
                              </Button>
                            </div>
                          </form>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {artistGroups.map((group) => (
                              <Card key={group.id} className="p-3 flex items-center justify-between" data-testid={`card-group-${group.id}`}>
                                <p className="font-medium">{group.name}</p>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setEditTarget({ type: "group", id: group.id, data: group });
                                    }}
                                    data-testid={`button-edit-group-${group.id}`}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setDeleteTarget({ type: "group", id: group.id });
                                      setDeleteDialogOpen(true);
                                    }}
                                    data-testid={`button-delete-group-${group.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
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
                          const stageName = formData.get("stageName") as string;
                          const role = (formData.get("role") as string) || undefined;
                          const artistGroupId = formData.get("groupId") as string;

                          if (editTarget?.type === "artist") {
                            updateArtistMutation.mutate({
                              id: editTarget.id,
                              firstName,
                              lastName,
                              stageName,
                              role,
                              artistGroupId,
                            });
                          } else {
                            createArtistMutation.mutate({
                              firstName,
                              lastName,
                              stageName,
                              role,
                              artistGroupId,
                            });
                          }
                        }}
                      >
                        <DialogHeader>
                          <DialogTitle>{editTarget?.type === "artist" ? "Edit Artist" : "Add Artist"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Artist Name</Label>
                            <Input 
                              name="stageName" 
                              placeholder="Artist name" 
                              required
                              defaultValue={editTarget?.type === "artist" ? editTarget.data.stageName || "" : ""}
                              data-testid="input-artist-stagename" 
                            />
                          </div>
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
                            <Label>Role</Label>
                            <Input 
                              name="role" 
                              placeholder="Character name or position" 
                              defaultValue={editTarget?.type === "artist" ? editTarget.data.role || "" : ""}
                              data-testid="input-artist-role" 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Group</Label>
                            <Select 
                              name="groupId" 
                              required
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
              </div>
              {renderGroupedArtists()}
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
                          const technicianName = (formData.get("technicianName") as string) || undefined;
                          const role = (formData.get("role") as string) || undefined;

                          if (editTarget?.type === "technician") {
                            updateTechMutation.mutate({
                              id: editTarget.id,
                              firstName,
                              lastName,
                              technicianName,
                              role,
                              departmentIds: selectedTechnicianDepartmentIds,
                            });
                          } else {
                            createTechMutation.mutate({
                              firstName,
                              lastName,
                              technicianName,
                              role,
                              departmentIds: selectedTechnicianDepartmentIds,
                            });
                          }
                        }}
                      >
                        <DialogHeader>
                          <DialogTitle>{editTarget?.type === "technician" ? "Edit Technician" : "Add Technician"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Technician Name</Label>
                            <Input 
                              name="technicianName" 
                              placeholder="Technician name"
                              defaultValue={editTarget?.type === "technician" ? editTarget.data.technicianName || "" : ""}
                              data-testid="input-tech-name" 
                            />
                          </div>
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
                            <Label>Role</Label>
                            <Input 
                              name="role" 
                              placeholder="Position or specialty" 
                              defaultValue={editTarget?.type === "technician" ? editTarget.data.role || "" : ""}
                              data-testid="input-tech-role" 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Departments (Multiple)</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal" data-testid="select-tech-departments">
                                  {selectedTechnicianDepartmentIds.length > 0 ? (
                                    <span className="truncate">
                                      {selectedTechnicianDepartmentIds.map(id => {
                                        const dept = departments.find(d => d.id === id);
                                        return dept?.name;
                                      }).join(", ")}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">Select departments...</span>
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 p-0" align="start">
                                <div className="max-h-96 overflow-y-auto p-4 space-y-2">
                                  {[...departments].sort((a, b) => a.name.localeCompare(b.name)).map((dept) => (
                                    <div key={dept.id} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`tech-dept-${dept.id}`}
                                        checked={selectedTechnicianDepartmentIds.includes(dept.id)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setSelectedTechnicianDepartmentIds([...selectedTechnicianDepartmentIds, dept.id]);
                                          } else {
                                            setSelectedTechnicianDepartmentIds(selectedTechnicianDepartmentIds.filter(id => id !== dept.id));
                                          }
                                        }}
                                        data-testid={`checkbox-tech-dept-${dept.id}`}
                                      />
                                      <label htmlFor={`tech-dept-${dept.id}`} className="text-sm cursor-pointer">
                                        {dept.name}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
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
                {renderGroupedTechnicians()}
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setUserToDelete(user.id);
                          setAdminPasswordDialogOpen(true);
                        }}
                        data-testid={`button-delete-user-${user.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
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

      <Dialog open={adminPasswordDialogOpen} onOpenChange={setAdminPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Authentication Required</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-username">Admin Username</Label>
              <Input
                id="admin-username"
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="Enter admin username"
                data-testid="input-admin-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Admin Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter admin password"
                data-testid="input-admin-password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setAdminPasswordDialogOpen(false);
                setUserToDelete(null);
                setAdminUsername("");
                setAdminPassword("");
              }}
              data-testid="button-cancel-delete-user"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={() => {
                if (userToDelete) {
                  deleteUserMutation.mutate({
                    id: userToDelete,
                    adminUsername,
                    adminPassword,
                  });
                }
              }}
              disabled={!adminUsername || !adminPassword || deleteUserMutation.isPending}
              data-testid="button-confirm-delete-user"
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
