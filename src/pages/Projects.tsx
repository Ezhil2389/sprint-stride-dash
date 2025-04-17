import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Edit,
  Eye,
  Filter,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  Trash2,
  FileText,
  Loader2,
  Calendar,
  User
} from "lucide-react";
import { projectsApi } from "@/services/api";
import { Project, ProjectStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/projects/status-badge";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Pagination } from "@/components/ui/pagination";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

const Projects = () => {
  const navigate = useNavigate();
  const { isManager, currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0); // Backend pagination starts at 0
  const projectsPerPage = 12; // Increased number of projects per page for grid layout

  const {
    data: projectsData,
    isLoading,
    isError,
    refetch, // Add refetch for refreshing data
  } = useQuery({
    queryKey: ["projects", currentPage, projectsPerPage],
    queryFn: () => projectsApi.getAll(currentPage, projectsPerPage),
  });

  // Extract data from API response
  const projects = projectsData?.content || [];
  const totalElements = projectsData?.totalElements || 0;
  const totalPages = Math.ceil(totalElements / projectsPerPage);

  // --- Mutations ---
  const deleteProjectMutation = useMutation({
    mutationFn: projectsApi.delete,
    onSuccess: () => {
      toast.success("Project deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      // Optional: Refetch current page if needed, or go back to page 0
      if (projects.length === 1 && currentPage > 0) {
        setCurrentPage(currentPage - 1);
      } else {
        refetch();
      }
    },
    onError: (error) => {
      toast.error(`Failed to delete project: ${error.message}`);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ projectId, status }: { projectId: number; status: ProjectStatus }) =>
      projectsApi.updateStatus(projectId, status),
    onSuccess: (updatedProject) => {
      toast.success(`Project "${updatedProject.name}" marked as ${updatedProject.status}`);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update project status: ${error.message}`);
    },
  });
  // --- End Mutations ---

  const handleViewProject = (id: number) => {
    navigate(`/projects/${id}`);
  };

  const handleEditProject = (id: number) => {
    navigate(`/projects/edit/${id}`); 
  };

  const handleDeleteProject = (id: number) => {
    deleteProjectMutation.mutate(id);
  };

  const handleMarkAsComplete = (id: number) => {
    updateStatusMutation.mutate({ projectId: id, status: ProjectStatus.COMPLETED });
  };

  // Local search filtering
  const filteredProjects = searchQuery 
    ? projects.filter((project) =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        project.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : projects;

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber - 1); // Convert from 1-based UI to 0-based API
  };

  if (isLoading) {
    return <div>Loading projects...</div>;
  }

  if (isError) {
    return <div>Error loading projects.</div>;
  }

  // Function to get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'text-red-500 border-red-500';
      case 'MEDIUM':
        return 'text-amber-500 border-amber-500';
      case 'LOW':
        return 'text-green-500 border-green-500';
      case 'URGENT':
        return 'text-purple-500 border-purple-500';
      default:
        return '';
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <CardTitle className="text-2xl font-bold">Projects</CardTitle>
              <CardDescription>Manage your projects and track their progress</CardDescription>
            </div>
            {isManager && (
              <Button onClick={() => navigate("/projects/new")} className="mt-2 md:mt-0">
                Create Project
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:w-1/2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm" disabled>
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Sort
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredProjects.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => {
              const canManage = isManager || project.assignedToId === currentUser?.id;
              return (
                <Card key={project.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-medium line-clamp-1" title={project.name}>
                          {project.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 h-10" title={project.description}>
                          {project.description}
                        </CardDescription>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className={`${getPriorityColor(project.priority)}`}>
                              {project.priority}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Priority: {project.priority}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 pb-2">
                    <div className="flex flex-wrap gap-2 text-sm mb-2">
                      <StatusBadge status={project.status} />
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3 mr-1" />
                              <span>{project.endDate}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Start: {project.startDate}</p>
                            <p>End: {project.endDate}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      {project.assignedToName && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center text-xs text-muted-foreground">
                                <User className="h-3 w-3 mr-1" />
                                <span className="truncate max-w-[120px]">{project.assignedToName}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Assigned to: {project.assignedToName}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t p-2 flex justify-between items-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewProject(project.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <div className="flex gap-1">
                      {canManage && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditProject(project.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {project.status !== ProjectStatus.COMPLETED && canManage && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleMarkAsComplete(project.id)}
                                disabled={updateStatusMutation.isPending}
                              >
                                {updateStatusMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" /> 
                                ) : (
                                  <CheckCircle2 className="h-4 w-4" /> 
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Mark as Complete</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {isManager && (
                        <AlertDialog>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="text-destructive hover:text-destructive/90"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Delete Project</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the project "{project.name}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteProject(project.id)}
                                disabled={deleteProjectMutation.isPending}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {deleteProjectMutation.isPending ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                                ) : null}
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination
                totalPages={totalPages}
                currentPage={currentPage}
                onPageChange={(page) => handlePageChange(page + 1)}
              />
            </div>
          )}
        </div>
      ) : (
        <Card className="mt-4">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <FileText className="h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" />
            <p className="text-lg font-medium">No projects found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {searchQuery
                ? "No projects match your search criteria."
                : "You haven't created any projects yet."}
            </p>
            {isManager && (
              <Button onClick={() => navigate("/projects/new")}>
                Create Your First Project
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Projects;
