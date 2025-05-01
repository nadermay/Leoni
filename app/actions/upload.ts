"use server";

import { uploadFile } from "@/lib/gridfs";

export async function uploadProfilePicture(formData: FormData, userId: string) {
  try {
    const file = formData.get("file") as File;

    if (!file) {
      return { error: "No file provided" };
    }

    // Upload to GridFS
    const { id, url } = await uploadFile(file, userId);

    // Return the URL of the uploaded file
    return { url };
  } catch (error) {
    console.error("Error uploading file:", error);
    return { error: "Failed to upload file. Please try again." };
  }
}
