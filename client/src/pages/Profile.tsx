import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { User, Lock, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { SafeUser } from "@shared/schema";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  position: z.string().optional(),
  pronouns: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "integrations">("profile");

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      position: user?.position || "",
      pronouns: user?.pronouns || "",
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const res = await apiRequest("PATCH", "/api/profile", data);
      return await res.json();
    },
    onSuccess: (updatedUser: SafeUser) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordFormData) => {
      await apiRequest("POST", "/api/profile/change-password", {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: "Password changed",
        description: "Your password has been successfully updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Password change failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onUpdateProfile = async (data: ProfileFormData) => {
    await updateProfileMutation.mutateAsync(data);
  };

  const onChangePassword = async (data: PasswordFormData) => {
    await changePasswordMutation.mutateAsync(data);
  };

  const toggleOutlookConnectionMutation = useMutation({
    mutationFn: async (connect: boolean) => {
      const res = await apiRequest("POST", "/api/profile/outlook-connection", { connect });
      return res;
    },
    onSuccess: (data, connect) => {
      // Update user data in cache
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: connect ? "Outlook connected" : "Outlook disconnected",
        description: connect 
          ? "Your Outlook account has been successfully connected." 
          : "Your Outlook account has been disconnected.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Connection failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (!user) return null;

  return (
    <div className="flex-1 overflow-auto pb-20 md:pb-4">
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Profile Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account information and security settings
          </p>
        </div>

        <Card className="p-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "profile" | "security" | "integrations")}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="profile" data-testid="tab-profile">
                <User className="w-4 h-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="security" data-testid="tab-security">
                <Lock className="w-4 h-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="integrations" data-testid="tab-integrations">
                <Link2 className="w-4 h-4 mr-2" />
                Integrations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onUpdateProfile)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-profile-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} data-testid="input-profile-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} data-testid="input-profile-position" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="pronouns"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pronouns</FormLabel>
                        <FormControl>
                          <Input {...field} value={field.value || ""} placeholder="e.g., she/her, he/him, they/them" data-testid="input-profile-pronouns" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                      data-testid="button-save-profile"
                    >
                      {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => profileForm.reset()}
                      data-testid="button-cancel-profile"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="security">
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} data-testid="input-current-password" />
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
                          <Input type="password" {...field} data-testid="input-new-password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} data-testid="input-confirm-password" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center gap-3 pt-4">
                    <Button
                      type="submit"
                      disabled={changePasswordMutation.isPending}
                      data-testid="button-change-password"
                    >
                      {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => passwordForm.reset()}
                      data-testid="button-cancel-password"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </TabsContent>

            <TabsContent value="integrations">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Email Integration</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect your Outlook account to send training reports via email
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M7 22h10c1.103 0 2-.897 2-2V4c0-1.103-.897-2-2-2H7c-1.103 0-2 .897-2 2v16c0 1.103.897 2 2 2zm0-18h10v12H7V4z"/>
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold">Microsoft Outlook</h4>
                          <p className="text-sm text-muted-foreground">
                            {user.outlookConnected ? "Connected" : "Not connected"}
                          </p>
                        </div>
                      </div>
                      
                      {user.outlookConnected ? (
                        <p className="text-sm text-muted-foreground mt-3">
                          Your Outlook account is connected and ready to send reports.
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-3">
                          Connect your Outlook account to enable email sending for training reports.
                        </p>
                      )}
                    </div>

                    <Button
                      variant={user.outlookConnected ? "outline" : "default"}
                      onClick={() => toggleOutlookConnectionMutation.mutate(!user.outlookConnected)}
                      disabled={toggleOutlookConnectionMutation.isPending}
                      data-testid={user.outlookConnected ? "button-disconnect-outlook" : "button-connect-outlook"}
                    >
                      {toggleOutlookConnectionMutation.isPending 
                        ? "Processing..." 
                        : user.outlookConnected 
                          ? "Disconnect" 
                          : "Connect Outlook"
                      }
                    </Button>
                  </div>
                </div>

                <div className="bg-muted/30 border rounded-lg p-4">
                  <h4 className="font-medium mb-2 text-sm">What can you do with Outlook integration?</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Send formatted training reports directly from the app</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Automatically attach PDF reports to emails</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Use pre-configured distribution lists for quick sending</span>
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="mt-6">
          <Card className="p-4 bg-muted/30">
            <h3 className="font-semibold mb-2">Account Information</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p><span className="font-medium">Email:</span> {user.email}</p>
              <p><span className="font-medium">Account created:</span> {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
