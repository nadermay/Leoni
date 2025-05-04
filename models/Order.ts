import mongoose, { Schema, Document } from "mongoose";

// Counter schema for auto-incrementing order numbers
const counterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

// Create or get the Counter model
const Counter =
  mongoose.models.Counter || mongoose.model("Counter", counterSchema);

// Function to get the next sequence
async function getNextSequence(name: string): Promise<number> {
  try {
    const counter = await Counter.findByIdAndUpdate(
      name,
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    return counter.seq;
  } catch (error) {
    console.error("Error in getNextSequence:", error);
    throw error;
  }
}

// Order interface
export interface IOrder extends Document {
  orderNumber: string;
  project: string;
  requester: string;
  description: string;
  category: string;
  status: "in-progress" | "done";
  deadline: Date;
  totalPrice: number;
  orderCreationDate: Date;
  pam: string;
  supplier: string;
  requestFrame: string;
  process: string;
  done: boolean;
}

// Order schema
const orderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    project: { type: String, required: true },
    requester: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    status: {
      type: String,
      enum: ["in-progress", "done"],
      default: "in-progress",
      required: true,
    },
    deadline: { type: Date, required: true },
    totalPrice: { type: Number, required: true, default: 0 },
    orderCreationDate: { type: Date, required: true, default: Date.now },
    pam: { type: String, required: true },
    supplier: { type: String, required: true },
    requestFrame: { type: String, required: true },
    process: {
      type: String,
      enum: ["Testing", "Assemblage", "Connecting", "Cutting/WPA"],
      default: "Testing",
      required: true,
    },
    done: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

// Create or get the model
const Order =
  mongoose.models.Order || mongoose.model<IOrder>("Order", orderSchema);

export default Order;
