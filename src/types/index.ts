
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
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  title?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  assignedTo: User | null;
  priority: PriorityLevel;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser extends User {
  token: string;
}
