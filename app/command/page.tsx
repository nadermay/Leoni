"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Search, Filter, ChevronDown, ChevronUp } from "lucide-react";
import OrderTable from "@/components/orders/OrderTable";
import OrderForm from "@/components/orders/OrderForm";
import { Order } from "@/types/order";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const categories = [
  {
    id: "testing",
    label: "Testing",
    icon: "🧪",
    color: "bg-blue-100 text-blue-800",
  },
  {
    id: "assemblage",
    label: "Assemblage",
    icon: "🔧",
    color: "bg-purple-100 text-purple-800",
  },
  {
    id: "connecting",
    label: "Connecting",
    icon: "🔌",
    color: "bg-green-100 text-green-800",
  },
  {
    id: "cutting-wpa",
    label: "Cutting/WPA",
    icon: "✂️",
    color: "bg-orange-100 text-orange-800",
  },
];

export default function CommandPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("testing");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    status: [] as string[],
    requester: [] as string[],
    project: [] as string[],
  });

  useEffect(() => {
    fetchOrders();
  }, [selectedCategory, filters]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        category: selectedCategory,
        ...(searchQuery && { search: searchQuery }),
        ...(filters.status.length > 0 && { status: filters.status.join(",") }),
        ...(filters.requester.length > 0 && {
          requester: filters.requester.join(","),
        }),
        ...(filters.project.length > 0 && {
          project: filters.project.join(","),
        }),
      });

      const response = await fetch(`/api/orders?${queryParams}`);
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderCreated = () => {
    setIsFormOpen(false);
    fetchOrders();
  };

  const getOrderStats = () => {
    const total = orders.length;
    const completed = orders.filter((order) => order.done).length;
    const pending = orders.filter((order) => !order.done).length;
    const expired = orders.filter(
      (order) => new Date(order.deadline) < new Date() && !order.done
    ).length;

    return { total, completed, pending, expired };
  };

  const stats = getOrderStats();
  const completionRate =
    stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Command Management
          </h1>
          <p className="text-muted-foreground">
            Manage and track all your orders in one place
          </p>
        </div>
        <Button
          onClick={() => setIsFormOpen(true)}
          className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="h-4 w-4" />
          New Order
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid gap-4 md:grid-cols-4"
      >
        <Card className="p-4 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Orders
              </p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Badge variant="outline" className="text-lg bg-blue-50">
              📋
            </Badge>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Completed
              </p>
              <p className="text-2xl font-bold text-green-600">
                {stats.completed}
              </p>
            </div>
            <Badge variant="outline" className="text-lg bg-green-50">
              ✅
            </Badge>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Pending
              </p>
              <p className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </p>
            </div>
            <Badge variant="outline" className="text-lg bg-yellow-50">
              ⏳
            </Badge>
          </div>
        </Card>
        <Card className="p-4 hover:shadow-lg transition-shadow duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Expired
              </p>
              <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
            </div>
            <Badge variant="outline" className="text-lg bg-red-50">
              ⚠️
            </Badge>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {isFilterOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="p-2">
                <p className="text-sm font-medium mb-2">Status</p>
                {["pending", "in-progress", "completed", "expired"].map(
                  (status) => (
                    <DropdownMenuCheckboxItem
                      key={status}
                      checked={filters.status.includes(status)}
                      onCheckedChange={(checked) => {
                        setFilters((prev) => ({
                          ...prev,
                          status: checked
                            ? [...prev.status, status]
                            : prev.status.filter((s) => s !== status),
                        }));
                      }}
                    >
                      {status}
                    </DropdownMenuCheckboxItem>
                  )
                )}
              </div>
              <DropdownMenuSeparator />
              <div className="p-2">
                <p className="text-sm font-medium mb-2">Projects</p>
                {Array.from(new Set(orders.map((order) => order.project))).map(
                  (project) => (
                    <DropdownMenuCheckboxItem
                      key={project}
                      checked={filters.project.includes(project)}
                      onCheckedChange={(checked) => {
                        setFilters((prev) => ({
                          ...prev,
                          project: checked
                            ? [...prev.project, project]
                            : prev.project.filter((p) => p !== project),
                        }));
                      }}
                    >
                      {project}
                    </DropdownMenuCheckboxItem>
                  )
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Completion Rate</span>
            <span>{Math.round(completionRate)}%</span>
          </div>
          <Progress value={completionRate} className="h-2" />
        </div>
      </motion.div>

      <Tabs defaultValue="testing" onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-4">
          {categories.map((category) => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className={cn("gap-2", category.color)}
            >
              <span className="text-lg">{category.icon}</span>
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <AnimatePresence mode="wait">
          {categories.map((category) => (
            <TabsContent key={category.id} value={category.id} className="mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <OrderTable
                  orders={orders.filter(
                    (order) => order.category === category.id
                  )}
                  loading={loading}
                  onOrderUpdated={fetchOrders}
                />
              </motion.div>
            </TabsContent>
          ))}
        </AnimatePresence>
      </Tabs>

      <OrderForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onOrderCreated={handleOrderCreated}
        defaultCategory={selectedCategory}
      />
    </div>
  );
}
