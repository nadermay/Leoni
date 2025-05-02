"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CheckSquare,
  Users,
  Home,
  ChevronLeft,
  ChevronRight,
  PieChart,
  LineChart,
  BarChart,
  FileText,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTaskContext } from "@/contexts/task-context";

interface SidebarProps {
  isAdmin: boolean;
}

export function DashboardSidebar({ isAdmin }: SidebarProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser } = useTaskContext();

  // Expand sidebar by default on desktop, collapse on mobile
  useEffect(() => {
    setCollapsed(isMobile);
  }, [isMobile]);

  const navItems = [
    {
      title: "Home",
      href: isAdmin ? "/dashboard/admin" : "/dashboard/user",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Tasks",
      href: isAdmin ? "/dashboard/admin/tasks" : "/dashboard/user/tasks",
      icon: <CheckSquare className="h-5 w-5" />,
    },
    {
      title: "Orders",
      href: isAdmin ? "/dashboard/admin/orders" : "/dashboard/user/orders",
      icon: <ClipboardList className="h-5 w-5" />,
    },
    {
      title: "Performance",
      href: isAdmin
        ? "/dashboard/admin/performance"
        : "/dashboard/user/performance",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: "Files",
      href: isAdmin ? "/dashboard/admin/files" : "/dashboard/user/files",
      icon: <FileText className="h-5 w-5" />,
    },
  ];

  if (isAdmin) {
    navItems.push({
      title: "Users",
      href: "/dashboard/admin/users",
      icon: <Users className="h-5 w-5" />,
    });
  }

  // Dashboard items (placeholder for future Power BI integrations)
  const dashboardItems = [
    {
      title: "Sales Overview",
      href: isAdmin
        ? "/dashboard/admin/dashboards/sales"
        : "/dashboard/user/dashboards/sales",
      icon: <PieChart className="h-5 w-5" />,
    },
    {
      title: "Production KPIs",
      href: isAdmin
        ? "/dashboard/admin/dashboards/production"
        : "/dashboard/user/dashboards/production",
      icon: <LineChart className="h-5 w-5" />,
    },
    {
      title: "Quality Metrics",
      href: isAdmin
        ? "/dashboard/admin/dashboards/quality"
        : "/dashboard/user/dashboards/quality",
      icon: <BarChart className="h-5 w-5" />,
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-col border-r bg-sidebar-background text-sidebar-foreground transition-all duration-300 ease-in-out shadow-sm",
        collapsed ? "w-[70px]" : "w-[240px]"
      )}
    >
      <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3 py-2">
        <div
          className={cn(
            "flex items-center gap-2",
            collapsed && "justify-center w-full"
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
            {isAdmin ? "A" : "U"}
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Leoni Manager</span>
              <span className="text-xs text-sidebar-foreground/70">
                {isAdmin ? "Admin" : "User"}
              </span>
            </div>
          )}
        </div>
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      <ScrollArea className="flex-1 py-2">
        <nav className="grid gap-1 px-2">
          {/* Main Navigation */}
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start transition-all duration-200",
                  pathname === item.href
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:text-sidebar-foreground",
                  collapsed && "justify-center px-0"
                )}
              >
                {item.icon}
                {!collapsed && <span className="ml-2">{item.title}</span>}
                {collapsed && <span className="sr-only">{item.title}</span>}
              </Button>
            </Link>
          ))}

          {/* Dashboards Section */}
          {!collapsed && (
            <div className="mt-6 mb-2 px-2">
              <h3 className="text-xs font-semibold text-sidebar-foreground/70 uppercase tracking-wider">
                Dashboards
              </h3>
            </div>
          )}
          {collapsed && (
            <div className="mt-6 mb-2 flex justify-center">
              <div className="h-px w-4 bg-sidebar-border"></div>
            </div>
          )}

          {dashboardItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start transition-all duration-200",
                  pathname === item.href
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/80 hover:text-sidebar-foreground",
                  collapsed && "justify-center px-0"
                )}
              >
                {item.icon}
                {!collapsed && <span className="ml-2">{item.title}</span>}
                {collapsed && <span className="sr-only">{item.title}</span>}
              </Button>
            </Link>
          ))}
        </nav>
      </ScrollArea>

      <div className="border-t border-sidebar-border p-2">
        <div
          className={cn(
            "text-xs text-sidebar-foreground/70 px-2 py-1",
            collapsed && "hidden"
          )}
        >
          {currentUser ? `Logged in as ${currentUser.name}` : "Not logged in"}
        </div>
      </div>
    </div>
  );
}
