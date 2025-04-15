
import { Project, ProjectStatus, PriorityLevel, User, UserRole } from "@/types";

// Mock Users
export const mockUsers: User[] = [
  {
    id: "1",
    name: "Alex Johnson",
    email: "manager@example.com",
    role: UserRole.MANAGER,
    avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80",
    department: "Engineering",
    title: "Engineering Manager",
  },
  {
    id: "2",
    name: "Sam Davis",
    email: "employee@example.com",
    role: UserRole.EMPLOYEE,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80",
    department: "Development",
    title: "Senior Developer",
  },
  {
    id: "3",
    name: "Jamie Wilson",
    email: "jamie@example.com",
    role: UserRole.EMPLOYEE,
    avatar: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80",
    department: "Design",
    title: "Product Designer",
  },
  {
    id: "4",
    name: "Taylor Reed",
    email: "taylor@example.com",
    role: UserRole.EMPLOYEE,
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80",
    department: "Development",
    title: "Frontend Engineer",
  },
  {
    id: "5",
    name: "Morgan Smith",
    email: "morgan@example.com",
    role: UserRole.MANAGER,
    avatar: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80",
    department: "Product",
    title: "Product Manager",
  },
  {
    id: "6",
    name: "Casey Brown",
    email: "casey@example.com",
    role: UserRole.EMPLOYEE,
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80",
    department: "Development",
    title: "Backend Developer",
  },
];

// Generate a mock project
const createMockProject = (
  id: string,
  name: string,
  description: string,
  startDate: string,
  endDate: string,
  assignedTo: User | null,
  priority: PriorityLevel,
  status: ProjectStatus
): Project => {
  const createdAt = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString();
  const updatedAt = new Date(Date.now() - Math.floor(Math.random() * 7) * 24 * 60 * 60 * 1000).toISOString();
  
  return {
    id,
    name,
    description,
    startDate,
    endDate,
    assignedTo,
    priority,
    status,
    createdAt,
    updatedAt
  };
};

// Mock Projects
export const mockProjects: Project[] = [
  createMockProject(
    "p1",
    "Website Redesign",
    "Complete overhaul of the company website with new branding and improved UX",
    "2025-03-01",
    "2025-05-15",
    mockUsers.find(u => u.id === "3") || null,
    PriorityLevel.HIGH,
    ProjectStatus.IN_PROGRESS
  ),
  createMockProject(
    "p2",
    "Mobile App Development",
    "Develop a cross-platform mobile app for customer engagement",
    "2025-02-15",
    "2025-06-30",
    mockUsers.find(u => u.id === "2") || null,
    PriorityLevel.MEDIUM,
    ProjectStatus.IN_PROGRESS
  ),
  createMockProject(
    "p3",
    "Database Migration",
    "Migrate from MySQL to PostgreSQL for improved performance",
    "2025-04-01",
    "2025-04-30",
    mockUsers.find(u => u.id === "6") || null,
    PriorityLevel.URGENT,
    ProjectStatus.NOT_STARTED
  ),
  createMockProject(
    "p4",
    "Security Audit",
    "Comprehensive security review of all systems",
    "2025-01-10",
    "2025-02-28",
    mockUsers.find(u => u.id === "4") || null,
    PriorityLevel.HIGH,
    ProjectStatus.COMPLETED
  ),
  createMockProject(
    "p5",
    "Content Strategy",
    "Develop content strategy for Q3 marketing campaigns",
    "2025-03-15",
    "2025-04-15",
    null,
    PriorityLevel.LOW,
    ProjectStatus.NOT_STARTED
  ),
  createMockProject(
    "p6",
    "API Integration",
    "Integrate with third-party payment processors",
    "2025-02-01",
    "2025-03-15",
    mockUsers.find(u => u.id === "2") || null,
    PriorityLevel.MEDIUM,
    ProjectStatus.COMPLETED
  ),
  createMockProject(
    "p7",
    "UI Component Library",
    "Build reusable UI component library using React and Tailwind",
    "2025-04-10",
    "2025-06-01",
    mockUsers.find(u => u.id === "4") || null,
    PriorityLevel.MEDIUM,
    ProjectStatus.NOT_STARTED
  ),
  createMockProject(
    "p8",
    "Analytics Dashboard",
    "Create real-time analytics dashboard for management",
    "2025-03-01",
    "2025-05-01",
    mockUsers.find(u => u.id === "3") || null,
    PriorityLevel.HIGH,
    ProjectStatus.IN_PROGRESS
  ),
  createMockProject(
    "p9",
    "Documentation Update",
    "Update all API documentation to the new standard",
    "2025-04-01",
    "2025-04-15",
    mockUsers.find(u => u.id === "6") || null,
    PriorityLevel.LOW,
    ProjectStatus.NOT_STARTED
  ),
  createMockProject(
    "p10",
    "Infrastructure Upgrade",
    "Upgrade server infrastructure to handle increased load",
    "2025-01-15",
    "2025-03-15",
    null,
    PriorityLevel.URGENT,
    ProjectStatus.COMPLETED
  ),
];

// Mock data statistics
export const mockStatistics = {
  totalProjects: mockProjects.length,
  completedProjects: mockProjects.filter(p => p.status === ProjectStatus.COMPLETED).length,
  inProgressProjects: mockProjects.filter(p => p.status === ProjectStatus.IN_PROGRESS).length,
  notStartedProjects: mockProjects.filter(p => p.status === ProjectStatus.NOT_STARTED).length,
  urgentProjects: mockProjects.filter(p => p.priority === PriorityLevel.URGENT).length,
  highPriorityProjects: mockProjects.filter(p => p.priority === PriorityLevel.HIGH).length,
  upcomingDeadlines: mockProjects
    .filter(p => new Date(p.endDate) > new Date() && new Date(p.endDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
    .length,
  totalEmployees: mockUsers.filter(u => u.role === UserRole.EMPLOYEE).length,
};

// Mock chart data
export const mockChartData = {
  projectStatusCount: [
    { name: "Not Started", value: mockStatistics.notStartedProjects },
    { name: "In Progress", value: mockStatistics.inProgressProjects },
    { name: "Completed", value: mockStatistics.completedProjects },
  ],
  projectPriorityCount: [
    { name: "Low", value: mockProjects.filter(p => p.priority === PriorityLevel.LOW).length },
    { name: "Medium", value: mockProjects.filter(p => p.priority === PriorityLevel.MEDIUM).length },
    { name: "High", value: mockProjects.filter(p => p.priority === PriorityLevel.HIGH).length },
    { name: "Urgent", value: mockProjects.filter(p => p.priority === PriorityLevel.URGENT).length },
  ],
  monthlyCompletionRate: [
    { name: "Jan", completed: 5, total: 8 },
    { name: "Feb", completed: 7, total: 10 },
    { name: "Mar", completed: 4, total: 6 },
    { name: "Apr", completed: 2, total: 8 },
  ],
  employeeProjectLoad: mockUsers
    .filter(u => u.role === UserRole.EMPLOYEE)
    .map(user => ({
      name: user.name,
      projects: mockProjects.filter(p => p.assignedTo?.id === user.id).length,
    })),
};
