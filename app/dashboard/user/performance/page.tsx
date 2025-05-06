"use client";

import { PerformanceDashboard } from "@/components/performance-dashboard";
import { OrderProvider } from "@/contexts/order-context";

export default function UserPerformancePage() {
  return (
    <OrderProvider>
      <PerformanceDashboard isAdmin={false} />
    </OrderProvider>
  );
}
