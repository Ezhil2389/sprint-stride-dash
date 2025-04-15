
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { PriorityBadge } from "./priority-badge";
import { Project } from "@/types";
import { format } from "date-fns";

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard = ({ project }: ProjectCardProps) => {
  const navigate = useNavigate();
  
  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <CardTitle className="truncate text-base">{project.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <p className="text-sm text-muted-foreground line-clamp-2 h-10">
          {project.description}
        </p>
        <div className="flex items-center justify-between mt-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Due Date</p>
            <p className="text-sm">{format(new Date(project.endDate), "MMM d, yyyy")}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Assigned To</p>
            {project.assignedTo ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={project.assignedTo.avatar} />
                  <AvatarFallback className="text-xs">
                    {getInitials(project.assignedTo.name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{project.assignedTo.name.split(" ")[0]}</span>
              </div>
            ) : (
              <span className="text-sm text-muted-foreground">Unassigned</span>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <div className="flex gap-2">
          <StatusBadge status={project.status} />
          <PriorityBadge priority={project.priority} />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/projects/${project.id}`)}
        >
          View
        </Button>
      </CardFooter>
    </Card>
  );
};
