import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    // Find user by email
    const user = await User.findOne({ email: body.email });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check password
    if (user.password !== body.password) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.status !== "active") {
      return NextResponse.json(
        { error: "Account is inactive" },
        { status: 401 }
      );
    }

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

    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    console.error("Error logging in:", error);
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 });
  }
}
