"use client";

import { useState, useRef, useEffect, useId } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar, Download, RefreshCw } from "lucide-react";
import { TaskCompletionChart } from "@/components/task-completion-chart";
import { TaskTypeDistribution } from "@/components/task-type-distribution";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTaskContext } from "@/contexts/task-context";

interface PerformanceDashboardProps {
  isAdmin?: boolean;
}

export function PerformanceDashboard({
  isAdmin = true,
}: PerformanceDashboardProps) {
  const { toast } = useToast();
  const chartRef = useRef(null);
  const [timeRange, setTimeRange] = useState("30days");
  const [userFilter, setUserFilter] = useState("all");
  const [distributionPeriod, setDistributionPeriod] = useState("30days");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { users, registerUserListener, unregisterUserListener } =
    useTaskContext();

  // Generate unique ID for listener
  const userListenerId = useId();

  // Register listener for real-time updates
  useEffect(() => {
    // Register listener
    registerUserListener(userListenerId, () => {
      console.log("User update detected in PerformanceDashboard");
    });

    // Clean up listener on unmount
    return () => {
      unregisterUserListener(userListenerId);
    };
  }, [registerUserListener, unregisterUserListener, userListenerId]);

  // Filter active users for the dropdown
  const activeUsers = users?.filter((user) => user.status === "active") ?? [];


  // Simulate data refresh
  const refreshData = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Performance Dashboard
          </h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? "Analyze task completion trends across all users and categories"
              : "Track your task completion performance over time"}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {isAdmin && (
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {activeUsers.map((user) => (
                  <SelectItem key={user._id || user.id} value={user.name}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={refreshData}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span className="sr-only">Refresh data</span>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="completion" className="space-y-4">
        <TabsList>
          <TabsTrigger value="completion">Completion Trends</TabsTrigger>
          <TabsTrigger value="distribution">Task Distribution</TabsTrigger>
        </TabsList>
        <TabsContent value="completion" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Task Completion Trends</CardTitle>
                <CardDescription>
                  {isAdmin
                    ? "Task completion rate over time by category"
                    : "Your task completion rate over time by category"}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (chartRef.current && chartRef.current.exportChart) {
                    chartRef.current.exportChart();
                  } else {
                    toast({
                      title: "Export failed",
                      description: "Chart export function not available",
                      variant: "destructive",
                    });
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </CardHeader>
            <CardContent>
              <TaskCompletionChart
                ref={chartRef}
                isAdmin={isAdmin}
                timeRange={timeRange}
                userFilter={userFilter}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Task Type Distribution</CardTitle>
                <CardDescription>
                  {isAdmin
                    ? "Distribution of tasks by category"
                    : "Distribution of your tasks by category"}
                </CardDescription>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Calendar className="mr-2 h-4 w-4" />
                    Select Period
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0" align="end">
                  <div className="p-2">
                    <div className="space-y-2">
                      <div
                        className={`cursor-pointer rounded-md px-3 py-2 text-sm ${
                          distributionPeriod === "7days"
                            ? "bg-muted"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => setDistributionPeriod("7days")}
                      >
                        Last 7 days
                      </div>
                      <div
                        className={`cursor-pointer rounded-md px-3 py-2 text-sm ${
                          distributionPeriod === "30days"
                            ? "bg-muted"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => setDistributionPeriod("30days")}
                      >
                        Last 30 days
                      </div>
                      <div
                        className={`cursor-pointer rounded-md px-3 py-2 text-sm ${
                          distributionPeriod === "90days"
                            ? "bg-muted"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => setDistributionPeriod("90days")}
                      >
                        Last 90 days
                      </div>
                      <div
                        className={`cursor-pointer rounded-md px-3 py-2 text-sm ${
                          distributionPeriod === "year"
                            ? "bg-muted"
                            : "hover:bg-muted"
                        }`}
                        onClick={() => setDistributionPeriod("year")}
                      >
                        This year
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </CardHeader>
            <CardContent>
              <TaskTypeDistribution
                isAdmin={isAdmin}
                userFilter={userFilter}
                period={distributionPeriod}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
