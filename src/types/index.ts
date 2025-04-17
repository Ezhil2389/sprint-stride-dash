export enum UserRole {
  MANAGER = "MANAGER",
  EMPLOYEE = "EMPLOYEE"
}

export enum PriorityLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT"
}

export enum ProjectStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED"
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  enabled: boolean;
  avatar?: string;
  department?: string;
  title?: string;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  assignedToId: number;
  assignedToName: string;
  priority: PriorityLevel;
  status: ProjectStatus;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
  token: string;
  type: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface UserRequest {
  username: string;
  password?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
}

export interface ProjectRequest {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  assignedToId?: number;
  priority: PriorityLevel;
}

export interface ProjectStatusRequest {
  status: ProjectStatus;
}

export interface JwtResponse {
  token: string;
  type: string;
  id: number;
  username: string;
  email: string;
  role: string;
}
