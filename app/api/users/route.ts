import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Task from "@/models/Task";

// GET /api/users - Get all users or a single user by name
export async function GET(request: Request) {
  try {
    await connectDB();
    const url = new URL(request.url);
    const name = url.searchParams.get("name") || url.searchParams.get("id");

    if (name) {
      // Get single user
      const user = await User.findOne({ name }).select("-password");
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      return NextResponse.json(user);
    } else {
      // Get all users
      const users = await User.find().select("-password");
      return NextResponse.json(users);
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

// POST /api/users - Create a new user
export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    // Check if user with same email already exists
    const existingUser = await User.findOne({ email: body.email });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    const user = await User.create({
      ...body,
      password: "default123", // You should implement proper password handling
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}

// PATCH /api/users?id=... - Update a user
export async function PATCH(request: Request) {
  try {
    const url = new URL(request.url);
    const name = url.searchParams.get("name") || url.searchParams.get("id");

    if (!name) {
      return NextResponse.json(
        { error: "User name is required" },
        { status: 400 }
      );
    }

    await connectDB();
    const body = await request.json();

    // Check if email is being changed and already exists
    if (body.email) {
      const existingUser = await User.findOne({
        email: body.email,
        name: { $ne: name },
      });
      if (existingUser) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 400 }
        );
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { name },
      { $set: body },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// DELETE /api/users?id=... - Delete a user
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const name = url.searchParams.get("name") || url.searchParams.get("id");

    if (!name) {
      return NextResponse.json(
        { error: "User name is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the user first
    const user = await User.findOne({ name });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Delete all tasks assigned to the user
    await Task.deleteMany({ pilotes: name });

    // Delete the user
    const result = await User.findOneAndDelete({ name });
    if (!result) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "User and their tasks deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
