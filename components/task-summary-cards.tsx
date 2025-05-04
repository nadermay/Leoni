"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, AlertCircle, BarChart } from "lucide-react";
import { useTaskContext } from "@/contexts/task-context";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";

interface TaskSummaryCardsProps {
  isAdmin: boolean;
}

export function TaskSummaryCards({ isAdmin }: TaskSummaryCardsProps) {
  const { getTaskStats, currentUser, tasks } = useTaskContext();
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    completionRate: 0,
  });

  // Update stats whenever tasks or currentUser changes
  useEffect(() => {
    const newStats = getTaskStats(isAdmin, currentUser?.name);
    setStats(newStats);
  }, [tasks, currentUser, isAdmin, getTaskStats]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-200/20 hover:shadow-lg transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-600">
            Total Tasks
          </CardTitle>
          <div className="p-2 bg-blue-100 rounded-full">
            <BarChart className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-blue-600">{stats.total}</div>
          <div className="mt-2">
            <Progress
              value={stats.completionRate}
              className="h-2 bg-blue-100"
            />
            <p className="text-xs text-blue-600/80 mt-1">
              {stats.completionRate}% completion rate
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-200/20 hover:shadow-lg transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-600">
            Completed Tasks
          </CardTitle>
          <div className="p-2 bg-green-100 rounded-full">
            <CheckCircle className="h-4 w-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-green-600">
            {stats.completed}
          </div>
          <div className="mt-2">
            <Progress
              value={
                stats.total > 0 ? (stats.completed / stats.total) * 100 : 0
              }
              className="h-2 bg-green-100"
            />
            <p className="text-xs text-green-600/80 mt-1">
              {stats.total > 0
                ? `${Math.round(
                    (stats.completed / stats.total) * 100
                  )}% of total`
                : "No tasks"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border-yellow-200/20 hover:shadow-lg transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-yellow-600">
            Pending Tasks
          </CardTitle>
          <div className="p-2 bg-yellow-100 rounded-full">
            <Clock className="h-4 w-4 text-yellow-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-yellow-600">
            {stats.pending}
          </div>
          <div className="mt-2">
            <Progress
              value={stats.total > 0 ? (stats.pending / stats.total) * 100 : 0}
              className="h-2 bg-yellow-100"
            />
            <p className="text-xs text-yellow-600/80 mt-1">
              {stats.total > 0
                ? `${Math.round((stats.pending / stats.total) * 100)}% of total`
                : "No tasks"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-200/20 hover:shadow-lg transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-red-600">
            Overdue Tasks
          </CardTitle>
          <div className="p-2 bg-red-100 rounded-full">
            <AlertCircle className="h-4 w-4 text-red-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-red-600">{stats.overdue}</div>
          <div className="mt-2">
            <Progress
              value={stats.total > 0 ? (stats.overdue / stats.total) * 100 : 0}
              className="h-2 bg-red-100"
            />
            <p className="text-xs text-red-600/80 mt-1">
              {stats.total > 0
                ? `${Math.round((stats.overdue / stats.total) * 100)}% of total`
                : "No tasks"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
