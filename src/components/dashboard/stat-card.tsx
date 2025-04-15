
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: number;
  className?: string;
}

export const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
}: StatCardProps) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {typeof trend === "number" && (
          <div
            className={cn(
              "mt-2 text-xs font-medium",
              trend > 0
                ? "text-green-500"
                : trend < 0
                ? "text-red-500"
                : "text-muted-foreground"
            )}
          >
            {trend > 0 ? "↑" : trend < 0 ? "↓" : ""}
            {` ${Math.abs(trend)}% from last month`}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
