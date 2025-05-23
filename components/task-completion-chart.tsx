"use client";

import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useTaskContext } from "@/contexts/task-context";
import { format, parseISO, isValid, startOfDay } from "date-fns";

interface TaskCompletionChartProps {
  isAdmin: boolean;
  timeRange: string;
  userFilter?: string;
}

export const TaskCompletionChart = forwardRef<any, TaskCompletionChartProps>(
  ({ isAdmin, timeRange, userFilter = "all" }, ref) => {
    const { tasks, currentUser } = useTaskContext();
    const chartContainerRef = useRef<HTMLDivElement>(null);

    // Generate data based on time range and user filter
    const generateData = () => {
      const days =
        timeRange === "7days"
          ? 7
          : timeRange === "30days"
          ? 30
          : timeRange === "90days"
          ? 90
          : 365;
      const dataPoints = timeRange === "year" ? 12 : days;

      // Generate dates
      const dates = Array.from({ length: dataPoints }, (_, i) => {
        const date = new Date();
        if (timeRange === "year") {
          date.setMonth(date.getMonth() - (dataPoints - i - 1));
          return format(date, "MMM");
        } else {
          date.setDate(date.getDate() - (dataPoints - i - 1));
          return format(date, "MMM dd");
        }
      });

      // Filter tasks based on user and time range
      const filteredTasks = tasks.filter((task) => {
        // Filter by user if not admin or if specific user is selected
        if (!isAdmin) {
          if (task.pilotes !== currentUser?.name) return false;
        } else if (userFilter !== "all" && task.pilotes !== userFilter) {
          return false;
        }

        // Filter by date range
        const taskDate = task.createdAt || task.delaiRealisation;
        if (!taskDate) return false;

        const parsedDate = parseISO(taskDate);
        if (!isValid(parsedDate)) return false;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        return parsedDate >= startDate;
      });

      // Calculate completion rates for each date and PDCA stage
      return dates.map((date) => {
        const baseObj: any = { date };
        const dateTasks = filteredTasks.filter((task) => {
          const taskDate = task.createdAt || task.delaiRealisation;
          if (!taskDate) return false;

          const parsedDate = parseISO(taskDate);
          if (!isValid(parsedDate)) return false;

          return (
            format(parsedDate, timeRange === "year" ? "MMM" : "MMM dd") === date
          );
        });

        // Calculate completion rate for each PDCA stage
        const stages = ["Planning", "Execution", "Checking", "Acting"];
        stages.forEach((stage) => {
          const stageTasks = dateTasks.filter(
            (task) => task.pdcaStage === stage
          );
          const completedTasks = stageTasks.filter(
            (task) => task.status === "completed"
          );
          const completionRate =
            stageTasks.length > 0
              ? Math.round((completedTasks.length / stageTasks.length) * 100)
              : 0;
          baseObj[stage] = completionRate;
        });

        return baseObj;
      });
    };

    const [data, setData] = useState(generateData());

    // Expose the exportChart method to parent components
    useImperativeHandle(ref, () => ({
      exportChart: () => {
        if (!chartContainerRef.current) return;

        html2canvas(chartContainerRef.current).then((canvas) => {
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF("landscape", "mm", "a4");
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
          pdf.save("task-completion-chart.pdf");
        });
      },
    }));

    // Refresh data when filters or tasks change
    useEffect(() => {
      setData(generateData());
    }, [timeRange, userFilter, isAdmin, tasks, currentUser]);

    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="rounded-lg border bg-background p-2 shadow-sm">
            <p className="font-medium">{label}</p>
            {payload.map((entry: any, index: number) => (
              <p key={index} style={{ color: entry.color }}>
                {entry.name}: {entry.value}%
              </p>
            ))}
          </div>
        );
      }
      return null;
    };

    return (
      <div className="h-[400px] w-full" ref={chartContainerRef}>
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
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              interval={Math.ceil(data.length / 8)}
            />
            <YAxis
              label={{
                value: "Completion %",
                angle: -90,
                position: "insideLeft",
              }}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="Planning"
              stroke="#8884d8"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 8 }}
            />
            <Line
              type="monotone"
              dataKey="Execution"
              stroke="#82ca9d"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="Checking"
              stroke="#ffc658"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="Acting"
              stroke="#ff8042"
              strokeWidth={2}
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }
);

TaskCompletionChart.displayName = "TaskCompletionChart";
