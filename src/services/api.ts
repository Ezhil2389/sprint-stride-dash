
import { Project, ProjectStatus, PriorityLevel, User, UserRole } from "@/types";
import { mockProjects, mockUsers } from "./mockData";

// Helper to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Projects API
export const projectsApi = {
  getAll: async (): Promise<Project[]> => {
    await delay(800);
    return [...mockProjects];
  },

  getById: async (id: string): Promise<Project> => {
    await delay(600);
    const project = mockProjects.find(p => p.id === id);
    if (!project) {
      throw new Error(`Project with id ${id} not found`);
    }
    return { ...project };
  },

  create: async (projectData: Omit<Project, "id" | "createdAt" | "updatedAt">): Promise<Project> => {
    await delay(1000);
    const newProject: Project = {
      ...projectData,
      id: `p${mockProjects.length + 1}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockProjects.push(newProject);
    return newProject;
  },

  update: async (id: string, projectData: Partial<Project>): Promise<Project> => {
    await delay(800);
    const index = mockProjects.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Project with id ${id} not found`);
    }
    
    const updatedProject = {
      ...mockProjects[index],
      ...projectData,
      updatedAt: new Date().toISOString(),
    };
    
    mockProjects[index] = updatedProject;
    return updatedProject;
  },

  updateStatus: async (id: string, status: ProjectStatus): Promise<Project> => {
    await delay(500);
    return projectsApi.update(id, { status });
  },

  delete: async (id: string): Promise<boolean> => {
    await delay(700);
    const index = mockProjects.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Project with id ${id} not found`);
    }
    mockProjects.splice(index, 1);
    return true;
  },

  search: async (query: string): Promise<Project[]> => {
    await delay(600);
    if (!query) return [...mockProjects];

    const lowercasedQuery = query.toLowerCase();
    return mockProjects.filter(
      p => 
        p.name.toLowerCase().includes(lowercasedQuery) || 
        p.description.toLowerCase().includes(lowercasedQuery)
    );
  },

  filter: async (filters: {
    status?: ProjectStatus[];
    priority?: PriorityLevel[];
    assignedTo?: string;
    dateRange?: { start?: string; end?: string };
  }): Promise<Project[]> => {
    await delay(800);
    
    return mockProjects.filter(project => {
      // Filter by status
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(project.status)) return false;
      }
      
      // Filter by priority
      if (filters.priority && filters.priority.length > 0) {
        if (!filters.priority.includes(project.priority)) return false;
      }
      
      // Filter by assignee
      if (filters.assignedTo) {
        if (project.assignedTo?.id !== filters.assignedTo) return false;
      }
      
      // Filter by date range
      if (filters.dateRange) {
        const { start, end } = filters.dateRange;
        if (start && new Date(project.endDate) < new Date(start)) return false;
        if (end && new Date(project.startDate) > new Date(end)) return false;
      }
      
      return true;
    });
  },
};

// Users API
export const usersApi = {
  getAll: async (): Promise<User[]> => {
    await delay(700);
    return [...mockUsers];
  },

  getById: async (id: string): Promise<User> => {
    await delay(500);
    const user = mockUsers.find(u => u.id === id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }
    return { ...user };
  },

  create: async (userData: Omit<User, "id">): Promise<User> => {
    await delay(1000);
    const newUser: User = {
      ...userData,
      id: `u${mockUsers.length + 1}`,
    };
    mockUsers.push(newUser);
    return newUser;
  },

  update: async (id: string, userData: Partial<User>): Promise<User> => {
    await delay(700);
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error(`User with id ${id} not found`);
    }
    
    const updatedUser = {
      ...mockUsers[index],
      ...userData,
    };
    
    mockUsers[index] = updatedUser;
    return updatedUser;
  },

  delete: async (id: string): Promise<boolean> => {
    await delay(600);
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) {
      throw new Error(`User with id ${id} not found`);
    }
    mockUsers.splice(index, 1);
    return true;
  },

  search: async (query: string): Promise<User[]> => {
    await delay(500);
    if (!query) return [...mockUsers];

    const lowercasedQuery = query.toLowerCase();
    return mockUsers.filter(
      u => 
        u.name.toLowerCase().includes(lowercasedQuery) || 
        u.email.toLowerCase().includes(lowercasedQuery) ||
        u.department?.toLowerCase().includes(lowercasedQuery) ||
        u.title?.toLowerCase().includes(lowercasedQuery)
    );
  },

  getEmployees: async (): Promise<User[]> => {
    await delay(600);
    return mockUsers.filter(u => u.role === UserRole.EMPLOYEE);
  },

  getManagers: async (): Promise<User[]> => {
    await delay(600);
    return mockUsers.filter(u => u.role === UserRole.MANAGER);
  },
};
