"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTaskContext } from "@/contexts/task-context";
import { format } from "date-fns";

interface TaskDashboardProps {
  isAdmin: boolean;
}

export function TaskDashboard({ isAdmin }: TaskDashboardProps) {
  const { tasks, currentUser } = useTaskContext();

  // Filter tasks based on user role
  const filteredTasks = useMemo(() => {
    if (!isAdmin && currentUser?.name) {
      return tasks.filter((task) => task.pilotes === currentUser.name);
    }
    return tasks;
  }, [tasks, isAdmin, currentUser]);

  // Prepare data for area chart (tasks over time)
  const areaChartData = useMemo(() => {
    const taskCounts = filteredTasks.reduce((acc, task) => {
      // Check if createdAt exists, otherwise use current date
      const createdAt = task.createdAt ? new Date(task.createdAt) : new Date();
      const date = format(createdAt, "MMM dd");
      if (!acc[date]) {
        acc[date] = { total: 0, completed: 0 };
      }
      acc[date].total++;
      // Check if status exists and is "completed"
      if (task.status === "completed") {
        acc[date].completed++;
      }
      return acc;
    }, {} as Record<string, { total: number; completed: number }>);

    return Object.entries(taskCounts)
      .map(([date, counts]) => ({
        date,
        total: counts.total,
        completed: counts.completed,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [filteredTasks]);

  // Prepare data for bar chart (tasks by user/status)
  const barChartData = useMemo(() => {
    if (isAdmin) {
      // For admins: show tasks by user
      const userTasks = filteredTasks.reduce((acc, task) => {
        // Check if pilotes exists, otherwise use "Unknown"
        const pilotes = task.pilotes || "Unknown";
        if (!acc[pilotes]) {
          acc[pilotes] = { completed: 0, total: 0 };
        }
        acc[pilotes].total++;
        // Check if status exists and is "completed"
        if (task.status === "completed") {
          acc[pilotes].completed++;
        }
        return acc;
      }, {} as Record<string, { completed: number; total: number }>);

      return Object.entries(userTasks).map(([user, counts]) => ({
        name: user,
        completed: counts.completed,
        total: counts.total,
      }));
    } else {
      // For normal users: show tasks by status
      const statusCounts = filteredTasks.reduce((acc, task) => {
        // Check if status exists, otherwise use "unknown"
        const status = task.status || "unknown";
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return Object.entries(statusCounts).map(([status, count]) => ({
        name: status,
        count,
      }));
    }
  }, [filteredTasks, isAdmin]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Area Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Tasks Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={areaChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Total Tasks"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  name="Completed Tasks"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{isAdmin ? "Tasks by User" : "Tasks by Status"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {isAdmin ? (
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="completed" name="Completed" fill="#82ca9d" />
                  <Bar dataKey="total" name="Total" fill="#8884d8" />
                </BarChart>
              ) : (
                <BarChart data={barChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
