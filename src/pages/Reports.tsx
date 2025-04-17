import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart as BarChartIcon,
  Calendar,
  FileText,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Users,
} from "lucide-react";
import { projectsApi, usersApi } from "@/services/api";
import { PriorityLevel, ProjectStatus, UserRole, Project } from "@/types";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO, startOfMonth, endOfMonth, getWeek, startOfWeek, endOfWeek, differenceInWeeks } from "date-fns";
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
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

const STATUS_COLORS = ["#9e9e9e", "#2196f3", "#4caf50"];
const PRIORITY_COLORS = ["#4caf50", "#ff9800", "#f44336", "#9c27b0"];
const CHART_COLORS = ["#5c6ac4", "#2196f3", "#4caf50", "#ff9800", "#f44336", "#9c27b0"];

const Reports = () => {
  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects", { page: 0, size: 1000 }],
    queryFn: ({ queryKey }) => {
        const [, params] = queryKey as [string, { page: number, size: number }];
        return projectsApi.getAll(params.page, params.size);
    },
    placeholderData: { content: [], totalElements: 0 }
  });
  const projects: Project[] = projectsData?.content ?? [];

  const { data: usersData, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["users", { page: 0, size: 1000 }],
    queryFn: ({ queryKey }) => {
        const [, params] = queryKey as [string, { page: number, size: number }];
        return usersApi.getAll(params.page, params.size);
    },
    placeholderData: { content: [], totalElements: 0, totalPages: 0 }
  });

  const employees = useMemo(() => {
    return (usersData?.content ?? []).filter(user => user.role === UserRole.EMPLOYEE);
  }, [usersData]);

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

  const workloadData = useMemo(() => {
    if (!employees.length) return [];

    const employeeProjects = employees.map((employee) => {
      const assignedProjects = projects.filter(
        (project) => project.assignedToId === employee.id
      );

      const employeeName = (employee.firstName || employee.lastName)
        ? `${employee.firstName ?? ''} ${employee.lastName ?? ''}`.trim()
        : employee.username;

      return {
        name: employeeName.split(" ")[0],
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

  const monthlyData = useMemo(() => {
    const monthlyStats: { [key: string]: { month: string; completed: number; started: number } } = {};
    (projects ?? []).forEach(project => {
      const startDate = parseISO(project.startDate);
      const endDate = project.endDate ? parseISO(project.endDate) : null;
      const startMonthStr = format(startDate, "yyyy-MMM");
      const endMonthStr = project.status === ProjectStatus.COMPLETED && endDate ? format(endDate, "yyyy-MMM") : null;

      if (!monthlyStats[startMonthStr]) {
        monthlyStats[startMonthStr] = { month: format(startDate, "MMM"), completed: 0, started: 0 };
      }
      monthlyStats[startMonthStr].started++;

      if (endMonthStr && project.status === ProjectStatus.COMPLETED && endDate) {
        if (!monthlyStats[endMonthStr]) {
          monthlyStats[endMonthStr] = { month: format(endDate, "MMM"), completed: 0, started: 0 };
        }
        monthlyStats[endMonthStr].completed++;
      }
    });

    const last6Months: { month: string; completed: number; started: number }[] = [];
    let dateCursor = new Date();
    for (let i = 0; i < 6; i++) {
        const monthStr = format(dateCursor, "yyyy-MMM");
        const monthLabel = format(dateCursor, "MMM");
        if (monthlyStats[monthStr]) {
            last6Months.push({ ...monthlyStats[monthStr], month: monthLabel });
        } else {
            last6Months.push({ month: monthLabel, completed: 0, started: 0 });
        }
        dateCursor.setMonth(dateCursor.getMonth() - 1);
    }

    return last6Months.reverse();
  }, [projects]);

  const weeklyCompletionRate = useMemo(() => {
    const weeklyStats: { [key: number]: { completed: number; totalEnded: number } } = {};
    const now = new Date();
    const tenWeeksAgo = startOfWeek(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7 * 9), { weekStartsOn: 1 });

    (projects ?? []).forEach(project => {
        if (!project.endDate) return;

        const endDate = parseISO(project.endDate);
        if (isNaN(endDate.getTime())) return;

        if (endDate < tenWeeksAgo || endDate > now) return;

        const weekNumber = getWeek(endDate, { weekStartsOn: 1 });

        if (!weeklyStats[weekNumber]) {
            weeklyStats[weekNumber] = { completed: 0, totalEnded: 0 };
        }

        weeklyStats[weekNumber].totalEnded++;
        if (project.status === ProjectStatus.COMPLETED) {
            weeklyStats[weekNumber].completed++;
        }
    });

    const rateData: { week: string; completionRate: number }[] = [];
    let weekCursor = tenWeeksAgo;

    for (let i = 0; i < 10; i++) {
        const weekNumber = getWeek(weekCursor, { weekStartsOn: 1 });
        const weekLabel = `W${weekNumber}`;
        const stats = weeklyStats[weekNumber];
        const completionRate = stats && stats.totalEnded > 0 ? Math.round((stats.completed / stats.totalEnded) * 100) : 0;

        rateData.push({
            week: weekLabel,
            completionRate: completionRate,
        });

        weekCursor = new Date(weekCursor.getFullYear(), weekCursor.getMonth(), weekCursor.getDate() + 7);
        if (isNaN(weekCursor.getTime())) break;
    }

    return rateData;
  }, [projects]);

  const upcomingDeadlines = useMemo(() => {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    return (projects ?? [])
      .filter(
        (p) => {
            const endDate = p.endDate ? parseISO(p.endDate) : null;
             return p.status !== ProjectStatus.COMPLETED &&
             endDate && !isNaN(endDate.getTime()) &&
             endDate >= now &&
             endDate <= nextWeek
        }
      )
      .sort((a, b) => {
          const dateA = a.endDate ? parseISO(a.endDate) : new Date(0);
          const dateB = b.endDate ? parseISO(b.endDate) : new Date(0);
          if (isNaN(dateA.getTime())) return 1;
          if (isNaN(dateB.getTime())) return -1;
          return dateA.getTime() - dateB.getTime()
      });
  }, [projects]);

  const totalProjectCount = useMemo(() => (projects ?? []).length, [projects]);

  const completedProjectCount = useMemo(() =>
    (projects ?? []).filter((p) => p.status === ProjectStatus.COMPLETED).length,
  [projects]);

  const completionPercentage = useMemo(() => {
    const total = totalProjectCount;
    const completed = completedProjectCount;
    return total ? Math.round((completed / total) * 100) : 0;
  }, [totalProjectCount, completedProjectCount]);

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
            <div className="text-2xl font-bold">{isLoadingProjects ? '...' : totalProjectCount}</div>
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
            <div className="text-2xl font-bold">{isLoadingProjects ? '...' : completedProjectCount}</div>
            <p className="text-xs text-muted-foreground">
              {isLoadingProjects ? '...' : `${completionPercentage}% completion rate`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="space-y-0.5">
              <CardTitle className="text-base">Active Employees</CardTitle>
              <CardDescription>Team members</CardDescription>
            </div>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoadingEmployees ? '...' : employees.length}</div>
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
            <div className="text-2xl font-bold">{isLoadingProjects ? '...' : upcomingDeadlines.length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="projectStatus" className="space-y-6">
        <TabsList>
          <TabsTrigger value="projectStatus">Project Status</TabsTrigger>
          <TabsTrigger value="teamWorkload">Team Workload</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="projectDetails">Project Details</TabsTrigger>
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
                        {project.assignedToId && employees.find(e => e.id === project.assignedToId)?.username}
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

        <TabsContent value="projectDetails">
          <Card>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription>Overview of all projects.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <thead className="bg-muted/50">
                  <TableRow>
                    <TableCell className="font-medium">Name</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>End Date</TableCell>
                  </TableRow>
                </thead>
                <TableBody>
                  {isLoadingProjects ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        Loading projects...
                      </TableCell>
                    </TableRow>
                  ) : (
                    projects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium 
                            ${project.priority === PriorityLevel.LOW ? 'bg-green-100 text-green-800' :
                              project.priority === PriorityLevel.MEDIUM ? 'bg-yellow-100 text-yellow-800' :
                              project.priority === PriorityLevel.HIGH ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'}`
                            }>
                            {project.priority}
                          </span>
                        </TableCell>
                        <TableCell>{project.status.replace('_', ' ')}</TableCell>
                        <TableCell>
                          {project.assignedToId
                            ? employees.find(e => e.id === project.assignedToId)?.username ?? 'Unknown User'
                            : 'Unassigned'}
                        </TableCell>
                        <TableCell>{format(parseISO(project.startDate), "PP")}</TableCell>
                        <TableCell>{project.endDate ? format(parseISO(project.endDate), "PP") : '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;
