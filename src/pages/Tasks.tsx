import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CalendarCheck2, CheckCircle, Clock, Filter, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { projectsApi } from "@/services/api";
import { Project, ProjectStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProjectCard } from "@/components/projects/project-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { toast } from "sonner";

const Tasks = () => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("deadline");
  const [page, setPage] = useState(0);
  const pageSize = 9;
  const queryClient = useQueryClient();

  const { data: projectsData, isLoading, refetch } = useQuery({
    queryKey: ["user-projects", page, pageSize],
    queryFn: () => projectsApi.getUserProjects(page, pageSize),
  });

  // --- Mutations ---
  const updateStatusMutation = useMutation({
    mutationFn: ({ projectId, status }: { projectId: number; status: ProjectStatus }) =>
      projectsApi.updateStatus(projectId, status),
    onSuccess: (updatedProject) => {
      toast.success(`Project "${updatedProject.name}" status updated to ${updatedProject.status}`);
      queryClient.invalidateQueries({ queryKey: ["user-projects"] });
      refetch(); // Refetch to update the lists
    },
    onError: (error) => {
      toast.error(`Failed to update project status: ${error.message}`);
    },
  });
  // --- End Mutations ---

  const projects = projectsData?.content || [];
  const totalElements = projectsData?.totalElements || 0;
  const totalPages = Math.ceil(totalElements / pageSize);

  // Group projects by status
  const notStartedProjects = projects.filter(
    (project) => project.status === ProjectStatus.NOT_STARTED
  );
  const inProgressProjects = projects.filter(
    (project) => project.status === ProjectStatus.IN_PROGRESS
  );
  const completedProjects = projects.filter(
    (project) => project.status === ProjectStatus.COMPLETED
  );

  // Apply search filter
  const filterBySearch = (projects: Project[]) => {
    if (!searchQuery) return projects;
    
    const query = searchQuery.toLowerCase();
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query)
    );
  };

  // Apply sorting
  const sortProjects = (projects: Project[]) => {
    return [...projects].sort((a, b) => {
      switch (sortBy) {
        case "deadline":
          return (
            new Date(a.endDate).getTime() - new Date(b.endDate).getTime()
          );
        case "name":
          return a.name.localeCompare(b.name);
        case "priority":
          const priorityValues = {
            URGENT: 3,
            HIGH: 2,
            MEDIUM: 1,
            LOW: 0,
          };
          return (
            priorityValues[b.priority] - priorityValues[a.priority]
          );
        default:
          return 0;
      }
    });
  };

  // Apply filtering and sorting
  const filteredNotStarted = sortProjects(filterBySearch(notStartedProjects));
  const filteredInProgress = sortProjects(filterBySearch(inProgressProjects));
  const filteredCompleted = sortProjects(filterBySearch(completedProjects));

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleUpdateStatus = (projectId: number, status: ProjectStatus) => {
    updateStatusMutation.mutate({ projectId, status });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Tasks</h1>
          <p className="text-muted-foreground">
            View and manage your assigned projects
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="deadline">Due Date</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="priority">Priority</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="not-started">Not Started</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="h-10 bg-muted animate-pulse rounded" />
                    <div className="flex justify-between">
                      <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : projects.length > 0 ? (
            <div className="space-y-6">
              {filteredNotStarted.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center">
                      <Clock className="mr-2 h-5 w-5 text-muted-foreground" />
                      <CardTitle>Not Started</CardTitle>
                    </div>
                    <CardDescription>
                      Projects that haven't been started yet
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredNotStarted.map((project) => (
                        <ProjectCard key={project.id} project={project} onUpdateStatus={handleUpdateStatus} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {filteredInProgress.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center">
                      <CalendarCheck2 className="mr-2 h-5 w-5 text-muted-foreground" />
                      <CardTitle>In Progress</CardTitle>
                    </div>
                    <CardDescription>Active projects you're working on</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredInProgress.map((project) => (
                        <ProjectCard key={project.id} project={project} onUpdateStatus={handleUpdateStatus} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {filteredCompleted.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center">
                      <CheckCircle className="mr-2 h-5 w-5 text-muted-foreground" />
                      <CardTitle>Completed</CardTitle>
                    </div>
                    <CardDescription>
                      Projects you have successfully delivered
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredCompleted.map((project) => (
                        <ProjectCard key={project.id} project={project} onUpdateStatus={handleUpdateStatus} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {filteredNotStarted.length === 0 &&
               filteredInProgress.length === 0 &&
               filteredCompleted.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Filter className="h-12 w-12 text-muted-foreground mb-4" />
                    <CardTitle className="text-xl mb-2">No matching tasks</CardTitle>
                    <CardDescription>
                      Try adjusting your search to find what you're looking for
                    </CardDescription>
                    {searchQuery && (
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setSearchQuery("")}
                      >
                        Clear search
                      </Button>
                    )}
                  </CardContent>
                </Card>
               )}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <CardTitle className="text-xl mb-2">No tasks assigned</CardTitle>
                <CardDescription>
                  You don't have any projects assigned to you yet
                </CardDescription>
              </CardContent>
            </Card>
          )}
          
          {!isLoading && totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination
                totalPages={totalPages}
                currentPage={page}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="not-started" className="space-y-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="h-10 bg-muted animate-pulse rounded" />
                    <div className="flex justify-between">
                      <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredNotStarted.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredNotStarted.map((project) => (
                <ProjectCard key={project.id} project={project} onUpdateStatus={handleUpdateStatus} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <CardTitle className="text-xl mb-2">No tasks to start</CardTitle>
                <CardDescription>
                  You don't have any new projects waiting to be started
                </CardDescription>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="in-progress" className="space-y-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="h-10 bg-muted animate-pulse rounded" />
                    <div className="flex justify-between">
                      <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredInProgress.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredInProgress.map((project) => (
                <ProjectCard key={project.id} project={project} onUpdateStatus={handleUpdateStatus} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CalendarCheck2 className="h-12 w-12 text-muted-foreground mb-4" />
                <CardTitle className="text-xl mb-2">No tasks in progress</CardTitle>
                <CardDescription>
                  You don't have any active projects at the moment
                </CardDescription>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="h-10 bg-muted animate-pulse rounded" />
                    <div className="flex justify-between">
                      <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                      <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCompleted.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCompleted.map((project) => (
                <ProjectCard key={project.id} project={project} onUpdateStatus={handleUpdateStatus} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <CardTitle className="text-xl mb-2">No completed tasks</CardTitle>
                <CardDescription>
                  You haven't completed any projects yet
                </CardDescription>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tasks;
