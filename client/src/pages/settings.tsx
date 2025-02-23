import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@shared/schema";
import { motion } from "framer-motion";
import { Github, Linkedin, Upload, History } from "lucide-react";
import NavBar from "@/components/layout/nav-bar";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [avatar, setAvatar] = useState<File | null>(null);
  const [background, setBackground] = useState<File | null>(null);

  const updateProfileMutation = useMutation({
    mutationFn: async (updatedUser: Partial<User>) => {
      const formData = new FormData();
      if (avatar) formData.append("avatar", avatar);
      if (background) formData.append("background", background);
      Object.entries(updatedUser).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/user"], updatedUser);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      
      <main className="container mx-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile">Profile Settings</TabsTrigger>
              <TabsTrigger value="history">Search History</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card className="card neon-border backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-glow">Profile Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Profile Picture</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setAvatar(e.target.files?.[0] || null)}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 
                            file:text-sm file:font-medium file:bg-primary file:text-primary-foreground 
                            hover:file:bg-primary/90 neon-border"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Background Image</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setBackground(e.target.files?.[0] || null)}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 
                            file:text-sm file:font-medium file:bg-primary file:text-primary-foreground 
                            hover:file:bg-primary/90 neon-border"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input
                          defaultValue={user?.fullName}
                          placeholder="Enter your full name"
                          className="neon-border"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Bio</Label>
                        <Textarea
                          defaultValue={user?.bio}
                          placeholder="Tell us about yourself"
                          className="min-h-[100px] neon-border"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>LinkedIn URL</Label>
                      <div className="flex items-center space-x-2">
                        <Linkedin className="h-4 w-4 text-muted-foreground" />
                        <Input
                          defaultValue={user?.linkedinUrl}
                          placeholder="Your LinkedIn profile URL"
                          className="neon-border"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>GitHub URL</Label>
                      <div className="flex items-center space-x-2">
                        <Github className="h-4 w-4 text-muted-foreground" />
                        <Input
                          defaultValue={user?.githubUrl}
                          placeholder="Your GitHub profile URL"
                          className="neon-border"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={() => updateProfileMutation.mutate({
                        fullName: user?.fullName,
                        bio: user?.bio,
                        linkedinUrl: user?.linkedinUrl,
                        githubUrl: user?.githubUrl,
                      })}
                      disabled={updateProfileMutation.isPending}
                      className="min-w-[120px]"
                    >
                      {updateProfileMutation.isPending ? (
                        <motion.div className="animate-spin">
                          <Upload className="h-4 w-4" />
                        </motion.div>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card className="card neon-border backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold text-glow">Search History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <History className="h-16 w-16 text-primary opacity-50" />
                    <p className="text-center text-muted-foreground">
                      Your search history will appear here
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
