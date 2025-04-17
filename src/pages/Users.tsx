import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Edit,
  MailIcon,
  Plus,
  Search,
  Trash2,
  UserCircle,
  ShieldIcon,
  Loader2,
} from "lucide-react";
import { usersApi } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { User, UserRole } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pagination } from "@/components/ui/pagination";

const Users = () => {
  const { isManager, currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const usersPerPage = 10;
  const queryClient = useQueryClient();

  console.log("[Users.tsx] Checking auth state: isManager?", isManager);

  const { data: usersResponse, isLoading, isError, refetch } = useQuery({
    queryKey: ["users", currentPage, usersPerPage],
    queryFn: () => {
      console.log(`[Users.tsx] Fetching users: page=${currentPage}, size=${usersPerPage}`);
      return usersApi.getAll(currentPage, usersPerPage);
    },
    enabled: isManager, // Only fetch if the user is a manager
  });

  // Log the raw response and processing steps
  console.log("[Users.tsx] API Response:", usersResponse);
  console.log("[Users.tsx] isLoading:", isLoading);
  console.log("[Users.tsx] isError:", isError);

  // Extract users and pagination info directly from usersResponse
  // because httpClient already extracted the 'data' field from the raw ApiResponse
  const users: User[] = usersResponse?.content || [];
  const totalElements = usersResponse?.totalElements || 0;
  const totalPages = Math.ceil(totalElements / usersPerPage);

  console.log("[Users.tsx] Extracted Users:", users);
  console.log("[Users.tsx] Total Elements:", totalElements);

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => usersApi.delete(userId),
    onSuccess: () => {
      toast.success("User deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      // If we just deleted the last user on this page, go back a page
      if (users.length === 1 && currentPage > 0) {
        setCurrentPage(currentPage - 1);
      } else {
        refetch();
      }
    },
    onError: (error) => {
      toast.error(`Failed to delete user: ${error.message}`);
    },
  });

  // Filter users by search query
  const filteredUsers = searchQuery 
    ? users.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.firstName && user.firstName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (user.lastName && user.lastName.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : users;

  const handleDeleteUser = (userId: number) => {
    deleteUserMutation.mutate(userId);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return (first + last).toUpperCase() || "?";
  };

  if (!isManager) {
    return (
      <div className="text-center py-12">
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  // Log the final state before rendering
  console.log("[Users.tsx] Final Render Check - filteredUsers:", filteredUsers);
  console.log("[Users.tsx] Final Render Check - isLoading:", isLoading);
  console.log("[Users.tsx] Final Render Check - isError:", isError);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">
            Manage system users and their roles
          </p>
        </div>
        {isManager && (
          <UserFormDialog />
        )}
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Directory</CardTitle>
          <CardDescription>
            Displaying {filteredUsers.length} of {totalElements} users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="w-full py-12 flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : isError ? (
             <div className="w-full py-12 flex justify-center text-destructive">
               Failed to load users.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                              <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                              <span className="font-medium">{user.firstName || ""} {user.lastName || ""}</span>
                              <span className="text-xs text-muted-foreground">
                                {user.username}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                        <TableCell>
                        <div className="flex items-center gap-2">
                          <MailIcon className="h-4 w-4 text-muted-foreground" />
                          {user.email}
                        </div>
                      </TableCell>
                        <TableCell>
                        <Badge
                            variant={user.role === UserRole.MANAGER ? "default" : "secondary"}
                        >
                          {user.role === UserRole.MANAGER ? (
                            <div className="flex items-center gap-1">
                              <ShieldIcon className="h-3 w-3" />
                              <span>Manager</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <UserCircle className="h-3 w-3" />
                              <span>Employee</span>
                            </div>
                          )}
                        </Badge>
                      </TableCell>
                         <TableCell>
                            <Badge variant={user.enabled ? "outline" : "destructive"} className={user.enabled ? "text-green-600 border-green-600" : ""}>
                                {user.enabled ? "Enabled" : "Disabled"}
                            </Badge>
                      </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <UserFormDialog 
                              user={user}
                              mode="edit"
                              triggerButton={
                                <Button variant="ghost" size="icon" title="Edit User">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              }
                            />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Delete User"
                                  className="text-destructive hover:text-destructive/90"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the user "{user.username}"? 
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="bg-destructive hover:bg-destructive/90"
                                  >
                                    {deleteUserMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : null}
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                    </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No users found matching your criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
         {totalPages > 1 && (
            <div className="flex justify-center py-4">
              <Pagination
                totalPages={totalPages}
                currentPage={currentPage}
                onPageChange={handlePageChange}
              />
            </div>
         )}
      </Card>
    </div>
  );
};

export default Users;
