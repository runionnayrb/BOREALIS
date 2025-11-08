import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import type { UserGroup } from "@shared/schema";
import logoPath from "@assets/LaPerle-logo-basic_1760100706441.png";

const loginSchema = insertUserSchema.pick({ email: true, password: true });
const registerSchema = insertUserSchema.pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  artistName: true,
  userGroupId: true,
}).extend({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  artistName: z.string().min(1, "Artist name is required"),
  userGroupId: z.string().min(1, "Department is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;
type RegisterFormData = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  // Get returnTo parameter from URL
  const urlParams = new URLSearchParams(window.location.search);
  const returnTo = urlParams.get('returnTo') || '/';

  useEffect(() => {
    const originalBg = document.body.style.backgroundColor;
    const hadDarkClass = document.documentElement.classList.contains('dark');
    
    document.body.style.backgroundColor = '#ffffff';
    document.documentElement.classList.remove('dark');
    
    return () => {
      document.body.style.backgroundColor = originalBg;
      if (hadDarkClass) {
        document.documentElement.classList.add('dark');
      }
    };
  }, []);

  useEffect(() => {
    if (user) {
      setLocation(returnTo);
    }
  }, [user, setLocation, returnTo]);

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      artistName: "",
      userGroupId: "",
    },
  });

  // Fetch user groups for department dropdown
  const { data: userGroups = [] } = useQuery<UserGroup[]>({
    queryKey: ["/api/user-groups"],
  });

  if (user) {
    return null;
  }

  const onLogin = async (data: LoginFormData) => {
    await loginMutation.mutateAsync(data);
  };

  const onRegister = async (data: RegisterFormData) => {
    await registerMutation.mutateAsync(data);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-8 bg-[#ffffff] text-black">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-6">
            <img src={logoPath} alt="Borealis" className="h-36 w-auto" />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-black">Borealis</h1>
        </div>

        <Card className="p-6 bg-white border-gray-200 text-black">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 text-gray-700">
                <TabsTrigger value="login" data-testid="tab-login" className="data-[state=active]:bg-white data-[state=active]:text-black">Login</TabsTrigger>
                <TabsTrigger value="register" data-testid="tab-register" className="data-[state=active]:bg-white data-[state=active]:text-black">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} data-testid="input-login-email" className="bg-blue-50 border-gray-300 text-black" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} data-testid="input-login-password" className="bg-blue-50 border-gray-300 text-black" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={loginMutation.isPending}
                      data-testid="button-login-submit"
                    >
                      {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="register">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} data-testid="input-register-email" className="bg-blue-50 border-gray-300 text-black" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="artistName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Artist Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-register-artist-name" className="bg-blue-50 border-gray-300 text-black" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">First Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-register-first-name" className="bg-blue-50 border-gray-300 text-black" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-register-last-name" className="bg-blue-50 border-gray-300 text-black" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="userGroupId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Department</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-register-department" className="bg-blue-50 border-gray-300 text-black">
                                <SelectValue placeholder="Select department" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-white border-gray-300">
                              {userGroups.map((group) => (
                                <SelectItem key={group.id} value={group.id} data-testid={`option-department-${group.id}`} className="text-black">
                                  {group.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-black">Password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} data-testid="input-register-password" className="bg-blue-50 border-gray-300 text-black" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={registerMutation.isPending}
                      data-testid="button-register-submit"
                    >
                      {registerMutation.isPending ? "Registering..." : "Register"}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
    </div>
  );
}
