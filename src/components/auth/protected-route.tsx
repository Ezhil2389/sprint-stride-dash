import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { MainLayout } from "@/components/layout/main-layout";
import { UserRole } from "@/types";
import { toast } from "sonner";

interface ProtectedRouteProps {
  requiresManager?: boolean;
}

export const ProtectedRoute = ({ requiresManager = false }: ProtectedRouteProps) => {
  const { isAuthenticated, currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiresManager && currentUser?.role !== UserRole.MANAGER) {
    toast.error("Access Denied: Manager privileges required.");
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};
