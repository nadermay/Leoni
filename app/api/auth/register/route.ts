import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    // Check if user already exists
    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Create new user
    const user = await User.create({
      name: body.name,
      email: body.email,
      password: body.password,
      role: body.role || "user",
      status: "active",
      tasksAssigned: 0,
      tasksCompleted: 0,
      profilePicture: "/placeholder.svg?height=200&width=200",
    });

    // Return user without password
    const userWithoutPassword = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      tasksAssigned: user.tasksAssigned,
      tasksCompleted: user.tasksCompleted,
      profilePicture: user.profilePicture,
    };

    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
