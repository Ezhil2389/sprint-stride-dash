import { useEffect } from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/services/api";
import { User, UserRequest, UserRole } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger, DialogClose
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem,
  FormLabel, FormMessage
} from "@/components/ui/form";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Pencil } from "lucide-react";

// Validation Schema based on UserRequest DTO
const userSchema = z.object({
  username: z.string().min(3, "Username must be 3-50 characters").max(50),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  email: z.string().email("Invalid email format"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.nativeEnum(UserRole).default(UserRole.EMPLOYEE), // Default to Employee
});

type UserFormValues = z.infer<typeof userSchema>;

interface UserFormDialogProps {
  user?: User; // If provided, we're editing; if not, we're creating
  triggerButton?: React.ReactNode; // Optional custom trigger
  mode?: 'create' | 'edit';
}

export const UserFormDialog: React.FC<UserFormDialogProps> = ({ 
  user, 
  triggerButton,
  mode = 'create'
}) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const isEditMode = mode === 'edit';

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: user?.username || "",
      password: isEditMode ? undefined : "", // Password is optional for editing
      email: user?.email || "",
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      role: user?.role || UserRole.EMPLOYEE,
    },
  });

  // Update form values when user prop changes
  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username,
        email: user.email,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        role: user.role,
        password: undefined, // Don't prefill password
      });
    }
  }, [user, form]);

  const createUserMutation = useMutation({
    mutationFn: usersApi.create,
    onSuccess: (data) => {
      toast.success(`User "${data.username}" created successfully!`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setOpen(false); // Close dialog on success
      form.reset(); // Reset form fields
    },
    onError: (error) => {
      toast.error(`Failed to create user: ${error.message}`);
      console.error("Create user error:", error);
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserRequest }) => 
      usersApi.update(id, data),
    onSuccess: (data) => {
      toast.success(`User "${data.username}" updated successfully!`);
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setOpen(false); // Close dialog on success
      form.reset(); // Reset form fields
    },
    onError: (error) => {
      toast.error(`Failed to update user: ${error.message}`);
      console.error("Update user error:", error);
    },
  });

  const onSubmit = (values: UserFormValues) => {
    // Prepare user data, excluding password if it's empty in edit mode
    const userData: UserRequest = {
      username: values.username,
      email: values.email,
      firstName: values.firstName || undefined,
      lastName: values.lastName || undefined,
      role: values.role || UserRole.EMPLOYEE,
    };
    
    // Only include password if provided (required for creation, optional for update)
    if (values.password) {
      userData.password = values.password;
    } else if (!isEditMode) {
      // Force error if password missing for creation
      form.setError("password", { 
        type: "manual", 
        message: "Password is required for new users" 
      });
      return;
    }

    if (isEditMode && user?.id) {
      updateUserMutation.mutate({ id: user.id, data: userData });
    } else {
      createUserMutation.mutate(userData);
    }
  };

  const isLoading = createUserMutation.isPending || updateUserMutation.isPending;
  const dialogTitle = isEditMode ? "Edit User" : "Create New User";
  const buttonText = isEditMode ? "Update User" : "Create User";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button>
            {isEditMode ? (
              <Pencil className="h-4 w-4 mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            {isEditMode ? "Edit User" : "New User"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? "Update the user's information." 
              : "Fill in the details to add a new user to the system."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="john.doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john.doe@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isEditMode ? "Password (leave blank to keep current)" : "Password"}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder={isEditMode ? "••••••" : "Enter password"} 
                      {...field} 
                      value={field.value || ""} // Handle undefined value
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                 <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                            <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                            <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
             <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value={UserRole.EMPLOYEE}>Employee</SelectItem>
                            <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
            />

            <DialogFooter>
                <DialogClose asChild>
                     <Button type="button" variant="outline" disabled={isLoading}>
                        Cancel
                     </Button>
                </DialogClose>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {buttonText}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}; 