const mongoose = require("mongoose");
require("dotenv").config();

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/leoni";

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

const User = mongoose.models.User || mongoose.model("User", userSchema);

async function createAdminUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    const adminUser = {
      name: "Admin User",
      email: "admin@example.com",
      password: "admin123",
      role: "admin",
      status: "active",
      tasksAssigned: 0,
      tasksCompleted: 0,
      profilePicture: "/placeholder.svg?height=200&width=200",
    };

    const existingAdmin = await User.findOne({ email: adminUser.email });
    if (existingAdmin) {
      console.log("Admin user already exists");
      return;
    }

    const user = await User.create(adminUser);
    console.log("Admin user created successfully:", user);
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

createAdminUser();
