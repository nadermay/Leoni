import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    console.log("Login attempt for email:", body.email);

    // Find user by email
    const user = await User.findOne({ email: body.email });
    console.log("User found:", user ? "Yes" : "No");

    if (!user) {
      console.log("User not found");
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Compare hashed password
    console.log("Comparing passwords...");
    const isPasswordValid = await bcrypt.compare(body.password, user.password);
    console.log("Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      console.log("Invalid password");
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.status !== "active") {
      console.log("User account is inactive");
      return NextResponse.json(
        { error: "Account is inactive" },
        { status: 401 }
      );
    }

    // Return user without password
    const { password, ...userWithoutPassword } = user.toObject();
    // Add id field explicitly
    userWithoutPassword.id = userWithoutPassword._id;
    console.log("Login successful for user:", userWithoutPassword.email);
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Error logging in:", error);
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 });
  }
}
