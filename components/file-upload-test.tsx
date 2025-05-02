"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { uploadProfilePicture } from "@/app/actions/upload";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileIcon,
  ImageIcon,
  FileTextIcon,
  FileAudioIcon,
  FileSpreadsheetIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useTaskContext } from "@/contexts/task-context";

const FILE_CATEGORIES = {
  images: {
    title: "Images",
    icon: <ImageIcon className="h-5 w-5" />,
    accept: "image/*",
    maxSize: 5 * 1024 * 1024, // 5MB
  },
  documents: {
    title: "Documents",
    icon: <FileTextIcon className="h-5 w-5" />,
    accept: ".pdf,.doc,.docx",
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  spreadsheets: {
    title: "Spreadsheets",
    icon: <FileSpreadsheetIcon className="h-5 w-5" />,
    accept: ".xls,.xlsx,.csv",
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  audio: {
    title: "Audio",
    icon: <FileAudioIcon className="h-5 w-5" />,
    accept: ".mp3,.wav,.ogg",
    maxSize: 20 * 1024 * 1024, // 20MB
  },
};

export function FileUploadTest() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<keyof typeof FILE_CATEGORIES>("images");
  const { toast } = useToast();
  const { currentUser } = useTaskContext();

  if (!currentUser?.id && !currentUser?._id) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>File Upload</CardTitle>
          <CardDescription>Please log in to upload files</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const category = FILE_CATEGORIES[selectedCategory];

    try {
      setIsUploading(true);

      // Check file size
      if (file.size > category.maxSize) {
        toast({
          title: "File too large",
          description: `Please select a file smaller than ${
            category.maxSize / (1024 * 1024)
          }MB`,
          variant: "destructive",
        });
        return;
      }

      // Create a FormData object
      const formData = new FormData();
      formData.append("file", file);

      // Upload the file using either id or _id
      const userId = currentUser.id || currentUser._id;
      const result = await uploadProfilePicture(formData, userId.toString());

      if (result.error) {
        throw new Error(result.error);
      }

      if (!result.url) {
        throw new Error("Failed to get upload URL");
      }

      // Set the uploaded file URL
      setUploadedFile(result.url);

      toast({
        title: "File uploaded",
        description: "File has been uploaded successfully",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const renderFilePreview = (
    url: string,
    category: keyof typeof FILE_CATEGORIES
  ) => {
    switch (category) {
      case "images":
        return (
          <div className="relative w-48 h-48">
            <Image
              src={url}
              alt="Uploaded file"
              fill
              className="object-cover rounded-lg"
            />
          </div>
        );
      case "audio":
        return (
          <div className="w-48 h-48 flex items-center justify-center bg-muted rounded-lg">
            <audio controls className="w-full">
              <source src={url} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        );
      default:
        return (
          <div className="w-48 h-48 flex items-center justify-center bg-muted rounded-lg">
            <div className="flex flex-col items-center gap-2">
              {FILE_CATEGORIES[category].icon}
              <span className="text-sm text-muted-foreground">
                Preview not available
              </span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Tabs
        value={selectedCategory}
        onValueChange={(value) =>
          setSelectedCategory(value as keyof typeof FILE_CATEGORIES)
        }
      >
        <TabsList>
          {Object.entries(FILE_CATEGORIES).map(([key, { title, icon }]) => (
            <TabsTrigger
              key={key}
              value={key}
              className="flex items-center gap-2"
            >
              {icon}
              {title}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(FILE_CATEGORIES).map(
          ([category, { title, accept, maxSize }]) => (
            <TabsContent key={category} value={category}>
              <Card>
                <CardHeader>
                  <CardTitle>Upload {title}</CardTitle>
                  <CardDescription>
                    Maximum file size: {maxSize / (1024 * 1024)}MB
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept={accept}
                      onChange={handleFileChange}
                      disabled={isUploading}
                      className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary file:text-primary-foreground
                      hover:file:bg-primary/90"
                    />

                    {isUploading && (
                      <p className="text-sm text-muted-foreground">
                        Uploading...
                      </p>
                    )}
                  </div>

                  {uploadedFile && (
                    <div className="space-y-2">
                      <h3 className="font-medium">Uploaded File:</h3>
                      {renderFilePreview(
                        uploadedFile,
                        category as keyof typeof FILE_CATEGORIES
                      )}
                      <p className="text-sm text-muted-foreground break-all">
                        URL: {uploadedFile}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )
        )}
      </Tabs>
    </div>
  );
}
