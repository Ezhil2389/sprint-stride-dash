
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Filter,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { projectsApi, usersApi } from "@/services/api";
import { PriorityLevel, ProjectStatus } from "@/types";
import { ProjectCard } from "@/components/projects/project-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const Projects = () => {
  const { isManager, user } = useAuth();
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    status: [] as ProjectStatus[],
    priority: [] as PriorityLevel[],
    assignedTo: "",
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 9;

  const { data: allProjects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.getAll,
  });

  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: usersApi.getEmployees,
  });

  // Filter projects based on employee role
  const baseProjects = isManager
    ? allProjects
    : allProjects.filter((project) => project.assignedTo?.id === user?.id);

  // Apply search
  let filteredProjects = baseProjects.filter((project) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        project.name.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query)
      );
    }
    return true;
  });

  // Apply filters
  if (filters.status.length > 0) {
    filteredProjects = filteredProjects.filter((project) =>
      filters.status.includes(project.status)
    );
  }

  if (filters.priority.length > 0) {
    filteredProjects = filteredProjects.filter((project) =>
      filters.priority.includes(project.priority)
    );
  }

  if (filters.assignedTo) {
    filteredProjects = filteredProjects.filter(
      (project) => project.assignedTo?.id === filters.assignedTo
    );
  }

  // Apply sorting
  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "deadline":
        return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  // Calculate pagination
  const totalPages = Math.ceil(sortedProjects.length / projectsPerPage);
  const startIndex = (currentPage - 1) * projectsPerPage;
  const paginatedProjects = sortedProjects.slice(
    startIndex,
    startIndex + projectsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const handleFilterChange = (type: string, value: any) => {
    setFilters((prev) => {
      if (type === "status") {
        if (prev.status.includes(value)) {
          return {
            ...prev,
            status: prev.status.filter((s) => s !== value),
          };
        } else {
          return { ...prev, status: [...prev.status, value] };
        }
      } else if (type === "priority") {
        if (prev.priority.includes(value)) {
          return {
            ...prev,
            priority: prev.priority.filter((p) => p !== value),
          };
        } else {
          return { ...prev, priority: [...prev.priority, value] };
        }
      } else if (type === "assignedTo") {
        return { ...prev, assignedTo: value === prev.assignedTo ? "" : value };
      }
      return prev;
    });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      priority: [],
      assignedTo: "",
    });
    setCurrentPage(1);
  };

  const getActiveFilterCount = () => {
    return (
      filters.status.length +
      filters.priority.length +
      (filters.assignedTo ? 1 : 0)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">
            {isManager
              ? "Manage and monitor all projects"
              : "View and manage your assigned projects"}
          </p>
        </div>
        {isManager && (
          <Button onClick={() => navigate("/projects/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        )}
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="deadline">Deadline</SelectItem>
              <SelectItem value="name">Name</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="relative">
                <Filter className="h-4 w-4 mr-2" />
                <span>Filter</span>
                {getActiveFilterCount() > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                  >
                    {getActiveFilterCount()}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Filters</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    disabled={getActiveFilterCount() === 0}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </Button>
                </div>
                <Separator />

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Status</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(ProjectStatus).map((status) => (
                      <div
                        key={status}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`status-${status}`}
                          checked={filters.status.includes(status)}
                          onCheckedChange={() =>
                            handleFilterChange("status", status)
                          }
                        />
                        <Label htmlFor={`status-${status}`}>
                          {status
                            .split("_")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                            )
                            .join(" ")}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Priority</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(PriorityLevel).map((priority) => (
                      <div
                        key={priority}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`priority-${priority}`}
                          checked={filters.priority.includes(priority)}
                          onCheckedChange={() =>
                            handleFilterChange("priority", priority)
                          }
                        />
                        <Label htmlFor={`priority-${priority}`}>
                          {priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase()}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {isManager && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Assigned To</h4>
                    <Select
                      value={filters.assignedTo}
                      onValueChange={(value) =>
                        handleFilterChange("assignedTo", value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Anyone" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.name}
                          </SelectItem>
                        ))}
                        <SelectItem value="unassigned">Unassigned</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {isLoadingProjects ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent className="pb-2">
                <div className="h-10 bg-muted animate-pulse rounded mb-3" />
                <div className="flex items-center justify-between mt-3">
                  <div className="space-y-1">
                    <div className="h-2 w-16 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 w-16 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-2">
                <div className="flex gap-2">
                  <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                  <div className="h-6 w-16 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : paginatedProjects.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => handlePageChange(currentPage - 1)}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {[...Array(totalPages)].map((_, i) => {
                  const page = i + 1;
                  
                  // Always show first, last, and current page
                  // For others, show if they're within 1 of current page
                  if (
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(currentPage - page) <= 1
                  ) {
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => handlePageChange(page)}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                  
                  // Show ellipses if there's a gap
                  if (
                    (page === 2 && currentPage > 3) ||
                    (page === totalPages - 1 && currentPage < totalPages - 2)
                  ) {
                    return (
                      <PaginationItem key={`ellipsis-${page}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  
                  return null;
                })}
                
                <PaginationItem>
                  <PaginationNext
                    onClick={() => handlePageChange(currentPage + 1)}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      ) : (
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <SlidersHorizontal className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="text-xl mb-2">No projects found</CardTitle>
            <CardDescription>
              {searchQuery || getActiveFilterCount() > 0
                ? "Try adjusting your search or filters"
                : isManager
                ? "Create your first project to get started"
                : "You don't have any assigned projects yet"}
            </CardDescription>
            {(searchQuery || getActiveFilterCount() > 0) && (
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setSearchQuery("");
                  clearFilters();
                }}
              >
                Clear all filters
              </Button>
            )}
            {isManager && !searchQuery && getActiveFilterCount() === 0 && (
              <Button
                className="mt-4"
                onClick={() => navigate("/projects/new")}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Project
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Projects;
