"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertCircle, Loader2, Lock } from "lucide-react";
import { useState, useCallback } from "react";
import { useTaskContext, type Task } from "@/contexts/task-context";
import { useRouter } from "next/navigation";

interface TaskDetailsProps {
  task: Task;
  isAdmin: boolean;
  onClose?: () => void;
}

export function TaskDetails({ task, isAdmin, onClose }: TaskDetailsProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const { updateTask } = useTaskContext();

  // Check if a task is expired (past deadline)
  const isTaskExpired = useCallback((task: Task) => {
    const deadline = new Date(task.delaiRealisation);
    const now = new Date();
    return deadline < now && task.status !== "completed";
  }, []);

  // Check if a non-admin user can interact with a task
  const canInteractWithTask = useCallback(
    (task: Task) => {
      if (isAdmin) return true;
      return !isTaskExpired(task);
    },
    [isAdmin, isTaskExpired]
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "in-progress":
        return <Clock className="h-5 w-5 text-blue-500" />;
      case "overdue":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completed";
      case "in-progress":
        return "In Progress";
      case "overdue":
        return "Overdue";
      default:
        return "";
    }
  };

  const handleCompleteTask = async () => {
    // Check if the user can interact with this task
    if (!canInteractWithTask(task)) {
      return;
    }

    try {
      setIsUpdating(true);

      await updateTask(task._id, {
        status: "completed",
        avancement: 100,
      });

      // Close the dialog if provided
      if (onClose) {
        onClose();
      }

      // Force a router refresh
      router.refresh();
    } catch (error) {
      console.error("Error completing task:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const isExpired = isTaskExpired(task);
  const canInteract = canInteractWithTask(task);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium">{task.id}</h3>
          <Badge
            variant="outline"
            className={`
            ${
              task.status === "completed"
                ? "bg-green-50 text-green-700 border-green-200"
                : ""
            }
            ${
              task.status === "in-progress"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : ""
            }
            ${
              task.status === "overdue"
                ? "bg-red-50 text-red-700 border-red-200"
                : ""
            }
          `}
          >
            {getStatusIcon(task.status)}
            <span className="ml-1">{getStatusText(task.status)}</span>
          </Badge>

          {isExpired && !isAdmin && (
            <Badge
              variant="outline"
              className="bg-gray-100 text-gray-700 border-gray-200"
            >
              <Lock className="mr-1 h-3 w-3" />
              <span>Locked</span>
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {!isAdmin && task.status !== "completed" && canInteract && (
            <Button
              onClick={handleCompleteTask}
              disabled={isUpdating}
              className="bg-green-600 hover:bg-green-700 transition-colors duration-200"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Mark as Completed
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">
            Task Details
          </h4>
          <Card className="border-primary/5 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Department
                  </dt>
                  <dd className="text-sm mt-1">{task.segSce}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    PDCA Stage
                  </dt>
                  <dd className="text-sm mt-1">{task.pdcaStage}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Source
                  </dt>
                  <dd className="text-sm mt-1">{task.source}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Processes
                  </dt>
                  <dd className="text-sm mt-1">{task.processes}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Action
                  </dt>
                  <dd className="text-sm mt-1">{task.action}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        <div>
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">
            Progress & Assignment
          </h4>
          <Card className="border-primary/5 shadow-sm hover:shadow-md transition-all duration-200">
            <CardContent className="p-4">
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Pilotes
                  </dt>
                  <dd className="text-sm mt-1">{task.pilotes}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Délai réalisation
                  </dt>
                  <dd
                    className={`text-sm mt-1 ${
                      isExpired ? "text-red-500" : ""
                    }`}
                  >
                    {new Date(task.delaiRealisation).toLocaleDateString()}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Avancement
                  </dt>
                  <dd className="text-sm mt-1">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className={`h-2 rounded-full ${
                            task.status === "completed"
                              ? "bg-green-500"
                              : task.status === "in-progress"
                              ? "bg-blue-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${task.avancement}%` }}
                        />
                      </div>
                      <span>{task.avancement}%</span>
                    </div>
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h4 className="mb-2 text-sm font-medium text-muted-foreground">
          Comments
        </h4>
        <Card className="border-primary/5 shadow-sm hover:shadow-md transition-all duration-200">
          <CardContent className="p-4">
            <p className="text-sm">
              {task.commentaires || "No comments provided."}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
