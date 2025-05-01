"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useTaskContext } from "@/contexts/task-context";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { authenticateUser } = useTaskContext();

  // Set mounted state to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Authenticate user using the task context
      const user = await authenticateUser(email, password);

      if (user) {
        toast({
          title: "Login successful",
          description: `Welcome back, ${user.name}!`,
        });

        // Redirect based on user role
        if (user.role === "admin") {
          router.push("/dashboard/admin");
        } else {
          router.push("/dashboard/user");
        }
      } else {
        toast({
          title: "Login failed",
          description: "Invalid email or password",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render until client-side to avoid hydration issues
  if (!isMounted) {
    return null;
  }

  return (
    <Card className="shadow-lg border-primary/5">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
        <CardDescription className="text-center">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="transition-all duration-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="transition-all duration-200"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full transition-all duration-200"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </CardFooter>
      </form>
      <CardFooter className="flex-col space-y-2 border-t pt-4">
        <div className="text-sm text-muted-foreground">
          <strong>Demo Credentials:</strong>
          <div className="grid grid-cols-2 gap-2 mt-1">
            <div className="bg-primary/5 p-2 rounded-md text-xs">
              <div className="font-medium">Admin:</div>
              <div>admin@example.com</div>
              <div>admin123</div>
            </div>
            <div className="bg-primary/5 p-2 rounded-md text-xs">
              <div className="font-medium">User:</div>
              <div>user@example.com</div>
              <div>user123</div>
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
