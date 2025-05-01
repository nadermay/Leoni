import { z } from "zod";

export const userFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "user"]).default("user"),
  status: z.enum(["active", "inactive"]).default("active"),
  profilePicture: z.string().optional(),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
