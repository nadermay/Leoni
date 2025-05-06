"use client";

import { PerformanceDashboard } from "@/components/performance-dashboard";
import { OrderProvider } from "@/contexts/order-context";

export default function PerformancePage() {
  return (
    <OrderProvider>
      <PerformanceDashboard isAdmin={true} />
    </OrderProvider>
  );
}
