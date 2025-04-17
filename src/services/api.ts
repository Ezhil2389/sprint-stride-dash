import { Project, ProjectRequest, ProjectStatus, ProjectStatusRequest, PriorityLevel, User, UserRole, ApiResponse, UserRequest } from "@/types";
import { mockProjects, mockUsers } from "./mockData";
import { httpClient } from "./httpClient";

// Helper to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Real Projects API
export const projectsApi = {
  getAll: async (page = 0, size = 10): Promise<{ content: Project[], totalElements: number }> => {
    try {
      return await httpClient.get<{ content: Project[], totalElements: number }>(`/projects?page=${page}&size=${size}`);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      throw error;
    }
  },

  getById: async (id: number): Promise<Project> => {
    try {
      return await httpClient.get<Project>(`/projects/${id}`);
    } catch (error) {
      console.error(`Failed to fetch project with id ${id}:`, error);
      throw error;
    }
  },

  create: async (projectData: ProjectRequest): Promise<Project> => {
    try {
      return await httpClient.post<Project>('/projects', projectData);
    } catch (error) {
      console.error("Failed to create project:", error);
      throw error;
    }
  },

  update: async (id: number, projectData: ProjectRequest): Promise<Project> => {
    try {
      return await httpClient.put<Project>(`/projects/${id}`, projectData);
    } catch (error) {
      console.error(`Failed to update project with id ${id}:`, error);
      throw error;
    }
  },

  updateStatus: async (id: number, status: ProjectStatus): Promise<Project> => {
    try {
      const statusRequest: ProjectStatusRequest = { status };
      // Use patch for status update
      return await httpClient.patch<Project>(`/projects/${id}/status`, statusRequest);
    } catch (error) {
      console.error(`Failed to update status for project with id ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await httpClient.delete<void>(`/projects/${id}`);
    } catch (error) {
      console.error(`Failed to delete project with id ${id}:`, error);
      throw error;
    }
  },

  getUserProjects: async (page = 0, size = 10): Promise<{ content: Project[], totalElements: number }> => {
    try {
      return await httpClient.get<{ content: Project[], totalElements: number }>(`/projects/my?page=${page}&size=${size}`);
    } catch (error) {
      console.error("Failed to fetch user projects:", error);
      throw error;
    }
  }
};

// Mock Projects API - for fallback during development
export const mockProjectsApi = {
  getAll: async (): Promise<Project[]> => {
    await delay(800);
    return [...mockProjects];
  },

  getById: async (id: number): Promise<Project> => {
    await delay(600);
    const project = mockProjects.find(p => p.id === id);
    if (!project) {
      throw new Error(`Project with id ${id} not found`);
    }
    return { ...project };
  },

  create: async (projectData: Omit<Project, "id">): Promise<Project> => {
    await delay(1000);
    const newProject: Project = {
      ...projectData,
      id: mockProjects.length + 1,
    };
    mockProjects.push(newProject);
    return newProject;
  },

  update: async (id: number, projectData: Partial<Project>): Promise<Project> => {
    await delay(800);
    const index = mockProjects.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error(`Project with id ${id} not found`);
    }
    
    const updatedProject = {
      ...mockProjects[index],
      ...projectData,
    };
    
    mockProjects[index] = updatedProject;
    return updatedProject;
  },

  updateStatus: async (id: number, status: ProjectStatus): Promise<Project> => {
    await delay(500);
    return mockProjectsApi.update(id, { status });
  },

  delete: async (id: number): Promise<boolean> => {
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
};

// Define the expected paginated response structure
interface PaginatedUsersResponse {
  content: User[];
  totalElements: number;
  totalPages: number;
  // Add other pagination fields if needed (pageable, size, number, etc.)
}

// Real Users API
export const usersApi = {
  getAll: async (page = 0, size = 10): Promise<PaginatedUsersResponse> => {
    try {
      return await httpClient.get<PaginatedUsersResponse>(`/users?page=${page}&size=${size}`);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      throw error;
    }
  },

  getById: async (id: number): Promise<User> => {
    try {
      return await httpClient.get<User>(`/users/${id}`);
    } catch (error) {
      console.error(`Failed to fetch user with id ${id}:`, error);
      throw error;
    }
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      return await httpClient.get<User>('/users/me');
    } catch (error) {
      console.error("Failed to fetch current user:", error);
      throw error;
    }
  },

  create: async (userData: UserRequest): Promise<User> => {
    try {
      return await httpClient.post<User>('/users', userData);
    } catch (error) {
      console.error("Failed to create user:", error);
      throw error;
    }
  },

  update: async (id: number, userData: UserRequest): Promise<User> => {
    try {
      return await httpClient.put<User>(`/users/${id}`, userData);
    } catch (error) {
      console.error(`Failed to update user with id ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await httpClient.delete<void>(`/users/${id}`);
    } catch (error) {
      console.error(`Failed to delete user with id ${id}:`, error);
      throw error;
    }
  },

  changeOwnPassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    try {
      await httpClient.post<{ success: boolean; message: string; data: null }>(
        '/users/me/password',
        { oldPassword, newPassword }
      );
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error;
    }
  },
};

export const mfaApi = {
  setup: async (): Promise<{ secret: string; qrCode: string }> => {
    return await httpClient.post<{ secret: string; qrCode: string }>("/mfa/setup", {});
  },
  verifySetup: async (code: string): Promise<{ success: boolean; message: string }> => {
    return await httpClient.post<{ success: boolean; message: string }>(`/mfa/verify-setup?code=${encodeURIComponent(code)}`, {});
  },
  disable: async (code: string): Promise<{ success: boolean; message: string }> => {
    return await httpClient.post<{ success: boolean; message: string }>(`/mfa/disable?code=${encodeURIComponent(code)}`, {});
  },
};