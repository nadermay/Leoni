"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Loader2,
  Lock,
  Pencil,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TaskDetails } from "@/components/task-details";
import { TaskForm } from "@/components/task-form";
import { useTaskContext, type Task } from "@/contexts/task-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RecentTasksTableProps {
  isAdmin: boolean;
  tasks: Task[];
  onTaskCompletion?: (taskId: string, isCompleted: boolean) => void;
}

export function RecentTasksTable({
  isAdmin,
  tasks = [],
  onTaskCompletion,
}: RecentTasksTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { updateTask, deleteTask, currentUser } = useTaskContext();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (selectedTask && !tasks.find((t) => t._id === selectedTask._id)) {
      setSelectedTask(null);
    }
  }, [tasks, selectedTask]);

  const isTaskExpired = useCallback((task: Task) => {
    if (
      !task.delaiRealisation ||
      isNaN(new Date(task.delaiRealisation).getTime())
    ) {
      return false;
    }
    const deadline = new Date(task.delaiRealisation);
    const now = new Date();
    return deadline < now && task.status !== "completed";
  }, []);

  const canToggleCompletion = useCallback(
    (task: Task) => {
      if (isAdmin) return true;
      // Regular users can only toggle their own tasks and can't uncheck completed tasks
      return task.pilotes === currentUser?.name && !isTaskExpired(task);
    },
    [isAdmin, isTaskExpired, currentUser]
  );

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [tasks]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "in-progress":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "overdue":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-green-50 text-green-700 hover:bg-green-50"
          >
            Completed
          </Badge>
        );
      case "in-progress":
        return (
          <Badge
            variant="outline"
            className="bg-blue-50 text-blue-700 hover:bg-blue-50"
          >
            In Progress
          </Badge>
        );
      case "overdue":
        return (
          <Badge
            variant="outline"
            className="bg-red-50 text-red-700 hover:bg-red-50"
          >
            Overdue
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleViewTask = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsViewDialogOpen(true);
  }, []);
  const handleEditTask = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsEditDialogOpen(true);
  }, []);
  const handleDeleteTask = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDeleteTask = async () => {
    if (!selectedTask) return;
    setIsDeleting(true);
    setIsProcessing(true);
    try {
      await deleteTask(selectedTask._id);
      setIsDeleteDialogOpen(false);
      setSelectedTask(null);
      toast({ title: "Task deleted" });
      router.refresh();
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsProcessing(false);
    }
  };

  const handleTaskUpdate = async (submittedData: any) => {
    if (!selectedTask) return;
    setIsProcessing(true);
    try {
      await updateTask(selectedTask._id, submittedData as Partial<Task>);
      setIsEditDialogOpen(false);
      setSelectedTask(null);
      toast({ title: "Task updated" });
      router.refresh();
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckboxChange = (taskId: string, isCompleted: boolean) => {
    if (onTaskCompletion) {
      onTaskCompletion(taskId, isCompleted);
    } else {
      console.warn("onTaskCompletion prop not provided to RecentTasksTable");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isAdmin ? "All Tasks" : "My Recent Tasks"}</CardTitle>
        <CardDescription>
          {isAdmin
            ? "View and manage tasks across all users."
            : "Your 5 most recently updated tasks."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-auto max-h-[400px] w-full overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Done</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Pilot</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead className="w-[100px]">Progress (%)</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTasks.length > 0 ? (
                sortedTasks.map((task) => {
                  const isExpired = isTaskExpired(task);
                  const canToggle = canToggleCompletion(task);
                  const checkboxId = `task-checkbox-${task._id}`;
                  return (
                    <TableRow key={task._id}>
                      <TableCell>
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className={
                                  !canToggle ? "cursor-not-allowed" : ""
                                }
                              >
                                <Checkbox
                                  id={checkboxId}
                                  checked={task.status === "completed"}
                                  onCheckedChange={(checked) =>
                                    handleCheckboxChange(task._id, !!checked)
                                  }
                                  disabled={!canToggle}
                                  aria-label={`Mark task ${task.action} as done`}
                                  className={
                                    !canToggle
                                      ? "cursor-not-allowed opacity-50"
                                      : ""
                                  }
                                />
                              </span>
                            </TooltipTrigger>
                            {!canToggle && (
                              <TooltipContent>
                                <p>
                                  {isAdmin
                                    ? "Cannot change status of expired task"
                                    : task.pilotes !== currentUser?.name
                                    ? "You can only modify tasks assigned to you"
                                    : "Cannot change status of expired task"}
                                </p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell
                        className="font-medium max-w-[200px] truncate"
                        title={task.action}
                      >
                        {task.action}
                      </TableCell>
                      <TableCell
                        className="max-w-[120px] truncate"
                        title={task.pilotes}
                      >
                        {task.pilotes}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(task.status)}
                          {getStatusBadge(task.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {task.delaiRealisation
                          ? new Date(task.delaiRealisation).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell className="text-center">
                        {task.avancement}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Task actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => handleViewTask(task)}
                            >
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEditTask(task)}
                              disabled={!canToggle && !isAdmin}
                            >
                              {!canToggle && !isAdmin ? (
                                <Lock className="mr-2 h-4 w-4" />
                              ) : (
                                <Pencil className="mr-2 h-4 w-4" />
                              )}
                              Edit Task
                            </DropdownMenuItem>
                            {isAdmin && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600 hover:!text-red-600"
                                  onClick={() => handleDeleteTask(task)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  Task
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    No tasks found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        {/* Dialogs */}
        {selectedTask && (
          <>
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Task Details</DialogTitle>
                </DialogHeader>
                <TaskDetails task={selectedTask} isAdmin={isAdmin} />
              </DialogContent>
            </Dialog>
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                  <DialogTitle>Edit Task</DialogTitle>
                </DialogHeader>
                <TaskForm
                  isAdmin={isAdmin}
                  task={selectedTask}
                  onTaskSubmit={handleTaskUpdate}
                />
              </DialogContent>
            </Dialog>
            <AlertDialog
              open={isDeleteDialogOpen}
              onOpenChange={setIsDeleteDialogOpen}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the task "{selectedTask.action}
                    ".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmDeleteTask}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}{" "}
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </CardContent>
    </Card>
  );
}

RecentTasksTable.displayName = "RecentTasksTable";
