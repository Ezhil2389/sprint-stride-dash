import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { PriorityBadge } from "./priority-badge";
import { Project, ProjectStatus } from "@/types";
import { format } from "date-fns";
import { Clock, CheckCircle, PlayCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
  onUpdateStatus: (projectId: number, status: ProjectStatus) => void;
  // isLoading?: boolean; 
}

export const ProjectCard = ({ project, onUpdateStatus /*, isLoading */ }: ProjectCardProps) => {
  const navigate = useNavigate();

  const handleStatusChange = (event: React.MouseEvent, newStatus: ProjectStatus) => {
    event.stopPropagation();
    if (project.status === newStatus /* || isLoading */) {
      return;
    }
    onUpdateStatus(project.id, newStatus);
  };

  const handleCardClick = () => {
    navigate(`/projects/${project.id}`);
  };
  
  return (
    <TooltipProvider>
      <Card 
        className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col h-full cursor-pointer group" 
        onClick={handleCardClick}
      >
        <CardHeader className="pb-2 relative">
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
             <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={project.status === ProjectStatus.NOT_STARTED ? "default" : "ghost"}
                  size="icon"
                  onClick={(e) => handleStatusChange(e, ProjectStatus.NOT_STARTED)}
                  // disabled={isLoading}
                  className={cn(
                    "h-7 w-7",
                    project.status !== ProjectStatus.NOT_STARTED && "hover:bg-muted/80"
                  )}
                >
                  <Clock className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Set to Not Started</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={project.status === ProjectStatus.IN_PROGRESS ? "default" : "ghost"}
                  size="icon"
                  onClick={(e) => handleStatusChange(e, ProjectStatus.IN_PROGRESS)}
                  // disabled={isLoading}
                  className={cn(
                    "h-7 w-7",
                    project.status !== ProjectStatus.IN_PROGRESS && "hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/80 dark:hover:text-blue-300"
                  )}
                >
                  <PlayCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Set to In Progress</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={project.status === ProjectStatus.COMPLETED ? "default" : "ghost"}
                  size="icon"
                  onClick={(e) => handleStatusChange(e, ProjectStatus.COMPLETED)}
                  // disabled={isLoading}
                  className={cn(
                    "h-7 w-7",
                    project.status !== ProjectStatus.COMPLETED && "hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900/80 dark:hover:text-green-300"
                  )}
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Set to Completed</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <CardTitle className="truncate text-base font-medium pr-20" title={project.name}>
            {project.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4 flex-grow">
          <p className="text-sm text-muted-foreground line-clamp-2 h-10 mb-3">
            {project.description}
          </p>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <StatusBadge status={project.status} />
              <PriorityBadge priority={project.priority} />
            </div>
            <span className="text-xs text-muted-foreground">Due: {format(new Date(project.endDate), "MMM d, yyyy")}</span>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
