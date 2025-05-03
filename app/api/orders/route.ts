import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

async function generateOrderNumber() {
  const lastOrder = await Order.findOne({
    orderNumber: { $exists: true },
  }).sort({ orderNumber: -1 });

  return lastOrder
    ? `ORD${(parseInt(lastOrder.orderNumber.replace("ORD", "")) + 1)
        .toString()
        .padStart(4, "0")}`
    : "ORD0001"; // Initial number
}

export async function GET() {
  try {
    await connectDB();
    const orders = await Order.find().sort({ createdAt: -1 });
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();

    // Validate required fields
    const requiredFields = [
      "project",
      "requester",
      "description",
      "category",
      "deadline",
      "pam",
      "supplier",
      "requestFrame",
      "process",
    ];

    const missingFields = requiredFields.filter((field) => !body[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate process value
    const validProcesses = [
      "Testing",
      "Assemblage",
      "Connecting",
      "Cutting/WPA",
    ];
    if (!validProcesses.includes(body.process)) {
      return NextResponse.json(
        {
          error: `Invalid process. Must be one of: ${validProcesses.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Generate order number
    body.orderNumber = await generateOrderNumber();

    // Create new order
    const orderData = {
      ...body,
      deadline: new Date(body.deadline),
      totalPrice: body.totalPrice || 0,
      status: "in-progress",
      done: false,
      orderCreationDate: new Date(),
    };

    // Create the order
    const order = await Order.create(orderData);
    console.log("Order created successfully:", order);
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("Error creating order:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      return NextResponse.json(
        {
          error: "Validation error",
          details: Object.values(error.errors).map((err) => err.message),
        },
        { status: 400 }
      );
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Duplicate order number. Please try again." },
        { status: 400 }
      );
    }

    // Handle other errors
    return NextResponse.json(
      {
        error: "Failed to create order",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
