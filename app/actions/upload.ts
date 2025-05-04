"use server";

import { uploadFile } from "@/lib/gridfs";

interface UploadResponse {
  url?: string;
  error?: string;
}

export async function uploadProfilePicture(
  formData: FormData,
  userId: string
): Promise<UploadResponse> {
  if (!userId) {
    return { error: "User ID is required" };
  }

  try {
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return { error: "No valid file provided" };
    }

    // Upload to GridFS
    const { id, url } = await uploadFile(file, userId);

    if (!url) {
      return { error: "Failed to get upload URL" };
    }

    // Return the URL of the uploaded file
    return { url };
  } catch (error) {
    console.error("Error uploading file:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Failed to upload file. Please try again.",
    };
  }
}
