import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    taskNumber: { type: Number, required: true, unique: true },
    segSce: { type: String, required: true },
    pdcaStage: { type: String, required: true },
    source: { type: String, required: true },
    processes: { type: String, required: true },
    action: { type: String, required: true },
    pilotes: { type: String, required: true },
    delaiRealisation: { type: String, required: true },
    avancement: { type: Number, required: true, min: 0, max: 100 },
    commentaires: { type: String, default: "" },
    status: {
      type: String,
      enum: ["completed", "in-progress", "overdue"],
      default: "in-progress",
    },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Create the model first
const Task = mongoose.models.Task || mongoose.model("Task", taskSchema);

// Add a pre-save middleware to set the taskNumber
taskSchema.pre("save", async function (next) {
  if (this.isNew) {
    try {
      // Find the highest task number
      const lastTask = await Task.findOne({}, {}, { sort: { taskNumber: -1 } });
      this.taskNumber = lastTask ? lastTask.taskNumber + 1 : 1;
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

export default Task;
