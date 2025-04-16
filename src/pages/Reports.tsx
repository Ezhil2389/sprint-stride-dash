import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart as BarChartIcon,
  Calendar,
  FileText,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
} from "lucide-react";
import { projectsApi, usersApi } from "@/services/api";
import { PriorityLevel, ProjectStatus } from "@/types";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Tooltip,
  LineChart,
  Line,
  ResponsiveContainer,
} from "recharts";

// Define chart colors
const STATUS_COLORS = ["#9e9e9e", "#2196f3", "#4caf50"];
const PRIORITY_COLORS = ["#4caf50", "#ff9800", "#f44336", "#9c27b0"];
const CHART_COLORS = ["#5c6ac4", "#2196f3", "#4caf50", "#ff9800", "#f44336", "#9c27b0"];

const Reports = () => {
  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.getAll,
  });

  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: usersApi.getEmployees,
  });

  // Calculate project status distribution
  const statusData = useMemo(() => {
    const counts = {
      [ProjectStatus.NOT_STARTED]: 0,
      [ProjectStatus.IN_PROGRESS]: 0,
      [ProjectStatus.COMPLETED]: 0,
    };

    projects.forEach((project) => {
      counts[project.status]++;
    });

    return [
      { name: "Not Started", value: counts[ProjectStatus.NOT_STARTED] },
      { name: "In Progress", value: counts[ProjectStatus.IN_PROGRESS] },
      { name: "Completed", value: counts[ProjectStatus.COMPLETED] },
    ];
  }, [projects]);

  // Calculate project priority distribution
  const priorityData = useMemo(() => {
    const counts = {
      [PriorityLevel.LOW]: 0,
      [PriorityLevel.MEDIUM]: 0,
      [PriorityLevel.HIGH]: 0,
      [PriorityLevel.URGENT]: 0,
    };

    projects.forEach((project) => {
      counts[project.priority]++;
    });

    return [
      { name: "Low", value: counts[PriorityLevel.LOW] },
      { name: "Medium", value: counts[PriorityLevel.MEDIUM] },
      { name: "High", value: counts[PriorityLevel.HIGH] },
      { name: "Urgent", value: counts[PriorityLevel.URGENT] },
    ];
  }, [projects]);

  // Calculate employee workload
  const workloadData = useMemo(() => {
    if (!employees.length) return [];

    const employeeProjects = employees.map((employee) => {
      const assignedProjects = projects.filter(
        (project) => project.assignedTo?.id === employee.id
      );

      return {
        name: employee.name.split(" ")[0],
        total: assignedProjects.length,
        inProgress: assignedProjects.filter(
          (p) => p.status === ProjectStatus.IN_PROGRESS
        ).length,
        notStarted: assignedProjects.filter(
          (p) => p.status === ProjectStatus.NOT_STARTED
        ).length,
        completed: assignedProjects.filter(
          (p) => p.status === ProjectStatus.COMPLETED
        ).length,
      };
    });

    return employeeProjects.sort((a, b) => b.total - a.total);
  }, [employees, projects]);

  // Calculate monthly completion data (simulated)
  const monthlyData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
    const completionData = [
      { month: "Jan", completed: 5, started: 8 },
      { month: "Feb", completed: 7, started: 9 },
      { month: "Mar", completed: 4, started: 6 },
      { month: "Apr", completed: 8, started: 12 },
      { month: "May", completed: 6, started: 7 },
      { month: "Jun", completed: 3, started: 5 },
    ];
    
    return completionData;
  }, []);

  // Calculate completion rate over time (simulated)
  const weeklyCompletionRate = useMemo(() => {
    const getWeekNumber = (d: Date) => {
      d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    };
    
    // Generate weekly data for the last 10 weeks
    const weeks = [];
    const currentDate = new Date();
    for (let i = 9; i >= 0; i--) {
      const weekDate = new Date();
      weekDate.setDate(currentDate.getDate() - i * 7);
      const weekNumber = getWeekNumber(weekDate);
      const weekLabel = `W${weekNumber}`;
      
      // Simulated data
      const completionRate = Math.floor(Math.random() * 30) + 70;
      
      weeks.push({
        week: weekLabel,
        completionRate,
      });
    }
    
    return weeks;
  }, []);

  const getTotalProjectCount = () => projects.length;
  
  const getCompletedProjectCount = () =>
    projects.filter((p) => p.status === ProjectStatus.COMPLETED).length;
  
  const getCompletionPercentage = () => {
    const total = getTotalProjectCount();
    const completed = getCompletedProjectCount();
    return total ? Math.round((completed / total) * 100) : 0;
  };

  const getUpcomingDeadlines = () => {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    return projects
      .filter(
        (p) =>
          p.status !== ProjectStatus.COMPLETED &&
          new Date(p.endDate) >= now &&
          new Date(p.endDate) <= nextWeek
      )
      .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());
  };

  const upcomingDeadlines = getUpcomingDeadlines();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground">
          View performance metrics and project statistics
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base">Total Projects</CardTitle>
              <CardDescription>All projects in system</CardDescription>
            </div>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalProjectCount()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base">Completed</CardTitle>
              <CardDescription>Successfully delivered</CardDescription>
            </div>
            <PieChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getCompletedProjectCount()}</div>
            <p className="text-xs text-muted-foreground">
              {getCompletionPercentage()}% completion rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base">Active Employees</CardTitle>
              <CardDescription>Team members</CardDescription>
            </div>
            <BarChartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{employees.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
              <CardDescription>Due in 7 days</CardDescription>
            </div>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingDeadlines.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="projectStatus" className="space-y-6">
        <TabsList>
          <TabsTrigger value="projectStatus">Project Status</TabsTrigger>
          <TabsTrigger value="teamWorkload">Team Workload</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="projectStatus" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>
                  Breakdown of projects by current status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name}: ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {statusData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Priority Distribution</CardTitle>
                <CardDescription>
                  Projects by assigned priority level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={priorityData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Projects">
                        {priorityData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PRIORITY_COLORS[index % PRIORITY_COLORS.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {upcomingDeadlines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Deadlines</CardTitle>
                <CardDescription>
                  Projects due within the next 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingDeadlines.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0"
                    >
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Due {format(new Date(project.endDate), "MMMM d, yyyy")}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {project.assignedTo ? (
                          <span className="text-sm">
                            {project.assignedTo.name.split(" ")[0]}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="teamWorkload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Workload Distribution</CardTitle>
              <CardDescription>
                Number of projects assigned to each team member
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={workloadData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={80} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="notStarted"
                      name="Not Started"
                      stackId="a"
                      fill={STATUS_COLORS[0]}
                    />
                    <Bar
                      dataKey="inProgress"
                      name="In Progress"
                      stackId="a"
                      fill={STATUS_COLORS[1]}
                    />
                    <Bar
                      dataKey="completed"
                      name="Completed"
                      stackId="a"
                      fill={STATUS_COLORS[2]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Project Activity</CardTitle>
                <CardDescription>
                  Projects started vs. completed by month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={monthlyData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="started"
                        name="Started"
                        fill={CHART_COLORS[0]}
                      />
                      <Bar
                        dataKey="completed"
                        name="Completed"
                        fill={CHART_COLORS[2]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Completion Rate</CardTitle>
                <CardDescription>
                  Percentage of tasks completed on schedule
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={weeklyCompletionRate}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip
                        formatter={(value) => [`${value}%`, "Completion Rate"]}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="completionRate"
                        name="Completion Rate (%)"
                        stroke={CHART_COLORS[1]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
