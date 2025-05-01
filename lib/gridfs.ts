import { GridFSBucket, MongoClient, ObjectId } from "mongodb";
import { Readable } from "stream";

let bucket: GridFSBucket;

export async function initGridFS() {
  const client = await MongoClient.connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/leoni"
  );
  const db = client.db();
  bucket = new GridFSBucket(db);
  return bucket;
}

export async function uploadFile(
  file: File,
  userId: string
): Promise<{ id: string; url: string }> {
  if (!bucket) {
    await initGridFS();
  }

  const buffer = await file.arrayBuffer();
  const stream = Readable.from(Buffer.from(buffer));

  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const filename = `${timestamp}-${randomString}-${file.name}`;

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: file.type,
      metadata: {
        originalName: file.name,
        size: file.size,
        uploadedAt: new Date(),
        userId: userId,
      },
    });

    stream
      .pipe(uploadStream)
      .on("error", (error) => {
        reject(error);
      })
      .on("finish", () => {
        const fileId = uploadStream.id.toString();
        resolve({
          id: fileId,
          url: `/api/files/${fileId}`,
        });
      });
  });
}

export async function getFile(
  id: string
): Promise<{ stream: Readable; contentType: string }> {
  if (!bucket) {
    await initGridFS();
  }

  try {
    const objectId = new ObjectId(id);
    const file = await bucket.find({ _id: objectId }).next();

    if (!file) {
      throw new Error("File not found");
    }

    const stream = bucket.openDownloadStream(objectId);
    return {
      stream,
      contentType: file.contentType || "application/octet-stream",
    };
  } catch (error) {
    console.error("Error getting file:", error);
    throw new Error("Invalid file ID or file not found");
  }
}
