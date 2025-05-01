"use client";

import { useState, useEffect, useId } from "react";
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
import { RefreshCw, CheckCircle, Circle, AlertCircle } from "lucide-react";
import { UserPerformanceChart } from "@/components/user-performance-chart";
import { TaskSummaryCards } from "@/components/task-summary-cards";
import { RecentTasksTable } from "@/components/recent-tasks-table";
import { useTaskContext } from "@/contexts/task-context";
import { type Task } from "@/contexts/task-context";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TaskForm } from "@/components/task-form";

export function UserDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("7days");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const {
    tasks,
    refreshTasks,
    updateTask,
    addTask,
    registerTaskListener,
    unregisterTaskListener,
  } = useTaskContext();

  // Generate unique ID for listener
  const taskListenerId = useId();

  // Register listener for real-time updates
  useEffect(() => {
    // Register listener
    registerTaskListener(taskListenerId, () => {
      console.log("Task update detected in UserDashboard");
    });

    // Clean up listener on unmount
    return () => {
      unregisterTaskListener(taskListenerId);
    };
  }, [registerTaskListener, unregisterTaskListener, taskListenerId]);

  // Filter tasks for the current user
  const userTasks = tasks.filter((task) => task.pilotes === "You");

  // Sort tasks by creation date (newest first)
  const sortedTasks = [...userTasks]
    .sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      refreshTasks();
      router.refresh();

      toast({
        title: "Dashboard refreshed",
        description: "Your dashboard has been updated with the latest data",
      });
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
      toast({
        title: "Error",
        description: "Failed to refresh dashboard. Please try again.",
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  const handleTaskCompletion = async (taskId: string, isCompleted: boolean) => {
    // Regular users can only check tasks, not uncheck them
    if (!isCompleted) {
      toast({
        title: "Permission denied",
        description: "Only administrators can uncheck completed tasks",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);

      // Update only the specific task
      await updateTask(taskId, {
        status: "completed",
        avancement: 100,
      });

      // Force a refresh to ensure state is updated
      router.refresh();

      toast({
        title: "Task completed",
        description: "The task has been marked as completed",
      });
    } catch (error) {
      console.error("Error completing task:", error);
      toast({
        title: "Error",
        description: "Failed to update task status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  type NewTaskData = Omit<Task, "id" | "status" | "createdAt">;

  const handleTaskSubmit = async (taskData: NewTaskData) => {
    try {
      await addTask(taskData);
      setIsAddTaskDialogOpen(false);

      toast({
        title: "Task added",
        description: "New task has been added successfully",
      });
    } catch (error) {
      console.error("Error adding task:", error);
      toast({
        title: "Error",
        description: "Failed to add task. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
          <p className="text-muted-foreground">
            Track your task performance and progress
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
              <SelectItem value="year">This year</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span className="sr-only">Refresh data</span>
          </Button>
        </div>
      </div>

      <TaskSummaryCards isAdmin={false} />

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>My Performance</CardTitle>
              <CardDescription>
                Your task completion rate over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserPerformanceChart isAdmin={false} timeRange={timeRange} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
