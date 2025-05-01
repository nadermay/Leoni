export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  status: "active" | "inactive";
  createdAt?: string;
  updatedAt?: string;
}
