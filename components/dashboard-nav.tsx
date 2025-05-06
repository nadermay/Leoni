"use client";

import { DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, Moon, Sun, User } from "lucide-react";
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
import { useSession, signOut } from "next-auth/react";
import { useTaskContext } from "@/contexts/task-context";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export function DashboardNav() {
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const { currentUser } = useTaskContext();

  // Wait until mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    router.push("/");
  };

  if (!mounted) {
    return null;
  }

  const userRole = session?.user?.role || "user";
  const userName = session?.user?.name || "User";
  const userImage = session?.user?.image;
  const isAdmin = userRole === "admin";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        {/* Left section: Logo and Title */}
        <div className="flex items-center">
          <div className="border-l-4 border-[#003087] pl-4 mr-6">
            <span className="text-[#003087] font-bold text-2xl">LEONI</span>
          </div>
          <Button
            variant="ghost"
            onClick={() => router.push(`/dashboard/${userRole.toLowerCase()}`)}
          >
            {isAdmin ? "PPE Department Management" : "My Tasks"}
          </Button>
        </div>

        {/* Center section: Welcome message */}
        <div className="hidden md:flex items-center flex-1 justify-center">
          <span className="text-muted-foreground">
            Welcome back,{" "}
            <span className="font-medium text-foreground">{userName}</span>
          </span>
        </div>

        {/* Right section: User badge, theme toggle, and profile */}
        <div className="flex items-center space-x-4">
          {!isAdmin && (
            <>
              <Badge variant="outline">
                {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
              </Badge>
              <Separator orientation="vertical" className="h-6" />
            </>
          )}

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9" // Made slightly larger for better symmetry
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={userImage || "/placeholder.svg"}
                      alt={userName}
                    />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {userName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
