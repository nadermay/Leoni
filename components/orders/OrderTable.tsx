"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Eye,
  Pencil,
  Trash2,
  Clock,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { Order } from "@/types/order";
import { format, isToday, isTomorrow } from "date-fns";
import { useSession } from "next-auth/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface OrderTableProps {
  orders: Order[];
  loading: boolean;
  onOrderUpdated: () => void;
}

export default function OrderTable({
  orders,
  loading,
  onOrderUpdated,
}: OrderTableProps) {
  const { data: session } = useSession();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const handleDoneChange = async (order: Order, done: boolean) => {
    try {
      const response = await fetch(`/api/orders/${order._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ done }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order");
      }

      onOrderUpdated();
    } catch (error) {
      console.error("Error updating order:", error);
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

      onOrderUpdated();
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };

  const isExpired = (deadline: Date) => {
    return new Date(deadline) < new Date();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge
            variant="success"
            className="gap-1 bg-green-100 text-green-800"
          >
            <span className="h-2 w-2 rounded-full bg-green-500" />
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="warning"
            className="gap-1 bg-yellow-100 text-yellow-800"
          >
            <span className="h-2 w-2 rounded-full bg-yellow-500" />
            Pending
          </Badge>
        );
      case "expired":
        return (
          <Badge
            variant="destructive"
            className="gap-1 bg-red-100 text-red-800"
          >
            <span className="h-2 w-2 rounded-full bg-red-500" />
            Expired
          </Badge>
        );
      default:
        return (
          <Badge
            variant="secondary"
            className="gap-1 bg-blue-100 text-blue-800"
          >
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            {status}
          </Badge>
        );
    }
  };

  const toggleRow = (orderId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const getDeadlineStatus = (deadline: Date) => {
    if (isToday(deadline)) {
      return "Today";
    } else if (isTomorrow(deadline)) {
      return "Tomorrow";
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground">No orders found</div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Order Number</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Requester</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Done</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <TableRow
                className={cn(
                  isExpired(order.deadline) ? "bg-red-50" : "",
                  "cursor-pointer hover:bg-gray-50"
                )}
                onClick={() => toggleRow(order._id)}
              >
                <TableCell>
                  <ChevronRight
                    className={cn(
                      "h-4 w-4 transition-transform duration-200",
                      expandedRows.has(order._id) && "rotate-90"
                    )}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {order.orderNumber}
                </TableCell>
                <TableCell>{order.project}</TableCell>
                <TableCell>{order.requester}</TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {format(new Date(order.deadline), "MMM dd, yyyy")}
                    {isExpired(order.deadline) && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Order has expired</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {getDeadlineStatus(new Date(order.deadline)) && (
                      <Badge variant="outline" className="text-xs">
                        {getDeadlineStatus(new Date(order.deadline))}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <Checkbox
                            checked={order.done}
                            onCheckedChange={(checked) =>
                              handleDoneChange(order, checked as boolean)
                            }
                            disabled={
                              isExpired(order.deadline) &&
                              session?.user?.role !== "admin"
                            }
                          />
                        </div>
                      </TooltipTrigger>
                      {isExpired(order.deadline) &&
                        session?.user?.role !== "admin" && (
                          <TooltipContent>
                            Only admins can complete expired orders
                          </TooltipContent>
                        )}
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete the order.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(order._id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
              <AnimatePresence>
                {expandedRows.has(order._id) && (
                  <motion.tr
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <TableCell colSpan={8} className="p-4 bg-gray-50">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Order Details</h4>
                          <div className="space-y-1 text-sm">
                            <p>
                              <span className="text-muted-foreground">
                                Description:
                              </span>{" "}
                              {order.description}
                            </p>
                            <p>
                              <span className="text-muted-foreground">
                                Supplier:
                              </span>{" "}
                              {order.supplier}
                            </p>
                            <p>
                              <span className="text-muted-foreground">
                                PAM:
                              </span>{" "}
                              {order.pam}
                            </p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Timeline</h4>
                          <div className="space-y-1 text-sm">
                            <p>
                              <span className="text-muted-foreground">
                                Created:
                              </span>{" "}
                              {format(
                                new Date(order.createdAt),
                                "MMM dd, yyyy"
                              )}
                            </p>
                            <p>
                              <span className="text-muted-foreground">
                                Last Updated:
                              </span>{" "}
                              {format(
                                new Date(order.updatedAt),
                                "MMM dd, yyyy"
                              )}
                            </p>
                            {order.done && (
                              <p>
                                <span className="text-muted-foreground">
                                  Completed:
                                </span>{" "}
                                {format(
                                  new Date(order.updatedAt),
                                  "MMM dd, yyyy"
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </motion.tr>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
