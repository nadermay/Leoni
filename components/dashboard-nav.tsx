"use client";

import { DropdownMenuLabel } from "@/components/ui/dropdown-menu";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Moon, Sun } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTaskContext } from "@/contexts/task-context";

export function DashboardNav() {
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { currentUser, setCurrentUser } = useTaskContext();
  const [isAdmin, setIsAdmin] = useState(false);

  // Wait until mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    // Determine if admin based on URL and current user
    const isAdminPath = window.location.pathname.includes("/admin");
    setIsAdmin(isAdminPath);
  }, []);

  const handleLogout = () => {
    // Clear current user
    setCurrentUser(null);

    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    router.push("/");
  };

  const toggleTheme = () => {
    try {
      const newTheme = theme === "dark" ? "light" : "dark";
      console.log(`Switching theme from ${theme} to ${newTheme}`);
      setTheme(newTheme);

      toast({
        title: `${
          newTheme.charAt(0).toUpperCase() + newTheme.slice(1)
        } mode activated`,
        description: `Theme switched to ${newTheme} mode`,
      });
    } catch (error) {
      console.error("Error toggling theme:", error);
      toast({
        title: "Theme switch failed",
        description: "Could not change the theme. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get user's first name for welcome message
  const getFirstName = () => {
    if (!currentUser) return "";
    return currentUser.name.split(" ")[0];
  };

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center">
          <h1 className="text-xl font-bold mr-4 text-primary">
            Leoni Team Manager
          </h1>
          {currentUser && (
            <p className="text-sm text-muted-foreground hidden md:block">
              Welcome back,{" "}
              <span className="font-medium text-foreground">
                {getFirstName()}
              </span>
              !
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          {mounted && (
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              aria-label={`Switch to ${
                theme === "dark" ? "light" : "dark"
              } mode`}
              className="rounded-full h-9 w-9 transition-all duration-200"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full"
                aria-label="User menu"
              >
                <Avatar className="h-9 w-9 border border-primary/10 transition-all duration-300">
                  <AvatarImage
                    src={
                      currentUser?.profilePicture ||
                      "/placeholder.svg?height=200&width=200"
                    }
                    alt={currentUser?.name || "User"}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {currentUser?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center p-2 gap-3">
                <Avatar className="h-10 w-10 border border-primary/10">
                  <AvatarImage
                    src={
                      currentUser?.profilePicture ||
                      "/placeholder.svg?height=200&width=200"
                    }
                    alt={currentUser?.name || "User"}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {currentUser?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <DropdownMenuLabel className="p-0 font-medium">
                    {currentUser?.name || "User"}
                  </DropdownMenuLabel>
                  <p className="text-xs text-muted-foreground">
                    {isAdmin ? "Administrator" : "Regular User"}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
