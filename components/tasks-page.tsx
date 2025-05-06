"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RecentTasksTable } from "@/components/recent-tasks-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TaskForm } from "@/components/task-form";
import { useTaskContext, type Task } from "@/contexts/task-context";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { TaskDashboard } from "@/components/task-dashboard";
import { useToast } from "@/components/ui/use-toast";

interface TasksPageProps {
  isAdmin: boolean;
}

export default function TasksPage({ isAdmin }: TasksPageProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [pdcaFilter, setPdcaFilter] = useState("all");
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { tasks, addTask, refreshTasks, currentUser, updateTask } =
    useTaskContext();
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);

  // Apply filters to tasks
  useEffect(() => {
    let result = [...tasks];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          (task.action?.toLowerCase() ?? "").includes(query) ||
          (task.processes?.toLowerCase() ?? "").includes(query) ||
          (task.source?.toLowerCase() ?? "").includes(query) ||
          (task.pilotes?.toLowerCase() ?? "").includes(query) ||
          (task.segSce?.toLowerCase() ?? "").includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((task) => task.status === statusFilter);
    }

    // Apply department filter
    if (departmentFilter !== "all") {
      result = result.filter(
        (task) =>
          (task.segSce?.toLowerCase() ?? "") === departmentFilter.toLowerCase()
      );
    }

    // Apply PDCA filter
    if (pdcaFilter !== "all") {
      result = result.filter(
        (task) =>
          (task.pdcaStage?.toLowerCase() ?? "") === pdcaFilter.toLowerCase()
      );
    }

    // Filter by user if not admin
    if (!isAdmin && currentUser) {
      result = result.filter((task) => task.pilotes === currentUser.name);
    }

    setFilteredTasks(result);
  }, [
    tasks,
    searchQuery,
    statusFilter,
    departmentFilter,
    pdcaFilter,
    isAdmin,
    currentUser,
  ]);

  // Calculate task statistics based on filtered tasks
  const taskStats = useMemo(
    () => ({
      total: filteredTasks.length,
      completed: filteredTasks.filter((task) => task.status === "completed")
        .length,
      pending: filteredTasks.filter((task) => task.status === "in-progress")
        .length,
      overdue: filteredTasks.filter((task) => task.status === "overdue").length,
    }),
    [filteredTasks]
  );

  // Handle task completion toggle from the table checkbox
  const handleTaskCompletionToggle = async (
    taskId: string,
    isCompleted: boolean
  ) => {
    const task = tasks.find((t) => t._id === taskId);
    if (!task) return;

    // Check if the user is allowed to modify this task
    if (!isAdmin && task.pilotes !== currentUser?.name) {
      toast({
        title: "Permission denied",
        description: "You can only modify tasks assigned to you",
        variant: "destructive",
      });
      return;
    }

    // Regular users can only complete tasks, not uncomplete them
    if (!isAdmin && !isCompleted) {
      toast({
        title: "Permission denied",
        description: "Only administrators can uncheck completed tasks",
        variant: "destructive",
      });
      return;
    }

    // Determine the new status and advancement
    const newStatus = isCompleted ? "completed" : "in-progress";
    const newAvancement = isCompleted ? 100 : 0;

    try {
      await updateTask(taskId, {
        status: newStatus,
        avancement: newAvancement,
      });
      toast({
        title: `Task ${isCompleted ? "completed" : "marked in progress"}`,
      });
      router.refresh();
    } catch (error) {
      console.error("Error updating task status:", error);
      toast({
        title: "Error",
        description: "Failed to update task status.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshTasks();
      router.refresh();
      toast({ title: "Tasks refreshed" });
    } catch (error) {
      console.error("Error refreshing tasks:", error);
      toast({
        title: "Error",
        description: "Failed to refresh tasks.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTaskSubmit = async (taskData: any) => {
    try {
      await addTask(taskData);
      setIsAddTaskDialogOpen(false);
      toast({ title: "Task added" });
      await handleRefresh();
    } catch (error) {
      console.error("Error adding task:", error);
      toast({
        title: "Error",
        description: "Failed to add task.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isAdmin ? "All Tasks" : "My Tasks"}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? "Manage and track tasks across all users"
              : "Manage and track your assigned tasks"}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-10 w-10 shrink-0"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span className="sr-only">Refresh</span>
          </Button>
          <Dialog
            open={isAddTaskDialogOpen}
            onOpenChange={setIsAddTaskDialogOpen}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="h-10 shrink-0">
                <Plus className="mr-2 h-4 w-4" />
                Add New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <TaskForm isAdmin={isAdmin} onTaskSubmit={handleTaskSubmit} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Task Dashboard */}
      <TaskDashboard isAdmin={isAdmin} />

      {/* Task Statistics Cards */}
      {!isAdmin && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{taskStats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">
                {taskStats.completed}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">
                {taskStats.pending}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {taskStats.overdue}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Task Filters</CardTitle>
          <CardDescription>Filter and search tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select
                value={departmentFilter}
                onValueChange={setDepartmentFilter}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="execution">Execution</SelectItem>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="acting">Acting</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Select value={pdcaFilter} onValueChange={setPdcaFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by PDCA stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All PDCA Stages</SelectItem>
                  <SelectItem value="plan">Plan</SelectItem>
                  <SelectItem value="do">Do</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="act">Act</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{isAdmin ? "All Tasks" : "My Assigned Tasks"}</CardTitle>
            <CardDescription>
              {isAdmin
                ? "View and manage tasks across all users"
                : "View and manage tasks assigned to you"}
            </CardDescription>
          </div>
          <div className="text-sm text-muted-foreground">
            Showing {filteredTasks.length} of{" "}
            {isAdmin
              ? tasks.length
              : tasks.filter((t) => t.pilotes === currentUser?.name)
                  .length}{" "}
            tasks
          </div>
        </CardHeader>
        <CardContent>
          <RecentTasksTable
            isAdmin={isAdmin}
            tasks={filteredTasks}
            onTaskCompletion={handleTaskCompletionToggle}
          />
        </CardContent>
      </Card>
    </div>
  );
}
