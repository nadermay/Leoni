"use client";

import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "@/components/ui/chart";
import { useTaskContext } from "@/contexts/task-context";

interface TaskTypeDistributionProps {
  isAdmin: boolean;
  userFilter?: string;
  period?: string;
}

export function TaskTypeDistribution({
  isAdmin,
  userFilter = "all",
  period = "30days",
}: TaskTypeDistributionProps) {
  const { tasks, currentUser } = useTaskContext();

  // Generate data based on period and filters
  const generateData = () => {
    // Calculate days based on period
    const days =
      period === "7days"
        ? 7
        : period === "30days"
        ? 30
        : period === "90days"
        ? 90
        : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Filter tasks based on user and time period
    const filteredTasks = tasks.filter((task) => {
      // Filter by user if not admin or if specific user is selected
      if (!isAdmin) {
        if (task.pilotes !== currentUser?.name) return false;
      } else if (userFilter !== "all" && task.pilotes !== userFilter) {
        return false;
      }

      // Filter by date range
      const taskDate = new Date(task.createdAt || task.delaiRealisation);
      return taskDate >= startDate;
    });

    // Count tasks by PDCA stage
    const stageCounts = {
      Planning: 0,
      Execution: 0,
      Checking: 0,
      Acting: 0,
    };

    filteredTasks.forEach((task) => {
      if (task.pdcaStage in stageCounts) {
        stageCounts[task.pdcaStage as keyof typeof stageCounts]++;
      }
    });

    // Convert to chart data format
    return [
      { name: "Planning", value: stageCounts.Planning, color: "#8884d8" },
      { name: "Execution", value: stageCounts.Execution, color: "#82ca9d" },
      { name: "Checking", value: stageCounts.Checking, color: "#ffc658" },
      { name: "Acting", value: stageCounts.Acting, color: "#ff8042" },
    ];
  };

  const [data, setData] = useState(generateData());

  // Update data when period, filters, or tasks change
  useEffect(() => {
    setData(generateData());
  }, [period, userFilter, isAdmin, tasks, currentUser]);

  return (
    <div className="h-[400px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={true}
            outerRadius={150}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percent }) =>
              `${name}: ${(percent * 100).toFixed(0)}%`
            }
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} tasks`, "Count"]} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
