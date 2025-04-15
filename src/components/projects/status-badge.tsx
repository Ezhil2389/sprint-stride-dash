
import { cn } from "@/lib/utils";
import { ProjectStatus } from "@/types";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: ProjectStatus;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const classes = {
    [ProjectStatus.NOT_STARTED]: "status-badge-not-started",
    [ProjectStatus.IN_PROGRESS]: "status-badge-in-progress",
    [ProjectStatus.COMPLETED]: "status-badge-completed",
  };

  const labels = {
    [ProjectStatus.NOT_STARTED]: "Not Started",
    [ProjectStatus.IN_PROGRESS]: "In Progress",
    [ProjectStatus.COMPLETED]: "Completed",
  };

  return (
    <Badge variant="outline" className={cn(classes[status], className)}>
      {labels[status]}
    </Badge>
  );
};
