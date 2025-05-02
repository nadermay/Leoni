import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    await connectDB();
    const orders = await Order.find({}).sort({ createdAt: -1 });
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

    const body = await request.json();
    await connectDB();

    // Log the incoming data for debugging
    console.log("Creating order with data:", body);

    // Get the current count of orders to generate the next order number
    const count = await Order.countDocuments();
    const orderNumber = `ORD${String(count + 1).padStart(4, "0")}`;

    // Create a new order with validated data
    const orderData = {
      ...body,
      orderNumber,
      status: body.status || "in-progress",
      process: body.process || "Testing",
      orderCreationDate: new Date(),
      deadline: new Date(body.deadline),
    };

    const order = await Order.create(orderData);
    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error("Error creating order:", error);

    // Return more detailed error information
    return NextResponse.json(
      {
        error: "Failed to create order",
        details: error.message,
        validationErrors: error.errors,
      },
      { status: 500 }
    );
  }
}
