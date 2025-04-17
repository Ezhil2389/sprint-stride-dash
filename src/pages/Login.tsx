import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/context/AuthContext";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { InputOTP, InputOTPSlot } from "@/components/ui/input-otp";

// Validation schema matching backend requirements
const loginSchema = z.object({
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username cannot exceed 50 characters"),
  password: z.string()
    .min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const Login = () => {
  const { login, verifyMfaLogin } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [mfaStep, setMfaStep] = useState<null | { username: string; password: string }>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaError, setMfaError] = useState<string | null>(null);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoginError(null);
    setIsSubmitting(true);
    setMfaStep(null);
    setMfaError(null);
    try {
      const result = await login(data.username, data.password);
      if (result.mfaRequired) {
        setMfaStep({ username: data.username, password: data.password });
      } else if (result.success) {
        navigate(result.isManager ? "/dashboard" : "/tasks");
      } else {
        setLoginError("Invalid username or password");
      }
    } catch (error) {
      setLoginError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaLoading(true);
    setMfaError(null);
    if (!mfaStep) return;
    try {
      const result = await verifyMfaLogin(mfaStep.username, mfaStep.password, mfaCode);
      if (result.success) {
        navigate(result.isManager ? "/dashboard" : "/tasks");
      } else {
        setMfaError("Invalid code");
      }
    } catch (err: any) {
      setMfaError(err?.message || "Invalid code");
    } finally {
      setMfaLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Visual Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary/80 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
        <div className="text-center text-primary-foreground p-8 z-10">
          <div className="flex justify-center mb-6">
            <div className="h-24 w-24 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <span className="text-5xl font-bold">S</span>
            </div>
          </div>
          <h1 className="text-5xl font-extrabold mb-4">SprintStride</h1>
          <p className="text-xl max-w-md mx-auto">
            Streamline your project management with intelligent workflow tracking and collaboration tools.
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-background p-4 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          <div className="absolute top-4 right-4 z-10">
            <ThemeToggle />
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h2>
            <p className="text-muted-foreground">Sign in to access your workspace</p>
          </div>
          
          <Card className="border-none shadow-xl rounded-3xl bg-background/70 backdrop-blur-lg">
            {!mfaStep ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
                  <CardContent className="space-y-6 pt-6">
                    {loginError && (
                      <Alert variant="destructive" className="animate-shake">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        <AlertDescription>{loginError}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-muted-foreground text-sm">Username</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your username"
                                {...field}
                                autoComplete="off"
                                disabled={isSubmitting}
                                className="
                                  bg-background/50 
                                  border-primary/20 
                                  focus:ring-2 
                                  focus:ring-primary 
                                  focus:border-primary 
                                  transition-all 
                                  duration-300 
                                  rounded-xl 
                                  py-3
                                  text-sm
                                "
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-destructive mt-1" />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-muted-foreground text-sm">Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Enter your password"
                                  {...field}
                                  autoComplete="off"
                                  disabled={isSubmitting}
                                  className="
                                    bg-background/50 
                                    border-primary/20 
                                    focus:ring-2 
                                    focus:ring-primary 
                                    focus:border-primary 
                                    transition-all 
                                    duration-300 
                                    rounded-xl 
                                    py-3 
                                    pr-10
                                    text-sm
                                  "
                                />
                                <button
                                  type="button"
                                  onClick={togglePasswordVisibility}
                                  className="
                                    absolute 
                                    right-3 
                                    top-1/2 
                                    -translate-y-1/2 
                                    text-muted-foreground 
                                    hover:text-primary 
                                    transition-colors 
                                    focus:outline-none
                                  "
                                  aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                  {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage className="text-xs text-destructive mt-1" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex flex-col gap-2 pb-6">
                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting ? "Signing in..." : "Sign In"}
                    </Button>
                  </CardFooter>
                </form>
              </Form>
            ) : (
              <form onSubmit={onMfaSubmit} className="space-y-6 p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Multi-Factor Authentication</h3>
                  <p className="text-muted-foreground mb-4">Enter the 6-digit code from your authenticator app</p>
                </div>
                <div className="flex justify-center">
                  <InputOTP value={mfaCode} onChange={setMfaCode} maxLength={6}>
                    {[0, 1, 2, 3, 4, 5].map((idx) => (
                      <InputOTPSlot key={idx} index={idx} />
                    ))}
                  </InputOTP>
                </div>
                {mfaError && <p className="text-red-600 text-center text-sm">{mfaError}</p>}
                <Button type="submit" className="w-full" disabled={mfaLoading || mfaCode.length !== 6}>
                  {mfaLoading ? "Verifying..." : "Verify & Sign In"}
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => { setMfaStep(null); setMfaCode(""); }} disabled={mfaLoading}>
                  Cancel
                </Button>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
