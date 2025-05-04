"use client";

import { useMemo, useEffect } from "react";
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
import {
  format,
  parseISO,
  isValid,
  startOfDay,
  compareAsc,
  subDays,
} from "date-fns";

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
    try {
      // Get the date range (last 2 days)
      const endDate = startOfDay(new Date());
      const startDate = subDays(endDate, 1); // 1 day ago to get 2 days total

      // Create an array of the 2 days
      const dateArray = Array.from({ length: 2 }, (_, index) => {
        const currentDate = subDays(endDate, 1 - index);
        return format(currentDate, "MMM dd");
      });

      // Initialize the data structure with both dates
      const tasksByDate = dateArray.reduce((acc, date) => {
        acc[date] = { total: 0, completed: 0 };
        return acc;
      }, {} as Record<string, { total: number; completed: number }>);

      // Process each task
      filteredTasks.forEach((task) => {
        try {
          // Try to get a valid date from the task
          let taskDate: Date | null = null;

          // First try createdAt
          if (task.createdAt) {
            // Handle both string and Date objects from MongoDB
            if (typeof task.createdAt === "string") {
              taskDate = new Date(task.createdAt);
            } else {
              taskDate = new Date(task.createdAt);
            }
          }

          // If no valid date from createdAt, try delaiRealisation
          if (!taskDate && task.delaiRealisation) {
            if (typeof task.delaiRealisation === "string") {
              taskDate = new Date(task.delaiRealisation);
            } else {
              taskDate = new Date(task.delaiRealisation);
            }
          }

          // Skip if we couldn't get a valid date
          if (!taskDate || !isValid(taskDate)) {
            return;
          }

          // Only count tasks from the last 2 days
          const taskStartOfDay = startOfDay(taskDate);
          if (taskStartOfDay >= startDate && taskStartOfDay <= endDate) {
            const dateKey = format(taskDate, "MMM dd");
            if (tasksByDate[dateKey]) {
              tasksByDate[dateKey].total++;
              if (task.status === "completed") {
                tasksByDate[dateKey].completed++;
              }
            }
          }
        } catch (error) {
          console.error("Error processing task:", task, error);
        }
      });

      // Convert to array format for the chart
      const chartData = dateArray.map((date) => ({
        date,
        ...tasksByDate[date],
      }));

      return chartData;
    } catch (error) {
      console.error("Error generating area chart data:", error);
      return [];
    }
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

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value} tasks
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
          <CardTitle>Tasks Over Time (Last 2 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {areaChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={areaChartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="totalGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop
                        offset="95%"
                        stopColor="#8884d8"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                    <linearGradient
                      id="completedGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                      <stop
                        offset="95%"
                        stopColor="#82ca9d"
                        stopOpacity={0.1}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total Tasks"
                    stroke="#8884d8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#totalGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    name="Completed Tasks"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#completedGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <p>No task data available</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Tasks will appear here once created
                  </p>
                </div>
              </div>
            )}
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
