"use client";

import { Order } from "@/types/order";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { OrderDetails } from "./order-details";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface OrderTableProps {
  orders: Order[];
  loading: boolean;
  onOrderUpdated: () => void;
}

const processStages = [
  { id: "testing", label: "Testing" },
  { id: "assemblage", label: "Assemblage" },
  { id: "connecting", label: "Connecting" },
  { id: "cutting/wpa", label: "Cutting/WPA" },
];

export function OrderTable({
  orders,
  loading,
  onOrderUpdated,
}: OrderTableProps) {
  const { toast } = useToast();
  const [selectedProcess, setSelectedProcess] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null);

  const filteredOrders =
    selectedProcess === "all"
      ? orders
      : orders.filter((order) => {
          // Convert both values to lowercase for case-insensitive comparison
          const orderProcess = order.process?.toLowerCase();
          const selectedProcessLower = selectedProcess.toLowerCase();
          return orderProcess === selectedProcessLower;
        });

  const recentOrders = filteredOrders.slice(0, 7);
  const remainingOrders = filteredOrders.slice(7);

  // Summary counts
  const totalOrders = filteredOrders.length;
  const doneOrders = filteredOrders.filter((o) => o.done).length;
  const inProgressOrders = filteredOrders.filter((o) => !o.done).length;

  const getStatusDisplay = (order: Order) => {
    if (order.done) return "Done";
    const deadline = new Date(order.deadline);
    const now = new Date();
    return deadline < now ? "Overdue" : "In Progress";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Done":
        return "bg-green-100 text-green-800";
      case "Overdue":
        return "bg-red-100 text-red-800";
      case "In Progress":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProcessColor = (process: string) => {
    switch (process.toLowerCase()) {
      case "testing":
        return "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 transition-colors";
      case "assemblage":
        return "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 transition-colors";
      case "connecting":
        return "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200 transition-colors";
      case "cutting/wpa":
        return "bg-green-100 text-green-800 border-green-200 hover:bg-green-200 transition-colors";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 transition-colors";
    }
  };

  const getProcessLabel = (process: string) => {
    const stage = processStages.find(
      (s) => s.id.toLowerCase() === process.toLowerCase()
    );
    return stage ? stage.label : process;
  };

  const handleStatusChange = async (orderId: string, checked: boolean) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          done: checked,
          status: checked ? "done" : "in-progress",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      toast({
        title: "Success",
        description: `Order marked as ${checked ? "done" : "in progress"}`,
      });

      onOrderUpdated();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete order");
      }

      toast({
        title: "Success",
        description: "Order deleted successfully",
      });

      onOrderUpdated();
    } catch (error) {
      console.error("Error deleting order:", error);
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
        <span className="ml-4 text-lg text-gray-600">Loading orders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
        <h2 className="text-xl font-bold tracking-tight">Orders</h2>
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <div className="flex gap-3 text-sm text-gray-600 bg-gray-50 rounded-lg px-4 py-2 border">
            <span>
              Total:{" "}
              <span className="font-semibold text-gray-900">{totalOrders}</span>
            </span>
            <span>
              Done:{" "}
              <span className="font-semibold text-green-700">{doneOrders}</span>
            </span>
            <span>
              In Progress:{" "}
              <span className="font-semibold text-yellow-700">
                {inProgressOrders}
              </span>
            </span>
          </div>
          <Select value={selectedProcess} onValueChange={setSelectedProcess}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by process" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Processes</SelectItem>
              {processStages.map((stage) => (
                <SelectItem
                  key={stage.id}
                  value={stage.id.toLowerCase()}
                  className={getProcessColor(stage.id)}
                >
                  {stage.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="h-[500px] rounded-xl border bg-white shadow-md overflow-x-auto">
        <Table className="min-w-[900px]">
          <TableHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b">
            <TableRow>
              <TableHead className="py-3 px-4">Status</TableHead>
              <TableHead className="py-3 px-4">Order Number</TableHead>
              <TableHead className="py-3 px-4">Project</TableHead>
              <TableHead className="py-3 px-4">Requester</TableHead>
              <TableHead className="py-3 px-4">Description</TableHead>
              <TableHead className="py-3 px-4">Category</TableHead>
              <TableHead className="py-3 px-4">Process</TableHead>
              <TableHead className="py-3 px-4">Deadline</TableHead>
              <TableHead className="py-3 px-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-16 text-gray-400"
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-4xl">📦</span>
                    <span className="text-lg">
                      No orders found for this filter.
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {[...recentOrders, ...remainingOrders].map((order, idx) => (
              <TableRow
                key={order._id}
                className={
                  idx % 2 === 0
                    ? "bg-gray-50 hover:bg-blue-50 transition-colors"
                    : "bg-white hover:bg-blue-50 transition-colors"
                }
              >
                <TableCell className="py-3 px-4">
                  <label
                    className="sr-only"
                    htmlFor={`order-done-${order._id}`}
                  >
                    Mark as done
                  </label>
                  <Checkbox
                    id={`order-done-${order._id}`}
                    checked={order.done}
                    onCheckedChange={(checked) =>
                      handleStatusChange(order._id, checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell className="py-3 px-4 font-mono font-semibold text-blue-900">
                  {order.orderNumber}
                </TableCell>
                <TableCell className="py-3 px-4">{order.project}</TableCell>
                <TableCell className="py-3 px-4">{order.requester}</TableCell>
                <TableCell
                  className="py-3 px-4 truncate max-w-xs"
                  title={order.description}
                >
                  {order.description}
                </TableCell>
                <TableCell className="py-3 px-4">{order.category}</TableCell>
                <TableCell className="py-3 px-4">
                  <div className="flex flex-col gap-2">
                    <Badge className={getStatusColor(getStatusDisplay(order))}>
                      {getStatusDisplay(order)}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`${getProcessColor(
                        order.process
                      )} px-3 py-1 rounded-full font-medium`}
                    >
                      {getProcessLabel(order.process)}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="py-3 px-4">
                  {new Date(order.deadline).toLocaleDateString()}
                </TableCell>
                <TableCell className="py-3 px-4">
                  <TooltipProvider>
                    <div className="flex space-x-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            aria-label="View order"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDetailsOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>View</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            aria-label="Edit order"
                            onClick={() => {
                              setSelectedOrder(order);
                              setIsDetailsOpen(true);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Edit</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            aria-label="Delete order"
                            onClick={() => handleDelete(order._id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete</TooltipContent>
                      </Tooltip>
                    </div>
                  </TooltipProvider>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>

      <OrderDetails
        order={selectedOrder}
        open={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedOrder(null);
        }}
        onOrderUpdated={onOrderUpdated}
      />

      <AlertDialog
        open={!!orderToDelete}
        onOpenChange={() => setOrderToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (orderToDelete) {
                  handleDelete(orderToDelete._id);
                  setOrderToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
