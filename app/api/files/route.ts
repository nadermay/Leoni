import { NextResponse } from "next/server";
import { GridFSBucket, MongoClient } from "mongodb";

export async function GET(request: Request) {
  try {
    const client = await MongoClient.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/leoni"
    );
    const db = client.db();
    const bucket = new GridFSBucket(db);

    // Get the current user's ID and role from the request (e.g., from headers or session)
    const userId = request.headers.get("userId");
    const userRole = request.headers.get("userRole");

    // If the user is not an admin, filter files by userId
    const query = userRole === "admin" ? {} : { "metadata.userId": userId };

    // Get files from GridFS
    const files = await bucket.find(query).toArray();

    // Format the files data
    const formattedFiles = files.map((file) => ({
      id: file._id.toString(),
      filename: file.filename,
      contentType: file.contentType,
      uploadDate: file.uploadDate,
      length: file.length,
      metadata: file.metadata,
    }));

    return NextResponse.json(formattedFiles);
  } catch (error) {
    console.error("Error listing files:", error);
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}
