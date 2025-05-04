"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileUploadTest } from "@/components/file-upload-test";
import { CategorizedFilesList } from "@/components/categorized-files-list";

export default function FilesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">File Management</h1>
        <p className="text-muted-foreground">
          Upload and manage files in the system
        </p>
      </div>

      <FileUploadTest />

      <CategorizedFilesList />
    </div>
  );
}
