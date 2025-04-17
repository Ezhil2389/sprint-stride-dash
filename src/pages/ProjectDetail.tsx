import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarIcon,
  Check,
  Edit,
  Loader2,
  Trash2,
  User,
} from "lucide-react";
import { projectsApi, usersApi } from "@/services/api";
import { Project, ProjectStatus } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { StatusBadge } from "@/components/projects/status-badge";
import { PriorityBadge } from "@/components/projects/priority-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ProjectDetail = () => {
  const { id: idString } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isManager, currentUser } = useAuth();
  const queryClient = useQueryClient();

  const id = idString ? parseInt(idString, 10) : undefined;

  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [updatedStatus, setUpdatedStatus] = useState<ProjectStatus | undefined>(
    undefined
  );

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: () => projectsApi.getById(id!),
    enabled: !!id && !isNaN(id),
  });

  const { data: employees } = useQuery({
    queryKey: ["employees"],
    queryFn: usersApi.getEmployees,
    enabled: isManager,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({
      projectId,
      status,
    }: {
      projectId: number;
      status: ProjectStatus;
    }) => projectsApi.updateStatus(projectId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", id] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project status updated successfully");
      setIsUpdateDialogOpen(false);
    },
    onError: (error) => {
      console.error("Failed to update project status:", error);
      toast.error("Failed to update project status");
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (projectId: number) => projectsApi.delete(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted successfully");
      navigate("/projects");
    },
    onError: (error) => {
      console.error("Failed to delete project:", error);
      toast.error("Failed to delete project");
    },
  });

  const handleUpdateStatus = () => {
    if (updatedStatus && id) {
      updateStatusMutation.mutate({
        projectId: id,
        status: updatedStatus,
      });
    }
  };

  const handleDeleteProject = () => {
    if (id) {
      deleteProjectMutation.mutate(id);
    }
  };

  // Check if the current user is assigned to this project
  const isAssignedToUser = project?.assignedToId === currentUser?.id;
  const canUpdateStatus = isManager || isAssignedToUser;

  // Format dates
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
        return format(new Date(dateString), "MMMM d, yyyy");
    } catch (e) {
        console.error("Error formatting date:", e);
        return dateString; // Return original string if formatting fails
    }
  };

  // Create initials from name
  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-4">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/projects")}
            className="mr-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h1 className="text-2xl font-bold">Project not found</h1>
          <p className="text-muted-foreground mt-2">
            The project you're looking for doesn't exist or has been deleted.
          </p>
          <Button
            onClick={() => navigate("/projects")}
            className="mt-4"
          >
            Go to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/projects")}
              className="mr-2 -ml-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Projects
            </Button>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">{project.name}</h2>
          <div className="flex flex-wrap gap-2 mt-2">
            <StatusBadge status={project.status} />
            <PriorityBadge priority={project.priority} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canUpdateStatus && (
            <Dialog
              open={isUpdateDialogOpen}
              onOpenChange={setIsUpdateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Update Status
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Project Status</DialogTitle>
                  <DialogDescription>
                    Change the current status of this project.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Select
                    value={updatedStatus || project.status}
                    onValueChange={(value) =>
                      setUpdatedStatus(value as ProjectStatus)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ProjectStatus).map((status) => (
                        <SelectItem key={status} value={status}>
                          {status
                            .split("_")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                            )
                            .join(" ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsUpdateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpdateStatus}
                    disabled={updateStatusMutation.isPending}
                  >
                    {updateStatusMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {isManager && (
            <>
              <Button
                variant="outline"
                onClick={() => navigate(`/projects/edit/${project.id}`)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete the project "{project.name}".
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteProject}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteProjectMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        "Delete"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Description</h3>
            <div className="prose max-w-none dark:prose-invert">
              {project.description || "No description provided."}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-lg border p-4 space-y-4">
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Dates</h3>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {formatDate(project.startDate)} - {formatDate(project.endDate)}
                </span>
              </div>
            </div>

            <Separator />

            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Assigned To</h3>
              {project.assignedTo ? (
                <div className="flex items-center gap-3 mt-1">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={project.assignedTo.avatar}
                      alt={project.assignedTo.name}
                    />
                    <AvatarFallback>
                      {getInitials(project.assignedTo.firstName, project.assignedTo.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{project.assignedTo.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {project.assignedTo.title}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 mt-1">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <User className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="text-muted-foreground">Unassigned</div>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-1">
              <h3 className="text-sm font-medium text-muted-foreground">Project Info</h3>
              <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                <div className="text-muted-foreground">Created</div>
                <div>{formatDate(project.createdAt)}</div>
                <div className="text-muted-foreground">Last Updated</div>
                <div>{formatDate(project.updatedAt)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
