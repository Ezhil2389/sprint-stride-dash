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
import { ProjectStatus, PriorityLevel } from "@/types";
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
import { countBy, groupBy } from 'lodash';

const STATUS_COLORS: { [key in ProjectStatus]: string } = {
  [ProjectStatus.NOT_STARTED]: "#9e9e9e",
  [ProjectStatus.IN_PROGRESS]: "#2196f3",
  [ProjectStatus.COMPLETED]: "#4caf50",
};

const PRIORITY_COLORS: { [key in PriorityLevel]: string } = {
    [PriorityLevel.LOW]: "#4caf50",
    [PriorityLevel.MEDIUM]: "#ff9800",
    [PriorityLevel.HIGH]: "#f44336",
    [PriorityLevel.URGENT]: "#9c27b0",
};

const Dashboard = () => {
  const { currentUser, isManager } = useAuth();

  const { data: projectsResponse, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["allProjectsForDashboard"],
    queryFn: () => projectsApi.getAll(0, 1000),
    enabled: !!currentUser,
  });

  const { data: userProjects, isLoading: isLoadingUserProjects } = useQuery({
    queryKey: ["userProjectsForDashboard"],
    queryFn: () => projectsApi.getUserProjects(0, 1000),
    enabled: !!currentUser && !isManager,
  });

  const { data: usersResponse, isLoading: isLoadingUsers } = useQuery({
      queryKey: ["allUsersForDashboard"],
      queryFn: () => usersApi.getAll(0, 1000),
      enabled: !!currentUser && isManager,
  });

  const allProjects = projectsResponse?.content || [];
  const myProjects = userProjects?.content || [];
  const allUsers = usersResponse?.content || [];

  const projectsToAnalyze = isManager ? allProjects : myProjects;

  const totalProjects = projectsToAnalyze.length;
  const completedProjects = projectsToAnalyze.filter(
    (p) => p.status === ProjectStatus.COMPLETED
  ).length;
  const inProgressProjects = projectsToAnalyze.filter(
    (p) => p.status === ProjectStatus.IN_PROGRESS
  ).length;
  const notStartedProjects = projectsToAnalyze.filter(
    (p) => p.status === ProjectStatus.NOT_STARTED
  ).length;

  const projectStatusCounts = countBy(projectsToAnalyze, 'status');
  const projectStatusData = Object.entries(projectStatusCounts).map(([name, value]) => ({
    name: name.replace('_', ' '),
    value,
  }));

  const projectPriorityCounts = countBy(projectsToAnalyze, 'priority');
  const projectPriorityData = Object.entries(projectPriorityCounts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(),
      value,
  }));

  const upcomingDeadlines = allProjects
    .filter(
      (p) => {
          try {
              const endDate = new Date(p.endDate);
              const now = new Date();
              const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
              return endDate > now && endDate < sevenDaysLater && p.status !== ProjectStatus.COMPLETED;
          } catch(e) { return false; }
      }
    )
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());

  const myUpcomingDeadlines = upcomingDeadlines.filter(
    (p) => p.assignedToId === currentUser?.id
  );

  const isDashboardLoading = isLoadingProjects || (isLoadingUserProjects && !isManager) || (isLoadingUsers && isManager);

  if (isDashboardLoading) {
      return <div>Loading dashboard data...</div>
  }

  const handleDummyStatusUpdate = () => { 
      console.log("Status update from dashboard card not implemented.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {currentUser?.firstName || currentUser?.username}!
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
                          data={projectStatusData}
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
                          {projectStatusData.map((entry) => (
                            <Cell
                              key={`cell-status-${entry.name}`}
                              fill={STATUS_COLORS[entry.name.replace(' ', '_').toUpperCase() as ProjectStatus]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
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
                        data={projectPriorityData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 0,
                          bottom: 5,
                        }}
                      >
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" name="Projects">
                          {projectPriorityData.map((entry) => (
                            <Cell
                              key={`cell-priority-${entry.name}`}
                              fill={PRIORITY_COLORS[entry.name.toUpperCase() as PriorityLevel]}
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
                      <ProjectCard key={project.id} project={project} onUpdateStatus={handleDummyStatusUpdate} />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-lg font-medium">No upcoming deadlines</p>
                    <p className="text-sm text-muted-foreground">
                      All projects are either completed or due after the next 7 days
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projectsToAnalyze.length > 0 ? (
                projectsToAnalyze
                  .slice(0, 6)
                  .map((project) => (
                    <ProjectCard key={project.id} project={project} onUpdateStatus={handleDummyStatusUpdate} />
                  ))
              ) : (
                <div className="col-span-3 flex justify-center">
                  <p>No projects found</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Team Members"
                value={allUsers.length}
                icon={PanelLeft}
                description="Active team members"
              />
              <StatCard
                title="Avg. Completion"
                value="92%"
                icon={CheckCircle}
                description="Team efficiency"
              />
              <StatCard
                title="Overdue Tasks"
                value={3}
                icon={FileWarning}
                description="Requires attention"
              />
              <StatCard
                title="Avg. Response"
                value="2.5h"
                icon={Clock}
                description="Communication time"
              />
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="My Projects"
              value={totalProjects}
              icon={PanelLeft}
              description="Assigned to you"
            />
            <StatCard
              title="Completed"
              value={completedProjects}
              icon={CheckCircle}
              description="Successfully delivered"
            />
            <StatCard
              title="In Progress"
              value={inProgressProjects}
              icon={PlayCircle}
              description="Currently active"
            />
            <StatCard
              title="Not Started"
              value={notStartedProjects}
              icon={Clock}
              description="Waiting to begin"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Deadlines</CardTitle>
              <CardDescription>Your projects due in the next 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {myUpcomingDeadlines.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {myUpcomingDeadlines.map((project) => (
                    <ProjectCard key={project.id} project={project} onUpdateStatus={handleDummyStatusUpdate} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-lg font-medium">No upcoming deadlines</p>
                  <p className="text-sm text-muted-foreground">
                    All your projects are either completed or due after the next 7
                    days
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>My Project Status</CardTitle>
                <CardDescription>Overview of your project statuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={projectStatusData}
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
                        {projectStatusData.map((entry) => (
                          <Cell
                            key={`cell-status-${entry.name}`}
                            fill={STATUS_COLORS[entry.name.replace(' ', '_').toUpperCase() as ProjectStatus]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Priority Distribution</CardTitle>
                <CardDescription>Your projects by priority level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={projectPriorityData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 0,
                        bottom: 5,
                      }}
                    >
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="value" name="Projects">
                        {projectPriorityData.map((entry) => (
                          <Cell
                            key={`cell-priority-${entry.name}`}
                            fill={PRIORITY_COLORS[entry.name.toUpperCase() as PriorityLevel]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
