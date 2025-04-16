import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
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
} from "lucide-react";
import { projectsApi } from "@/services/api";
import { Project } from "@/types";
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

const Projects = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 5;

  const {
    data: projects = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.getAll,
  });

  const handleViewProject = (id: string) => {
    navigate(`/projects/${id}`);
  };

  const handleEditProject = (id: string) => {
    console.log(`Editing project with ID: ${id}`);
  };

  const handleDeleteProject = (id: string) => {
    console.log(`Deleting project with ID: ${id}`);
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const paginatedProjects = filteredProjects.slice(
    indexOfFirstProject,
    indexOfLastProject
  );

  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  if (isLoading) {
    return <div>Loading projects...</div>;
  }

  if (isError) {
    return <div>Error loading projects.</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Projects</CardTitle>
          <CardDescription>Manage your projects and track their progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <Input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Sort
              </Button>
            </div>
            <div>
              <Button onClick={() => navigate("/projects/new")}>
                Create Project
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {paginatedProjects.length > 0 ? (
        <div className="space-y-4">
          {paginatedProjects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <CardTitle>{project.name}</CardTitle>
                <CardDescription>{project.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <StatusBadge status={project.status} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Priority</p>
                    <Badge variant="secondary">{project.priority}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Start Date</p>
                    <p className="text-sm">{project.startDate}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">End Date</p>
                    <p className="text-sm">{project.endDate}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <div className="flex justify-between items-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewProject(project.id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleEditProject(project.id)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteProject(project.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Mark as Complete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardFooter>
            </Card>
          ))}

          <div className="flex justify-center items-center space-x-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNumber) => (
                <Button
                  key={pageNumber}
                  variant={currentPage === pageNumber ? "default" : "outline"}
                  onClick={() => handlePageChange(pageNumber)}
                >
                  {pageNumber}
                </Button>
              )
            )}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="text-lg">No Projects Found</CardTitle>
            <CardDescription>
              Create a new project to get started.
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Projects;
