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
import { signIn } from "next-auth/react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  // Set mounted state to avoid hydration issues
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setEmailError("");
    setPasswordError("");

    // Validate email format
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    // Validate password
    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        const errorMessage = result.error;

        if (errorMessage === "Email not found") {
          setEmailError("This email is not registered");
          toast({
            title: "Login failed",
            description: "This email is not registered in our system",
            variant: "destructive",
          });
        } else if (errorMessage === "Incorrect password") {
          setPasswordError("The password you entered is incorrect");
          toast({
            title: "Login failed",
            description: "The password you entered is incorrect",
            variant: "destructive",
          });
        } else if (errorMessage === "Account is inactive") {
          toast({
            title: "Account Inactive",
            description:
              "Your account has been deactivated. Please contact support.",
            variant: "destructive",
          });
        } else if (errorMessage === "Please enter both email and password") {
          if (!email) setEmailError("Email is required");
          if (!password) setPasswordError("Password is required");
          toast({
            title: "Missing Information",
            description: "Please enter both email and password",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Login failed",
            description: "Something went wrong. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Welcome back! 👋",
          description: "You have successfully logged in.",
        });
        router.push("/dashboard");
        router.refresh();
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

  if (!isMounted) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
        <CardDescription>
          Enter your email and password to access your account
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError("");
              }}
              required
              className={emailError ? "border-red-500" : ""}
            />
            {emailError && <p className="text-sm text-red-500">{emailError}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setPasswordError("");
              }}
              required
              className={passwordError ? "border-red-500" : ""}
            />
            {passwordError && (
              <p className="text-sm text-red-500">{passwordError}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
