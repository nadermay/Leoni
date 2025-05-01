"use client";

import type React from "react";
import { DashboardNav } from "@/components/dashboard-nav";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { useTaskContext } from "@/contexts/task-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentUser } = useTaskContext();
  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-background to-background/95">
      <DashboardNav />
      <div className="flex flex-1">
        <DashboardSidebar isAdmin={isAdmin} />
        <div className="flex-1 p-4 md:p-8 overflow-auto animate-fade-in">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
