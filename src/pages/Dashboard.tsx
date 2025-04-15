
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle,
  Clock,
  FileWarning,
  PanelLeft,
  PlayCircle,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { projectsApi, usersApi } from "@/services/api";
import { mockChartData } from "@/services/mockData";
import { ProjectStatus } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { ProjectCard } from "@/components/projects/project-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = ["#9e9e9e", "#2196f3", "#4caf50"];
const PRIORITY_COLORS = ["#4caf50", "#ff9800", "#f44336", "#9c27b0"];

const Dashboard = () => {
  const { user, isManager } = useAuth();

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects"],
    queryFn: projectsApi.getAll,
  });

  const { data: employees = [], isLoading: isLoadingEmployees } = useQuery({
    queryKey: ["employees"],
    queryFn: usersApi.getEmployees,
  });

  // Filter projects for employee view
  const myProjects = projects.filter(
    (project) => project.assignedTo?.id === user?.id
  );

  // Calculate stats for manager dashboard
  const totalProjects = projects.length;
  const completedProjects = projects.filter(
    (p) => p.status === ProjectStatus.COMPLETED
  ).length;
  const inProgressProjects = projects.filter(
    (p) => p.status === ProjectStatus.IN_PROGRESS
  ).length;
  const notStartedProjects = projects.filter(
    (p) => p.status === ProjectStatus.NOT_STARTED
  ).length;

  // Calculate stats for employee dashboard
  const myTotalProjects = myProjects.length;
  const myCompletedProjects = myProjects.filter(
    (p) => p.status === ProjectStatus.COMPLETED
  ).length;
  const myInProgressProjects = myProjects.filter(
    (p) => p.status === ProjectStatus.IN_PROGRESS
  ).length;
  const myNotStartedProjects = myProjects.filter(
    (p) => p.status === ProjectStatus.NOT_STARTED
  ).length;

  const upcomingDeadlines = projects
    .filter(
      (p) =>
        new Date(p.endDate) > new Date() &&
        new Date(p.endDate) <
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) &&
        p.status !== ProjectStatus.COMPLETED
    )
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());

  const myUpcomingDeadlines = upcomingDeadlines.filter(
    (p) => p.assignedTo?.id === user?.id
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}!
          </p>
        </div>
      </div>

      {isManager ? (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Projects"
                value={totalProjects}
                icon={PanelLeft}
                description="All active projects"
              />
              <StatCard
                title="Completed"
                value={completedProjects}
                icon={CheckCircle}
                description="Successfully delivered"
                trend={8}
              />
              <StatCard
                title="In Progress"
                value={inProgressProjects}
                icon={PlayCircle}
                description="Currently in development"
              />
              <StatCard
                title="Not Started"
                value={notStartedProjects}
                icon={Clock}
                description="Waiting to begin"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Project Status Distribution</CardTitle>
                  <CardDescription>
                    Overview of current project statuses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={mockChartData.projectStatusCount}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          {mockChartData.projectStatusCount.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
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
                    Projects by priority level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        width={500}
                        height={300}
                        data={mockChartData.projectPriorityCount}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Projects">
                          {mockChartData.projectPriorityCount.map((entry, index) => (
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

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Deadlines</CardTitle>
                <CardDescription>
                  Projects due in the next 7 days
                </CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingDeadlines.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {upcomingDeadlines.slice(0, 3).map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No Upcoming Deadlines</h3>
                    <p className="text-sm text-muted-foreground">
                      There are no projects due within the next week.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.slice(0, 6).map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Workload</CardTitle>
                <CardDescription>
                  Projects assigned to each team member
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      width={500}
                      height={300}
                      data={mockChartData.employeeProjectLoad}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="projects" fill="#5c6ac4" name="Assigned Projects" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        // Employee Dashboard
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="My Projects"
              value={myTotalProjects}
              icon={PanelLeft}
              description="Assigned to you"
            />
            <StatCard
              title="Completed"
              value={myCompletedProjects}
              icon={CheckCircle}
              description="Successfully delivered"
            />
            <StatCard
              title="In Progress"
              value={myInProgressProjects}
              icon={PlayCircle}
              description="Currently working on"
            />
            <StatCard
              title="Not Started"
              value={myNotStartedProjects}
              icon={Clock}
              description="Yet to begin"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>My Projects</CardTitle>
              <CardDescription>Projects assigned to you</CardDescription>
            </CardHeader>
            <CardContent>
              {myProjects.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {myProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileWarning className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Projects Assigned</h3>
                  <p className="text-sm text-muted-foreground">
                    You currently don't have any projects assigned to you.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>
                Your projects due in the next 7 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {myUpcomingDeadlines.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {myUpcomingDeadlines.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Upcoming Deadlines</h3>
                  <p className="text-sm text-muted-foreground">
                    You don't have any projects due within the next week.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
