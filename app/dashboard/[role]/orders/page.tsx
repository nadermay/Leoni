import { Metadata } from "next";
import { OrderPage } from "@/components/orders/order-page";

export const metadata: Metadata = {
  title: "Orders",
  description: "Manage and track orders in the system",
};

interface OrdersPageProps {
  params: {
    role: string;
  };
}

export default function OrdersPage({ params }: OrdersPageProps) {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <OrderPage />
    </div>
  );
}
