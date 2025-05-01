import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Task from "@/models/Task";

// GET /api/tasks - Get all tasks
export async function GET() {
  try {
    await connectDB();
    const tasks = await Task.find({}).sort({ _id: -1 });
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

    // Determine status based on avancement and deadline
    const status =
      body.avancement === 100
        ? "completed"
        : new Date(body.delaiRealisation) < new Date()
        ? "overdue"
        : "in-progress";

    // Create new task
    const task = await Task.create({
      segSce: body.segSce,
      pdcaStage: body.pdcaStage,
      source: body.source,
      processes: body.processes,
      action: body.action,
      pilotes: body.pilotes,
      delaiRealisation: body.delaiRealisation,
      avancement: body.avancement,
      commentaires: body.commentaires || "",
      status,
      createdAt: new Date(),
      taskNumber: 0, // Initialize with 0, the pre-save middleware will update it
    });

    console.log("Task created successfully:", task);
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    // Return more detailed error information
    return NextResponse.json(
      {
        error: "Failed to create task",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
