"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { useToast } from "@/hooks/use-toast";

export interface Order {
  _id: string;
  orderNumber: string;
  project: string;
  requester: string;
  description: string;
  category: string;
  status: "in-progress" | "done";
  deadline: Date;
  totalPrice: number;
  orderCreationDate: Date;
  pam: string;
  supplier: string;
  requestFrame: string;
  process: "Testing" | "Assemblage" | "Connecting" | "Cutting/WPA";
  done: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderContextType {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  fetchOrders: () => Promise<void>;
  getOrderStats: () => {
    total: number;
    completed: number;
    inProgress: number;
    byProcess: Record<string, number>;
    bySupplier: Record<string, number>;
    totalValue: number;
  };
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch("/api/orders");
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch orders";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getOrderStats = useCallback(() => {
    const stats = {
      total: orders.length,
      completed: orders.filter((order) => order.done).length,
      inProgress: orders.filter((order) => !order.done).length,
      byProcess: {} as Record<string, number>,
      bySupplier: {} as Record<string, number>,
      totalValue: orders.reduce(
        (sum, order) => sum + (order.totalPrice || 0),
        0
      ),
    };

    // Calculate process distribution
    orders.forEach((order) => {
      stats.byProcess[order.process] =
        (stats.byProcess[order.process] || 0) + 1;
    });

    // Calculate supplier distribution
    orders.forEach((order) => {
      stats.bySupplier[order.supplier] =
        (stats.bySupplier[order.supplier] || 0) + 1;
    });

    return stats;
  }, [orders]);

  // Initial fetch
  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <OrderContext.Provider
      value={{
        orders,
        isLoading,
        error,
        fetchOrders,
        getOrderStats,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const context = useContext(OrderContext);
  if (context === undefined) {
    throw new Error("useOrders must be used within an OrderProvider");
  }
  return context;
}
