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

async function createMongoAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB successfully");

    // Create admin user
    const adminPassword = "admin123";
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const adminUser = {
      name: "Mongo Admin",
      email: "mongo@admin.com",
      password: hashedPassword,
      role: "admin",
      status: "active",
      tasksAssigned: 0,
      tasksCompleted: 0,
      profilePicture: "/placeholder.svg?height=200&width=200",
    };

    // Delete existing admin if exists
    await User.deleteOne({ email: adminUser.email });
    console.log("Cleaned up existing admin user if any");

    // Create new admin user
    const user = await User.create(adminUser);
    console.log("Mongo Admin user created successfully!");

    // Verify the password can be compared
    const isValid = await bcrypt.compare(adminPassword, user.password);
    console.log("Password verification test:", isValid ? "Success" : "Failed");

    console.log("\nMongo Admin Login Credentials:");
    console.log("Email: mongo@admin.com");
    console.log("Password: admin123");
  } catch (error) {
    console.error("Error creating admin user:", error);
    if (error.code === 11000) {
      console.error("Duplicate email error. Please try a different email.");
    }
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

createMongoAdmin();
