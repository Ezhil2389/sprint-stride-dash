
import { cn } from "@/lib/utils";
import { PriorityLevel } from "@/types";
import { Badge } from "@/components/ui/badge";

interface PriorityBadgeProps {
  priority: PriorityLevel;
  className?: string;
}

export const PriorityBadge = ({ priority, className }: PriorityBadgeProps) => {
  const classes = {
    [PriorityLevel.LOW]: "priority-badge-low",
    [PriorityLevel.MEDIUM]: "priority-badge-medium",
    [PriorityLevel.HIGH]: "priority-badge-high",
    [PriorityLevel.URGENT]: "priority-badge-urgent",
  };

  const labels = {
    [PriorityLevel.LOW]: "Low",
    [PriorityLevel.MEDIUM]: "Medium",
    [PriorityLevel.HIGH]: "High",
    [PriorityLevel.URGENT]: "Urgent",
  };

  return (
    <Badge variant="outline" className={cn(classes[priority], className)}>
      {labels[priority]}
    </Badge>
  );
};
