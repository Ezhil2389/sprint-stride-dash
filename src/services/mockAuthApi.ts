import { ApiResponse, AuthUser, LoginRequest, User, UserRole } from "@/types";

// This file provides mock implementations for testing when the backend is not available
// It simulates the Spring backend responses

// Mock user data
const MOCK_USERS = [
  {
    id: 1,
    username: "john.doe",
    email: "john.doe@example.com",
    firstName: "John",
    lastName: "Doe",
    role: UserRole.MANAGER,
    enabled: true,
  },
  {
    id: 2,
    username: "jane.smith",
    email: "jane.smith@example.com",
    firstName: "Jane",
    lastName: "Smith",
    role: UserRole.EMPLOYEE,
    enabled: true,
  }
];

// Helper to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock auth API
export const mockAuthApi = {
  login: async (credentials: LoginRequest): Promise<ApiResponse<AuthUser>> => {
    await delay(500);
    
    const user = MOCK_USERS.find(u => 
      u.username.toLowerCase() === credentials.username.toLowerCase()
    );
    
    if (!user || credentials.password !== "yourpassword") {
      // Simulate 401 response
      const error = new Error("Invalid username or password") as Error & { status?: number };
      error.status = 401;
      throw error;
    }
    
    // Success response
    return {
      success: true,
      message: "Success",
      data: {
        token: "mock-jwt-token-" + user.id,
        type: "Bearer",
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    };
  },
  
  logout: async (): Promise<ApiResponse<null>> => {
    await delay(300);
    return {
      success: true,
      message: "Logged out successfully",
      data: null
    };
  },
  
  getCurrentUser: async (): Promise<ApiResponse<User>> => {
    await delay(400);
    
    // Check for token
    const token = localStorage.getItem("token");
    if (!token) {
      const error = new Error("Not authenticated") as Error & { status?: number };
      error.status = 401;
      throw error;
    }
    
    // Extract user ID from token (in real app this would be decoded from JWT)
    const userId = parseInt(token.split('-').pop() || "1");
    const user = MOCK_USERS.find(u => u.id === userId);
    
    if (!user) {
      const error = new Error("User not found") as Error & { status?: number };
      error.status = 404;
      throw error;
    }
    
    return {
      success: true,
      message: "Success",
      data: user
    };
  }
}; 