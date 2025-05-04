"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "@/components/ui/chart";
import { useTaskContext } from "@/contexts/task-context";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface UserPerformanceChartProps {
  isAdmin: boolean;
  timeRange: string;
  userFilter?: string;
}

export function UserPerformanceChart({
  isAdmin,
  timeRange,
  userFilter = "all",
}: UserPerformanceChartProps) {
  const { tasks, users, currentUser, isLoading } = useTaskContext();
  const chartRef = useRef<HTMLDivElement>(null);
  const [isChartLoading, setIsChartLoading] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);

  // Enhanced data generation with error handling
  const generateData = useCallback(() => {
    try {
      const days = timeRange === "7days" ? 7 : timeRange === "30days" ? 30 : 90;
      const dates = Array.from({ length: days }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (days - i - 1));
        return date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      });

      if (isAdmin && userFilter === "all") {
        const userPerformance = users.reduce((acc, user) => {
          acc[user.name] = dates.map((date) => {
            const userTasks = tasks.filter((task) => {
              if (!task.createdAt && !task.delaiRealisation) return false;
              const taskDate = new Date(
                task.createdAt || task.delaiRealisation
              );
              return (
                task.pilotes === user.name &&
                taskDate.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                }) === date
              );
            });

            if (userTasks.length === 0) return 0;

            const completedTasks = userTasks.filter(
              (task) => task.status === "completed"
            );
            return Math.round((completedTasks.length / userTasks.length) * 100);
          });
          return acc;
        }, {} as Record<string, number[]>);

        return dates.map((date, index) => ({
          date,
          ...Object.fromEntries(
            Object.entries(userPerformance).map(([user, values]) => [
              user,
              values[index],
            ])
          ),
        }));
      } else {
        const userName = isAdmin
          ? userFilter
          : currentUser?.name || "Your Performance";
        const userTasks = tasks.filter((task) => {
          if (isAdmin) {
            return task.pilotes === userFilter;
          } else {
            return task.pilotes === currentUser?.name;
          }
        });

        return dates.map((date) => {
          const tasksForDate = userTasks.filter((task) => {
            if (!task.createdAt && !task.delaiRealisation) return false;
            const taskDate = new Date(task.createdAt || task.delaiRealisation);
            return (
              taskDate.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              }) === date
            );
          });

          const completedTasks = tasksForDate.filter(
            (task) => task.status === "completed"
          );
          const completionRate =
            tasksForDate.length > 0
              ? Math.round((completedTasks.length / tasksForDate.length) * 100)
              : 0;

          return {
            date,
            [userName]: completionRate,
          };
        });
      }
    } catch (error) {
      console.error("Error generating chart data:", error);
      setChartError("Failed to generate performance data");
      return [];
    }
  }, [tasks, users, currentUser, isAdmin, userFilter, timeRange]);

  const [data, setData] = useState(generateData());

  // Update data when dependencies change
  useEffect(() => {
    setIsChartLoading(true);
    setChartError(null);
    try {
      setData(generateData());
    } catch (error) {
      setChartError("Failed to update performance data");
    } finally {
      setIsChartLoading(false);
    }
  }, [timeRange, userFilter, isAdmin, tasks, users, currentUser, generateData]);

  // Loading and error states
  if (isLoading || isChartLoading) {
    return (
      <div className="flex items-center justify-center h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (chartError) {
    return (
      <div className="flex items-center justify-center h-[300px] text-red-500">
        {chartError}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No performance data available
      </div>
    );
  }

  // Determine which lines to show based on the view
  const getLines = () => {
    if (isAdmin && userFilter === "all") {
      return users.map((user, index) => {
        const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088fe"];
        return (
          <Line
            key={user.name}
            type="monotone"
            dataKey={user.name}
            stroke={colors[index % colors.length]}
            activeDot={{ r: 8 }}
          />
        );
      });
    } else {
      const userName = isAdmin ? userFilter : "Your Performance";
      return [
        <Line
          key={userName}
          type="monotone"
          dataKey={userName}
          stroke="#8884d8"
          activeDot={{ r: 8 }}
        />,
      ];
    }
  };

  const handlePrint = async () => {
    if (!chartRef.current) return;

    try {
      // Create a temporary container for the chart
      const tempContainer = document.createElement("div");
      tempContainer.style.width = "1200px"; // Fixed width for better quality
      tempContainer.style.height = "600px"; // Fixed height for better quality
      tempContainer.style.backgroundColor = "white";
      tempContainer.style.padding = "20px";
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      document.body.appendChild(tempContainer);

      // Clone the chart content
      const chartContent = chartRef.current.cloneNode(true) as HTMLElement;
      chartContent.style.width = "100%";
      chartContent.style.height = "100%";
      tempContainer.appendChild(chartContent);

      // Capture the chart
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Remove the temporary container
      document.body.removeChild(tempContainer);

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Calculate dimensions
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // Leave margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Add header with title and information
      pdf.setFillColor(240, 240, 240);
      pdf.rect(0, 0, pdfWidth, 25, "F");

      // Title
      const title = isAdmin
        ? `Performance Report - ${
            userFilter === "all" ? "All Users" : userFilter
          }`
        : "Your Performance Report";
      pdf.setFontSize(18);
      pdf.setTextColor(33, 33, 33);
      pdf.text(title, 15, 15);

      // Add metadata section
      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Time Range: ${timeRange}`, 15, 35);
      pdf.text(
        `Generated: ${new Date().toLocaleDateString()}`,
        pdfWidth - 60,
        35
      );

      // Add the chart image with proper spacing
      pdf.addImage(
        imgData,
        "PNG",
        10, // x position (left margin)
        45, // y position (below header)
        imgWidth, // width
        imgHeight, // height
        undefined,
        "FAST"
      );

      // Add footer
      const footerY = 45 + imgHeight + 10;
      pdf.setFillColor(240, 240, 240);
      pdf.rect(0, footerY, pdfWidth, 10, "F");
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        "This report was automatically generated by the Performance Dashboard",
        15,
        footerY + 6
      );

      // Save the PDF
      pdf.save(
        `performance-report-${new Date().toISOString().split("T")[0]}.pdf`
      );
    } catch (error) {
      console.error("Error generating PDF:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={handlePrint}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Printer className="h-4 w-4" />
          Export PDF
        </Button>
      </div>
      <div
        ref={chartRef}
        className="h-[300px] w-full bg-white p-4 rounded-lg shadow-sm"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} interval={0} />
            <YAxis
              label={{
                value: "Completion %",
                angle: -90,
                position: "insideLeft",
              }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip />
            <Legend />
            {getLines()}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
