export interface Order {
  _id: string;
  orderNumber: string;
  project: string;
  requester: string;
  description: string;
  category: string;
  status: "pending" | "in-progress" | "completed" | "cancelled";
  deadline: Date;
  done: boolean;
  createdAt: Date;
  updatedAt: Date;
}
