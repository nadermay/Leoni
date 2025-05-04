import mongoose, { Schema, Document } from "mongoose";

// Counter schema for auto-incrementing task numbers
const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const Counter =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);

// Initialize counter if it doesn't exist
async function initializeCounter() {
  const counter = await Counter.findById("taskNumber");
  if (!counter) {
    await Counter.create({ _id: "taskNumber", seq: 0 });
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

// Task interface
export interface ITask extends Document {
  taskNumber: number;
  segSce: string;
  pdcaStage: string;
  source: string;
  processes: string;
  action: string;
  pilotes: string;
  delaiRealisation: Date;
  avancement: number;
  commentaires?: string;
  status: "completed" | "in-progress" | "overdue";
  createdAt: Date;
}

// Task schema
const taskSchema = new Schema<ITask>({
  taskNumber: { type: Number, unique: true, required: true },
  segSce: { type: String, required: true },
  pdcaStage: { type: String, required: true },
  source: { type: String, required: true },
  processes: { type: String, required: true },
  action: { type: String, required: true },
  pilotes: { type: String, required: true },
  delaiRealisation: { type: Date, required: true },
  avancement: { type: Number, required: true, min: 0, max: 100 },
  commentaires: { type: String },
  status: {
    type: String,
    enum: ["completed", "in-progress", "overdue"],
    default: "in-progress",
  },
  createdAt: { type: Date, default: Date.now },
});

// Pre-save middleware to auto-increment task number and update status
taskSchema.pre("save", async function (next) {
  try {
    // Handle task number for new tasks
    if (this.isNew) {
      await initializeCounter();
      const counter = await Counter.findByIdAndUpdate(
        "taskNumber",
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.taskNumber = counter.seq;
    }

    // Always update status based on current avancement and deadline
    this.status = determineTaskStatus(this.avancement, this.delaiRealisation);

    next();
  } catch (error) {
    next(error);
  }
});

// Create or get the model
const Task = mongoose.models.Task || mongoose.model<ITask>("Task", taskSchema);

export default Task;
