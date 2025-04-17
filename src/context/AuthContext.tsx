import React, { createContext, useContext, useEffect, useState } from "react";
import { AuthUser, User, UserRole, LoginRequest, JwtResponse, ApiResponse } from "@/types";
import { toast } from "sonner";
import { authApi } from "@/services/authApi";
import { usersApi } from "@/services/api"; // Import usersApi for /users/me
import { httpClient } from "@/services/httpClient"; // Import httpClient for direct login call

// Backend direct URL removed as we use httpClient now
// const API_DIRECT_URL = "http://localhost:8080/api";

// USE_MOCK_API is no longer needed for core auth
// const USE_MOCK_API = false;

interface AuthContextType {
  authInfo: JwtResponse | null; // Renamed from 'user' to be clearer
  currentUser: User | null;
  login: (username: string, password: string) => Promise<{success: boolean, isManager: boolean, mfaRequired?: boolean, username?: string, password?: string}>;
  verifyMfaLogin: (username: string, password: string, code: string) => Promise<{success: boolean, isManager: boolean}>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  isManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authInfo, setAuthInfo] = useState<JwtResponse | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check for stored auth token on initial load and validate it
  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem("token");
      const tokenType = localStorage.getItem("tokenType") || "Bearer";

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // Call /users/me to validate token and get user data
        console.log("Validating stored token...");
        const userProfile = await usersApi.getCurrentUser(); 
        
        // If successful, reconstruct auth state
        setCurrentUser(userProfile);
        setAuthInfo({
          token: token,
          type: tokenType,
          id: userProfile.id,
          username: userProfile.username,
          email: userProfile.email,
          role: userProfile.role.toString() // Assuming role comes as enum
        });
        console.log("Token validated successfully.");
      } catch (error) {
        console.error("Failed to validate stored token:", error);
        // Clear invalid token from storage
        localStorage.removeItem("token");
        localStorage.removeItem("tokenType");
        setAuthInfo(null);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    validateToken();
  }, []);

  // Login using the documented /api/auth/login endpoint
  const login = async (username: string, password: string): Promise<{success: boolean, isManager: boolean, mfaRequired?: boolean, username?: string, password?: string}> => {
    setIsLoading(true);
    let loginSuccess = false;
    let loggedInUserIsManager = false;
    try {
      const loginRequest: LoginRequest = { username, password };
      const receivedAuthData = await httpClient.post<JwtResponse>('/auth/login', loginRequest);
      if (!receivedAuthData || !receivedAuthData.token) {
        // MFA required: backend did not issue JWT
        return { success: false, isManager: false, mfaRequired: true, username, password };
      }
      const tokenType = receivedAuthData.type || "Bearer";
      localStorage.setItem("token", receivedAuthData.token);
      localStorage.setItem("tokenType", tokenType);
      setAuthInfo({ ...receivedAuthData, type: tokenType });
      // Fetch user profile
      try {
        const userProfile = await usersApi.getCurrentUser();
        if (userProfile?.id) {
          setCurrentUser(userProfile);
          loggedInUserIsManager = userProfile.role === UserRole.MANAGER;
          toast.success(`Welcome back, ${userProfile.firstName || userProfile.username}!`);
          loginSuccess = true;
        } else {
          toast.warning(`Logged in as ${username}, but couldn't fetch profile details.`);
          loginSuccess = true;
        }
      } catch (profileError) {
        toast.warning(`Logged in as ${username}, but couldn't fetch profile details.`);
        loginSuccess = true;
      }
    } catch (error: any) {
      // If backend indicates MFA required (e.g., 401 with special message), handle here
      if (error?.response?.status === 401 && error?.response?.data?.mfaRequired) {
        return { success: false, isManager: false, mfaRequired: true, username, password };
      }
      let errorMessage = "Failed to log in. Please try again later.";
      if (error instanceof Error) {
        if (error.message.includes("401") || error.message.includes("Unauthorized")) {
          errorMessage = "Invalid username or password.";
        } else if (error.message.includes("Failed to fetch")) {
          errorMessage = "Cannot connect to the server. Please ensure the backend is running.";
        } else {
          errorMessage = error.message.startsWith("Login failed:")
            ? error.message
            : `Login failed: ${error.message}`;
        }
      }
      toast.error(errorMessage);
      localStorage.removeItem("token");
      localStorage.removeItem("tokenType");
      setAuthInfo(null);
      setCurrentUser(null);
      loginSuccess = false;
    } finally {
      setIsLoading(false);
    }
    return { success: loginSuccess, isManager: loggedInUserIsManager };
  };

  // MFA login step
  const verifyMfaLogin = async (username: string, password: string, code: string): Promise<{success: boolean, isManager: boolean}> => {
    setIsLoading(true);
    let loginSuccess = false;
    let loggedInUserIsManager = false;
    try {
      const mfaResponse = await httpClient.post<JwtResponse>("/auth/mfa", { username, password, code });
      if (!mfaResponse || !mfaResponse.token) {
        throw new Error("MFA verification failed: No token received");
      }
      const tokenType = mfaResponse.type || "Bearer";
      localStorage.setItem("token", mfaResponse.token);
      localStorage.setItem("tokenType", tokenType);
      setAuthInfo({ ...mfaResponse, type: tokenType });
      // Fetch user profile
      try {
        const userProfile = await usersApi.getCurrentUser();
        if (userProfile?.id) {
          setCurrentUser(userProfile);
          loggedInUserIsManager = userProfile.role === UserRole.MANAGER;
          toast.success(`Welcome back, ${userProfile.firstName || userProfile.username}!`);
          loginSuccess = true;
        } else {
          toast.warning(`Logged in as ${username}, but couldn't fetch profile details.`);
          loginSuccess = true;
        }
      } catch (profileError) {
        toast.warning(`Logged in as ${username}, but couldn't fetch profile details.`);
        loginSuccess = true;
      }
    } catch (error: any) {
      let errorMessage = error?.response?.data?.message || error?.message || "MFA verification failed.";
      toast.error(errorMessage);
      localStorage.removeItem("token");
      localStorage.removeItem("tokenType");
      setAuthInfo(null);
      setCurrentUser(null);
      loginSuccess = false;
    } finally {
      setIsLoading(false);
    }
    return { success: loginSuccess, isManager: loggedInUserIsManager };
  };

  // Logout by calling the backend and clearing local state/storage
  const logout = async () => {
    setIsLoading(true);
    console.log("Attempting logout...");
    try {
      // Call the backend logout endpoint (optional, good practice)
      await authApi.logout();
      console.log("Backend logout successful.");
    } catch (error) {
      // Log error but proceed with client-side logout regardless
      console.error("Backend logout API call failed:", error);
    } finally {
      // Clear local storage and state
      setAuthInfo(null);
      setCurrentUser(null);
      localStorage.removeItem("token");
      localStorage.removeItem("tokenType");
      toast.info("You have been logged out");
      console.log("Client-side logout complete.");
      setIsLoading(false);
    }
  };

  const value = {
    authInfo,
    currentUser,
    login,
    verifyMfaLogin,
    logout,
    isLoading,
    isAuthenticated: !!authInfo?.token, // Base authentication on token presence
    isManager: currentUser?.role === UserRole.MANAGER // Check role from currentUser
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
