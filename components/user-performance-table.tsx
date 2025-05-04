"use client";

import { useMemo } from "react";
import { Task } from "@/types/task";

interface UserPerformanceTableProps {
  tasks: Task[];
}

interface UserPerformance {
  name: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  averageCompletionTime: number;
  overdueTasks: number;
}

export function UserPerformanceTable({ tasks }: UserPerformanceTableProps) {
  const userPerformance = useMemo(() => {
    const userMap = new Map<string, UserPerformance>();

    tasks.forEach((task) => {
      const user = task.assignedTo;
      if (!user) return;

      if (!userMap.has(user)) {
        userMap.set(user, {
          name: user,
          totalTasks: 0,
          completedTasks: 0,
          completionRate: 0,
          averageCompletionTime: 0,
          overdueTasks: 0,
        });
      }

      const userData = userMap.get(user)!;
      userData.totalTasks++;

      if (task.status === "completed") {
        userData.completedTasks++;
        if (task.completedAt && task.dueDate) {
          const completionTime =
            new Date(task.completedAt).getTime() -
            new Date(task.dueDate).getTime();
          userData.averageCompletionTime =
            (userData.averageCompletionTime * (userData.completedTasks - 1) +
              completionTime) /
            userData.completedTasks;
        }
      }

      if (task.status === "overdue") {
        userData.overdueTasks++;
      }

      userData.completionRate =
        (userData.completedTasks / userData.totalTasks) * 100;
    });

    return Array.from(userMap.values()).sort(
      (a, b) => b.completionRate - a.completionRate
    );
  }, [tasks]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="px-4 py-2 text-left">User</th>
            <th className="px-4 py-2 text-right">Total Tasks</th>
            <th className="px-4 py-2 text-right">Completed</th>
            <th className="px-4 py-2 text-right">Completion Rate</th>
            <th className="px-4 py-2 text-right">Avg. Time</th>
            <th className="px-4 py-2 text-right">Overdue</th>
          </tr>
        </thead>
        <tbody>
          {userPerformance.map((user) => (
            <tr key={user.name} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2">{user.name}</td>
              <td className="px-4 py-2 text-right">{user.totalTasks}</td>
              <td className="px-4 py-2 text-right">{user.completedTasks}</td>
              <td className="px-4 py-2 text-right">
                {user.completionRate.toFixed(1)}%
              </td>
              <td className="px-4 py-2 text-right">
                {user.averageCompletionTime > 0
                  ? `${(
                      user.averageCompletionTime /
                      (1000 * 60 * 60 * 24)
                    ).toFixed(1)} days`
                  : "-"}
              </td>
              <td className="px-4 py-2 text-right">{user.overdueTasks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
