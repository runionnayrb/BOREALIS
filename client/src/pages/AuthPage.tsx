import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
import logoPath from "@assets/LaPerle-logo-basic_1760100706441.png";

const loginSchema = insertUserSchema.pick({ email: true, password: true });

type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  const { user, loginMutation } = useAuth();
  const [, setLocation] = useLocation();

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

  if (user) {
    return null;
  }

  const onLogin = async (data: LoginFormData) => {
    await loginMutation.mutateAsync(data);
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
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-black">Login</h2>
          </div>
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
        </Card>
      </div>
    </div>
  );
}
