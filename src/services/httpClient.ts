import { ApiResponse } from "@/types";

// Direct backend URL with explicit HTTP protocol to avoid TLS/SSL issues
const API_BASE_URL = "http://localhost:8080/api";

// Helper to get token from localStorage
const getToken = (): string | null => {
  return localStorage.getItem("token");
};

// Helper for building headers with auth token
const buildHeaders = (contentType = "application/json"): Record<string, string> => {
  const headers: Record<string, string> = {
    "Content-Type": contentType,
    // Add explicit headers to avoid CORS issues
    "Accept": "application/json",
  };

  const token = getToken();
  if (token) {
    const tokenType = localStorage.getItem("tokenType") || "Bearer";
    headers["Authorization"] = `${tokenType} ${token}`;
  }

  return headers;
};

// Generic API request function
export const request = async <T>(
  endpoint: string,
  method: string = "GET",
  data?: any,
  customHeaders?: Record<string, string>
): Promise<T> => {
  // Make sure endpoint starts with /
  const formattedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${formattedEndpoint}`;
  
  const headers = {
    ...buildHeaders(),
    ...customHeaders,
  };

  // First try with regular CORS mode
  try {
  const config: RequestInit = {
    method,
    headers,
      mode: 'cors',
      credentials: 'same-origin',
  };

  if (data && method !== "GET") {
    config.body = JSON.stringify(data);
  }

    console.log(`[HTTP] ${method} ${url} - trying CORS mode`, 
                method !== "GET" && data ? { data } : "");
  
    const response = await fetch(url, config);
    console.log(`[HTTP] Response status: ${response.status} for ${url}`);
    
    // Special handling for 204 No Content responses
    if (response.status === 204) {
      return null as T;
    }
    
    // For responses with no content
    const contentLength = response.headers.get("Content-Length");
    if (contentLength === "0") {
      console.log(`[HTTP] No content in response`);
      return null as T;
    }
    
    // Try to get the response as text first
    const responseText = await response.text();
    
    if (!responseText || responseText.trim() === "") {
      console.log(`[HTTP] Empty response body`);
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      return null as T;
    }
    
    // Try to parse the response as JSON
    try {
      const responseData = JSON.parse(responseText);
      console.log(`[HTTP] Parsed response:`, responseData);
      
      // Handle API-specific error messages in responses
      if (!response.ok) {
        const errorMessage = responseData.message || `Request failed with status ${response.status}`;
        throw new Error(errorMessage);
      }
      
      // First check if this follows the ApiResponse structure from the backend
      if (responseData.success !== undefined && responseData.data !== undefined) {
        return responseData.data;
      }
      
      // Some endpoints might return the data directly without the wrapped structure
      return responseData as T;
      
    } catch (parseError) {
      console.error(`[HTTP] Failed to parse response as JSON:`, responseText);
      
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      
      // If the response is OK but not JSON, return it as-is (for non-JSON responses)
      return responseText as unknown as T;
    }
  } catch (corsError) {
    console.warn(`[HTTP] CORS request failed for ${endpoint}:`, corsError);
    // If we're hitting CORS issues, let the calling code handle it
    // (specifically the AuthContext will handle this for login)
    throw corsError;
  }
};

// Shorthand methods
export const httpClient = {
  get: <T>(endpoint: string, customHeaders?: Record<string, string>): Promise<T> => 
    request<T>(endpoint, "GET", undefined, customHeaders),
    
  post: <T>(endpoint: string, data: any, customHeaders?: Record<string, string>): Promise<T> =>
    request<T>(endpoint, "POST", data, customHeaders),
    
  put: <T>(endpoint: string, data: any, customHeaders?: Record<string, string>): Promise<T> =>
    request<T>(endpoint, "PUT", data, customHeaders),
    
  patch: <T>(endpoint: string, data: any, customHeaders?: Record<string, string>): Promise<T> =>
    request<T>(endpoint, "PATCH", data, customHeaders),
    
  delete: <T>(endpoint: string, customHeaders?: Record<string, string>): Promise<T> =>
    request<T>(endpoint, "DELETE", undefined, customHeaders),
}; 