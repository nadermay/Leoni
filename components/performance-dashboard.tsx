"use client";

import { useState, useRef, useEffect, useId } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Download,
  RefreshCw,
  TrendingUp,
  Clock,
  Users,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TaskCompletionChart } from "@/components/task-completion-chart";
import { TaskTypeDistribution } from "@/components/task-type-distribution";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTaskContext } from "@/contexts/task-context";
import { useOrders } from "@/contexts/order-context";
import {
  format,
  subDays,
  parseISO,
  differenceInDays,
  startOfMonth,
  endOfMonth,
} from "date-fns";

interface PerformanceDashboardProps {
  isAdmin?: boolean;
}

export function PerformanceDashboard({
  isAdmin = true,
}: PerformanceDashboardProps) {
  const { toast } = useToast();
  const chartRef = useRef(null);
  const [timeRange, setTimeRange] = useState("30days");
  const [userFilter, setUserFilter] = useState("all");
  const [distributionPeriod, setDistributionPeriod] = useState("30days");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {
    tasks,
    users,
    currentUser,
    registerUserListener,
    unregisterUserListener,
  } = useTaskContext();
  const {
    orders,
    isLoading: ordersLoading,
    fetchOrders,
    getOrderStats,
  } = useOrders();

  // Generate unique ID for listener
  const userListenerId = useId();

  // Register listener for real-time updates
  useEffect(() => {
    registerUserListener(userListenerId, () => {
      console.log("User update detected in PerformanceDashboard");
    });

    return () => {
      unregisterUserListener(userListenerId);
    };
  }, [registerUserListener, unregisterUserListener, userListenerId]);

  // Filter active users for the dropdown
  const activeUsers = users?.filter((user) => user.status === "active") ?? [];

  // Calculate order metrics
  const calculateOrderMetrics = () => {
    const now = new Date();
    const days =
      timeRange === "7days"
        ? 7
        : timeRange === "30days"
        ? 30
        : timeRange === "90days"
        ? 90
        : 365;
    const startDate = subDays(now, days);

    const filteredOrders = orders.filter((order) => {
      const orderDate = order.orderCreationDate
        ? new Date(order.orderCreationDate)
        : null;
      return orderDate && orderDate >= startDate;
    });

    // Calculate monthly distribution
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const date = subDays(now, i * 30);
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);

      const monthOrders = filteredOrders.filter((order) => {
        const orderDate = new Date(order.orderCreationDate);
        return orderDate >= monthStart && orderDate <= monthEnd;
      });

      return {
        month: format(monthStart, "MMM yyyy"),
        total: monthOrders.length,
        completed: monthOrders.filter((o) => o.done).length,
        inProgress: monthOrders.filter((o) => !o.done).length,
        value: monthOrders.reduce(
          (sum, order) => sum + (order.totalPrice || 0),
          0
        ),
      };
    }).reverse();

    // Get process distribution
    const stats = getOrderStats();
    const processData = Object.entries(stats.byProcess).map(
      ([process, count]) => ({
        name: process,
        value: count,
      })
    );

    // Get supplier distribution
    const supplierData = Object.entries(stats.bySupplier)
      .map(([supplier, count]) => ({
        name: supplier,
        value: count,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 suppliers

    return {
      monthlyData,
      processData,
      supplierData,
      totalOrders: stats.total,
      completedOrders: stats.completed,
      totalValue: stats.totalValue,
    };
  };

  const orderMetrics = calculateOrderMetrics();

  // Simulate data refresh
  const refreshData = async () => {
    setIsRefreshing(true);
    await fetchOrders();
    setIsRefreshing(false);
  };

  // Colors for charts
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Resource Utilization Dashboard
          </h1>
          <p className="text-muted-foreground">
            Analyze order processing and resource allocation
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={refreshData}
            disabled={isRefreshing || ordersLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span className="sr-only">Refresh data</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderMetrics.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {orderMetrics.completedOrders} completed
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${orderMetrics.totalValue?.toLocaleString() ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Total order value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completion Rate
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(
                (orderMetrics.completedOrders / orderMetrics.totalOrders) *
                100
              ).toFixed(1)}
              %
            </div>
            <p className="text-xs text-muted-foreground">
              Orders completed successfully
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Monthly Order Distribution</CardTitle>
            <CardDescription>
              Order volume and completion status over time
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={orderMetrics.monthlyData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient
                      id="colorCompleted"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <p className="font-medium">{label}</p>
                            <p className="text-sm">
                              Total Orders: {payload[0].value}
                            </p>
                            <p className="text-sm">
                              Completed: {payload[1].value}
                            </p>
                            <p className="text-sm">
                              Value: ${payload[2]?.value?.toLocaleString() ?? 0}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#8884d8"
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                  />
                  <Area
                    type="monotone"
                    dataKey="completed"
                    stroke="#82ca9d"
                    fillOpacity={1}
                    fill="url(#colorCompleted)"
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#ffc658"
                    fill="#ffc658"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Process Distribution</CardTitle>
            <CardDescription>Orders by process type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={orderMetrics.processData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {orderMetrics.processData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Suppliers</CardTitle>
          <CardDescription>Order distribution by supplier</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={orderMetrics.supplierData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <p className="font-medium">{label}</p>
                          <p className="text-sm">Orders: {payload[0].value}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="value" fill="#8884d8">
                  {orderMetrics.supplierData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
