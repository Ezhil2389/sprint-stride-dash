import { User, ApiResponse } from "@/types";
import { httpClient } from "./httpClient";

export const authApi = {
  logout: async (): Promise<void> => {
    try {
      // The backend returns ApiResponse<Void>, but we don't need the response data
      await httpClient.post<ApiResponse<null>>("/auth/logout", {});
    } catch (error) {
      console.error("Logout API error:", error);
      // Don't throw error, allow client-side logout to proceed
    }
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      // Backend returns ApiResponse<UserDto>, httpClient handles extracting the data
      return await httpClient.get<User>("/users/me"); 
    } catch (error) {
      console.error("Get current user API error:", error);
      throw error; // Rethrow to be handled by the caller (AuthContext)
    }
  },
}; 