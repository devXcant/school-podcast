"use client";

import type React from "react";
import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { Upload, File, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ICourse } from "../../types";

interface UploadFormProps {
  onUploadComplete: (file: File, metadata: any) => void;
  courses: ICourse[];
}

const UploadForm: React.FC<UploadFormProps> = ({
  onUploadComplete,
  courses,
}) => {
  const { data: session } = useSession();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      if (!file.type.startsWith("audio/")) {
        setError("Please select an audio file");
        return;
      }

      setSelectedFile(file);
      setError("");

      if (!title) {
        const filename = file.name.split(".").slice(0, -1).join(".");
        setTitle(filename);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];

      if (!file.type.startsWith("audio/")) {
        setError("Please select an audio file");
        return;
      }

      setSelectedFile(file);
      setError("");

      if (!title) {
        const filename = file.name.split(".").slice(0, -1).join(".");
        setTitle(filename);
      }
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      setError("Please select an audio file to upload");
      return;
    }

    if (!title) {
      setError("Please enter a title for the podcast");
      return;
    }

    if (!selectedCourse) {
      setError("Please select a course for the podcast");
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", title);
      formData.append("description", description);
      formData.append("course", selectedCourse);

      const response = await fetch("/api/podcasts/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.data && data.data.id) {
        toast.success("Podcast uploaded successfully");
        router.push(`/podcasts/${data.data.id}`);
      } else {
        toast.error(data.message || "Failed to upload podcast");
      }
    } catch (err) {
      console.error("Error during upload:", err);
      setError("Failed to upload file. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Podcast</CardTitle>
        <CardDescription>
          Upload an audio recording for your course
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              selectedFile
                ? "border-primary/50 bg-primary/5"
                : "border-muted hover:border-primary/50"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="audio/*"
              className="hidden"
              id="podcast-upload"
            />

            {selectedFile ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <File className="h-10 w-10 text-primary mr-3" />
                  <div className="text-left">
                    <p className="text-sm font-medium">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleRemoveFile}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <label htmlFor="podcast-upload" className="cursor-pointer block">
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm font-medium">
                  Click to upload or drag and drop
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  MP3, WAV, or M4A up to 500MB
                </p>
              </label>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="podcast-title">Podcast Title</Label>
            <Input
              id="podcast-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your podcast"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="podcast-course">Course</Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger id="podcast-course">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem
                    key={(course.id || course._id || "").toString()}
                    value={(course.id || course._id || "").toString()}
                  >
                    {course.code} - {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="podcast-description">Description (optional)</Label>
            <Textarea
              id="podcast-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description for your podcast"
              rows={3}
            />
          </div>

          <Button
            type="submit"
            disabled={
              !selectedFile || !title || !selectedCourse || isSubmitting
            }
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload Podcast"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UploadForm;
