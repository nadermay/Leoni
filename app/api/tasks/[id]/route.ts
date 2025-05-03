import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";
import { type NextApiRequest } from "next";

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/tasks/[id] - Get a single task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const { id } = await Promise.resolve(params);

    // Find the task
    const task = await Task.findById(id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}

// Helper function to determine task status
function determineTaskStatus(
  avancement: number,
  deadline: Date
): "completed" | "in-progress" | "overdue" {
  // Ensure we're working with Date objects
  const now = new Date();
  const deadlineDate = new Date(deadline);

  // Set times to start of day for fair comparison
  now.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);

  if (avancement === 100) {
    return "completed";
  }

  // Compare dates using getTime() for accurate comparison
  if (deadlineDate.getTime() < now.getTime()) {
    return "overdue";
  }

  return "in-progress";
}

// PATCH /api/tasks/[id] - Update a task
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const body = await request.json();
    const task = await Task.findById(params.id);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Update task fields
    Object.assign(task, body);

    // Recalculate status based on current avancement and deadline
    task.status = determineTaskStatus(task.avancement, task.delaiRealisation);

    // Save the updated task
    await task.save();

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const task = await Task.findByIdAndDelete(params.id);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
