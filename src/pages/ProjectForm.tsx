import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { projectsApi, usersApi } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { ProjectRequest, User, PriorityLevel, UserRole, Project } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

// Validation Schema based on ProjectRequest DTO
const projectSchema = z.object({
  name: z.string().min(3, "Project name must be at least 3 characters").max(100),
  description: z.string().optional(),
  startDate: z.date({ required_error: "Start date is required." }),
  endDate: z.date({ required_error: "End date is required." }),
  assignedToId: z.coerce.number().optional(), // Optional assignment
  priority: z.nativeEnum(PriorityLevel, { required_error: "Priority is required." }),
}).refine((data) => data.endDate >= data.startDate, {
  message: "End date cannot be before start date.",
  path: ["endDate"], // Point error to end date field
});

type ProjectFormValues = z.infer<typeof projectSchema>;

const ProjectForm = () => {
  const { id: projectId } = useParams<{ id?: string }>(); // id will be present for editing
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isManager, currentUser } = useAuth();
  const isEditMode = !!projectId;

  // Fetch existing project data if in edit mode
  const { data: existingProject, isLoading: isLoadingProject } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.getById(parseInt(projectId!)),
    enabled: isEditMode,
  });

  // Fetch users for assignment dropdown (only for managers)
  const { data: usersResponse, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["usersForAssignment"],
    queryFn: () => usersApi.getAll(0, 1000), // Fetch up to 1000 users
    enabled: isManager,
  });
  // Extract users directly from the response content, as httpClient handles the outer ApiResponse
  const assignableUsers: User[] = usersResponse?.content || [];

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      startDate: undefined,
      endDate: undefined,
      assignedToId: undefined,
      priority: PriorityLevel.MEDIUM, // Default priority
    },
  });

  // Populate form if in edit mode
  useEffect(() => {
    if (isEditMode && existingProject) {
      form.reset({
        name: existingProject.name,
        description: existingProject.description,
        startDate: new Date(existingProject.startDate),
        endDate: new Date(existingProject.endDate),
        assignedToId: existingProject.assignedToId ?? undefined,
        priority: existingProject.priority,
      });
    }
  }, [isEditMode, existingProject, form]);

  const createProjectMutation = useMutation({
    mutationFn: projectsApi.create,
    onSuccess: (response) => { 
      toast.success(`Project created successfully!`);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate("/projects");
    },
    onError: (error) => {
      toast.error(`Failed to create project: ${error.message}`);
      console.error("Create project error:", error);
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: (data: ProjectRequest) => projectsApi.update(parseInt(projectId!), data),
    onSuccess: (response) => { 
      toast.success(`Project updated successfully!`);
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      navigate("/projects");
    },
    onError: (error) => {
      toast.error(`Failed to update project: ${error.message}`);
      console.error("Update project error:", error);
    },
  });

  const onSubmit = (values: ProjectFormValues) => {
    // Adapt form values to match the ProjectRequest interface
    const projectData: ProjectRequest = {
      name: values.name,
      description: values.description || "",
      startDate: format(values.startDate, "yyyy-MM-dd"),
      endDate: format(values.endDate, "yyyy-MM-dd"),
      assignedToId: values.assignedToId,
      priority: values.priority,
    };

    console.log("Submitting project data:", projectData);

    if (isEditMode) {
      updateProjectMutation.mutate(projectData);
    } else {
      createProjectMutation.mutate(projectData);
    }
  };

  const isLoading = createProjectMutation.isPending || updateProjectMutation.isPending || isLoadingUsers || isLoadingProject;

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <Button
        variant="ghost"
        onClick={() => navigate("/projects")}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Projects
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? "Edit Project" : "Create New Project"}</CardTitle>
          <CardDescription>
            {isEditMode
              ? "Update the details of the project."
              : "Fill in the details below to create a new project."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter project name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter project description (optional)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              isEditMode ? false : date < new Date(new Date().setHours(0, 0, 0, 0)) // Allow past dates in edit mode? Maybe not.
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < (form.getValues("startDate") || new Date(new Date().setHours(0, 0, 0, 0)))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {Object.values(PriorityLevel).map((level) => (
                            <SelectItem key={level} value={level}>
                                {level.charAt(0) + level.slice(1).toLowerCase()}
                            </SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                 />

                {isManager && (
                   <FormField
                    control={form.control}
                    name="assignedToId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign To (Optional)</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                          value={field.value ? field.value.toString() : undefined}
                          disabled={isLoadingUsers}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={isLoadingUsers ? "Loading users..." : "-- Unassigned --"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {assignableUsers.map((user) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.firstName} {user.lastName} ({user.username})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Selecting unassigned clears the assignment.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
               </div>

              <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading ? (
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                 ) : null}
                {isEditMode ? "Save Changes" : "Create Project"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectForm; 