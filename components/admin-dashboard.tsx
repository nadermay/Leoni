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
import { UserManagement } from "./user-management";

export function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState("7days");
  const [userFilter, setUserFilter] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const {
    tasks,
    users,
    refreshTasks,
    updateTask,
    addTask,
    registerTaskListener,
    unregisterTaskListener,
    registerUserListener,
    unregisterUserListener,
  } = useTaskContext();

  // Generate unique IDs for listeners
  const taskListenerId = useId();
  const userListenerId = useId();

  // Register listeners for real-time updates
  useEffect(() => {
    // Register listeners
    registerTaskListener(taskListenerId, () => {
      console.log("Task update detected in AdminDashboard");
    });

    registerUserListener(userListenerId, () => {
      console.log("User update detected in AdminDashboard");
    });

    // Clean up listeners on unmount
    return () => {
      unregisterTaskListener(taskListenerId);
      unregisterUserListener(userListenerId);
    };
  }, [
    registerTaskListener,
    unregisterTaskListener,
    registerUserListener,
    unregisterUserListener,
    taskListenerId,
    userListenerId,
  ]);

  // Filter tasks for the recent tasks table and to-do list
  const filteredTasks =
    userFilter === "all"
      ? tasks.slice(0, 5) // Just show the first 5 tasks for the dashboard
      : tasks.filter((task) => task.pilotes === userFilter).slice(0, 5);

  // Sort tasks by creation date (newest first)
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      refreshTasks();
      router.refresh();

      toast({
        title: "Dashboard refreshed",
        description: "The dashboard has been updated with the latest data",
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

  const handleTaskCompletion = async (taskId, isCompleted) => {
    if (!taskId) {
      toast({
        title: "Error",
        description: "Task ID is missing",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);

      // Find the task to get its current state
      const task = tasks.find((t) => t._id === taskId);
      if (!task) {
        throw new Error("Task not found");
      }

      // Calculate the new avancement value
      const newAvancement = isCompleted
        ? 100
        : task.avancement < 100
        ? task.avancement
        : 0;

      // Update the task with new status and progress
      await updateTask(taskId.toString(), {
        status: isCompleted ? "completed" : "in-progress",
        avancement: newAvancement,
        updatedAt: new Date().toISOString(),
      });

      // Force a refresh to ensure state is updated
      await refreshTasks();
      router.refresh();

      toast({
        title: isCompleted ? "Task completed" : "Task reopened",
        description: isCompleted
          ? "The task has been marked as completed"
          : "The task has been reopened",
      });
    } catch (error) {
      console.error("Error updating task status:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to update task status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTaskSubmit = async (taskData) => {
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
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor task performance and manage users
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem key="all" value="all">
                All Users
              </SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id || user._id} value={user.name}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      <TaskSummaryCards isAdmin={true} />

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="tasks">To-Do List</TabsTrigger>
          <TabsTrigger value="recent">Recent Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Performance</CardTitle>
              <CardDescription>
                Task completion rate over time by user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserPerformanceChart
                isAdmin={true}
                timeRange={timeRange}
                userFilter={userFilter}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Task To-Do List</CardTitle>
                <CardDescription>
                  {userFilter === "all"
                    ? "Manage tasks across all users"
                    : `Manage tasks for ${userFilter}`}
                </CardDescription>
              </div>
              <Dialog
                open={isAddTaskDialogOpen}
                onOpenChange={setIsAddTaskDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm">Add New Task</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                  </DialogHeader>
                  <TaskForm isAdmin={true} onTaskSubmit={handleTaskSubmit} />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Status</TableHead>
                      <TableHead>Task</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Deadline</TableHead>
                      <TableHead>Priority</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedTasks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center">
                          No tasks found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      sortedTasks.map((task) => {
                        const isCompleted = task.status === "completed";
                        const isOverdue = task.status === "overdue";

                        return (
                          <TableRow
                            key={task._id}
                            className={isCompleted ? "bg-muted/50" : ""}
                          >
                            <TableCell>
                              <div className="flex items-center justify-center">
                                <Checkbox
                                  id={`task-${task._id}`}
                                  checked={isCompleted}
                                  onCheckedChange={(checked) =>
                                    handleTaskCompletion(task._id, checked)
                                  }
                                  aria-label={
                                    isCompleted
                                      ? "Mark as incomplete"
                                      : "Mark as complete"
                                  }
                                  className={
                                    isCompleted
                                      ? "data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                                      : ""
                                  }
                                />
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span
                                  className={
                                    isCompleted
                                      ? "line-through text-muted-foreground"
                                      : "font-medium"
                                  }
                                >
                                  {task.action}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {task.id}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="font-normal">
                                {task.segSce}
                              </Badge>
                            </TableCell>
                            <TableCell>{task.pilotes}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                {isOverdue ? (
                                  <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
                                ) : isCompleted ? (
                                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                ) : (
                                  <Circle className="mr-2 h-4 w-4 text-blue-500" />
                                )}
                                <span
                                  className={isOverdue ? "text-red-500" : ""}
                                >
                                  {new Date(
                                    task.delaiRealisation
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  isOverdue
                                    ? "destructive"
                                    : isCompleted
                                    ? "outline"
                                    : task.avancement > 50
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {isOverdue
                                  ? "Overdue"
                                  : isCompleted
                                  ? "Completed"
                                  : task.avancement > 50
                                  ? "High"
                                  : "Normal"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex justify-between text-sm text-muted-foreground">
                <div className="flex items-center">
                  <div className="mr-4 flex items-center">
                    <div className="mr-1 h-2 w-2 rounded-full bg-green-500"></div>
                    <span>Completed</span>
                  </div>
                  <div className="mr-4 flex items-center">
                    <div className="mr-1 h-2 w-2 rounded-full bg-blue-500"></div>
                    <span>In Progress</span>
                  </div>
                  <div className="flex items-center">
                    <div className="mr-1 h-2 w-2 rounded-full bg-red-500"></div>
                    <span>Overdue</span>
                  </div>
                </div>
                <div>
                  <p>
                    {sortedTasks.filter((t) => t.status === "completed").length}{" "}
                    of {sortedTasks.length} tasks completed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>
                Overview of the most recent tasks across all users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RecentTasksTable isAdmin={true} tasks={sortedTasks} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
