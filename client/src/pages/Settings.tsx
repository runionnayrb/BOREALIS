import { useState, useEffect, useMemo } from "react";
import { Plus, Users, Briefcase, Theater, UsersRound, FileText, MapPin, Trash2, Edit, Settings as SettingsIcon, Shield, UserCircle2, GripVertical, KeyRound, Copy, Check, Archive } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { PhotoUploader } from "@/components/PhotoUploader";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import type { 
  Scene, Act, Cue, Department, LocationType, Location, ArtistGroup, Artist, Technician, ReportTemplate, SafeUser, UserGroup
} from "@shared/schema";
import { cueTypes, type CueType } from "@shared/schema";

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
  const [cueDialogOpen, setCueDialogOpen] = useState(false);
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [locationTypeDialogOpen, setLocationTypeDialogOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [artistDialogOpen, setArtistDialogOpen] = useState(false);
  const [techDialogOpen, setTechDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null);
  const [editTarget, setEditTarget] = useState<{ type: string; id: string; data: any } | null>(null);
  const [uploadedPhotoUrl, setUploadedPhotoUrl] = useState<string | null>(null);
  
  const [selectedCueType, setSelectedCueType] = useState<string | undefined>(undefined);
  const [selectedCueDepartmentIds, setSelectedCueDepartmentIds] = useState<string[]>([]);
  const [selectedCueArtistIds, setSelectedCueArtistIds] = useState<string[]>([]);
  const [selectedCueArtistGroupIds, setSelectedCueArtistGroupIds] = useState<string[]>([]);
  
  // Admin password dialog for user deletion
  const [adminPasswordDialogOpen, setAdminPasswordDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  
  // Edit user dialog
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<SafeUser | null>(null);
  const [selectedUserGroupId, setSelectedUserGroupId] = useState<string | null>(null);
  const [userGroupDialogOpen, setUserGroupDialogOpen] = useState(false);
  const [createUserDialogOpen, setCreateUserDialogOpen] = useState(false);
  
  // Password reset dialog
  const [passwordResetDialogOpen, setPasswordResetDialogOpen] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState<string | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<SafeUser | null>(null);
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
  
  // Department type selection
  const [selectedDepartmentType, setSelectedDepartmentType] = useState<'technical' | 'artistic'>("technical");
  
  // Local state for artist ordering
  const [orderedArtists, setOrderedArtists] = useState<Artist[]>([]);

  // Local state for technician ordering
  const [orderedTechnicians, setOrderedTechnicians] = useState<Technician[]>([]);

  // Optimistic state for technician reordering per department
  // Maps departmentId to array of technicianIds in their current order
  const [optimisticTechnicianOrder, setOptimisticTechnicianOrder] = useState<Map<string, string[]>>(new Map());

  // User linking state for artists
  const [selectedLinkedUserId, setSelectedLinkedUserId] = useState<string | null>(null);
  
  // User linking state for technicians
  const [selectedLinkedTechUserId, setSelectedLinkedTechUserId] = useState<string | null>(null);
  
  // Status state for technicians
  const [selectedTechnicianStatus, setSelectedTechnicianStatus] = useState<string>("active");
  
  // Archive artist confirmation dialog
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [artistToArchive, setArtistToArchive] = useState<string | null>(null);
  
  // Archive technician confirmation dialog
  const [archiveTechDialogOpen, setArchiveTechDialogOpen] = useState(false);
  const [technicianToArchive, setTechnicianToArchive] = useState<string | null>(null);
  
  // View archived artists dialog
  const [viewArchivedDialogOpen, setViewArchivedDialogOpen] = useState(false);
  
  // View archived technicians dialog
  const [viewArchivedTechniciansDialogOpen, setViewArchivedTechniciansDialogOpen] = useState(false);

  const { toast} = useToast();
  const { user } = useAuth();
  
  // Check if user is a stage manager or admin
  const isStageManager = user?.role === 'stage_management' || user?.role === 'admin';

  // Fetch all settings data
  const { data: scenes = [] } = useQuery<Scene[]>({ queryKey: ["/api/scenes"] });
  const { data: acts = [] } = useQuery<Act[]>({ queryKey: ["/api/acts"] });
  const { data: cues = [] } = useQuery<Cue[]>({ queryKey: ["/api/cues"] });
  const { data: departments = [] } = useQuery<Department[]>({ queryKey: ["/api/departments"] });
  const { data: locationTypes = [] } = useQuery<LocationType[]>({ queryKey: ["/api/location-types"] });
  const { data: locations = [] } = useQuery<Location[]>({ queryKey: ["/api/locations"] });
  const { data: artistGroups = [] } = useQuery<ArtistGroup[]>({ queryKey: ["/api/artist-groups"] });
  const artistsQuery = useQuery<Artist[]>({ queryKey: ["/api/artists"] });
  const archivedArtistsQuery = useQuery<Artist[]>({ 
    queryKey: ["/api/artists/archived"],
    enabled: viewArchivedDialogOpen,
  });
  const artists = artistsQuery.data || [];
  const techniciansQuery = useQuery<Technician[]>({ queryKey: ["/api/technicians"] });
  const technicians = techniciansQuery.data || [];
  const { data: reportTemplate } = useQuery<ReportTemplate | null>({ queryKey: ["/api/report-template"] });
  const usersQuery = useQuery<SafeUser[]>({ queryKey: ["/api/users"] });
  const users = usersQuery.data || [];
  const { data: userGroups = [] } = useQuery<UserGroup[]>({ queryKey: ["/api/user-groups"] });
  
  // Fetch all technician-department assignments for grouping
  const { data: allTechnicianDepartments = [] } = useQuery<Array<{ technicianId: string; departmentId: string; sortOrder: number }>>({
    queryKey: ["/api/technician-departments/all", technicians.map(t => t.id).sort().join(',')],
    queryFn: async () => {
      // Fetch department assignments for all technicians
      const assignments = await Promise.all(
        technicians.map(async (tech) => {
          const res = await fetch(`/api/technicians/${tech.id}/departments`, {
            credentials: "include"
          });
          if (!res.ok) return [];
          const depts = await res.json();
          return depts.map((d: any) => ({ technicianId: tech.id, departmentId: d.departmentId, sortOrder: d.sortOrder || 0 }));
        })
      );
      return assignments.flat();
    },
    enabled: technicians.length > 0
  });

  // Load department type when editing a department
  useEffect(() => {
    if (editTarget?.type === "department" && editTarget.data) {
      setSelectedDepartmentType(editTarget.data.type || 'technical');
    } else if (!editTarget || editTarget.type !== "department") {
      setSelectedDepartmentType('technical');
    }
  }, [editTarget]);

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

  // Load cue departments when editing a cue
  useEffect(() => {
    if (editTarget?.type === "cue" && editTarget.id) {
      fetch(`/api/cues/${editTarget.id}/departments`, {
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
          setSelectedCueDepartmentIds(data.map((cd: any) => cd.departmentId));
        })
        .catch(err => {
          console.error("Error loading cue departments:", err);
          setSelectedCueDepartmentIds([]);
        });
    } else if (!editTarget || editTarget.type !== "cue") {
      setSelectedCueDepartmentIds([]);
    }
  }, [editTarget]);

  // Load cue artists when editing a cue
  useEffect(() => {
    if (editTarget?.type === "cue" && editTarget.id) {
      fetch(`/api/cues/${editTarget.id}/artists`, {
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
          setSelectedCueArtistIds(data.map((ca: any) => ca.artistId));
        })
        .catch(err => {
          console.error("Error loading cue artists:", err);
          setSelectedCueArtistIds([]);
        });
    } else if (!editTarget || editTarget.type !== "cue") {
      setSelectedCueArtistIds([]);
    }
  }, [editTarget]);

  // Load cue artist groups when editing a cue
  useEffect(() => {
    if (editTarget?.type === "cue" && editTarget.id) {
      fetch(`/api/cues/${editTarget.id}/artist-groups`, {
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
          setSelectedCueArtistGroupIds(data.map((cag: any) => cag.artistGroupId));
        })
        .catch(err => {
          console.error("Error loading cue artist groups:", err);
          setSelectedCueArtistGroupIds([]);
        });
    } else if (!editTarget || editTarget.type !== "cue") {
      setSelectedCueArtistGroupIds([]);
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

  // Reset uploaded photo URL when opening artist dialog or changing edit target
  useEffect(() => {
    if (!artistDialogOpen || editTarget?.type !== "artist") {
      setUploadedPhotoUrl(null);
    }
  }, [artistDialogOpen, editTarget]);

  // Sync local artist order with query data
  useEffect(() => {
    if (artistsQuery.data) {
      setOrderedArtists(artistsQuery.data);
    }
  }, [artistsQuery.data]);

  useEffect(() => {
    if (technicians) {
      setOrderedTechnicians([...technicians].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
    }
  }, [technicians]);

  // Clear optimistic state once server data is synced
  useEffect(() => {
    if (allTechnicianDepartments.length > 0) {
      // Build server order map from fetched data
      const serverOrders = new Map<string, string[]>();
      
      allTechnicianDepartments.forEach(({ technicianId, departmentId }) => {
        if (!serverOrders.has(departmentId)) {
          serverOrders.set(departmentId, []);
        }
        serverOrders.get(departmentId)!.push(technicianId);
      });
      
      // Sort each department's technicians by sortOrder
      serverOrders.forEach((techIds, deptId) => {
        const sorted = techIds.sort((a, b) => {
          const techA = allTechnicianDepartments.find(td => td.departmentId === deptId && td.technicianId === a);
          const techB = allTechnicianDepartments.find(td => td.departmentId === deptId && td.technicianId === b);
          return (techA?.sortOrder ?? 0) - (techB?.sortOrder ?? 0);
        });
        serverOrders.set(deptId, sorted);
      });
      
      // Clear optimistic states that match server state
      setOptimisticTechnicianOrder(prev => {
        const newMap = new Map(prev);
        let hasChanges = false;
        
        for (const [deptId, optimisticIds] of Array.from(prev.entries())) {
          const serverIds = serverOrders.get(deptId);
          if (serverIds && JSON.stringify(optimisticIds) === JSON.stringify(serverIds)) {
            newMap.delete(deptId);
            hasChanges = true;
          }
        }
        
        return hasChanges ? newMap : prev;
      });
    }
  }, [allTechnicianDepartments]);

  // Drag-and-drop sensors for artist reordering
  const artistDragSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleArtistDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = orderedArtists.findIndex((a) => a.id === active.id);
      const newIndex = orderedArtists.findIndex((a) => a.id === over.id);
      
      const newArtists = arrayMove(orderedArtists, oldIndex, newIndex);
      setOrderedArtists(newArtists);
      reorderArtistsMutation.mutate(newArtists.map(a => a.id));
    }
  };

  // Drag-and-drop sensors for technician reordering
  const technicianDragSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleTechnicianDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = orderedTechnicians.findIndex((t) => t.id === active.id);
      const newIndex = orderedTechnicians.findIndex((t) => t.id === over.id);
      
      const newTechs = arrayMove(orderedTechnicians, oldIndex, newIndex);
      setOrderedTechnicians(newTechs);
      reorderTechniciansMutation.mutate(newTechs.map(t => t.id));
    }
  };

  const showFlowDragSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleShowFlowDragEnd = (sceneId: string, items: Array<{id: string; type: 'act' | 'cue'}>) => (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      
      const reorderedItems = arrayMove(items, oldIndex, newIndex);
      
      const actsWithOrder = reorderedItems
        .map((item, index) => ({ ...item, sortOrder: index }))
        .filter(i => i.type === 'act')
        .map(i => ({ id: i.id, sortOrder: i.sortOrder }));
      
      const cuesWithOrder = reorderedItems
        .map((item, index) => ({ ...item, sortOrder: index }))
        .filter(i => i.type === 'cue')
        .map(i => ({ id: i.id, sortOrder: i.sortOrder }));
      
      if (actsWithOrder.length > 0) {
        reorderActsMutation.mutate(actsWithOrder);
      }
      if (cuesWithOrder.length > 0) {
        reorderCuesMutation.mutate(cuesWithOrder);
      }
    }
  };

  // Report Template state
  const [leftImage, setLeftImage] = useState(reportTemplate?.leftImageUrl || "");
  const [title, setTitle] = useState(reportTemplate?.title || "Training Report");
  const [rightImage, setRightImage] = useState(reportTemplate?.rightImageUrl || "");
  const [emailTo, setEmailTo] = useState<string[]>(reportTemplate?.emailTo || []);
  const [emailCc, setEmailCc] = useState<string[]>(reportTemplate?.emailCc || []);
  const [emailBcc, setEmailBcc] = useState<string[]>(reportTemplate?.emailBcc || []);
  const [emailSubject, setEmailSubject] = useState(reportTemplate?.emailSubjectTemplate || "");
  const [emailBodyPrefix, setEmailBodyPrefix] = useState(reportTemplate?.emailBodyPrefix || "");

  // Sync report template state with query data (track last sync to avoid unnecessary updates)
  const [lastSyncedTemplate, setLastSyncedTemplate] = useState<string | null>(null);
  useEffect(() => {
    if (reportTemplate) {
      const templateData = JSON.stringify(reportTemplate);
      if (templateData !== lastSyncedTemplate) {
        setLeftImage(reportTemplate.leftImageUrl || "");
        setTitle(reportTemplate.title || "Training Report");
        setRightImage(reportTemplate.rightImageUrl || "");
        setEmailTo(reportTemplate.emailTo || []);
        setEmailCc(reportTemplate.emailCc || []);
        setEmailBcc(reportTemplate.emailBcc || []);
        setEmailSubject(reportTemplate.emailSubjectTemplate || "");
        setEmailBodyPrefix(reportTemplate.emailBodyPrefix || "");
        setLastSyncedTemplate(templateData);
      }
    }
  }, [reportTemplate, lastSyncedTemplate]);

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

  const createCueMutation = useMutation({
    mutationFn: async (data: { name: string; cueType: string; sortOrder: number; sceneId?: string; departmentIds: string[]; artistGroupIds: string[]; artistIds: string[] }) => {
      const cue = await apiRequest("POST", "/api/cues", { name: data.name, cueType: data.cueType, sortOrder: data.sortOrder, sceneId: data.sceneId });
      await apiRequest("POST", `/api/cues/${cue.id}/departments`, { departmentIds: data.departmentIds });
      await apiRequest("POST", `/api/cues/${cue.id}/artist-groups`, { artistGroupIds: data.artistGroupIds });
      await apiRequest("POST", `/api/cues/${cue.id}/artists`, { artistIds: data.artistIds });
      return cue;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cues"] });
      setCueDialogOpen(false);
      setSelectedCueDepartmentIds([]);
      setSelectedCueArtistGroupIds([]);
      setSelectedCueArtistIds([]);
      setSelectedCueType(undefined);
      toast({ title: "Cue created successfully" });
    },
  });

  const createDeptMutation = useMutation({
    mutationFn: async (data: { name: string; type: 'technical' | 'artistic'; sortOrder: number }) => {
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
    mutationFn: async (data: { firstName: string; lastName: string; stageName?: string; role?: string; photoUrl?: string; status?: string; artistGroupId?: string; pinCode?: string }) => {
      return await apiRequest("POST", "/api/artists", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artists"] });
      setArtistDialogOpen(false);
      toast({ title: "Artist created successfully" });
    },
  });

  const createTechMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; technicianName?: string; role?: string; photoUrl?: string; departmentIds: string[] }) => {
      const technician: any = await apiRequest("POST", "/api/technicians", {
        firstName: data.firstName,
        lastName: data.lastName,
        technicianName: data.technicianName,
        role: data.role,
        photoUrl: data.photoUrl,
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
      // Only invalidate technicians - the allTechnicianDepartments query will automatically
      // refetch when the technicians array changes (it's part of the queryKey)
      queryClient.invalidateQueries({ queryKey: ["/api/technicians"] });
      setTechDialogOpen(false);
      setSelectedTechnicianDepartmentIds([]);
      setUploadedPhotoUrl(null);
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

  const updateCueMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; cueType: string; sceneId?: string | null; sortOrder: number; departmentIds: string[]; artistGroupIds: string[]; artistIds: string[] }) => {
      const cue = await apiRequest("PATCH", `/api/cues/${data.id}`, { name: data.name, cueType: data.cueType, sceneId: data.sceneId, sortOrder: data.sortOrder });
      await apiRequest("POST", `/api/cues/${data.id}/departments`, { departmentIds: data.departmentIds });
      await apiRequest("POST", `/api/cues/${data.id}/artist-groups`, { artistGroupIds: data.artistGroupIds });
      await apiRequest("POST", `/api/cues/${data.id}/artists`, { artistIds: data.artistIds });
      return cue;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cues"] });
      setCueDialogOpen(false);
      setEditTarget(null);
      setSelectedCueDepartmentIds([]);
      setSelectedCueArtistGroupIds([]);
      setSelectedCueArtistIds([]);
      setSelectedCueType(undefined);
      toast({ title: "Cue updated successfully" });
    },
  });

  const updateDeptMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; type: 'technical' | 'artistic'; sortOrder: number }) => {
      return await apiRequest("PATCH", `/api/departments/${data.id}`, { name: data.name, type: data.type, sortOrder: data.sortOrder });
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
    mutationFn: async (data: { id: string; firstName: string; lastName: string; stageName?: string; role?: string; photoUrl?: string; status?: string; artistGroupId?: string; pinCode?: string }) => {
      return await apiRequest("PATCH", `/api/artists/${data.id}`, {
        firstName: data.firstName,
        lastName: data.lastName,
        stageName: data.stageName,
        role: data.role,
        photoUrl: data.photoUrl,
        status: data.status,
        artistGroupId: data.artistGroupId,
        pinCode: data.pinCode,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artists"] });
      setArtistDialogOpen(false);
      setEditTarget(null);
      toast({ title: "Artist updated successfully" });
    },
  });

  const linkUserToArtistMutation = useMutation({
    mutationFn: async (data: { artistId: string; userId: string }) => {
      return await apiRequest("PATCH", `/api/artists/${data.artistId}/link-user`, {
        userId: data.userId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artists"] });
      toast({ title: "User linked successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: error.message || "Failed to link user", 
        variant: "destructive" 
      });
    },
  });

  const unlinkUserFromArtistMutation = useMutation({
    mutationFn: async (artistId: string) => {
      return await apiRequest("PATCH", `/api/artists/${artistId}/unlink-user`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artists"] });
      toast({ title: "User unlinked successfully" });
    },
  });

  const archiveArtistMutation = useMutation({
    mutationFn: async (artistId: string) => {
      return await apiRequest("POST", `/api/artists/${artistId}/archive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/artists/archived"] });
      setArtistDialogOpen(false);
      setEditTarget(null);
      setArchiveDialogOpen(false);
      setArtistToArchive(null);
      toast({ title: "Artist archived successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: error.message || "Failed to archive artist", 
        variant: "destructive" 
      });
    },
  });

  const unarchiveArtistMutation = useMutation({
    mutationFn: async (artistId: string) => {
      return await apiRequest("POST", `/api/artists/${artistId}/unarchive`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artists"] });
      queryClient.invalidateQueries({ queryKey: ["/api/artists/archived"] });
      toast({ title: "Artist unarchived successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: error.message || "Failed to unarchive artist", 
        variant: "destructive" 
      });
    },
  });

  const updateTechMutation = useMutation({
    mutationFn: async (data: { id: string; firstName: string; lastName: string; technicianName?: string; role?: string; photoUrl?: string; departmentIds: string[] }) => {
      const technician = await apiRequest("PATCH", `/api/technicians/${data.id}`, {
        firstName: data.firstName,
        lastName: data.lastName,
        technicianName: data.technicianName,
        role: data.role,
        photoUrl: data.photoUrl,
      });
      // Set department assignments
      await apiRequest("PUT", `/api/technicians/${data.id}/departments`, {
        departmentIds: data.departmentIds,
      });
      return technician;
    },
    onSuccess: () => {
      // Only invalidate technicians - the allTechnicianDepartments query will automatically
      // refetch when the technicians array changes (it's part of the queryKey)
      queryClient.invalidateQueries({ queryKey: ["/api/technicians"] });
      setTechDialogOpen(false);
      setEditTarget(null);
      setSelectedTechnicianDepartmentIds([]);
      setUploadedPhotoUrl(null);
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

  const deleteCueMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/cues/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cues"] });
      toast({ title: "Cue deleted successfully" });
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

  const reorderArtistsMutation = useMutation({
    mutationFn: async (artistIds: string[]) => {
      return await apiRequest("POST", "/api/artists/reorder", { artistIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artists"] });
    },
  });

  const reorderTechniciansMutation = useMutation({
    mutationFn: async (technicianIds: string[]) => {
      return await apiRequest("PUT", "/api/technicians/reorder", { technicianIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technicians"] });
    },
  });

  const reorderTechniciansInDepartmentMutation = useMutation({
    mutationFn: async ({ departmentId, technicianIds }: { departmentId: string; technicianIds: string[] }) => {
      return await apiRequest("PUT", `/api/departments/${departmentId}/technicians/reorder`, { technicianIds });
    },
    onMutate: async ({ departmentId, technicianIds }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["/api/technician-departments/all"] });
      
      // Snapshot previous value
      const previousOrder = new Map(optimisticTechnicianOrder);
      
      // Optimistically update the order
      setOptimisticTechnicianOrder(prev => {
        const newMap = new Map(prev);
        newMap.set(departmentId, technicianIds);
        return newMap;
      });
      
      toast({ title: "Technician order updated" });
      
      // Return context with previous value for rollback
      return { previousOrder };
    },
    onError: (_error, _variables, context) => {
      // Rollback on error
      if (context?.previousOrder) {
        setOptimisticTechnicianOrder(context.previousOrder);
      }
      toast({ title: "Failed to update order", variant: "destructive" });
    },
    onSettled: () => {
      // Refetch to ensure sync with server
      queryClient.invalidateQueries({ queryKey: ["/api/technician-departments/all"] });
    },
  });

  const reorderActsMutation = useMutation({
    mutationFn: async (actsWithOrder: Array<{id: string; sortOrder: number}>) => {
      return await apiRequest("POST", "/api/acts/reorder", { acts: actsWithOrder });
    },
    onMutate: async (actsWithOrder) => {
      await queryClient.cancelQueries({ queryKey: ["/api/acts"] });
      const previousActs = queryClient.getQueryData(["/api/acts"]);
      queryClient.setQueryData(["/api/acts"], (old: Act[] | undefined) => {
        if (!old) return old;
        return old.map(act => {
          const update = actsWithOrder.find(a => a.id === act.id);
          return update ? { ...act, sortOrder: update.sortOrder } : act;
        });
      });
      return { previousActs };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousActs) {
        queryClient.setQueryData(["/api/acts"], context.previousActs);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acts"] });
    },
  });

  const reorderCuesMutation = useMutation({
    mutationFn: async (cuesWithOrder: Array<{id: string; sortOrder: number}>) => {
      return await apiRequest("POST", "/api/cues/reorder", { cues: cuesWithOrder });
    },
    onMutate: async (cuesWithOrder) => {
      await queryClient.cancelQueries({ queryKey: ["/api/cues"] });
      const previousCues = queryClient.getQueryData(["/api/cues"]);
      queryClient.setQueryData(["/api/cues"], (old: Cue[] | undefined) => {
        if (!old) return old;
        return old.map(cue => {
          const update = cuesWithOrder.find(c => c.id === cue.id);
          return update ? { ...cue, sortOrder: update.sortOrder } : cue;
        });
      });
      return { previousCues };
    },
    onError: (_err, _variables, context) => {
      if (context?.previousCues) {
        queryClient.setQueryData(["/api/cues"], context.previousCues);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cues"] });
    },
  });

  const deleteTechMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/technicians/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/technicians"] });
      toast({ title: "Technician deleted successfully" });
      setTechDialogOpen(false);
      setEditTarget(null);
    },
  });

  // User create mutation
  const createUserMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; position: string; password: string; userGroupId?: string | null }) => {
      return await apiRequest("POST", "/api/users/create", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User created successfully" });
      setCreateUserDialogOpen(false);
    },
  });

  // User update mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: string; active?: number; userGroupId?: string | null; name?: string; email?: string; position?: string }) => {
      return await apiRequest("PATCH", `/api/users/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User updated successfully" });
      setEditUserDialogOpen(false);
      setUserToEdit(null);
      setSelectedUserGroupId(null);
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

  // User password reset mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      return await apiRequest<{ temporaryPassword: string; user: SafeUser }>("POST", `/api/users/${userId}/reset-password`, {});
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setTemporaryPassword(data.temporaryPassword);
      setPasswordResetDialogOpen(true);
      toast({ title: "Password reset successfully" });
    },
    onError: (error: Error) => {
      toast({ 
        title: error.message || "Failed to reset password", 
        variant: "destructive" 
      });
    },
  });

  // User Group mutations
  const createUserGroupMutation = useMutation({
    mutationFn: async (data: { name: string; sortOrder: number }) => {
      return await apiRequest("POST", "/api/user-groups", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setUserGroupDialogOpen(false);
      toast({ title: "User group created successfully" });
    },
  });

  const updateUserGroupMutation = useMutation({
    mutationFn: async (data: { id: string; name: string; sortOrder: number }) => {
      return await apiRequest("PATCH", `/api/user-groups/${data.id}`, { name: data.name, sortOrder: data.sortOrder });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setUserGroupDialogOpen(false);
      setEditTarget(null);
      toast({ title: "User group updated successfully" });
    },
  });

  const deleteUserGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/user-groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user-groups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "User group deleted successfully" });
    },
  });

  // Report Template mutation
  const saveTemplateMutation = useMutation({
    mutationFn: async () => {
      // Filter out empty strings from email arrays
      const filteredEmailTo = emailTo.filter(e => e.trim());
      const filteredEmailCc = emailCc.filter(e => e.trim());
      const filteredEmailBcc = emailBcc.filter(e => e.trim());
      
      return await apiRequest("PUT", "/api/report-template", {
        title,
        leftImageUrl: leftImage || null,
        rightImageUrl: rightImage || null,
        emailTo: filteredEmailTo.length > 0 ? filteredEmailTo : null,
        emailCc: filteredEmailCc.length > 0 ? filteredEmailCc : null,
        emailBcc: filteredEmailBcc.length > 0 ? filteredEmailBcc : null,
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
      "user-group": deleteUserGroupMutation,
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

  const SortableShowFlowItem = ({ item, data }: { item: { id: string; name: string; type: 'act' | 'cue'; cueType?: string }; data: Act | Cue }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: item.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    const getColorClasses = () => {
      if (item.type === 'act') {
        return "border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950";
      } else if (item.type === 'cue') {
        if (item.cueType === "Acrobatic Cue") {
          return "border-l-4 border-l-orange-500 bg-orange-50 dark:bg-orange-950";
        } else {
          return "border-l-4 border-l-yellow-400 bg-yellow-100 dark:bg-yellow-900";
        }
      }
      return "";
    };

    return (
      <Card
        ref={setNodeRef}
        style={style}
        className={`p-3 flex items-center gap-2 cursor-pointer hover-elevate ${getColorClasses()}`}
        onClick={() => {
          if (item.type === 'act') {
            setEditTarget({ type: "act", id: item.id, data });
            setActDialogOpen(true);
          } else {
            setEditTarget({ type: "cue", id: item.id, data });
            setCueDialogOpen(true);
          }
        }}
        data-testid={`card-${item.type}-${item.id}`}
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <p className="font-medium flex-1">{item.name}</p>
      </Card>
    );
  };

  const renderGroupedShowFlow = () => {
    const combinedItems = [
      ...acts.map(act => ({ ...act, type: 'act' as const })),
      ...cues.map(cue => ({ ...cue, type: 'cue' as const }))
    ];

    if (combinedItems.length === 0) {
      return (
        <Card className="p-6 text-center text-muted-foreground">
          <p>No acts or cues yet. Click "Add Cue" or "Add Act" to create one.</p>
        </Card>
      );
    }

    const grouped = combinedItems.reduce((acc, item) => {
      const key = item.sceneId || 'no-scene';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {} as Record<string, Array<(Act | Cue) & { type: 'act' | 'cue' }>>);

    Object.keys(grouped).forEach(sceneId => {
      grouped[sceneId].sort((a, b) => a.sortOrder - b.sortOrder);
    });

    const sortedSceneIds = Object.keys(grouped).sort((a, b) => {
      if (a === 'no-scene') return 1;
      if (b === 'no-scene') return -1;
      
      const sceneA = scenes.find(s => s.id === a);
      const sceneB = scenes.find(s => s.id === b);
      
      const aIsFullShow = sceneA?.name === "FULL SHOW";
      const bIsFullShow = sceneB?.name === "FULL SHOW";
      const aIsRescue = sceneA?.name === "RESCUE SCENARIOS";
      const bIsRescue = sceneB?.name === "RESCUE SCENARIOS";
      
      if (aIsRescue && !bIsRescue) return 1;
      if (!aIsRescue && bIsRescue) return -1;
      
      if (aIsFullShow && !bIsFullShow && !bIsRescue) return 1;
      if (!aIsFullShow && bIsFullShow && !aIsRescue) return -1;
      
      return (sceneA?.sortOrder || 0) - (sceneB?.sortOrder || 0);
    });

    return (
      <div className="space-y-6">
        {sortedSceneIds.map((sceneId) => {
          const itemsInGroup = grouped[sceneId];
          const scene = scenes.find(s => s.id === sceneId);
          const sceneName = sceneId === 'no-scene' ? 'No Scene' : scene?.name || 'Unknown';

          const itemsList = itemsInGroup.map(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            cueType: item.type === 'cue' ? (item as Cue).cueType : undefined
          }));

          return (
            <div key={sceneId} className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  {sceneName}
                </h3>
                <span className="text-xs text-muted-foreground">
                  ({itemsInGroup.length})
                </span>
              </div>
              <DndContext
                sensors={showFlowDragSensors}
                collisionDetection={closestCenter}
                onDragEnd={handleShowFlowDragEnd(sceneId, itemsList)}
              >
                <SortableContext
                  items={itemsList.map(i => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {itemsInGroup.map((item) => (
                      <SortableShowFlowItem
                        key={item.id}
                        item={{
                          id: item.id,
                          name: item.name,
                          type: item.type,
                          cueType: item.type === 'cue' ? (item as Cue).cueType : undefined
                        }}
                        data={item}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          );
        })}
      </div>
    );
  };

  const SortableArtistCard = ({ artist }: { artist: Artist }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: artist.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <Card
        ref={setNodeRef}
        style={style}
        className="p-3 flex items-center gap-3 cursor-pointer hover-elevate active-elevate-2"
        onClick={() => {
          setEditTarget({ type: "artist", id: artist.id, data: artist });
          setArtistDialogOpen(true);
        }}
        data-testid={`card-artist-${artist.id}`}
      >
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing" onClick={(e) => e.stopPropagation()}>
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <Avatar className="w-10 h-10">
          {artist.photoUrl && <AvatarImage src={artist.photoUrl} alt={artist.stageName || `${artist.firstName} ${artist.lastName}`} />}
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {(artist.stageName || artist.firstName).charAt(0)}{(artist.stageName ? '' : artist.lastName).charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-medium">{artist.stageName || `${artist.firstName} ${artist.lastName}`}</p>
          {artist.role && <p className="text-sm text-muted-foreground">{artist.role}</p>}
        </div>
      </Card>
    );
  };

  const SortableTechnicianCard = ({ technician, deptId }: { technician: Technician; deptId: string }) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: `${deptId}-${technician.id}` });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <Card
        ref={setNodeRef}
        style={style}
        className="p-3 flex items-center gap-3 cursor-pointer hover-elevate active-elevate-2"
        onClick={() => {
          setEditTarget({ type: "technician", id: technician.id, data: technician });
          setTechDialogOpen(true);
        }}
        data-testid={`card-technician-${technician.id}`}
      >
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing" onClick={(e) => e.stopPropagation()}>
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </div>
        <Avatar className="w-10 h-10">
          {technician.photoUrl && <AvatarImage src={technician.photoUrl} alt={technician.technicianName || `${technician.firstName} ${technician.lastName}`} />}
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {(technician.technicianName || technician.firstName).charAt(0)}{(technician.technicianName ? '' : technician.lastName).charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-medium">{technician.technicianName || `${technician.firstName} ${technician.lastName}`}</p>
          {technician.role && <p className="text-sm text-muted-foreground">{technician.role}</p>}
        </div>
      </Card>
    );
  };

  const renderGroupedArtists = () => {
    if (orderedArtists.length === 0) {
      return (
        <Card className="p-6 text-center text-muted-foreground">
          <p>No artists yet. Click "Add Artist" to create one.</p>
        </Card>
      );
    }

    return (
      <DndContext sensors={artistDragSensors} collisionDetection={closestCenter} onDragEnd={handleArtistDragEnd}>
        <SortableContext items={orderedArtists.map(a => a.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-6">
            {artistGroups.map((group) => {
              const artistsInGroup = orderedArtists.filter(a => a.artistGroupId === group.id);
              if (artistsInGroup.length === 0) return null;

              return (
                <div key={group.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      {group.name}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      ({artistsInGroup.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {artistsInGroup.map((artist) => (
                      <SortableArtistCard key={artist.id} artist={artist} />
                    ))}
                  </div>
                </div>
              );
            })}
            {(() => {
              const noGroupArtists = orderedArtists.filter(a => !a.artistGroupId);
              if (noGroupArtists.length === 0) return null;
              return (
                <div key="no-group" className="space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      No Group
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      ({noGroupArtists.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {noGroupArtists.map((artist) => (
                      <SortableArtistCard key={artist.id} artist={artist} />
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </SortableContext>
      </DndContext>
    );
  };

  const renderGroupedTechnicians = (departmentType?: 'technical' | 'artistic') => {
    // Show loading state during mutations or query loading
    if (createTechMutation.isPending || updateTechMutation.isPending || techniciansQuery.isLoading || techniciansQuery.isFetching) {
      return (
        <Card className="p-6 text-center text-muted-foreground">
          <p>Loading...</p>
        </Card>
      );
    }
    
    // Only show empty state when not loading and truly empty
    if (orderedTechnicians.length === 0) {
      const staffType = departmentType === 'artistic' ? 'artistic staff' : departmentType === 'technical' ? 'technical staff' : 'technicians';
      return (
        <Card className="p-6 text-center text-muted-foreground">
          <p>No {staffType} yet. Click the button above to create one.</p>
        </Card>
      );
    }

    // Group technicians by department with proper ordering
    const grouped = new Map<string, { technicians: Technician[]; sortOrders: Map<string, number> }>();
    const techniciansWithDepts = new Set<string>();
    
    allTechnicianDepartments.forEach(({ technicianId, departmentId, sortOrder }) => {
      // Filter by department type if specified
      if (departmentType) {
        const dept = departments.find(d => d.id === departmentId);
        if (dept && dept.type !== departmentType) {
          return; // Skip this department if it doesn't match the filter
        }
      }
      
      techniciansWithDepts.add(technicianId);
      const tech = orderedTechnicians.find(t => t.id === technicianId);
      if (!tech) return;
      
      if (!grouped.has(departmentId)) {
        grouped.set(departmentId, { technicians: [], sortOrders: new Map() });
      }
      const group = grouped.get(departmentId)!;
      group.technicians.push(tech);
      group.sortOrders.set(technicianId, sortOrder);
    });
    
    // Sort each department's technicians by their sortOrder or optimistic order
    grouped.forEach((group, deptId) => {
      // Check if we have an optimistic order for this department
      const optimisticOrder = optimisticTechnicianOrder.get(deptId);
      
      if (optimisticOrder) {
        // Use optimistic order
        group.technicians.sort((a, b) => {
          const indexA = optimisticOrder.indexOf(a.id);
          const indexB = optimisticOrder.indexOf(b.id);
          // If not found in optimistic order, put at end
          if (indexA === -1 && indexB === -1) return 0;
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;
          return indexA - indexB;
        });
      } else {
        // Use server-side sortOrder
        group.technicians.sort((a, b) => {
          const orderA = group.sortOrders.get(a.id) ?? 0;
          const orderB = group.sortOrders.get(b.id) ?? 0;
          return orderA - orderB;
        });
      }
    });
    
    // If no department type filter, add technicians with no departments to "No Department" group
    if (!departmentType) {
      const noDeptTechs = orderedTechnicians.filter(t => !techniciansWithDepts.has(t.id));
      if (noDeptTechs.length > 0) {
        grouped.set('no-department', { technicians: noDeptTechs, sortOrders: new Map() });
      }
    }
    
    // Sort departments alphabetically, with "no-department" last
    const sortedDeptIds = Array.from(grouped.keys()).sort((a, b) => {
      if (a === 'no-department') return 1;
      if (b === 'no-department') return -1;
      const deptA = departments.find(d => d.id === a);
      const deptB = departments.find(d => d.id === b);
      return (deptA?.name || '').localeCompare(deptB?.name || '');
    });
    
    // Show empty state if no departments match the filter (but not during mutations or loading)
    if (sortedDeptIds.length === 0 && !createTechMutation.isPending && !updateTechMutation.isPending && !techniciansQuery.isLoading && !techniciansQuery.isFetching) {
      const staffType = departmentType === 'artistic' ? 'artistic staff' : 'technical staff';
      return (
        <Card className="p-6 text-center text-muted-foreground">
          <p>No {staffType} in departments yet.</p>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {sortedDeptIds.map((deptId) => {
          const group = grouped.get(deptId);
          if (!group) return null;
          
          const techsInDept = group.technicians;
          const dept = departments.find(d => d.id === deptId);
          const isNoDept = deptId === 'no-department';
          
          // Create department-specific drag handler
          const handleDeptDragEnd = (event: DragEndEvent) => {
            const { active, over } = event;
            
            if (over && active.id !== over.id) {
              // Extract technician IDs from composite keys (format: "deptId-technicianId")
              // Both deptId and technicianId are UUIDs with hyphens, so we need to split carefully
              // UUID format: 8-4-4-4-12 characters (5 segments separated by hyphens)
              // So composite key has format: uuid-uuid-uuid-uuid-uuid-uuid-uuid-uuid-uuid-uuid (10 segments)
              const activeParts = String(active.id).split('-');
              const overParts = String(over.id).split('-');
              
              // First 5 segments are the department ID, remaining 5 are the technician ID
              const activeId = activeParts.slice(5).join('-');
              const overId = overParts.slice(5).join('-');
              
              const oldIndex = techsInDept.findIndex((t) => t.id === activeId);
              const newIndex = techsInDept.findIndex((t) => t.id === overId);
              
              if (oldIndex === -1 || newIndex === -1) return;
              
              const newTechs = arrayMove(techsInDept, oldIndex, newIndex);
              const newOrder = newTechs.map(t => t.id);
              
              // Only call the reorder mutation for real departments (not "no-department")
              if (!isNoDept) {
                reorderTechniciansInDepartmentMutation.mutate({
                  departmentId: deptId,
                  technicianIds: newOrder
                });
              }
            }
          };
          
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
              <DndContext sensors={technicianDragSensors} collisionDetection={closestCenter} onDragEnd={handleDeptDragEnd}>
                <SortableContext items={techsInDept.map(t => `${deptId}-${t.id}`)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {techsInDept.map((tech) => (
                      <SortableTechnicianCard key={`${deptId}-${tech.id}`} technician={tech} deptId={deptId} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
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
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 mb-6">
            <TabsTrigger value="report-template" data-testid="tab-report-template">
              <FileText className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Template</span>
            </TabsTrigger>
            <TabsTrigger value="acts" data-testid="tab-acts">
              <Theater className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Show Flow</span>
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
                      placeholder="e.g., Borealis Training Report - {{date}}"
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
              <h2 className="text-lg font-semibold">Show Flow</h2>
              <div className="flex items-center gap-2">
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
                    <Button size="sm" className="hover:bg-primary/90 transition-colors" data-testid="button-scenes">
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
                                              setSelectedSceneArtistIds(Array.from(new Set([...selectedSceneArtistIds, ...groupArtistIds])));
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
                  open={cueDialogOpen} 
                  onOpenChange={(open) => {
                    setCueDialogOpen(open);
                    if (!open) {
                      setEditTarget(null);
                      setSelectedCueType(undefined);
                      setSelectedSceneId(undefined);
                      setSelectedCueDepartmentIds([]);
                      setSelectedCueArtistGroupIds([]);
                      setSelectedCueArtistIds([]);
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button size="sm" className="hover:bg-primary/90 transition-colors" data-testid="button-add-cue">
                      <Plus className="w-4 h-4" />Cue
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const name = formData.get("name") as string;
                        
                        if (editTarget?.type === "cue") {
                          updateCueMutation.mutate({
                            id: editTarget.id,
                            name,
                            cueType: editTarget.data.cueType,
                            sceneId: editTarget.data.sceneId === "none" || !editTarget.data.sceneId ? null : editTarget.data.sceneId,
                            sortOrder: editTarget.data.sortOrder,
                            departmentIds: selectedCueDepartmentIds,
                            artistGroupIds: selectedCueArtistGroupIds,
                            artistIds: selectedCueArtistIds,
                          });
                        } else {
                          if (!selectedCueType) return;
                          createCueMutation.mutate({
                            name,
                            cueType: selectedCueType,
                            sceneId: selectedSceneId === "none" || !selectedSceneId ? undefined : selectedSceneId,
                            sortOrder: cues.length,
                            departmentIds: selectedCueDepartmentIds,
                            artistGroupIds: selectedCueArtistGroupIds,
                            artistIds: selectedCueArtistIds,
                          });
                        }
                      }}
                    >
                      <DialogHeader>
                        <DialogTitle>{editTarget?.type === "cue" ? "Edit Cue" : "Add Cue"}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="cue-name">Cue Name</Label>
                          <Input
                            id="cue-name"
                            name="name"
                            placeholder="Enter cue name"
                            required
                            defaultValue={editTarget?.type === "cue" ? editTarget.data.name : ""}
                            data-testid="input-cue-name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cue-type-select">Cue Type</Label>
                          <Select
                            name="cueType"
                            required
                            value={editTarget?.type === "cue" ? editTarget.data.cueType : selectedCueType}
                            onValueChange={(value) => {
                              if (editTarget?.type === "cue") {
                                setEditTarget({ ...editTarget, data: { ...editTarget.data, cueType: value } });
                              } else {
                                setSelectedCueType(value);
                              }
                            }}
                          >
                            <SelectTrigger id="cue-type-select" data-testid="select-cue-type">
                              <SelectValue placeholder="Select a cue type" />
                            </SelectTrigger>
                            <SelectContent>
                              {cueTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cue-scene-select">Scene</Label>
                          <Select
                            name="sceneId"
                            required
                            value={editTarget?.type === "cue" ? editTarget.data.sceneId : selectedSceneId}
                            onValueChange={(value) => {
                              if (editTarget?.type === "cue") {
                                setEditTarget({ ...editTarget, data: { ...editTarget.data, sceneId: value } });
                              } else {
                                setSelectedSceneId(value);
                              }
                            }}
                          >
                            <SelectTrigger id="cue-scene-select" data-testid="select-cue-scene">
                              <SelectValue placeholder="Select a scene" />
                            </SelectTrigger>
                            <SelectContent>
                              {[...scenes].sort((a, b) => {
                                const aIsBottom = a.name === "RESCUE SCENARIOS" || a.name === "FULL SHOW";
                                const bIsBottom = b.name === "RESCUE SCENARIOS" || b.name === "FULL SHOW";
                                
                                if (aIsBottom && !bIsBottom) return 1;
                                if (!aIsBottom && bIsBottom) return -1;
                                
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
                                <div className="flex items-center space-x-2 pb-2 border-b-2">
                                  <Checkbox
                                    id="cue-all-departments"
                                    checked={departments.every(d => selectedCueDepartmentIds.includes(d.id))}
                                    data-state={departments.some(d => selectedCueDepartmentIds.includes(d.id)) && !departments.every(d => selectedCueDepartmentIds.includes(d.id)) ? "indeterminate" : undefined}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedCueDepartmentIds(departments.map(d => d.id));
                                      } else {
                                        setSelectedCueDepartmentIds([]);
                                      }
                                    }}
                                    data-testid="checkbox-cue-all-departments"
                                  />
                                  <Label
                                    htmlFor="cue-all-departments"
                                    className="text-sm font-bold cursor-pointer flex-1 uppercase"
                                  >
                                    All Departments
                                  </Label>
                                </div>

                                {[...departments].sort((a, b) => a.name.localeCompare(b.name)).map((dept) => (
                                  <div key={dept.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`cue-dept-${dept.id}`}
                                      checked={selectedCueDepartmentIds.includes(dept.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedCueDepartmentIds([...selectedCueDepartmentIds, dept.id]);
                                        } else {
                                          setSelectedCueDepartmentIds(selectedCueDepartmentIds.filter(id => id !== dept.id));
                                        }
                                      }}
                                      data-testid={`checkbox-cue-dept-${dept.id}`}
                                    />
                                    <Label
                                      htmlFor={`cue-dept-${dept.id}`}
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
                                <div className="flex items-center space-x-2 pb-2 border-b-2">
                                  <Checkbox
                                    id="cue-all-artists"
                                    checked={artists.every(a => selectedCueArtistIds.includes(a.id))}
                                    data-state={artists.some(a => selectedCueArtistIds.includes(a.id)) && !artists.every(a => selectedCueArtistIds.includes(a.id)) ? "indeterminate" : undefined}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedCueArtistIds(artists.map(a => a.id));
                                        setSelectedCueArtistGroupIds(artistGroups.map(g => g.id));
                                      } else {
                                        setSelectedCueArtistIds([]);
                                        setSelectedCueArtistGroupIds([]);
                                      }
                                    }}
                                    data-testid="checkbox-cue-all-artists"
                                  />
                                  <Label
                                    htmlFor="cue-all-artists"
                                    className="text-sm font-bold cursor-pointer flex-1 uppercase"
                                  >
                                    All Artists
                                  </Label>
                                </div>
                                
                                {artistGroups.map((group) => {
                                  const groupArtists = artists.filter(a => a.artistGroupId === group.id);
                                  if (groupArtists.length === 0) return null;
                                  
                                  const allArtistsSelected = groupArtists.every(a => selectedCueArtistIds.includes(a.id));
                                  const someArtistsSelected = groupArtists.some(a => selectedCueArtistIds.includes(a.id)) && !allArtistsSelected;
                                  
                                  return (
                                    <div key={group.id} className="space-y-2">
                                      <div className="flex items-center space-x-2 pb-1 border-b">
                                        <Checkbox
                                          id={`cue-artist-group-${group.id}`}
                                          checked={selectedCueArtistGroupIds.includes(group.id) || allArtistsSelected}
                                          data-state={someArtistsSelected ? "indeterminate" : undefined}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              setSelectedCueArtistGroupIds([...selectedCueArtistGroupIds, group.id]);
                                              const groupArtistIds = groupArtists.map(a => a.id);
                                              setSelectedCueArtistIds(Array.from(new Set([...selectedCueArtistIds, ...groupArtistIds])));
                                            } else {
                                              setSelectedCueArtistGroupIds(selectedCueArtistGroupIds.filter(id => id !== group.id));
                                              const groupArtistIds = groupArtists.map(a => a.id);
                                              setSelectedCueArtistIds(selectedCueArtistIds.filter(id => !groupArtistIds.includes(id)));
                                            }
                                          }}
                                          data-testid={`checkbox-cue-artist-group-${group.id}`}
                                        />
                                        <Label
                                          htmlFor={`cue-artist-group-${group.id}`}
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
                                                id={`cue-artist-${artist.id}`}
                                                checked={selectedCueArtistIds.includes(artist.id)}
                                                onCheckedChange={(checked) => {
                                                  if (checked) {
                                                    setSelectedCueArtistIds([...selectedCueArtistIds, artist.id]);
                                                  } else {
                                                    setSelectedCueArtistIds(selectedCueArtistIds.filter(id => id !== artist.id));
                                                    setSelectedCueArtistGroupIds(selectedCueArtistGroupIds.filter(id => id !== group.id));
                                                  }
                                                }}
                                                data-testid={`checkbox-cue-artist-${artist.id}`}
                                              />
                                              <Label
                                                htmlFor={`cue-artist-${artist.id}`}
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
                                              id={`cue-artist-${artist.id}`}
                                              checked={selectedCueArtistIds.includes(artist.id)}
                                              onCheckedChange={(checked) => {
                                                if (checked) {
                                                  setSelectedCueArtistIds([...selectedCueArtistIds, artist.id]);
                                                } else {
                                                  setSelectedCueArtistIds(selectedCueArtistIds.filter(id => id !== artist.id));
                                                }
                                              }}
                                              data-testid={`checkbox-cue-artist-${artist.id}`}
                                            />
                                            <Label
                                              htmlFor={`cue-artist-${artist.id}`}
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
                      <DialogFooter className="flex justify-between">
                        {editTarget?.type === "cue" && (
                          <Button 
                            type="button"
                            variant="destructive"
                            onClick={() => {
                              setDeleteTarget({ type: "cue", id: editTarget.id });
                              setDeleteDialogOpen(true);
                              setCueDialogOpen(false);
                            }}
                            data-testid="button-delete-cue-modal"
                          >
                            Delete
                          </Button>
                        )}
                        <Button 
                          type="submit" 
                          disabled={createCueMutation.isPending || updateCueMutation.isPending} 
                          data-testid="button-save-cue"
                          className={editTarget?.type === "cue" ? "" : "ml-auto"}
                        >
                          {(createCueMutation.isPending || updateCueMutation.isPending) ? "Saving..." : editTarget?.type === "cue" ? "Update Cue" : "Add Cue"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                <Dialog 
                  open={actDialogOpen} 
                  onOpenChange={(open) => {
                    setActDialogOpen(open);
                    if (!open) {
                      setEditTarget(null);
                      setSelectedSceneId(undefined);
                      setSelectedDepartmentIds([]);
                      setSelectedArtistGroupIds([]);
                      setSelectedArtistIds([]);
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button size="sm" className="hover:bg-primary/90 transition-colors" data-testid="button-add-act">
                      <Plus className="w-4 h-4" />Act
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
                                            setSelectedArtistIds(Array.from(new Set([...selectedArtistIds, ...groupArtistIds])));
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
                    <DialogFooter className="flex justify-between">
                      {editTarget?.type === "act" && (
                        <Button 
                          type="button"
                          variant="destructive"
                          onClick={() => {
                            setDeleteTarget({ type: "act", id: editTarget.id });
                            setDeleteDialogOpen(true);
                            setActDialogOpen(false);
                          }}
                          data-testid="button-delete-act-modal"
                        >
                          Delete
                        </Button>
                      )}
                      <Button 
                        type="submit" 
                        disabled={createActMutation.isPending || updateActMutation.isPending} 
                        data-testid="button-save-act"
                        className={editTarget?.type === "act" ? "" : "ml-auto"}
                      >
                        {(createActMutation.isPending || updateActMutation.isPending) ? "Saving..." : editTarget?.type === "act" ? "Update Act" : "Save Act"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              </div>
            </div>
            {renderGroupedShowFlow()}
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
                          type: selectedDepartmentType,
                          sortOrder: editTarget.data.sortOrder,
                        });
                      } else {
                        createDeptMutation.mutate({
                          name,
                          type: selectedDepartmentType,
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
                      <div className="space-y-2">
                        <Label htmlFor="dept-type">Department Type</Label>
                        <Select
                          value={selectedDepartmentType}
                          onValueChange={setSelectedDepartmentType}
                        >
                          <SelectTrigger id="dept-type" data-testid="select-department-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="artistic" data-testid="option-artistic">Artistic</SelectItem>
                            <SelectItem value="technical" data-testid="option-technical">Technical</SelectItem>
                          </SelectContent>
                        </Select>
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
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="artists">Artists</TabsTrigger>
                <TabsTrigger value="artistic">Artistic</TabsTrigger>
                <TabsTrigger value="technical">Technical</TabsTrigger>
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
                          Artist Groups
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Manage Artist Groups</DialogTitle>
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
                        if (!open) {
                          setEditTarget(null);
                          setUploadedPhotoUrl(null);
                          setSelectedLinkedUserId(null);
                        }
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
                          const photoUrl = (formData.get("photoUrl") as string) || undefined;
                          const status = (formData.get("status") as string) || "active";
                          const artistGroupId = formData.get("groupId") as string;
                          const pinCode = (formData.get("pinCode") as string) || undefined;

                          if (editTarget?.type === "artist") {
                            updateArtistMutation.mutate({
                              id: editTarget.id,
                              firstName,
                              lastName,
                              stageName,
                              role,
                              photoUrl,
                              status,
                              artistGroupId,
                              pinCode,
                            });
                          } else {
                            createArtistMutation.mutate({
                              firstName,
                              lastName,
                              stageName,
                              role,
                              photoUrl,
                              status,
                              artistGroupId,
                              pinCode,
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
                            <Label>Photo</Label>
                            <div className="flex items-center gap-4">
                              {(uploadedPhotoUrl || (editTarget?.type === "artist" && editTarget.data.photoUrl)) && (
                                <Avatar className="w-16 h-16">
                                  <AvatarImage 
                                    src={uploadedPhotoUrl || (editTarget?.type === "artist" ? editTarget.data.photoUrl : undefined)} 
                                    alt="Artist photo" 
                                  />
                                  <AvatarFallback>
                                    <UserCircle2 className="w-8 h-8" />
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div className="flex flex-col gap-2">
                                <PhotoUploader
                                  onUploadComplete={(url) => setUploadedPhotoUrl(url)}
                                  currentPhotoUrl={uploadedPhotoUrl || (editTarget?.type === "artist" ? editTarget.data.photoUrl : null)}
                                />
                                {(uploadedPhotoUrl || (editTarget?.type === "artist" && editTarget.data.photoUrl)) && (
                                  <span className="text-xs text-muted-foreground">
                                    Photo {uploadedPhotoUrl ? "uploaded" : "set"}
                                  </span>
                                )}
                              </div>
                            </div>
                            <input type="hidden" name="photoUrl" value={uploadedPhotoUrl || (editTarget?.type === "artist" ? editTarget.data.photoUrl || "" : "")} />
                          </div>
                          <div className="space-y-2">
                            <Label>Status</Label>
                            <Select 
                              name="status" 
                              required
                              defaultValue={editTarget?.type === "artist" ? editTarget.data.status || "active" : "active"}
                            >
                              <SelectTrigger data-testid="select-artist-status">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="out">Out</SelectItem>
                                <SelectItem value="long_term_out">Long-Term Out</SelectItem>
                              </SelectContent>
                            </Select>
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
                          <div className="space-y-2">
                            <Label>PIN Code (4 digits)</Label>
                            <Input 
                              name="pinCode" 
                              placeholder="Enter 4-digit PIN" 
                              pattern="[0-9]{4}"
                              maxLength={4}
                              defaultValue={editTarget?.type === "artist" ? editTarget.data.pinCode || "" : ""}
                              data-testid="input-artist-pin" 
                            />
                            <p className="text-xs text-muted-foreground">
                              {editTarget?.type === "artist" && editTarget.data.pinCode 
                                ? "Leave blank to keep current PIN" 
                                : "Artist will set their own PIN on first sign-in if left blank"}
                            </p>
                          </div>
                          {editTarget?.type === "artist" && isStageManager && (
                            <div className="space-y-2 pt-2 border-t">
                              <Label>Linked User Account</Label>
                              {editTarget.data.userId ? (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                                    <div className="flex items-center gap-2">
                                      <UserCircle2 className="w-4 h-4" />
                                      <span className="text-sm">
                                        {users.find(u => u.id === editTarget.data.userId)?.name || "Unknown User"}
                                      </span>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        if (confirm("Are you sure you want to unlink this user account?")) {
                                          unlinkUserFromArtistMutation.mutate(editTarget.id);
                                        }
                                      }}
                                      disabled={unlinkUserFromArtistMutation.isPending}
                                      data-testid="button-unlink-user"
                                    >
                                      Unlink
                                    </Button>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    This artist must log in with this account to clock in
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <Select 
                                    value={selectedLinkedUserId || ""}
                                    onValueChange={setSelectedLinkedUserId}
                                  >
                                    <SelectTrigger data-testid="select-linked-user">
                                      <SelectValue placeholder="Select a user account to link" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {users.filter(u => {
                                        // Find the "artist" user group
                                        const artistUserGroup = userGroups.find(g => g.name.toLowerCase() === 'artist');
                                        if (!artistUserGroup || u.userGroupId !== artistUserGroup.id) {
                                          return false;
                                        }
                                        // Allow the currently linked user (if editing) OR users not linked to any other artist
                                        const isCurrentlyLinked = editTarget?.type === "artist" && editTarget.data.userId === u.id;
                                        const isLinkedToOtherArtist = artists.some(a => a.userId === u.id && a.id !== editTarget?.id);
                                        return isCurrentlyLinked || !isLinkedToOtherArtist;
                                      }).map((u) => (
                                        <SelectItem key={u.id} value={u.id}>
                                          {u.name} ({u.email})
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                      if (selectedLinkedUserId) {
                                        linkUserToArtistMutation.mutate({
                                          artistId: editTarget.id,
                                          userId: selectedLinkedUserId,
                                        });
                                        setSelectedLinkedUserId(null);
                                      }
                                    }}
                                    disabled={!selectedLinkedUserId || linkUserToArtistMutation.isPending}
                                    data-testid="button-link-user"
                                  >
                                    {linkUserToArtistMutation.isPending ? "Linking..." : "Link User Account"}
                                  </Button>
                                  <p className="text-xs text-muted-foreground">
                                    Link a user account to require login for clock-in
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <DialogFooter className="flex justify-between items-center gap-2">
                          {editTarget?.type === "artist" && (
                            <Button 
                              type="button"
                              variant="destructive"
                              onClick={() => {
                                setArtistToArchive(editTarget.id);
                                setArchiveDialogOpen(true);
                              }}
                              disabled={archiveArtistMutation.isPending}
                              data-testid="button-archive-artist"
                            >
                              Archive Artist
                            </Button>
                          )}
                          <div className="flex-1"></div>
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
              <div className="mt-6 flex justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => setViewArchivedDialogOpen(true)}
                  data-testid="button-view-archived-artists"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  View Archived Artists
                </Button>
              </div>
              </TabsContent>
              <TabsContent value="artistic" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Artistic Staff</h2>
                  <Dialog 
                    open={techDialogOpen} 
                    onOpenChange={(open) => {
                      setTechDialogOpen(open);
                      if (!open) {
                        setEditTarget(null);
                        setUploadedPhotoUrl(null);
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button data-testid="button-add-technician">
                        <Plus className="w-4 h-4 mr-2" />
                        Artistic Staff
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
                          const photoUrl = (formData.get("photoUrl") as string) || undefined;

                          if (editTarget?.type === "technician") {
                            updateTechMutation.mutate({
                              id: editTarget.id,
                              firstName,
                              lastName,
                              technicianName,
                              role,
                              photoUrl,
                              departmentIds: selectedTechnicianDepartmentIds,
                            });
                          } else {
                            createTechMutation.mutate({
                              firstName,
                              lastName,
                              technicianName,
                              role,
                              photoUrl,
                              departmentIds: selectedTechnicianDepartmentIds,
                            });
                          }
                        }}
                      >
                        <DialogHeader>
                          <DialogTitle>{editTarget?.type === "technician" ? "Edit Artistic Staff" : "Add Artistic Staff"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="tech-firstName">First Name</Label>
                              <Input
                                id="tech-firstName"
                                name="firstName"
                                placeholder="First name"
                                required
                                defaultValue={editTarget?.type === "technician" ? editTarget.data.firstName : ""}
                                data-testid="input-technician-firstName"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="tech-lastName">Last Name</Label>
                              <Input
                                id="tech-lastName"
                                name="lastName"
                                placeholder="Last name"
                                required
                                defaultValue={editTarget?.type === "technician" ? editTarget.data.lastName : ""}
                                data-testid="input-technician-lastName"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="tech-technicianName">Preferred Name (Optional)</Label>
                            <Input
                              id="tech-technicianName"
                              name="technicianName"
                              placeholder="Preferred name or nickname"
                              defaultValue={editTarget?.type === "technician" ? editTarget.data.technicianName || "" : ""}
                              data-testid="input-technician-technicianName"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="tech-role">Role</Label>
                            <Input
                              id="tech-role"
                              name="role"
                              placeholder="e.g., Head Coach"
                              defaultValue={editTarget?.type === "technician" ? editTarget.data.role || "" : ""}
                              data-testid="input-technician-role"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="tech-status">Status</Label>
                            <Select
                              value={selectedTechnicianStatus}
                              onValueChange={setSelectedTechnicianStatus}
                            >
                              <SelectTrigger id="tech-status" data-testid="select-technician-status">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active" data-testid="option-status-active">Active</SelectItem>
                                <SelectItem value="inactive" data-testid="option-status-inactive">Inactive</SelectItem>
                                <SelectItem value="on_leave" data-testid="option-status-on-leave">On Leave</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Departments (Multiple)</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal" data-testid="select-artistic-departments">
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
                                  {[...departments].filter(d => d.type === 'artistic').sort((a, b) => a.name.localeCompare(b.name)).map((dept) => (
                                    <div key={dept.id} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`artistic-dept-${dept.id}`}
                                        checked={selectedTechnicianDepartmentIds.includes(dept.id)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            setSelectedTechnicianDepartmentIds([...selectedTechnicianDepartmentIds, dept.id]);
                                          } else {
                                            setSelectedTechnicianDepartmentIds(selectedTechnicianDepartmentIds.filter(id => id !== dept.id));
                                          }
                                        }}
                                        data-testid={`checkbox-artistic-dept-${dept.id}`}
                                      />
                                      <label htmlFor={`artistic-dept-${dept.id}`} className="text-sm cursor-pointer">
                                        {dept.name}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                          {editTarget?.type === "technician" && editTarget.data.photoUrl && !uploadedPhotoUrl && (
                            <div className="space-y-2">
                              <Label>Current Photo</Label>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-16 w-16">
                                  <AvatarImage src={editTarget.data.photoUrl} alt="Current photo" />
                                  <AvatarFallback>
                                    {editTarget.data.firstName[0]}{editTarget.data.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-muted-foreground">Current photo will be kept unless you upload a new one</span>
                              </div>
                            </div>
                          )}
                          {uploadedPhotoUrl && (
                            <div className="space-y-2">
                              <Label>New Photo Preview</Label>
                              <div className="flex items-center gap-2">
                                <Avatar className="h-16 w-16">
                                  <AvatarImage src={uploadedPhotoUrl} alt="New photo" />
                                  <AvatarFallback>
                                    {editTarget?.type === "technician" ? editTarget.data.firstName[0] + editTarget.data.lastName[0] : "??"}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-muted-foreground">This photo will be uploaded</span>
                              </div>
                            </div>
                          )}
                          <input type="hidden" name="photoUrl" value={uploadedPhotoUrl || (editTarget?.type === "technician" ? editTarget.data.photoUrl || "" : "")} />
                          <PhotoUploader
                            onPhotoReady={(url) => {
                              setUploadedPhotoUrl(url);
                            }}
                            circular={true}
                            label="Upload Photo (Optional)"
                          />
                          {editTarget?.type === "technician" && editTarget.data.photoUrl && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this photo?")) {
                                  setUploadedPhotoUrl("");
                                }
                              }}
                              data-testid="button-delete-photo"
                            >
                              Delete Current Photo
                            </Button>
                          )}
                          {editTarget?.type === "technician" && isStageManager && (
                            <div className="space-y-2 pt-2 border-t">
                              <Label>Linked User Account</Label>
                              {editTarget.data.userId ? (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                                    <div className="flex items-center gap-2">
                                      <UserCircle2 className="w-4 h-4" />
                                      <span className="text-sm">
                                        {users.find(u => u.id === editTarget.data.userId)?.name || "Unknown User"}
                                      </span>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        // Will implement unlink mutation
                                        toast({
                                          title: "Feature coming soon",
                                          description: "User unlinking will be implemented.",
                                        });
                                      }}
                                      data-testid="button-unlink-tech-user"
                                    >
                                      Unlink
                                    </Button>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    This staff member is linked to a user account. They can sign in and access features based on their permissions.
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <Select
                                    value={selectedLinkedTechUserId || ""}
                                    onValueChange={(value) => setSelectedLinkedTechUserId(value || null)}
                                  >
                                    <SelectTrigger data-testid="select-link-tech-user">
                                      <SelectValue placeholder="Select user account to link..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {users
                                        .filter(u => !technicians.some(a => a.userId === u.id))
                                        .map(u => (
                                          <SelectItem key={u.id} value={u.id} data-testid={`option-user-${u.id}`}>
                                            {u.name} ({u.email})
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                  {selectedLinkedTechUserId && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        // Will implement link mutation
                                        toast({
                                          title: "Feature coming soon",
                                          description: "User linking will be implemented.",
                                        });
                                      }}
                                      data-testid="button-link-tech-user"
                                    >
                                      Link User Account
                                    </Button>
                                  )}
                                  <p className="text-xs text-muted-foreground">
                                    Link this staff member to a user account to allow them to sign in.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          {editTarget?.type === "technician" && (
                            <Button 
                              type="button"
                              variant="destructive"
                              onClick={() => {
                                setTechnicianToArchive(editTarget.id);
                                setArchiveTechDialogOpen(true);
                              }}
                              data-testid="button-archive-technician"
                            >
                              Archive
                            </Button>
                          )}
                          <div className="flex-1"></div>
                          <Button type="submit" disabled={createTechMutation.isPending || updateTechMutation.isPending} data-testid="button-save-technician">
                            {(createTechMutation.isPending || updateTechMutation.isPending) ? "Saving..." : editTarget?.type === "technician" ? "Update Artistic Staff" : "Save Artistic Staff"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                {renderGroupedTechnicians('artistic')}
              </TabsContent>
              <TabsContent value="technical" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Technical Staff</h2>
                  <Dialog 
                    open={techDialogOpen} 
                    onOpenChange={(open) => {
                      setTechDialogOpen(open);
                      if (!open) {
                        setEditTarget(null);
                        setUploadedPhotoUrl(null);
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button data-testid="button-add-technician">
                        <Plus className="w-4 h-4 mr-2" />
                        Technical Staff
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
                          const photoUrl = (formData.get("photoUrl") as string) || undefined;

                          if (editTarget?.type === "technician") {
                            updateTechMutation.mutate({
                              id: editTarget.id,
                              firstName,
                              lastName,
                              technicianName,
                              role,
                              photoUrl,
                              departmentIds: selectedTechnicianDepartmentIds,
                            });
                          } else {
                            createTechMutation.mutate({
                              firstName,
                              lastName,
                              technicianName,
                              role,
                              photoUrl,
                              departmentIds: selectedTechnicianDepartmentIds,
                            });
                          }
                        }}
                      >
                        <DialogHeader>
                          <DialogTitle>{editTarget?.type === "technician" ? "Edit Technical Staff" : "Add Technical Staff"}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Preferred Name (Optional)</Label>
                            <Input 
                              name="technicianName" 
                              placeholder="Preferred name or nickname"
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
                            <Label htmlFor="tech-status-2">Status</Label>
                            <Select
                              value={selectedTechnicianStatus}
                              onValueChange={setSelectedTechnicianStatus}
                            >
                              <SelectTrigger id="tech-status-2" data-testid="select-technician-status">
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active" data-testid="option-status-active">Active</SelectItem>
                                <SelectItem value="inactive" data-testid="option-status-inactive">Inactive</SelectItem>
                                <SelectItem value="on_leave" data-testid="option-status-on-leave">On Leave</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Photo</Label>
                            <div className="flex items-center gap-4">
                              {(uploadedPhotoUrl || (editTarget?.type === "technician" && editTarget.data.photoUrl)) && (
                                <Avatar className="w-16 h-16">
                                  <AvatarImage 
                                    src={uploadedPhotoUrl || (editTarget?.type === "technician" ? editTarget.data.photoUrl : undefined)} 
                                    alt="Technician photo" 
                                  />
                                  <AvatarFallback>
                                    <UserCircle2 className="w-8 h-8" />
                                  </AvatarFallback>
                                </Avatar>
                              )}
                              <div className="flex flex-col gap-2">
                                <PhotoUploader
                                  onUploadComplete={(url) => setUploadedPhotoUrl(url)}
                                  currentPhotoUrl={uploadedPhotoUrl || (editTarget?.type === "technician" ? editTarget.data.photoUrl : null)}
                                />
                                {(uploadedPhotoUrl || (editTarget?.type === "technician" && editTarget.data.photoUrl)) && (
                                  <span className="text-xs text-muted-foreground">
                                    Photo {uploadedPhotoUrl ? "uploaded" : "set"}
                                  </span>
                                )}
                              </div>
                            </div>
                            <input type="hidden" name="photoUrl" value={uploadedPhotoUrl || (editTarget?.type === "technician" ? editTarget.data.photoUrl || "" : "")} />
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
                                  {[...departments].filter(d => d.type === 'technical').sort((a, b) => a.name.localeCompare(b.name)).map((dept) => (
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
                          {editTarget?.type === "technician" && editTarget.data.photoUrl && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this photo?")) {
                                  setUploadedPhotoUrl("");
                                }
                              }}
                              data-testid="button-delete-tech-photo"
                            >
                              Delete Current Photo
                            </Button>
                          )}
                          {editTarget?.type === "technician" && isStageManager && (
                            <div className="space-y-2 pt-2 border-t">
                              <Label>Linked User Account</Label>
                              {editTarget.data.userId ? (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                                    <div className="flex items-center gap-2">
                                      <UserCircle2 className="w-4 h-4" />
                                      <span className="text-sm">
                                        {users.find(u => u.id === editTarget.data.userId)?.name || "Unknown User"}
                                      </span>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        // Will implement unlink mutation
                                        toast({
                                          title: "Feature coming soon",
                                          description: "User unlinking will be implemented.",
                                        });
                                      }}
                                      data-testid="button-unlink-tech-user-2"
                                    >
                                      Unlink
                                    </Button>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    This staff member is linked to a user account. They can sign in and access features based on their permissions.
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <Select
                                    value={selectedLinkedTechUserId || ""}
                                    onValueChange={(value) => setSelectedLinkedTechUserId(value || null)}
                                  >
                                    <SelectTrigger data-testid="select-link-tech-user-2">
                                      <SelectValue placeholder="Select user account to link..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {users
                                        .filter(u => !technicians.some(a => a.userId === u.id))
                                        .map(u => (
                                          <SelectItem key={u.id} value={u.id} data-testid={`option-user-${u.id}`}>
                                            {u.name} ({u.email})
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                  {selectedLinkedTechUserId && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        // Will implement link mutation
                                        toast({
                                          title: "Feature coming soon",
                                          description: "User linking will be implemented.",
                                        });
                                      }}
                                      data-testid="button-link-tech-user-2"
                                    >
                                      Link User Account
                                    </Button>
                                  )}
                                  <p className="text-xs text-muted-foreground">
                                    Link this staff member to a user account to allow them to sign in.
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        <DialogFooter className="flex justify-between items-center gap-2">
                          {editTarget?.type === "technician" && (
                            <Button 
                              type="button"
                              variant="destructive"
                              onClick={() => {
                                setTechnicianToArchive(editTarget.id);
                                setArchiveTechDialogOpen(true);
                              }}
                              data-testid="button-archive-technician"
                            >
                              Archive
                            </Button>
                          )}
                          <div className="flex-1"></div>
                          <Button 
                            type="submit" 
                            disabled={createTechMutation.isPending || updateTechMutation.isPending} 
                            data-testid="button-save-technician"
                          >
                            {(createTechMutation.isPending || updateTechMutation.isPending) ? "Saving..." : editTarget?.type === "technician" ? "Update Technical Staff" : "Save Technical Staff"}
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
                {renderGroupedTechnicians('technical')}
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">User Management</h2>
              {isStageManager && <div className="flex items-center gap-2">
                <Dialog
                  open={userGroupDialogOpen}
                  onOpenChange={(open) => {
                    setUserGroupDialogOpen(open);
                    if (!open) setEditTarget(null);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" data-testid="button-user-groups">
                      User Groups
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Manage User Groups</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const name = formData.get("name") as string;
                        
                        if (editTarget?.type === "user-group") {
                          updateUserGroupMutation.mutate({
                            id: editTarget.id,
                            name,
                            sortOrder: editTarget.data.sortOrder,
                          });
                        } else {
                          createUserGroupMutation.mutate({
                            name,
                            sortOrder: userGroups.length,
                          });
                        }
                        e.currentTarget.reset();
                      }}
                    >
                      <div className="flex gap-2">
                        <Input
                          id="user-group-name"
                          name="name"
                          placeholder="Enter group name"
                          defaultValue={editTarget?.type === "user-group" ? editTarget.data.name : ""}
                          required
                          data-testid="input-user-group-name"
                        />
                        <Button 
                          type="submit"
                          disabled={createUserGroupMutation.isPending || updateUserGroupMutation.isPending}
                          data-testid="button-save-user-group"
                        >
                          {editTarget?.type === "user-group" ? "Update" : "Add"}
                        </Button>
                      </div>
                    </form>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {userGroups.map((group) => (
                        <Card key={group.id} className="p-3 flex items-center justify-between" data-testid={`card-user-group-${group.id}`}>
                          <p className="font-medium">{group.name}</p>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditTarget({ type: "user-group", id: group.id, data: group });
                              }}
                              data-testid={`button-edit-user-group-${group.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDeleteTarget({ type: "user-group", id: group.id });
                                setDeleteDialogOpen(true);
                              }}
                              data-testid={`button-delete-user-group-${group.id}`}
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
                  open={createUserDialogOpen}
                  onOpenChange={setCreateUserDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-user">
                      <Plus className="w-4 h-4 mr-2" />
                      Create User
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const name = formData.get("name") as string;
                        const email = formData.get("email") as string;
                        const position = formData.get("position") as string;
                        const password = formData.get("password") as string;
                        const userGroupId = formData.get("userGroupId") as string;

                        createUserMutation.mutate({
                          name,
                          email,
                          position,
                          password,
                          userGroupId: userGroupId === "none" ? null : userGroupId,
                        });
                      }}
                    >
                      <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>Name</Label>
                          <Input 
                            name="name" 
                            placeholder="Full name" 
                            required
                            data-testid="input-create-user-name" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input 
                            name="email" 
                            type="email"
                            placeholder="email@example.com" 
                            required
                            data-testid="input-create-user-email" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Position</Label>
                          <Input 
                            name="position" 
                            placeholder="Position/Role" 
                            required
                            data-testid="input-create-user-position" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Password</Label>
                          <Input 
                            name="password" 
                            type="password"
                            placeholder="Minimum 6 characters" 
                            required
                            minLength={6}
                            data-testid="input-create-user-password" 
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>User Group (Optional)</Label>
                          <Select name="userGroupId" defaultValue="none">
                            <SelectTrigger data-testid="select-create-user-group">
                              <SelectValue placeholder="No group" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Group</SelectItem>
                              {userGroups.map((group) => (
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
                          disabled={createUserMutation.isPending}
                          data-testid="button-save-create-user"
                        >
                          {createUserMutation.isPending ? "Creating..." : "Create User"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>}
            </div>
            <div className="space-y-6">
              {(() => {
                // Group users by userGroupId
                const usersByGroup = users.reduce((acc, user) => {
                  const groupId = user.userGroupId || "no-group";
                  if (!acc[groupId]) {
                    acc[groupId] = [];
                  }
                  acc[groupId].push(user);
                  return acc;
                }, {} as Record<string, typeof users>);

                // Sort groups alphabetically by name
                const sortedGroupIds = Object.keys(usersByGroup).sort((a, b) => {
                  if (a === "no-group") return 1; // Put "no-group" at the end
                  if (b === "no-group") return -1;
                  
                  const groupA = userGroups.find(g => g.id === a);
                  const groupB = userGroups.find(g => g.id === b);
                  const nameA = groupA?.name || "";
                  const nameB = groupB?.name || "";
                  return nameA.localeCompare(nameB);
                });

                return sortedGroupIds.map((groupId) => {
                  const groupUsers = usersByGroup[groupId];
                  const group = userGroups.find(g => g.id === groupId);
                  const groupName = groupId === "no-group" ? "No Group" : (group?.name || "Unknown Group");

                  return (
                    <div key={groupId} className="space-y-2">
                      <h3 className="text-sm font-semibold text-muted-foreground" data-testid={`text-group-${groupId}`}>
                        {groupName}
                      </h3>
                      {groupUsers.map((user) => (
                        <Card 
                          key={user.id} 
                          className={`p-4 ${isStageManager ? 'cursor-pointer hover-elevate active-elevate-2' : ''}`}
                          onClick={() => {
                            if (isStageManager) {
                              setUserToEdit(user);
                              setSelectedUserGroupId(user.userGroupId || null);
                              setEditUserDialogOpen(true);
                            }
                          }}
                          data-testid={`card-user-${user.id}`}
                        >
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
                              <span className={`px-3 py-1 rounded-full text-sm ${user.active === 1 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`} data-testid={`text-user-status-${user.id}`}>
                                {user.active === 1 ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  );
                });
              })()}
              {usersQuery.isLoading && (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">Loading users...</p>
                </Card>
              )}
              {usersQuery.isError && (
                <Card className="p-8 text-center bg-destructive/10">
                  <p className="text-destructive font-medium mb-2">Unable to load users</p>
                  <p className="text-sm text-muted-foreground">
                    {usersQuery.error instanceof Error && usersQuery.error.message.includes('403') 
                      ? 'You do not have permission to view users. Please log in as a stage manager or admin.'
                      : 'An error occurred while loading users. Please try refreshing the page.'}
                  </p>
                </Card>
              )}
              {!usersQuery.isLoading && !usersQuery.isError && users.length === 0 && (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">No users found. Click "Create User" to add one.</p>
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

      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this artist?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive the artist profile and their linked user account, removing them from all lists in the app. You can unarchive them later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-archive">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (artistToArchive) {
                  archiveArtistMutation.mutate(artistToArchive);
                }
              }} 
              className="bg-destructive hover:bg-destructive/90"
              data-testid="button-confirm-archive"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={viewArchivedDialogOpen} onOpenChange={setViewArchivedDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Archived Artists</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto max-h-[calc(80vh-8rem)] pr-2">
            {archivedArtistsQuery.isLoading && (
              <div className="text-center py-8 text-muted-foreground">
                Loading archived artists...
              </div>
            )}
            {archivedArtistsQuery.isError && (
              <div className="text-center py-8 text-destructive">
                Failed to load archived artists
              </div>
            )}
            {archivedArtistsQuery.data && archivedArtistsQuery.data.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No archived artists
              </div>
            )}
            {archivedArtistsQuery.data && archivedArtistsQuery.data.length > 0 && (
              <div className="space-y-2">
                {archivedArtistsQuery.data.map((artist) => (
                  <Card key={artist.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={artist.photoUrl || undefined} />
                          <AvatarFallback>
                            {artist.firstName[0]}{artist.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {artist.firstName} {artist.lastName}
                            {artist.stageName && ` (${artist.stageName})`}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {artist.role || "No role specified"}
                          </p>
                          {artist.archivedAt && (
                            <p className="text-xs text-muted-foreground">
                              Archived on {new Date(artist.archivedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => unarchiveArtistMutation.mutate(artist.id)}
                        disabled={unarchiveArtistMutation.isPending}
                        data-testid={`button-unarchive-${artist.id}`}
                      >
                        Unarchive
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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

      <Dialog open={passwordResetDialogOpen} onOpenChange={setPasswordResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Password Reset Successful</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              A temporary password has been generated for <strong>{resetPasswordUser?.name || resetPasswordUser?.email}</strong>. 
              The user will be required to change their password upon next login.
            </p>
            <div className="space-y-2">
              <Label>Temporary Password</Label>
              <div className="flex gap-2">
                <Input 
                  value={temporaryPassword || ""}
                  readOnly
                  className="font-mono bg-muted"
                  data-testid="input-temporary-password"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (temporaryPassword) {
                      navigator.clipboard.writeText(temporaryPassword);
                      toast({ title: "Password copied to clipboard" });
                    }
                  }}
                  data-testid="button-copy-password"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Make sure to save this password. It will not be shown again.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => {
                setPasswordResetDialogOpen(false);
                setTemporaryPassword(null);
                setResetPasswordUser(null);
              }}
              data-testid="button-close-reset-dialog"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editUserDialogOpen} onOpenChange={setEditUserDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!userToEdit) return;

              const formData = new FormData(e.currentTarget);
              const name = formData.get("name") as string;
              const email = formData.get("email") as string;
              const position = formData.get("position") as string;

              updateUserMutation.mutate({
                id: userToEdit.id,
                name,
                email,
                position,
                userGroupId: selectedUserGroupId,
              });
            }}
          >
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input 
                  name="name" 
                  placeholder="Full name" 
                  required
                  defaultValue={userToEdit?.name || ""}
                  data-testid="input-edit-user-name" 
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input 
                  name="email" 
                  type="email"
                  placeholder="email@example.com" 
                  required
                  defaultValue={userToEdit?.email || ""}
                  data-testid="input-edit-user-email" 
                />
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <Input 
                  name="position" 
                  placeholder="Position/Role" 
                  required
                  defaultValue={userToEdit?.position || ""}
                  data-testid="input-edit-user-position" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-group-select">User Group</Label>
                <Select
                  value={selectedUserGroupId || "none"}
                  onValueChange={(value) => setSelectedUserGroupId(value === "none" ? null : value)}
                >
                  <SelectTrigger id="user-group-select" data-testid="select-user-group">
                    <SelectValue placeholder="Select user group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Group</SelectItem>
                    {userGroups
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          {group.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="border-t pt-4 mt-4 space-y-3">
                <h4 className="text-sm font-semibold">User Actions</h4>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (userToEdit) {
                        setResetPasswordUser(userToEdit);
                        resetPasswordMutation.mutate(userToEdit.id);
                      }
                    }}
                    disabled={resetPasswordMutation.isPending}
                    className="w-full justify-start"
                    data-testid={`button-reset-password-${userToEdit?.id}`}
                  >
                    <KeyRound className="w-4 h-4 mr-2" />
                    {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (userToEdit) {
                        updateUserMutation.mutate({
                          id: userToEdit.id,
                          active: userToEdit.active === 1 ? 0 : 1,
                        });
                      }
                    }}
                    disabled={updateUserMutation.isPending}
                    className="w-full justify-start"
                    data-testid={`button-toggle-user-${userToEdit?.id}`}
                  >
                    {userToEdit?.active === 1 ? 'Deactivate User' : 'Activate User'}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (userToEdit) {
                        setUserToDelete(userToEdit.id);
                        setAdminPasswordDialogOpen(true);
                      }
                    }}
                    className="w-full justify-start"
                    data-testid={`button-delete-user-${userToEdit?.id}`}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete User
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter className="flex gap-2">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => {
                  setEditUserDialogOpen(false);
                  setUserToEdit(null);
                  setSelectedUserGroupId(null);
                }}
                data-testid="button-cancel-edit-user"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={updateUserMutation.isPending}
                data-testid="button-save-edit-user"
              >
                {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
