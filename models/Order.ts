import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    project: {
      type: String,
      required: true,
    },
    requester: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["in-progress", "done"],
      default: "in-progress",
      required: true,
    },
    deadline: {
      type: Date,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },
    orderCreationDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    pam: {
      type: String,
      required: true,
    },
    supplier: {
      type: String,
      required: true,
    },
    requestFrame: {
      type: String,
      required: true,
    },
    process: {
      type: String,
      enum: ["Testing", "Assemblage", "Connecting", "Cutting/WPA"],
      default: "Testing",
      required: true,
    },
    done: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Generate order number before saving
orderSchema.pre("save", async function (next) {
  if (this.isNew) {
    const count = await mongoose.model("Order").countDocuments();
    this.orderNumber = `ORD${String(count + 1).padStart(4, "0")}`;
  }
  next();
});

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;
