const mongoose = require("mongoose");
require("dotenv").config();
const bcrypt = require("bcryptjs");

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

    const password = "admin123"; // Admin password
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log("Hashed password created");

    const adminUser = {
      name: "Admin User",
      email: "admin@example.com",
      password: hashedPassword,
      role: "admin",
      status: "active",
      tasksAssigned: 0,
      tasksCompleted: 0,
      profilePicture: "/placeholder.svg?height=200&width=200",
    };

    // Delete existing admin user if it exists
    await User.deleteOne({ email: adminUser.email });
    console.log("Deleted existing admin user if any");

    const user = await User.create(adminUser);
    console.log("Admin user created successfully:", {
      ...user.toObject(),
      password: "********", // Don't log the actual password
    });

    // Verify the password can be compared
    const isValid = await bcrypt.compare(password, user.password);
    console.log("Password verification test:", isValid ? "Success" : "Failed");

    // Create a regular user as well
    const regularPassword = "user123";
    const regularHashedPassword = await bcrypt.hash(regularPassword, 12);

    const regularUser = {
      name: "Regular User",
      email: "user@example.com",
      password: regularHashedPassword,
      role: "user",
      status: "active",
      tasksAssigned: 0,
      tasksCompleted: 0,
      profilePicture: "/placeholder.svg?height=200&width=200",
    };

    await User.deleteOne({ email: regularUser.email });
    const regularUserCreated = await User.create(regularUser);
    console.log("Regular user created successfully");

    console.log("\nLogin credentials:");
    console.log("Admin account:");
    console.log("Email: admin@example.com");
    console.log("Password: admin123");
    console.log("\nRegular user account:");
    console.log("Email: user@example.com");
    console.log("Password: user123");
  } catch (error) {
    console.error("Error creating users:", error);
    if (error.code === 11000) {
      console.error("Duplicate email error. Please try a different email.");
    }
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

createAdminUser();
