import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";

async function generateTaskNumber() {
  const lastTask = await Task.findOne().sort({ taskNumber: -1 });
  return lastTask ? lastTask.taskNumber + 1 : 1;
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

// GET /api/tasks - Get all tasks
export async function GET() {
  try {
    await connectDB();
    const tasks = await Task.find().sort({ createdAt: -1 });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();

    console.log("Received task data:", body);

    // Validate required fields
    const requiredFields = [
      "segSce",
      "pdcaStage",
      "source",
      "processes",
      "action",
      "pilotes",
      "delaiRealisation",
      "avancement",
    ];
    const missingFields = requiredFields.filter((field) => {
      // Special handling for avancement since 0 is a valid value
      if (field === "avancement") {
        return body[field] === undefined || body[field] === null;
      }
      return !body[field];
    });

    if (missingFields.length > 0) {
      console.error("Missing required fields:", missingFields);
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate avancement
    if (body.avancement < 0 || body.avancement > 100) {
      console.error("Invalid avancement value:", body.avancement);
      return NextResponse.json(
        { error: "Avancement must be between 0 and 100" },
        { status: 400 }
      );
    }

    // Generate the next task number
    body.taskNumber = await generateTaskNumber();

    // Parse deadline date
    const deadline = new Date(body.delaiRealisation);
    if (isNaN(deadline.getTime())) {
      return NextResponse.json(
        { error: "Invalid deadline date format" },
        { status: 400 }
      );
    }

    // Set status based on avancement and deadline
    body.status = determineTaskStatus(body.avancement, deadline);

    // Create new task
    const task = await Task.create({
      ...body,
      delaiRealisation: deadline,
      createdAt: new Date(),
    });

    console.log("Task created successfully:", task);
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Duplicate task number. Please try again." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
