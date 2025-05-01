import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "user"], default: "user" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    tasksAssigned: { type: Number, default: 0 },
    tasksCompleted: { type: Number, default: 0 },
    profilePicture: {
      type: String,
      default: "/placeholder.svg?height=200&width=200",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
