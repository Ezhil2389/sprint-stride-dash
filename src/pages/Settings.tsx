import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Check, Loader2, Monitor, Moon, Sun } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi, mfaApi } from "@/services/api";
import { User, UserRequest } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name too long"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name too long"),
  email: z.string().email("Invalid email address"),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  title: z.string().optional(),
  department: z.string().optional(),
});

const notificationFormSchema = z.object({
  emailNotifications: z.boolean(),
  projectUpdates: z.boolean(),
  taskReminders: z.boolean(),
});

const appearanceFormSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
});

const passwordFormSchema = z.object({
  oldPassword: z.string().min(6, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "Passwords do not match",
  path: ["confirmNewPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type NotificationFormValues = z.infer<typeof notificationFormSchema>;
type AppearanceFormValues = z.infer<typeof appearanceFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

const Settings = () => {
  const queryClient = useQueryClient();
  const { data: currentUser, isLoading: isLoadingUser } = useQuery<User>({
    queryKey: ["currentUser"],
    queryFn: usersApi.getCurrentUser,
  });

  // Use mfaEnabled if present, otherwise fallback to false
  const [mfaStatus, setMfaStatus] = useState<boolean>(false);
  const [mfaSetup, setMfaSetup] = useState<null | { secret: string; qrCode: string }>(null);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [showDisableMfa, setShowDisableMfa] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("light");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    
    if (storedTheme) {
      setTheme(storedTheme);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setTheme("system");
    }
  }, []);

  useEffect(() => {
    setMfaStatus(!!(currentUser && (currentUser as any).mfaEnabled));
  }, [currentUser]);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      bio: "",
      title: "",
      department: "",
    },
  });

  useEffect(() => {
    if (currentUser) {
      profileForm.reset({
        firstName: currentUser.firstName || "",
        lastName: currentUser.lastName || "",
        email: currentUser.email || "",
        bio: profileForm.getValues("bio") || "",
        title: profileForm.getValues("title") || "",
        department: profileForm.getValues("department") || "",
      });
    }
  }, [currentUser, profileForm.reset]);

  const notificationForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      emailNotifications: true,
      projectUpdates: true,
      taskReminders: true,
    },
  });

  // Appearance form
  const appearanceForm = useForm<AppearanceFormValues>({
    resolver: zodResolver(appearanceFormSchema),
    defaultValues: {
      theme: theme,
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  // MFA Setup form
  const mfaCodeForm = useForm<{ code: string }>({
    defaultValues: { code: "" },
  });

  // MFA Disable form
  const mfaDisableForm = useForm<{ code: string }>({
    defaultValues: { code: "" },
  });

  // --- Mutation for updating profile ---
  const updateProfileMutation = useMutation({
    mutationFn: (updateData: UserRequest) => {
      if (!currentUser?.id) throw new Error("User ID not found");
      // Pass the user's ID and the update payload
      return usersApi.update(currentUser.id, updateData);
    },
    onSuccess: (updatedUser) => {
      toast.success("Profile updated successfully");
      // Invalidate current user query to refetch data
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      // Optionally update the form again, though invalidateQueries should handle it
      // profileForm.reset(updatedUser); // Assuming API returns the updated user DTO
    },
    onError: (error) => {
      console.error("Profile update failed:", error);
      // Ensure error is an instance of Error to access message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Profile update failed: ${errorMessage}`);
    },
    onSettled: () => {
      // Use onSettled to stop loading indicator regardless of success/error
      // If using a separate isSaving state, set it here:
      // setIsSaving(false); // Not strictly needed if using mutation.isPending
    }
  });

  // --- Form Submit Handlers ---

  const onProfileSubmit = async (data: ProfileFormValues) => {
    // Remove the old mocked logic:
    // setIsSaving(true);
    // await new Promise((resolve) => setTimeout(resolve, 1000));
    // toast.success("Profile updated successfully");
    // setIsSaving(false);

    // Implement the actual API call using the mutation:
    if (!currentUser) {
        toast.error("User data not loaded yet.");
        return;
    }

    // Construct the payload for the API (UserRequest)
    // Ensure all required fields for UserRequest are included based on backend definition
    const updatePayload: UserRequest = {
      // Include username from currentUser as it seems required by UserRequest DTO
      // and cannot be changed in the form
      username: currentUser.username,
      email: data.email, // Include email even if read-only in form, backend might expect it
      firstName: data.firstName,
      lastName: data.lastName,
      // Password is not included unless changing it (add logic if password change is needed)
      // Role is typically not updated here (add if needed, backend UserRequest has it)
      // Bio, Title, Department are not supported by backend UserRequest DTO
    };

    // Trigger the mutation
    updateProfileMutation.mutate(updatePayload);
  };

  const onNotificationSubmit = async (data: NotificationFormValues) => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast.success("Notification preferences updated");
    setIsSaving(false);
  };

  const onAppearanceSubmit = async (data: AppearanceFormValues) => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    const newTheme = data.theme;
    setTheme(newTheme);
    
    // Update document theme
    if (newTheme === "system") {
      const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      document.documentElement.classList.toggle("dark", systemPrefersDark);
      localStorage.removeItem("theme");
    } else {
      document.documentElement.classList.toggle("dark", newTheme === "dark");
      localStorage.setItem("theme", newTheme);
    }
    
    toast.success("Appearance settings updated");
    setIsSaving(false);
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    setIsChangingPassword(true);
    try {
      await usersApi.changeOwnPassword(data.oldPassword, data.newPassword);
      toast.success("Password changed successfully");
      passwordForm.reset();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || "Failed to change password";
      toast.error(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const startMfaSetup = async () => {
    setMfaLoading(true);
    setMfaError(null);
    try {
      const data = await mfaApi.setup();
      setMfaSetup(data);
    } catch (e: any) {
      setMfaError(e?.message || "Failed to start MFA setup");
    } finally {
      setMfaLoading(false);
    }
  };

  const onVerifyMfaSetup = async (values: { code: string }) => {
    setMfaLoading(true);
    setMfaError(null);
    try {
      await mfaApi.verifySetup(values.code);
      toast.success("MFA enabled successfully");
      setMfaStatus(true);
      setMfaSetup(null);
      mfaCodeForm.reset();
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    } catch (e: any) {
      setMfaError(e?.message || "Invalid code");
    } finally {
      setMfaLoading(false);
    }
  };

  const onDisableMfa = async (values: { code: string }) => {
    setMfaLoading(true);
    setMfaError(null);
    try {
      await mfaApi.disable(values.code);
      toast.success("MFA disabled successfully");
      setMfaStatus(false);
      setShowDisableMfa(false);
      mfaDisableForm.reset();
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    } catch (e: any) {
      setMfaError(e?.message || "Invalid code");
    } finally {
      setMfaLoading(false);
    }
  };

  // Create initials from name
  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const userFullName = currentUser ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() : 'Loading...';

  // Replace InputOTP usage with correct children structure
  // Helper for rendering OTP input
  function OtpInputField({ field }: { field: any }) {
    return (
      <InputOTP value={field.value} onChange={field.onChange} maxLength={6}>
        {[0, 1, 2, 3, 4, 5].map((idx) => (
          <InputOTPSlot key={idx} index={idx} />
        ))}
      </InputOTP>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Manage your public profile information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={undefined} />
                    <AvatarFallback>{getInitials(userFullName)}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h3 className="font-medium">{userFullName}</h3>
                    <p className="text-sm text-muted-foreground">{currentUser?.email}</p>
                  </div>
                </div>
                <Separator />
                <Form {...profileForm}>
                  <form
                    onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your first name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your last name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="Your email"
                                {...field}
                                readOnly
                                className="bg-muted"
                              />
                            </FormControl>
                            <FormDescription>
                              Email cannot be changed
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={profileForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us about yourself"
                              {...field}
                              rows={4}
                            />
                          </FormControl>
                          <FormDescription>
                            Brief description visible to other users
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end">
                      <Button type="submit" disabled={updateProfileMutation.isPending || isLoadingUser}>
                        {updateProfileMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
                {/* Change Password Section */}
                <Separator className="my-8" />
                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Update your account password</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4 max-w-md">
                        <FormField
                          control={passwordForm.control}
                          name="oldPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Enter current password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Enter new password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={passwordForm.control}
                          name="confirmNewPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm New Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Re-enter new password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end">
                          <Button type="submit" disabled={isChangingPassword}>
                            {isChangingPassword ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Changing...
                              </>
                            ) : (
                              <>
                                <Check className="mr-2 h-4 w-4" />
                                Change Password
                              </>
                            )}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
                {/* MFA Section */}
                <Separator className="my-8" />
                <Card>
                  <CardHeader>
                    <CardTitle>Multi-Factor Authentication (MFA)</CardTitle>
                    <CardDescription>
                      Add an extra layer of security to your account using Google Authenticator or similar apps.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {mfaStatus ? (
                      <>
                        <p className="mb-4 text-green-600 font-medium">MFA is enabled for your account.</p>
                        {showDisableMfa ? (
                          <Form {...mfaDisableForm}>
                            <form onSubmit={mfaDisableForm.handleSubmit(onDisableMfa)} className="space-y-4 max-w-xs">
                              <FormField
                                control={mfaDisableForm.control}
                                name="code"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Enter 6-digit code from your Authenticator app to disable MFA</FormLabel>
                                    <FormControl>
                                      <OtpInputField field={field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <div className="flex gap-2">
                                <Button type="submit" disabled={mfaLoading} variant="destructive">
                                  {mfaLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                  Disable MFA
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setShowDisableMfa(false)} disabled={mfaLoading}>Cancel</Button>
                              </div>
                              {mfaError && <p className="text-red-600 text-sm mt-2">{mfaError}</p>}
                            </form>
                          </Form>
                        ) : (
                          <Button variant="destructive" onClick={() => setShowDisableMfa(true)} disabled={mfaLoading}>
                            Disable MFA
                          </Button>
                        )}
                      </>
                    ) : mfaSetup ? (
                      <>
                        <div className="mb-4">
                          <p>Scan this QR code with your authenticator app:</p>
                          <img src={mfaSetup.qrCode} alt="MFA QR Code" className="my-4 mx-auto border rounded p-2 bg-white" style={{ width: 180, height: 180 }} />
                          <p className="text-xs text-muted-foreground">Or enter this secret manually: <span className="font-mono bg-muted px-2 py-1 rounded">{mfaSetup.secret}</span></p>
                        </div>
                        <Form {...mfaCodeForm}>
                          <form onSubmit={mfaCodeForm.handleSubmit(onVerifyMfaSetup)} className="space-y-4 max-w-xs">
                            <FormField
                              control={mfaCodeForm.control}
                              name="code"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Enter 6-digit code from your Authenticator app</FormLabel>
                                  <FormControl>
                                    <OtpInputField field={field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className="flex gap-2">
                              <Button type="submit" disabled={mfaLoading}>
                                {mfaLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                Verify & Enable MFA
                              </Button>
                              <Button type="button" variant="outline" onClick={() => setMfaSetup(null)} disabled={mfaLoading}>Cancel</Button>
                            </div>
                            {mfaError && <p className="text-red-600 text-sm mt-2">{mfaError}</p>}
                          </form>
                        </Form>
                      </>
                    ) : (
                      <Button onClick={startMfaSetup} disabled={mfaLoading}>
                        {mfaLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                        Enable MFA
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how you want to be notified
              </CardDescription>
            </CardHeader>
            <Form {...notificationForm}>
              <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)}>
                <CardContent className="space-y-4">
                  <FormField
                    control={notificationForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Email Notifications
                          </FormLabel>
                          <FormDescription>
                            Receive emails about your account activity
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={notificationForm.control}
                    name="projectUpdates"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Project Updates
                          </FormLabel>
                          <FormDescription>
                            Get notified about changes to your projects
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={notificationForm.control}
                    name="taskReminders"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Task Reminders
                          </FormLabel>
                          <FormDescription>
                            Receive reminders about upcoming deadlines
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="ml-auto" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <Form {...appearanceForm}>
              <form onSubmit={appearanceForm.handleSubmit(onAppearanceSubmit)}>
                <CardContent className="space-y-4">
                  <FormField
                    control={appearanceForm.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Theme</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Select a theme" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="light">
                              <div className="flex items-center gap-2">
                                <Sun className="h-4 w-4" />
                                <span>Light</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="dark">
                              <div className="flex items-center gap-2">
                                <Moon className="h-4 w-4" />
                                <span>Dark</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="system">
                              <div className="flex items-center gap-2">
                                <Monitor className="h-4 w-4" />
                                <span>System</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select your preferred theme or use system settings
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="ml-auto" disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
