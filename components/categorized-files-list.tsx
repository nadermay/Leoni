"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileIcon,
  ImageIcon,
  FileTextIcon,
  FileAudioIcon,
  FileSpreadsheetIcon,
  Eye,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTaskContext } from "@/contexts/task-context";

interface StoredFile {
  id: string;
  filename: string;
  contentType: string;
  uploadDate: string;
  length: number;
  metadata: {
    originalName: string;
    size: number;
    uploadedAt: string;
  };
}

const FILE_CATEGORIES = {
  images: {
    title: "Images",
    icon: <ImageIcon className="h-5 w-5" />,
    accept: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  },
  documents: {
    title: "Documents",
    icon: <FileTextIcon className="h-5 w-5" />,
    accept: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },
  spreadsheets: {
    title: "Spreadsheets",
    icon: <FileSpreadsheetIcon className="h-5 w-5" />,
    accept: [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  },
  audio: {
    title: "Audio",
    icon: <FileAudioIcon className="h-5 w-5" />,
    accept: ["audio/mpeg", "audio/wav", "audio/ogg"],
  },
  other: {
    title: "Other Files",
    icon: <FileIcon className="h-5 w-5" />,
    accept: [],
  },
};

export function CategorizedFilesList() {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<StoredFile | null>(null);
  const { toast } = useToast();
  const { currentUser } = useTaskContext();

  const fetchFiles = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/files", {
        headers: {
          userId: currentUser?.id.toString() || "",
          userRole: currentUser?.role || "",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }
      const data = await response.json();
      setFiles(data);
    } catch (error) {
      console.error("Error fetching files:", error);
      toast({
        title: "Error",
        description: "Failed to fetch files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [currentUser]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getFileCategory = (contentType: string) => {
    for (const [category, info] of Object.entries(FILE_CATEGORIES)) {
      if (info.accept.includes(contentType)) {
        return category;
      }
    }
    return "other";
  };

  const categorizedFiles = files.reduce((acc, file) => {
    const category = getFileCategory(file.contentType);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(file);
    return acc;
  }, {} as Record<string, StoredFile[]>);

  const renderFilePreview = (file: StoredFile) => {
    if (file.contentType.startsWith("image/")) {
      return (
        <div className="relative w-16 h-16">
          <Image
            src={`/api/files/${file.id}`}
            alt={file.filename}
            fill
            className="object-cover rounded"
          />
        </div>
      );
    }
    return (
      <div className="w-16 h-16 flex items-center justify-center bg-muted rounded">
        {FILE_CATEGORIES[getFileCategory(file.contentType)].icon}
      </div>
    );
  };

  const renderPreviewContent = (file: StoredFile) => {
    if (file.contentType.startsWith("image/")) {
      return (
        <div className="relative w-full h-[400px]">
          <Image
            src={`/api/files/${file.id}`}
            alt={file.filename}
            fill
            className="object-contain"
          />
        </div>
      );
    } else if (file.contentType.startsWith("audio/")) {
      return (
        <div className="w-full flex items-center justify-center p-4">
          <audio controls className="w-full">
            <source src={`/api/files/${file.id}`} type={file.contentType} />
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    } else if (file.contentType === "application/pdf") {
      return (
        <div className="w-full h-[600px]">
          <iframe
            src={`/api/files/${file.id}`}
            className="w-full h-full"
            title={file.filename}
          />
        </div>
      );
    } else {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <FileIcon className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium">{file.metadata.originalName}</p>
          <p className="text-sm text-muted-foreground mt-2">
            Preview not available for this file type
          </p>
          <Button className="mt-4" asChild>
            <a href={`/api/files/${file.id}`} download>
              <Download className="mr-2 h-4 w-4" />
              Download File
            </a>
          </Button>
        </div>
      );
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Stored Files</CardTitle>
        <Button onClick={fetchFiles} disabled={isLoading}>
          {isLoading ? "Loading..." : "Refresh Files"}
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="images" className="space-y-4">
          <TabsList>
            {Object.entries(FILE_CATEGORIES).map(([key, { title, icon }]) => (
              <TabsTrigger
                key={key}
                value={key}
                className="flex items-center gap-2"
              >
                {icon}
                {title}
                <Badge variant="secondary" className="ml-2">
                  {categorizedFiles[key]?.length || 0}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(FILE_CATEGORIES).map(([category, { title }]) => (
            <TabsContent key={category} value={category}>
              <div className="rounded-md border">
                <div className="max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead>Preview</TableHead>
                        <TableHead>Filename</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Upload Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {!categorizedFiles[category]?.length ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <FileIcon className="h-8 w-8" />
                              <p>No {title.toLowerCase()} found</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        categorizedFiles[category]
                          .sort(
                            (a, b) =>
                              new Date(b.uploadDate).getTime() -
                              new Date(a.uploadDate).getTime()
                          )
                          .map((file) => (
                            <TableRow key={file.id}>
                              <TableCell>{renderFilePreview(file)}</TableCell>
                              <TableCell className="font-medium">
                                {file.metadata.originalName}
                              </TableCell>
                              <TableCell>{file.contentType}</TableCell>
                              <TableCell>
                                {formatFileSize(file.length)}
                              </TableCell>
                              <TableCell>
                                {formatDate(file.uploadDate)}
                              </TableCell>
                              <TableCell className="space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setPreviewFile(file)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={`/api/files/${file.id}`} download>
                                    <Download className="h-4 w-4" />
                                  </a>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>

      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{previewFile?.metadata.originalName}</DialogTitle>
          </DialogHeader>
          {previewFile && renderPreviewContent(previewFile)}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
