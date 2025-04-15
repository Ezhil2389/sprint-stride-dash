
import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthUser, User, UserRole } from "@/types";
import { toast } from "sonner";

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data
const MOCK_USERS = [
  {
    id: "1",
    name: "Alex Johnson",
    email: "manager@example.com",
    role: UserRole.MANAGER,
    avatar: "https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80",
    department: "Engineering",
    title: "Engineering Manager",
    token: "mock-token-manager"
  },
  {
    id: "2",
    name: "Sam Davis",
    email: "employee@example.com",
    role: UserRole.EMPLOYEE,
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&q=80",
    department: "Development",
    title: "Senior Developer",
    token: "mock-token-employee"
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check for stored auth on initial load
  useEffect(() => {
    const storedUser = localStorage.getItem("sprintstride_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("sprintstride_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate network request
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        const foundUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (foundUser && password === "password") { // Simple mock password check
          setUser(foundUser);
          localStorage.setItem("sprintstride_user", JSON.stringify(foundUser));
          toast.success(`Welcome back, ${foundUser.name}!`);
          resolve(true);
        } else {
          toast.error("Invalid email or password");
          resolve(false);
        }
        
        setIsLoading(false);
      }, 1000); // Simulate API delay
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("sprintstride_user");
    toast.info("You have been logged out");
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
    isAuthenticated: !!user,
    isManager: user?.role === UserRole.MANAGER
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
